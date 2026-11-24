'use strict';

/**
 * Scores how risky a deployment is (0 = safe, 100 = very risky).
 * Pure function: no I/O, so it is trivial to unit test in CI.
 */
function scoreRelease(change = {}) {
  const {
    filesChanged = 0,
    linesChanged = 0,
    testsAdded = 0,
    touchesMigrations = false,
    touchesCI = false,
    deployTime = new Date(),
  } = change;

  if (filesChanged < 0 || linesChanged < 0 || testsAdded < 0) {
    throw new RangeError('Counts must be non-negative');
  }

  let score = 0;
  const reasons = [];

  const sizePoints = Math.min(35, Math.round(linesChanged / 20));
  if (sizePoints > 0) {
    score += sizePoints;
    reasons.push(`Large diff (+${sizePoints})`);
  }
  if (filesChanged > 15) {
    score += 10;
    reasons.push('Touches many files (+10)');
  }
  if (touchesMigrations) {
    score += 25;
    reasons.push('Database migration (+25)');
  }
  if (touchesCI) {
    score += 10;
    reasons.push('Pipeline config changed (+10)');
  }

  const when = new Date(deployTime);
  const isFridayAfternoon = when.getUTCDay() === 5 && when.getUTCHours() >= 14;
  if (isFridayAfternoon) {
    score += 15;
    reasons.push('Friday-afternoon deploy (+15)');
  }

  if (testsAdded > 0) {
    const credit = Math.min(20, testsAdded * 4);
    score -= credit;
    reasons.push(`New tests (-${credit})`);
  }

  score = Math.max(0, Math.min(100, score));
  return { score, level: levelFor(score), reasons, deployable: score < 70 };
}

function levelFor(score) {
  if (score < 30) return 'low';
  if (score < 70) return 'medium';
  return 'high';
}

module.exports = { scoreRelease, levelFor };
