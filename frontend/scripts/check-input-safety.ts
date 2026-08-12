#!/usr/bin/env tsx
/**
 * check-input-safety.ts
 *
 * Static analysis script that scans frontend source files for input
 * validation gaps — places where user input may reach API calls without
 * passing through a validation layer (Zod schema, react-hook-form, or
 * explicit type guard).
 *
 * Run:   npx tsx scripts/check-input-safety.ts
 * Exit:  0 = clean, 1 = violations found
 *
 * Patterns detected:
 *   1. apiClient.post/put/patch with raw useState variables (no validation)
 *   2. Direct fetch() calls that bypass apiClient entirely
 *   3. as any casts on API payloads
 *   4. Form submissions using raw onSubmit without react-hook-form
 *   5. Unvalidated string interpolation in API URLs (path injection)
 *
 * Exemptions:
 *   - A `// input-safety-ok` comment (trailing the line or on the line above)
 *     marks a *warning* as reviewed & safe — use it only when validation
 *     happens server-side or the input is a server-generated id. Error-level
 *     findings (direct fetch, `as any`) can never be suppressed this way.
 *   - `JSON.parse` calls inside a `try { ... } catch` block are not flagged.
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// ── Config ──────────────────────────────────────────────────────────────────

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const SRC_DIR = path.join(ROOT, 'src');

// Directories to scan
const SCAN_DIRS = ['pages', 'services', 'components'];

// Files to exclude
const EXCLUDE_PATTERNS = [
  /\.test\.(ts|tsx)$/,
  /\.spec\.(ts|tsx)$/,
  /__tests__/,
  /check-input-safety\.ts$/,
  /setup\.ts$/,
];

// ── Types ───────────────────────────────────────────────────────────────────

interface Violation {
  file: string;
  line: number;
  code: string;
  message: string;
  severity: 'error' | 'warning';
}

interface SafetyPattern {
  regex: RegExp;
  message: string;
  severity: 'error' | 'warning';
  /** Optional context guard: return true to suppress a match (e.g. JSON.parse inside try-catch). */
  isSafe?: (content: string, matchIndex: number) => boolean;
}

// ── Detection patterns ──────────────────────────────────────────────────────

const DANGEROUS_PATTERNS: SafetyPattern[] = [
  // ── Error: direct fetch() bypassing apiClient ──
  {
    // Direct fetch to API endpoints — bypasses auth token injection,
    // 401 refresh flow, and meeting-limit handling in apiClient.
    regex: /\bfetch\s*\(\s*`[^`]*\/api\//g,
    message:
      'Direct fetch() to API endpoint bypasses apiClient (no auth token, no 401 refresh, no meeting-limit handling). Use apiClient instead.',
    severity: 'error',
  },
  {
    // Direct fetch with API_BASE_URL — same issue
    regex: /\bfetch\s*\(\s*(?:API_BASE_URL|\$\{API_BASE_URL\})/g,
    message:
      'Direct fetch() using API_BASE_URL bypasses apiClient. Use apiClient.post/get/put/delete instead.',
    severity: 'error',
  },

  // ── Error: as any on API payloads ──
  {
    // Casting data to any before sending to API
    regex: /apiClient\.(post|put|patch)\s*\([^)]*,\s*\w+\s+as\s+any/g,
    message:
      'API payload cast to `as any`. This bypasses TypeScript type safety. Use a validated type or Zod schema instead.',
    severity: 'error',
  },

  // ── Warning: raw useState → API without validation indicator ──
  {
    // apiClient.post with what looks like destructured useState variables
    // e.g., apiClient.post('/auth/register', { name, email, password })
    // This is a WARNING because the backend still validates — but frontend
    // validation provides better UX (instant error messages).
    regex: /apiClient\.(post|put|patch)\s*\(\s*['"`][^'"`]+['"`]\s*,\s*\{[^}]*\}/g,
    message:
      'API call with object payload. Ensure all fields are validated (Zod schema or react-hook-form) before sending.',
    severity: 'warning',
  },

  // ── Warning: template literal in API URL (path injection) ──
  {
    // apiClient.get(`/something/${userInput}`) — user input in URL path
    regex: /apiClient\.(get|delete)\s*\(\s*`[^`]*\$\{[^}]+\}/g,
    message:
      'User input interpolated into API URL path. Validate the input is a safe type (UUID, number) before interpolation.',
    severity: 'warning',
  },

  // ── Warning: localStorage/sessionStorage in API context ──
  {
    // Storing sensitive data in localStorage
    regex: /localStorage\.(setItem|getItem)\s*\(\s*['"`](?:token|password|secret|api[_-]?key)/gi,
    message:
      'Sensitive data stored in localStorage. Use httpOnly cookies or in-memory state instead.',
    severity: 'warning',
  },

  // ── Warning: JSON.parse on user input without try-catch ──
  {
    // JSON.parse without a surrounding try-catch crashes on malformed JSON.
    // Matches inside `try { ... } catch` blocks are suppressed by isSafe below.
    regex: /JSON\.parse\s*\(/g,
    message:
      'JSON.parse without visible try-catch. Wrap in try-catch to handle malformed JSON gracefully.',
    severity: 'warning',
    isSafe: (content, matchIndex) => isInsideTryCatch(content, matchIndex),
  },
];

// ── Allowlist & context helpers ─────────────────────────────────────────────

// A line containing this marker is treated as reviewed and exempt from the scan.
// Usage: `apiClient.post('/x', payload); // input-safety-ok: server-side validated`
const ALLOW_COMMENT = /\/\/\s*input-safety-ok/;

/**
 * Heuristic: is the code at `matchIndex` inside a `try { ... } catch` block?
 * Uses brace matching while skipping strings, template literals, and comments
 * so stray `{`/`}` in those can't corrupt the block boundaries.
 */
function isInsideTryCatch(content: string, matchIndex: number): boolean {
  // Track positions of unclosed `{` up to the match.
  const stack: number[] = [];
  let quote: '"' | "'" | '`' | null = null;
  let lineComment = false;
  let blockComment = false;

  for (let i = 0; i < matchIndex; i++) {
    const ch = content[i];
    const next = content[i + 1];

    if (lineComment) {
      if (ch === '\n') lineComment = false;
      continue;
    }
    if (blockComment) {
      if (ch === '*' && next === '/') {
        blockComment = false;
        i++;
      }
      continue;
    }
    if (quote) {
      if (ch === '\\') {
        i++;
      } else if (ch === quote) {
        quote = null;
      }
      continue;
    }
    if (ch === '/' && next === '/') {
      lineComment = true;
      i++;
      continue;
    }
    if (ch === '/' && next === '*') {
      blockComment = true;
      i++;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') {
      quote = ch;
      continue;
    }
    if (ch === '{') stack.push(i);
    else if (ch === '}' && stack.length > 0) stack.pop();
  }

  // Walk from the innermost enclosing block outward.
  while (stack.length > 0) {
    const blockStart = stack.pop()!;
    const header = content.slice(0, blockStart).trimEnd();
    if (!/try\s*$/.test(header)) continue;

    // Find the closing brace of this try block, then check for `catch`
    // (a generous window covers comments between `}` and `catch`).
    let depth = 1;
    for (let j = blockStart + 1; j < content.length; j++) {
      const ch = content[j];
      if (ch === '{') depth++;
      else if (ch === '}') {
        depth--;
        if (depth === 0) {
          const after = content.slice(j + 1, j + 200);
          return /\bcatch\s*[{(/]/.test(after);
        }
      }
    }
    return false;
  }
  return false;
}

// ── Scanner ─────────────────────────────────────────────────────────────────

function findFiles(dirs: string[]): string[] {
  const files: string[] = [];
  for (const dir of dirs) {
    const fullPath = path.join(SRC_DIR, dir);
    if (!fs.existsSync(fullPath)) continue;
    const entries = fs.readdirSync(fullPath, { withFileTypes: true });
    for (const entry of entries) {
      const entryPath = path.join(fullPath, entry.name);
      if (entry.isDirectory()) {
        files.push(...findFiles([path.join(dir, entry.name)]));
      } else if (
        (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) &&
        !EXCLUDE_PATTERNS.some((p) => p.test(entry.name))
      ) {
        files.push(entryPath);
      }
    }
  }
  return files;
}

function scanFile(filePath: string): Violation[] {
  const violations: Violation[] = [];
  const relativePath = path.relative(ROOT, filePath).replace(/\\/g, '/');
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  // Absolute offset of each line start — used to resolve a match within the
  // whole file so context-aware checks (e.g. try-catch) can run.
  const lineStarts: number[] = [];
  let offset = 0;
  for (const line of lines) {
    lineStarts.push(offset);
    offset += line.length + 1; // +1 for the '\n'
  }

  // Set when a pure-comment line carries the `// input-safety-ok` marker;
  // the next non-comment line is then exempt too (reason sits above the call).
  let allowNext = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    const isPureComment = trimmed.startsWith('//') || trimmed.startsWith('*');

    // Skip pure comments and imports; a marker comment also exempts the
    // following line.
    if (isPureComment) {
      if (ALLOW_COMMENT.test(line)) allowNext = true;
      continue;
    }
    if (trimmed.startsWith('import ')) continue;

    // Lines explicitly reviewed and whitelisted with `// input-safety-ok`
    // (either trailing the code or on the comment line directly above it).
    // This only suppresses *warning*-severity findings — error findings
    // (direct fetch, `as any`) must never be silenced by an inline comment.
    const exempt = allowNext || ALLOW_COMMENT.test(line);
    allowNext = false;

    for (const pattern of DANGEROUS_PATTERNS) {
      pattern.regex.lastIndex = 0;
      const match = pattern.regex.exec(line);
      if (!match) continue;
      if (exempt && pattern.severity !== 'error') continue;

      // Let patterns suppress matches that are actually safe in context
      // (e.g. a JSON.parse already wrapped in try-catch).
      if (pattern.isSafe) {
        const matchIndex = lineStarts[i] + (match.index ?? 0);
        if (pattern.isSafe(content, matchIndex)) continue;
      }

      violations.push({
        file: relativePath,
        line: i + 1,
        code: trimmed.length > 120 ? trimmed.slice(0, 117) + '...' : trimmed,
        message: pattern.message,
        severity: pattern.severity,
      });
    }
  }

  return violations;
}

// ── Main ────────────────────────────────────────────────────────────────────

function main(): void {
  console.log('🔒 Frontend Input Safety Scanner');
  console.log(`   Scanning: ${SCAN_DIRS.map((d) => `src/${d}/`).join(', ')}`);
  console.log('');

  const files = findFiles(SCAN_DIRS);
  console.log(`   Found ${files.length} source files to scan\n`);

  const allViolations: Violation[] = [];

  for (const file of files) {
    const violations = scanFile(file);
    allViolations.push(...violations);
  }

  // Report
  if (allViolations.length === 0) {
    console.log('✅ No input safety issues detected.\n');
    process.exit(0);
  }

  const errors = allViolations.filter((v) => v.severity === 'error');
  const warnings = allViolations.filter((v) => v.severity === 'warning');

  // Group by file
  const byFile = new Map<string, Violation[]>();
  for (const v of allViolations) {
    const existing = byFile.get(v.file) || [];
    existing.push(v);
    byFile.set(v.file, existing);
  }

  for (const [file, violations] of byFile) {
    console.log(`📄 ${file}`);
    for (const v of violations) {
      const icon = v.severity === 'error' ? '❌' : '⚠️ ';
      console.log(`   ${icon} Line ${v.line}: ${v.message}`);
      console.log(`      ${v.code}`);
    }
    console.log('');
  }

  console.log('─'.repeat(60));
  console.log(`   Found: ${errors.length} error(s), ${warnings.length} warning(s)`);
  console.log('');

  if (errors.length > 0) {
    console.log('❌ Input safety scan failed. Fix the errors above before committing.\n');
    process.exit(1);
  }

  console.log('⚠️  Warnings found (non-blocking). Review before merging.\n');
  process.exit(0);
}

main();
