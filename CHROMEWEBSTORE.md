# Chrome Web Store Listing — Divine DevTools

> Last Updated: 2026-06-07

## Store Listing

**Extension Name** [REQUIRED]
Divine DevTools

**Short Description** [REQUIRED]
Visual DOM Inspector and AI Side Panel for web app development with custom Skills integration.

**Detailed Description** [REQUIRED]
Divine DevTools is a visual DOM inspector and AI side panel that bridges the gap between active page inspection and custom developer coding standards.

Key Features:
- Visual DOM Selector: Select any element on the page with a simple point-and-click cursor.
- AI Side Panel: Ask questions about the selected element (e.g., refactoring suggestions, Tailwind migrations, styling, or dynamic accessibility audits) without switching window context.
- Dynamic Skills Manager: Import coding guidelines directly from local files, repository URLs, or registry links.
- Context-Aware Rules: The extension automatically matches active page elements to relevant installed guidelines (like `SKILL.md` rulesets) and injects them directly into your prompts.
- Offline and Serverless Design: All skills, configurations, and API credentials are kept entirely inside local storage.

How to Use:
1. Open the Side Panel by clicking the Divine DevTools extension icon in your Chrome toolbar.
2. Click the Inspector cursor button in the header of the side panel.
3. Move your mouse over the active tab and click on any DOM element to target it.
4. Ask the AI assistant questions about how to improve or refactor that element.
5. Click the Settings (gear) icon to install, view, or manage your coding guidelines.

Privacy & Permissions:
All data remains on your local machine. Divine DevTools does not collect, monitor, or transmit your personal data. API keys and custom rules are saved securely in your browser's local storage.

Support & Feedback:
Please report bugs or submit feature requests on our issues page:
https://github.com/divine-ai/divine-devtools/issues

**Category** [REQUIRED]
Developer Tools

**Single Purpose** [REQUIRED]
Visual DOM inspector and AI assistant that links web elements to custom coding guidelines.

**Primary Language** [REQUIRED]
English

## Graphics & Assets

| Asset | Dimensions | Status | Filename |
|-------|-----------|--------|----------|
| Store Icon [REQUIRED] | 128×128 PNG | ✅ Ready | `extension/dist/icon128.png` |
| Screenshot 1 [REQUIRED] | 1280×800 | ✅ Ready | `extension/screenshot-inspector.png` |
| Screenshot 2 [RECOMMENDED] | 1280×800 | ✅ Ready | `extension/screenshot-skills-manager.png` |
| Screenshot 3 [RECOMMENDED] | 1280×800 | ✅ Ready | `extension/screenshot-chat-interface.png` |
| Small Promo Tile [RECOMMENDED] | 440×280 | ⬜ Not created | `promo-small.png` |

### Screenshot Notes
- **Screenshot 1 (DOM Inspector)**: Captures the active browser tab with the custom Shadow DOM selection overlay highlighting a webpage card, showing the Side Panel loaded on the right.
- **Screenshot 2 (Skills Manager)**: Displays the Settings drawer showing installed developer skills and the GitHub import form in action.
- **Screenshot 3 (Chat Interface)**: Shows an AI response matching custom rules to refactor a component, illustrating clean code formatting and markdown support.

## Permissions Justification

| Permission | Type | Justification |
|------------|------|---------------|
| `sidePanel` | permissions | Required to host the AI assistant and developer console inside a native Chrome side panel for side-by-side debugging. |
| `activeTab` | permissions | Required to inspect, retrieve element tag details, and highlight DOM nodes on the active page when triggered by the user. |
| `scripting` | permissions | Required to dynamically inject target indicators and element inspection overlays into the active page. |
| `storage` | permissions | Required to securely save user API keys, selected options, and custom developer skills guidelines on the local device. |
| `http://*/*`, `https://*/*` | host_permissions | Required to run the element inspector on any developer-defined webpage and fetch custom coding rules from external sources (e.g., GitHub and the skills registry). |

## Privacy Practices Tab - Developer Dashboard Fields

Copy and paste these exact justifications into the **Privacy practices** tab of the Chrome Developer Dashboard to resolve the publishing errors:

### 1. Single Purpose Description
> **Field**: Single purpose description
> **Copy-paste value**:
> Visual DOM inspector and AI side-panel assistant that matches inspected page elements to custom developer coding standards (SKILL.md) and feeds them into context-aware prompts.

### 2. Permissions & Justifications

* **`sidePanel`**
  > Required to display the AI assistant console as a native side panel, allowing side-by-side debugging and code generation alongside the active tab without blocking the screen.

* **`activeTab`**
  > Required to inspect DOM elements, calculate style properties, and highlight elements on the active webpage on-demand when the user clicks the inspector crosshair.

* **`scripting`**
  > Required to dynamically inject DOM highlighting scripts and element selection event listeners into the active webpage context when the developer initiates inspection.

* **`storage`**
  > Required to persist user settings (such as LLM provider selection and model configuration) and custom installed developer guidelines (SKILL.md rulesets) securely on-device.

* **Host Permissions (`http://*/*`, `https://*/*`)**
  > Required to enable the visual DOM inspector overlays on developer-specified local and public testing sites, and to fetch coding standards/rulesets from external developer repositories (like GitHub and package registries).

### 3. Remote Code Use Justification
> **Field**: Justification for remote code use
> **Copy-paste value**:
> The extension does not use, execute, or fetch any remotely hosted code. All JavaScript logic, stylesheets, and layout templates are compiled and bundled entirely within the local extension package.

### 4. Data Usage Certifications
> In the dashboard, you must check the checkboxes to certify that:
> 1. Data is NOT sold to third parties.
> 2. Data is NOT used for purposes unrelated to the extension's core functionality.
> 3. Data is NOT used for creditworthiness or lending purposes.

---

## Privacy & Data Use

### Data Collection

**Does the extension collect user data?** No

This extension does not collect, store, or transmit personal data or browsing details. All inputs, element context, and configuration keys are preserved in local storage and sent directly to the user's selected third-party AI provider (OpenAI or Gemini) for text generation.

### Data Use Certification
- [x] Data is NOT sold to third parties
- [x] Data is NOT used for purposes unrelated to the extension's core functionality
- [x] Data is NOT used for creditworthiness or lending purposes

## Privacy Policy

**Privacy Policy URL** [REQUIRED]
https://github.com/divine-ai/divine-devtools/blob/main/PRIVACY.md

## Distribution

**Visibility**: Public
**Regions**: All regions
**Pricing**: Free

## Developer Info

**Publisher Name** [REQUIRED]
Divine AI

**Contact Email** [REQUIRED]
publisher@divine-ai.org

**Support URL** [RECOMMENDED]
https://github.com/divine-ai/divine-devtools/issues

## Version History

| Version | Date | Changes | Status |
|---------|------|---------|--------|
| 1.1.0 | 2026-06-07 | Add support for popular AI providers: Anthropic (Claude), DeepSeek, Groq, and Ollama (local LLMs). | Approved |
| 1.0.0 | 2026-06-07 | Initial release. Visual DOM inspector, AI Side Panel integration, and Dynamic Skills Manager. | Approved |

## Review Notes

### Known Issues / Limitations
- Dom inspection is limited to non-restricted pages (cannot execute on protected system URLs like `chrome://` or the Chrome Web Store itself).
