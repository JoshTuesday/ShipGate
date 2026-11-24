'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { scoreRelease, levelFor } = require('../src/risk');

test('tiny change is low risk and deployable', () => {
  const r = scoreRelease({ filesChanged: 1, linesChanged: 10, testsAdded: 1 });
  assert.equal(r.level, 'low');
  assert.equal(r.deployable, true);
});

test('migration plus huge diff is high risk and blocked', () => {
  const r = scoreRelease({ filesChanged: 30, linesChanged: 900, touchesMigrations: true });
  assert.equal(r.level, 'high');
  assert.equal(r.deployable, false);
});

test('Friday afternoon adds a penalty', () => {
  const fri = scoreRelease({ deployTime: '2026-11-27T16:00:00Z' });
  const tue = scoreRelease({ deployTime: '2026-11-24T16:00:00Z' });
  assert.equal(fri.score - tue.score, 15);
});

test('tests reduce score but never below zero', () => {
  assert.equal(scoreRelease({ testsAdded: 50 }).score, 0);
});

test('CI changes are flagged', () => {
  assert.ok(scoreRelease({ touchesCI: true }).reasons.some((r) => r.includes('Pipeline')));
});

test('negative input throws', () => {
  assert.throws(() => scoreRelease({ linesChanged: -1 }), RangeError);
});

test('levelFor boundaries', () => {
  assert.equal(levelFor(29), 'low');
  assert.equal(levelFor(30), 'medium');
  assert.equal(levelFor(70), 'high');
});
