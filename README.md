<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="./resources/logo.png">
  <img src="./resources/logo.png" alt="Repaper Logo — Paper Note Taking App" height="100" />
</picture>

# Repaper — Paper-Fast Local Note Taking App & Markdown Notes Workspace

<p align="center">
  <strong>The Ultra-Fast, Local-First Paper-Like Note Taking App and Personal Knowledge Workspace</strong><br />
  <em>Experience the distraction-free fluid speed of physical paper combined with local markdown notes, bidirectional graph linking, and zero cloud lock-in.</em>
</p>

<p align="center">
  <a href="https://hawkdotdev.github.io/repaper/"><img src="https://img.shields.io/badge/Live%20App-Try%20Repaper-success?style=for-the-badge&logo=googlechrome&logoColor=white" alt="Try Repaper Note Taking App Live" /></a>
  <a href="https://github.com/HawkdotDev/repaper/stargazers"><img src="https://img.shields.io/github/stars/HawkdotDev/repaper?style=for-the-badge&color=ffd700" alt="GitHub Stars" /></a>
  <a href="https://github.com/HawkdotDev/repaper/blob/main/LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge" alt="License: MIT" /></a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Note%20Taking-Paper--Fast-blueviolet?style=flat-square" alt="Paper-Fast Note Taking" />
  <img src="https://img.shields.io/badge/Notes-Markdown%20%26%20Blocks-38B2AC?style=flat-square" alt="Markdown Notes" />
  <img src="https://img.shields.io/badge/Storage-Local--First%20%26%20Offline-green?style=flat-square" alt="Local First Offline Notes" />
  <img src="https://img.shields.io/badge/Telemetry-Zero%20Tracking-success?style=flat-square" alt="Zero Tracking" />
  <a href="https://react.dev"><img src="https://img.shields.io/badge/React-v19-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React 19" /></a>
  <a href="https://www.typescriptlang.org"><img src="https://img.shields.io/badge/TypeScript-v5.9-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" /></a>
  <a href="https://vite.dev"><img src="https://img.shields.io/badge/Vite-v7-646CFF?style=flat-square&logo=vite&logoColor=white" alt="Vite" /></a>
</p>

<p align="center">
  <a href="#overview">Overview</a> •
  <a href="#why-repaper-for-note-taking">Why Repaper?</a> •
  <a href="#key-features">Key Features</a> •
  <a href="#editor-capabilities">Editor Capabilities</a> •
  <a href="#technology-stack">Tech Stack</a> •
  <a href="#keyboard-shortcuts">Shortcuts</a> •
  <a href="#getting-started">Getting Started</a> •
  <a href="#yaml-frontmatter-spec">Frontmatter</a> •
  <a href="#faq">FAQ</a> •
  <a href="#contributing">Contributing</a>
</p>

<p align="center">
  <img src="./resources/screenshot.png" alt="Repaper Workspace — Paper-Fast Local Note Taking App" width="100%" style="border-radius: 8px; box-shadow: 0 12px 32px rgba(0,0,0,0.35);" />
</p>

</div>

## Overview

**Repaper** is an ultra-fast, local-first paper-like **note taking application** and personal knowledge management (PKM) workspace engineered for developers, researchers, students, and writers.

Taking notes on traditional tools forces an uncomfortable compromise:
- **Physical paper notebooks** offer unbeatable fluid speed and zero cognitive friction, but paper notes cannot be searched, linked, backed up, or rendered with live equations and code.
- **Cloud-based note apps (Notion, Evernote)** lock your notes into proprietary databases with slow load times, privacy concerns, and monthly subscription paywalls.
- **Plain-text markdown editors** protect data ownership but often feel rigid and lack modern block aesthetics, interactive diagrams, and visual banners.

**Repaper solves this dilemma:**
It brings the tactile, distraction-free simplicity of **paper note taking** into a modern, local-first digital workspace. Every note you write is stored directly on your machine as standard, open CommonMark / GitHub Flavored Markdown (`.md`) files—with zero telemetry, zero mandatory accounts, and zero cloud lock-in.

## Key Features

### 1. Paper-Fast Hybrid Block-Markdown Note Taking
- **Fluid Note Writing**: Experience the speed of writing on physical paper with modern block ergonomics: drag-and-drop handles, slash commands, checklists, callouts, and multi-column tables.
- **Bi-Directional Serialization**: Seamlessly transitions between raw CommonMark/GFM markdown and interactive block trees without corrupting your files.
- **Rich Media & Embeds**: Embed YouTube, Vimeo, audio clips, interactive frames, and custom images with inline captions and alignment controls.

### 2. Interconnected Notes & Knowledge Graph
- **Wikilinks Note Syntax**: Link your notes organically using `[[Note Title]]` with instant fuzzy search suggestions.
- **Backlinks & Forward References**: Track inbound and outbound references across your entire notes library automatically.
- **Dynamic Canvas Graph**: Explore your digital brain with hardware-accelerated force-directed graphs highlighting note clusters, hub notes, and orphan pages.

### 3. STEM & Technical Note Taking
- **KaTeX Mathematics**: Native inline equations (`$E=mc^2$`) and multi-line display formulas (`$$\sum_{i=1}^{n} x_i$$`).
- **Mermaid.js Diagrams**: Render live flowcharts, architecture diagrams, sequence charts, and mind maps directly inside your notes.
- **Code Fences with Highlighting**: Syntax highlighting across dozens of programming languages with one-click copy.

### 4. Beautiful Paper Typography & Visual Customization
- **Granular Typography Controls**: Adjust font family (Inter, Roboto, JetBrains Mono, Outfit, Serif, Dyslexic-friendly), font size, line height, letter spacing, font weight, and text alignment per-note or globally.
- **Unsplash Covers & Emojis**: Enrich your notes with custom Unsplash imagery, gradient banners, and icons.
- **Zero-Pollution Frontmatter**: Page styling is preserved cleanly in standard YAML frontmatter blocks at the top of your markdown files.

### 5. Voice Dictation & Audio Notes
- **Hands-Free Note Taking**: Built-in speech-to-text dictation with automatic smart punctuation and capitalization (`Alt + D` / `Alt + V`).
- **Multilingual Support**: Supports voice note taking across English, Hindi, Bengali, Spanish, French, German, and Japanese.

### 6. Power-User Navigation & Shortcuts
- **Quick Switcher (`Ctrl/Cmd + P`)**: Instantaneous fuzzy search across all notes, files, and folders in your workspace.
- **Document Outline / TOC**: Live hierarchical table of contents panel for jumping between headings in long-form notes.
- **Find in Document (`Ctrl/Cmd + F`)**: Fast in-editor text searching.
- **Distraction-Free Immersion (`F11`)**: Fullscreen view hiding extraneous UI chrome for pure focus.
- **Real-Time Document Telemetry**: Status bar displaying live word count, character count, estimated reading time, active cursor position, and autosave state.

### 7. Universal Data Portability & Export
- **Export Notes Anywhere**: Export individual notes as clean Markdown (`.md`), HTML, or structured JSON, or download your entire notes library as a compressed `.zip` archive.
- **Direct Folder Binding**: Connect directly to your local Obsidian vault or Git repository without cloud syncing intermediaries.

## Editor Capabilities

Repaper supports a comprehensive suite of structured content blocks and inline formatting for note taking:

| Block Type | Markdown Equivalent / Trigger | Capabilities |
| :- | :- | :- |
| **Heading** | `# H1` to `###### H6` | Hierarchy levels 1–6, anchor generation, outline sync |
| **Paragraph** | Plain text | Fluid typing, inline formatting, wikilink support |
| **Checklist** | `- [ ]` / `- [x]` | Interactive toggling, task tracking, progress calculation |
| **List (Bulleted & Numbered)** | `- item` / `1. item` | Ordered and unordered nested lists with keyboard navigation |
| **Code Fence** | ` ```language ` | Monospace formatting, syntax highlighting, copy-to-clipboard |
| **Math Block** | `$$ formula $$` or `$math$` | Hardware-rendered KaTeX LaTeX mathematical expressions |
| **Mermaid Diagram** | ` ```mermaid ` | Live flowcharts, sequence diagrams, class models, mind maps |
| **Table** | `\| col \| col \|` | Editable rows/columns, table headers, column operations |
| **Blockquote** | `> quote` | Stylized accent quotes with attribution support |
| **Delimiter** | Horizontal line syntax | Visual page dividers and breaklines |
| **Image** | `![alt](url)` | File upload, URL embeds, custom captions, alignment |
| **Video & Embeds** | URLs / Embed codes | YouTube, Vimeo, custom video player, responsive iframe embedding |
| **Wikilinks** | `[[Note Name]]` | Bi-directional note linking, fuzzy auto-complete, click-to-navigate |

## Technology Stack

| Layer | Technology | Details |
| :- | :- | :- |
| **Core Framework** | [React 19](https://react.dev/) | Concurrent rendering, modern hooks, zero class boilerplate |
| **Language** | [TypeScript 5.9](https://www.typescriptlang.org/) | Strict type checking across the entire codebase |
| **Build & Tooling** | [Vite 7](https://vite.dev/) + [Bun](https://bun.sh/) | Instant HMR dev server, optimized rollup bundling, fast test runner |
| **Styling & Theme** | [Tailwind CSS 4](https://tailwindcss.com/) + CSS Tokens | Modern CSS variables, glassmorphic brutalist aesthetic, multi-theme engine |
| **Editor Core** | [Editor.js 2.30](https://editorjs.io/) | Block-based modular editing framework with custom tools |
| **STEM Rendering** | [KaTeX](https://katex.org/) + [Mermaid.js](https://mermaid.js.org/) | Lightning-fast LaTeX math rendering and SVG diagram generation |
| **Storage Engine** | [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) + [File System Access API](https://developer.mozilla.org/en-US/docs/Web/API/File_System_API) | High-performance client-side storage + direct local folder binding |
| **Sanitization** | [DOMPurify 3.4](https://github.com/cure53/DOMPurify) | Complete XSS defense for parsed HTML and rendered embeds |
| **Iconography** | [Lucide React](https://lucide.dev/) | Clean, accessible SVG icons |
| **Background Tasks** | [Web Workers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API) | Asynchronous tokenization, full-text search indexing, and graph computation |

## Keyboard Shortcuts

Designed for keyboard-first efficiency. All shortcuts automatically adapt between macOS (`Cmd`) and Windows/Linux (`Ctrl`):

| Shortcut (Win / Linux) | Shortcut (macOS) | Action |
| :- | :- | :- |
| <kbd>Ctrl</kbd> + <kbd>S</kbd> | <kbd>Cmd</kbd> + <kbd>S</kbd> | **Save Active Note** manually |
| <kbd>Ctrl</kbd> + <kbd>O</kbd> | <kbd>Cmd</kbd> + <kbd>O</kbd> | **Open Workspace** folder from disk |
| <kbd>Ctrl</kbd> + <kbd>N</kbd> | <kbd>Cmd</kbd> + <kbd>N</kbd> | **Create New Note** at workspace root |
| <kbd>Ctrl</kbd> + <kbd>W</kbd> | <kbd>Cmd</kbd> + <kbd>W</kbd> | **Close Active Note Tab** |
| <kbd>Ctrl</kbd> + <kbd>P</kbd> | <kbd>Cmd</kbd> + <kbd>P</kbd> | **Toggle Quick Switcher** (Fuzzy note search) |
| <kbd>Ctrl</kbd> + <kbd>F</kbd> | <kbd>Cmd</kbd> + <kbd>F</kbd> | **Find in Document** |
| <kbd>Ctrl</kbd> + <kbd>,</kbd> | <kbd>Cmd</kbd> + <kbd>,</kbd> | **Open Settings Modal** |
| <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>L</kbd> | <kbd>Cmd</kbd> + <kbd>Shift</kbd> + <kbd>L</kbd> | **Toggle Theme** (Dark / Light) |
| <kbd>Alt</kbd> + <kbd>D</kbd> or <kbd>Alt</kbd> + <kbd>V</kbd> | <kbd>Option</kbd> + <kbd>D</kbd> or <kbd>Option</kbd> + <kbd>V</kbd> | **Toggle Voice Dictation** |
| <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>D</kbd> | <kbd>Cmd</kbd> + <kbd>Shift</kbd> + <kbd>D</kbd> | **Toggle Voice Dictation** (Alternative) |
| <kbd>F11</kbd> | <kbd>F11</kbd> | **Toggle Fullscreen Mode** |
| <kbd>Esc</kbd> | <kbd>Esc</kbd> | **Exit Fullscreen / Close Active Modal** |

## Getting Started

### Prerequisites

- **Node.js** `>= 20.0.0` or **Bun** `>= 1.0.0`
- A modern evergreen browser (Chrome, Edge, Brave, Firefox, or Safari).

### Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/HawkdotDev/repaper.git
cd repaper

# 2. Install dependencies (using npm or bun)
npm install
# or
bun install

# 3. Start the local development server
npm run dev
# or
bun run dev
```

Visit `http://localhost:5173` in your browser. The application will start immediately with hot module replacement (HMR).

### Building for Production

```bash
# Build production bundle
npm run build

# Preview the production build locally
npm run preview
```

Static web assets are compiled into the `dist/` folder. Because Repaper is fully client-side, you can deploy the `dist/` directory to any static web hosting platform: Cloudflare Pages, GitHub Pages, Vercel, Netlify, or self-hosted Docker/Nginx.

## YAML Frontmatter Spec

Repaper maintains 100% standard Markdown fidelity. Document styling, covers, icons, and visual preferences are persisted using standard YAML frontmatter:

```yaml
title: 'System Architecture & Knowledge Notes'
icon: 'document'
cover: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb'
fontFamily: 'JetBrains Mono'
fontSize: 16
lineHeight: 1.75
letterSpacing: 0.5
fontWeight: 400
textAlign: 'left'
showTitle: true
showCover: true
showIcon: true
tags:
  - notes
  - architecture
  - engineering
```

## FAQ

### What makes Repaper the best paper-like note taking app?
Repaper combines the fluid, friction-free feel of jotting down thoughts on physical paper with the superpowers of digital organization: instant search, markdown compatibility, live diagrams, LaTeX formulas, and bidirectional wikilinks.

### Are my notes private and secure?
Yes. Repaper is 100% local-first and client-side. There are no tracking scripts, no third-party telemetry, and no mandatory cloud accounts. Your notes stay entirely on your device.

### How does Repaper compare to Notion and Obsidian?
Repaper gives you the clean block editing, cover banners, and icons of Notion, combined with the local file ownership, speed, and knowledge graph of Obsidian—completely free with zero subscription fees.

## Search & Discovery Topics

`paper` • `repaper` • `note` • `notes` • `notes-app` • `note-taking` • `note-taking-app` • `markdown-notes` • `paper-notes` • `offline-notes` • `local-notes` • `digital-paper` • `pkm` • `knowledge-base` • `notion-alternative` • `obsidian-alternative` • `latex-notes` • `wikilinks`

## Contributing

Contributions, bug reports, and ideas are welcome!

1. Fork the repository on GitHub.
2. Create a feature branch (`git checkout -b feature/my-new-feature`).
3. Commit your changes (`git commit -m 'feat: add my new feature'`).
4. Ensure all tests and typechecks pass (`bun test && npm run typecheck`).
5. Push to your fork (`git push origin feature/my-new-feature`).
6. Open a Pull Request with a clear explanation of your improvements.

## License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for full details.

<div align="center">
  <br />
  <sub>Designed and engineered with care by the <strong>Repaper</strong> Open Source Community.</sub>
</div>
