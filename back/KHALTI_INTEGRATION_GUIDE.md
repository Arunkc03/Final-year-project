# Khalti Payment Gateway Integration Guide

This guide explains how to set up and use the Khalti payment gateway in the Doctor Sathi application.

## Overview

Khalti is a digital wallet and online payment gateway service in Nepal. This integration allows patients to pay for their medical appointments using:
- Khalti Wallet
- eBanking
- Mobile Banking
- Connect IPS
- SCT Cards

## Setup Instructions

### 1. Get Khalti API Credentials

1. Sign up for a Khalti Merchant Account at [https://khalti.com](https://khalti.com)
2. After approval, go to your merchant dashboard
3. Navigate to **Settings > Keys** to get your:
   - **Secret Key** (for backend API calls)
   - **Public Key** (for frontend integration)

### 2. Configure Environment Variables

Add the following to your Laravel `.env` file:

```env
# Khalti Payment Gateway
KHALTI_SECRET_KEY=your_secret_key_here
KHALTI_PUBLIC_KEY=your_public_key_here
KHALTI_BASE_URL=https://a.khalti.com/api/v2
KHALTI_RETURN_URL=/payment/verify
KHALTI_WEBSITE_URL=http://localhost:5173
```

**For Production:**
```env
KHALTI_SECRET_KEY=live_secret_key_xxxxxxxxxxxx
KHALTI_PUBLIC_KEY=live_public_key_xxxxxxxxxxxx
KHALTI_BASE_URL=https://khalti.com/api/v2
KHALTI_RETURN_URL=/payment/verify
KHALTI_WEBSITE_URL=https://yourdomain.com
```

### 3. Run Database Migration

Run the migration to add Khalti-specific fields to the payments table:

```bash
cd back
php artisan migrate
```

This adds the following fields:
- `khalti_pidx` - Khalti payment index
- `khalti_status` - Status from Khalti
- `khalti_payment_url` - URL to Khalti payment page  
- `khalti_fee` - Khalti transaction fee

## API Endpoints

### Public Endpoints (No Authentication)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/khalti/config` | Get public Khalti configuration |
| GET | `/api/khalti/verify` | Verify payment callback from Khalti |
| POST | `/api/khalti/webhook` | Handle Khalti webhook notifications |

### Protected Endpoints (Requires Authentication)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/khalti/initiate` | Initiate a new Khalti payment |
| GET | `/api/khalti/lookup/{paymentId}` | Check payment status |

## Usage

### Backend Usage

```php
use App\Services\KhaltiService;

// In a controller
public function pay(KhaltiService $khalti)
{
    // Convert amount to paisa (1 NPR = 100 paisa)
    $amountInPaisa = KhaltiService::toPaisa(500); // 500 NPR = 50000 paisa
    
    // Initiate payment
    $result = $khalti->initiatePayment([
        'return_url' => 'https://yoursite.com/payment/verify',
        'website_url' => 'https://yoursite.com',
        'amount' => $amountInPaisa,
        'purchase_order_id' => 'ORDER-123',
        'purchase_order_name' => 'Medical Consultation',
    ]);
    
    if ($result['success']) {
        // Redirect user to $result['data']['payment_url']
    }
}
```

### Frontend Usage

```jsx
import { KhaltiPayment } from './components/Payment';

function AppointmentPayment({ appointment }) {
  return (
    <KhaltiPayment
      appointmentId={appointment.id}
      amount={appointment.payment_amount}
      onSuccess={(data) => {
        console.log('Payment successful:', data);
      }}
      onError={(error) => {
        console.error('Payment failed:', error);
      }}
      onCancel={() => {
        console.log('Payment canceled');
      }}
    />
  );
}
```

### Using the Hook Directly

```jsx
import useKhalti from './hooks/useKhalti';

function CustomPaymentComponent() {
  const { 
    loading, 
    error, 
    initiatePayment, 
    redirectToKhalti 
  } = useKhalti();
  
  const handlePay = async () => {
    const response = await initiatePayment(appointmentId, amount, token);
    if (response.status === 'success') {
      redirectToKhalti(response.data.payment_url);
    }
  };
  
  return (
    <button onClick={handlePay} disabled={loading}>
      {loading ? 'Processing...' : 'Pay with Khalti'}
    </button>
  );
}
```

## Payment Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Patient   │────▶│  Your App   │────▶│   Khalti    │
│   Clicks    │     │  Backend    │     │    API      │
│   Pay       │     │  Initiates  │     │  Returns    │
└─────────────┘     └─────────────┘     │  Payment    │
                                        │  URL        │
                                        └──────┬──────┘
                                               │
                    ┌─────────────┐            │
                    │   Patient   │◀───────────┘
                    │  Redirected │
                    │  to Khalti  │
                    └──────┬──────┘
                           │
                           ▼
                    ┌─────────────┐
                    │   Khalti    │
                    │   Payment   │
                    │   Page      │
                    └──────┬──────┘
                           │
                           ▼
                    ┌─────────────┐     ┌─────────────┐
                    │   Patient   │────▶│  Your App   │
                    │  Completes  │     │  /payment/  │
                    │  Payment    │     │  verify     │
                    └─────────────┘     └──────┬──────┘
                                               │
                                               ▼
                                        ┌─────────────┐
                                        │   Backend   │
                                        │   Verifies  │
                                        │   Payment   │
                                        └──────┬──────┘
                                               │
                                               ▼
                                        ┌─────────────┐
                                        │   Update    │
                                        │   Payment   │
                                        │   Status    │
                                        └─────────────┘
```

## Payment Statuses

| Khalti Status | App Status | Description |
|---------------|------------|-------------|
| Completed | completed | Payment successful |
| Pending | pending | Payment initiated, waiting |
| Initiated | pending | User started but didn't complete |
| Refunded | refunded | Payment was refunded |
| Expired | failed | Payment request expired |
| User canceled | failed | User canceled the payment |

## Testing

### Test Credentials

For testing in sandbox/test mode:

```env
KHALTI_SECRET_KEY=test_secret_key_xxxxxxxxxx
KHALTI_PUBLIC_KEY=test_public_key_xxxxxxxxxx
KHALTI_BASE_URL=https://a.khalti.com/api/v2
```

### Test Payment

1. Use test credentials from Khalti dashboard
2. Amount limits: Min 10 NPR, Max 200,000 NPR
3. Use Khalti test mobile number and OTP for testing

## Error Handling

Common errors and solutions:

| Error | Cause | Solution |
|-------|-------|----------|
| "Minimum payment amount is 10 NPR" | Amount too low | Ensure amount >= 10 NPR |
| "Maximum payment amount is 200,000 NPR" | Amount too high | Split into multiple payments |
| "Payment initiation failed" | Invalid credentials | Check API keys |
| "Unauthorized" | Token missing/invalid | Re-authenticate user |

## Security Considerations

1. **Never expose Secret Key** - Keep `KHALTI_SECRET_KEY` only on backend
2. **Verify all callbacks** - Always verify payments with Khalti API
3. **Use HTTPS** - Required for production
4. **Validate amounts** - Check amount matches appointment before processing

## Webhook Setup

For production, configure a webhook in your Khalti dashboard:

**Webhook URL:** `https://yourdomain.com/api/khalti/webhook`

This ensures payments are updated even if user closes browser after payment.

## Troubleshooting

### Payment Not Completing

1. Check Khalti dashboard for transaction status
2. Verify `KHALTI_RETURN_URL` is correct
3. Check browser console for errors
4. Verify CORS settings allow Khalti redirects

### Verification Failing

1. Ensure `KHALTI_SECRET_KEY` is correct
2. Check if `khalti_pidx` is stored correctly
3. Verify network connectivity to Khalti API

## Support

For Khalti-specific issues:
- Documentation: https://docs.khalti.com/
- Support: support@khalti.com
- Dashboard: https://khalti.com/merchant/
