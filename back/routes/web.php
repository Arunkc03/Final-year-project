<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

// Test Khalti connectivity
Route::get('/test-khalti', function () {
    try {
        $khaltiService = new \App\Services\KhaltiService();
        
        // Test with minimal payload
        $testPayload = [
            'return_url' => 'http://localhost:5173/payment/verify',
            'website_url' => 'http://localhost:5173',
            'amount' => 19800, // 198 NPR in paisa
            'purchase_order_id' => 'TEST-' . time(),
            'purchase_order_name' => 'Test Payment',
            'customer_info' => [
                'name' => 'Test User',
                'email' => 'test@example.com',
            ],
        ];
        
        $result = $khaltiService->initiatePayment($testPayload);
        
        return response()->json([
            'status' => 'test_completed',
            'khalti_result' => $result,
            'test_payload' => $testPayload,
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'status' => 'error',
            'message' => $e->getMessage(),
            'trace' => $e->getTraceAsString(),
        ], 500);
    }
});

Route::get('/test-env', function () {
    return response()->json([
        'khalti_secret_key' => substr(env('KHALTI_SECRET_KEY', ''), 0, 10) . '...',
        'khalti_public_key' => substr(env('KHALTI_PUBLIC_KEY', ''), 0, 10) . '...',
        'khalti_base_url' => env('KHALTI_BASE_URL'),
        'khalti_return_url' => env('KHALTI_RETURN_URL'),
        'khalti_website_url' => env('KHALTI_WEBSITE_URL'),
        'app_debug' => env('APP_DEBUG'),
    ]);
});
