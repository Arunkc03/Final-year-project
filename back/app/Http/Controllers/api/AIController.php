<?php

namespace App\Http\Controllers\api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Appointment;
use App\Models\Report;
use App\Services\GeminiService;

class AIController extends Controller
{
    private $geminiService;

    public function __construct(GeminiService $geminiService)
    {
        $this->geminiService = $geminiService;
    }

    /**
     * Get AI-powered doctor recommendations based on patient's medical history
     */
    public function getDoctorRecommendations(Request $request)
    {
        $user = auth()->user();

        if (!$user || $user->role !== 'patient') {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized access',
            ], 403);
        }

        try {
            // Gather patient data
            $patientData = $this->gatherPatientData($user);

            // Get AI recommendations from Gemini
            $geminiRecommendations = $this->geminiService->generateDoctorRecommendations($patientData);

            // Enhance recommendations with actual doctor data
            $recommendations = $this->enrichRecommendations($geminiRecommendations, $patientData['available_doctors_data'] ?? []);

            return response()->json([
                'status' => 'success',
                'message' => 'AI-powered doctor recommendations generated',
                'data' => $recommendations,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to generate recommendations: ' . $e->getMessage(),
                'data' => [],
            ], 500);
        }
    }

    /**
     * Get specialty recommendation based on symptoms
     */
    public function getSpecialtyRecommendation(Request $request)
    {
        $request->validate([
            'symptoms' => 'required|array|min:1',
            'symptoms.*' => 'string',
        ]);

        try {
            $symptoms = $request->input('symptoms');
            $specialty = $this->geminiService->recommendSpecialty($symptoms);

            return response()->json([
                'status' => 'success',
                'message' => 'Specialty recommendation generated',
                'recommended_specialty' => $specialty,
                'data' => [
                    'specialty' => $specialty,
                    'symptoms_analyzed' => count($symptoms),
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to recommend specialty',
                'recommended_specialty' => 'General Practice',
            ], 500);
        }
    }

    /**
     * Get similar patients based on symptom
     */
    public function getSimilarPatients(Request $request)
    {
        $request->validate([
            'symptom' => 'required|string|min:2',
        ]);

        try {
            $symptom = $request->input('symptom');
            $patients = $this->findSimilarPatients($symptom);

            return response()->json([
                'status' => 'success',
                'message' => 'Similar patients found',
                'data' => $patients,
                'count' => count($patients),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to find similar patients',
                'data' => [],
            ], 500);
        }
    }

    /**
     * Gather all patient medical data for AI analysis
     */
    private function gatherPatientData($user): array
    {
        // Get recent appointments
        $recentAppointments = Appointment::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->with('doctor', 'hospital')
            ->get();

        $appointmentTexts = $recentAppointments->map(function ($apt) {
            $doctorName = $apt->doctor?->name ?? 'Unknown Doctor';
            $doctorSpec = $apt->doctor?->specialization ?? 'General';
            $hospitalName = $apt->hospital?->name ?? 'Unknown Hospital';
            return "Visited {$doctorName} ({$doctorSpec}) at {$hospitalName}";
        })->toArray();

        // Get medical reports
        $medicalReports = Report::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get();

        $reportTexts = $medicalReports->map(function ($report) {
            return "{$report->report_type}: {$report->description}";
        })->toArray();

        // Get available doctors with their data
        $availableDoctors = User::where('role', 'doctor')
            ->where('status', 'active')
            ->with('hospital')
            ->limit(10)
            ->get();

        $doctorsData = $availableDoctors->map(function ($doctor) {
            return [
                'id' => $doctor->id,
                'name' => $doctor->name,
                'specialization' => $doctor->specialization ?? 'General Practice',
                'hospital' => $doctor->hospital?->name ?? 'Unknown Hospital',
                'image' => $doctor->image,
            ];
        })->toArray();

        return [
            'recent_appointments' => $appointmentTexts,
            'medical_reports' => $reportTexts,
            'available_doctors' => array_map(function ($doc) {
                return "{$doc['name']} ({$doc['specialization']}) - {$doc['hospital']}";
            }, $doctorsData),
            'available_doctors_data' => $doctorsData,
            'patient_age' => $user->age,
            'patient_gender' => $user->gender,
        ];
    }

    /**
     * Enrich AI recommendations with actual doctor data
     */
    private function enrichRecommendations(array $geminiRecs, array $availableDoctorsData): array
    {
        $enriched = [];

        foreach ($geminiRecs as $rec) {
            // Try to find matching doctor by name or specialty
            $matchedDoctor = null;
            
            foreach ($availableDoctorsData as $doctor) {
                if (stripos($doctor['name'], $rec['doctor_name']) !== false || 
                    stripos($doctor['specialization'], $rec['specialty']) !== false) {
                    $matchedDoctor = $doctor;
                    break;
                }
            }

            // If no exact match found, pick a random doctor with matching specialty
            if (!$matchedDoctor && !empty($availableDoctorsData)) {
                $specialtyMatches = array_filter($availableDoctorsData, function ($doc) use ($rec) {
                    return stripos($doc['specialization'], $rec['specialty']) !== false;
                });
                $matchedDoctor = !empty($specialtyMatches) ? array_values($specialtyMatches)[0] : $availableDoctorsData[0];
            }

            if ($matchedDoctor) {
                $enriched[] = [
                    'doctor' => [
                        'id' => $matchedDoctor['id'],
                        'name' => $matchedDoctor['name'],
                        'specialization' => $matchedDoctor['specialization'],
                        'image' => $matchedDoctor['image'],
                        'hospital' => $matchedDoctor['hospital'],
                    ],
                    'match_score' => min(95, max(0, $rec['match_score'] ?? 75)),
                    'reason' => $rec['reason'] ?? 'Recommended based on your health profile',
                    'confidence' => 'high',
                ];
            }
        }

        return $enriched;
    }

    /**
     * Find similar patients based on symptom
     */
    private function findSimilarPatients($symptom): array
    {
        $patients = Report::whereRaw("description LIKE ?", ["%{$symptom}%"])
            ->with('user')
            ->limit(5)
            ->get()
            ->map(function ($report) {
                return [
                    'patient_id' => $report->user_id,
                    'patient_name' => $report->user->name,
                    'report_type' => $report->report_type,
                    'date' => $report->created_at->format('Y-m-d'),
                ];
            })
            ->unique('patient_id')
            ->values();

        return $patients->toArray();
    }
}
