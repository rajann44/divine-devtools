import { ElementContext, AgentPayload, ChatMessage, InstalledSkill } from '../../types';

/**
 * Automatically infers relevant developer skills based on the element context, question, and installed skills.
 */
export function inferAutoSkills(
  elementContext: ElementContext, 
  question: string,
  installedSkills: InstalledSkill[]
): string[] {
  const matchedSkillIds: string[] = [];
  const qLower = question.toLowerCase();

  // Tokenize and clean search terms from the current context
  const searchTerms = new Set<string>();

  // 1. Add words from user question
  qLower.split(/\s+/).forEach(w => {
    const cleaned = w.replace(/[^a-z0-9-]/gi, '').toLowerCase();
    if (cleaned.length > 2) {
      searchTerms.add(cleaned);
    }
  });

  // 2. Add detected frameworks
  elementContext.pageMeta.frameworks.forEach(fw => {
    fw.toLowerCase().split(/\s+/).forEach(w => searchTerms.add(w));
  });

  // 3. Add element tag and parent tag names
  searchTerms.add(elementContext.tagName.toLowerCase());
  if (elementContext.parentContext) {
    searchTerms.add(elementContext.parentContext.tagName.toLowerCase());
  }

  // Cross-reference search terms with installed skill names and descriptions
  for (const skill of installedSkills) {
    const nameLower = skill.name.toLowerCase();
    const descLower = skill.description.toLowerCase();

    const isMatched = Array.from(searchTerms).some(term => {
      return nameLower.includes(term) || descLower.includes(term);
    });

    if (isMatched) {
      matchedSkillIds.push(skill.id);
    }
  }

  return matchedSkillIds;
}

/**
 * Builds the structured prompt that gets sent to the LLM or agent environment, injecting the full active skills guidelines.
 */
export function buildStructuredPrompt(
  question: string,
  elementContext: ElementContext,
  userSkillChoices: string[],
  autoSkillHints: string[],
  installedSkills: InstalledSkill[]
): string {
  const activeIds = Array.from(new Set([...userSkillChoices, ...autoSkillHints]));
  
  // Find full contents of active skills
  const activeSkills = installedSkills.filter(s => activeIds.includes(s.id));
  const activeSkillsNames = activeSkills.map(s => s.name).join(', ') || 'None';

  let skillsContextBlock = '';
  if (activeSkills.length > 0) {
    skillsContextBlock = `\n[INSTALLED SKILLS RULES & GUIDELINES]\n`;
    activeSkills.forEach(skill => {
      skillsContextBlock += `\n--- START SKILL: ${skill.name} ---\n${skill.content}\n--- END SKILL: ${skill.name} ---\n`;
    });
  }

  return `
[SYSTEM CONTEXT]
You are an expert AI agent with access to these local skills: ${activeSkillsNames}.
Grounded context-aware coding assistant mode is ACTIVE.
Apply the rules and guidelines specified in the installed skills block below when reasoning.
${skillsContextBlock}

[PAGE ENVIRONMENT]
- Page URL: ${elementContext.pageMeta.url}
- Page Title: ${elementContext.pageMeta.title}
- Detected Technologies: ${elementContext.pageMeta.frameworks.join(', ') || 'Vanilla HTML/CSS/JS'}

[SELECTED ELEMENT DATA]
- Selector: ${elementContext.selector}
- Tag Name: <${elementContext.tagName}>
- Parent Node: <${elementContext.parentContext?.tagName || 'none'}> with classes "${elementContext.parentContext?.classes || ''}"
- Ancestors Path: ${elementContext.ancestors.join(' < ')}

[ELEMENT HTML CODE]
\`\`\`html
${elementContext.truncatedHtml}
\`\`\`

[ELEMENT STYLES]
- Inline styles: ${elementContext.inlineStyles || 'None'}
- Computed key styles:
${Object.entries(elementContext.computedStyles)
  .map(([key, val]) => `  ${key}: ${val}`)
  .join('\n')}

[USER QUESTION]
${question}

[RESPONSE REQUIREMENTS]
- Address the user's question directly, referencing their selected DOM element and layout styles.
- Provide clean, functional code blocks or visual diffs where relevant.
- Conform strictly to the rules and guidelines of the active skills: ${activeSkillsNames}.
`;
}

/**
 * Call the agent skills API endpoint.
 * Currently simulates the call with realistic developer responses, but contains placeholders
 * where you can easily plug in Gemini, Anthropic, OpenAI, or your custom serverless agent backend.
 */
export async function callAgentWithSkills(payload: AgentPayload): Promise<string> {
  console.log('Divine DevTools - Dispatching agent payload:', payload);

  const provider = payload.settings?.provider;
  const apiKey = payload.settings?.apiKey;
  const customEndpoint = payload.settings?.customEndpoint;
  const model = payload.settings?.model;

  // Fallback simulator if no API key is specified
  if (!apiKey && provider !== 'custom') {
    return runLocalSimulation(payload);
  }

  const prompt = buildStructuredPrompt(
    payload.question, 
    payload.elementContext, 
    payload.userSkillChoices, 
    payload.autoSkillHints, 
    payload.installedSkills
  );

  if (provider === 'gemini') {
    const modelName = model || 'gemini-1.5-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    const contents = payload.chatHistory.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));
    contents.push({
      role: 'user',
      parts: [{ text: prompt }]
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ contents })
    });

    if (!response.ok) {
      const errBody = await response.text();
      let parsedErr = errBody;
      try {
        const json = JSON.parse(errBody);
        parsedErr = json.error?.message || errBody;
      } catch (e) {
        // use raw
      }
      throw new Error(`Gemini API Error: ${parsedErr}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new Error('Gemini API returned an empty response. Try updating model or prompt parameters.');
    }
    return text;

  } else if (provider === 'openai') {
    const modelName = model || 'gpt-4o-mini';
    const url = 'https://api.openai.com/v1/chat/completions';

    const messages = payload.chatHistory.map(msg => ({
      role: msg.role,
      content: msg.content
    }));
    messages.push({
      role: 'user',
      content: prompt
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: modelName,
        messages,
        temperature: 0.2
      })
    });

    if (!response.ok) {
      const errBody = await response.text();
      let parsedErr = errBody;
      try {
        const json = JSON.parse(errBody);
        parsedErr = json.error?.message || errBody;
      } catch (e) {
        // use raw
      }
      throw new Error(`OpenAI API Error: ${parsedErr}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content;
    if (!text) {
      throw new Error('OpenAI API returned an empty response.');
    }
    return text;

  } else if (provider === 'custom') {
    const url = customEndpoint || 'http://localhost:3000/api/agent';
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`Custom Agent Endpoint Error (${response.status}): ${errBody || response.statusText}`);
    }

    const data = await response.json();
    const text = data.reply || data.text || data.response || JSON.stringify(data);
    return text;
  }

  throw new Error('Unsupported provider configuration.');
}

/**
 * Runs a simulated developer response when no API configuration is present.
 */
async function runLocalSimulation(payload: AgentPayload): Promise<string> {
  await new Promise(resolve => setTimeout(resolve, 1500));

  const q = payload.question.toLowerCase();
  const tagName = payload.elementContext.tagName;
  const frameworks = payload.elementContext.pageMeta.frameworks;
  const isReact = frameworks.includes('React');

  if (q.includes('accessibility') || q.includes('a11y')) {
    return `### Accessibility Analysis & Suggestions

*Note: You are viewing a local simulated response. Open Settings to configure a real AI API key.*

Based on the inspected element \`<${tagName}>\` with selector \`${payload.elementContext.selector}\`, here are accessibility recommendations:

1. **Semantic HTML**:
   Ensure you use a button tag rather than a styled div if this element is interactive.
   \`\`\`diff
   - <div class="btn-primary" onclick="handleClick()">Submit</div>
   + <button class="btn-primary" aria-label="Submit Form" onclick="handleClick()">Submit</button>
   \`\`\`

2. **Aria Attributes**:
   - Ensure an \`aria-label\` is specified if the element has no descriptive text.`;
  }

  if (q.includes('refactor') || q.includes('react') || q.includes('convert')) {
    if (isReact) {
      return `### React Component Refactoring

*Note: You are viewing a local simulated response. Open Settings to configure a real AI API key.*

Here is a modern functional React component representation:

\`\`\`tsx
import React from 'react';

export const Modern${tagName.charAt(0).toUpperCase() + tagName.slice(1)} = () => {
  return (
    <${tagName} 
      className="p-3 bg-neutral-100 dark:bg-neutral-800 rounded-lg text-neutral-800 dark:text-neutral-200"
      style={{
        color: '${payload.elementContext.computedStyles['color'] || 'inherit'}',
        backgroundColor: '${payload.elementContext.computedStyles['background-color'] || 'transparent'}'
      }}
    >
      Inspected Element
    </${tagName}>
  );
};
\`\`\``;
    }
  }

  return `### AI Settings Required

To start getting real, context-aware answers leveraging the **skills.sh** framework:
1. Click the **Settings (gear)** icon in the top right.
2. Select an AI Provider (Gemini API, OpenAI API, or Custom Agent Endpoint).
3. Input your API Key or custom endpoint URL.

*Inspected Element Context: Selector \`${payload.elementContext.selector}\` | detected frameworks: ${frameworks.join(', ') || 'none'}*`;
}
