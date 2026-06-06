import React, { useState, useEffect, useRef } from 'react';
import { 
  MousePointerClick, 
  Moon, 
  Sun, 
  Send, 
  Copy, 
  Check, 
  ChevronDown, 
  ChevronUp, 
  Sparkles, 
  Info, 
  Code,
  Sliders,
  Terminal,
  AlertTriangle,
  Settings,
  Trash2,
  Plus
} from 'lucide-react';
import { ElementContext, ChatMessage, AgentPayload, AgentSettings, InstalledSkill } from '../types';
import { callAgentWithSkills, inferAutoSkills } from './utils/agent';

// Check if running inside actual Chrome Extension context
const isChromeExtension = typeof chrome !== 'undefined' && chrome.tabs && chrome.runtime;



export default function App() {
  // Theme state
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Extension states
  const [isInspectMode, setIsInspectMode] = useState<boolean>(false);
  const [selectedElement, setSelectedElement] = useState<ElementContext | null>(null);
  const [isDetailsExpanded, setIsDetailsExpanded] = useState<boolean>(false);
  const [copiedSelector, setCopiedSelector] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Chat states
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputVal, setInputVal] = useState<string>('');
  const [isSending, setIsSending] = useState<boolean>(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  // Skills Palette states
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [autoSkills, setAutoSkills] = useState<string[]>([]);

  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  // Settings State & Persistence
  const [settings, setSettings] = useState<AgentSettings>({
    provider: 'gemini',
    apiKey: '',
    customEndpoint: '',
    model: 'gemini-1.5-flash',
  });
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [settingsTab, setSettingsTab] = useState<'connection' | 'skills'>('connection');

  // Dynamic Skills CRUD State
  const [installedSkills, setInstalledSkills] = useState<InstalledSkill[]>([]);
  const installedSkillsRef = useRef<InstalledSkill[]>([]);

  // Add skill form states
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillDesc, setNewSkillDesc] = useState('');
  const [newSkillContent, setNewSkillContent] = useState('');

  // URL Import states
  const [importUrl, setImportUrl] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  // Sync ref to avoid stale closures in listeners
  useEffect(() => {
    installedSkillsRef.current = installedSkills;
  }, [installedSkills]);

  useEffect(() => {
    // Load Settings
    if (isChromeExtension) {
      chrome.storage.local.get(['installedSkills', 'agentSettings'], (res) => {
        if (res.agentSettings) {
          setSettings(res.agentSettings);
        }
        if (res.installedSkills) {
          setInstalledSkills(res.installedSkills);
        } else {
          setInstalledSkills([]);
          chrome.storage.local.set({ installedSkills: [] });
        }
      });
    } else {
      const savedSettings = localStorage.getItem('agentSettings');
      if (savedSettings) {
        try {
          setSettings(JSON.parse(savedSettings));
        } catch (e) {}
      }
      const savedSkills = localStorage.getItem('installedSkills');
      if (savedSkills) {
        try {
          const parsed = JSON.parse(savedSkills);
          setInstalledSkills(parsed || []);
        } catch (e) {
          setInstalledSkills([]);
        }
      } else {
        setInstalledSkills([]);
        localStorage.setItem('installedSkills', JSON.stringify([]));
      }
    }
  }, []);

  const updateSettings = (key: keyof AgentSettings, value: string) => {
    const nextSettings = { ...settings, [key]: value };
    setSettings(nextSettings);
    if (isChromeExtension) {
      chrome.storage.local.set({ agentSettings: nextSettings });
    } else {
      localStorage.setItem('agentSettings', JSON.stringify(nextSettings));
    }
  };

  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkillName.trim() || !newSkillContent.trim()) return;

    const newSkill: InstalledSkill = {
      id: `skill-${Date.now()}`,
      name: newSkillName.trim(),
      description: newSkillDesc.trim(),
      content: newSkillContent.trim()
    };

    const updated = [...installedSkills, newSkill];
    setInstalledSkills(updated);
    if (isChromeExtension) {
      chrome.storage.local.set({ installedSkills: updated });
    } else {
      localStorage.setItem('installedSkills', JSON.stringify(updated));
    }

    setNewSkillName('');
    setNewSkillDesc('');
    setNewSkillContent('');
  };

  const handleDeleteSkill = (skillId: string) => {
    const updated = installedSkills.filter(s => s.id !== skillId);
    setInstalledSkills(updated);
    setSelectedSkills(prev => prev.filter(id => id !== skillId));
    if (isChromeExtension) {
      chrome.storage.local.set({ installedSkills: updated });
    } else {
      localStorage.setItem('installedSkills', JSON.stringify(updated));
    }
  };

  const handleImportFromUrl = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!importUrl.trim()) return;
    setIsImporting(true);
    setImportError(null);

    let targetInput = importUrl.trim();
    
    // Remove "npx skills add " prefix if present
    if (targetInput.startsWith('npx skills add ')) {
      targetInput = targetInput.substring('npx skills add '.length).trim();
    }

    // Check for "--skill <name>" flag
    let skillNameParam = '';
    const skillParamMatch = targetInput.match(/--skill\s+(\S+)/);
    if (skillParamMatch) {
      skillNameParam = skillParamMatch[1];
      targetInput = targetInput.replace(/--skill\s+\S+/, '').trim();
    }

    // Strip wrapping quotes if user copied them (e.g. npx skills add "owner/repo" --skill "name")
    targetInput = targetInput.replace(/^['"]|['"]$/g, '').trim();
    if (skillNameParam) {
      skillNameParam = skillNameParam.replace(/^['"]|['"]$/g, '').trim();
    }

    // Expand shorthand "owner/repo" format into a full GitHub URL
    const shorthandRegex = /^[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+$/;
    if (shorthandRegex.test(targetInput)) {
      targetInput = `https://github.com/${targetInput}`;
    }

    let targetUrl = targetInput;
    const candidates: string[] = [];

    // Parse owner/repo if it's a GitHub link
    const repoRegex = /^https?:\/\/github\.com\/([^/]+)\/([^/]+)/;
    const repoMatch = targetUrl.match(repoRegex);

    if (repoMatch) {
      const owner = repoMatch[1];
      const repo = repoMatch[2].replace(/\.git$/, '');

      // Check if it's a direct link to a file in a branch
      if (targetUrl.includes('/blob/')) {
        const githubBlobRegex = /^https?:\/\/github\.com\/([^/]+)\/([^/]+)\/blob\/([^/]+)\/(.+)$/;
        const blobMatch = targetUrl.match(githubBlobRegex);
        if (blobMatch) {
          candidates.push(`https://raw.githubusercontent.com/${blobMatch[1]}/${blobMatch[2]}/${blobMatch[3]}/${blobMatch[4]}`);
        }
      } else {
        // It's a general repository URL. Let's try utilizing GitHub's Trees API to search for the skill.
        if (skillNameParam) {
          // Attempt Trees API search for precise category folder mapping (e.g. skills/productivity/grill-me/SKILL.md)
          for (const branch of ['main', 'master']) {
            try {
              const treeUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`;
              const treeResponse = await fetch(treeUrl);
              if (treeResponse.ok) {
                const treeData = await treeResponse.json();
                if (treeData && Array.isArray(treeData.tree)) {
                  // Search for items in the tree ending with the target pattern
                  const targetMatch = treeData.tree.find((item: any) => 
                    item.type === 'blob' && 
                    (item.path.toLowerCase().endsWith(`/skills/${skillNameParam.toLowerCase()}/skill.md`) ||
                     item.path.toLowerCase().endsWith(`/${skillNameParam.toLowerCase()}/skill.md`) ||
                     item.path.toLowerCase() === `skills/${skillNameParam.toLowerCase()}/skill.md` ||
                     item.path.toLowerCase().endsWith(`/${skillNameParam.toLowerCase()}.md`))
                  );
                  if (targetMatch) {
                    candidates.push(`https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${targetMatch.path}`);
                  }
                }
              }
            } catch (err) {
              console.warn('Trees API fetch failed, falling back to heuristic paths:', err);
            }
          }

          // Fallback heuristic paths if Trees API search yielded no direct match or failed
          const paths = [
            `skills/${skillNameParam}/SKILL.md`,
            `skills/.experimental/${skillNameParam}/SKILL.md`,
            `${skillNameParam}/SKILL.md`,
            `skills/${skillNameParam}.md`,
            `${skillNameParam}.md`
          ];
          for (const branch of ['main', 'master']) {
            for (const p of paths) {
              candidates.push(`https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${p}`);
            }
          }
        } else {
          // No skill specified, try fetching root SKILL.md or root skills.md or README.md
          for (const branch of ['main', 'master']) {
            candidates.push(`https://raw.githubusercontent.com/${owner}/${repo}/${branch}/SKILL.md`);
            candidates.push(`https://raw.githubusercontent.com/${owner}/${repo}/${branch}/skills.md`);
          }
        }
      }
    } else {
      // If it doesn't match a GitHub repo structure, just try fetching the URL as is
      candidates.push(targetUrl);
    }

    try {
      let success = false;
      let fetchedText = '';
      let usedUrl = '';

      for (const url of candidates) {
        try {
          const response = await fetch(url);
          if (response.ok) {
            fetchedText = await response.text();
            usedUrl = url;
            success = true;
            break;
          }
        } catch (e) {
          // ignore error and try next candidate
        }
      }

      if (!success) {
        throw new Error(`Could not find or retrieve the skill file. If this is a private repository, please ensure it is public, or paste the content manually. (Tried: ${candidates.slice(0, 3).map(c => c.substring(c.lastIndexOf('/') + 1)).join(', ')}...)`);
      }

      // Parse YAML frontmatter
      const frontmatterMatch = fetchedText.match(/^---[\r\n]+([\s\S]*?)[\r\n]+---/);
      let name = skillNameParam || '';
      let description = '';
      let body = fetchedText;

      if (frontmatterMatch) {
        const yaml = frontmatterMatch[1];
        const nameMatch = yaml.match(/^name:\s*(.*)$/m);
        const descMatch = yaml.match(/^description:\s*(.*)$/m);
        
        if (nameMatch) name = nameMatch[1].trim();
        if (descMatch) description = descMatch[1].trim();
        
        body = fetchedText.replace(/^---[\r\n]+[\s\S]*?[\r\n]+---[\r\n]*/, '');
      } else {
        // Try to guess name from usedUrl
        const pathParts = usedUrl.split('/');
        const fileName = pathParts[pathParts.length - 1];
        const folderName = pathParts[pathParts.length - 2] || 'custom-skill';
        if (!name) {
          name = fileName === 'SKILL.md' ? folderName : fileName.replace('.md', '');
        }
      }

      setNewSkillName(name || 'Custom Skill');
      // Create keywords from name and description
      const defaultKeywords = (name + ' ' + description)
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .split(/\s+/)
        .filter(w => w.length > 2)
        .join(' ');
      setNewSkillDesc(defaultKeywords);
      setNewSkillContent(body.trim());
      setImportUrl('');
    } catch (err) {
      console.error(err);
      setImportError(err instanceof Error ? err.message : 'Failed to fetch the skill file.');
    } finally {
      setIsImporting(false);
    }
  };

  // 1. Theme handler
  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  // 2. Chrome Extension Message Listener
  useEffect(() => {
    if (!isChromeExtension) {
      // Load mock element in local dev mode
      console.log('Divine DevTools - Running in dev mode (outside Extension)');
      return;
    }

    const messageListener = (message: any) => {
      if (message.action === 'elementSelected') {
        const context: ElementContext = message.payload;
        setSelectedElement(context);
        setIsDetailsExpanded(true);
        setIsInspectMode(false);
        setErrorText(null);

        // Auto infer skills based on selected element
        const auto = inferAutoSkills(context, '', installedSkillsRef.current);
        setAutoSkills(auto);
        const autoNames = auto.map(id => installedSkillsRef.current.find(s => s.id === id)?.name || id);
        const hasSkills = installedSkillsRef.current.length > 0;

        let welcomeContent = `### Element Selected: \`<${context.tagName}>\`
Target element loaded successfully. `;

        if (hasSkills) {
          welcomeContent += `Based on technology detection, I've automatically suggested these active skills: **${autoNames.join(', ') || 'None'}**.

What would you like me to do with this component? Some ideas:
- *Suggest accessibility improvements.*
- *Convert its styles to Tailwind CSS classes.*
- *Refactor it as a clean React component.*
- *Write unit tests (Jest/Vitest) for it.*`;
        } else {
          welcomeContent += `To analyze this component using custom coding rules, click the **Settings (gear)** icon and go to the **Skills Manager** tab to install some guidelines (e.g. paste your own \`SKILL.md\` files).

What would you like me to do with this component? (e.g., refactor, style, or accessibility review).`;
        }

        // Clear chat context for new element
        setMessages([
          {
            id: 'system-welcome',
            role: 'assistant',
            content: welcomeContent,
            timestamp: Date.now(),
            selectedElement: {
              tagName: context.tagName,
              selector: context.selector
            }
          }
        ]);
      } else if (message.action === 'selectionModeChanged') {
        setIsInspectMode(message.active);
      } else if (message.action === 'selectionError') {
        setErrorText(message.error);
        setIsInspectMode(false);
      }
    };

    chrome.runtime.onMessage.addListener(messageListener);
    
    // Check if the current tab changed and refresh status if needed
    const tabUpdateListener = () => {
      // Clear selected state when navigating
      setSelectedElement(null);
      setMessages([]);
      setAutoSkills([]);
    };
    
    chrome.tabs.onUpdated?.addListener(tabUpdateListener);

    return () => {
      chrome.runtime.onMessage.removeListener(messageListener);
      chrome.tabs.onUpdated?.removeListener(tabUpdateListener);
    };
  }, []);

  // Sync scroll on chat updates
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  // Update auto skills whenever question changes
  useEffect(() => {
    if (selectedElement) {
      const auto = inferAutoSkills(selectedElement, inputVal, installedSkills);
      setAutoSkills(auto);
    }
  }, [inputVal, selectedElement, installedSkills]);

  // Auto resize input textbox
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 120)}px`;
    }
  }, [inputVal]);

  // 3. Inspect Toggler
  const toggleInspectMode = async (forceVal?: boolean) => {
    if (!isChromeExtension) {
      if (forceVal === false) {
        setIsInspectMode(false);
        return;
      }
      // Mock element selection for local development testing
      triggerMockSelection();
      return;
    }

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) {
        if (forceVal !== false) {
          setErrorText('No active browser tab detected.');
        }
        return;
      }

      const nextMode = forceVal !== undefined ? forceVal : !isInspectMode;
      setIsInspectMode(nextMode);
      setErrorText(null);

      if (nextMode) {
        // Inject content script dynamically if not already present on this page
        try {
          const checkResult = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => {
              const win = window as any;
              if (win.__divineDevtoolsLoaded) return true;
              win.__divineDevtoolsLoaded = true;
              return false;
            }
          });
          const isLoaded = checkResult?.[0]?.result;
          if (!isLoaded) {
            await chrome.scripting.executeScript({
              target: { tabId: tab.id },
              files: ['content-script.js']
            });
          }
        } catch (scriptErr) {
          console.error('Dynamic injection failed:', scriptErr);
          setErrorText('Cannot inspect this page. Verify it is a valid web page (not a system or store URL).');
          setIsInspectMode(false);
          return;
        }
      }

      await chrome.tabs.sendMessage(tab.id, {
        action: nextMode ? 'startSelection' : 'stopSelection'
      });
    } catch (err) {
      console.error(err);
      if (forceVal !== false) {
        setErrorText('Could not communicate with tab. Refresh the web page and try again.');
      }
      setIsInspectMode(false);
    }
  };

  // Mock selection for local development testing
  const triggerMockSelection = () => {
    const mockContext: ElementContext = {
      tagName: 'h1',
      selector: 'main#content > div.flag-container > h1.m24-c-flag-title',
      outerHtml: '<h1 class="m24-c-flag-title">Welcome to Mozilla</h1>',
      truncatedHtml: '<h1 class="m24-c-flag-title">Welcome to Mozilla</h1>',
      inlineStyles: '',
      computedStyles: {
        'display': 'block',
        'font-size': '48px',
        'font-weight': '700',
        'color': 'rgb(255, 255, 255)',
        'margin-bottom': '16px',
        'line-height': '1.1',
        'border-width': '0px'
      },
      parentContext: {
        tagName: 'div',
        classes: 'flag-container max-w-4xl mx-auto py-12',
        outerHtml: '<div class="flag-container max-w-4xl mx-auto py-12">...</div>'
      },
      ancestors: ['div.flag-container', 'main#content', 'body', 'html'],
      pageMeta: {
        url: 'https://www.mozilla.org/en-US/',
        title: 'Internet for people, not profit — Mozilla',
        frameworks: ['Vanilla JS', 'Sass']
      }
    };

    setIsInspectMode(false);
    setSelectedElement(mockContext);
    setIsDetailsExpanded(true);
    const auto = inferAutoSkills(mockContext, '', installedSkillsRef.current);
    const autoNames = auto.map(id => installedSkillsRef.current.find(s => s.id === id)?.name || id);
    const hasSkills = installedSkillsRef.current.length > 0;
    setAutoSkills(auto);

    let welcomeContent = `### Mock Element Selected: \`<h1.m24-c-flag-title>\`
(Local development mode - API is mocked). `;

    if (hasSkills) {
      welcomeContent += `Auto matched skills: **${autoNames.join(', ') || 'None'}**.\n\nAsk a question like "refactor this to react" or "convert to tailwind css" to view the response format.`;
    } else {
      welcomeContent += `To match custom guidelines, open Settings (gear icon) and paste a skill. Otherwise, ask a question to view the mock response format.`;
    }

    setMessages([
      {
        id: 'mock-welcome',
        role: 'assistant',
        content: welcomeContent,
        timestamp: Date.now(),
        selectedElement: {
          tagName: mockContext.tagName,
          selector: mockContext.selector
        }
      }
    ]);
  };

  // 4. Send Chat message
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputVal.trim() || isSending) return;

    if (!selectedElement) {
      setErrorText('Please inspect and select an element on the page first.');
      return;
    }

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: inputVal,
      timestamp: Date.now(),
      skillsHint: Array.from(new Set([...selectedSkills, ...autoSkills])),
      selectedElement: {
        selector: selectedElement.selector,
        tagName: selectedElement.tagName
      }
    };

    setMessages(prev => [...prev, userMessage]);
    setInputVal('');
    setIsSending(true);
    setErrorText(null);

    try {
      const payload: AgentPayload = {
        question: userMessage.content,
        elementContext: selectedElement,
        chatHistory: messages.map(m => ({ role: m.role, content: m.content })),
        userSkillChoices: selectedSkills,
        autoSkillHints: autoSkills,
        installedSkills,
        settings
      };

      const reply = await callAgentWithSkills(payload);

      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now()}-ai`,
        role: 'assistant',
        content: reply,
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      console.error(err);
      setErrorText('Failed to fetch response from agent environment. Please check console logs.');
    } finally {
      setIsSending(false);
    }
  };

  // Handle Enter (Send) vs Shift+Enter (New Line)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Copy helper
  const copyToClipboard = (text: string, type: 'selector' | 'code') => {
    navigator.clipboard.writeText(text);
    if (type === 'selector') {
      setCopiedSelector(true);
      setTimeout(() => setCopiedSelector(false), 2000);
    } else {
      setCopiedCode(text);
      setTimeout(() => setCopiedCode(null), 2000);
    }
  };

  // Skills toggle
  const toggleSkill = (skillId: string) => {
    setSelectedSkills(prev => 
      prev.includes(skillId) ? prev.filter(s => s !== skillId) : [...prev, skillId]
    );
  };

  // Helper to parse simple markdown to JSX safely
  const renderMarkdown = (text: string) => {
    const lines = text.split('\n');
    let inCodeBlock = false;
    let codeContent: string[] = [];
    let codeLang = '';
    const elements: React.ReactNode[] = [];

    lines.forEach((line, index) => {
      // Check code block tags
      if (line.trim().startsWith('```')) {
        if (inCodeBlock) {
          inCodeBlock = false;
          const fullCode = codeContent.join('\n');
          const currentCode = fullCode; // Capture value closure
          elements.push(
            <div key={`code-${index}`} class="relative my-3 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 text-neutral-800 dark:text-neutral-200 overflow-hidden font-mono text-xs">
              <div class="flex items-center justify-between px-3 py-1.5 bg-neutral-100 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 text-[10px] text-neutral-500 font-sans">
                <span>{codeLang || 'code'}</span>
                <button 
                  onClick={() => copyToClipboard(currentCode, 'code')}
                  class="flex items-center gap-1 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors focus:outline-none"
                >
                  {copiedCode === currentCode ? (
                    <>
                      <Check size={11} className="text-green-500" />
                      <span class="text-green-500">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy size={11} />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <pre class="p-3 overflow-x-auto whitespace-pre no-scrollbar"><code>{fullCode}</code></pre>
            </div>
          );
          codeContent = [];
        } else {
          inCodeBlock = true;
          codeLang = line.replace('```', '').trim();
        }
        return;
      }

      if (inCodeBlock) {
        codeContent.push(line);
        return;
      }

      // Headers
      if (line.startsWith('### ')) {
        elements.push(<h3 key={index} class="text-sm font-bold text-neutral-900 dark:text-neutral-100 mt-4 mb-2 first:mt-1 font-sans">{line.substring(4)}</h3>);
      } else if (line.startsWith('## ')) {
        elements.push(<h2 key={index} class="text-base font-bold text-neutral-900 dark:text-neutral-100 mt-5 mb-2.5 first:mt-1 font-sans">{line.substring(3)}</h2>);
      } else if (line.startsWith('- ')) {
        // Simple lists
        elements.push(<li key={index} class="ml-4 list-disc text-neutral-700 dark:text-neutral-300 text-xs my-1 font-sans">{line.substring(2)}</li>);
      } else if (line.startsWith('|') && line.includes('---')) {
        // Table separator line, ignore
        return;
      } else if (line.startsWith('|')) {
        // Render simple table row
        const cells = line.split('|').map(c => c.trim()).filter(c => c !== '');
        elements.push(
          <div key={index} class="grid grid-cols-3 gap-2 px-2 py-1.5 border-b border-neutral-100 dark:border-neutral-800 text-[11px] font-sans text-neutral-600 dark:text-neutral-400">
            {cells.map((cell, cidx) => <span key={cidx} class={cidx === 0 ? "font-semibold text-neutral-800 dark:text-neutral-200" : ""}>{cell}</span>)}
          </div>
        );
      } else {
        // Normal paragraphs. Replace **text** with bold elements
        if (line.trim() === '') {
          elements.push(<div key={index} class="h-2" />);
          return;
        }
        
        // Simple bold parser
        const parts = line.split('**');
        const formattedLine = parts.map((part, pidx) => {
          if (pidx % 2 === 1) return <strong key={pidx} class="font-semibold text-neutral-900 dark:text-white">{part}</strong>;
          
          // Simple backtick code parser
          const codeParts = part.split('`');
          return codeParts.map((cpart, cidx) => {
            if (cidx % 2 === 1) return <code key={cidx} class="px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-red-500 dark:text-red-400 font-mono text-[10px]">{cpart}</code>;
            return cpart;
          });
        });

        elements.push(<p key={index} class="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed my-1.5 font-sans">{formattedLine}</p>);
      }
    });

    return elements;
  };

  return (
    <div class="h-full flex flex-col overflow-hidden bg-white dark:bg-apple-dark text-apple-text-light dark:text-apple-text-dark transition-colors-all">
      
      {/* HEADER SECTION */}
      <header class="flex items-center justify-between px-4 py-3 border-b border-apple-border-light dark:border-apple-border-dark bg-apple-light/50 dark:bg-apple-dark/50 backdrop-blur-md z-10">
        <div class="flex items-center gap-2">
          <img src="/icon128.png" alt="Divine DevTools Logo" class="h-6 w-6 object-contain" />
          <span class="font-semibold text-sm tracking-tight">Divine DevTools</span>
        </div>
        <div class="flex items-center gap-2">
          {!showSettings && (
            <button 
              onClick={() => toggleInspectMode()}
              aria-label="Inspect element"
              class={`p-2 rounded-lg transition-colors duration-150 relative ${
                isInspectMode 
                  ? 'bg-blue-600 text-white shadow-sm' 
                  : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
              }`}
            >
              <MousePointerClick size={16} />
              {isInspectMode && (
                <span class="absolute top-0 right-0 flex h-2 w-2">
                  <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span class="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </span>
              )}
            </button>
          )}
          
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            aria-label="Toggle theme"
            class="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400 transition-colors duration-150"
          >
            {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          <button 
            onClick={() => {
              const nextShow = !showSettings;
              setShowSettings(nextShow);
              if (nextShow && isInspectMode) {
                toggleInspectMode(false);
              }
            }}
            aria-label="Toggle settings"
            class={`p-2 rounded-lg transition-colors duration-150 ${
              showSettings 
                ? 'bg-neutral-100 dark:bg-neutral-800 text-blue-600 dark:text-blue-400' 
                : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
            }`}
          >
            <Settings size={16} />
          </button>
        </div>
      </header>

      {/* SETTINGS PANEL */}
      {/* SETTINGS PANEL */}
      {showSettings ? (
        /* SETTINGS PANEL (takes full height) */
        <div class="flex-1 px-4 py-4 bg-neutral-50 dark:bg-neutral-900/40 text-xs space-y-3 transition-colors-all overflow-y-auto">
          {/* Tabs */}
          <div class="flex border-b border-apple-border-light dark:border-apple-border-dark mb-2">
            <button 
              onClick={() => setSettingsTab('connection')}
              class={`flex-1 pb-1.5 text-center font-medium transition-all focus:outline-none ${
                settingsTab === 'connection' 
                  ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400 font-semibold' 
                  : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300'
              }`}
            >
              API Credentials
            </button>
            <button 
              onClick={() => setSettingsTab('skills')}
              class={`flex-1 pb-1.5 text-center font-medium transition-all focus:outline-none ${
                settingsTab === 'skills' 
                  ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400 font-semibold' 
                  : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300'
              }`}
            >
              Skills Manager ({installedSkills.length})
            </button>
          </div>

          {settingsTab === 'connection' ? (
            <div class="space-y-3">
              <div class="flex items-center justify-between text-[10px] font-semibold text-neutral-400 dark:text-neutral-500">
                <span>CONNECTION SETTINGS</span>
                <span class="text-[9px] text-green-600 dark:text-green-400">Auto-saves</span>
              </div>

              <div class="grid grid-cols-2 gap-2">
                <div>
                  <label class="block text-[10px] text-neutral-400 dark:text-neutral-500 mb-1">AI Provider</label>
                  <select 
                    value={settings.provider}
                    onChange={(e) => updateSettings('provider', e.target.value as any)}
                    class="w-full px-2 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-xs focus:outline-none focus:border-blue-500 text-neutral-800 dark:text-neutral-200"
                  >
                    <option value="gemini">Gemini API</option>
                    <option value="openai">OpenAI API</option>
                    <option value="custom">Custom Agent Endpoint</option>
                  </select>
                </div>
                <div>
                  <label class="block text-[10px] text-neutral-400 dark:text-neutral-500 mb-1">Model Name</label>
                  <input 
                    type="text"
                    value={settings.model}
                    onChange={(e) => updateSettings('model', e.target.value)}
                    placeholder={settings.provider === 'gemini' ? 'gemini-1.5-flash' : 'gpt-4o-mini'}
                    class="w-full px-2 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-xs focus:outline-none focus:border-blue-500 text-neutral-800 dark:text-neutral-200"
                  />
                </div>
              </div>

              {settings.provider !== 'custom' ? (
                <div>
                  <label class="block text-[10px] text-neutral-400 dark:text-neutral-500 mb-1">API Key</label>
                  <input 
                    type="password"
                    value={settings.apiKey}
                    onChange={(e) => updateSettings('apiKey', e.target.value)}
                    placeholder="Paste your API key here..."
                    class="w-full px-2 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-xs focus:outline-none focus:border-blue-500 text-neutral-800 dark:text-neutral-200 font-mono"
                  />
                </div>
              ) : (
                <div>
                  <label class="block text-[10px] text-neutral-400 dark:text-neutral-500 mb-1">Endpoint URL</label>
                  <input 
                    type="text"
                    value={settings.customEndpoint}
                    onChange={(e) => updateSettings('customEndpoint', e.target.value)}
                    placeholder="http://localhost:3000/api/agent"
                    class="w-full px-2 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-xs focus:outline-none focus:border-blue-500 text-neutral-800 dark:text-neutral-200 font-mono"
                  />
                </div>
              )}
            </div>
          ) : (
            <div class="space-y-4">
              {/* Installed Skills List */}
              <div class="space-y-2">
                <span class="block text-[10px] font-semibold text-neutral-400 dark:text-neutral-500">INSTALLED SKILLS</span>
                {installedSkills.length === 0 ? (
                  <p class="text-neutral-400 dark:text-neutral-600 text-[10px] italic">No skills installed. Add one below!</p>
                ) : (
                  <div class="space-y-1.5">
                    {installedSkills.map(skill => (
                      <div key={skill.id} class="flex items-start justify-between p-2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/50">
                        <div class="flex-1 min-w-0 pr-2">
                          <span class="block font-semibold text-[11px] text-neutral-800 dark:text-neutral-200 truncate">{skill.name}</span>
                          <span class="block text-[9px] text-neutral-400 dark:text-neutral-500 truncate" title={skill.description}>
                            Tags: {skill.description || 'none'}
                          </span>
                        </div>
                        <button 
                          onClick={() => handleDeleteSkill(skill.id)}
                          class="p-1 rounded text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                          title="Uninstall skill"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Import from URL Section */}
              <div class="border-t border-apple-border-light dark:border-apple-border-dark pt-3 space-y-2">
                <div class="flex items-center justify-between">
                  <span class="block text-[10px] font-semibold text-neutral-400 dark:text-neutral-500">IMPORT FROM GITHUB / URL</span>
                  <a 
                    href="https://skills.sh" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    class="text-[9px] text-blue-500 hover:underline flex items-center gap-0.5"
                  >
                    skills.sh registry ↗
                  </a>
                </div>
                <p class="text-[9px] text-neutral-400 dark:text-neutral-500 leading-normal mb-1">
                  Paste a direct SKILL.md URL or copy/paste an installation command directly from the registry (e.g. <code>npx skills add mattpocock/skills --skill grill-me</code>).
                </p>
                <div class="flex gap-2">
                  <input 
                    type="text"
                    value={importUrl}
                    onChange={(e) => setImportUrl(e.target.value)}
                    placeholder="npx skills add owner/repo --skill name"
                    class="w-full px-2 py-1 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-xs focus:outline-none focus:border-blue-500 text-neutral-800 dark:text-neutral-200"
                  />
                  <button 
                    onClick={handleImportFromUrl}
                    disabled={isImporting || !importUrl.trim()}
                    class="px-2.5 py-1 rounded-lg bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 disabled:opacity-50 font-medium transition-colors text-xs flex items-center gap-1 focus:outline-none"
                  >
                    {isImporting ? 'Fetching...' : 'Fetch'}
                  </button>
                </div>
                {importError && (
                  <p class="text-red-500 text-[10px] leading-normal">{importError}</p>
                )}
              </div>

              {/* Add Custom Skill Form */}
              <form onSubmit={handleAddSkill} class="border-t border-apple-border-light dark:border-apple-border-dark pt-3 space-y-2.5">
                <span class="block text-[10px] font-semibold text-neutral-400 dark:text-neutral-500">INSTALL CUSTOM SKILL</span>
                
                <div class="grid grid-cols-2 gap-2">
                  <div>
                    <label class="block text-[9px] text-neutral-400 dark:text-neutral-500 mb-0.5">Skill Name</label>
                    <input 
                      type="text"
                      required
                      value={newSkillName}
                      onChange={(e) => setNewSkillName(e.target.value)}
                      placeholder="React Guidelines"
                      class="w-full px-2 py-1 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-xs focus:outline-none focus:border-blue-500 text-neutral-800 dark:text-neutral-200"
                    />
                  </div>
                  <div>
                    <label class="block text-[9px] text-neutral-400 dark:text-neutral-500 mb-0.5">Match Keywords</label>
                    <input 
                      type="text"
                      value={newSkillDesc}
                      onChange={(e) => setNewSkillDesc(e.target.value)}
                      placeholder="react props hooks jsx tsx"
                      class="w-full px-2 py-1 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-xs focus:outline-none focus:border-blue-500 text-neutral-800 dark:text-neutral-200"
                    />
                  </div>
                </div>

                <div>
                  <label class="block text-[9px] text-neutral-400 dark:text-neutral-500 mb-0.5">Skill Rules (SKILL.md content)</label>
                  <textarea 
                    required
                    rows={3}
                    value={newSkillContent}
                    onChange={(e) => setNewSkillContent(e.target.value)}
                    placeholder="Provide guidelines, coding standards, or instructions that the AI should follow..."
                    class="w-full px-2 py-1 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-xs focus:outline-none focus:border-blue-500 text-neutral-800 dark:text-neutral-200 resize-none font-mono text-[10px]"
                  />
                </div>

                <button 
                  type="submit"
                  class="w-full flex items-center justify-center gap-1 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors focus:outline-none text-[11px]"
                >
                  <Plus size={12} />
                  <span>Install Skill</span>
                </button>
              </form>
            </div>
          )}
        </div>
      ) : (
        /* CHAT AND INSPECTOR VIEWS */
        <>
          {/* ERROR DISPLAY */}
          {errorText && (
            <div class="px-4 py-2 bg-red-50 dark:bg-red-950/20 border-b border-red-100 dark:border-red-900/30 flex items-start gap-2 text-[11px] text-red-600 dark:text-red-400">
              <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
              <span class="flex-1 leading-normal">{errorText}</span>
              <button onClick={() => setErrorText(null)} class="hover:text-red-800 font-semibold">Dismiss</button>
            </div>
          )}

          {/* SELECTED COMPONENT SUMMARY (ACCORDION) */}
          {selectedElement ? (
            <div class="border-b border-apple-border-light dark:border-apple-border-dark bg-apple-light/30 dark:bg-apple-dark/30">
              <button 
                onClick={() => setIsDetailsExpanded(!isDetailsExpanded)}
                class="w-full flex items-center justify-between px-4 py-2.5 text-left text-xs hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors"
              >
                <div class="flex items-center gap-2 truncate">
                  <span class="px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-mono text-[10px] font-bold">
                    {selectedElement.tagName}
                  </span>
                  <span class="font-mono text-neutral-500 truncate text-[10px] max-w-[200px]" title={selectedElement.selector}>
                    {selectedElement.selector}
                  </span>
                </div>
                <div class="flex items-center gap-1.5">
                  {selectedElement.pageMeta.frameworks.map(fw => (
                    <span key={fw} class="px-1.5 py-0.5 rounded bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400 text-[9px] font-medium font-sans">
                      {fw}
                    </span>
                  ))}
                  {isDetailsExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </div>
              </button>

              {isDetailsExpanded && (
                <div class="px-4 pb-4 pt-1 max-h-[220px] overflow-y-auto border-t border-apple-border-light/50 dark:border-apple-border-dark/50 text-[11px] leading-relaxed">
                  <div class="space-y-3">
                    {/* Selector Display */}
                    <div>
                      <div class="flex items-center justify-between text-neutral-400 dark:text-neutral-500 mb-1">
                        <span>CSS Selector</span>
                        <button 
                          onClick={() => copyToClipboard(selectedElement.selector, 'selector')}
                          class="flex items-center gap-1 hover:text-neutral-600 dark:hover:text-neutral-300"
                        >
                          {copiedSelector ? <Check size={10} className="text-green-500" /> : <Copy size={10} />}
                          <span>{copiedSelector ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                      <div class="p-2 rounded bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 font-mono break-all text-[10px]">
                        {selectedElement.selector}
                      </div>
                    </div>

                    {/* HTML Source Preview */}
                    <div>
                      <div class="flex items-center gap-1.5 text-neutral-400 dark:text-neutral-500 mb-1">
                        <Code size={11} />
                        <span>Element HTML</span>
                      </div>
                      <pre class="p-2 rounded bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 font-mono text-[10px] overflow-x-auto whitespace-pre no-scrollbar">
                        <code>{selectedElement.truncatedHtml}</code>
                      </pre>
                    </div>

                    {/* Key Computed Styles */}
                    <div>
                      <div class="flex items-center gap-1.5 text-neutral-400 dark:text-neutral-500 mb-1">
                        <Sliders size={11} />
                        <span>Styles (Captured)</span>
                      </div>
                      <div class="grid grid-cols-2 gap-1.5 font-mono text-[10px]">
                        {Object.entries(selectedElement.computedStyles).slice(0, 8).map(([key, val]) => (
                          <div key={key} class="flex items-center justify-between p-1 border-b border-neutral-100 dark:border-neutral-800">
                            <span class="text-neutral-400 truncate max-w-[80px]">{key}</span>
                            <span class="text-neutral-700 dark:text-neutral-300 truncate" title={val}>{val}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div class="px-4 py-6 text-center border-b border-apple-border-light dark:border-apple-border-dark bg-apple-light/10 dark:bg-apple-dark/10">
              <div class="mx-auto w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-400 mb-2">
                <Info size={16} />
              </div>
              <p class="text-xs text-neutral-500 dark:text-neutral-400 font-sans max-w-[240px] mx-auto">
                No element selected. Click the inspector button above and select a DOM node on the page to analyze.
              </p>
            </div>
          )}

          {/* CHAT LOG AREA */}
          <div class="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-neutral-50/50 dark:bg-apple-dark">
            {messages.length === 0 ? (
              <div class="h-full flex flex-col items-center justify-center text-center text-neutral-400 dark:text-neutral-600 pt-8">
                <img src="/icon128.png" alt="Divine DevTools Logo" class="w-12 h-12 mb-3 drop-shadow-md object-contain" />
                <h4 class="text-xs font-semibold mb-1">Divine Development Assistant</h4>
                <p class="text-[10px] max-w-[220px] leading-relaxed">
                  Analyze code structure and check standards directly in your browser. Install custom developer guidelines from the official <a href="https://skills.sh" target="_blank" rel="noopener noreferrer" class="text-blue-500 hover:underline">skills.sh registry</a>.
                </p>
              </div>
            ) : (
              messages.map((msg) => (
                <div 
                  key={msg.id}
                  class={`flex flex-col max-w-[90%] ${
                    msg.role === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'
                  }`}
                >
                  {/* Message Context Tag */}
                  {msg.role === 'user' && msg.skillsHint && msg.skillsHint.length > 0 && (
                    <span class="text-[9px] text-neutral-400 mb-1 flex items-center gap-1 font-mono">
                      <Terminal size={10} />
                      Skills: {msg.skillsHint.join(', ')}
                    </span>
                  )}

                  {/* Message Bubble */}
                  <div 
                    class={`px-3 py-2.5 rounded-2xl shadow-sm text-xs leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-neutral-800 dark:bg-neutral-200 text-white dark:text-neutral-900 rounded-tr-none'
                        : 'bg-white dark:bg-neutral-900 border border-apple-border-light dark:border-apple-border-dark text-apple-text-light dark:text-apple-text-dark rounded-tl-none w-full'
                    }`}
                  >
                    {msg.role === 'user' ? (
                      <p class="whitespace-pre-wrap font-sans">{msg.content}</p>
                    ) : (
                      <div class="space-y-1">{renderMarkdown(msg.content)}</div>
                    )}
                  </div>

                  {/* Timestamp */}
                  <span class="text-[8px] text-neutral-400 dark:text-neutral-500 mt-1 font-sans px-1">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))
            )}

            {/* Loading Spinner */}
            {isSending && (
              <div class="flex items-center gap-2 mr-auto text-neutral-400 dark:text-neutral-500 text-[11px] pl-1">
                <div class="flex space-x-1">
                  <div class="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div class="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div class="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
                <span>Agent working...</span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* INPUT PANEL & SKILLS PALETTE */}
          <div class="border-t border-apple-border-light dark:border-apple-border-dark bg-white dark:bg-apple-dark px-4 py-3 space-y-3">
            {/* SKILLS PALETTE (TOOLBAR) */}
            <div>
              <div class="flex items-center justify-between text-[10px] text-neutral-400 dark:text-neutral-500 mb-1.5 font-sans">
                <span class="flex items-center gap-1">
                  <Sparkles size={11} className="text-blue-500" />
                  <span>Skills Palette (Manual Override)</span>
                </span>
                <span>{selectedSkills.length > 0 ? `${selectedSkills.length} overrides` : 'Auto-pilot'}</span>
              </div>
              <div class="flex flex-wrap gap-1.5">
                {installedSkills.map((skill) => {
                  const isSelected = selectedSkills.includes(skill.id);
                  const isAuto = autoSkills.includes(skill.id);
                  return (
                    <button
                      key={skill.id}
                      onClick={() => toggleSkill(skill.id)}
                      title={isSelected ? 'Clear manual override' : `Explicitly target ${skill.name}`}
                      class={`px-2 py-1 rounded text-[9px] font-sans font-medium transition-all duration-150 border focus:outline-none flex items-center gap-1 ${
                        isSelected
                          ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                          : isAuto
                            ? 'bg-blue-50/50 border-blue-100 dark:bg-blue-950/10 dark:border-blue-900/30 text-blue-600 dark:text-blue-400'
                            : 'bg-neutral-50 border-neutral-200 dark:bg-neutral-900 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                      }`}
                    >
                      {skill.name}
                      {isAuto && !isSelected && <span class="w-1 h-1 rounded-full bg-blue-500" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* PROMPT TEXTAREA */}
            <form onSubmit={handleSendMessage} class="relative flex items-end gap-2 p-1.5 rounded-xl border border-apple-border-light dark:border-apple-border-dark bg-neutral-50 dark:bg-neutral-900 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-shadow">
              <textarea
                ref={inputRef}
                rows={1}
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={selectedElement ? "Ask about selected element..." : "Inspect an element to start..."}
                disabled={!selectedElement || isSending}
                class="flex-1 max-h-30 resize-none border-0 bg-transparent py-1.5 pl-2 text-xs focus:ring-0 focus:outline-none text-neutral-800 dark:text-neutral-200 placeholder-neutral-400 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!inputVal.trim() || isSending || !selectedElement}
                aria-label="Send message"
                class="p-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-30 disabled:hover:bg-blue-600 transition-colors flex-shrink-0 focus:outline-none"
              >
                <Send size={14} />
              </button>
            </form>
          </div>
        </>
      )}

    </div>
  );
}
