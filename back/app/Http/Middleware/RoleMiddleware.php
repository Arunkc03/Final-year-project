<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

/**
 * RoleMiddleware
 * Checks if user has required role(s)
 * Usage: middleware('role:admin,super_admin')
 */
class RoleMiddleware
{
    public function handle(Request $request, Closure $next, ...$roles)
    {
        if (!$request->user()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthenticated',
            ], 401);
        }

        if (in_array($request->user()->role, $roles)) {
            return $next($request);
        }

        return response()->json([
            'status' => 'error',
            'message' => 'Unauthorized. Required role: ' . implode(',', $roles),
        ], 403);
    }
}
