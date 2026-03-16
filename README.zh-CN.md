[简体中文](./README.zh-CN.md) | [English](./README.md)

# ChatGPT Clone

这是一个基于 **FastAPI**、**Next.js** 和 **PostgreSQL** 构建的全栈 ChatGPT 风格应用。它提供现代化的 AI 聊天体验，支持**实时流式响应**、**持久化历史会话**、**JWT 身份验证**以及**多 LLM 提供商支持**。

该项目由以下两部分组成：

- **`chatgpt-api`** — FastAPI 后端，负责身份验证、会话存储、LLM 编排、SSE 流式传输和智能体（Agent）工具集成。
- **`chatgpt-web`** — Next.js 前端，提供响应式聊天 UI，支持 Markdown 渲染、代码高亮、深色模式以及流畅的会话切换。

基于 **Pydantic-AI**，该应用支持多个 LLM 提供商，包括 **Azure OpenAI**、**OpenAI** 和 **Gemini**，并内置回退（Fallback）机制。它还包含**网络搜索**和**网站抓取**等智能体工具，通过获取实时外部信息来扩展助手的能力。

本仓库可作为构建生产级 AI 聊天系统（涵盖前后端）的实用参考。

## 演示
[https://github.com/user-attachments/assets/0faa7a0d-6ce3-49d3-bf3a-c33ff0dbf4ce](https://github.com/user-attachments/assets/0faa7a0d-6ce3-49d3-bf3a-c33ff0dbf4ce)

## ✨ 特性

### ⚙️ 后端 API (`chatgpt-api`)

* **API 框架：** 基于 [FastAPI](https://fastapi.tiangolo.com/) 构建，提供位于 `/api/v1` 下的版本化路由。
* **结构化 LLM 输出：** 使用 [Pydantic-AI](https://github.com/pydantic/pydantic-ai) 框架与 LLM 进行结构化交互，支持多提供商回退（Azure OpenAI、OpenAI、Gemini）。
* **实时流式传输：** 实现 Server-Sent Events (SSE) 来流式传输聊天响应（`event: delta|done|error`），提供逐字生成的实时用户体验。
* **智能体工具：** LLM 智能体配备了获取实时信息的工具，包括用于获取网络时事信息的 `duckduckgo_search`，以及用于读取网页详细内容的 `scrape_website`。
* **数据库迁移：** 使用 [Alembic](https://alembic.sqlalchemy.org/en/latest/) 进行版本控制的数据库 Schema 迁移。
* **API 身份验证：** 所有 API 端点均受 JWT (JSON Web Tokens) 保护。用户通过安全的登录端点获取令牌，以验证后续请求。
* **强大的日志与错误处理：** 集中式异常处理程序为 API、数据库或应用故障提供结构化的 JSON 错误信息。日志会自动轮转并存储在 `chatgpt-api-logs/` 目录中（`info.log`、`warn.log`、`error.log`）。
* **会话管理：** 从数据库加载消息历史以实现持久化；智能裁剪长历史记录以适应 LLM 上下文窗口；并使用 LLM 自动为新会话生成简明标题。
* **测试：** 包含基于 `pytest` 的测试套件。

### 🌐 前端 Web (`chatgpt-web`)

* **UI 框架：** 基于 [Next.js](https://nextjs.org/) 和 React 构建，采用组件化架构。
* **实时响应显示：** 消费后端的 SSE 流，渐进式显示助手的回复。
* **打字效果：** 在助手的消息气泡中以“打字”动画渲染流式内容。
* **高级 UI/UX：** 提供消息和历史记录的加载指示器；“粘性滚动”保持最新消息可见；支持按需显示的“滚动到底部”按钮；以及服务故障错误通知。
* **响应式设计：** 响应式布局确保在移动端和桌面端都能获得无缝体验。
* **富文本内容渲染：** 通过 `remark-gfm` 全面支持 Markdown 渲染，并使用 `rehype-highlight` 为代码块提供语法高亮。
* **个性化：** 支持深/浅色模式切换；显示每条消息的格式化时间戳；并在发送首条消息后自动切换至新会话视图。

## 📁 项目结构

项目主要分为两部分：用于后端的 `chatgpt-api` 和用于前端的 `chatgpt-web`。

### `chatgpt-api` 结构

```text
chatgpt-api/
├── alembic/                   # Alembic 迁移脚本
├── app/
│   ├── api/
│   │   └── v1/
│   │       ├── chat.py         # /chat 端点（用于流式传输）
│   │       ├── conversation.py # /conversations 端点
│   │       └── user.py         # /register, /login, /logout 端点
│   ├── core/
│   │   ├── config.py         # 配置管理（加载 .env）
│   │   ├── constants.py      # 全局常量
│   │   ├── enums.py          # 枚举类（如 MessageRole, SSEventType）
│   │   ├── exception_handlers.py # 全局异常处理
│   │   └── logging_config.py # 结构化日志配置
│   ├── db/
│   │   └── session.py        # SQLAlchemy 异步会话设置
│   ├── exceptions/
│   │   ├── app_error.py      # 基础应用错误
│   │   └── http_exceptions.py# 自定义 HTTP 异常（如 401, 404）
│   ├── llm/
│   │   ├── agent.py          # 智能体设置、系统提示词、工具/模型配置
│   │   └── tools.py          # 智能体工具（DuckDuckGo 搜索，网站抓取）
│   ├── models/               # SQLAlchemy 数据模型
│   │   ├── user.py           
│   │   ├── conversation.py 
│   │   └── message.py        
│   ├── schemas/
│   │   ├── chat.py           # 用于聊天/会话数据的 Pydantic 验证模型
│   │   └── user.py           # 用于用户/令牌数据的 Pydantic 验证模型
│   ├── services/
│   │   ├── chat.py           # 聊天操作的业务逻辑
│   │   ├── security.py       # 密码哈希与 JWT 逻辑
│   │   └── user.py           # 用户操作的业务逻辑
│   └── main.py               # FastAPI 应用入口点
├── .env.example              # 环境变量模板
├── pyproject.toml            # 项目依赖及 uv 工具配置
└── ...
```

### `chatgpt-web` 结构

```text
chatgpt-web/
└── app/
├── api/
│   ├── client.ts         # 向后端发起 API 请求的函数
│   └── types.ts          # API 响应的类型定义
├── components/
│   ├── ui/
│   │   └── icons.tsx     # SVG 图标组件
│   ├── ChatArea.tsx      # 显示消息的主要组件
│   ├── MessageBubble.tsx # 单条聊天消息组件
│   ├── Sidebar.tsx       # 会话历史侧边栏组件
│   └── ...               # 其他 UI 组件
├── contexts/
│   ├── AuthContext.tsx   # 管理认证状态的 React Context
│   └── ThemeContext.tsx  # 管理深/浅色模式的 React Context
├── hooks/
│   ├── useChat.tsx       # 处理聊天逻辑与流式传输的自定义 Hook
│   └── useConversations.tsx # 管理会话列表的自定义 Hook
├── libs/
│   ├── stream.tsx        # 解析 SSE 流的客户端逻辑
│   └── utils.ts          # 实用工具函数（如日期格式化）
├── chat/
│   └── page.tsx          # 聊天主页组件
├── login/
│   └── page.tsx          # 登录页组件
├── register/
│   └── page.tsx          # 注册页组件
├── globals.css           # 全局样式与 TailwindCSS 设置
├── layout.tsx            # 应用根布局
├── .env.development      # 开发环境默认环境变量
└── ...
```

## 📋 前置要求

* **数据库：** 运行中的 PostgreSQL 服务器。
* **Python 工具链：** Python（用于安装 `uv`）。
* **前端：** Node.js 18+ 及 npm（或 yarn/pnpm）。

## 🚀 快速开始

请按照以下步骤在本地设置并运行项目。

### 1. 后端设置 (`chatgpt-api`)

1. **进入 API 目录：**
   ```bash
   cd chatgpt-api
   ```

2. **创建虚拟环境：**
   首先，确保你已安装 `uv`（`pip install uv`）。空间，然后创建并激活虚拟环境：
   ```bash
   # (可选) 如果没有 Python 3.12，请先安装
   uv python install 3.12
   
   # 基于 Python 3.12 创建虚拟环境
   uv venv --python 3.12

   # 激活环境 (Linux/macOS)
   source .venv/bin/activate
   # 或在 Windows 上 (PowerShell)
   .venv\Scripts\activate
   ```

3. **配置环境变量：**
   复制示例文件。
   ```bash
   cp .env.example .env
   ```
   打开 `.env` 并设置以下值：
   * **DATABASE_URL**：完整的 PostgreSQL 连接字符串。异步数据库操作需要 `asyncpg` 驱动。
     * **格式示例：** `postgresql+asyncpg://YOUR_USER:YOUR_PASSWORD@localhost:5432/chatgpt_db`
   * **LLM 提供商：** 填写至少一个支持的 LLM 提供商（Gemini、OpenAI 或 Azure）的详细信息。

4. **安装依赖：**
   ```bash
   uv pip sync ./pyproject.toml
   ```

5. **运行数据库迁移：**
   确保你的 PostgreSQL 服务器正在运行，然后**创建**在你的 `DATABASE_URL` 中指定的数据库（例如 `chatgpt_db`）。
   ```bash
   uv run alembic upgrade head
   ```

6. **运行测试：**
   通过运行测试套件来验证设置。
   ```bash
   uv run pytest
   ```

7. **启动 API 服务器：**
   ```bash
   uv run fastapi run
   ```
   API 将运行在 `http://127.0.0.1:8000`。

### 2. 前端设置 (`chatgpt-web`)

1. **进入 web 目录：**
   ```bash
   cd chatgpt-web
   ```

2. **(可选) 配置环境变量：**
   项目使用 `.env.development` 作为默认设置。如需本地覆盖，通常会创建一个 `.env.local` 文件。
   ```bash
   # (可选) 仅当你需要更改 API URL 时才创建此文件
   cp .env.development .env.local
   ```
   默认的 `NEXT_PUBLIC_API_BASE_URL` 是 `http://127.0.0.1:8000`。只有当你的后端运行在其他 URL 上时，才需要编辑/创建 `.env.local`。

3. **安装依赖：**
   ```bash
   npm install
   ```

4. **启动开发服务器：**
   ```bash
   npm run dev
   ```
   Web 应用将运行在 `http://localhost:3000`。
