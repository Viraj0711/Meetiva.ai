/**
 * Unit tests for the query safety plugin's analyzeFilter function.
 *
 * Run with: npx tsx src/tests/querySafetyPlugin.test.ts
 */

import { analyzeFilter } from '../lib/querySafetyPlugin';

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string): void {
  if (condition) {
    passed++;
    console.log(`  ✓ ${message}`);
  } else {
    failed++;
    console.log(`  ✗ ${message}`);
  }
}

function assertEqual<T>(actual: T, expected: T, message: string): void {
  assert(actual === expected, `${message} (got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)})`);
}

function assertIncludes(arr: { field: string; operator: string; severity: string }[], field: string, operator: string, severity: string, message: string): void {
  const found = arr.some(f => f.field === field && f.operator === operator && f.severity === severity);
  assert(found, message);
}

// ── Tests ───────────────────────────────────────────────────────────────────

console.log('\n=== analyzeFilter: clean filters ===');

const clean1 = analyzeFilter({ email: 'user@example.com' });
assertEqual(clean1.length, 0, 'simple string field → no findings');

const clean2 = analyzeFilter({ userId: '507f1f77bcf86cd799439011' });
assertEqual(clean2.length, 0, 'ObjectId string → no findings');

const clean3 = analyzeFilter({});
assertEqual(clean3.length, 0, 'empty filter → no findings');

const clean4 = analyzeFilter({ status: 'active', type: 'meeting' });
assertEqual(clean4.length, 0, 'multiple string fields → no findings');

console.log('\n=== analyzeFilter: $ne on simple fields (medium severity) ===');

const ne1 = analyzeFilter({ email: { $ne: '' } });
assertEqual(ne1.length, 1, 'one finding for $ne on email');
assertIncludes(ne1, 'email', '$ne', 'medium', '$ne on email → medium severity');

const ne2 = analyzeFilter({ name: { $ne: '' } });
assertIncludes(ne2, 'name', '$ne', 'medium', '$ne on name → medium severity');

const ne3 = analyzeFilter({ role: { $ne: 'admin' } });
assertIncludes(ne3, 'role', '$ne', 'medium', '$ne on role → medium severity');

console.log('\n=== analyzeFilter: $gt/$gte/$lt/$lte on simple fields (medium) ===');

const gt1 = analyzeFilter({ email: { $gt: '' } });
assertIncludes(gt1, 'email', '$gt', 'medium', '$gt on email → medium');

const lt1 = analyzeFilter({ name: { $lt: 'z' } });
assertIncludes(lt1, 'name', '$lt', 'medium', '$lt on name → medium');

console.log('\n=== analyzeFilter: operators on complex fields (low severity) ===');

const low1 = analyzeFilter({ createdAt: { $gte: new Date('2024-01-01') } });
assertIncludes(low1, 'createdAt', '$gte', 'low', '$gte on createdAt → low');

const low2 = analyzeFilter({ tags: { $in: ['urgent'] } });
assertIncludes(low2, 'tags', '$in', 'low', '$in on tags → low');

const low3 = analyzeFilter({ score: { $gt: 100 } });
assertIncludes(low3, 'score', '$gt', 'low', '$gt on score → low');

console.log('\n=== analyzeFilter: $where and $expr (high severity) ===');

const high1 = analyzeFilter({ $where: 'this.email == this.username' });
assertEqual(high1.length, 1, 'one finding for $where');
assertIncludes(high1, '$where', '$where', 'high', '$where → high severity');

const high2 = analyzeFilter({ $expr: { $gt: ['$amount', 1000] } });
assertIncludes(high2, '$expr', '$expr', 'high', '$expr → high severity');

console.log('\n=== analyzeFilter: $regex on simple fields (medium) ===');

const regex1 = analyzeFilter({ email: { $regex: '.*', $options: 'i' } });
assertIncludes(regex1, 'email', '$regex', 'medium', '$regex on email → medium');

console.log('\n=== analyzeFilter: $in/$nin on simple fields (medium) ===');

const in1 = analyzeFilter({ role: { $in: ['admin', 'superadmin'] } });
assertIncludes(in1, 'role', '$in', 'medium', '$in on role → medium');

const nin1 = analyzeFilter({ status: { $nin: ['banned'] } });
assertIncludes(nin1, 'status', '$nin', 'medium', '$nin on status → medium');

console.log('\n=== analyzeFilter: combined suspicious patterns ===');

const combo = analyzeFilter({
  email: { $ne: '' },
  role: { $in: ['admin'] },
});
assertEqual(combo.length, 2, 'two findings for $ne + $in on simple fields');
assertIncludes(combo, 'email', '$ne', 'medium', 'combo: $ne on email');
assertIncludes(combo, 'role', '$in', 'medium', 'combo: $in on role');

console.log('\n=== analyzeFilter: nested objects ===');

const nested = analyzeFilter({
  user: { role: { $ne: 'user' } },
});
// The nested $ne on 'role' inside 'user' should be detected
const nestedRole = nested.find(f => f.field.includes('role') && f.operator === '$ne');
assert(nestedRole !== undefined, 'nested $ne on role is detected');

console.log('\n=== analyzeFilter: null/undefined values are ignored ===');

const nullFilter = analyzeFilter({ email: null, name: undefined });
assertEqual(nullFilter.length, 0, 'null/undefined values → no findings');

console.log('\n=== analyzeFilter: arrays are ignored ===');

const arrayFilter = analyzeFilter({ tags: ['a', 'b', 'c'] });
assertEqual(arrayFilter.length, 0, 'plain array → no findings');

console.log('\n=== analyzeFilter: Date and RegExp instances are ignored ===');

const dateFilter = analyzeFilter({ createdAt: new Date('2024-01-01') });
assertEqual(dateFilter.length, 0, 'Date instance → no findings');

const regexFilter = analyzeFilter({ pattern: /test/i });
assertEqual(regexFilter.length, 0, 'RegExp instance → no findings');

console.log('\n=== analyzeFilter: $exists on simple fields (medium) ===');

const exists1 = analyzeFilter({ email: { $exists: true } });
assertIncludes(exists1, 'email', '$exists', 'medium', '$exists on email → medium');

console.log('\n=== analyzeFilter: $not on simple fields (medium) ===');

const not1 = analyzeFilter({ name: { $not: { $regex: '^admin' } } });
assertIncludes(not1, 'name', '$not', 'medium', '$not on name → medium');

// ── Summary ─────────────────────────────────────────────────────────────────

console.log(`\n${'─'.repeat(60)}`);
console.log(`  Results: ${passed} passed, ${failed} failed`);
console.log('');

if (failed > 0) {
  process.exit(1);
}
