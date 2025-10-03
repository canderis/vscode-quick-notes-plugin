# Notes Sidebar Extension

A VS Code extension that adds a "Notes" tab to the sidebar where you can take persistent notes that are saved globally across all projects.
Project inspired by RuneLite

<img width="1728" height="1117" alt="Screenshot 2025-10-03 at 5 18 15 PM" src="https://github.com/user-attachments/assets/55311bf3-050c-4545-9013-c92b2716a1da" />


## Features

- 📝 Persistent notes that work across all VS Code projects
- 🎨 Styled to match VS Code's theme
- ⚡ Auto-save functionality
- 🔄 Global state management

## How to Use

1. Install the extension
2. Look for the "Notes" tab in the sidebar (next to Explorer, Search, etc.)
3. Click on the Notes item to open the notes panel
4. Start typing - your notes will be automatically saved
5. Your notes persist across different projects and VS Code sessions

## Development

To build and test the extension:

```bash
npm install
npm run compile
```

To package the extension:

```bash
npm install -g vsce
vsce package
```

## Installation

1. Package the extension: `vsce package`
2. Install the generated `.vsix` file in VS Code
3. Or use F5 to run the extension in a new Extension Development Host window
