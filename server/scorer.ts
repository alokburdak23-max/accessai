export interface ScoreBreakdown {
  score: number;
  status: 'Optimal Accessibility' | 'Needs Improvement' | 'High Barrier Risk';
  criticalCount: number;
  seriousCount: number;
  moderateCount: number;
  minorCount: number;
  totalViolations: number;
  methodology: {
    baseScore: number;
    penalties: {
      critical: number;
      serious: number;
      moderate: number;
      minor: number;
      totalPenalty: number;
    };
    pagesNormalized: number;
    formula: string;
  };
  pourDistribution: {
    perceivable: number;
    operable: number;
    understandable: number;
    robust: number;
  };
  wcagCompliance: {
    levelA: { status: string; passRatePct: number };
    levelAA: { status: string; passRatePct: number };
    levelAAA: { status: string; passRatePct: number };
  };
}

/**
 * Calculates a transparent, documented accessibility score from collected violation items.
 */
export function calculateAccessibilityScore(
  issues: { severity: string; category: string; wcagLevel: string }[],
  pagesScannedCount: number
): ScoreBreakdown {
  const pagesCount = Math.max(1, pagesScannedCount);

  let criticalCount = 0;
  let seriousCount = 0;
  let moderateCount = 0;
  let minorCount = 0;

  let perceivable = 0;
  let operable = 0;
  let understandable = 0;
  let robust = 0;

  issues.forEach((iss) => {
    if (iss.severity === 'critical') criticalCount++;
    else if (iss.severity === 'serious') seriousCount++;
    else if (iss.severity === 'moderate') moderateCount++;
    else minorCount++;

    if (iss.category === 'Images & Media' || iss.category === 'Color & Contrast') {
      perceivable++;
    } else if (iss.category === 'Keyboard & Navigation') {
      operable++;
    } else if (iss.category === 'Forms & Controls') {
      understandable++;
    } else {
      robust++;
    }
  });

  const totalViolations = issues.length;

  if (totalViolations === 0) {
    return {
      score: 100,
      status: 'Optimal Accessibility',
      criticalCount: 0,
      seriousCount: 0,
      moderateCount: 0,
      minorCount: 0,
      totalViolations: 0,
      methodology: {
        baseScore: 100,
        penalties: { critical: 0, serious: 0, moderate: 0, minor: 0, totalPenalty: 0 },
        pagesNormalized: pagesCount,
        formula: '100 (Zero automated violations detected)'
      },
      pourDistribution: { perceivable: 0, operable: 0, understandable: 0, robust: 0 },
      wcagCompliance: {
        levelA: { status: 'Compliant (Automated Checks)', passRatePct: 100 },
        levelAA: { status: 'Compliant (Automated Checks)', passRatePct: 100 },
        levelAAA: { status: 'Advisory Passing', passRatePct: 100 }
      }
    };
  }

  // Weight penalties per violation: Critical: 10, Serious: 5, Moderate: 2, Minor: 1
  const critPenalty = criticalCount * 10;
  const serPenalty = seriousCount * 5;
  const modPenalty = moderateCount * 2;
  const minPenalty = minorCount * 1;
  const totalRawPenalty = critPenalty + serPenalty + modPenalty + minPenalty;

  // Normalize by number of pages crawled
  const normalizedPenalty = Math.round(totalRawPenalty / pagesCount);

  // Score bounded between 15 and 100
  const score = Math.max(15, Math.min(100, 100 - normalizedPenalty));

  let status: 'Optimal Accessibility' | 'Needs Improvement' | 'High Barrier Risk' = 'Needs Improvement';
  if (score >= 90 && criticalCount === 0) {
    status = 'Optimal Accessibility';
  } else if (score < 70 || criticalCount >= 3) {
    status = 'High Barrier Risk';
  }

  // Calculate WCAG level estimates based on issues detected
  const levelAIssues = issues.filter((i) => i.wcagLevel === 'A').length;
  const levelAAIssues = issues.filter((i) => i.wcagLevel === 'AA').length;
  const levelAAAIssues = issues.filter((i) => i.wcagLevel === 'AAA').length;

  const passRateA = Math.max(30, Math.min(100, Math.round(100 - (levelAIssues * 8) / pagesCount)));
  const passRateAA = Math.max(25, Math.min(100, Math.round(100 - (levelAAIssues * 6) / pagesCount)));
  const passRateAAA = Math.max(20, Math.min(100, Math.round(100 - (levelAAAIssues * 4) / pagesCount)));

  return {
    score,
    status,
    criticalCount,
    seriousCount,
    moderateCount,
    minorCount,
    totalViolations,
    methodology: {
      baseScore: 100,
      penalties: {
        critical: critPenalty,
        serious: serPenalty,
        moderate: modPenalty,
        minor: minPenalty,
        totalPenalty: totalRawPenalty
      },
      pagesNormalized: pagesCount,
      formula: `100 - (${totalRawPenalty} raw penalty / ${pagesCount} pages) = ${score}/100`
    },
    pourDistribution: {
      perceivable,
      operable,
      understandable,
      robust
    },
    wcagCompliance: {
      levelA: {
        status: passRateA >= 90 ? 'Compliant' : passRateA >= 70 ? 'Partial' : 'Non-Compliant',
        passRatePct: passRateA
      },
      levelAA: {
        status: passRateAA >= 85 ? 'Compliant' : passRateAA >= 65 ? 'In Progress' : 'Non-Compliant',
        passRatePct: passRateAA
      },
      levelAAA: {
        status: 'Advisory Only',
        passRatePct: passRateAAA
      }
    }
  };
}
