<?php

namespace App\Http\Controllers\api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Report;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;

class ReportController extends Controller
{
    // Create report (patient or doctor can submit)
    public function store(Request $request)
    {
        $user = auth()->user();

        $validator = Validator::make($request->all(), [
            'patient_id' => 'required|exists:users,id',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'diagnosis' => 'nullable|string',
            'treatment' => 'nullable|string',
            'notes' => 'nullable|string',
            'file_path' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['status'=>'error','errors'=>$validator->errors()], 422);
        }

        // Get hospital_id - for doctors, get from doctor profile
        $hospitalId = $user->hospital_id;
        if ($user->isDoctor() && !$hospitalId) {
            $doctorProfile = $user->doctor;
            $hospitalId = $doctorProfile ? $doctorProfile->hospital_id : null;
        }
        $hospitalId = $hospitalId ?? $request->hospital_id ?? null;

        $filePath = null;
        if ($request->hasFile('file')) {
            $filePath = $request->file('file')->store('reports', 'public');
        } elseif ($request->filled('file_path')) {
            $filePath = $request->file_path;
        }

        $report = Report::create([
            'hospital_id' => $hospitalId,
            'patient_id' => $request->patient_id,
            'doctor_id' => $user->isDoctor() ? $user->id : null,
            'title' => $request->title,
            'description' => $request->description,
            'diagnosis' => $request->diagnosis,
            'treatment' => $request->treatment,
            'notes' => $request->notes,
            'file_path' => $filePath,
            'status' => 'pending',
        ]);

        return response()->json(['status'=>'success','report'=>$report], 201);
    }

    // List reports (restricted by role)
    public function index(Request $request)
    {
        $user = auth()->user();

        if ($user->isSuperAdmin()) {
            $q = Report::query();
        } elseif ($user->isAdmin()) {
            $q = Report::where('hospital_id', $user->hospital_id);
        } elseif ($user->isDoctor()) {
            // doctors see reports they created or from their hospital
            $doctorRecord = $user->doctor;
            $hospitalId = $doctorRecord ? $doctorRecord->hospital_id : $user->hospital_id;
            $q = Report::where(function($query) use ($user, $hospitalId) {
                $query->where('doctor_id', $user->id)
                      ->orWhere('hospital_id', $hospitalId);
            });
        } else {
            // patients see own reports
            $q = Report::where('patient_id', $user->id);
        }

        $reports = $q->with(['patient', 'doctor', 'hospital'])
                     ->orderBy('created_at', 'desc')
                     ->paginate(20);

        return response()->json(['status'=>'success','data'=>$reports]);
    }

    // Show single report
    public function show($id)
    {
        $user = auth()->user();
        $report = Report::findOrFail($id);

        // basic access control
        if ($user->isSuperAdmin()) {
            // ok
        } elseif ($user->isAdmin() && $report->hospital_id === $user->hospital_id) {
            // ok
        } elseif ($user->isDoctor() && $report->hospital_id === $user->hospital_id) {
            // ok
        } elseif ($report->patient_id === $user->id) {
            // ok
        } else {
            return response()->json(['message'=>'Unauthorized'], 403);
        }

        return response()->json(['status'=>'success','report'=>$report]);
    }

    // Review a report (approve/reject) - admin/doctor
    public function review(Request $request, $id)
    {
        $user = auth()->user();

        if (!($user->isAdmin() || $user->isDoctor() || $user->isSuperAdmin())) {
            return response()->json(['message'=>'Unauthorized'], 403);
        }

        $report = Report::findOrFail($id);

        // Get user's hospital_id (doctors store it in doctors table)
        $userHospitalId = $user->hospital_id;
        if ($user->isDoctor() && !$userHospitalId) {
            $doctorProfile = $user->doctor;
            $userHospitalId = $doctorProfile ? $doctorProfile->hospital_id : null;
        }

        // ensure admin/doctor belong to same hospital unless super admin
        if (!$user->isSuperAdmin() && $report->hospital_id !== $userHospitalId) {
            return response()->json(['message'=>'Unauthorized'], 403);
        }

        $validator = Validator::make($request->all(), [
            'status' => 'required|in:pending,reviewed,approved,rejected',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['status'=>'error','errors'=>$validator->errors()], 422);
        }

        $report->status = $request->status;
        $report->notes = $request->notes;
        $report->reviewed_by = $user->id;
        $report->reviewed_at = now();
        $report->save();

        return response()->json(['status'=>'success','report'=>$report]);
    }
}
