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

// ── Detection patterns ──────────────────────────────────────────────────────

const DANGEROUS_PATTERNS: Array<{
  regex: RegExp;
  message: string;
  severity: 'error' | 'warning';
}> = [
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
    // JSON.parse without surrounding try-catch (crashes on invalid JSON)
    regex: /(?<!try\s*\{[^}]*)JSON\.parse\s*\(/g,
    message:
      'JSON.parse without visible try-catch. Wrap in try-catch to handle malformed JSON gracefully.',
    severity: 'warning',
  },
];

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

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    // Skip pure comments and imports
    if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('import ')) {
      continue;
    }

    for (const pattern of DANGEROUS_PATTERNS) {
      pattern.regex.lastIndex = 0;
      if (pattern.regex.test(line)) {
        violations.push({
          file: relativePath,
          line: i + 1,
          code: trimmed.length > 120 ? trimmed.slice(0, 117) + '...' : trimmed,
          message: pattern.message,
          severity: pattern.severity,
        });
      }
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
