# Privacy Policy for Divine DevTools

Last updated: 2026-06-07

Divine DevTools ("we", "our", "us") values your privacy. This Privacy Policy describes how we handle information in connection with the Divine DevTools browser extension.

## 1. What Data We Collect & Access
Divine DevTools is designed to operate locally and serverlessly in your browser. We do **not** collect or store personal data, passwords, or browsing histories on any server controlled by us.

* **API Keys & Settings**: To authenticate with artificial intelligence providers, you can optionally provide an OpenAI API key or a Google Gemini API key. These keys are saved strictly in your browser's local sandbox using `chrome.storage.local`. They are never transmitted to us or any unauthorized third parties.
* **Element Context & Prompts**: When using the Visual DOM Inspector to analyze elements on a webpage, the extension extracts the relevant HTML/CSS structure of the selected element and compiles it with your text prompt. This text is sent directly to your chosen AI provider (OpenAI or Google Gemini) to generate responses.
* **Custom Skills Rules**: Any developer guidelines or rulesets (`SKILL.md` files) you import are saved entirely within your browser's local storage and are processed locally to filter matched skills.

## 2. Third-Party Services
When you ask the AI assistant questions, the extension sends your prompt and the selected DOM context to the AI service provider you have configured:
* **Google Gemini API**: Subject to [Google's Privacy Policy](https://policies.google.com/privacy)
* **OpenAI API**: Subject to [OpenAI's API Privacy Policy](https://openai.com/policies/privacy-policy)

We encourage you to review the privacy policies of the AI service provider you configure.

## 3. Data Sharing & Disclosure
We do not sell, trade, rent, or share any of your inputs, keys, page contexts, or user preferences with third parties. All network traffic goes directly from your browser to your configured AI endpoints.

## 4. Data Retention and Deletion
All data is stored on your device. You can clear all saved settings, API keys, and custom skills at any time by clicking the "Clear All Data" button in the extension Settings pane, or by simply uninstalling the extension.

## 5. Changes to This Policy
We may update this Privacy Policy from time to time. Any changes will be reflected by updating the "Last updated" date at the top of this document.

## 6. Contact Us
If you have any questions or feedback regarding privacy, please contact:
publisher@divine-ai.org
