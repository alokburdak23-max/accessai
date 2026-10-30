import React, { useState } from 'react';
import {
  Globe,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Search,
  ExternalLink,
  Layers,
  FileText,
  Wrench,
  Clock,
  Sparkles
} from 'lucide-react';
import { PageId, RecentScanItem, ToastMessage } from '../../types';

interface ScannerPageProps {
  onNavigate: (page: PageId) => void;
  onAddToast: (toast: Omit<ToastMessage, 'id'>) => void;
  recentScans: RecentScanItem[];
  onExecuteScan: (url: string, maxPages?: number) => Promise<any>;
  onRescanWebsite?: (scanId: string) => Promise<any>;
}

export const ScannerPage: React.FC<ScannerPageProps> = ({
  onNavigate,
  onAddToast,
  recentScans,
  onExecuteScan,
  onRescanWebsite
}) => {
  const [url, setUrl] = useState('');
  const [crawlPages, setCrawlPages] = useState<number>(3);
  const [isScanning, setIsScanning] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [currentStepMessage, setCurrentStepMessage] = useState('');
  const [scanResult, setScanResult] = useState<any | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [rescanningId, setRescanningId] = useState<string | null>(null);

  const realScanSteps = [
    { title: 'Validating Website', desc: 'Checking URL format, DNS records, and anti-SSRF protections' },
    { title: 'Loading Website', desc: 'Launching headless browser and rendering JavaScript elements' },
    { title: 'Discovering Pages', desc: 'Crawling same-origin internal hyperlinks within page limit' },
    { title: 'Analyzing Accessibility', desc: 'Injecting axe-core engine to evaluate WCAG 2.1 AA rules' },
    { title: 'Generating Audit Results', desc: 'Computing scores and generating AI code remediation' },
    { title: 'Saving Report', desc: 'Persisting audit records and verification baseline' }
  ];

  const handleStartScan = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const targetUrl = url.trim();
    if (!targetUrl) {
      onAddToast({
        type: 'error',
        title: 'URL Required',
        message: 'Please enter a website URL to begin scanning.'
      });
      return;
    }

    setIsScanning(true);
    setScanResult(null);
    setScanError(null);
    setCurrentStepIndex(0);
    setCurrentStepMessage(realScanSteps[0].desc);

    // Progressive UI feedback while the backend Playwright & axe-core runs
    let step = 0;
    const progressInterval = setInterval(() => {
      step++;
      if (step < realScanSteps.length) {
        setCurrentStepIndex(step);
        setCurrentStepMessage(realScanSteps[step].desc);
      }
    }, 2800);

    try {
      const result = await onExecuteScan(targetUrl, crawlPages);
      clearInterval(progressInterval);
      setCurrentStepIndex(realScanSteps.length - 1);
      setScanResult(result);

      onAddToast({
        type: 'success',
        title: 'Audit Complete',
        message: `Successfully audited ${result.pagesScanned || 1} pages on ${result.domain || targetUrl}. Score: ${result.scoreBreakdown?.score || 0}/100.`
      });
    } catch (err: any) {
      clearInterval(progressInterval);
      const errMsg = err?.message || 'Failed to complete accessibility scan.';
      setScanError(errMsg);
      onAddToast({
        type: 'error',
        title: 'Audit Failed',
        message: errMsg
      });
    } finally {
      setIsScanning(false);
    }
  };

  const handleTriggerRescan = async (scanId: string) => {
    if (!onRescanWebsite) return;
    setRescanningId(scanId);
    try {
      const res = await onRescanWebsite(scanId);
      onAddToast({
        type: 'success',
        title: 'Rescan & Verification Complete',
        message: `Rescanned ${res.scan?.websiteUrl}. Verified ${res.verification?.totalResolvedCount || 0} resolved issues. Score delta: +${res.verification?.scoreImprovement || 0} pts.`
      });
    } catch (err: any) {
      onAddToast({
        type: 'error',
        title: 'Rescan Failed',
        message: err?.message || 'Failed to complete verification rescan'
      });
    } finally {
      setRescanningId(null);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header Banner */}
      <section className="p-6 sm:p-7 rounded-2xl bg-white border border-[#EAEAE4] shadow-card relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#C96F82] via-[#EEF0E3] to-[#7B8053]" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="p-1 rounded-md bg-[#FFF5F6] text-[#C96F82] border border-[#F8E9ED]">
                <Globe className="w-4 h-4" />
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-[#A84F65]">
                Automated Browser Engine
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#292A27] tracking-tight">
              Website Accessibility Scanner
            </h1>
            <p className="text-xs sm:text-sm text-[#70716B] mt-1 max-w-2xl leading-relaxed">
              Launch real automated audits across your public web properties using Playwright and axe-core. Uncover WCAG 2.1 AA barriers and verify code-level remediation.
            </p>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#F6F7F0] border border-[#EEF0E3] text-xs font-semibold text-[#7B8053]">
            <ShieldCheck className="w-4 h-4 text-[#7B8053]" />
            <span>Anti-SSRF Protected</span>
          </div>
        </div>
      </section>

      {/* URL Input Form */}
      <section className="p-6 sm:p-7 rounded-2xl bg-white border border-[#EAEAE4] shadow-card space-y-4">
        <div>
          <h2 className="text-base font-bold text-[#292A27]">Enter Target Website</h2>
          <p className="text-xs text-[#70716B] mt-0.5">
            Provide any public URL. The engine will render the website in a real browser session and crawl internal pages.
          </p>
        </div>

        <form onSubmit={handleStartScan} className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch gap-3">
            <div className="relative flex-1">
              <Globe className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#999A92]" />
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Enter your website URL (e.g. https://example.com)..."
                disabled={isScanning}
                className="w-full pl-10 pr-4 py-3 bg-[#FAFAF8] border border-[#EAEAE4] rounded-xl text-xs sm:text-sm font-mono text-[#292A27] placeholder-[#999A92] focus:outline-none focus:ring-2 focus:ring-[#C96F82] focus:bg-white transition-all disabled:opacity-60"
              />
            </div>

            {/* Configurable crawl depth */}
            <div className="flex items-center gap-2">
              <select
                value={crawlPages}
                onChange={(e) => setCrawlPages(Number(e.target.value))}
                disabled={isScanning}
                className="px-3 py-3 bg-[#FAFAF8] border border-[#EAEAE4] rounded-xl text-xs text-[#292A27] font-semibold focus:outline-none focus:ring-2 focus:ring-[#C96F82]"
              >
                <option value={1}>1 Page (Fast single URL)</option>
                <option value={3}>Up to 3 Pages (Recommended)</option>
                <option value={5}>Up to 5 Pages (Standard)</option>
                <option value={10}>Up to 10 Pages (Deep Audit)</option>
              </select>

              <button
                type="submit"
                disabled={isScanning || !url.trim()}
                className="px-6 py-3 rounded-xl bg-[#C96F82] hover:bg-[#A84F65] disabled:opacity-50 text-white font-bold text-xs sm:text-sm shadow-rose transition-all flex items-center justify-center gap-2 whitespace-nowrap transform active:scale-95"
              >
                {isScanning ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Auditing Website...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span>Start Accessibility Scan</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        {/* Real Progress Stages */}
        {isScanning && (
          <div className="mt-6 p-6 rounded-2xl bg-[#FAFAF8] border border-[#EAEAE4] space-y-5 animate-in fade-in duration-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Loader2 className="w-5 h-5 animate-spin text-[#C96F82]" />
                <div>
                  <h3 className="text-sm font-bold text-[#292A27]">
                    {realScanSteps[currentStepIndex].title}
                  </h3>
                  <p className="text-xs text-[#70716B]">{currentStepMessage}</p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-[#A84F65]">
                Step {currentStepIndex + 1} of {realScanSteps.length}
              </span>
            </div>

            {/* Step Indicators */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {realScanSteps.map((step, idx) => {
                const isPassed = idx < currentStepIndex;
                const isCurrent = idx === currentStepIndex;
                return (
                  <div
                    key={step.title}
                    className={`p-3 rounded-xl border text-xs transition-all ${
                      isCurrent
                        ? 'bg-white border-[#C96F82] shadow-sm'
                        : isPassed
                        ? 'bg-[#F2F7F3] border-[#E2EDE4] text-[#648568]'
                        : 'bg-white/60 border-[#EAEAE4] text-[#999A92]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-[10px] font-bold">0{idx + 1}</span>
                      {isPassed && <CheckCircle2 className="w-3.5 h-3.5 text-[#648568]" />}
                      {isCurrent && <Loader2 className="w-3.5 h-3.5 animate-spin text-[#C96F82]" />}
                    </div>
                    <span className="font-bold text-[11px] block text-[#292A27]">{step.title}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Scan Error State */}
        {scanError && !isScanning && (
          <div className="p-4 rounded-xl bg-[#FFF5F6] border border-[#F8E9ED] text-xs text-[#C94F55] flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold">Scan Execution Blocked:</strong>
              <p className="mt-0.5 leading-relaxed">{scanError}</p>
            </div>
          </div>
        )}

        {/* Scan Summary Banner after completion */}
        {scanResult && !isScanning && (
          <div className="mt-6 p-6 sm:p-7 rounded-2xl bg-white border-2 border-[#648568]/30 shadow-card space-y-5 animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#EAEAE4]">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full bg-[#EEF0E3] text-[#648568] font-bold text-[10px] uppercase">
                    Audit Verified
                  </span>
                  <span className="font-mono text-xs text-[#70716B]">ID: {scanResult.scanId}</span>
                </div>
                <h3 className="text-lg font-bold text-[#292A27] mt-1">{scanResult.websiteUrl}</h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onNavigate('results')}
                  className="px-4 py-2 rounded-xl bg-[#C96F82] hover:bg-[#A84F65] text-white text-xs font-bold shadow-rose transition-all"
                >
                  View Scan Results
                </button>
                <button
                  onClick={() => onNavigate('fixes')}
                  className="px-4 py-2 rounded-xl bg-[#FAFAF8] hover:bg-[#F6F7F0] text-[#292A27] text-xs font-bold border border-[#EAEAE4] transition-all"
                >
                  View AI Fixes
                </button>
                <button
                  onClick={() => onNavigate('reports')}
                  className="px-4 py-2 rounded-xl bg-[#FAFAF8] hover:bg-[#F6F7F0] text-[#70716B] text-xs font-semibold border border-[#EAEAE4] transition-all"
                >
                  Download Report
                </button>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-[#FAFAF8] border border-[#EAEAE4]">
                <span className="text-[11px] font-semibold text-[#70716B]">Accessibility Score</span>
                <p className="text-2xl font-black text-[#292A27] mt-1">
                  {scanResult.scoreBreakdown?.score || 0}
                  <span className="text-xs text-[#70716B] font-medium">/100</span>
                </p>
                <span className="text-[10px] text-[#A84F65] font-semibold">
                  {scanResult.scoreBreakdown?.status}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-[#FAFAF8] border border-[#EAEAE4]">
                <span className="text-[11px] font-semibold text-[#70716B]">Pages Crawled</span>
                <p className="text-2xl font-black text-[#292A27] mt-1">
                  {scanResult.pagesScanned || 1}
                </p>
                <span className="text-[10px] text-[#7B8053] font-semibold">
                  {scanResult.pagesDiscovered || 1} discovered
                </span>
              </div>

              <div className="p-4 rounded-xl bg-[#FFF5F6] border border-[#F8E9ED]">
                <span className="text-[11px] font-semibold text-[#C94F55]">Total Violations</span>
                <p className="text-2xl font-black text-[#C94F55] mt-1">
                  {scanResult.issues?.length || 0}
                </p>
                <span className="text-[10px] text-[#C94F55] font-semibold">
                  {scanResult.scoreBreakdown?.criticalCount || 0} Critical • {scanResult.scoreBreakdown?.seriousCount || 0} Serious
                </span>
              </div>

              <div className="p-4 rounded-xl bg-[#FAFAF8] border border-[#EAEAE4]">
                <span className="text-[11px] font-semibold text-[#70716B]">Audit Duration</span>
                <p className="text-2xl font-black text-[#292A27] mt-1">
                  {Math.round((scanResult.durationMs || 1000) / 1000)}s
                </p>
                <span className="text-[10px] text-[#70716B]">
                  {new Date(scanResult.timestamp).toLocaleTimeString()}
                </span>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Monitored Domains Inventory Table */}
      <section className="p-6 sm:p-7 rounded-2xl bg-white border border-[#EAEAE4] shadow-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#EAEAE4]">
          <div>
            <h3 className="text-base font-bold text-[#292A27]">Audited Domains</h3>
            <p className="text-xs text-[#70716B]">Web properties currently stored in persistent database</p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#FAFAF8] border border-[#EAEAE4] text-[#70716B]">
            {recentScans.length} Saved Targets
          </span>
        </div>

        {recentScans.length === 0 ? (
          <div className="text-center py-10 space-y-3">
            <Globe className="w-10 h-10 text-[#7B8053] mx-auto opacity-40" />
            <p className="text-xs text-[#70716B]">
              No websites scanned yet. Enter a URL above to run your first automated audit.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAFAF8] border-b border-[#EAEAE4] text-[#70716B] font-semibold">
                <tr>
                  <th className="py-3 px-4">Domain</th>
                  <th className="py-3 px-4">Score</th>
                  <th className="py-3 px-4">Active Violations</th>
                  <th className="py-3 px-4">Pages</th>
                  <th className="py-3 px-4">Last Scanned</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAEAE4]">
                {recentScans.map((site) => (
                  <tr key={site.id} className="hover:bg-[#FAFAF8]/70 transition-colors">
                    <td className="py-3.5 px-4 font-medium text-[#292A27]">
                      <div className="flex items-center gap-2">
                        <Globe className="w-3.5 h-3.5 text-[#7B8053]" />
                        <span className="font-mono text-xs">{site.url}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`font-black text-xs ${
                          site.score >= 90
                            ? 'text-[#648568]'
                            : site.score >= 70
                            ? 'text-[#C96F82]'
                            : 'text-[#C94F55]'
                        }`}
                      >
                        {site.score}/100
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-[#292A27]">{site.issuesCount.total}</span>
                      <span className="text-[10px] text-[#C94F55] block font-mono">
                        {site.issuesCount.critical} Critical
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-[#70716B]">
                      {site.pagesScanned || 1}
                    </td>
                    <td className="py-3.5 px-4 text-[#70716B]">
                      {site.lastScanned}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={() => handleTriggerRescan(site.id)}
                        disabled={rescanningId === site.id}
                        className="px-2.5 py-1 rounded-lg bg-[#FAFAF8] hover:bg-[#EEF0E3] text-[#7B8053] font-bold border border-[#EAEAE4] transition-colors inline-flex items-center gap-1 disabled:opacity-50"
                        title="Rescan website and verify resolved fixes"
                      >
                        <RefreshCw className={`w-3 h-3 ${rescanningId === site.id ? 'animate-spin' : ''}`} />
                        <span>Rescan & Verify</span>
                      </button>
                      <button
                        onClick={() => onNavigate('results')}
                        className="px-2.5 py-1 rounded-lg bg-[#FAFAF8] hover:bg-[#F8E9ED] text-[#A84F65] font-semibold border border-[#EAEAE4] transition-colors"
                      >
                        View Issues →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};
