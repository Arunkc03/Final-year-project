<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Appointment Cancelled – Visit Hospital for Refund</title>
    <style>
      body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: linear-gradient(135deg, #c0392b 0%, #e74c3c 100%); color: white; padding: 24px 20px; text-align: center; border-radius: 8px 8px 0 0; }
      .header h1 { margin: 0; font-size: 22px; }
      .header p { margin: 8px 0 0; font-size: 14px; opacity: 0.9; }
      .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
      .alert-box { background: #fff3cd; border-left: 4px solid #f39c12; padding: 15px 18px; border-radius: 6px; margin-bottom: 20px; }
      .alert-box strong { color: #856404; }
      .details-card { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.08); }
      .details-card h3 { margin: 0 0 16px; color: #1a365d; font-size: 16px; }
      .details-row { display: flex; justify-content: space-between; padding: 9px 0; border-bottom: 1px solid #eee; font-size: 14px; }
      .details-row:last-child { border-bottom: none; }
      .label { color: #777; }
      .value { font-weight: bold; color: #333; }
      .refund-box { background: linear-gradient(135deg, #1a365d 0%, #2563eb 100%); color: white; padding: 20px; border-radius: 8px; margin-top: 24px; text-align: center; }
      .refund-box h3 { margin: 0 0 10px; font-size: 18px; }
      .refund-box p { margin: 6px 0; font-size: 14px; opacity: 0.92; }
      .refund-box .highlight { font-size: 15px; font-weight: bold; margin-top: 12px; background: rgba(255,255,255,0.15); padding: 10px; border-radius: 6px; }
      .footer { text-align: center; margin-top: 28px; color: #888; font-size: 13px; }
    </style>
  </head>
  <body>

    <div class="header">
      <h1>❌ Appointment Cancelled</h1>
      <p>We sincerely apologise for the inconvenience</p>
    </div>

    <div class="content">

      <p>Dear <strong>{{ $appointment->user->name }}</strong>,</p>

      <div class="alert-box">
        <strong>⚠️ Important Notice:</strong> Your appointment scheduled for
        <strong>{{ \Carbon\Carbon::parse($appointment->date)->format('l, F j, Y') }}</strong>
        at <strong>{{ $appointment->time }}</strong> has been <strong>cancelled</strong> because
        the doctor has removed their schedule for that date.
      </div>

      <div class="details-card">
        <h3>📋 Cancelled Appointment Details</h3>

        <div class="details-row">
          <span class="label">Hospital:</span>
          <span class="value">{{ $appointment->hospital->name ?? 'N/A' }}</span>
        </div>

        <div class="details-row">
          <span class="label">Doctor:</span>
          <span class="value">Dr. {{ $appointment->doctor->user->name ?? $appointment->doctor->name ?? 'N/A' }}</span>
        </div>

        <div class="details-row">
          <span class="label">Department:</span>
          <span class="value">{{ $appointment->department->name ?? 'General' }}</span>
        </div>

        <div class="details-row">
          <span class="label">Date:</span>
          <span class="value">{{ \Carbon\Carbon::parse($appointment->date)->format('l, F j, Y') }}</span>
        </div>

        <div class="details-row">
          <span class="label">Time:</span>
          <span class="value">{{ $appointment->time }}</span>
        </div>

        @if($appointment->payment_amount)
        <div class="details-row">
          <span class="label">Amount Paid:</span>
          <span class="value">Rs. {{ number_format($appointment->payment_amount, 2) }}</span>
        </div>
        @endif
      </div>

      <div class="refund-box">
        <h3>💰 Payment Refund Information</h3>
        <p>If you have already paid for this appointment, please visit the hospital in person to claim your refund.</p>
        <p>Our staff at the front desk will assist you with the refund process.</p>
        <div class="highlight">
          🏥 Please bring this email or your appointment reference as proof of payment.
        </div>
      </div>

      <p style="margin-top: 24px;">
        We apologise again for this inconvenience. You are welcome to book a new appointment
        with another available doctor from our portal.
      </p>

    </div>

    <div class="footer">
      <p>This is an automated notification from <strong>Hospital Management System</strong>.</p>
      <p>Please do not reply to this email.</p>
    </div>

  </body>
</html>
