<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Appointment Confirmation</title>
  </head>
  <body>
    <h2>Your appointment is confirmed</h2>
    <p>Dear {{ $appointment->user->name }},</p>
    <p>Your appointment at <strong>{{ $appointment->hospital->name }}</strong> is booked for <strong>{{ $appointment->date }}</strong>.</p>
    @if($appointment->notes)
      <p>Notes: {{ $appointment->notes }}</p>
    @endif
    <p>Thank you — Hospital Management System</p>
  </body>
</html>
