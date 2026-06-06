# Divine DevTools: Visual DOM Inspector & AI Side Panel

A production-ready Chrome Extension (Manifest V3) that enables developers to visually inspect page components and interact with a context-aware AI developer assistant directly in the browser, following dynamic developer guidelines (skills).

---

## Key Features

1. **Visual Selection Mode (DOM Inspector)**:
   - Active hover highlighting of elements using a high-performance, style-isolated visual overlay rendered within a **Shadow DOM**.
   - Hover tooltip displays current element tag and classes (e.g. `div.flex.p-4`).
   - Clicking an element locks it and captures full context (HTML, selector, parent nodes, key computed CSS rules, and page tech-stack).
2. **Apple-Inspired UX/UI**:
   - Clean minimalist interface that lives in the **Chrome Side Panel** (registered natively in MV3).
   - Light/Dark mode themes.
   - Collapsible Inspector Details accordion displaying captured HTML, selector path, and computed styles.
3. **Dynamic Skills Manager**:
   - Fully generic **Skills Installer**: open settings to create, edit, or delete arbitrary developer guidelines (e.g., paste your own `SKILL.md` documents).
   - Prepopulated with default presets: *React & Frontend Guidelines* and *Accessibility (A11y) Standards*.
   - **Auto-Matching Heuristics**: automatically matches installed skills against the inspected element tag, page framework, or keywords present in your question.
   - **Manual Palette Overrides**: let you force-toggle specific rules in the bottom toolbar.
4. **Local-First Caching & Mocks**:
   - Seamless offline fallback: runs in a standard browser tab for testing layout styles using rich mock states without crashing extension-only APIs.

---

## Project Structure

```text
extension/
├── dist/                  # Compiled assets (load this folder in Chrome)
├── scripts/
│   └── build.js           # Build orchestrator (Vite + Esbuild)
├── src/
│   ├── background/
│   │   └── index.ts       # Service worker (MV3 life-cycle and panel configuration)
│   ├── content-script/
│   │   └── index.ts       # DOM overlay, selection handlers, CSS calculation
│   ├── panel/
│   │   ├── utils/
│   │   │   └── agent.ts   # Prompt builder, dynamic token matching, and API caller
│   │   ├── App.tsx        # React side panel layout (chat, settings CRUD tabs)
│   │   ├── index.html     # Side panel HTML entry
│   │   ├── main.tsx       # React entry mount
│   │   └── styles.css     # Tailwind and global styles
│   └── types.ts           # Shared TypeScript interfaces
├── manifest.json          # MV3 configuration
├── package.json           # Dependencies and build scripts
├── tsconfig.json          # TypeScript compilation settings
├── tailwind.config.js     # Tailwind design tokens
└── postcss.config.js      # PostCSS configuration
```

---

## Installation & Setup

### 1. Build the Extension
Ensure you have Node.js (v18+) and `pnpm` (or `npm`) installed.
```bash
# Navigate to the extension folder
cd extension

# Install dependencies
pnpm install

# Compile the extension (produces the dist/ folder)
node scripts/build.js
```

### 2. Load the Extension in Chrome
1. Open Google Chrome and go to `chrome://extensions/`.
2. Enable **Developer mode** using the toggle switch in the top-right corner.
3. Click the **Load unpacked** button in the top-left.
4. Select the `dist/` directory located inside your `extension/` folder.

---

## How to Use

1. Navigate to any web page in Chrome.
2. Click the **Divine DevTools** action button in your Chrome toolbar. The extension side panel will slide open.
3. Click the **Inspect** button (mouse cursor/crosshair icon) in the top right.
4. Move your mouse over the page to see visual highlights. Click any element to lock selection.
5. The element details are captured and shown in the accordion. Ask questions in the chat panel below (e.g., *"Convert this styling to Tailwind"*, *"Suggest accessibility improvements"*).

---

## Installing Custom Skills

You can install any custom guidelines (like `SKILL.md` rules from your repositories):

1. Open the extension **Settings** (gear icon in the top right).
2. Click the **Skills Manager** tab.
3. In the **Install Custom Skill** form, enter:
   - **Name**: e.g., `Tailwind Migrator`
   - **Match Keywords**: space-separated list of keywords that trigger auto-activation (e.g., `tailwind styling classes utility conversion css`).
   - **Skill Rules**: paste the markdown/text guidelines of the skill.
4. Click **Install Skill**.

### Prompt Injection Context
When you ask a question, the extension tokenizes your query and page metadata to find matching keywords in your installed skills. If matched (or manually toggled), the prompt builder pulls the full rules content and injects it into the prompt context:

```markdown
[SYSTEM CONTEXT]
You are an expert AI agent with access to these local skills: React Guidelines, Tailwind Migrator.
Grounded context-aware coding assistant mode is ACTIVE.

[INSTALLED SKILLS RULES & GUIDELINES]
--- START SKILL: Tailwind Migrator ---
Rule 1: Always convert background-color to bg-{color}.
Rule 2: Wrap answers in Tailwind code blocks.
--- END SKILL: Tailwind Migrator ---

[PAGE ENVIRONMENT] ...
```

This forces the AI model (Gemini or OpenAI) to reason about your component strictly following your custom rules.

---

## Customizing the Agent + Skills Runtime

To connect the extension to your actual LLM API or custom agent endpoint:

1. Open `src/panel/utils/agent.ts`.
2. Locate the `callAgentWithSkills(payload)` function.
3. Select your provider (**Gemini API** or **OpenAI API**) and paste your API key in the extension's Settings tab.
4. If you have a custom serverless agent runner that parses payloads, select **Custom Agent Endpoint** and input your endpoint URL (e.g. `http://localhost:3000/api/agent`).

---

## Development Mode (Live Watch)
To automatically compile changes to the content scripts and Side Panel UI as you edit:
```bash
node scripts/build.js --watch
```
*Note: Chrome automatically picks up changes to your panel scripts on reload, but you will need to click the refresh icon on `chrome://extensions/` if you make changes to the background script or manifest.*
