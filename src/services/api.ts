import {
  AccessibilityIssue,
  FixStatus,
  FixSuggestion,
  RecentScanItem,
  ScanHistoryItem
} from '../types';

export interface ScanApiResponse {
  success: boolean;
  scan?: any;
  error?: string;
}

export interface VerificationApiResponse {
  success: boolean;
  scan: any;
  verification: {
    scanId: string;
    previousScanId: string;
    websiteUrl: string;
    scoreImprovement: number;
    newScore: number;
    previousScore: number;
    totalResolvedCount: number;
    remainingCount: number;
    newViolationsCount: number;
    resolvedIssues: AccessibilityIssue[];
    remainingIssues: AccessibilityIssue[];
    newIssues: AccessibilityIssue[];
  };
}

export const api = {
  /**
   * Health check
   */
  async checkHealth(): Promise<boolean> {
    try {
      const res = await fetch('/api/health');
      return res.ok;
    } catch {
      return false;
    }
  },

  /**
   * Overall dashboard statistics
   */
  async getStats() {
    const res = await fetch('/api/stats');
    if (!res.ok) throw new Error('Failed to fetch stats');
    return await res.json();
  },

  /**
   * List all stored scans
   */
  async getScans(): Promise<any[]> {
    const res = await fetch('/api/scans');
    if (!res.ok) throw new Error('Failed to fetch scans');
    return await res.json();
  },

  /**
   * Get single scan by ID
   */
  async getScanById(scanId: string): Promise<any> {
    const res = await fetch(`/api/scans/${scanId}`);
    if (!res.ok) throw new Error('Failed to fetch scan');
    return await res.json();
  },

  /**
   * Initiate a real website scan
   */
  async startScan(url: string, maxPages: number = 3): Promise<ScanApiResponse> {
    const res = await fetch('/api/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, maxPages })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Scan failed to execute');
    }
    return data;
  },

  /**
   * Rescan and verify previous findings
   */
  async rescanAndVerify(scanId: string): Promise<VerificationApiResponse> {
    const res = await fetch(`/api/scans/${scanId}/rescan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Rescan verification failed');
    }
    return data;
  },

  /**
   * Delete a scan
   */
  async deleteScan(scanId: string): Promise<boolean> {
    const res = await fetch(`/api/scans/${scanId}`, { method: 'DELETE' });
    return res.ok;
  },

  /**
   * Get monitored websites list
   */
  async getWebsites(): Promise<any[]> {
    const res = await fetch('/api/websites');
    if (!res.ok) throw new Error('Failed to fetch websites');
    return await res.json();
  },

  /**
   * Update fix suggestion lifecycle status
   */
  async updateFixStatus(fixId: string, status: FixStatus): Promise<boolean> {
    const res = await fetch(`/api/fixes/${fixId}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    return res.ok;
  },

  /**
   * Demo mode status & toggle
   */
  async getDemoStatus(): Promise<boolean> {
    try {
      const res = await fetch('/api/demo/status');
      if (res.ok) {
        const data = await res.json();
        return Boolean(data.demoMode);
      }
    } catch {
      // fallback
    }
    return false;
  },

  async toggleDemo(active: boolean): Promise<boolean> {
    const res = await fetch('/api/demo/toggle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active })
    });
    const data = await res.json();
    return Boolean(data.demoMode);
  },

  /**
   * Clear all stored scans
   */
  async clearAllScans(): Promise<void> {
    await fetch('/api/clear', { method: 'POST' });
  },

  /**
   * Widget sites & configuration
   */
  async getWidgetSites(): Promise<any[]> {
    const res = await fetch('/api/widget/sites');
    if (!res.ok) throw new Error('Failed to fetch widget sites');
    return await res.json();
  },

  async getWidgetConfig(siteId: string): Promise<any> {
    const res = await fetch(`/api/widget/config/${siteId}`);
    if (!res.ok) throw new Error('Failed to fetch widget config');
    return await res.json();
  },

  async saveWidgetConfig(config: any): Promise<any> {
    const res = await fetch('/api/widget/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to save widget config');
    }
    return await res.json();
  },

  async deleteWidgetSite(siteId: string): Promise<boolean> {
    const res = await fetch(`/api/widget/sites/${siteId}`, { method: 'DELETE' });
    return res.ok;
  },

  /**
   * AI Settings & on-demand Gemini remediation
   */
  async getAiSettings(): Promise<any> {
    const res = await fetch('/api/settings/ai');
    if (!res.ok) throw new Error('Failed to fetch AI settings');
    return await res.json();
  },

  async saveAiApiKey(apiKey: string): Promise<any> {
    const res = await fetch('/api/settings/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to save API key');
    return data;
  },

  async generateAiRemediation(payload: {
    ruleId: string;
    rawHtml: string;
    description?: string;
    helpText?: string;
    wcagCriteria?: string;
    apiKey?: string;
  }): Promise<any> {
    const res = await fetch('/api/remediation/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to generate AI remediation');
    return data.remediation;
  },

  /**
   * Ask AccessAI conversational consultant
   */
  async askAi(question: string, scanContext: any): Promise<any> {
    const res = await fetch('/api/ai/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, scanContext })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to get AI answer');
    return data;
  },

  /**
   * Explain an accessibility issue in depth
   */
  async explainIssue(issue: any): Promise<any> {
    const res = await fetch('/api/ai/explain', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(issue)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to explain issue');
    return data;
  }
};
