# Email Setup Guide

## Quick Setup (2 Options)

### Option 1: Gmail (Recommended for Development)

1. **Enable Less Secure Apps:**
   - Go to: https://myaccount.google.com/security
   - Scroll to "Less secure app access"
   - Turn ON

2. **Create App Password (Recommended for Security):**
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" and "Windows Computer"
   - Google will generate a 16-character password
   - Copy this password

3. **Update .env:**
```env
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-16-character-app-password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=your-email@gmail.com
MAIL_FROM_NAME="Hospital Management System"
```

4. **Test:**
```bash
php artisan tinker
Mail::raw('Test email', function($message) {
    $message->to('test@example.com');
});
# Should get "Email sent!" message
```

### Option 2: Mailtrap (Free Tier - Recommended for Testing)

1. **Create Free Account:**
   - Visit: https://mailtrap.io
   - Sign up free
   - Verify email

2. **Get Credentials:**
   - Go to Inbox → Settings → Integrations
   - Choose "Laravel"
   - Copy SMTP credentials

3. **Update .env:**
```env
MAIL_MAILER=smtp
MAIL_HOST=smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USERNAME=your-mailtrap-username
MAIL_PASSWORD=your-mailtrap-password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@hospital.local
MAIL_FROM_NAME="Hospital Management System"
```

4. **View Sent Emails:**
   - Login to Mailtrap
   - All emails appear in Inbox (no actual sending)
   - Perfect for testing!

### Option 3: SendGrid (Production)

1. **Create Account:**
   - Visit: https://sendgrid.com
   - Sign up (free tier available)
   - Verify email

2. **Create API Key:**
   - Go to Settings → API Keys
   - Create new API key
   - Copy the key

3. **Update .env:**
```env
MAIL_MAILER=sendgrid
SENDGRID_API_KEY=your-sendgrid-api-key
MAIL_FROM_ADDRESS=noreply@hospital.com
MAIL_FROM_NAME="Hospital Management System"
```

## Clear Cache After .env Changes

```bash
php artisan config:clear
php artisan cache:clear
```

## Check Current Configuration

```bash
php artisan tinker
echo config('mail.mailer');
echo config('mail.from.address');
```

## Common Issues

### Issue: "Expected response code 250 but got code 535"
- **Cause:** Wrong password or authentication failed
- **Solution:** Use app-specific password (not main Gmail password)

### Issue: "Could not connect to host"
- **Cause:** Wrong SMTP host or port
- **Solution:** Verify host and port from your email provider

### Issue: "Emails are logged but not sent"
- **Cause:** MAIL_MAILER still set to 'log'
- **Solution:** Change to 'smtp' or 'sendgrid'

## Test Commands

```bash
# Send test email
php artisan mail:send

# Send to specific address
php artisan tinker
Mail::send('emails.welcome', [], function($message) {
    $message->to('test@example.com')->subject('Test');
});
```

## Production Email Templates

Email templates are located in: `resources/views/emails/`

Available templates:
- AppointmentBooked.php - Sent when appointment is created
- AppointmentCancelled.php - Sent when appointment is cancelled
- PasswordReset.php - Password reset instruction

## View Sent Emails

### Development (Using Mailtrap)
- Emails appear in Mailtrap Inbox
- Click email to view html/text

### Production Monitoring
- Monitor via SendGrid/Gmail dashboard
- Check bounce rate and delivery status
- Review in Analytics

---

**Current Status:** Configuration ready  
**Next Step:** Update .env with your chosen provider
