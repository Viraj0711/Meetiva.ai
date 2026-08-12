/**
 * Unit tests for the calendar event creation schema (strict ISO-8601 contract).
 *
 * These document the backend contract: the frontend MUST normalise its local
 * `datetime-local` values ("2026-08-13T11:30") into full ISO-8601 (with offset)
 * before submitting — localized display strings are correctly rejected here.
 *
 * Run with: npx tsx src/tests/calendarEventSchema.test.ts
 */

import { createEventSchema } from '../lib/validation';

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

const valid = {
  title: 'Team sync',
  description: 'Weekly sync',
  startTime: '2026-08-13T11:30:00.000+05:30',
  endTime: '2026-08-13T12:00:00.000+05:30',
  timeZone: 'Asia/Kolkata',
};

const accepts = (payload: unknown, message: string): void =>
  assert(createEventSchema.safeParse(payload).success, message);

const rejects = (payload: unknown, message: string): void =>
  assert(!createEventSchema.safeParse(payload).success, message);

console.log('\n=== Valid ISO-8601 datetimes ===');
accepts(valid, 'accepts ISO-8601 with numeric offset (+05:30)');
accepts(
  { ...valid, startTime: '2026-08-13T06:00:00.000Z', endTime: '2026-08-13T06:30:00.000Z' },
  'accepts UTC (Z) ISO-8601'
);
accepts({ title: valid.title, startTime: valid.startTime, endTime: valid.endTime }, 'timeZone is optional');
accepts({ ...valid, description: undefined }, 'description is optional');

console.log('\n=== Localized / non-ISO datetime inputs (must be rejected) ===');
rejects(
  { ...valid, startTime: '2026-08-13T11:30', endTime: '2026-08-13T12:00' },
  'rejects datetime-local format (no seconds / offset)'
);
rejects(
  { ...valid, startTime: '8/13/2026, 11:30:00 AM', endTime: '8/13/2026, 12:00:00 PM' },
  'rejects toLocaleString display format'
);
rejects({ ...valid, startTime: 'not-a-date' }, 'rejects non-date startTime');

console.log('\n=== Invalid / missing appointment time ===');
rejects({ ...valid, startTime: '' }, 'rejects empty startTime');
rejects({ ...valid, startTime: undefined }, 'rejects missing startTime');
rejects({ ...valid, endTime: undefined }, 'rejects missing endTime');
rejects(
  { ...valid, endTime: '2026-08-13T11:00:00.000+05:30' },
  'rejects endTime earlier than startTime'
);

console.log(`\n${'─'.repeat(60)}`);
console.log(`  Results: ${passed} passed, ${failed} failed`);
console.log('');

if (failed > 0) {
  process.exit(1);
}
