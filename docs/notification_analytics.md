# Notification Delivery Analytics (#611)

DevLink tracks the end-to-end lifecycle and delivery status of all platform notifications.

## Metrics Tracked
- **Sent**: Notifications dispatched by the backend.
- **Delivered**: Notifications successfully received by the client/WebSocket.
- **Read**: Notifications marked as read by the user.
- **Clicked**: User clicked/interacted with the notification action URL.
- **Failed**: Delivery attempts that failed.

## API Endpoints
- `GET /api/notifications/analytics/delivery` - Returns aggregate metrics and rates for dashboard rendering.
- `POST /api/notifications/{notification_id}/delivered` - Marks notification as delivered with timestamp.
- `POST /api/notifications/{notification_id}/click` - Marks notification as clicked with timestamp.
