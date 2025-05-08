# Frontend Design: Components and Pages

This document outlines the frontend components and page structure for the WhatsApp management website, to be built with Next.js and Tailwind CSS.

## Overall Layout

-   A main layout component will wrap all authenticated pages, including a sidebar for navigation and a main content area.
-   The login page will have a separate, simpler layout.

## Key Pages

### 1. Login Page (`/login`)

-   **Purpose**: Allows the admin to log in.
-   **Components**:
    -   `LoginForm`: Contains input fields for username and password, a submit button, and error message display.
-   **Functionality**:
    -   Submits credentials to `POST /api/v1/auth/login`.
    -   On success, stores JWT and redirects to the dashboard (`/`).
    -   Displays errors on failure.

### 2. Dashboard / Main Chat Interface (`/` or `/chat`)

-   **Purpose**: Main interface for managing WhatsApp, displaying conversations and messages.
-   **Layout**: Sidebar + Main Content Area.
-   **Components**:
    -   **Sidebar (`SidebarComponent`)**:
        -   `ConversationList`: Displays a scrollable list of `ConversationItem` components.
            -   `ConversationItem`: Shows contact/group name, last message snippet, timestamp, and unread count. Clicking opens the chat in the main area.
        -   Navigation links (e.g., to Auto-Replies, Settings).
        -   User/Session status indicator (e.g., connected phone number, logout button).
    -   **Main Content Area (`ChatViewComponent`)**:
        -   `ChatHeader`: Displays current chat contact/group name, status (online/typing), and options (e.g., search messages, contact info - future).
        -   `MessageList`: A scrollable area displaying `MessageItem` components.
            -   `MessageItem`: Renders individual messages (text, image, etc.), differentiating between incoming and outgoing messages. Shows timestamp and delivery status for outgoing messages.
        -   `MessageInput`: Text input field for typing messages, send button, and potentially buttons for attachments (future).
    -   **WhatsApp Connection Status/QR Display (`ConnectionManagerComponent`)**:
        -   Initially, if not connected, this component (or a modal) will prominently display the QR code for linking.
        -   Shows connection status (e.g., "Connecting...", "Connected as +1234567890", "Disconnected. Retry?").
        -   Listens to WebSocket events for QR updates and status changes.
-   **Functionality**:
    -   Fetches conversations via `GET /api/v1/conversations`.
    -   Fetches messages for the selected conversation via `GET /api/v1/messages/:jid`.
    -   Sends messages via `POST /api/v1/messages/send`.
    -   Real-time updates for new messages, message statuses, and conversation list via Socket.IO.
    -   Handles QR code display and session connection status.

### 3. Auto-Replies Management Page (`/auto-replies`)

-   **Purpose**: Allows the admin to create, view, edit, and delete auto-reply rules.
-   **Layout**: Sidebar + Main Content Area.
-   **Components**:
    -   `AutoReplyList`: Displays a table or list of `AutoReplyItem` components.
        -   `AutoReplyItem`: Shows keyword, reply message, status (enabled/disabled), and action buttons (edit, delete).
    -   `AutoReplyForm`: A form (possibly in a modal or separate section) for creating/editing auto-reply rules. Includes fields for keyword, reply message, match type, case sensitivity, and enabled status.
-   **Functionality**:
    -   Fetches auto-reply rules via `GET /api/v1/autoreplies`.
    -   Creates rules via `POST /api/v1/autoreplies`.
    -   Updates rules via `PUT /api/v1/autoreplies/:id`.
    -   Deletes rules via `DELETE /api/v1/autoreplies/:id`.

## Reusable UI Components

-   **`Button`**: Standardized button component with variants (primary, secondary, danger).
-   **`Input`**: Standardized text input field.
-   **`Modal`**: For displaying forms (e.g., new auto-reply) or important information (e.g., QR code initially).
-   **`Spinner`**: Loading indicator.
-   **`Alert`**: For displaying success or error messages.
-   **`Card`**: Generic card component for grouping content.
-   **`Tooltip`**: For hover information.
-   **`DropdownMenu`**: For action menus (e.g., on conversation items or message items).

## State Management

-   React Context API or a lightweight state management library (like Zustand or Jotai) will be used for global state (e.g., admin auth status, WhatsApp connection status, selected conversation).
-   Local component state for form inputs, UI toggles, etc.

## Styling

-   Tailwind CSS for utility-first styling, ensuring responsive design.
-   Custom CSS modules for component-specific styles where necessary.
-   Icons (e.g., Lucide Icons or Heroicons).

## Real-time Communication

-   Socket.IO client will be integrated to listen for and emit events related to:
    -   WhatsApp connection status and QR codes.
    -   New messages and message status updates.
    -   Conversation list updates.
    -   Presence updates (if implemented).

## Key Frontend Logic Points

-   **Authentication Flow**: Securely handling JWT, redirecting unauthenticated users, managing token expiry/refresh (if applicable).
-   **Error Handling**: Gracefully displaying API errors and WebSocket connection issues to the user.
-   **Optimistic Updates**: For actions like sending a message, update the UI immediately and then confirm/revert based on the server response.
-   **Data Fetching**: Using `fetch` or a library like SWR/React Query for efficient data fetching, caching, and revalidation.
-   **Infinite Scrolling/Pagination**: For message lists and conversation lists to handle large amounts of data.
-   **Form Validation**: Client-side validation for all forms before submitting to the API.

This frontend design aims to create a user-friendly and responsive interface for managing WhatsApp communications and auto-replies, leveraging the power of Next.js for performance and developer experience, and Tailwind CSS for rapid UI development.
