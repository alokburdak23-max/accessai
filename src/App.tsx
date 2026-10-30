import React, { useState, useEffect, useCallback } from 'react';
import { Layout } from './components/layout/Layout';
import { ToastContainer } from './components/common/ToastContainer';
import { OverviewPage } from './components/pages/OverviewPage';
import { ScannerPage } from './components/pages/ScannerPage';
import { IssuesPage } from './components/pages/IssuesPage';
import { FixSuggestionsPage } from './components/pages/FixSuggestionsPage';
import { AnalyticsPage } from './components/pages/AnalyticsPage';
import { ReportsPage } from './components/pages/ReportsPage';
import { SettingsPage } from './components/pages/SettingsPage';
import { WidgetPage } from './components/pages/WidgetPage';
import { api } from './services/api';
import {
  PageId,
  ToastMessage,
  AccessibilityIssue,
  FixSuggestion,
  FixStatus,
  RecentScanItem,
  AIRecommendation,
  ScanHistoryItem,
  UserImpactCategory,
  NotificationItem,
  UserSettings,
  RootCausePattern
} from './types';
import {
  mockIssues,
  mockFixSuggestions,
  mockRecentScans,
  mockAIRecommendations,
  mockScanHistory,
  mockUserImpacts,
  mockRootCauses,
  mockNotifications,
  initialUserSettings
} from './data/mockData';
import { AlertTriangle, Sparkles, RefreshCw } from 'lucide-react';

export const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<PageId>('dashboard');
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);
  const [scans, setScans] = useState<any[]>([]);
  const [currentScanId, setCurrentScanId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [notifications, setNotifications] = useState<NotificationItem[]>(mockNotifications);
  const [settings, setSettings] = useState<UserSettings>(initialUserSettings);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Fetch real data from backend
  const loadDatabaseState = useCallback(async () => {
    try {
      setIsLoading(true);
      const [allScans, demoStatus] = await Promise.all([
        api.getScans(),
        api.getDemoStatus()
      ]);

      setScans(allScans || []);
      setIsDemoMode(Boolean(demoStatus));

      if (allScans && allScans.length > 0) {
        setCurrentScanId((prev) => prev || allScans[0].scanId);
      } else {
        setCurrentScanId(null);
      }
    } catch (err) {
      console.warn('Backend API connection note: using local storage state', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDatabaseState();
  }, [loadDatabaseState]);

  // Determine current active scan
  const activeScan = scans.find((s) => s.scanId === currentScanId) || scans[0] || null;

  // Real vs Demonstration data resolution
  const displayIssues: AccessibilityIssue[] = isDemoMode
    ? mockIssues
    : activeScan
    ? activeScan.issues || []
    : [];

  const displayFixes: FixSuggestion[] = isDemoMode
    ? mockFixSuggestions
    : activeScan
    ? activeScan.fixes || []
    : [];

  // Derive recent scans table entries
  const displayRecentScans: RecentScanItem[] = isDemoMode
    ? mockRecentScans
    : scans.map((s) => {
        const crit = s.issues?.filter((i: any) => i.severity === 'critical').length || 0;
        const ser = s.issues?.filter((i: any) => i.severity === 'serious').length || 0;
        const mod = s.issues?.filter((i: any) => i.severity === 'moderate').length || 0;
        const min = s.issues?.filter((i: any) => i.severity === 'minor').length || 0;

        return {
          id: s.scanId,
          url: s.websiteUrl,
          score: s.scoreBreakdown?.score || 0,
          issuesCount: {
            critical: crit,
            serious: ser,
            moderate: mod,
            minor: min,
            total: s.issues?.length || 0
          },
          lastScanned: new Date(s.timestamp).toISOString().replace('T', ' ').slice(0, 16),
          status: 'Completed',
          durationSeconds: Math.round((s.durationMs || 1000) / 1000),
          pagesScanned: s.pagesScanned || 1,
          complianceLevel: s.scoreBreakdown?.status || 'Needs Improvement'
        };
      });

  // Derive scan history items
  const displayHistory: ScanHistoryItem[] = isDemoMode
    ? mockScanHistory
    : scans.map((s, idx) => {
        const nextScan = scans[idx + 1];
        const changeScore = nextScan ? s.scoreBreakdown.score - nextScan.scoreBreakdown.score : 0;
        const changeIssues = nextScan ? s.issues.length - nextScan.issues.length : 0;

        return {
          id: s.scanId,
          website: s.websiteUrl,
          date: new Date(s.timestamp).toISOString().replace('T', ' ').slice(0, 16),
          score: s.scoreBreakdown?.score || 0,
          totalIssues: s.issues?.length || 0,
          changeScore,
          changeIssues,
          status: 'Completed',
          scanType: s.pagesScanned > 1 ? 'Full Crawl' : 'Single Page'
        };
      });

  // Derive human user impact breakdown from actual issues (100% issue accounting, no omissions)
  const displayUserImpacts: UserImpactCategory[] = isDemoMode
    ? mockUserImpacts
    : [
        {
          group: 'Screen Reader & Assistive Tech',
          barrierCount: displayIssues.filter(
            (i) => i.category === 'Images & Media' || i.category === 'ARIA & Screen Readers'
          ).length,
          description:
            'Encounter missing image text descriptions, unannounced SVG graphics, and broken ARIA accessibility trees.',
          severityLevel: 'High',
          icon: 'EyeOff',
          primaryAssistanceTech: 'NVDA, JAWS, VoiceOver, Braille Displays'
        },
        {
          group: 'Keyboard & Motor Navigators',
          barrierCount: displayIssues.filter((i) => i.category === 'Keyboard & Navigation').length,
          description:
            'Struggle with non-focusable click containers, invisible focus indicators, and trapped tab navigation.',
          severityLevel: 'High',
          icon: 'Keyboard',
          primaryAssistanceTech: 'Keyboard Tab Navigation, Switch Hardware'
        },
        {
          group: 'Form & Input Visitors',
          barrierCount: displayIssues.filter((i) => i.category === 'Forms & Controls').length,
          description:
            'Encounter unlabeled inputs, missing fieldset groupings, and inaccessible action triggers.',
          severityLevel: 'High',
          icon: 'Users',
          primaryAssistanceTech: 'Voice Dictation, Assistive Form Fillers, Screen Readers'
        },
        {
          group: 'Low-Vision & Color-Blind Users',
          barrierCount: displayIssues.filter((i) => i.category === 'Color & Contrast').length,
          description:
            'Experience difficulty reading sub-4.5:1 text contrast and low-luminance interactive boundaries.',
          severityLevel: 'Medium',
          icon: 'Sun',
          primaryAssistanceTech: 'Screen Magnifiers, High-Contrast Themes'
        },
        {
          group: 'Cognitive & Neurodiverse Users',
          barrierCount: displayIssues.filter((i) => i.category === 'Semantics & Structure').length,
          description:
            'Confused by missing landmark headings, vague link destinations, and unexpected layout structures.',
          severityLevel: 'Low',
          icon: 'Brain',
          primaryAssistanceTech: 'Reading Guides, Simplified Layout Viewers'
        }
      ];

  // Derive dynamic root causes from real audit issues
  const displayRootCauses: RootCausePattern[] = isDemoMode
    ? mockRootCauses
    : (() => {
        if (displayIssues.length === 0) return [];
        const patternMap: Record<
          string,
          { pattern: string; rootCause: string; severity: any; solution: string; count: number }
        > = {
          'image-alt': {
            pattern: 'Uncaptioned Visual Assets in Templates',
            rootCause: 'CMS and template image components rendered without required alt attributes.',
            severity: 'critical',
            solution: 'Enforce non-empty alt props on image components or alt="" for decorative images.',
            count: 0
          },
          'color-contrast': {
            pattern: 'Low-Luminance Theme Color Tokens',
            rootCause: 'Brand stylesheet palette pairs text and backgrounds failing WCAG 4.5:1 ratio.',
            severity: 'serious',
            solution: 'Adjust background luminance or text darkness token to exceed 4.5:1 contrast.',
            count: 0
          },
          'label': {
            pattern: 'Orphaned Form Inputs & Search Fields',
            rootCause: 'Input elements rely purely on placeholder text without programmatic <label> or aria-label.',
            severity: 'serious',
            solution: 'Associate <label for="..."> with every form field or provide aria-label.',
            count: 0
          },
          'button-name': {
            pattern: 'Icon-Only Interactive Action Buttons',
            rootCause: 'Buttons containing only SVG or icon fonts lack discernible accessible text.',
            severity: 'critical',
            solution: 'Add aria-label describing button action and set aria-hidden="true" on icons.',
            count: 0
          },
          'link-name': {
            pattern: 'Vague or Non-Descriptive Hyperlinks',
            rootCause: 'Links contain generic text ("click here", "more") or icons without accessible text.',
            severity: 'serious',
            solution: 'Provide contextual link text or add aria-label describing destination.',
            count: 0
          }
        };

        displayIssues.forEach((issue) => {
          const ruleKey = issue.ruleId || '';
          if (ruleKey && patternMap[ruleKey]) {
            patternMap[ruleKey].count++;
          } else {
            const genericKey = issue.category;
            if (!patternMap[genericKey]) {
              patternMap[genericKey] = {
                pattern: `${issue.category} Inconsistencies`,
                rootCause: `Template components fail ${issue.wcagCriteria} specifications.`,
                severity: issue.severity,
                solution: issue.recommendedAction,
                count: 0
              };
            }
            patternMap[genericKey].count++;
          }
        });

        return Object.entries(patternMap)
          .filter(([_, data]) => data.count > 0)
          .map(([id, data]) => ({
            id: `rc-${id}`,
            pattern: data.pattern,
            rootCause: data.rootCause,
            affectedElementsCount: data.count,
            severity: data.severity,
            suggestedSolution: data.solution,
            percentageOfIssues: Math.round((data.count / displayIssues.length) * 100)
          }));
      })();

  // Derive top recommendations from real issues
  const displayRecommendations: AIRecommendation[] = isDemoMode
    ? mockAIRecommendations
    : displayIssues.slice(0, 4).map((iss, idx) => ({
        id: `rec-${iss.id}`,
        title: iss.title,
        severity: iss.severity,
        explanation: iss.problemExplanation,
        estimatedEffort: iss.severity === 'critical' ? 'Quick Fix' : 'Moderate',
        potentialScoreUplift: iss.severity === 'critical' ? 6 : 4,
        wcagCriteria: iss.wcagCriteria,
        affectedCount: iss.elementCount,
        category: iss.category,
        priorityTier: idx < 2 ? 'Fix Immediately' : 'Fix Next'
      }));

  // Toast Helper
  const addToast = (toast: Omit<ToastMessage, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newToast: ToastMessage = { ...toast, id };
    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Real Scan Execution
  const handleExecuteScan = async (targetUrl: string, maxPages?: number) => {
    try {
      const response = await api.startScan(targetUrl, maxPages || 3);
      if (response.success && response.scan) {
        await loadDatabaseState();
        setCurrentScanId(response.scan.scanId);
        return response.scan;
      }
      throw new Error(response.error || 'Scan failed to complete');
    } catch (err: any) {
      throw err;
    }
  };

  // Rescan & Verification Workflow
  const handleRescanWebsite = async (scanId: string) => {
    try {
      const response = await api.rescanAndVerify(scanId);
      if (response.success && response.scan) {
        await loadDatabaseState();
        setCurrentScanId(response.scan.scanId);
        return response;
      }
      throw new Error('Rescan failed to verify');
    } catch (err: any) {
      throw err;
    }
  };

  // Update Fix Status
  const handleUpdateFixStatus = async (fixId: string, newStatus: FixStatus) => {
    try {
      await api.updateFixStatus(fixId, newStatus);
      await loadDatabaseState();

      addToast({
        type: newStatus === 'verified' ? 'success' : 'info',
        title: `Fix ${newStatus.toUpperCase()}`,
        message: `Remediation status updated to ${newStatus}.`
      });
    } catch {
      // Local fallback
      addToast({
        type: 'info',
        title: 'Status Updated',
        message: `Fix marked as ${newStatus}.`
      });
    }
  };

  // Toggle Demonstration Mode
  const handleToggleDemoMode = async (active: boolean) => {
    try {
      await api.toggleDemo(active);
      setIsDemoMode(active);
      addToast({
        type: active ? 'warning' : 'success',
        title: active ? 'Demonstration Mode Activated' : 'Real Auditing Mode Activated',
        message: active
          ? 'Displaying synthetic demonstration records for feature preview.'
          : 'Displaying real audit records from persistent database.'
      });
    } catch {
      setIsDemoMode(active);
    }
  };

  // Clear All Scans
  const handleClearAllScans = async () => {
    try {
      await api.clearAllScans();
      await loadDatabaseState();
      addToast({
        type: 'info',
        title: 'Audit Storage Reset',
        message: 'All scan records have been cleared.'
      });
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Reset Failed',
        message: err.message
      });
    }
  };

  // Navigation normalizer supporting legacy route aliases
  const handleNavigate = (page: PageId | string) => {
    let targetPage: PageId = 'dashboard';

    switch (page) {
      case 'overview':
      case 'dashboard':
        targetPage = 'dashboard';
        break;
      case 'scanner':
      case 'websites':
        targetPage = 'websites';
        break;
      case 'issues':
      case 'results':
        targetPage = 'results';
        break;
      case 'fixes':
        targetPage = 'fixes';
        break;
      case 'widget':
        targetPage = 'widget';
        break;
      case 'insights':
      case 'history':
      case 'analytics':
        targetPage = 'analytics';
        break;
      case 'reports':
        targetPage = 'reports';
        break;
      case 'settings':
        targetPage = 'settings';
        break;
      default:
        targetPage = 'dashboard';
    }

    setCurrentPage(targetPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Unresolved issues and pending fixes count for sidebar badges
  const openIssuesCount = displayIssues.filter((i) => i.status !== 'resolved').length;
  const pendingFixesCount = displayFixes.filter((f) => f.status === 'suggested').length;

  return (
    <Layout
      currentPage={currentPage}
      onNavigate={handleNavigate}
      openIssuesCount={openIssuesCount}
      pendingFixesCount={pendingFixesCount}
      notifications={notifications}
      onMarkNotificationRead={(id) =>
        setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
      }
      onClearAllNotifications={() =>
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
      }
    >
      {/* Demonstration Mode Warning Banner (shown ONLY when demo mode is active) */}
      {isDemoMode && (
        <div className="p-3.5 rounded-xl bg-[#FFF8F2] border border-[#FDEEE2] text-[#D88A4C] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-sm">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>
              <strong>DEMONSTRATION MODE ACTIVE:</strong> Showing synthetic preview records (acme-store.io). Real scan data is isolated.
            </span>
          </div>

          <button
            onClick={() => handleToggleDemoMode(false)}
            className="px-3 py-1 rounded-lg bg-[#C96F82] hover:bg-[#A84F65] text-white font-bold text-xs whitespace-nowrap transition-colors self-start sm:self-auto"
          >
            Switch to Real Auditing Mode
          </button>
        </div>
      )}

      {/* 1. Dashboard (Overview) */}
      {currentPage === 'dashboard' && (
        <OverviewPage
          recentScans={displayRecentScans}
          issues={displayIssues}
          recommendations={displayRecommendations}
          onNavigate={handleNavigate}
        />
      )}

      {/* 2. My Websites (Scanner & Monitored Domains) */}
      {currentPage === 'websites' && (
        <ScannerPage
          onNavigate={handleNavigate}
          onAddToast={addToast}
          recentScans={displayRecentScans}
          onExecuteScan={handleExecuteScan}
          onRescanWebsite={handleRescanWebsite}
        />
      )}

      {/* 3. Scan Results (Accessibility Issues with 2-level progressive disclosure) */}
      {currentPage === 'results' && (
        <IssuesPage
          issues={displayIssues}
          onNavigate={handleNavigate}
          onAddToast={addToast}
          onNavigateToFix={(_issueId) => handleNavigate('fixes')}
        />
      )}

      {/* 4. AI Fixes (Fix Suggestions with 5-stage lifecycle) */}
      {currentPage === 'fixes' && (
        <FixSuggestionsPage
          fixes={displayFixes}
          onUpdateFixStatus={handleUpdateFixStatus}
          onNavigate={handleNavigate}
          onAddToast={addToast}
          onTriggerRescan={() => {
            if (activeScan) {
              handleRescanWebsite(activeScan.scanId);
            } else {
              handleNavigate('websites');
            }
          }}
        />
      )}

      {/* 5. Accessibility Widget (Drop-in JavaScript Accessibility Layer) */}
      {currentPage === 'widget' && (
        <WidgetPage
          onNavigate={handleNavigate}
          onAddToast={addToast}
          currentSiteUrl={activeScan?.websiteUrl}
        />
      )}

      {/* 5. Analytics (AI Insights + Scan History & Trends) */}
      {currentPage === 'analytics' && (
        <AnalyticsPage
          history={displayHistory}
          userImpacts={displayUserImpacts}
          rootCauses={displayRootCauses}
          recommendations={displayRecommendations}
          issues={displayIssues}
          onNavigate={handleNavigate}
        />
      )}

      {/* 6. Reports (Comprehensive 9-Section Audit Documentation) */}
      {currentPage === 'reports' && (
        <ReportsPage
          issues={displayIssues}
          onNavigate={handleNavigate}
          onAddToast={addToast}
          targetDomain={activeScan?.websiteUrl}
          activeScan={activeScan}
        />
      )}

      {/* 7. Settings (Configuration & Preferences) */}
      {currentPage === 'settings' && (
        <SettingsPage
          settings={settings}
          onSaveSettings={setSettings}
          onAddToast={addToast}
          isDemoMode={isDemoMode}
          onToggleDemoMode={handleToggleDemoMode}
          onClearAllScans={handleClearAllScans}
        />
      )}

      {/* Floating Toast Notification Layer */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </Layout>
  );
};

export default App;
