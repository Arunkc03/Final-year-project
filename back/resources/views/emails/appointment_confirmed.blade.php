<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Appointment Confirmed - Payment Successful</title>
    <style>
      body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: linear-gradient(135deg, #1a365d 0%, #2563eb 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
      .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
      .success-badge { background: #10b981; color: white; padding: 8px 16px; border-radius: 20px; display: inline-block; margin-bottom: 20px; }
      .details-card { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
      .details-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
      .details-row:last-child { border-bottom: none; }
      .label { color: #666; }
      .value { font-weight: bold; color: #333; }
      .payment-info { background: #e8f5e9; padding: 15px; border-radius: 8px; margin-top: 20px; }
      .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
    </style>
  </head>
  <body>
    <div class="header">
      <h1>✅ Appointment Confirmed</h1>
    </div>
    
    <div class="content">
      <div class="success-badge">Payment Successful</div>
      
      <p>Dear <strong>{{ $appointment->user->name }}</strong>,</p>
      
      <p>Great news! Your payment has been received and your appointment is now <strong>confirmed</strong>.</p>
      
      <div class="details-card">
        <h3 style="margin-top: 0;">📋 Appointment Details</h3>
        
        <div class="details-row">
          <span class="label">Hospital:</span>
          <span class="value">{{ $appointment->hospital->name ?? 'N/A' }}</span>
        </div>
        
        <div class="details-row">
          <span class="label">Doctor:</span>
          <span class="value">{{ $appointment->doctor->name ?? 'N/A' }}</span>
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
        
        @if($appointment->reason)
        <div class="details-row">
          <span class="label">Reason:</span>
          <span class="value">{{ $appointment->reason }}</span>
        </div>
        @endif
      </div>
      
      @if($payment)
      <div class="payment-info">
        <h4 style="margin-top: 0;">💳 Payment Information</h4>
        <p><strong>Amount Paid:</strong> Rs. {{ number_format($payment->amount, 2) }}</p>
        <p><strong>Transaction ID:</strong> {{ $payment->transaction_id ?? 'N/A' }}</p>
        <p><strong>Payment Date:</strong> {{ $payment->paid_at ? \Carbon\Carbon::parse($payment->paid_at)->format('M d, Y H:i') : 'N/A' }}</p>
      </div>

      <!-- Khalti Payment Box -->
      <div style="background: linear-gradient(135deg, #5c2d8a 0%, #a334d9 100%); padding: 20px; border-radius: 8px; margin: 20px 0; color: white; text-align: center;">
        <div style="margin-bottom: 15px;">
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin: 0 auto; display: block;">
            <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="28" font-weight="bold" fill="white">🔐</text>
          </svg>
        </div>
        <h3 style="margin: 0 0 10px 0; font-size: 18px;">Khalti Payment Verified</h3>
        <p style="margin: 10px 0; font-size: 14px; opacity: 0.95;">Your payment has been securely processed through Khalti</p>
        <div style="background: rgba(255,255,255,0.1); padding: 12px; border-radius: 6px; margin-top: 15px;">
          <p style="margin: 5px 0; font-size: 13px;"><strong>Payment Gateway:</strong> Khalti</p>
          <p style="margin: 5px 0; font-size: 13px;"><strong>Status:</strong> <span style="background: #10b981; padding: 2px 8px; border-radius: 4px; display: inline-block;">Confirmed</span></p>
        </div>
      </div>
      @endif
      
      <p style="margin-top: 20px;">
        <strong>Important:</strong> Please arrive 15 minutes before your scheduled appointment time. 
        Bring any relevant medical records or documents.
      </p>
      
      <div class="footer">
        <p>Thank you for choosing our hospital.</p>
        <p>If you need to reschedule or cancel, please contact us at least 24 hours in advance.</p>
        <p><em>Hospital Management System</em></p>
      </div>
    </div>
  </body>
</html>
