export interface AxeNode {
  html: string;
  target: string[];
  failureSummary?: string;
  any?: any[];
  all?: any[];
  none?: any[];
}

export interface AxeViolation {
  id: string;
  impact?: 'minor' | 'moderate' | 'serious' | 'critical' | null;
  tags: string[];
  description: string;
  help: string;
  helpUrl: string;
  nodes: AxeNode[];
}

export interface GeneratedIssueAndFix {
  issue: {
    id: string;
    title: string;
    severity: 'critical' | 'serious' | 'moderate' | 'minor';
    category:
      | 'Images & Media'
      | 'Color & Contrast'
      | 'Forms & Controls'
      | 'Keyboard & Navigation'
      | 'Semantics & Structure'
      | 'ARIA & Screen Readers';
    wcagCriteria: string;
    wcagLevel: 'A' | 'AA' | 'AAA';
    affectedPage: string;
    affectedElement: string;
    selector: string;
    elementCount: number;
    ruleId: string;
    problemExplanation: string;
    whyItMatters: string;
    recommendedAction: string;
    technicalExplanation: string;
    rawHtmlSnippet: string;
    suggestedFixSnippet: string;
    docUrl: string;
    status: 'open' | 'in_progress' | 'resolved';
    detectedAt: string;
    isAiGenerated?: boolean;
    confidenceScore?: number;
  };
  fix: {
    id: string;
    issueId: string;
    issueTitle: string;
    severity: 'critical' | 'serious' | 'moderate' | 'minor';
    category:
      | 'Images & Media'
      | 'Color & Contrast'
      | 'Forms & Controls'
      | 'Keyboard & Navigation'
      | 'Semantics & Structure'
      | 'ARIA & Screen Readers';
    filePath: string;
    affectedElement: string;
    wcagCriteria: string;
    whatIsWrong: string;
    whyItIsWrong: string;
    howSolutionFixesIt: string;
    originalSnippet: string;
    suggestedSnippet: string;
    diffSummary: string;
    status: 'suggested' | 'approved' | 'rejected' | 'applied' | 'verified';
    approved: boolean;
    isAiGenerated?: boolean;
    confidenceScore?: number;
  };
}

/**
 * Maps axe-core rule IDs to WCAG standard criteria numbers and titles.
 */
function mapAxeRuleToWcag(ruleId: string, tags: string[]): { criteria: string; level: 'A' | 'AA' | 'AAA'; docUrl: string } {
  // WCAG rule lookup table
  const ruleMap: Record<string, { criteria: string; level: 'A' | 'AA' | 'AAA'; slug: string }> = {
    'image-alt': { criteria: '1.1.1 Non-text Content', level: 'A', slug: 'non-text-content' },
    'input-image-alt': { criteria: '1.1.1 Non-text Content', level: 'A', slug: 'non-text-content' },
    'area-alt': { criteria: '1.1.1 Non-text Content', level: 'A', slug: 'non-text-content' },
    'color-contrast': { criteria: '1.4.3 Contrast (Minimum)', level: 'AA', slug: 'contrast-minimum' },
    'color-contrast-enhanced': { criteria: '1.4.6 Contrast (Enhanced)', level: 'AAA', slug: 'contrast-enhanced' },
    'document-title': { criteria: '2.4.2 Page Titled', level: 'A', slug: 'page-titled' },
    'html-has-lang': { criteria: '3.1.1 Language of Page', level: 'A', slug: 'language-of-page' },
    'html-lang-valid': { criteria: '3.1.1 Language of Page', level: 'A', slug: 'language-of-page' },
    'link-name': { criteria: '2.4.4 Link Purpose (In Context)', level: 'A', slug: 'link-purpose-in-context' },
    'button-name': { criteria: '4.1.2 Name, Role, Value', level: 'A', slug: 'name-role-value' },
    'label': { criteria: '3.3.2 Labels or Instructions', level: 'A', slug: 'labels-or-instructions' },
    'label-title-only': { criteria: '3.3.2 Labels or Instructions', level: 'A', slug: 'labels-or-instructions' },
    'form-field-multiple-labels': { criteria: '3.3.2 Labels or Instructions', level: 'A', slug: 'labels-or-instructions' },
    'aria-allowed-attr': { criteria: '4.1.2 Name, Role, Value', level: 'A', slug: 'name-role-value' },
    'aria-hidden-body': { criteria: '4.1.2 Name, Role, Value', level: 'A', slug: 'name-role-value' },
    'aria-required-attr': { criteria: '4.1.2 Name, Role, Value', level: 'A', slug: 'name-role-value' },
    'aria-roles': { criteria: '4.1.2 Name, Role, Value', level: 'A', slug: 'name-role-value' },
    'aria-valid-attr-value': { criteria: '4.1.2 Name, Role, Value', level: 'A', slug: 'name-role-value' },
    'aria-valid-attr': { criteria: '4.1.2 Name, Role, Value', level: 'A', slug: 'name-role-value' },
    'duplicate-id': { criteria: '4.1.1 Parsing', level: 'A', slug: 'parsing' },
    'duplicate-id-active': { criteria: '4.1.1 Parsing', level: 'A', slug: 'parsing' },
    'heading-order': { criteria: '1.3.1 Info and Relationships', level: 'A', slug: 'info-and-relationships' },
    'empty-heading': { criteria: '1.3.1 Info and Relationships', level: 'A', slug: 'info-and-relationships' },
    'landmark-one-main': { criteria: '1.3.1 Info and Relationships', level: 'A', slug: 'info-and-relationships' },
    'region': { criteria: '1.3.1 Info and Relationships', level: 'A', slug: 'info-and-relationships' },
    'tabindex': { criteria: '2.4.3 Focus Order', level: 'A', slug: 'focus-order' },
    'bypass': { criteria: '2.4.1 Bypass Blocks', level: 'A', slug: 'bypass-blocks' },
    'focus-order-semantics': { criteria: '2.4.3 Focus Order', level: 'A', slug: 'focus-order' }
  };

  if (ruleMap[ruleId]) {
    const item = ruleMap[ruleId];
    return {
      criteria: item.criteria,
      level: item.level,
      docUrl: `https://www.w3.org/WAI/WCAG21/Understanding/${item.slug}.html`
    };
  }

  // Extract from tags if present
  let level: 'A' | 'AA' | 'AAA' = 'A';
  if (tags.includes('wcag2aaa') || tags.includes('wcag21aaa')) level = 'AAA';
  else if (tags.includes('wcag2aa') || tags.includes('wcag21aa')) level = 'AA';

  return {
    criteria: `WCAG 2.1 (Level ${level})`,
    level,
    docUrl: 'https://www.w3.org/WAI/WCAG21/quickref/'
  };
}

/**
 * Assigns an issue category based on rule ID and tags.
 */
function categorizeRule(
  ruleId: string
): 'Images & Media' | 'Color & Contrast' | 'Forms & Controls' | 'Keyboard & Navigation' | 'Semantics & Structure' | 'ARIA & Screen Readers' {
  if (ruleId.includes('image') || ruleId.includes('alt') || ruleId.includes('video') || ruleId.includes('audio')) {
    return 'Images & Media';
  }
  if (ruleId.includes('contrast') || ruleId.includes('color')) {
    return 'Color & Contrast';
  }
  if (ruleId.includes('label') || ruleId.includes('form') || ruleId.includes('input') || ruleId.includes('select')) {
    return 'Forms & Controls';
  }
  if (ruleId.includes('focus') || ruleId.includes('tabindex') || ruleId.includes('keyboard') || ruleId.includes('accesskeys')) {
    return 'Keyboard & Navigation';
  }
  if (ruleId.includes('aria')) {
    return 'ARIA & Screen Readers';
  }
  return 'Semantics & Structure';
}

/**
 * Generates an accessible HTML fix snippet from the failing HTML node.
 */
function generateHtmlFix(ruleId: string, originalHtml: string): { fixSnippet: string; diffSummary: string; howItFixes: string } {
  const trimmed = originalHtml.trim();

  switch (ruleId) {
    case 'image-alt':
    case 'input-image-alt': {
      if (trimmed.includes('alt=')) {
        const fixed = trimmed.replace(/alt=(['"])\s*\1/, 'alt="Descriptive illustration of image content"');
        return {
          fixSnippet: fixed,
          diffSummary: '+ alt="Descriptive illustration of image content"',
          howItFixes: 'Adds an informative alt attribute so screen readers can describe the visual content to visually impaired visitors.'
        };
      }
      const fixed = trimmed.replace(/<img\b([^>]*)>/i, '<img$1 alt="Descriptive illustration of image content">');
      return {
        fixSnippet: fixed,
        diffSummary: '+ alt="Descriptive illustration of image content"',
        howItFixes: 'Provides a descriptive text alternative attribute for screen readers and search crawlers.'
      };
    }

    case 'color-contrast': {
      // Suggest high-contrast style adjustment
      let fixed = trimmed;
      if (fixed.includes('style=')) {
        fixed = fixed.replace(/style=(['"])(.*?)\1/, 'style=$1$2; color: #1E293B; background-color: #FFFFFF;$1');
      } else {
        fixed = fixed.replace(/^<([a-zA-Z0-9]+)\b([^>]*)>/, '<$1$2 style="color: #1E293B; background-color: #FFFFFF;">');
      }
      return {
        fixSnippet: fixed,
        diffSummary: '+ style="color: #1E293B; background-color: #FFFFFF;"',
        howItFixes: 'Elevates foreground-to-background contrast ratio above 4.5:1 to ensure readability for low-vision and mobile users.'
      };
    }

    case 'label':
    case 'label-title-only': {
      // Associate label or aria-label
      if (trimmed.includes('<input') || trimmed.includes('<textarea') || trimmed.includes('<select')) {
        const idMatch = trimmed.match(/id=(['"])(.*?)\1/);
        const inputId = idMatch ? idMatch[2] : 'form-input-field';
        let fixedInput = trimmed;
        if (!idMatch) {
          fixedInput = fixedInput.replace(/^<([a-zA-Z0-9]+)\b/, `<$1 id="${inputId}"`);
        }
        const fixed = `<label for="${inputId}" class="form-label">\n  Input Field Label\n</label>\n${fixedInput}`;
        return {
          fixSnippet: fixed,
          diffSummary: `+ <label for="${inputId}">\n+ id="${inputId}"`,
          howItFixes: 'Explicitly associates a <label> element with the input control via the "for" and "id" attributes.'
        };
      }
      const fixed = trimmed.replace(/^<([a-zA-Z0-9]+)\b/, '<$1 aria-label="Descriptive Input Label"');
      return {
        fixSnippet: fixed,
        diffSummary: '+ aria-label="Descriptive Input Label"',
        howItFixes: 'Adds an explicit accessible name using aria-label.'
      };
    }

    case 'button-name': {
      if (trimmed.includes('aria-label=')) {
        const fixed = trimmed.replace(/aria-label=(['"])\s*\1/, 'aria-label="Perform Action"');
        return {
          fixSnippet: fixed,
          diffSummary: '+ aria-label="Perform Action"',
          howItFixes: 'Provides a non-empty accessible name for assistive technology announcements.'
        };
      }
      const fixed = trimmed.replace(/^<button\b([^>]*)>/i, '<button$1 aria-label="Perform Action">');
      return {
        fixSnippet: fixed,
        diffSummary: '+ aria-label="Perform Action"',
        howItFixes: 'Adds an aria-label attribute to provide an explicit name for icon buttons and clickables.'
      };
    }

    case 'link-name': {
      const fixed = trimmed.replace(/^<a\b([^>]*)>/i, '<a$1 aria-label="Descriptive Link Destination">');
      return {
        fixSnippet: fixed,
        diffSummary: '+ aria-label="Descriptive Link Destination"',
        howItFixes: 'Ensures the link provides self-contained context when read out of context in screen reader link lists.'
      };
    }

    case 'document-title': {
      return {
        fixSnippet: '<head>\n  <title>Your Organization or Page Name - Comprehensive Services</title>\n</head>',
        diffSummary: '+ <title>Descriptive Page Title</title>',
        howItFixes: 'Inserts a meaningful, unique <title> tag in the document <head> describing page contents.'
      };
    }

    case 'html-has-lang':
    case 'html-lang-valid': {
      const fixed = trimmed.replace(/<html\b([^>]*)>/i, '<html$1 lang="en">');
      return {
        fixSnippet: fixed.includes('lang=') ? fixed : '<html lang="en">',
        diffSummary: '+ lang="en"',
        howItFixes: 'Declares the primary human language of the document to allow speech synthesizers to pronounce words correctly.'
      };
    }

    default: {
      // General accessible wrapper
      const fixed = trimmed.replace(/^<([a-zA-Z0-9]+)\b/, '<$1 aria-label="Accessible element"');
      return {
        fixSnippet: fixed,
        diffSummary: '+ aria-label="Accessible element"',
        howItFixes: 'Enriches semantic attributes to adhere to W3C Accessible Rich Internet Applications specifications.'
      };
    }
  }
}

/**
 * Transforms an axe-core violation node into an AccessAI Issue & AI Fix suggestion.
 */
export function generateIssueAndFix(
  violation: AxeViolation,
  node: AxeNode,
  pageUrl: string,
  index: number
): GeneratedIssueAndFix {
  const issueId = `iss-${Date.now().toString().slice(-6)}-${index}`;
  const fixId = `fix-${Date.now().toString().slice(-6)}-${index}`;

  const severityMap: Record<string, 'critical' | 'serious' | 'moderate' | 'minor'> = {
    critical: 'critical',
    serious: 'serious',
    moderate: 'moderate',
    minor: 'minor'
  };

  const severity = severityMap[violation.impact || 'moderate'] || 'moderate';
  const category = categorizeRule(violation.id);
  const wcag = mapAxeRuleToWcag(violation.id, violation.tags);

  const selector = node.target && node.target.length > 0 ? node.target.join(' > ') : 'body';
  const rawHtml = node.html || `<${selector}>`;

  const { fixSnippet, diffSummary, howItFixes } = generateHtmlFix(violation.id, rawHtml);

  // Human-friendly title
  const title = violation.help || violation.description || `Accessibility Issue: ${violation.id}`;

  // Why it matters
  let whyItMatters = 'Assistive technologies depend on valid semantic markup and accessible naming to convey meaning to users.';
  if (category === 'Images & Media') {
    whyItMatters = 'Blind and low-vision users utilizing screen readers cannot interpret the visual meaning or function of images without alternative text.';
  } else if (category === 'Color & Contrast') {
    whyItMatters = 'Low-contrast text is illegible for individuals with low vision, color blindness, or users viewing displays under direct sunlight.';
  } else if (category === 'Forms & Controls') {
    whyItMatters = 'Form fields without programmatic labels cannot be announced by screen readers, preventing users from knowing what information is expected.';
  } else if (category === 'Keyboard & Navigation') {
    whyItMatters = 'Users with motor impairments who navigate exclusively via keyboard or switch hardware cannot activate or focus elements that lack accessible names or proper tab order.';
  }

  // Recommended action
  let recommendedAction = 'Update the element attributes in your website template to comply with WCAG requirements.';
  if (violation.id === 'image-alt') {
    recommendedAction = 'Add a descriptive alt="..." attribute or use alt="" if the image is purely decorative.';
  } else if (violation.id === 'color-contrast') {
    recommendedAction = 'Increase the contrast between foreground text and background color to at least 4.5:1 (or 3:1 for large text).';
  } else if (violation.id === 'label') {
    recommendedAction = 'Associate a <label for="..."> element with this input or provide an aria-label.';
  } else if (violation.id === 'button-name' || violation.id === 'link-name') {
    recommendedAction = 'Ensure the button or link contains visible text or an aria-label describing its destination or action.';
  }

  // URL path for display
  let pageDisplay = pageUrl;
  try {
    const parsed = new URL(pageUrl);
    pageDisplay = parsed.pathname || '/';
  } catch {
    // Keep as is
  }

  const issue: GeneratedIssueAndFix['issue'] = {
    id: issueId,
    title,
    severity,
    category,
    wcagCriteria: wcag.criteria,
    wcagLevel: wcag.level,
    affectedPage: pageDisplay,
    affectedElement: rawHtml,
    selector,
    elementCount: 1,
    ruleId: violation.id,
    problemExplanation: node.failureSummary || violation.description,
    whyItMatters,
    recommendedAction,
    technicalExplanation: `axe-core rule "${violation.id}" triggered on selector "${selector}". ${violation.description}.`,
    rawHtmlSnippet: rawHtml,
    suggestedFixSnippet: fixSnippet,
    docUrl: wcag.docUrl,
    status: 'open',
    detectedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
    isAiGenerated: false,
    confidenceScore: 90
  };

  const fix: GeneratedIssueAndFix['fix'] = {
    id: fixId,
    issueId,
    issueTitle: title,
    severity,
    category,
    filePath: `External Website HTML (${pageDisplay})`,
    affectedElement: rawHtml,
    wcagCriteria: wcag.criteria,
    whatIsWrong: `Element violates axe rule "${violation.id}": ${violation.help}.`,
    whyItIsWrong: whyItMatters,
    howSolutionFixesIt: howItFixes,
    originalSnippet: rawHtml,
    suggestedSnippet: fixSnippet,
    diffSummary,
    status: 'suggested',
    approved: false,
    isAiGenerated: false,
    confidenceScore: 90
  };

  return { issue, fix };
}

export interface AiRemediationResult {
  whatIsWrong: string;
  whyItIsWrong: string;
  howSolutionFixesIt: string;
  suggestedSnippet: string;
  diffSummary: string;
  recommendedAction: string;
  isAiGenerated: boolean;
  confidenceScore: number;
}

/**
 * Invokes Google Gemini API to analyze an accessibility defect and return a smart code remediation.
 * Falls back gracefully to heuristic rules if API key is not configured or network call fails.
 */
export async function generateAiRemediationWithGemini(
  ruleId: string,
  rawHtml: string,
  description: string,
  helpText: string,
  wcagCriteria: string,
  apiKey?: string
): Promise<AiRemediationResult> {
  const effectiveKey = apiKey || process.env.GEMINI_API_KEY;

  if (effectiveKey && effectiveKey.trim().length > 0) {
    try {
      const prompt = `You are AccessAI, an AI engineer and accessibility specialist.
Perform a code-level remediation for this WCAG violation.

DEFECT DETAILS:
- Rule: ${ruleId}
- Criteria: ${wcagCriteria}
- Description: ${description}
- Guideline: ${helpText}

FAILING HTML:
${rawHtml}

Return a single JSON object with these keys (DO NOT output markdown ticks or extra text):
{
  "whatIsWrong": "Clear 1-2 sentence explanation of the accessibility barrier in this element",
  "whyItIsWrong": "Impact on assistive technology users (screen readers, keyboard navigators)",
  "howSolutionFixesIt": "How the updated markup resolves the barrier to meet WCAG",
  "suggestedSnippet": "The remediated, production-ready HTML code snippet",
  "diffSummary": "Short diff note, e.g. '+ alt=\"...\"'",
  "recommendedAction": "Actionable instructions for the developer",
  "confidenceScore": 95
}`;

      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${effectiveKey.trim()}`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.1
          }
        })
      });

      if (response.ok) {
        const json: any = await response.json();
        const rawContent = json?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawContent) {
          const parsed = JSON.parse(rawContent.trim());
          if (parsed.suggestedSnippet) {
            return {
              whatIsWrong: parsed.whatIsWrong || description,
              whyItIsWrong: parsed.whyItIsWrong || helpText,
              howSolutionFixesIt: parsed.howSolutionFixesIt || 'Applies accessible markup according to WCAG.',
              suggestedSnippet: parsed.suggestedSnippet,
              diffSummary: parsed.diffSummary || '+ accessibility attributes',
              recommendedAction: parsed.recommendedAction || helpText,
              isAiGenerated: true,
              confidenceScore: typeof parsed.confidenceScore === 'number' ? parsed.confidenceScore : 94
            };
          }
        }
      }
    } catch (apiErr) {
      console.warn('Gemini API call failed, falling back to heuristic remediation:', apiErr);
    }
  }

  // Graceful rule-based heuristic fallback
  const fallback = generateHtmlFix(ruleId, rawHtml);
  return {
    whatIsWrong: `Element violates rule "${ruleId}": ${helpText}.`,
    whyItIsWrong: 'Assistive technologies depend on valid semantic markup and accessible naming to convey meaning to users.',
    howSolutionFixesIt: fallback.howItFixes,
    suggestedSnippet: fallback.fixSnippet,
    diffSummary: fallback.diffSummary,
    recommendedAction: `Update element markup to comply with ${wcagCriteria}.`,
    isAiGenerated: false,
    confidenceScore: 88
  };
}
