import { ElementContext, PageMetadata, ParentContext } from '../types';

let isSelecting = false;
let hoveredElement: HTMLElement | null = null;
let overlayContainer: HTMLDivElement | null = null;
let highlightOverlay: HTMLDivElement | null = null;
let highlightLabel: HTMLDivElement | null = null;

// Unique ID for style isolation
const OVERLAY_ROOT_ID = 'divine-inspector-overlay-root';

// 1. Framework detection heuristics
function detectFrameworks(): string[] {
  const frameworks: string[] = [];

  // React
  const hasReactRoot = document.querySelector('[data-reactroot]');
  const hasReactProps = Array.from(document.querySelectorAll('*')).slice(0, 100).some(el => {
    return Object.keys(el).some(key => key.startsWith('__react'));
  });
  if (hasReactRoot || hasReactProps || (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__) {
    frameworks.push('React');
  }

  // Next.js
  if (document.getElementById('__next') || document.querySelector('script[src*="_next/static"]') || document.querySelector('meta[name="next-head-count"]')) {
    frameworks.push('Next.js');
  }

  // Vue
  const hasVueAttr = document.querySelector('[data-v-]');
  const hasVueApp = (window as any).__VUE__ || Array.from(document.querySelectorAll('*')).slice(0, 100).some(el => {
    return Object.keys(el).some(key => key.startsWith('__vue'));
  });
  if (hasVueAttr || hasVueApp) {
    frameworks.push('Vue');
  }

  // Angular
  if (document.querySelector('[ng-version]') || document.querySelector('[class*="ng-"]') || document.querySelector('[ng-content]')) {
    frameworks.push('Angular');
  }

  // Tailwind CSS
  let hasTailwindInStyles = false;
  try {
    hasTailwindInStyles = Array.from(document.styleSheets).some(sheet => {
      try {
        return Array.from(sheet.cssRules).some(rule => {
          return rule.cssText.includes('--tw-') || rule.cssText.includes('tailwindcss');
        });
      } catch (e) {
        return false;
      }
    });
  } catch (e) {
    // Ignore stylesheet permission error
  }

  const hasTailwindClasses = Array.from(document.querySelectorAll('*')).slice(0, 100).some(el => {
    return Array.from(el.classList).some(cls => /^(bg-|text-|p-|m-|flex|grid|rounded-|border-|w-|h-|font-|hover:)/.test(cls));
  });

  if (hasTailwindInStyles || hasTailwindClasses) {
    frameworks.push('Tailwind CSS');
  }

  return frameworks;
}

// 2. CSS Selector Generator
function getUniqueSelector(el: HTMLElement): string {
  if (el.id) {
    return `#${el.id}`;
  }

  if (el === document.body) {
    return 'body';
  }

  const path: string[] = [];
  let current: HTMLElement | null = el;

  while (current && current !== document.documentElement && current !== document.body) {
    let tagName = current.tagName.toLowerCase();
    
    // Sanitize classes for selectors
    const classes = Array.from(current.classList)
      .filter(cls => !cls.startsWith('divine-') && !cls.includes('hover') && cls.length < 30)
      .map(cls => `.${cls}`)
      .join('');
      
    let selector = tagName + classes;

    let parent = current.parentElement;
    if (parent) {
      const siblings = Array.from(parent.children).filter(sib => sib.tagName === current!.tagName);
      if (siblings.length > 1) {
        const index = siblings.indexOf(current) + 1;
        selector += `:nth-of-type(${index})`;
      }
    }

    path.unshift(selector);
    current = parent;
  }

  return path.join(' > ');
}

// 3. Captures style details
function getStyleDetails(el: HTMLElement): { inline: string; computed: Record<string, string> } {
  const inline = el.style.cssText;
  const computed: Record<string, string> = {};
  
  const computedStyle = window.getComputedStyle(el);
  const stylesToCapture = [
    'color', 'background-color', 'font-family', 'font-size', 'font-weight', 'line-height',
    'margin', 'padding', 'width', 'height', 'display', 'position', 'top', 'left',
    'flex-direction', 'justify-content', 'align-items', 'grid-template-columns',
    'border', 'border-radius', 'box-shadow', 'opacity', 'z-index'
  ];

  for (const style of stylesToCapture) {
    const val = computedStyle.getPropertyValue(style);
    if (val && val !== 'none' && val !== 'normal' && val !== 'auto' && val !== 'rgba(0, 0, 0, 0)' && val !== '0px') {
      computed[style] = val;
    }
  }

  return { inline, computed };
}

// 4. Truncate HTML safely for token efficiency
function truncateHtml(html: string, maxLen: number = 3000): string {
  if (html.length <= maxLen) return html;
  
  const firstAngle = html.indexOf('>');
  if (firstAngle === -1) return html.substring(0, maxLen) + '... (truncated)';
  
  const openingTag = html.substring(0, firstAngle + 1);
  const tagNameMatch = openingTag.match(/^<([a-z0-9-]+)/i);
  const tagName = tagNameMatch ? tagNameMatch[1] : '';
  const closingTag = tagName ? `</${tagName}>` : '';
  
  return `${openingTag}\n  <!-- ... CONTENT TRUNCATED (${(html.length / 1024).toFixed(1)} KB) ... -->\n${closingTag}`;
}

// 5. Setup the overlay system in Shadow DOM
function createOverlay() {
  if (overlayContainer) return;

  overlayContainer = document.createElement('div');
  overlayContainer.id = OVERLAY_ROOT_ID;
  overlayContainer.style.position = 'fixed';
  overlayContainer.style.top = '0';
  overlayContainer.style.left = '0';
  overlayContainer.style.width = '100vw';
  overlayContainer.style.height = '100vh';
  overlayContainer.style.pointerEvents = 'none';
  overlayContainer.style.zIndex = '2147483647'; // Max z-index

  const shadow = overlayContainer.attachShadow({ mode: 'open' });

  highlightOverlay = document.createElement('div');
  highlightOverlay.style.position = 'fixed';
  highlightOverlay.style.border = '2px solid #007aff';
  highlightOverlay.style.backgroundColor = 'rgba(0, 122, 255, 0.08)';
  highlightOverlay.style.pointerEvents = 'none';
  highlightOverlay.style.zIndex = '2147483647';
  highlightOverlay.style.display = 'none';
  highlightOverlay.style.boxSizing = 'border-box';
  highlightOverlay.style.borderRadius = '2px';
  highlightOverlay.style.transition = 'top 0.08s ease-out, left 0.08s ease-out, width 0.08s ease-out, height 0.08s ease-out';

  highlightLabel = document.createElement('div');
  highlightLabel.style.position = 'absolute';
  highlightLabel.style.backgroundColor = '#007aff';
  highlightLabel.style.color = '#ffffff';
  highlightLabel.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  highlightLabel.style.fontSize = '11px';
  highlightLabel.style.fontWeight = 'bold';
  highlightLabel.style.padding = '2px 6px';
  highlightLabel.style.borderRadius = '3px';
  highlightLabel.style.whiteSpace = 'nowrap';
  highlightLabel.style.top = '-20px';
  highlightLabel.style.left = '0';
  highlightLabel.style.boxShadow = '0 2px 4px rgba(0,0,0,0.15)';

  highlightOverlay.appendChild(highlightLabel);
  shadow.appendChild(highlightOverlay);
  document.documentElement.appendChild(overlayContainer);
}

function removeOverlay() {
  if (overlayContainer) {
    overlayContainer.remove();
    overlayContainer = null;
    highlightOverlay = null;
    highlightLabel = null;
  }
}

// 6. Update highlight coordinates
function updateOverlayPosition() {
  if (!isSelecting || !hoveredElement || !highlightOverlay || !highlightLabel) return;

  const rect = hoveredElement.getBoundingClientRect();
  
  highlightOverlay.style.top = `${rect.top}px`;
  highlightOverlay.style.left = `${rect.left}px`;
  highlightOverlay.style.width = `${rect.width}px`;
  highlightOverlay.style.height = `${rect.height}px`;
  highlightOverlay.style.display = 'block';

  // Label configuration
  const classesString = Array.from(hoveredElement.classList).slice(0, 3).map(c => `.${c}`).join('');
  highlightLabel.textContent = `${hoveredElement.tagName.toLowerCase()}${classesString}`;

  // Adjust label position if element is at the very top of page
  if (rect.top < 24) {
    highlightLabel.style.top = '2px';
    highlightLabel.style.left = '2px';
  } else {
    highlightLabel.style.top = '-20px';
    highlightLabel.style.left = '0';
  }
}

// 7. Mouse and click handlers
const handleMouseOver = (e: MouseEvent) => {
  if (!isSelecting) return;
  
  const target = e.target as HTMLElement;
  if (!target || target.id === OVERLAY_ROOT_ID) return;

  hoveredElement = target;
  updateOverlayPosition();
};

const handleMouseOut = (e: MouseEvent) => {
  if (!isSelecting) return;
  const target = e.target as HTMLElement;
  if (target === hoveredElement) {
    hoveredElement = null;
    if (highlightOverlay) {
      highlightOverlay.style.display = 'none';
    }
  }
};

const handleClick = (e: MouseEvent) => {
  if (!isSelecting) return;

  e.preventDefault();
  e.stopPropagation();

  const target = e.target as HTMLElement;
  if (!target || target.id === OVERLAY_ROOT_ID) return;

  captureAndSendElement(target);
  stopSelectionMode();
};

// 8. Gather all data context and post message
function captureAndSendElement(el: HTMLElement) {
  try {
    const tagName = el.tagName.toLowerCase();
    const selector = getUniqueSelector(el);
    const outerHtml = el.outerHTML;
    const truncatedHtml = truncateHtml(outerHtml);
    const { inline: inlineStyles, computed: computedStyles } = getStyleDetails(el);

    // Parent details
    let parentContext: ParentContext | null = null;
    if (el.parentElement) {
      parentContext = {
        tagName: el.parentElement.tagName.toLowerCase(),
        classes: Array.from(el.parentElement.classList).join(' '),
        outerHtml: truncateHtml(el.parentElement.outerHTML, 500)
      };
    }

    // Ancestor classnames
    const ancestors: string[] = [];
    let parent = el.parentElement;
    while (parent && ancestors.length < 5) {
      const cls = Array.from(parent.classList).join(' ');
      ancestors.push(`${parent.tagName.toLowerCase()}${cls ? '.' + cls.replace(/\s+/g, '.') : ''}`);
      parent = parent.parentElement;
    }

    const pageMeta: PageMetadata = {
      url: window.location.href,
      title: document.title,
      frameworks: detectFrameworks()
    };

    const elementContext: ElementContext = {
      tagName,
      selector,
      outerHtml,
      truncatedHtml,
      inlineStyles,
      computedStyles,
      parentContext,
      ancestors,
      pageMeta
    };

    console.log('Divine DevTools - Selected Element:', elementContext);
    chrome.runtime.sendMessage({
      action: 'elementSelected',
      payload: elementContext
    });
  } catch (error) {
    console.error('Divine DevTools - Capture failed:', error);
    chrome.runtime.sendMessage({
      action: 'selectionError',
      error: error instanceof Error ? error.message : 'Unknown inspection error'
    });
  }
}

// 9. Toggling inspectors
function startSelectionMode() {
  if (isSelecting) return;
  isSelecting = true;
  createOverlay();
  
  document.addEventListener('mouseover', handleMouseOver, true);
  document.addEventListener('mouseout', handleMouseOut, true);
  document.addEventListener('click', handleClick, true);
  
  window.addEventListener('scroll', updateOverlayPosition, { passive: true });
  window.addEventListener('resize', updateOverlayPosition);

  // Set document cursor style
  document.body.style.cursor = 'crosshair';
  
  // Notify sidepanel selection started
  chrome.runtime.sendMessage({ action: 'selectionModeChanged', active: true });
}

function stopSelectionMode() {
  if (!isSelecting) return;
  isSelecting = false;
  removeOverlay();

  document.removeEventListener('mouseover', handleMouseOver, true);
  document.removeEventListener('mouseout', handleMouseOut, true);
  document.removeEventListener('click', handleClick, true);
  
  window.removeEventListener('scroll', updateOverlayPosition);
  window.removeEventListener('resize', updateOverlayPosition);

  document.body.style.cursor = '';
  hoveredElement = null;

  // Notify sidepanel selection stopped
  chrome.runtime.sendMessage({ action: 'selectionModeChanged', active: false });
}

// Listen for messages from popup or sidepanel
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'startSelection') {
    startSelectionMode();
    sendResponse({ status: 'started' });
  } else if (message.action === 'stopSelection') {
    stopSelectionMode();
    sendResponse({ status: 'stopped' });
  }
  return true;
});

console.log('Divine DevTools Content Script initialized.');
