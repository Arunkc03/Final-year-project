<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GeminiService
{
    private $apiKey;
    private $model;
    private $baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models';

    public function __construct()
    {
        $this->apiKey = config('ai.gemini.api_key') ?? env('GEMINI_API_KEY');
        $this->model = config('ai.gemini.model') ?? env('GEMINI_MODEL', 'gemini-pro');
    }

    /**
     * Generate doctor recommendations using Gemini AI
     */
    public function generateDoctorRecommendations($patientData): array
    {
        try {
            $prompt = $this->buildRecommendationPrompt($patientData);
            $response = $this->callGeminiAPI($prompt);

            return $this->parseDoctorRecommendations($response);
        } catch (\Exception $e) {
            Log::error('Gemini AI Error: ' . $e->getMessage());
            return [];
        }
    }

    /**
     * Recommend specialty based on symptoms
     */
    public function recommendSpecialty($symptoms): string
    {
        try {
            $symptomsText = is_array($symptoms) ? implode(', ', $symptoms) : $symptoms;
            $prompt = "Based on these symptoms: '{$symptomsText}', recommend ONE medical specialty. ";
            $prompt .= "Respond with only the specialty name (e.g., Cardiology, Pediatrics, Dermatology).";

            $response = $this->callGeminiAPI($prompt);
            return trim($response);
        } catch (\Exception $e) {
            Log::error('Gemini Specialty Recommendation Error: ' . $e->getMessage());
            return 'General Practice';
        }
    }

    /**
     * Get health insights from patient data
     */
    public function getHealthInsights($medicalHistory): string
    {
        try {
            $prompt = "Provide a brief health insight based on this medical history: " . json_encode($medicalHistory);
            $prompt .= " Keep response to 2-3 sentences.";

            return $this->callGeminiAPI($prompt);
        } catch (\Exception $e) {
            Log::error('Gemini Health Insights Error: ' . $e->getMessage());
            return 'Keep regular checkups and maintain a healthy lifestyle.';
        }
    }

    /**
     * Call Gemini API
     */
    private function callGeminiAPI($prompt)
    {
        if (!$this->apiKey) {
            throw new \Exception('Gemini API key not configured');
        }

        $url = "{$this->baseUrl}/{$this->model}:generateContent?key={$this->apiKey}";

        $response = Http::timeout(30)->post($url, [
            'contents' => [
                [
                    'parts' => [
                        [
                            'text' => $prompt,
                        ],
                    ],
                ],
            ],
            'generationConfig' => [
                'temperature' => 0.7,
                'topK' => 40,
                'topP' => 0.95,
                'maxOutputTokens' => 1024,
            ],
        ]);

        if (!$response->successful()) {
            throw new \Exception("Gemini API Error: " . $response->body());
        }

        $data = $response->json();
        
        if (isset($data['candidates'][0]['content']['parts'][0]['text'])) {
            return $data['candidates'][0]['content']['parts'][0]['text'];
        }

        throw new \Exception('Invalid Gemini API Response');
    }

    /**
     * Build recommendation prompt for Gemini
     */
    private function buildRecommendationPrompt($patientData): string
    {
        $recentAppointments = $patientData['recent_appointments'] ?? [];
        $medicalReports = $patientData['medical_reports'] ?? [];
        $availableDoctors = $patientData['available_doctors'] ?? [];

        $appointmentText = !empty($recentAppointments) 
            ? "Recent appointments: " . implode(', ', $recentAppointments)
            : "No recent appointments.";

        $reportText = !empty($medicalReports)
            ? "Medical reports: " . implode(', ', $medicalReports)
            : "No medical reports.";

        $doctorsList = !empty($availableDoctors)
            ? "Available doctors: " . json_encode($availableDoctors)
            : "[]";

        $prompt = <<<EOT
You are a medical AI assistant. Based on the following patient data, recommend the best 3-4 doctors.

Patient Data:
$appointmentText
$reportText

Available Doctors:
$doctorsList

Return ONLY a JSON array with this structure (no other text):
[
  {
    "doctor_name": "Dr. Name",
    "specialty": "Specialty",
    "reason": "Brief reason why recommended",
    "match_score": 85
  }
]

Ensure each object has: doctor_name, specialty, reason, and match_score (0-95).
EOT;

        return $prompt;
    }

    /**
     * Parse Gemini response for doctor recommendations
     */
    private function parseDoctorRecommendations($response): array
    {
        try {
            // Extract JSON from response
            preg_match('/\[.*\]/s', $response, $matches);
            if (empty($matches[0])) {
                Log::warning('No JSON found in Gemini response: ' . $response);
                return [];
            }

            $decoded = json_decode($matches[0], true);
            if (!is_array($decoded)) {
                Log::warning('Invalid JSON in Gemini response: ' . $matches[0]);
                return [];
            }

            // Validate and clean response
            $recommendations = [];
            foreach ($decoded as $rec) {
                if (isset($rec['doctor_name'], $rec['specialty'], $rec['reason'], $rec['match_score'])) {
                    $recommendations[] = [
                        'doctor_name' => $rec['doctor_name'],
                        'specialty' => $rec['specialty'],
                        'reason' => $rec['reason'],
                        'match_score' => (int)$rec['match_score'],
                    ];
                }
            }

            return $recommendations;
        } catch (\Exception $e) {
            Log::error('Error parsing Gemini recommendations: ' . $e->getMessage());
            return [];
        }
    }
}
