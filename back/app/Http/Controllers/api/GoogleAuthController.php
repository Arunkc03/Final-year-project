<?php

namespace App\Http\Controllers\api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cookie;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;

class GoogleAuthController extends Controller
{
    /**
     * Redirect to Google OAuth page
     */
    public function redirectToGoogle(Request $request)
    {
        $mode = $request->query('mode');
        $mode = in_array($mode, ['login', 'register'], true) ? $mode : 'login';

        $provider = Socialite::driver('google');

        if (method_exists($provider, 'with')) {
            $provider = $provider->with([
                'prompt' => 'select_account',
            ]);
        }

        if (method_exists($provider, 'stateless')) {
            $provider = $provider->stateless();
        }

        return $provider->redirect()->withCookie(
            cookie('google_auth_mode', $mode, 10, '/', null, false, false, false, 'Lax')
        );
    }

    /**
     * Handle Google OAuth callback
     */
    public function handleGoogleCallback(Request $request)
    {
        try {
            $authMode = $request->cookie('google_auth_mode', 'login');
            if (!in_array($authMode, ['login', 'register'], true)) {
                $authMode = 'login';
            }

            /** @var \Laravel\Socialite\Two\GoogleProvider $googleProvider */
            $googleProvider = Socialite::driver('google');

            $googleUser = $googleProvider
                ->stateless()
                ->user();

            // Check if user already exists
            $user = User::where('email', $googleUser->getEmail())->first();
            $isNewUser = false;

            $frontendUrl = env('FRONTEND_URL', 'http://localhost:5173');

            // Register intent with existing account: show clear mismatch.
            if ($authMode === 'register' && $user) {
                return redirect()->away(
                    $frontendUrl . '/register?error=' . urlencode('This Google account is already registered. Please login with Google instead.')
                )->withCookie(Cookie::forget('google_auth_mode'));
            }

            // Login intent with unknown account: do not auto-register.
            if ($authMode === 'login' && !$user) {
                return redirect()->away(
                    $frontendUrl . '/login?error=' . urlencode('No account found for this Google email. Please register first.')
                )->withCookie(Cookie::forget('google_auth_mode'));
            }

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
            
            return redirect()->away($callbackUrl)
                ->withCookie(Cookie::forget('google_auth_mode'));

        } catch (\Exception $e) {
            $authMode = $request->cookie('google_auth_mode', 'login');
            $frontendUrl = env('FRONTEND_URL', 'http://localhost:5173');
            $fallbackRoute = $authMode === 'register' ? '/register' : '/login';
            return redirect()->away(
                $frontendUrl . $fallbackRoute . '?error=' . urlencode('Google authentication failed. Please try again.')
            )->withCookie(Cookie::forget('google_auth_mode'));
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
            /** @var \Laravel\Socialite\Two\GoogleProvider $googleProvider */
            $googleProvider = Socialite::driver('google');

            $googleUser = $googleProvider
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
