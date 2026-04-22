<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckRole
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, ...$roles): Response
    {
        if (!auth()->check()) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $user = auth()->user();

        if ($user->requiresHospitalAccess() && !$user->hasAccessibleHospital()) {
            if ($user->currentAccessToken()) {
                $user->currentAccessToken()->delete();
            }

            return response()->json(['message' => 'Your hospital account is no longer available.'], 401);
        }

        if (!in_array($user->role, $roles)) {
            return response()->json(['message' => 'Unauthorized: Insufficient permissions'], 403);
        }

        return $next($request);
    }
}
