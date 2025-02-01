# Code-Canvas

Overview

This is a VS Code extension that allows users to take notes directly within the code editor. Notes are displayed in the gutter for a clean and unobtrusive experience, ensuring they do not interfere with the actual code. 

Features

📝 Inline Notes in the Gutter – Write notes linked to specific lines of code.

🔍 Persistent Storage – Notes remain saved even after closing the editor.

🎨 Minimalist Design – Keeps the coding environment clean and distraction-free.

Installation

Clone the repository:

git clone https://github.com/your-username/vscode-notes-extension.git
cd vscode-notes-extension

Install dependencies:

npm install

Open the project in VS Code.

Press F5 to launch a new VS Code instance with the extension loaded.

Usage

Right-click on a line number to add a note.

Click the note icon in the gutter to expand/minimize the note.

Toggle visibility using the command palette (Cmd + Shift + P / Ctrl + Shift + P) and searching for Toggle Notes.

Notes are stored locally to persist between sessions.

Configuration

The extension can be customized via VS Code settings. Possible configurations include:

Changing the note icon.

Adjusting the maximum note length.

Enabling/disabling auto-hide functionality.

Development

To contribute or modify the extension:

Install dependencies using npm install.

Make changes in src/extension.ts.

Run npm run build to compile the changes.

Test by pressing F5 in VS Code.

Roadmap

✅ Basic note-taking functionality

🔄 Sync notes across different workspaces

🌍 Cloud storage integration for syncing between devices

License

This project is licensed under the MIT License.

