#!/usr/bin/env tsx
/**
 * check-query-safety.ts
 *
 * Static analysis script that scans backend source files for NoSQL injection
 * risks — any place where req.body, req.query, or req.params is passed
 * directly as a MongoDB query filter.
 *
 * Run:   npx tsx scripts/check-query-safety.ts
 * Exit:  0 = clean, 1 = violations found
 *
 * Patterns detected:
 *   1. Model.find(req.body)          — direct passthrough
 *   2. Model.find({ ...req.body })   — spread passthrough
 *   3. Model.deleteOne(req.body)     — direct passthrough
 *   4. Any Model method with req.body/query/params as the sole filter arg
 *   5. Filter objects built from user input without $eq wrapping
 */

import * as fs from 'fs';
import * as path from 'path';

// ── Config ──────────────────────────────────────────────────────────────────

const ROOT = path.resolve(__dirname, '..');
const SRC_DIR = path.join(ROOT, 'src');

const SCAN_DIRS = ['routes', 'middleware', 'services', 'jobs', 'scripts'];

// Files to exclude (tests, seeds, etc.)
const EXCLUDE_PATTERNS = [
  /\.test\.(ts|js)$/,
  /\.spec\.(ts|js)$/,
  /seed\.ts$/,
  /check-query-safety\.ts$/, // don't lint ourselves
];

// ── Detection patterns ──────────────────────────────────────────────────────
// Each pattern: { regex, message, severity }
// The regex captures the line; the message explains the violation.

interface Violation {
  file: string;
  line: number;
  code: string;
  message: string;
  severity: 'error' | 'warning';
}

const DANGEROUS_PATTERNS: Array<{
  regex: RegExp;
  message: string;
  severity: 'error' | 'warning';
}> = [
  // ── Error: direct req.body/query/params passthrough ──
  {
    // Model.find(req.body) / Model.findOne(req.body) / Model.deleteOne(req.body) etc.
    regex: /\.(find|findOne|findOneAndUpdate|findOneAndDelete|findOneAndReplace|deleteOne|deleteMany|updateOne|updateMany|countDocuments|aggregate)\(\s*(req\.(body|query|params))\s*[,\)]/g,
    message:
      'User input passed directly as query filter. Use $eq operator or validate field types first.',
    severity: 'error',
  },
  {
    // Spread: { ...req.body } inside a query
    regex: /\{\s*\.\.\.req\.(body|query|params)\s*\}/g,
    message:
      'User input spread into query filter. This allows operator injection ($gt, $ne, etc.). Validate and sanitize each field.',
    severity: 'error',
  },
  {
    // Object shorthand: { req.body } (accidental, unlikely but caught)
    regex: /\{\s*req\.(body|query|params)\s*\}/g,
    message:
      'User input used as query filter object. Use $eq operator or destructure validated fields.',
    severity: 'error',
  },

  // ── Warning: user input in query-adjacent positions ──
  {
    // req.body used in $in without wrapping in ObjectId
    // e.g. { _id: { $in: req.body.ids } }
    regex: /\$in[^}]*req\.(body|query|params)/g,
    message:
      'User input in $in clause. Ensure each element is cast to ObjectId or validated as a string.',
    severity: 'warning',
  },
  {
    // Filter variable assigned from req.body and later used in query
    // Pattern: const filter = req.body
    regex: /(?:const|let|var)\s+\w*(?:filter|query|where|condition|criteria)\w*\s*=\s*req\.(body|query|params)/gi,
    message:
      'Variable that looks like a query filter is assigned from user input. Ensure it is validated before use in a database query.',
    severity: 'warning',
  },
];

// ── Scanner ─────────────────────────────────────────────────────────────────

function findTsFiles(dirs: string[]): string[] {
  const files: string[] = [];
  for (const dir of dirs) {
    const fullPath = path.join(SRC_DIR, dir);
    if (!fs.existsSync(fullPath)) continue;
    const entries = fs.readdirSync(fullPath, { withFileTypes: true });
    for (const entry of entries) {
      const entryPath = path.join(fullPath, entry.name);
      if (entry.isDirectory()) {
        // Recurse one level into subdirectories
        files.push(...findTsFiles([path.join(dir, entry.name)]));
      } else if (
        (entry.name.endsWith('.ts') || entry.name.endsWith('.js')) &&
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
    // Skip pure comments and imports
    const trimmed = line.trim();
    if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('import ')) {
      continue;
    }

    for (const pattern of DANGEROUS_PATTERNS) {
      // Reset regex lastIndex for each line
      pattern.regex.lastIndex = 0;
      if (pattern.regex.test(line)) {
        violations.push({
          file: relativePath,
          line: i + 1,
          code: trimmed.length > 100 ? trimmed.slice(0, 97) + '...' : trimmed,
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
  console.log('🔒 NoSQL Injection Safety Scanner');
  console.log(`   Scanning: ${SCAN_DIRS.map((d) => `src/${d}/`).join(', ')}`);
  console.log('');

  const files = findTsFiles(SCAN_DIRS);
  console.log(`   Found ${files.length} source files to scan\n`);

  const allViolations: Violation[] = [];

  for (const file of files) {
    const violations = scanFile(file);
    allViolations.push(...violations);
  }

  // Report
  if (allViolations.length === 0) {
    console.log('✅ No NoSQL injection risks detected. All queries are safe.\n');
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
  console.log(
    `   Found: ${errors.length} error(s), ${warnings.length} warning(s)`,
  );
  console.log('');

  if (errors.length > 0) {
    console.log(
      '❌ Security scan failed. Fix the errors above before committing.',
    );
    console.log(
       '   See OWASP NoSQL Injection: https://owasp.org/www-community-vulnerabilities/NoSQL_Injection\n',
    );
    process.exit(1);
  }

  console.log('⚠️  Warnings found (non-blocking). Review before merging.\n');
  process.exit(0);
}

main();
