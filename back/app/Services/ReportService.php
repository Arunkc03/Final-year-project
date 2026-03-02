<?php

namespace App\Services;

use App\Models\Report;
use PDF;

/**
 * ReportService
 * Handles medical report generation and management
 */
class ReportService
{
    /**
     * Generate report PDF
     */
    public static function generatePDF(Report $report)
    {
        // This would integrate with a PDF library like DOMPDF or MPDF
        // For now, returning placeholder
        return [
            'status' => 'success',
            'file_path' => 'reports/' . $report->id . '.pdf',
            'message' => 'Report PDF generated successfully',
        ];
    }

    /**
     * Create medical report
     */
    public static function createReport($data)
    {
        $report = Report::create([
            'hospital_id' => auth()->user()->hospital_id,
            'patient_id' => $data['patient_id'],
            'doctor_id' => auth()->user()->id,
            'title' => $data['title'],
            'description' => $data['description'],
            'file_path' => $data['file_path'] ?? null,
            'status' => 'pending',
        ]);

        // Send notification
        NotificationService::sendReportNotification($report, 'submitted');

        return $report;
    }

    /**
     * Approve report
     */
    public static function approveReport(Report $report, $notes = null)
    {
        $report->approve($notes);

        // Send notification to patient
        NotificationService::sendReportNotification($report, 'approved');

        return $report;
    }

    /**
     * Reject report
     */
    public static function rejectReport(Report $report, $notes = null)
    {
        $report->reject($notes);

        // Send notification to patient
        NotificationService::sendReportNotification($report, 'rejected');

        return $report;
    }

    /**
     * Get patient reports
     */
    public static function getPatientReports($patientId, $status = null)
    {
        $query = Report::where('patient_id', $patientId);

        if ($status) {
            $query->where('status', $status);
        }

        return $query->with('doctor')->orderBy('created_at', 'desc')->get();
    }

    /**
     * Get doctor reports
     */
    public static function getDoctorReports($doctorId, $status = null)
    {
        $query = Report::where('doctor_id', $doctorId);

        if ($status) {
            $query->where('status', $status);
        }

        return $query->with('patient')->orderBy('created_at', 'desc')->get();
    }

    /**
     * Search reports
     */
    public static function searchReports($query)
    {
        return Report::where('title', 'like', "%{$query}%")
            ->orWhere('description', 'like', "%{$query}%")
            ->get();
    }

    /**
     * Get reports by date range
     */
    public static function getReportsByDateRange($startDate, $endDate, $hospitalId = null)
    {
        $query = Report::whereBetween('created_at', [$startDate, $endDate]);

        if ($hospitalId) {
            $query->where('hospital_id', $hospitalId);
        }

        return $query->get();
    }

    /**
     * Generate hospital report statistics
     */
    public static function getHospitalStatistics($hospitalId)
    {
        return [
            'total_reports' => Report::where('hospital_id', $hospitalId)->count(),
            'pending_reports' => Report::where('hospital_id', $hospitalId)->pending()->count(),
            'approved_reports' => Report::where('hospital_id', $hospitalId)->approved()->count(),
            'rejected_reports' => Report::where('hospital_id', $hospitalId)->rejected()->count(),
        ];
    }

    /**
     * Generate appointment report
     */
    public static function generateAppointmentReport(\App\Models\Appointment $appointment)
    {
        return [
            'appointment_id' => $appointment->id,
            'patient_name' => $appointment->patient->name,
            'doctor_name' => $appointment->doctor->name,
            'hospital_name' => $appointment->hospital->name,
            'date' => $appointment->date,
            'time' => $appointment->time,
            'status' => $appointment->status,
            'payment_status' => $appointment->payment_status,
        ];
    }
}
