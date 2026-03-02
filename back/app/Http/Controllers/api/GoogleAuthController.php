<?php

namespace App\Http\Controllers\api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;

class GoogleAuthController extends Controller
{
    /**
     * Redirect to Google OAuth page
     */
    public function redirectToGoogle()
    {
        return Socialite::driver('google')
            ->stateless()
            ->redirect();
    }

    /**
     * Handle Google OAuth callback
     */
    public function handleGoogleCallback(Request $request)
    {
        try {
            $googleUser = Socialite::driver('google')
                ->stateless()
                ->user();

            // Check if user already exists
            $user = User::where('email', $googleUser->getEmail())->first();
            $isNewUser = false;

            if ($user) {
                // Update Google ID if not set
                if (!$user->google_id) {
                    $user->update(['google_id' => $googleUser->getId()]);
                }
            } else {
                // Create new patient user
                $isNewUser = true;
                $user = User::create([
                    'name' => $googleUser->getName(),
                    'email' => $googleUser->getEmail(),
                    'google_id' => $googleUser->getId(),
                    'password' => Hash::make(Str::random(24)),
                    'role' => 'patient',
                    'hospital_id' => null,
                    'identifier' => 'PAT' . Str::upper(Str::random(6)),
                    'email_verified_at' => now(),
                ]);
            }

            // Create token
            $token = $user->createToken('auth_token')->plainTextToken;

            // Determine dashboard route based on role
            $dashboard = match($user->role) {
                'super_admin' => '/dashboard/super-admin',
                'admin' => '/dashboard/admin',
                'doctor' => '/dashboard/doctor',
                default => '/dashboard/patient',
            };

            // Redirect to frontend with token
            $frontendUrl = env('FRONTEND_URL', 'http://localhost:5173');
            $callbackUrl = $frontendUrl . '/auth/google/callback?token=' . $token 
                . '&user=' . urlencode(json_encode([
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'identifier' => $user->identifier,
                    'phone' => $user->phone,
                    'dashboard' => $dashboard,
                ]))
                . '&is_new=' . ($isNewUser ? 'true' : 'false');
            
            return redirect()->away($callbackUrl);

        } catch (\Exception $e) {
            $frontendUrl = env('FRONTEND_URL', 'http://localhost:5173');
            return redirect()->away($frontendUrl . '/login?error=' . urlencode('Google authentication failed: ' . $e->getMessage()));
        }
    }

    /**
     * Handle Google token from frontend (for popup-based auth)
     */
    public function handleGoogleToken(Request $request)
    {
        $request->validate([
            'token' => 'required|string',
        ]);

        try {
            $googleUser = Socialite::driver('google')
                ->stateless()
                ->userFromToken($request->token);

            // Check if user already exists
            $user = User::where('email', $googleUser->getEmail())->first();

            if ($user) {
                // Update Google ID if not set
                if (!$user->google_id) {
                    $user->update(['google_id' => $googleUser->getId()]);
                }
            } else {
                // Create new patient user
                $user = User::create([
                    'name' => $googleUser->getName(),
                    'email' => $googleUser->getEmail(),
                    'google_id' => $googleUser->getId(),
                    'password' => Hash::make(Str::random(24)),
                    'role' => 'patient',
                    'hospital_id' => null,
                    'identifier' => 'PAT' . Str::upper(Str::random(6)),
                    'email_verified_at' => now(),
                ]);
            }

            // Create token
            $token = $user->createToken('auth_token')->plainTextToken;

            // Determine dashboard route based on role
            $dashboard = match($user->role) {
                'super_admin' => '/dashboard/super-admin',
                'admin' => '/dashboard/admin',
                'doctor' => '/dashboard/doctor',
                default => '/dashboard/patient',
            };

            return response()->json([
                'status' => 'success',
                'message' => 'Google authentication successful',
                'token' => $token,
                'dashboard' => $dashboard,
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'identifier' => $user->identifier,
                ],
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Google authentication failed: ' . $e->getMessage(),
            ], 401);
        }
    }
}
