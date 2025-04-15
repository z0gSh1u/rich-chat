# RichChat

A desktop chat application built with Tauri, React, and Material UI, designed to interact with Large Language Models (LLMs).

## Features

- **Tauri Backend:** Cross-platform desktop application powered by Rust.
- **React Frontend:** User interface built with React, TypeScript, and Vite.
- **Material UI:** Modern UI components for a clean look and feel.
- **LLM Integration:** Connects to OpenAI-compatible APIs (currently configured for DeepSeek).
- **Streaming Responses:** Displays AI responses incrementally as they arrive.
- **Persistent Configuration:** Saves API keys securely using a local SQLite database.
- **Modular UI:** Left panel for chat interface, right panel for configuration and tools (Calendar, Portfolio, Investment Style, System Config).

## Technologies

- **Framework:** Tauri (v2)
- **Frontend:** React, TypeScript, Vite, Material UI (MUI)
- **Backend:** Rust
- **Database:** SQLite (via `rusqlite`)
- **Package Manager:** pnpm

## Development Setup

1.  **Prerequisites:**

    - Install [Rust](https://www.rust-lang.org/tools/install)
    - Install [Node.js](https://nodejs.org/) (which includes npm)
    - Install pnpm: `npm install -g pnpm`
    - Follow the Tauri [prerequisites guide](https://tauri.app/v2/guides/getting-started/prerequisites) for your specific OS (WebView2 for Windows, etc.).

2.  **Clone the repository:**

    ```bash
    git clone https://github.com/z0gSh1u/richchat.git
    cd richchat
    ```

3.  **Install dependencies:**

    ```bash
    pnpm install
    ```

4.  **Run the development server:**

    ```bash
    pnpm tauri dev
    ```

    This will build the Rust backend and start the Vite frontend dev server.

5.  **Configuration:**
    - Open the application.
    - Navigate to the `⚙️ Configuration` panel on the right.
    - Enter your LLM API Key (e.g., from DeepSeek) and click "Save Token". The key will be saved locally.

## Building for Production

To build the application for distribution:

```bash
pnpm tauri build
```

The executable/installer will be located in `src-tauri/target/release/bundle/`.
