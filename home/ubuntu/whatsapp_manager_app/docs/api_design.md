# API Endpoint Design

This document outlines the API endpoints for the backend of the WhatsApp management website. The backend will be built using Node.js and Express.js.

## Base URL

`/api/v1`

## Authentication

-   Admin authentication will be handled using JWT (JSON Web Tokens).
-   A middleware will protect routes that require authentication.
-   Login endpoint will return a JWT upon successful credential validation.
-   Subsequent requests to protected routes must include the JWT in the `Authorization` header (e.g., `Authorization: Bearer <token>`).

## Endpoints

### 1. Admin Authentication

-   **`POST /auth/login`**
    -   Description: Logs in the admin.
    -   Request Body: `{ "username": "admin_user", "password": "password123" }`
    -   Response (Success 200): `{ "token": "jwt_token_string", "admin": { "id": "admin_id", "username": "admin_user" } }`
    -   Response (Error 400/401): `{ "error": "Invalid credentials" }`

-   **`POST /auth/logout`** (Protected)
    -   Description: Logs out the admin (optional, as JWTs are stateless, but can be used to blacklist tokens if needed).
    -   Response (Success 200): `{ "message": "Logout successful" }`

-   **`GET /auth/me`** (Protected)
    -   Description: Gets the current logged-in admin's details.
    -   Response (Success 200): `{ "admin": { "id": "admin_id", "username": "admin_user" } }`

### 2. WhatsApp Session Management (Protected)

-   **`GET /whatsapp/session/status`**
    -   Description: Gets the current status of the WhatsApp session (e.g., "pending_qr", "connected", "disconnected").
    -   Response (Success 200): `{ "status": "connected", "phoneNumber": "+1234567890" }` or `{ "status": "pending_qr" }`

-   **`GET /whatsapp/session/qr`**
    -   Description: Requests a new QR code for linking WhatsApp. This might trigger Baileys to generate a QR code, which is then sent to the client, possibly via WebSocket or as a base64 image string.
    -   Response (Success 200): `{ "qrCode": "base64_qr_string_or_websocket_event_indicator" }`
    -   *Note: QR code updates are best handled via WebSockets for real-time display.* `GET /whatsapp/session/qr` might initiate the process, and a WebSocket event `whatsapp_qr_updated` would send the actual QR string.

-   **`POST /whatsapp/session/connect`**
    -   Description: Initiates the connection to WhatsApp (if not already started on server boot).
    -   Response (Success 200): `{ "message": "Connection process initiated." }`

-   **`POST /whatsapp/session/disconnect`**
    -   Description: Disconnects the current WhatsApp session and logs out.
    -   Response (Success 200): `{ "message": "Disconnected successfully." }`

### 3. Conversations (Protected)

-   **`GET /conversations`**
    -   Description: Retrieves a list of all conversations for the admin, sorted by `lastMessageTimestamp` (descending), with pagination.
    -   Query Parameters: `page` (number, default 1), `limit` (number, default 20)
    -   Response (Success 200): `{ "conversations": [ { "id": "conv_id_1", "jid": "jid1", "name": "Contact 1", "unreadCount": 2, "lastMessageSnippet": "Hi", "lastMessageTimestamp": "iso_date" }, ... ], "totalPages": 5, "currentPage": 1 }`

-   **`GET /conversations/:jid`**
    -   Description: Retrieves details for a specific conversation by JID.
    -   Response (Success 200): `{ "conversation": { "id": "conv_id_1", "jid": "jid1", "name": "Contact 1", ... } }`

-   **`PUT /conversations/:jid/read`**
    -   Description: Marks all messages in a conversation as read.
    -   Response (Success 200): `{ "message": "Conversation marked as read." }`

### 4. Messages (Protected)

-   **`GET /messages/:jid`**
    -   Description: Retrieves messages for a specific conversation (JID), sorted by `timestamp` (ascending or descending), with pagination.
    -   Query Parameters: `page` (number, default 1), `limit` (number, default 50), `sort` (string, "asc" or "desc", default "desc")
    -   Response (Success 200): `{ "messages": [ { "id": "msg_id_1", "messageId": "wa_msg_id_1", "fromMe": false, "type": "text", "content": { "text": "Hello" }, "timestamp": "iso_date" }, ... ], "totalPages": 10, "currentPage": 1 }`

-   **`POST /messages/send`**
    -   Description: Sends a new message to a specified JID.
    -   Request Body: `{ "jid": "recipient_jid", "type": "text", "content": { "text": "Hello from the app!" } }` (Content structure varies by type, e.g., for images, it might include a file path or URL)
    -   Response (Success 201): `{ "message": { "id": "new_msg_id", "messageId": "wa_msg_id_new", "fromMe": true, ... } }`
    -   Response (Error 400/500): `{ "error": "Failed to send message" }`

### 5. Auto-Replies (Protected)

-   **`GET /autoreplies`**
    -   Description: Retrieves all auto-reply rules for the admin.
    -   Response (Success 200): `{ "autoReplies": [ { "id": "rule_id_1", "keyword": "hello", "replyMessage": "Hi there!", "enabled": true, ... }, ... ] }`

-   **`POST /autoreplies`**
    -   Description: Creates a new auto-reply rule.
    -   Request Body: `{ "keyword": "support", "replyMessage": "Please contact support@example.com", "matchType": "contains", "enabled": true }`
    -   Response (Success 201): `{ "autoReply": { "id": "new_rule_id", ... } }`

-   **`GET /autoreplies/:id`**
    -   Description: Retrieves a specific auto-reply rule by its ID.
    -   Response (Success 200): `{ "autoReply": { "id": "rule_id_1", ... } }`

-   **`PUT /autoreplies/:id`**
    -   Description: Updates an existing auto-reply rule.
    -   Request Body: `{ "keyword": "support hours", "replyMessage": "Our support hours are 9 AM to 5 PM.", "enabled": false }` (Only include fields to be updated)
    -   Response (Success 200): `{ "autoReply": { "id": "rule_id_1", ...updated_fields... } }`

-   **`DELETE /autoreplies/:id`**
    -   Description: Deletes an auto-reply rule.
    -   Response (Success 200): `{ "message": "Auto-reply rule deleted successfully." }`

## WebSocket Events (Handled by Socket.IO Server)

While not strictly REST API endpoints, WebSockets will be crucial for real-time updates.

**Server -> Client Events:**

-   `whatsapp_status_update`: `{ "status": "connected" | "disconnected" | "pending_qr" | "error", "message": "Optional message", "phoneNumber": "Optional phone number" }`
-   `whatsapp_qr_updated`: `{ "qrCode": "base64_qr_string" }` (Sent when a new QR code is generated)
-   `new_message`: `{ "message": { /* message object, similar to GET /messages/:jid response item */ }, "conversationJid": "jid_of_conversation" }` (Sent when a new message is received or sent)
-   `message_update`: `{ "messageId": "wa_msg_id", "status": "sent" | "delivered" | "read", "conversationJid": "jid_of_conversation" }` (Sent when an outgoing message status changes)
-   `conversation_update`: `{ "conversation": { /* conversation object */ } }` (Sent when conversation details like unread count or last message change)
-   `presence_update`: `{ "jid": "contact_jid", "status": "online" | "offline" | "typing" | "recording" }` (If presence updates are implemented)

**Client -> Server Events (Examples):**

-   `mark_as_read`: `{ "jid": "conversation_jid" }` (Client informs server that messages in a conversation were read)

This API design covers the MVP features and provides a solid foundation for future expansion. Error handling (4xx, 5xx status codes with informative JSON error messages) will be implemented for all endpoints.
