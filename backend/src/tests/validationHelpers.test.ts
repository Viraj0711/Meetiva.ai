/**
 * Unit tests for the shared ObjectId validation helpers:
 *   - sanitizeObjectId
 *   - validateObjectIdParam
 *   - validateUuidParam
 *
 * Run with: npx tsx src/tests/validationHelpers.test.ts
 */

import { Types } from 'mongoose';
import { sanitizeObjectId, validateObjectIdParam, validateUuidParam } from '../lib/validation';
import { AppError } from '../lib/errors';

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

function assertThrows(fn: () => void, message: string): void {
  try {
    fn();
    failed++;
    console.log(`  ✗ ${message} (expected error but none thrown)`);
  } catch {
    passed++;
    console.log(`  ✓ ${message}`);
  }
}

function assertThrowsWith(fn: () => void, statusCode: number, messageIncludes: string, message: string): void {
  try {
    fn();
    failed++;
    console.log(`  ✗ ${message} (expected error but none thrown)`);
  } catch (err: any) {
    const ok = err.statusCode === statusCode && err.message.includes(messageIncludes);
    assert(ok, `${message} (got ${err.statusCode}: ${err.message})`);
  }
}

// ── Tests: sanitizeObjectId ─────────────────────────────────────────────────

console.log('\n=== sanitizeObjectId: valid ObjectIds ===');

const valid1 = sanitizeObjectId('507f1f77bcf86cd799439011');
assert(valid1 instanceof Types.ObjectId, 'returns ObjectId instance');
assertEqual(valid1.toString(), '507f1f77bcf86cd799439011', 'preserves the value');

const valid2 = sanitizeObjectId('507f1f77bcf86cd799439011', 'userId');
assert(valid2 instanceof Types.ObjectId, 'returns ObjectId with custom field name');

console.log('\n=== sanitizeObjectId: invalid inputs ===');

assertThrowsWith(
  () => sanitizeObjectId('not-an-objectid'),
  400,
  'Invalid id',
  'rejects non-hex string',
);

assertThrowsWith(
  () => sanitizeObjectId(''),
  400,
  'Invalid id',
  'rejects empty string',
);

assertThrowsWith(
  () => sanitizeObjectId('507f1f77bcf86cd79943901'),  // 23 chars, too short
  400,
  'Invalid id',
  'rejects short string (23 chars)',
);

assertThrowsWith(
  () => sanitizeObjectId('507f1f77bcf86cd799439011ff'),  // 26 chars, too long
  400,
  'Invalid id',
  'rejects long string (26 chars)',
);

assertThrowsWith(
  () => sanitizeObjectId(null),
  400,
  'Invalid id',
  'rejects null',
);

assertThrowsWith(
  () => sanitizeObjectId(undefined),
  400,
  'Invalid id',
  'rejects undefined',
);

assertThrowsWith(
  () => sanitizeObjectId(12345),
  400,
  'Invalid id',
  'rejects number',
);

assertThrowsWith(
  () => sanitizeObjectId({ _id: '507f1f77bcf86cd799439011' }),
  400,
  'Invalid id',
  'rejects object (NoSQL injection attempt)',
);

assertThrowsWith(
  () => sanitizeObjectId({ $gt: '' }),
  400,
  'Invalid id',
  'rejects operator object (injection attempt)',
);

assertThrowsWith(
  () => sanitizeObjectId('ObjectId("507f1f77bcf86cd799439011")'),
  400,
  'Invalid id',
  'rejects wrapped ObjectId string',
);

console.log('\n=== sanitizeObjectId: custom field name in error ===');

assertThrowsWith(
  () => sanitizeObjectId('bad', 'teamId'),
  400,
  'Invalid teamId',
  'custom field name appears in error message',
);

assertThrowsWith(
  () => sanitizeObjectId('bad', 'invitationId'),
  400,
  'Invalid invitationId',
  'invitationId field name in error',
);

// ── Tests: validateObjectIdParam ────────────────────────────────────────────

console.log('\n=== validateObjectIdParam: valid ObjectId ===');

let nextCalled = false;
let nextError: any = null;

const mockReq = { params: {} } as any;
const mockRes = {
  status: (_code: number) => mockRes,
  json: (_data: any) => mockRes,
  _statusCalled: false,
  _jsonCalled: false,
  _statusCode: 0,
  status(code: number) { this._statusCalled = true; this._statusCode = code; return this; },
  json(_data: any) { this._jsonCalled = true; return this; },
  reset() { this._statusCalled = false; this._jsonCalled = false; this._statusCode = 0; },
} as any;

const validParamHandler = validateObjectIdParam('id');

nextCalled = false;
nextError = null;
validParamHandler(mockReq, mockRes, (err?: any) => {
  nextCalled = true;
  nextError = err;
}, '507f1f77bcf86cd799439011');

assert(nextCalled, 'calls next() on valid ObjectId');
assert(nextError === undefined, 'no error on valid ObjectId');
assertEqual(mockReq.params.id, '507f1f77bcf86cd799439011', 'replaces param string with ObjectId string');

console.log('\n=== validateObjectIdParam: invalid ObjectId ===');

const invalidParamHandler = validateObjectIdParam('teamId');

nextCalled = false;
nextError = null;
invalidParamHandler(mockReq, mockRes, (err?: any) => {
  nextCalled = true;
  nextError = err;
}, 'not-a-valid-id');

assert(nextCalled, 'calls next() even on invalid (passes error)');
assert(nextError instanceof AppError, 'passes AppError to next');
assertEqual((nextError as AppError).statusCode, 400, 'error has status 400');

console.log('\n=== validateObjectIdParam: injection attempt ===');

nextCalled = false;
nextError = null;
invalidParamHandler(mockReq, mockRes, (err?: any) => {
  nextCalled = true;
  nextError = err;
}, '{ "$ne": "" }');

assert(nextCalled, 'calls next() on injection attempt');
assert(nextError instanceof AppError, 'passes AppError for injection attempt');

// ── Tests: validateUuidParam ────────────────────────────────────────────────

console.log('\n=== validateUuidParam: valid UUID ===');

const uuidHandler = validateUuidParam('id');

nextCalled = false;
nextError = null;
uuidHandler(mockReq, mockRes, (err?: any) => {
  nextCalled = true;
  nextError = err;
}, '550e8400-e29b-41d4-a716-446655440000');

assert(nextCalled, 'calls next() on valid UUID');
assert(nextError === undefined, 'no error on valid UUID');

console.log('\n=== validateUuidParam: invalid UUID ===');

nextCalled = false;
nextError = null;
// This tests via res.status().json() not next(), so we need to check res
uuidHandler(mockReq, mockRes, (err?: any) => {
  nextCalled = true;
  nextError = err;
}, 'not-a-uuid');

assert(!nextCalled, 'does not call next() on invalid UUID');
assert(mockRes._statusCode === 400, 'returns 400 status');

console.log('\n=== validateUuidParam: injection attempt ===');

nextCalled = false;
mockRes.reset();
uuidHandler(mockReq, mockRes, (err?: any) => {
  nextCalled = true;
}, '{ "$gt": "" }');

assert(!nextCalled, 'does not call next() on injection attempt');
assert(mockRes._statusCode === 400, 'returns 400 for injection attempt');

// ── Summary ─────────────────────────────────────────────────────────────────

console.log(`\n${'─'.repeat(60)}`);
console.log(`  Results: ${passed} passed, ${failed} failed`);
console.log('');

if (failed > 0) {
  process.exit(1);
}
