<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

/**
 * SetSecurityHeaders Middleware
 * Adds important security headers to all responses
 * Protects against XSS, Clickjacking, MIME sniffing, etc.
 */
class SetSecurityHeaders
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next)
    {
        $response = $next($request);

        // Prevent Clickjacking (Clickjack / UI Redress attacks)
        $response->header('X-Frame-Options', 'SAMEORIGIN');

        // Prevent MIME-type sniffing
        // Forces browser to respect Content-Type header
        $response->header('X-Content-Type-Options', 'nosniff');

        // Enable XSS protection in older browsers
        // Modern browsers ignore this but it's good for legacy support
        $response->header('X-XSS-Protection', '1; mode=block');

        // Referrer Policy - Control how much referrer info is shared
        // strict-no-referrer: Don't send any referrer info
        $response->header('Referrer-Policy', 'strict-no-referrer');

        // Content Security Policy (CSP)
        // Controls which resources can be loaded and executed
        // Helps prevent XSS attacks
        $response->header(
            'Content-Security-Policy',
            "default-src 'self'; " .
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' cdn.jsdelivr.net; " .
            "style-src 'self' 'unsafe-inline' fonts.googleapis.com; " .
            "font-src 'self' fonts.gstatic.com; " .
            "img-src 'self' data: https:; " .
            "connect-src 'self' localhost:* ws://localhost:* wss://localhost:*; " .
            "base-uri 'self';" .
            "form-action 'self';"
        );

        // Permissions-Policy (formerly Feature-Policy)
        // Controls which browser features can be used
        $response->header(
            'Permissions-Policy',
            'geolocation=(), microphone=(), camera=()'
        );

        // Strict-Transport-Security (HSTS)
        // Forces HTTPS connection for 1 year
        // Only apply if HTTPS is enabled
        if (config('app.env') === 'production' || env('FORCE_HTTPS', false)) {
            $response->header(
                'Strict-Transport-Security',
                'max-age=31536000; includeSubDomains; preload'
            );
        }

        // Remove header that discloses server software version
        $response->headers->remove('Server');
        $response->headers->remove('X-Powered-By');

        return $response;
    }
}
