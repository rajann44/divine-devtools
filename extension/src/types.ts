export interface PageMetadata {
  url: string;
  title: string;
  frameworks: string[];
}

export interface ParentContext {
  tagName: string;
  classes: string;
  outerHtml: string;
}

export interface ElementContext {
  tagName: string;
  selector: string;
  outerHtml: string;
  truncatedHtml: string;
  inlineStyles: string;
  computedStyles: Record<string, string>;
  parentContext: ParentContext | null;
  ancestors: string[];
  pageMeta: PageMetadata;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  skillsHint?: string[];
  selectedElement?: {
    selector: string;
    tagName: string;
  };
}

export interface AgentSettings {
  provider: 'gemini' | 'openai' | 'custom';
  apiKey: string;
  customEndpoint: string;
  model: string;
}

export interface InstalledSkill {
  id: string;
  name: string;
  description: string;
  content: string;
}

export interface AgentPayload {
  question: string;
  elementContext: ElementContext;
  chatHistory: { role: 'user' | 'assistant'; content: string }[];
  userSkillChoices: string[]; // selected skill IDs
  autoSkillHints: string[];   // auto-inferred skill IDs
  installedSkills: InstalledSkill[];
  settings?: AgentSettings;
}
