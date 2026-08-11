/**
 * querySafetyPlugin.ts
 *
 * Mongoose plugin that provides runtime detection of potential NoSQL injection
 * in query filters. This is a defense-in-depth layer — the primary defense is
 * Zod validation + sanitizeObjectId in the route layer.
 *
 * What it detects:
 *   - Query filter values that are raw objects with MongoDB operators ($gt, $ne,
 *     $in, $regex, etc.) — these may indicate operator injection from user input
 *   - $where and $expr operators (code injection vectors)
 *   - Deeply nested operator objects that look like injection attempts
 *
 * How it works:
 *   - Hooks into pre-query middleware for find/findOne/delete/update operations
 *   - Inspects the filter (first argument) for suspicious patterns
 *   - Logs warnings in development; can be configured to throw in production
 *
 * Usage:
 *   import { applyQuerySafetyPlugin } from './querySafetyPlugin';
 *   applyQuerySafetyPlugin(); // call once after mongoose.connect()
 *
 * Configuration:
 *   QUERY_SAFETY_MODE=warn    — log warnings (default)
 *   QUERY_SAFETY_MODE=throw   — throw AppError on suspicious queries
 *   QUERY_SAFETY_MODE=off     — disable entirely
 */

import mongoose from 'mongoose';
import { createLogger } from './logger';

const log = createLogger('meetiva:query-safety');

// ── Configuration ───────────────────────────────────────────────────────────

type SafetyMode = 'warn' | 'throw' | 'off';

const getMode = (): SafetyMode => {
  const env = (process.env.QUERY_SAFETY_MODE || 'warn').toLowerCase();
  if (env === 'throw' || env === 'off') return env;
  return 'warn';
};

// ── Detection ───────────────────────────────────────────────────────────────

/** MongoDB operators that indicate query manipulation. */
const QUERY_OPERATORS = new Set([
  '$gt', '$gte', '$lt', '$lte',
  '$ne', '$in', '$nin',
  '$regex', '$options',
  '$exists', '$type',
  '$where', '$expr',
  '$mod', '$not',
  '$elemMatch', '$all',
  '$near', '$nearSphere',
  '$geoWithin', '$geoIntersects',
]);

/** Operators that are especially dangerous (code execution / complex logic). */
const DANGEROUS_OPERATORS = new Set(['$where', '$expr']);

interface SuspiciousPattern {
  field: string;
  operator: string;
  reason: string;
  severity: 'low' | 'medium' | 'high';
}

/**
 * Recursively inspect a query filter for suspicious patterns.
 * Returns an array of detected issues.
 */
function inspectFilter(
  filter: Record<string, unknown>,
  path: string = '',
): SuspiciousPattern[] {
  const findings: SuspiciousPattern[] = [];

  for (const [key, value] of Object.entries(filter)) {
    const fieldPath = path ? `${path}.${key}` : key;

    // Skip Mongoose internal keys
    if (key.startsWith('$')) {
      // Top-level operator in a filter — check if it's a dangerous one
      if (DANGEROUS_OPERATORS.has(key)) {
        findings.push({
          field: fieldPath,
          operator: key,
          reason: `Dangerous operator ${key} detected — allows code execution or complex expressions`,
          severity: 'high',
        });
      }
      continue;
    }

    if (value === null || value === undefined) {
      continue;
    }

    if (typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date) && !(value instanceof RegExp)) {
      const obj = value as Record<string, unknown>;

      // Check for operator objects (e.g., { $ne: "" } or { $gt: ... })
      for (const [op] of Object.entries(obj)) {
        if (QUERY_OPERATORS.has(op)) {
          const severity = DANGEROUS_OPERATORS.has(op)
            ? 'high'
            : isSimpleField(key)
              ? 'medium'   // Operators on simple fields like email, name = suspicious
              : 'low';     // Operators on complex fields like dates, arrays = likely legitimate

          findings.push({
            field: fieldPath,
            operator: op,
            reason: severity === 'medium'
              ? `Operator ${op} on field "${key}" — simple fields should use literal values, not operators`
              : `Operator ${op} detected in filter`,
            severity,
          });
        }
      }

      // Recurse into nested objects (but not too deep)
      if (path.split('.').length < 3) {
        findings.push(...inspectFilter(obj, fieldPath));
      }
    }
  }

  return findings;
}

/**
 * Heuristic: is this field likely to store a simple value (string, number, bool)
 * rather than a complex structure? Operators on simple fields are more suspicious.
 */
function isSimpleField(fieldName: string): boolean {
  const simpleFields = new Set([
    'email', 'name', 'title', 'status', 'role', 'type',
    'password', 'token', 'code', 'phone', 'username',
    'slug', 'key', 'label', 'description',
  ]);
  return simpleFields.has(fieldName.toLowerCase());
}

// ── Plugin ──────────────────────────────────────────────────────────────────

/**
 * Apply the query safety plugin to all Mongoose models.
 * Call this once after mongoose.connect() in your app startup.
 *
 * In 'warn' mode (default): logs warnings for suspicious queries.
 * In 'throw' mode: throws an error, blocking the query.
 * In 'off' mode: no-op.
 */
export function applyQuerySafetyPlugin(): void {
  const mode = getMode();

  if (mode === 'off') {
    log.info('Query safety plugin disabled (QUERY_SAFETY_MODE=off)');
    return;
  }

  log.info(`Query safety plugin active (mode: ${mode})`);

  // Hook into mongoose's Query prototype to intercept all queries
  const queryProto = mongoose.Query.prototype;

  // Store original exec
  const originalExec = queryProto.exec;

  queryProto.exec = function (callback?: Function) {
    try {
      // Get the filter from the query
      const filter = this.getFilter();

      if (filter && typeof filter === 'object' && Object.keys(filter).length > 0) {
        const findings = inspectFilter(filter);

        if (findings.length > 0) {
          const highSeverity = findings.filter(f => f.severity === 'high');
          const mediumSeverity = findings.filter(f => f.severity === 'medium');

          const modelName = (this as any).model?.modelName || 'Unknown';
          const operation = (this as any).op || this.getOptions()?.operation || 'query';

          const details = findings
            .map(f => `  ${f.severity.toUpperCase()}: ${f.field} → ${f.operator} (${f.reason})`)
            .join('\n');

          const message = `[QuerySafety] Suspicious query on ${modelName}.${operation}:\n${details}`;

          if (mode === 'throw' && highSeverity.length > 0) {
            log.error(message);
            throw new Error(`Query blocked by safety plugin: ${highSeverity[0].reason}`);
          }

          if (highSeverity.length > 0) {
            log.error(message);
          } else if (mediumSeverity.length > 0) {
            log.warn(message);
          } else {
            log.debug(message);
          }
        }
      }
    } catch (err) {
      // If we're in throw mode and it's our error, re-throw
      if (mode === 'throw' && err instanceof Error && err.message.startsWith('Query blocked')) {
        throw err;
      }
      // Otherwise, log but don't block the query (fail open)
      log.debug('Query safety check error (non-blocking)', { error: (err as Error).message });
    }

    // Call original exec
    return originalExec.apply(this, arguments as any);
  };
}

/**
 * Inspect a filter object and return findings (for testing / manual inspection).
 * Does NOT block any queries — pure analysis.
 */
export function analyzeFilter(filter: Record<string, unknown>): SuspiciousPattern[] {
  return inspectFilter(filter);
}
