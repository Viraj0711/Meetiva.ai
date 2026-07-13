#!/usr/bin/env tsx
/**
 * kill-port.ts
 * Cross-platform script to kill processes occupying a specific port.
 * Usage: npx tsx scripts/kill-port.ts [port]
 * Default port: 8000
 */

import { execSync } from 'child_process';

const PORT = parseInt(process.argv[2] || '8000', 10);

if (isNaN(PORT) || PORT < 1 || PORT > 65535) {
  console.error(`❌ Invalid port: ${process.argv[2]}`);
  process.exit(1);
}

function killPort(port: number): void {
  console.log(`🔍 Checking for processes on port ${port}...`);

  try {
    const pids: string[] = [];

    if (process.platform === 'win32') {
      // Windows: Find process using port
      const output = execSync(`netstat -ano | findstr :${port}`, {
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      // Parse netstat output to find PIDs
      const lines = output.split('\n');
      for (const line of lines) {
        if (line.includes(`:${port}`) && line.includes('LISTENING')) {
          const parts = line.trim().split(/\s+/);
          const pid = parts[parts.length - 1];
          // Validate PID is numeric to prevent injection
          if (pid && /^\d+$/.test(pid) && !pids.includes(pid)) {
            pids.push(pid);
          }
        }
      }

      // Kill each process
      for (const pid of pids) {
        try {
          execSync(`taskkill /F /PID ${pid}`, {
            stdio: ['pipe', 'pipe', 'pipe'],
          });
          console.log(`✅ Killed process ${pid} on port ${port}`);
        } catch {
          console.log(`⚠️  Could not kill process ${pid} (may require admin)`);
        }
      }
    } else {
      // Unix-like (Linux/macOS): Find and kill process using port
      // Try lsof first, fall back to fuser if lsof is unavailable
      execSync(`(lsof -ti:${port} 2>/dev/null || fuser ${port}/tcp 2>/dev/null | awk '{print $1}') | xargs kill -9 2>/dev/null || true`, {
        stdio: ['pipe', 'pipe', 'pipe'],
      });
      console.log(`✅ Killed any processes on port ${port}`);
    }

    if (pids.length === 0) {
      console.log(`ℹ️  No processes found on port ${port}`);
    }
  } catch {
    // No process found or command failed - that's okay
    console.log(`ℹ️  No stale processes found on port ${port}`);
  }
}

killPort(PORT);
