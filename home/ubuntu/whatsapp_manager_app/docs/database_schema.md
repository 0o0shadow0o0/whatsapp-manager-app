# Database Schema Design

This document outlines the MongoDB schema for the WhatsApp management website.

## Collections

### 1. `admins` Collection

Stores administrator login credentials.

-   `_id`: ObjectId (Primary Key)
-   `username`: String (Unique, Indexed) - Admin's username for login.
-   `password`: String - Hashed password for the admin.
-   `createdAt`: Date - Timestamp of admin account creation.
-   `updatedAt`: Date - Timestamp of last admin account update.

**Example:**
```json
{
  "_id": ObjectId("60c72b2f9b1e8a3f9c8b4567"),
  "username": "admin_user",
  "password": "hashed_password_string",
  "createdAt": ISODate("2025-05-07T10:00:00Z"),
  "updatedAt": ISODate("2025-05-07T10:00:00Z")
}
```

### 2. `whatsapp_sessions` Collection

Stores active WhatsApp session data linked to the admin. Since it's a single-admin system as per user clarification, we might only have one document here or a way to associate it with the single admin if we plan for future multi-admin support (though current scope is single admin).

-   `_id`: ObjectId (Primary Key)
-   `adminId`: ObjectId (ForeignKey referencing `admins._id`) - Associates the session with the admin.
-   `sessionId`: String (Unique, Indexed) - A unique identifier for the Baileys session (e.g., can be 'default_session' for a single admin setup).
-   `sessionData`: Object - Stores the authentication state and other session-specific data from Baileys. The structure of this object will be determined by Baileys `useMultiFileAuthState` or a custom implementation.
-   `linkedPhoneNumber`: String (Optional) - The WhatsApp number linked to this session.
-   `status`: String (e.g., "pending_qr", "connected", "disconnected", "error") - Current status of the WhatsApp connection.
-   `lastConnectedAt`: Date (Optional) - Timestamp of the last successful connection.
-   `createdAt`: Date - Timestamp of session record creation.
-   `updatedAt`: Date - Timestamp of last session record update.

**Example:**
```json
{
  "_id": ObjectId("60c72b3f9b1e8a3f9c8b4568"),
  "adminId": ObjectId("60c72b2f9b1e8a3f9c8b4567"),
  "sessionId": "default_session",
  "sessionData": { /* Baileys auth state object */ },
  "linkedPhoneNumber": "+1234567890",
  "status": "connected",
  "lastConnectedAt": ISODate("2025-05-07T12:00:00Z"),
  "createdAt": ISODate("2025-05-07T11:00:00Z"),
  "updatedAt": ISODate("2025-05-07T12:00:00Z")
}
```

### 3. `conversations` Collection

Stores metadata about each chat conversation. A conversation is typically with a unique WhatsApp JID (user or group).

-   `_id`: ObjectId (Primary Key)
-   `adminId`: ObjectId (ForeignKey referencing `admins._id`)
-   `jid`: String (Unique, Indexed) - The WhatsApp JID (e.g., `xxxxxxxxxxx@s.whatsapp.net` for users, `xxxxxxxx-xxxx@g.us` for groups).
-   `name`: String (Optional) - The name of the contact or group, as known to the linked WhatsApp account.
-   `unreadCount`: Number (Default: 0) - Number of unread messages in this conversation.
-   `lastMessageTimestamp`: Date (Optional, Indexed) - Timestamp of the last message in this conversation (used for sorting conversations).
-   `lastMessageSnippet`: String (Optional) - A short snippet of the last message.
-   `archived`: Boolean (Default: false)
-   `pinned`: Boolean (Default: false)
-   `mutedUntil`: Date (Optional) - If the conversation is muted, until when.
-   `createdAt`: Date
-   `updatedAt`: Date

**Example:**
```json
{
  "_id": ObjectId("60c72b4f9b1e8a3f9c8b4569"),
  "adminId": ObjectId("60c72b2f9b1e8a3f9c8b4567"),
  "jid": "1234567890@s.whatsapp.net",
  "name": "John Doe",
  "unreadCount": 2,
  "lastMessageTimestamp": ISODate("2025-05-07T12:30:00Z"),
  "lastMessageSnippet": "Hello there!",
  "archived": false,
  "pinned": true,
  "createdAt": ISODate("2025-05-07T11:30:00Z"),
  "updatedAt": ISODate("2025-05-07T12:30:00Z")
}
```

### 4. `messages` Collection

Stores individual chat messages. Messages are linked to a conversation.

-   `_id`: ObjectId (Primary Key)
-   `conversationId`: ObjectId (ForeignKey referencing `conversations._id`, Indexed) - Links the message to a conversation.
-   `adminId`: ObjectId (ForeignKey referencing `admins._id`)
-   `messageId`: String (Unique, Indexed) - The unique ID of the message from WhatsApp (e.g., Baileys `key.id`).
-   `jid`: String (Indexed) - The JID of the sender or receiver in the context of this message (can be the admin's number or the contact's JID).
-   `senderJid`: String (Indexed) - The JID of the actual sender of the message.
-   `recipientJid`: String (Indexed) - The JID of the recipient of the message.
-   `fromMe`: Boolean - True if the message was sent by the linked WhatsApp account (admin), false otherwise.
-   `type`: String (e.g., "text", "image", "audio", "video", "document", "sticker", "location") - Type of the message content.
-   `content`: Object - The actual message content. Structure varies by `type`.
    -   For `text`: `{ "text": "Hello world" }`
    -   For `image`: `{ "url": "/path/to/image.jpg", "caption": "Optional caption", "mimetype": "image/jpeg" }` (URL could be a local path if media is downloaded)
-   `timestamp`: Date (Indexed) - Timestamp when the message was sent/received.
-   `status`: String (e.g., "pending", "sent", "delivered", "read", "error") - Status of an outgoing message.
-   `quotedMessageId`: String (Optional) - If this message is a reply, the ID of the message being quoted.
-   `isAutoReply`: Boolean (Default: false) - Indicates if this message was sent by the auto-reply system.
-   `createdAt`: Date
-   `updatedAt`: Date

**Example (Text Message):**
```json
{
  "_id": ObjectId("60c72b5f9b1e8a3f9c8b456a"),
  "conversationId": ObjectId("60c72b4f9b1e8a3f9c8b4569"),
  "adminId": ObjectId("60c72b2f9b1e8a3f9c8b4567"),
  "messageId": "UNIQUE_MSG_ID_FROM_WHATSAPP_1",
  "jid": "1234567890@s.whatsapp.net",
  "senderJid": "1234567890@s.whatsapp.net",
  "recipientJid": "admin_phone_number@s.whatsapp.net",
  "fromMe": false,
  "type": "text",
  "content": {
    "text": "Hello there!"
  },
  "timestamp": ISODate("2025-05-07T12:30:00Z"),
  "status": "read", // For incoming, could be just 'received' or 'read' if app marks it
  "createdAt": ISODate("2025-05-07T12:30:00Z"),
  "updatedAt": ISODate("2025-05-07T12:30:00Z")
}
```

### 5. `auto_replies` Collection

Stores rules for automatic replies.

-   `_id`: ObjectId (Primary Key)
-   `adminId`: ObjectId (ForeignKey referencing `admins._id`)
-   `keyword`: String (Indexed) - The keyword or phrase that triggers the auto-reply. Could also support regex patterns.
-   `replyMessage`: String - The message content to be sent as a reply.
-   `matchType`: String (e.g., "exact", "contains", "startsWith", "regex") - How the keyword should be matched.
-   `caseSensitive`: Boolean (Default: false)
-   `enabled`: Boolean (Default: true) - Whether this auto-reply rule is active.
-   `priority`: Number (Default: 0) - For ordering if multiple rules match (lower number = higher priority).
-   `createdAt`: Date
-   `updatedAt`: Date

**Example:**
```json
{
  "_id": ObjectId("60c72b6f9b1e8a3f9c8b456b"),
  "adminId": ObjectId("60c72b2f9b1e8a3f9c8b4567"),
  "keyword": "hello",
  "replyMessage": "Hi there! How can I help you today?",
  "matchType": "contains",
  "caseSensitive": false,
  "enabled": true,
  "priority": 0,
  "createdAt": ISODate("2025-05-07T09:00:00Z"),
  "updatedAt": ISODate("2025-05-07T09:30:00Z")
}
```

## Relationships

-   One `admin` can have one `whatsapp_session` (for the current single-admin scope).
-   One `admin` can have many `conversations`.
-   One `admin` can have many `messages` (indirectly through conversations).
-   One `admin` can have many `auto_replies`.
-   One `conversation` can have many `messages`.

## Indexing Strategy (Summary)

-   **admins**: `username` (unique)
-   **whatsapp_sessions**: `sessionId` (unique), `adminId`
-   **conversations**: `jid` (unique), `adminId`, `lastMessageTimestamp`
-   **messages**: `messageId` (unique), `conversationId`, `adminId`, `jid`, `senderJid`, `recipientJid`, `timestamp`
-   **auto_replies**: `keyword`, `adminId`, `enabled`

This schema provides a foundation for the WhatsApp management tool, focusing on the MVP features identified: admin login, QR linking, chat interface, and basic auto-replies. It's designed to be extensible for future enhancements.

