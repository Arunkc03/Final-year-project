# Google Gemini AI Integration Guide

## Overview
The Patient Dashboard now uses Google Gemini AI to provide intelligent, personalized doctor recommendations based on each patient's medical history.

## Setup Instructions

### 1. Get Your Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Click "Create API Key" or use an existing one
3. Copy your API key

### 2. Add to Environment

Add your Gemini API key to `.env`:

```env
GEMINI_API_KEY=your_api_key_here
GEMINI_MODEL=gemini-pro
```

### 3. Clear Cache

```bash
php artisan config:clear
php artisan cache:clear
```

## Features

### AI-Powered Doctor Recommendations
- Analyzes patient's appointment history
- Reviews medical reports
- Recommends best matching doctors/specialists
- Provides match scores (0-95%)
- Gives personalized reasons for recommendations

**Endpoint:** `GET /api/ai/doctor-recommendations`

**Response:**
```json
{
  "status": "success",
  "message": "AI-powered doctor recommendations generated",
  "data": [
    {
      "doctor": {
        "id": 5,
        "name": "Dr. John Smith",
        "specialization": "Cardiology",
        "image": "path/to/image.jpg",
        "hospital": "Central Medical Hospital"
      },
      "match_score": 92,
      "reason": "Based on your recent cardiac clinic visits, cardiologist recommended",
      "confidence": "high"
    }
  ]
}
```

### Specialty Recommendation
- Analyzes patient symptoms
- Recommends appropriate medical specialty
- Uses Gemini's medical knowledge

**Endpoint:** `POST /api/ai/specialty-recommendation`

**Request:**
```json
{
  "symptoms": ["chest pain", "shortness of breath", "dizziness"]
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Specialty recommendation generated",
  "recommended_specialty": "Cardiology",
  "data": {
    "specialty": "Cardiology",
    "symptoms_analyzed": 3
  }
}
```

### Similar Patients
- Finds other patients with similar symptoms
- Helps with peer support and case studies
- Useful for comparative medical analysis

**Endpoint:** `GET /api/ai/similar-patients?symptom=headache`

## Frontend Integration

The Patient Dashboard automatically displays AI recommendations in a dedicated section:

```jsx
// Shows AI-generated recommendations with:
- Doctor profile and specialization
- Match score percentage
- AI-generated reasoning
- Quick "Book Appointment" button
- Loading states and error handling
```

## How It Works

1. **Data Collection**
   - Gathers patient's recent appointments
   - Reviews medical reports
   - Analyzes appointment history

2. **AI Analysis**
   - Sends anonymized data to Gemini API
   - Gemini analyzes medical patterns
   - Generates intelligent recommendations

3. **Enrichment**
   - Matches recommendations with actual doctors in the system
   - Calculates match scores
   - Provides personalized reasons

4. **Display**
   - Shows recommendations in the dashboard
   - Includes doctor info and actionable buttons
   - Provides loading and error states

## Best Practices

1. **API Key Security**
   - Never commit API keys to git
   - Use `.env` for local development
   - Use environment variables in production

2. **Error Handling**
   - Gracefully handles API timeouts
   - Falls back to empty recommendations if API fails
   - Logs errors for debugging

3. **Performance**
   - Caches recommendations where possible
   - Limits requests to 1 per patient per session
   - Optimizes database queries for data gathering

## Testing

### Test the API directly:

```bash
# Get recommendations for authenticated patient
curl -X GET \
  http://localhost:8000/api/ai/doctor-recommendations \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN"

# Get specialty recommendation
curl -X POST \
  http://localhost:8000/api/ai/specialty-recommendation \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"symptoms": ["headache", "fever"]}'

# Get similar patients
curl -X GET \
  http://localhost:8000/api/ai/similar-patients?symptom=cough \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN"
```

## Troubleshooting

### "Invalid Gemini API Response"
- Check your API key is valid
- Verify GEMINI_API_KEY is set in .env
- Check internet connectivity
- Review logs at `storage/logs/laravel.log`

### "No recommendations found"
- Patient may not have sufficient appointment history
- Check if medical reports exist
- Ensure doctors are marked as "active"

### "API timeout"
- Increase timeout in GeminiService.php line 68
- Check Google API status
- Verify network connectivity

## Configuration

All Gemini settings are in `config/ai.php`:

```php
return [
    'gemini' => [
        'api_key' => env('GEMINI_API_KEY', ''),
        'model' => env('GEMINI_MODEL', 'gemini-pro'),
        'base_url' => 'https://generativelanguage.googleapis.com/v1beta/models',
    ],
];
```

## API Limits

- Free tier: 60 requests per minute
- Each recommendation call = 1 request
- Recommendations cached per patient

## Support

For issues:
1. Check the logs: `tail -f storage/logs/laravel.log`
2. Verify API key at [Google AI Studio](https://makersuite.google.com/app/apikey)
3. Review the [Gemini API Documentation](https://ai.google.dev/)
