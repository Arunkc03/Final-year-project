<?php

namespace App\Http\Controllers\api;

use App\Models\Notification;
use Illuminate\Http\Request;

/**
 * NotificationController
 * Handles notification management
 * Use Cases: View notifications, Receive notifications
 */
class NotificationController extends Controller
{
    /**
     * Get user's notifications
     * GET /api/notifications
     */
    public function index(Request $request)
    {
        $user = auth()->user();

        $query = $user->notifications();

        // Filter by read status
        if ($request->has('read')) {
            $query->where('is_read', $request->boolean('read'));
        }

        // Filter by type
        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        $notifications = $query->paginate(20);

        return response()->json([
            'status' => 'success',
            'data' => $notifications,
            'unread_count' => $user->notifications()->unread()->count(),
        ]);
    }

    /**
     * Get unread notifications only
     * GET /api/notifications/unread
     */
    public function unread()
    {
        $user = auth()->user();
        $notifications = $user->notifications()->unread()->limit(10)->get();

        return response()->json([
            'status' => 'success',
            'data' => $notifications,
            'unread_count' => $user->notifications()->unread()->count(),
        ]);
    }

    /**
     * Get single notification
     * GET /api/notifications/{id}
     */
    public function show($id)
    {
        $notification = Notification::find($id);

        if (!$notification || $notification->user_id !== auth()->id()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Notification not found',
            ], 404);
        }

        // Mark as read
        $notification->markAsRead();

        return response()->json([
            'status' => 'success',
            'data' => $notification,
        ]);
    }

    /**
     * Mark notification as read
     * PUT /api/notifications/{id}/read
     */
    public function markAsRead($id)
    {
        $notification = Notification::find($id);

        if (!$notification || $notification->user_id !== auth()->id()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Notification not found',
            ], 404);
        }

        $notification->markAsRead();

        return response()->json([
            'status' => 'success',
            'data' => $notification,
            'message' => 'Notification marked as read',
        ]);
    }

    /**
     * Mark notification as unread
     * PUT /api/notifications/{id}/unread
     */
    public function markAsUnread($id)
    {
        $notification = Notification::find($id);

        if (!$notification || $notification->user_id !== auth()->id()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Notification not found',
            ], 404);
        }

        $notification->markAsUnread();

        return response()->json([
            'status' => 'success',
            'data' => $notification,
            'message' => 'Notification marked as unread',
        ]);
    }

    /**
     * Mark all notifications as read
     * PUT /api/notifications/mark-all-read
     */
    public function markAllAsRead()
    {
        auth()->user()->notifications()->unread()->update([
            'is_read' => true,
            'read_at' => now(),
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'All notifications marked as read',
        ]);
    }

    /**
     * Delete notification
     * DELETE /api/notifications/{id}
     */
    public function destroy($id)
    {
        $notification = Notification::find($id);

        if (!$notification || $notification->user_id !== auth()->id()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Notification not found',
            ], 404);
        }

        $notification->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Notification deleted successfully',
        ]);
    }
}
