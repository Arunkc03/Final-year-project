<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Exception;

/**
 * KhaltiService
 * Handles Khalti payment gateway integration
 * 
 * Khalti ePayment API v2.0
 * Documentation: https://docs.khalti.com/
 */
class KhaltiService
{
    protected string $secretKey;
    protected string $publicKey;
    protected string $baseUrl;
    protected string $returnUrl;
    protected string $websiteUrl;

    public function __construct()
    {
        $this->secretKey = config('services.khalti.secret_key') ?? '';
        $this->publicKey = config('services.khalti.public_key') ?? '';
        $this->baseUrl = config('services.khalti.base_url') ?? 'https://a.khalti.com/api/v2';
        $this->returnUrl = config('services.khalti.return_url') ?? '/payment/verify';
        $this->websiteUrl = config('services.khalti.website_url') ?? 'http://localhost:5173';
        
        // Validate required configuration
        if (empty($this->secretKey)) {
            throw new Exception('Khalti secret key is not configured. Please set KHALTI_SECRET_KEY in .env');
        }
        if (empty($this->publicKey)) {
            throw new Exception('Khalti public key is not configured. Please set KHALTI_PUBLIC_KEY in .env');
        }
    }

    /**
     * Initiate a Khalti payment
     * 
     * @param array $payload Payment details
     * @return array Response with payment URL or error
     */
    public function initiatePayment(array $payload): array
    {
        try {
            // Validate required fields
            $requiredFields = ['return_url', 'website_url', 'amount', 'purchase_order_id', 'purchase_order_name'];
            foreach ($requiredFields as $field) {
                if (!isset($payload[$field])) {
                    throw new Exception("Missing required field: {$field}");
                }
            }

            // Amount must be in paisa (1 NPR = 100 paisa)
            // Minimum 10 NPR (1000 paisa), Maximum 200,000 NPR (20,000,000 paisa)
            if ($payload['amount'] < 1000) {
                throw new Exception('Minimum payment amount is 10 NPR (1000 paisa)');
            }

            if ($payload['amount'] > 20000000) {
                throw new Exception('Maximum payment amount is 200,000 NPR (20,000,000 paisa)');
            }

            $response = Http::withHeaders([
                'Authorization' => 'Key ' . $this->secretKey,
                'Content-Type' => 'application/json',
            ])->post($this->baseUrl . '/epayment/initiate/', $payload);

            if ($response->successful()) {
                $data = $response->json();
                Log::info('Khalti payment initiated successfully', [
                    'pidx' => $data['pidx'] ?? null,
                    'purchase_order_id' => $payload['purchase_order_id'],
                ]);
                
                return [
                    'success' => true,
                    'data' => $data,
                ];
            }

            $errorData = $response->json();
            Log::error('Khalti payment initiation failed', [
                'status' => $response->status(),
                'error' => $errorData,
            ]);

            return [
                'success' => false,
                'message' => $errorData['detail'] ?? $errorData['message'] ?? 'Payment initiation failed',
                'errors' => $errorData,
            ];

        } catch (Exception $e) {
            Log::error('Khalti payment error', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return [
                'success' => false,
                'message' => $e->getMessage(),
            ];
        }
    }

    /**
     * Verify/Lookup a Khalti payment
     * 
     * @param string $pidx Payment Index from Khalti
     * @return array Verification result
     */
    public function verifyPayment(string $pidx): array
    {
        try {
            $response = Http::withHeaders([
                'Authorization' => 'Key ' . $this->secretKey,
                'Content-Type' => 'application/json',
            ])->post($this->baseUrl . '/epayment/lookup/', [
                'pidx' => $pidx,
            ]);

            if ($response->successful()) {
                $data = $response->json();
                
                Log::info('Khalti payment lookup', [
                    'pidx' => $pidx,
                    'status' => $data['status'] ?? 'unknown',
                ]);

                return [
                    'success' => true,
                    'data' => $data,
                    'is_completed' => ($data['status'] ?? '') === 'Completed',
                ];
            }

            $errorData = $response->json();
            Log::error('Khalti payment verification failed', [
                'pidx' => $pidx,
                'error' => $errorData,
            ]);

            return [
                'success' => false,
                'message' => $errorData['detail'] ?? 'Payment verification failed',
                'errors' => $errorData,
            ];

        } catch (Exception $e) {
            Log::error('Khalti verification error', [
                'pidx' => $pidx,
                'message' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => $e->getMessage(),
            ];
        }
    }

    /**
     * Get payment status description
     * 
     * @param string $status Khalti status code
     * @return string Human-readable status
     */
    public function getStatusDescription(string $status): string
    {
        $statuses = [
            'Completed' => 'Payment completed successfully',
            'Pending' => 'Payment is pending',
            'Initiated' => 'Payment has been initiated',
            'Refunded' => 'Payment has been refunded',
            'Expired' => 'Payment request has expired',
            'User canceled' => 'User canceled the payment',
        ];

        return $statuses[$status] ?? 'Unknown status';
    }

    /**
     * Convert amount to paisa (Khalti uses paisa)
     * 
     * @param mixed $amount Amount in NPR
     * @return int Amount in paisa
     */
    public static function toPaisa($amount): int
    {
        return (int) round((float) $amount * 100);
    }

    /**
     * Convert paisa to NPR
     * 
     * @param mixed $paisa Amount in paisa
     * @return float Amount in NPR
     */
    public static function toNPR($paisa): float
    {
        return (float) $paisa / 100;
    }

    /**
     * Get config for frontend
     * 
     * @return array Public configuration
     */
    public function getPublicConfig(): array
    {
        return [
            'public_key' => $this->publicKey,
            'return_url' => $this->websiteUrl . $this->returnUrl,
            'website_url' => $this->websiteUrl,
        ];
    }

    /**
     * Build payment payload for appointment
     * 
     * @param \App\Models\Payment $payment
     * @param \App\Models\Appointment $appointment
     * @return array
     */
    public function buildPaymentPayload($payment, $appointment): array
    {
        return [
            'return_url' => $this->websiteUrl . $this->returnUrl,
            'website_url' => $this->websiteUrl,
            'amount' => self::toPaisa($payment->amount),
            'purchase_order_id' => 'APT-' . $appointment->id . '-PAY-' . $payment->id,
            'purchase_order_name' => 'Appointment Payment #' . $appointment->id,
            'customer_info' => [
                'name' => $payment->user->name ?? 'Patient',
                'email' => $payment->user->email ?? '',
                'phone' => $payment->user->phone ?? '',
            ],
            'amount_breakdown' => [
                [
                    'label' => 'Consultation Fee',
                    'amount' => self::toPaisa($payment->amount),
                ],
            ],
            'product_details' => [
                [
                    'identity' => 'apt_' . $appointment->id,
                    'name' => 'Medical Appointment',
                    'total_price' => self::toPaisa($payment->amount),
                    'quantity' => 1,
                    'unit_price' => self::toPaisa($payment->amount),
                ],
            ],
        ];
    }
}
