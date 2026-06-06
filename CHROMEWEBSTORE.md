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
| Screenshot 1 [REQUIRED] | 1280×800 | ⬜ Not created | `screenshot-inspector.png` |
| Screenshot 2 [RECOMMENDED] | 1280×800 | ⬜ Not created | `screenshot-skills-manager.png` |
| Screenshot 3 [RECOMMENDED] | 1280×800 | ⬜ Not created | `screenshot-chat-interface.png` |
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
| 1.0.0 | 2026-06-07 | Initial release. Visual DOM inspector, AI Side Panel integration, and Dynamic Skills Manager. | Draft |

## Review Notes

### Known Issues / Limitations
- Dom inspection is limited to non-restricted pages (cannot execute on protected system URLs like `chrome://` or the Chrome Web Store itself).
