/**
 * Test for the ExcelJS workbook generation used in the
 * GET /meetings/:id/action-items/export endpoint.
 *
 * The export endpoint creates rows from action items, then:
 *   1. Creates an ExcelJS.Workbook
 *   2. Adds a 'Tasks' worksheet
 *   3. Sets columns dynamically from the first row's keys
 * 	 4. Calls addRows with the data
 *   5. Writes the buffer and sends as a download
 *
 * This test verifies that workbook generation produces a valid
 * .xlsx buffer with the correct structure and data.
 *
 * Run with: npx tsx src/tests/actionItemsExport.test.ts
 */

import ExcelJS from 'exceljs';

let passed = 0;
let failed = 0;

function assert(condition: boolean, label: string): void {
  if (condition) {
    passed++;
    process.stdout.write(`  ✅ ${label}\n`);
  } else {
    failed++;
    process.stdout.write(`  ❌ ${label}\n`);
  }
}

async function run(): Promise<void> {
  process.stdout.write('\n🧪 Action Items Export — ExcelJS Workbook Test\n\n');

  // ─── Test 1: generates a valid workbook from sample data ───────────────────

  {
    process.stdout.write('Test 1: Full data export\n');

    const rows = [
      {
        Task: 'Fix login bug',
        Description: 'Users cannot log in with SSO',
        Assignee: 'Alice',
        Priority: 'high',
        Status: 'in_progress',
        DueDate: '2026-07-01',
        Tags: 'bug, auth',
      },
      {
        Task: 'Write documentation',
        Description: '',
        Assignee: '',
        Priority: 'low',
        Status: 'pending',
        DueDate: '',
        Tags: '',
      },
    ];

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Tasks');
    worksheet.columns = Object.keys(rows[0] ?? {}).map((key) => ({
      header: key,
      key,
      width: 20,
    }));
    worksheet.addRows(rows);

    const buffer = await workbook.xlsx.writeBuffer();

    assert(buffer.length > 0, 'Buffer is not empty');
    assert(
      buffer[0] === 0x50 && buffer[1] === 0x4b,
      'Buffer starts with PK ZIP header (valid .xlsx)'
    );

    // Read back and verify contents
    const readWorkbook = new ExcelJS.Workbook();
    await readWorkbook.xlsx.load(buffer);
    const readSheet = readWorkbook.getWorksheet('Tasks');

    assert(readSheet !== undefined, 'Worksheet "Tasks" exists');
    assert(readSheet!.rowCount === 3, 'Has header + 2 data rows (rowCount = 3)');
    assert(readSheet!.getCell('A1').value === 'Task', 'Header cell A1 = "Task"');
    assert(
      readSheet!.getCell('A2').value === 'Fix login bug',
      'Row 1, cell A2 = "Fix login bug"'
    );
    assert(
      readSheet!.getCell('B2').value === 'Users cannot log in with SSO',
      'Row 1, cell B2 = description'
    );
    assert(readSheet!.getCell('C2').value === 'Alice', 'Row 1, cell C2 = "Alice"');
    assert(readSheet!.getCell('D2').value === 'high', 'Row 1, cell D2 = "high"');
    assert(
      readSheet!.getCell('E2').value === 'in_progress',
      'Row 1, cell E2 = "in_progress"'
    );
    assert(
      readSheet!.getCell('F2').value === '2026-07-01',
      'Row 1, cell F2 = "2026-07-01"'
    );
    assert(
      readSheet!.getCell('G2').value === 'bug, auth',
      'Row 1, cell G2 = "bug, auth"'
    );
    assert(
      readSheet!.getCell('E3').value === 'pending',
      'Row 2, cell E3 = "pending" (default status)'
    );
  }

  // ─── Test 2: empty rows ────────────────────────────────────────────────────

  {
    process.stdout.write('\nTest 2: Empty action items\n');

    const rows: Record<string, unknown>[] = [];

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Tasks');
    worksheet.columns = Object.keys(rows[0] ?? {}).map((key) => ({
      header: key,
      key,
      width: 20,
    }));
    worksheet.addRows(rows);

    const buffer = (await workbook.xlsx.writeBuffer()) as Buffer;

    assert(buffer.length > 0, 'Buffer is not empty (empty worksheet still valid)');
    assert(
      buffer[0] === 0x50 && buffer[1] === 0x4b,
      'Buffer starts with PK ZIP header'
    );

    const readWorkbook = new ExcelJS.Workbook();
    await readWorkbook.xlsx.load(buffer);
    const readSheet = readWorkbook.getWorksheet('Tasks');

    assert(readSheet !== undefined, 'Worksheet "Tasks" exists');
    assert(readSheet!.rowCount === 0, 'Worksheet has 0 rows (no data, no header)');
  }

  // ─── Summary ───────────────────────────────────────────────────────────────

  process.stdout.write('\n');
  process.stdout.write(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
  process.stdout.write(`  Passed: ${passed}   Failed: ${failed}\n`);
  process.stdout.write(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

run().catch((err) => {
  console.error('Test runner crashed:', err);
  process.exit(1);
});
