# ChatGPT Clone

## ✨ Features

### ⚙️ Backend API (`chatgpt-api`)

* **API Framework:** Built with [FastAPI](https://fastapi.tiangolo.com/), featuring versioned routes under `/api/v1`.
* **Structured LLM Output:**[Pydantic-AI](https://github.com/pydantic/pydantic-ai) framework for structured interactions with LLMs, with multi-provider fallback (Azure OpenAI, OpenAI, Gemini)
* **Real-time Streaming:** Implements Server-Sent Events (SSE) to stream chat responses (`event: delta|done|error`) for a real-time, token-by-token user experience.
* **Agentic Tools:** The LLM agent is equipped with tools to access real-time information:
    * `duckduckgo_search`: Fetches current events and information from the web.
    * `scrape_website`: Reads the content of a webpage for detailed context.
* **Database Migrations:** Use [Alembic](https://alembic.sqlalchemy.org/en/latest/) for version-controlled database schema migrations.
* **API Authentication:** All API endpoints are protected using JWT (JSON Web Tokens). Users obtain a token via the secure login endpoint to authenticate subsequent requests.
* **Robust Logging & Error Handling:** Centralized exception handlers provide structured JSON error messages for API, database, or application failures. Logs are automatically rotated and stored in `chatgpt-api-logs/` (`info.log`, `warn.log`, `error.log`).
* **Conversation Management:**
    * Loads message history from the database for persistent conversations.
    * Intelligently trims long message histories to fit within the LLM's context window.
    * Automatically generates a concise title for new conversations using LLM.
* **Testing:** Includes a test suite using `pytest`.

### 🌐 Frontend Web (`chatgpt-web`)

* **UI Framework:** Built with [Next.js](https://nextjs.org/) and React, using a component-based architecture.
* **Real-time Response Display:** Consumes the backend's SSE stream to display assistant replies progressively.
* **Typing Effect:** Renders streamed content with a "typing" animation in the assistant's message bubble.
* **Advanced UI/UX:**
    * Loading indicators for messages and conversation history.
    * "Sticky scroll" keeps the chat at the bottom as new messages arrive.
    * An on-demand "Scroll to Bottom" button appears when you scroll up.
    * Display Error notifications for any service failures.
* **Responsive Design:** A responsive layout ensures a seamless experience on both mobile and desktop.
* **Rich Content Rendering:**
    * Full Markdown support for assistant messages via `remark-gfm`.
    * Syntax highlighting for code blocks using `rehype-highlight`.
* **Personalization:**
    * **Dark Mode:** Support switch between light and dark themes.
    * **Timestamps:** Displays a formatted timestamp for each message.
    * **Automatic Conversation Switching:** Auto switches to the new conversation view after the first message is sent.

## Demo

```HTML
<video width="320" height="240" controls>
    <source src="chatgpt-demo.mp4" type="video/mp4">
</video>
```

## 📁 Project Structure

The project is organized into two main parts: `chatgpt-api` for the backend and `chatgpt-web` for the frontend.

### `chatgpt-api` Structure

```
chatgpt-api/
├── alembic/                   # Alembic migration scripts
├── app/
│   ├── api/
│   │   └── v1/
│   │       ├── chat.py         # /chat endpoint for streaming
│   │       ├── conversation.py # /conversations endpoints
│   │       └── user.py         # /register, /login, /logout endpoints
│   ├── core/
│   │   ├── config.py         # Settings management (.env loading)
│   │   ├── constants.py      # Application-wide constants
│   │   ├── enums.py          # Enums like MessageRole, SSEventType
│   │   ├── exception_handlers.py # Global exception handlers
│   │   └── logging_config.py # Configuration for structured logging
│   ├── db/
│   │   └── session.py        # SQLAlchemy async session setup
│   ├── exceptions/
│   │   ├── app_error.py      # Base application errors
│   │   └── http_exceptions.py# Custom HTTP exceptions (e.g., 401, 404)
│   ├── llm/
│   │   ├── agent.py          # Agent setup, system prompt, tool/model configuration
│   │   └── tools.py          # Agent tools (DuckDuckGo Search, Scrape Website)
│   ├── models/               # SQLAlchemy models
│   │   ├── user.py           
│   │   ├── conversation.py 
│   │   └── message.py        
│   ├── schemas/
│   │   ├── chat.py           # Pydantic schemas for chat/conversation data
│   │   └── user.py           # Pydantic schemas for user/token data
│   ├── services/
│   │   ├── chat.py           # Business logic for chat operations
│   │   ├── security.py       # Password hashing and JWT logic
│   │   └── user.py           # Business logic for user operations
│   └── main.py               # FastAPI application entry point
├── .env.example              # Environment variable template
├── pyproject.toml            # Project dependencies and tool configuration for uv
└── ...
```

### `chatgpt-web` Structure

```
chatgpt-web/
└── app/
├── api/
│   ├── client.ts         # Functions for making API requests to the backend
│   └── types.ts          # Types for API responses
├── components/
│   ├── ui/
│   │   └── icons.tsx     # SVG icon components
│   ├── ChatArea.tsx      # Main component for displaying messages
│   ├── MessageBubble.tsx # Component for a single chat message
│   ├── Sidebar.tsx       # Component for conversation history
│   └── ...               # Other UI components
├── contexts/
│   ├── AuthContext.tsx   # React Context for managing authentication state
│   └── ThemeContext.tsx  # React Context for managing light/dark mode
├── hooks/
│   ├── useChat.tsx       # Custom hook for chat logic and streaming
│   └── useConversations.tsx # Custom hook for managing conversation list
├── libs/
│   ├── stream.tsx        # Client-side logic for parsing SSE streams
│   └── utils.ts          # Utility functions (e.g., date formatting)
├── chat/
│   └── page.tsx          # The main chat page component
├── login/
│   └── page.tsx          # The login page component
├── register/
│   └── page.tsx          # The registration page component
├── globals.css           # Global styles and TailwindCSS setup
└── layout.tsx            # Root layout for the application
├── .env.development          # Default environment variables for development
└── ...
```

## 📋 Prerequisites

* **Database:** A running PostgreSQL server.
* **Python Tooling:** Python (to install `uv`).
* **Frontend:** Node.js 18+ and npm (or yarn/pnpm).

## 🚀 Getting Started

Follow these steps to set up and run the project locally.

### 1. Backend Setup (`chatgpt-api`)

1.  **Navigate to the API directory:**
    ```bash
    cd chatgpt-api
    ```

2.  **Create Virtual Environment:**

    First, ensure you have `uv` installed (`pip install uv`). Then, create and activate the virtual environment:
    ```bash
    # This creates a .venv folder with Python 3.12
    uv venv --python 3.12
    ```

3.  **Configure Environment Variables:**

    Copy the example file.
    ```bash
    cp .env.example .env
    ```
    Open `.env` and set the following values:
    * `DATABASE_URL`: Your PostgreSQL connection string (e.g., `postgresql+asyncpg://user:password@localhost:5432/chatgpt_db`).
    * `JWT_SECRET_KEY`: **Important:** Change the default value to a long, random, secret string for security.
    * **LLM Provider:** Fill in the details for at least one provider (Gemini, OpenAI, or Azure).


4.  **Install Dependencies:**
    ```bash
    uv pip sync ./pyproject.toml
    ```

5.  **Run Database Migrations:**
    Ensure your PostgreSQL server is running and the database from your `DATABASE_URL` exists.
    ```bash
    alembic upgrade head
    ```

6.  **Run Tests:**
    Verify the setup by running the test suite.
    ```bash
    uv run pytest
    ```

7.  **Start the API Server:**

    ```bash
    # For development with auto-reload
    uv run fastapi dev

    # For production
    uv run fastapi run
    ```
    The API will be available at `http://127.0.0.1:8000`.

### 2. Frontend Setup (`chatgpt-web`)

1.  **Navigate to the web directory:**
    ```bash
    cd chatgpt-web
    ```

2.  **(Optional) Configure Environment Variables:**

    The project uses `.env.development` for default settings. For local overrides, it's standard practice to create a `.env.local` file.
    ```bash
    # (Optional) Create this file only if you need to change the API URL
    cp .env.development .env.local
    ```
    The default `NEXT_PUBLIC_API_BASE_URL` is `http://127.0.0.1:8000`. You only need to edit/create `.env.local` if your backend is running on a different URL.


3.  **Install Dependencies:**
    ```bash
    npm install
    ```

4.  **Start the Development Server:**
    ```bash
    npm run dev
    ```
    The web application will be available at `http://localhost:3000`.
