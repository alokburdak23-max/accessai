import { type CrawlAuditResult } from './crawler.ts';

export interface VerificationComparisonResult {
  scanId: string;
  previousScanId: string;
  websiteUrl: string;
  scoreImprovement: number;
  newScore: number;
  previousScore: number;
  totalResolvedCount: number;
  remainingCount: number;
  newViolationsCount: number;
  resolvedIssues: any[];
  remainingIssues: any[];
  newIssues: any[];
}

/**
 * Compares a newly completed scan with a previous scan to verify which fixes have genuinely been resolved.
 */
export function verifyAndCompareScans(
  previousScan: CrawlAuditResult,
  newScan: CrawlAuditResult
): VerificationComparisonResult {
  // Create a signature set for new scan violations
  // Signature: `${ruleId}:::${affectedPage}:::${selector}`
  const newSignatures = new Set<string>();
  newScan.issues.forEach((iss) => {
    newSignatures.add(`${iss.ruleId}:::${iss.affectedPage}:::${iss.selector}`);
  });

  const previousSignatures = new Set<string>();
  previousScan.issues.forEach((iss) => {
    previousSignatures.add(`${iss.ruleId}:::${iss.affectedPage}:::${iss.selector}`);
  });

  const resolvedIssues: any[] = [];
  const remainingIssues: any[] = [];
  const newIssues: any[] = [];

  // Check previous issues: if signature is not in new scan, it has been resolved!
  previousScan.issues.forEach((prevIssue) => {
    const sig = `${prevIssue.ruleId}:::${prevIssue.affectedPage}:::${prevIssue.selector}`;
    if (!newSignatures.has(sig)) {
      resolvedIssues.push({
        ...prevIssue,
        status: 'resolved',
        resolvedAt: newScan.timestamp,
        verificationMethod: 'Automated Rescan Comparison'
      });
    } else {
      remainingIssues.push(prevIssue);
    }
  });

  // Check new issues: if signature was not in previous scan, it's a new regression
  newScan.issues.forEach((newIssue) => {
    const sig = `${newIssue.ruleId}:::${newIssue.affectedPage}:::${newIssue.selector}`;
    if (!previousSignatures.has(sig)) {
      newIssues.push(newIssue);
    }
  });

  // Update newScan's fixes: if matching issue was resolved, mark fix as verified
  const resolvedSignatures = new Set(
    resolvedIssues.map((r) => `${r.ruleId}:::${r.affectedPage}:::${r.selector}`)
  );

  newScan.fixes.forEach((f) => {
    const matchIssue = previousScan.issues.find((i) => i.id === f.issueId);
    if (matchIssue) {
      const sig = `${matchIssue.ruleId}:::${matchIssue.affectedPage}:::${matchIssue.selector}`;
      if (resolvedSignatures.has(sig)) {
        f.status = 'verified';
        f.approved = true;
      }
    }
  });

  const scoreImprovement = newScan.scoreBreakdown.score - previousScan.scoreBreakdown.score;

  return {
    scanId: newScan.scanId,
    previousScanId: previousScan.scanId,
    websiteUrl: newScan.websiteUrl,
    scoreImprovement,
    newScore: newScan.scoreBreakdown.score,
    previousScore: previousScan.scoreBreakdown.score,
    totalResolvedCount: resolvedIssues.length,
    remainingCount: remainingIssues.length,
    newViolationsCount: newIssues.length,
    resolvedIssues,
    remainingIssues,
    newIssues
  };
}
