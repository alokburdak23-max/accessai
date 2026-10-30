export type PageId =
  | 'dashboard'
  | 'websites'
  | 'results'
  | 'fixes'
  | 'widget'
  | 'analytics'
  | 'reports'
  | 'settings';

export type Severity = 'critical' | 'serious' | 'moderate' | 'minor';

export type IssueCategory =
  | 'Images & Media'
  | 'Color & Contrast'
  | 'Forms & Controls'
  | 'Keyboard & Navigation'
  | 'Semantics & Structure'
  | 'ARIA & Screen Readers';

export interface AccessibilityIssue {
  id: string;
  title: string;
  severity: Severity;
  category: IssueCategory;
  wcagCriteria: string;
  wcagLevel: 'A' | 'AA' | 'AAA';
  affectedPage: string;
  affectedElement: string;
  selector: string;
  elementCount: number;
  ruleId?: string;
  
  // Level 1: Simple Human Explanation
  problemExplanation: string;
  whyItMatters: string;
  recommendedAction: string;

  // Level 2: Technical Details
  technicalExplanation: string;
  rawHtmlSnippet: string;
  suggestedFixSnippet: string;
  docUrl: string;

  status: 'open' | 'in_progress' | 'resolved';
  detectedAt: string;
  isAiGenerated?: boolean;
  confidenceScore?: number;
}

export interface AIRecommendation {
  id: string;
  title: string;
  severity: Severity;
  explanation: string;
  estimatedEffort: 'Quick Fix' | 'Moderate' | 'Complex';
  potentialScoreUplift: number;
  wcagCriteria: string;
  affectedCount: number;
  category: IssueCategory;
  priorityTier: 'Fix Immediately' | 'Fix Next' | 'Future Improvements';
}

export type FixStatus = 'suggested' | 'approved' | 'rejected' | 'applied' | 'verified';

export interface FixSuggestion {
  id: string;
  issueId: string;
  issueTitle: string;
  severity: Severity;
  category: IssueCategory;
  filePath: string;
  affectedElement: string;
  wcagCriteria: string;

  // Remediation Explanation
  whatIsWrong: string;
  whyItIsWrong: string;
  howSolutionFixesIt: string;

  // Code Comparison
  originalSnippet: string;
  suggestedSnippet: string;
  diffSummary: string;

  // Approval Workflow State
  status: FixStatus;
  approved: boolean; // backwards compatible
  isAiGenerated?: boolean;
  confidenceScore?: number;
  statusUpdatedAt?: string;
  reviewNotes?: string;
}

export interface RecentScanItem {
  id: string;
  url: string;
  score: number;
  issuesCount: {
    critical: number;
    serious: number;
    moderate: number;
    minor: number;
    total: number;
  };
  lastScanned: string;
  status: 'Completed' | 'In Progress' | 'Failed';
  durationSeconds: number;
  pagesScanned: number;
  complianceLevel: string;
}

export interface ScanHistoryItem {
  id: string;
  website: string;
  date: string;
  score: number;
  totalIssues: number;
  changeScore: number;
  changeIssues: number;
  status: 'Completed' | 'Partial';
  scanType: 'Full Crawl' | 'Single Page';
}

export interface RootCausePattern {
  id: string;
  pattern: string;
  rootCause: string;
  affectedElementsCount: number;
  severity: Severity;
  suggestedSolution: string;
  percentageOfIssues: number;
}

export interface UserImpactCategory {
  group: string;
  barrierCount: number;
  description: string;
  severityLevel: 'High' | 'Medium' | 'Low';
  icon: string;
  primaryAssistanceTech: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: 'alert' | 'success' | 'info';
}

export interface UserSettings {
  profile: {
    fullName: string;
    email: string;
    role: string;
    company: string;
  };
  aiProvider: {
    provider: 'anthropic' | 'openai' | 'google-gemini' | 'local-llm';
    model: string;
    temperature: number;
    customPromptGuidelines: string;
    autoSuggestFixes: boolean;
  };
  scanning: {
    wcagStandard: 'WCAG 2.1 AA' | 'WCAG 2.1 AAA' | 'WCAG 2.2 AA' | 'Section 508';
    crawlDepth: 'single' | 'deep-3' | 'full-domain';
    includeHiddenElements: boolean;
    checkColorContrastOnly: boolean;
    autoScanFrequency: 'disabled' | 'daily' | 'weekly';
  };
  notifications: {
    emailOnCriticalIssues: boolean;
    weeklyDigest: boolean;
    fixApprovalAlerts: boolean;
  };
  appearance: {
    accentColor: 'rose' | 'olive' | 'neutral';
    density: 'comfortable' | 'compact';
  };
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
}
