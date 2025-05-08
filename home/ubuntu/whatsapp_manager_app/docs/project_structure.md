# Project Structure Plan

This document outlines the planned directory and file structure for the WhatsApp management website. The project will be a monorepo-like structure or two separate linked projects (frontend and backend) for clarity, but for initial setup, we can conceptualize it as a single project with distinct `frontend` and `backend` directories.

## Root Directory (`whatsapp_manager_app/`)

```
whatsapp_manager_app/
├── backend/                  # Node.js, Express.js, Baileys, Socket.IO, MongoDB
├── frontend/                 # Next.js, Tailwind CSS, Socket.IO Client
├── docs/                     # Design documents (like this one, db_schema.md, api_design.md, etc.)
├── .gitignore
├── README.md
└── todo.md                   # Task checklist (already created)
```

### 1. Backend Directory (`backend/`)

This directory will house the Node.js server application.

```
backend/
├── src/
│   ├── api/
│   │   ├── routes/           # Express routes for different resources
│   │   │   ├── auth.routes.js
│   │   │   ├── whatsapp.routes.js
│   │   │   ├── conversation.routes.js
│   │   │   ├── message.routes.js
│   │   │   └── autoreply.routes.js
│   │   ├── controllers/      # Logic for handling requests
│   │   │   ├── auth.controller.js
│   │   │   ├── whatsapp.controller.js
│   │   │   ├── conversation.controller.js
│   │   │   ├── message.controller.js
│   │   │   └── autoreply.controller.js
│   │   └── middlewares/      # Express middlewares (e.g., auth, error handling)
│   │       ├── auth.middleware.js
│   │       └── error.middleware.js
│   ├── config/               # Configuration files (db, environment variables)
│   │   ├── index.js          # Main config export
│   │   └── db.config.js      # MongoDB connection setup
│   ├── models/               # Mongoose schemas for MongoDB
│   │   ├── admin.model.js
│   │   ├── whatsappSession.model.js
│   │   ├── conversation.model.js
│   │   ├── message.model.js
│   │   └── autoReply.model.js
│   ├── services/             # Business logic and interactions with external services
│   │   ├── whatsapp.service.js # Baileys integration, QR code, message sending/receiving
│   │   └── autoreply.service.js # Logic for matching and sending auto-replies
│   ├── sockets/              # Socket.IO server-side event handlers
│   │   └── index.js          # Main Socket.IO setup and event registration
│   ├── utils/                # Utility functions (e.g., password hashing, JWT helpers)
│   │   ├── jwt.utils.js
│   │   └── password.utils.js
│   ├── app.js                # Express application setup (middlewares, routes)
│   └── server.js             # Main server entry point (HTTP server, Socket.IO integration)
├── .env.example            # Example environment variables
├── .eslintrc.js            # ESLint configuration
├── package.json
└── package-lock.json
```

**Key Backend Components:**

-   **`src/api/routes/`**: Defines API endpoints.
-   **`src/api/controllers/`**: Handles request logic, interacts with services.
-   **`src/models/`**: Mongoose schemas for database interaction.
-   **`src/services/whatsapp.service.js`**: Core Baileys logic.
-   **`src/sockets/`**: Real-time communication logic with Socket.IO.
-   **`server.js`**: Starts the HTTP and WebSocket servers.

### 2. Frontend Directory (`frontend/`)

This directory will house the Next.js client application.

```
frontend/
├── public/                   # Static assets (images, fonts, etc.)
│   └── favicon.ico
├── src/
│   ├── app/                  # Next.js App Router structure
│   │   ├── (auth)/           # Route group for authentication pages
│   │   │   └── login/
│   │   │       └── page.js
│   │   ├── (main)/           # Route group for authenticated app layout
│   │   │   ├── layout.js       # Main layout with sidebar
│   │   │   ├── page.js         # Dashboard/Chat page
│   │   │   └── auto-replies/
│   │   │       └── page.js
│   │   └── api/              # Next.js API routes (if any, primarily for proxying or simple tasks)
│   │       └── [..nextauth].js # If NextAuth.js is used for client-side session management (alternative to pure JWT)
│   ├── components/             # Reusable UI components
│   │   ├── auth/
│   │   │   └── LoginForm.js
│   │   ├── chat/
│   │   │   ├── ChatView.js
│   │   │   ├── ConversationList.js
│   │   │   ├── ConversationItem.js
│   │   │   ├── MessageList.js
│   │   │   ├── MessageItem.js
│   │   │   └── MessageInput.js
│   │   ├── common/
│   │   │   ├── Button.js
│   │   │   ├── Modal.js
│   │   │   ├── Sidebar.js
│   │   │   └── Spinner.js
│   │   └── autoreplies/
│   │       ├── AutoReplyList.js
│   │       ├── AutoReplyItem.js
│   │       └── AutoReplyForm.js
│   ├── contexts/               # React Context API for state management
│   │   ├── AuthContext.js
│   │   └── SocketContext.js
│   ├── hooks/                  # Custom React hooks
│   │   ├── useAuth.js
│   │   └── useSocket.js
│   ├── lib/                    # Utility functions, API helpers, Socket.IO client setup
│   │   ├── apiClient.js        # Helper for making API calls to the backend
│   │   └── socketClient.js     # Socket.IO client initialization
│   ├── styles/                 # Global styles (if not solely using Tailwind)
│   │   └── globals.css
│   └── layout.js             # Root layout for Next.js app
├── .env.local.example      # Example environment variables for frontend
├── .eslintrc.json            # ESLint configuration
├── next.config.mjs           # Next.js configuration
├── package.json
├── postcss.config.mjs        # PostCSS configuration (for Tailwind CSS)
├── tailwind.config.mjs       # Tailwind CSS configuration
└── tsconfig.json             # TypeScript configuration (if using TypeScript)
```

**Key Frontend Components:**

-   **`src/app/`**: Page routes and layouts using Next.js App Router.
-   **`src/components/`**: Organized by feature (auth, chat, common, autoreplies).
-   **`src/contexts/`**: Global state management.
-   **`src/lib/apiClient.js`**: Centralized API call logic.
-   **`src/lib/socketClient.js`**: Socket.IO client setup.

### 3. Docs Directory (`docs/`)

-   `database_schema.md` (already created)
-   `api_design.md` (already created)
-   `frontend_design.md` (already created)
-   `project_structure.md` (this file)
-   Other planning or architectural decision records.

## Deployment Considerations

-   **Backend**: Can be deployed as a Node.js application on a VPS, PaaS (like Render, Railway), or run in Termux.
-   **Frontend**: Can be deployed on Vercel (ideal for Next.js), Netlify, or as a static export + Node.js server if self-hosting alongside the backend.
-   For Termux, both frontend (built) and backend can be run using `pm2` or similar process managers.

This structure aims for a clear separation of concerns, making the project easier to develop, test, and maintain. It aligns with common practices for full-stack JavaScript applications.
