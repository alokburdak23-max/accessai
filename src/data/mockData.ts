import {
  AccessibilityIssue,
  AIRecommendation,
  FixSuggestion,
  RecentScanItem,
  ScanHistoryItem,
  RootCausePattern,
  UserImpactCategory,
  NotificationItem,
  UserSettings
} from '../types';

export const mockRecentScans: RecentScanItem[] = [
  {
    id: 'scan-01',
    url: 'https://acme-store.io',
    score: 76,
    issuesCount: {
      critical: 5,
      serious: 9,
      moderate: 12,
      minor: 6,
      total: 32
    },
    lastScanned: '14 minutes ago',
    status: 'Completed',
    durationSeconds: 18.4,
    pagesScanned: 14,
    complianceLevel: 'Needs Improvement (WCAG 2.1 AA)'
  },
  {
    id: 'scan-02',
    url: 'https://fintech-portal.dev',
    score: 92,
    issuesCount: {
      critical: 0,
      serious: 2,
      moderate: 4,
      minor: 3,
      total: 9
    },
    lastScanned: '2 hours ago',
    status: 'Completed',
    durationSeconds: 34.1,
    pagesScanned: 48,
    complianceLevel: 'Optimal (WCAG 2.1 AA)'
  },
  {
    id: 'scan-03',
    url: 'https://healthtech-cloud.com',
    score: 61,
    issuesCount: {
      critical: 11,
      serious: 15,
      moderate: 18,
      minor: 7,
      total: 51
    },
    lastScanned: 'Yesterday at 17:30',
    status: 'Completed',
    durationSeconds: 22.8,
    pagesScanned: 26,
    complianceLevel: 'High Barrier Risk'
  },
  {
    id: 'scan-04',
    url: 'https://edu-learning.org',
    score: 84,
    issuesCount: {
      critical: 1,
      serious: 5,
      moderate: 8,
      minor: 5,
      total: 19
    },
    lastScanned: '3 days ago',
    status: 'Completed',
    durationSeconds: 12.3,
    pagesScanned: 9,
    complianceLevel: 'Needs Minor Work'
  }
];

export const mockAIRecommendations: AIRecommendation[] = [
  {
    id: 'rec-01',
    title: 'Add alternative text to meaningful images',
    severity: 'critical',
    explanation:
      '8 informative product and chart images lack an alt attribute. Screen readers cannot convey visual content to blind and low-vision visitors.',
    estimatedEffort: 'Quick Fix',
    potentialScoreUplift: 8,
    wcagCriteria: 'WCAG 1.1.1 (Level A)',
    affectedCount: 8,
    category: 'Images & Media',
    priorityTier: 'Fix Immediately'
  },
  {
    id: 'rec-02',
    title: 'Ensure interactive elements support keyboard navigation',
    severity: 'critical',
    explanation:
      'Mobile dropdown triggers and modal controls cannot be reached or closed using Tab/Escape keys alone, trapping keyboard and switch users.',
    estimatedEffort: 'Moderate',
    potentialScoreUplift: 9,
    wcagCriteria: 'WCAG 2.1.1 / 2.1.2 (Level A)',
    affectedCount: 4,
    category: 'Keyboard & Navigation',
    priorityTier: 'Fix Immediately'
  },
  {
    id: 'rec-03',
    title: 'Improve text and background colour contrast',
    severity: 'serious',
    explanation:
      '14 text elements have a contrast ratio below 4.5:1. Primary call-to-action buttons with muted gray text on pastel backgrounds fail accessibility standards.',
    estimatedEffort: 'Quick Fix',
    potentialScoreUplift: 6,
    wcagCriteria: 'WCAG 1.4.3 (Level AA)',
    affectedCount: 14,
    category: 'Color & Contrast',
    priorityTier: 'Fix Next'
  },
  {
    id: 'rec-04',
    title: 'Add accessible labels to form controls',
    severity: 'serious',
    explanation:
      'Search input, email newsletter fields, and promo code inputs lack associated label tags or aria-label attributes, causing silent input states on assistive tech.',
    estimatedEffort: 'Moderate',
    potentialScoreUplift: 5,
    wcagCriteria: 'WCAG 3.3.2 / 4.1.2 (Level A)',
    affectedCount: 6,
    category: 'Forms & Controls',
    priorityTier: 'Fix Next'
  },
  {
    id: 'rec-05',
    title: 'Standardize visible focus rings on links',
    severity: 'moderate',
    explanation:
      'Remove outline:none overrides on checkout and header anchors so keyboard travelers never lose track of their cursor focus.',
    estimatedEffort: 'Quick Fix',
    potentialScoreUplift: 3,
    wcagCriteria: 'WCAG 2.4.7 (Level AA)',
    affectedCount: 5,
    category: 'Keyboard & Navigation',
    priorityTier: 'Future Improvements'
  }
];

export const mockIssues: AccessibilityIssue[] = [
  {
    id: 'iss-01',
    title: 'Missing Image Descriptions',
    severity: 'critical',
    category: 'Images & Media',
    wcagCriteria: '1.1.1 Non-text Content',
    wcagLevel: 'A',
    affectedPage: '/dashboard',
    affectedElement: '<img src="/hero-analytics-dashboard.webp" class="rounded-xl shadow-lg">',
    selector: '.hero-banner > img.rounded-xl',
    elementCount: 8,

    // Level 1: Simple Human Explanation
    problemExplanation:
      'Key visual graphics and charts on this page are missing alternative text descriptions.',
    whyItMatters:
      'Screen readers cannot describe this image to blind or visually impaired visitors, leaving them with no idea what information or product is being shown.',
    recommendedAction:
      'Add a concise, meaningful alt="..." attribute describing what the visual illustrates.',

    // Level 2: Technical Details
    technicalExplanation:
      'The <img> element does not provide an alt attribute, aria-label, or title attribute. Assistive technologies fall back to reading the raw URL path or skip the element entirely.',
    rawHtmlSnippet: `<img src="/hero-analytics-dashboard.webp" class="rounded-xl shadow-lg" />`,
    suggestedFixSnippet: `<img 
  src="/hero-analytics-dashboard.webp" 
  alt="NETRA realtime accessibility analytics dashboard displaying compliance score of 76" 
  class="rounded-xl shadow-lg" 
/>`,
    docUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/non-text-content.html',
    status: 'open',
    detectedAt: '2026-10-30 14:15'
  },
  {
    id: 'iss-02',
    title: 'Insufficient Text Color Contrast',
    severity: 'serious',
    category: 'Color & Contrast',
    wcagCriteria: '1.4.3 Contrast (Minimum)',
    wcagLevel: 'AA',
    affectedPage: '/pricing',
    affectedElement: '<button class="bg-[#1e1b4b] text-[#94a3b8]">Upgrade Plan</button>',
    selector: '.pricing-card-enterprise button.btn-cta',
    elementCount: 14,

    // Level 1: Simple Human Explanation
    problemExplanation:
      'Text on call-to-action buttons is too light against its background color.',
    whyItMatters:
      'People with low vision, color blindness, or visitors using mobile screens outdoors in daylight cannot easily read the button label.',
    recommendedAction:
      'Increase the color contrast ratio to at least 4.5:1 by darkening background or brightening text.',

    // Level 2: Technical Details
    technicalExplanation:
      'Measured contrast ratio is 2.82:1 (#94A3B8 text on #1E1B4B background). WCAG 2.1 AA requires a minimum ratio of 4.5:1 for regular text below 18pt.',
    rawHtmlSnippet: `<button class="bg-[#1e1b4b] text-[#94a3b8] px-4 py-2 rounded-lg font-medium">
  Upgrade Plan
</button>`,
    suggestedFixSnippet: `<button class="bg-[#4338ca] text-[#ffffff] px-4 py-2 rounded-lg font-semibold hover:bg-[#3730a3] transition-colors focus:ring-2 focus:ring-[#C96F82]">
  Upgrade Plan
</button>`,
    docUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html',
    status: 'open',
    detectedAt: '2026-10-30 14:15'
  },
  {
    id: 'iss-03',
    title: 'Icon Button Without Discernible Name',
    severity: 'critical',
    category: 'Forms & Controls',
    wcagCriteria: '4.1.2 Name, Role, Value',
    wcagLevel: 'A',
    affectedPage: '/global-nav',
    affectedElement: '<button class="p-2 text-slate-400"><svg class="lucide-search">...</svg></button>',
    selector: 'header nav .search-trigger-btn',
    elementCount: 3,

    // Level 1: Simple Human Explanation
    problemExplanation:
      'A search button contains only an icon with no text or accessibility label.',
    whyItMatters:
      'When someone using assistive software reaches this button, the screen reader merely announces "button" with no hint about what clicking it will do.',
    recommendedAction:
      'Add an aria-label="Search website documentation" attribute to the button element.',

    // Level 2: Technical Details
    technicalExplanation:
      'Interactive control does not expose an accessible name in the accessibility tree (computed name is empty). The SVG icon inside also lacks aria-hidden="true".',
    rawHtmlSnippet: `<button class="p-2 text-slate-400 hover:text-slate-800" onClick={onOpenSearch}>
  <svg class="w-5 h-5" viewBox="0 0 24 24">...</svg>
</button>`,
    suggestedFixSnippet: `<button 
  type="button"
  aria-label="Search website documentation and audit reports" 
  class="p-2 text-slate-600 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#C96F82] rounded-md" 
  onClick={onOpenSearch}
>
  <svg class="w-5 h-5" aria-hidden="true" viewBox="0 0 24 24">...</svg>
</button>`,
    docUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/name-role-value.html',
    status: 'open',
    detectedAt: '2026-10-30 14:15'
  },
  {
    id: 'iss-04',
    title: 'Form Input Missing Associated Label',
    severity: 'serious',
    category: 'Forms & Controls',
    wcagCriteria: '3.3.2 Labels or Instructions',
    wcagLevel: 'A',
    affectedPage: '/contact',
    affectedElement: '<input type="email" placeholder="Enter work email" class="input-primary">',
    selector: 'form.newsletter-signup input[type="email"]',
    elementCount: 6,

    // Level 1: Simple Human Explanation
    problemExplanation:
      'The email input field relies exclusively on placeholder text instead of a true HTML label.',
    whyItMatters:
      'Placeholder text disappears as soon as typing begins, confusing visitors with cognitive impairments and failing to announce instructions on many screen readers.',
    recommendedAction:
      'Pair the input with a permanent <label for="..."> tag or provide an aria-label.',

    // Level 2: Technical Details
    technicalExplanation:
      'No <label> element with matching htmlFor attribute is present in the DOM. Inputs must have programmatic label association to satisfy WCAG 3.3.2.',
    rawHtmlSnippet: `<input 
  type="email" 
  placeholder="Enter your email" 
  class="border border-slate-300 px-3 py-2 rounded" 
/>`,
    suggestedFixSnippet: `<label htmlFor="newsletter-email" class="block text-xs font-bold text-slate-700 mb-1">
  Work Email Address
</label>
<input 
  id="newsletter-email"
  name="email"
  type="email" 
  autoComplete="email"
  placeholder="alex@company.com" 
  class="border border-slate-300 px-3 py-2 rounded focus:ring-2 focus:ring-[#C96F82]" 
/>`,
    docUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/labels-or-instructions.html',
    status: 'open',
    detectedAt: '2026-10-30 14:15'
  },
  {
    id: 'iss-05',
    title: 'Interactive Menu Trap / Non-Keyboard Accessible',
    severity: 'critical',
    category: 'Keyboard & Navigation',
    wcagCriteria: '2.1.1 Keyboard',
    wcagLevel: 'A',
    affectedPage: '/settings',
    affectedElement: '<div class="menu-pill" onClick="toggleMenu()">Options ▾</div>',
    selector: '.menu-container > div.menu-pill',
    elementCount: 4,

    // Level 1: Simple Human Explanation
    problemExplanation:
      'A dropdown menu is built with a standard <div> element rather than a semantic button.',
    whyItMatters:
      'Users who navigate without a mouse (using only a keyboard or sip-and-puff switch device) cannot focus, open, or select options from this menu.',
    recommendedAction:
      'Replace the <div> with a native <button> and add keyboard event handlers.',

    // Level 2: Technical Details
    technicalExplanation:
      'Div lacks tabIndex="0", role="button", and Enter/Space key listeners. It is unreachable in the browser sequential focus navigation order.',
    rawHtmlSnippet: `<div class="menu-pill select-none" onClick={toggleMenu}>
  <span>Options</span>
  <ChevronDown />
</div>`,
    suggestedFixSnippet: `<button 
  type="button"
  aria-haspopup="menu"
  aria-expanded={isOpen}
  class="menu-pill select-none focus:outline-none focus:ring-2 focus:ring-[#C96F82]" 
  onClick={toggleMenu}
>
  <span>Options</span>
  <ChevronDown aria-hidden="true" />
</button>`,
    docUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/keyboard.html',
    status: 'in_progress',
    detectedAt: '2026-10-30 14:15'
  },
  {
    id: 'iss-06',
    title: 'Skipped Heading Level Hierarchy',
    severity: 'moderate',
    category: 'Semantics & Structure',
    wcagCriteria: '1.3.1 Info and Relationships',
    wcagLevel: 'A',
    affectedPage: '/security',
    affectedElement: '<h2>Security & Compliance Architecture</h2>',
    selector: 'main.security-page h2:first-of-type',
    elementCount: 2,

    // Level 1: Simple Human Explanation
    problemExplanation:
      'The webpage jumps directly to an <h2> sub-heading without providing a main <h1> heading.',
    whyItMatters:
      'Screen reader users rely on headings to quickly scan page structure. Missing top-level headings breaks logical page navigation.',
    recommendedAction:
      'Ensure every page begins with an informative <h1> before using sub-headings.',

    // Level 2: Technical Details
    technicalExplanation:
      'Document structure violates linear heading progression (found H2 without parent H1 in main landmark).',
    rawHtmlSnippet: `<main class="security-page">
  <h2>Security & Compliance Architecture</h2>
</main>`,
    suggestedFixSnippet: `<main class="security-page">
  <h1 class="text-2xl font-bold text-slate-900 mb-2">NETRA Security & Compliance</h1>
  <h2 class="text-lg font-semibold text-slate-700">Architecture & Governance</h2>
</main>`,
    docUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/info-and-relationships.html',
    status: 'open',
    detectedAt: '2026-10-30 14:15'
  },
  {
    id: 'iss-07',
    title: 'Generic Ambiguous Link Text ("Click Here")',
    severity: 'minor',
    category: 'Semantics & Structure',
    wcagCriteria: '2.4.4 Link Purpose (In Context)',
    wcagLevel: 'A',
    affectedPage: '/resources',
    affectedElement: '<a href="/audit-whitepaper.pdf">Click here</a>',
    selector: '.article-summary p > a',
    elementCount: 5,

    // Level 1: Simple Human Explanation
    problemExplanation:
      'Links use vague text like "click here" or "learn more" without describing where the link leads.',
    whyItMatters:
      'Screen reader users often browse a generated list of all links on a page. Hearing "click here" multiple times gives zero context on where they will be taken.',
    recommendedAction:
      'Rewrite link text to explicitly describe destination content (e.g. "Download 2026 Accessibility Audit Report").',

    // Level 2: Technical Details
    technicalExplanation:
      'Anchor text lacks self-contained destination context. Does not satisfy WCAG 2.4.4 Link Purpose in Context.',
    rawHtmlSnippet: `<p>To read our in-depth audit findings, <a href="/audit-whitepaper.pdf">click here</a>.</p>`,
    suggestedFixSnippet: `<p>Learn more by reading our <a href="/audit-whitepaper.pdf" class="text-[#A84F65] underline font-medium">2026 Web Accessibility Audit Report (PDF, 2.4MB)</a>.</p>`,
    docUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/link-purpose-in-context.html',
    status: 'resolved',
    detectedAt: '2026-10-30 14:15'
  },
  {
    id: 'iss-08',
    title: 'Missing Visible Focus Ring on Checkout Link',
    severity: 'moderate',
    category: 'Keyboard & Navigation',
    wcagCriteria: '2.4.7 Focus Visible',
    wcagLevel: 'AA',
    affectedPage: '/cart',
    affectedElement: '<a href="/checkout" class="btn outline-none">Proceed to Checkout</a>',
    selector: '.cart-actions a.btn',
    elementCount: 3,

    // Level 1: Simple Human Explanation
    problemExplanation:
      'The checkout button removes the browser focus ring without providing a replacement outline.',
    whyItMatters:
      'Keyboard travelers cannot see where their cursor is positioned on screen when tabbing through the checkout flow.',
    recommendedAction:
      'Add a high-contrast focus outline or ring style for keyboard navigation.',

    // Level 2: Technical Details
    technicalExplanation:
      'CSS rule specifies outline: none on :focus without providing an alternative visible indicator.',
    rawHtmlSnippet: `<a href="/checkout" class="btn bg-[#C96F82] text-white outline-none">
  Proceed to Checkout
</a>`,
    suggestedFixSnippet: `<a href="/checkout" class="btn bg-[#C96F82] text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#A84F65]">
  Proceed to Checkout
</a>`,
    docUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/focus-visible.html',
    status: 'open',
    detectedAt: '2026-10-30 14:15'
  }
];

export const mockFixSuggestions: FixSuggestion[] = [
  {
    id: 'fix-01',
    issueId: 'iss-01',
    issueTitle: 'Missing Image Descriptions',
    severity: 'critical',
    category: 'Images & Media',
    filePath: 'src/components/marketing/HeroSection.tsx:34',
    affectedElement: '<img src="/hero-analytics-dashboard.webp" ... />',
    wcagCriteria: 'WCAG 1.1.1 (Level A)',

    whatIsWrong: 'The hero analytics preview image does not have an alt text attribute.',
    whyItIsWrong: 'Assistive software cannot announce what the image depicts, leaving visually impaired users unable to comprehend the visual proof of the platform.',
    howSolutionFixesIt: 'Injects a concise alt description explaining the dashboard preview, plus loading="lazy" for performance optimization.',

    originalSnippet: `<img 
  src="/hero-analytics-dashboard.webp" 
  class="rounded-xl shadow-lg border border-slate-200" 
/>`,
    suggestedSnippet: `<img 
  src="/hero-analytics-dashboard.webp" 
  alt="NETRA realtime accessibility analytics dashboard displaying compliance score of 76 and automated WCAG issue breakdown" 
  class="rounded-xl shadow-lg border border-slate-200" 
  loading="lazy" 
/>`,
    diffSummary: '+ alt="NETRA realtime accessibility..."\n+ loading="lazy"',
    status: 'suggested',
    approved: false
  },
  {
    id: 'fix-02',
    issueId: 'iss-02',
    issueTitle: 'Insufficient Text Color Contrast',
    severity: 'serious',
    category: 'Color & Contrast',
    filePath: 'src/components/pricing/PricingTier.tsx:88',
    affectedElement: '<button class="bg-[#1e1b4b] text-[#94a3b8]">Upgrade Plan</button>',
    wcagCriteria: 'WCAG 1.4.3 (Level AA)',

    whatIsWrong: 'Light slate text #94A3B8 on dark indigo background #1E1B4B has a contrast ratio of only 2.82:1.',
    whyItIsWrong: 'Fails the minimum 4.5:1 ratio mandated by WCAG AA, creating severe legibility issues for users with low vision.',
    howSolutionFixesIt: 'Shifts the background to accessible brand indigo #4F46E5 with pure white #FFFFFF text, raising the contrast ratio to 7.15:1 (exceeding AAA).',

    originalSnippet: `<button class="bg-[#1e1b4b] text-[#94a3b8] px-4 py-2 rounded-lg font-medium">
  Upgrade Plan
</button>`,
    suggestedSnippet: `<button class="bg-[#4f46e5] hover:bg-[#4338ca] text-[#ffffff] px-4 py-2 rounded-lg font-semibold transition-colors focus:ring-2 focus:ring-[#C96F82]">
  Upgrade Plan
</button>`,
    diffSummary: '- bg-[#1e1b4b] text-[#94a3b8]\n+ bg-[#4f46e5] text-[#ffffff] focus:ring-2',
    status: 'approved',
    approved: true
  },
  {
    id: 'fix-03',
    issueId: 'iss-03',
    issueTitle: 'Icon Button Without Discernible Name',
    severity: 'critical',
    category: 'Forms & Controls',
    filePath: 'src/components/navigation/TopNav.tsx:52',
    affectedElement: '<button class="p-2 ..."><SearchIcon /></button>',
    wcagCriteria: 'WCAG 4.1.2 (Level A)',

    whatIsWrong: 'The top navigation search trigger contains only an SVG icon with no text or label.',
    whyItIsWrong: 'Assistive devices speak "button" with no purpose indicated, making the global search feature inaccessible.',
    howSolutionFixesIt: 'Adds aria-label="Search website documentation and audit reports" and marks the SVG as aria-hidden="true".',

    originalSnippet: `<button class="p-2 text-slate-500 hover:text-slate-800" onClick={onOpenSearch}>
  <SearchIcon className="w-5 h-5" />
</button>`,
    suggestedSnippet: `<button 
  type="button"
  aria-label="Search website documentation and audit reports" 
  class="p-2 text-slate-600 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#C96F82] rounded-md" 
  onClick={onOpenSearch}
>
  <SearchIcon className="w-5 h-5" aria-hidden="true" />
</button>`,
    diffSummary: '+ aria-label="Search website documentation..."\n+ aria-hidden="true" on SVG\n+ focus:ring-2',
    status: 'suggested',
    approved: false
  },
  {
    id: 'fix-04',
    issueId: 'iss-04',
    issueTitle: 'Form Input Missing Associated Label',
    severity: 'serious',
    category: 'Forms & Controls',
    filePath: 'src/components/footer/NewsletterWidget.tsx:18',
    affectedElement: '<input type="email" placeholder="Enter your email" />',
    wcagCriteria: 'WCAG 3.3.2 (Level A)',

    whatIsWrong: 'Newsletter input lacks programmatic label association and relies only on placeholder text.',
    whyItIsWrong: 'Screen readers do not reliably announce placeholders when focused, leaving users unable to identify field purpose.',
    howSolutionFixesIt: 'Adds an explicit label element tied via htmlFor="newsletter-email", id="newsletter-email", and autoComplete="email".',

    originalSnippet: `<input 
  type="email" 
  placeholder="Enter your email" 
  class="border border-slate-300 px-3 py-2 rounded" 
/>`,
    suggestedSnippet: `<label htmlFor="newsletter-email" class="block text-xs font-semibold text-slate-700 mb-1">
  Email address for accessibility newsletter
</label>
<input 
  id="newsletter-email"
  name="email"
  type="email" 
  autoComplete="email"
  placeholder="Enter your email" 
  class="border border-slate-300 px-3 py-2 rounded focus:border-[#C96F82] focus:ring-1 focus:ring-[#C96F82]" 
/>`,
    diffSummary: '+ <label htmlFor="newsletter-email" ...>\n+ id="newsletter-email" autoComplete="email"',
    status: 'suggested',
    approved: false
  },
  {
    id: 'fix-05',
    issueId: 'iss-05',
    issueTitle: 'Interactive Menu Trap / Non-Keyboard Accessible',
    severity: 'critical',
    category: 'Keyboard & Navigation',
    filePath: 'src/components/ui/DropdownMenu.tsx:44',
    affectedElement: '<div class="menu-pill select-none" onClick={toggleMenu}>...</div>',
    wcagCriteria: 'WCAG 2.1.1 (Level A)',

    whatIsWrong: 'A custom dropdown pill is implemented as a <div> with an onClick handler instead of a native button.',
    whyItIsWrong: 'Div elements cannot receive keyboard focus or Space/Enter key presses without extensive custom accessibility wiring.',
    howSolutionFixesIt: 'Converts the element to a native <button type="button"> with aria-haspopup="menu" and aria-expanded state attributes.',

    originalSnippet: `<div class="menu-pill select-none" onClick={toggleMenu}>
  <span>Options</span>
  <ChevronDown />
</div>`,
    suggestedSnippet: `<button 
  type="button"
  aria-haspopup="menu"
  aria-expanded={isOpen}
  class="menu-pill select-none focus:outline-none focus:ring-2 focus:ring-[#C96F82]" 
  onClick={toggleMenu}
>
  <span>Options</span>
  <ChevronDown aria-hidden="true" />
</button>`,
    diffSummary: '- <div ...>\n+ <button type="button" aria-haspopup="menu" aria-expanded={isOpen}>',
    status: 'applied',
    approved: true
  }
];

export const mockRootCauses: RootCausePattern[] = [
  {
    id: 'rc-1',
    pattern: 'Missing Image Text Alternatives in CMS Assets',
    rootCause: 'CMS media upload workflows allow authors to publish images without requiring an alt text description.',
    affectedElementsCount: 8,
    severity: 'critical',
    suggestedSolution: 'Enforce required alt text validation in content publishing forms and media libraries.',
    percentageOfIssues: 34
  },
  {
    id: 'rc-2',
    pattern: 'Design System Token Sub-Contrast',
    rootCause: 'Default muted typography token (#94A3B8) used on dark call-to-action buttons yields only 2.82:1 contrast.',
    affectedElementsCount: 14,
    severity: 'serious',
    suggestedSolution: 'Update the primary button design token to high-contrast white text on deep brand indigo.',
    percentageOfIssues: 28
  },
  {
    id: 'rc-3',
    pattern: 'Icon-Only Interactive Controls',
    rootCause: 'Designers omitted visible labels on icon buttons without instructing developers to include aria-label fallbacks.',
    affectedElementsCount: 6,
    severity: 'serious',
    suggestedSolution: 'Adopt an AccessibleIconButton component that enforces mandatory aria-label prop.',
    percentageOfIssues: 22
  },
  {
    id: 'rc-4',
    pattern: 'Non-Semantic Interactive Div Containers',
    rootCause: 'Dropdown menus and tabs constructed with <div> and onClick handlers rather than native HTML5 button elements.',
    affectedElementsCount: 4,
    severity: 'critical',
    suggestedSolution: 'Refactor custom clickables to native <button> tags to inherit keyboard focus and ARIA accessibility trees.',
    percentageOfIssues: 16
  }
];

export const mockScanHistory: ScanHistoryItem[] = [
  {
    id: 'hist-01',
    website: 'https://acme-store.io',
    date: '2026-10-30 14:15',
    score: 76,
    totalIssues: 32,
    changeScore: +4,
    changeIssues: -6,
    status: 'Completed',
    scanType: 'Full Crawl'
  },
  {
    id: 'hist-02',
    website: 'https://acme-store.io',
    date: '2026-10-23 09:30',
    score: 72,
    totalIssues: 38,
    changeScore: +2,
    changeIssues: -3,
    status: 'Completed',
    scanType: 'Full Crawl'
  },
  {
    id: 'hist-03',
    website: 'https://acme-store.io',
    date: '2026-10-15 11:20',
    score: 70,
    totalIssues: 41,
    changeScore: -5,
    changeIssues: +8,
    status: 'Completed',
    scanType: 'Single Page'
  },
  {
    id: 'hist-04',
    website: 'https://fintech-portal.dev',
    date: '2026-10-29 16:40',
    score: 92,
    totalIssues: 9,
    changeScore: +7,
    changeIssues: -11,
    status: 'Completed',
    scanType: 'Full Crawl'
  },
  {
    id: 'hist-05',
    website: 'https://healthtech-cloud.com',
    date: '2026-10-28 10:10',
    score: 61,
    totalIssues: 51,
    changeScore: -2,
    changeIssues: +4,
    status: 'Completed',
    scanType: 'Full Crawl'
  },
  {
    id: 'hist-06',
    website: 'https://edu-learning.org',
    date: '2026-10-27 18:05',
    score: 84,
    totalIssues: 19,
    changeScore: +10,
    changeIssues: -14,
    status: 'Completed',
    scanType: 'Full Crawl'
  }
];

export const mockUserImpacts: UserImpactCategory[] = [
  {
    group: 'Screen Reader & Braille Users',
    barrierCount: 17,
    description: 'Encounter missing image descriptions, unlabeled form fields, and unannounced modal state changes that block content comprehension.',
    severityLevel: 'High',
    icon: 'EyeOff',
    primaryAssistanceTech: 'NVDA, JAWS, VoiceOver, Braille Displays'
  },
  {
    group: 'Keyboard-Only & Switch Users',
    barrierCount: 9,
    description: 'Struggle with invisible focus indicators, trapped tab orders, and interactive div containers that cannot be triggered via Enter/Space.',
    severityLevel: 'High',
    icon: 'Keyboard',
    primaryAssistanceTech: 'Keyboard Tab Navigation, Sip-and-Puff, Switch Devices'
  },
  {
    group: 'Low-Vision Users',
    barrierCount: 14,
    description: 'Experience difficulty reading text with sub-4.5:1 contrast ratios and small fixed-size typography that fails to scale smoothly on browser zoom.',
    severityLevel: 'Medium',
    icon: 'Sun',
    primaryAssistanceTech: 'Screen Magnifiers, High-Contrast Modes, Custom CSS'
  },
  {
    group: 'Color-Blind Users',
    barrierCount: 8,
    description: 'Unable to distinguish validation errors or checkout status indicators communicated strictly through red/green colors without accompanying text labels.',
    severityLevel: 'Medium',
    icon: 'Palette',
    primaryAssistanceTech: 'Monochrome Simulation, Color Inversion Filters'
  },
  {
    group: 'Cognitive & Neurodiverse Users',
    barrierCount: 6,
    description: 'Confused by ambiguous link labels ("Click here"), unexpected viewport jumps, missing landmark headings, and inconsistent button layouts.',
    severityLevel: 'Low',
    icon: 'Brain',
    primaryAssistanceTech: 'Reading Guides, Distraction-Free Viewers, Simplified Text'
  }
];

export const mockNotifications: NotificationItem[] = [
  {
    id: 'notif-1',
    title: 'Scan Finished: acme-store.io',
    message: 'Completed crawl across 14 pages. Found 5 Critical and 9 Serious barriers.',
    timestamp: '14m ago',
    read: false,
    type: 'alert'
  },
  {
    id: 'notif-2',
    title: 'Fix Applied to Codebase',
    message: 'Contrast fix applied to pricing buttons. Projected score uplift: +6 points upon next scan.',
    timestamp: '1h ago',
    read: false,
    type: 'success'
  },
  {
    id: 'notif-3',
    title: 'WCAG 2.2 AA Rule Engine Active',
    message: 'New criteria 2.5.8 (Target Size Minimum) now included in simulated audits.',
    timestamp: '1d ago',
    read: true,
    type: 'info'
  }
];

export const initialUserSettings: UserSettings = {
  profile: {
    fullName: 'Team AccessAI',
    email: 'team@netra-accessibility.io',
    role: 'Lead Accessibility Engineer • SPHINX\'26',
    company: 'NETRA • Powered by AccessAI'
  },
  aiProvider: {
    provider: 'anthropic',
    model: 'claude-3-5-sonnet-20241022',
    temperature: 0.2,
    customPromptGuidelines: 'Focus on minimal intrusive React JSX fixes adhering strictly to WCAG 2.1 Level AA guidelines.',
    autoSuggestFixes: true
  },
  scanning: {
    wcagStandard: 'WCAG 2.1 AA',
    crawlDepth: 'deep-3',
    includeHiddenElements: false,
    checkColorContrastOnly: false,
    autoScanFrequency: 'weekly'
  },
  notifications: {
    emailOnCriticalIssues: true,
    weeklyDigest: true,
    fixApprovalAlerts: true
  },
  appearance: {
    accentColor: 'rose',
    density: 'comfortable'
  }
};
