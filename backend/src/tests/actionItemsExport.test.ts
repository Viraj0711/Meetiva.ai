/**
 * Test for the styled ExcelJS workbook generation used in the
 * GET /meetings/:id/action-items/export endpoint.
 *
 * The export endpoint uses createStyledWorkbook which produces:
 *   1. A styled header row (dark bg, white text, frozen pane)
 *   2. Auto-fit column widths based on content
 *   3. Zebra striping on data rows
 *   4. Priority color coding (urgent=red, high=orange, medium=yellow, low=green)
 *   5. Status color coding (completed=green, in_progress=blue, pending=gray)
 *   6. Thin borders on all cells
 *   7. Auto-filter on header
 *
 * Run with: npx tsx src/tests/actionItemsExport.test.ts
 */

import ExcelJS from 'exceljs';
import { createStyledWorkbook } from '../lib/excelFormatter';

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

/**
 * ExcelJS types model Fill as a union (pattern vs gradient). fgColor only
 * exists on pattern fills, so narrow via `type === 'pattern'` before reading it.
 */
const patternFgColor = (
  fill: { type?: string; fgColor?: { argb?: string } } | undefined
): string | undefined =>
  fill && fill.type === 'pattern' ? fill.fgColor?.argb : undefined;

async function run(): Promise<void> {
  process.stdout.write('\n🧪 Action Items Export — Styled Workbook Test\n\n');

  // ─── Test 1: generates a valid styled workbook ────────────────────────────

  {
    process.stdout.write('Test 1: Full data export with styling\n');

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

    const columns = [
      { header: 'Task', key: 'Task', width: 30 },
      { header: 'Description', key: 'Description', width: 40, wrap: true },
      { header: 'Assignee', key: 'Assignee', width: 18 },
      { header: 'Priority', key: 'Priority', width: 12 },
      { header: 'Status', key: 'Status', width: 15 },
      { header: 'Due Date', key: 'DueDate', width: 14 },
      { header: 'Tags', key: 'Tags', width: 25 },
    ];

    const workbook = createStyledWorkbook({ sheetName: 'Tasks', columns, data: rows });
    const buf = await workbook.xlsx.writeBuffer();
    const raw = buf as unknown as Uint8Array;

    assert(raw.length > 0, 'Buffer is not empty');
    assert(
      raw[0] === 0x50 && raw[1] === 0x4b,
      'Buffer starts with PK ZIP header (valid .xlsx)'
    );

    // Read back and verify structure
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buf);
    const sheet = wb.getWorksheet('Tasks');

    assert(sheet !== undefined, 'Worksheet "Tasks" exists');
    assert(sheet!.rowCount === 3, 'Has header + 2 data rows (rowCount = 3)');

    // Verify header styling
    const headerRow = sheet!.getRow(1);
    const headerCell = headerRow.getCell(1);
    assert(headerCell.value === 'Task', 'Header cell A1 = "Task"');
    assert(
      headerCell.font?.bold === true,
      'Header font is bold'
    );
    assert(
      headerCell.font?.color?.argb === 'FFFFFFFF',
      'Header text is white'
    );
    assert(
      headerCell.fill?.type === 'pattern' && headerCell.fill?.pattern === 'solid',
      'Header has solid fill'
    );
    assert(
      headerRow.height === 28,
      'Header row height is 28'
    );

    // Verify data values
    assert(sheet!.getCell('A2').value === 'Fix login bug', 'Row 1 data correct');
    assert(sheet!.getCell('C2').value === 'Alice', 'Row 1 assignee correct');
    assert(sheet!.getCell('D2').value === 'high', 'Row 1 priority correct');
    assert(sheet!.getCell('E2').value === 'in_progress', 'Row 1 status correct');

    // Verify frozen pane (views is a union type — cast to the frozen variant)
    const view = sheet!.views[0] as
      | { state?: string; ySplit?: number; xSplit?: number }
      | undefined;
    assert(
      view?.state === 'frozen',
      'Sheet has frozen pane'
    );
    assert(
      view?.ySplit === 1,
      'Frozen pane splits at row 1'
    );

    // Verify auto-filter
    assert(
      sheet!.autoFilter !== undefined,
      'Auto-filter is set'
    );
  }

  // ─── Test 2: priority color coding ────────────────────────────────────────

  {
    process.stdout.write('\nTest 2: Priority color coding\n');

    const rows = [
      { Task: 'Urgent task', Priority: 'urgent', Status: 'pending', Description: '', Assignee: '', DueDate: '', Tags: '' },
      { Task: 'High task', Priority: 'high', Status: 'pending', Description: '', Assignee: '', DueDate: '', Tags: '' },
      { Task: 'Medium task', Priority: 'medium', Status: 'pending', Description: '', Assignee: '', DueDate: '', Tags: '' },
      { Task: 'Low task', Priority: 'low', Status: 'pending', Description: '', Assignee: '', DueDate: '', Tags: '' },
    ];

    const columns = [
      { header: 'Task', key: 'Task', width: 20 },
      { header: 'Description', key: 'Description', width: 20 },
      { header: 'Assignee', key: 'Assignee', width: 15 },
      { header: 'Priority', key: 'Priority', width: 12 },
      { header: 'Status', key: 'Status', width: 12 },
      { header: 'Due Date', key: 'DueDate', width: 14 },
      { header: 'Tags', key: 'Tags', width: 20 },
    ];

    const workbook = createStyledWorkbook({ sheetName: 'Priorities', columns, data: rows });
    const buf = await workbook.xlsx.writeBuffer();

    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buf);
    const sheet = wb.getWorksheet('Priorities');

    // Priority is column D (index 4)
    const urgentCell = sheet!.getRow(2).getCell(4);
    const highCell = sheet!.getRow(3).getCell(4);
    const mediumCell = sheet!.getRow(4).getCell(4);
    const lowCell = sheet!.getRow(5).getCell(4);

    assert(
      patternFgColor(urgentCell.fill) === 'FFFEE2E2',
      'Urgent priority has red background'
    );
    assert(
      patternFgColor(highCell.fill) === 'FFFEDD5',
      'High priority has orange background'
    );
    assert(
      patternFgColor(mediumCell.fill) === 'FFFEF9C3',
      'Medium priority has yellow background'
    );
    assert(
      patternFgColor(lowCell.fill) === 'FFDCFCE7',
      'Low priority has green background'
    );
  }

  // ─── Test 3: status color coding ──────────────────────────────────────────

  {
    process.stdout.write('\nTest 3: Status color coding\n');

    const rows = [
      { Task: 'Completed task', Priority: 'medium', Status: 'completed', Description: '', Assignee: '', DueDate: '', Tags: '' },
      { Task: 'In progress task', Priority: 'medium', Status: 'in_progress', Description: '', Assignee: '', DueDate: '', Tags: '' },
      { Task: 'Pending task', Priority: 'medium', Status: 'pending', Description: '', Assignee: '', DueDate: '', Tags: '' },
      { Task: 'Cancelled task', Priority: 'medium', Status: 'cancelled', Description: '', Assignee: '', DueDate: '', Tags: '' },
    ];

    const columns = [
      { header: 'Task', key: 'Task', width: 20 },
      { header: 'Description', key: 'Description', width: 20 },
      { header: 'Assignee', key: 'Assignee', width: 15 },
      { header: 'Priority', key: 'Priority', width: 12 },
      { header: 'Status', key: 'Status', width: 12 },
      { header: 'Due Date', key: 'DueDate', width: 14 },
      { header: 'Tags', key: 'Tags', width: 20 },
    ];

    const workbook = createStyledWorkbook({ sheetName: 'Statuses', columns, data: rows });
    const buf = await workbook.xlsx.writeBuffer();

    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buf);
    const sheet = wb.getWorksheet('Statuses');

    // Status is column E (index 5)
    const completedFont = sheet!.getRow(2).getCell(5).font;
    const inProgressFont = sheet!.getRow(3).getCell(5).font;
    const pendingFont = sheet!.getRow(4).getCell(5).font;
    const cancelledFont = sheet!.getRow(5).getCell(5).font;

    assert(
      completedFont?.color?.argb === 'FF166534',
      'Completed status has green text'
    );
    assert(
      inProgressFont?.color?.argb === 'FF1D4ED8',
      'In progress status has blue text'
    );
    assert(
      pendingFont?.color?.argb === 'FF6B7280',
      'Pending status has gray text'
    );
    assert(
      cancelledFont?.color?.argb === 'FF991B1B',
      'Cancelled status has red text'
    );
  }

  // ─── Test 4: zebra striping ───────────────────────────────────────────────

  {
    process.stdout.write('\nTest 4: Zebra striping\n');

    const rows = [
      { Task: 'Row 1', Priority: 'low', Status: 'pending', Description: '', Assignee: '', DueDate: '', Tags: '' },
      { Task: 'Row 2', Priority: 'low', Status: 'pending', Description: '', Assignee: '', DueDate: '', Tags: '' },
      { Task: 'Row 3', Priority: 'low', Status: 'pending', Description: '', Assignee: '', DueDate: '', Tags: '' },
    ];

    const columns = [
      { header: 'Task', key: 'Task', width: 20 },
      { header: 'Description', key: 'Description', width: 20 },
      { header: 'Assignee', key: 'Assignee', width: 15 },
      { header: 'Priority', key: 'Priority', width: 12 },
      { header: 'Status', key: 'Status', width: 12 },
      { header: 'Due Date', key: 'DueDate', width: 14 },
      { header: 'Tags', key: 'Tags', width: 20 },
    ];

    const workbook = createStyledWorkbook({ sheetName: 'Zebra', columns, data: rows });
    const buf = await workbook.xlsx.writeBuffer();

    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buf);
    const sheet = wb.getWorksheet('Zebra');

    // Data rows start at row 2
    const row2Fill = sheet!.getRow(2).getCell(1).fill;
    const row3Fill = sheet!.getRow(3).getCell(1).fill;
    const row4Fill = sheet!.getRow(4).getCell(1).fill;

    assert(
      patternFgColor(row2Fill) === 'FFF8F9FA',
      'Row 1 has zebra stripe (#f8f9fa)'
    );
    assert(
      patternFgColor(row3Fill) === 'FFFFFFFF',
      'Row 2 has white background'
    );
    assert(
      patternFgColor(row4Fill) === 'FFF8F9FA',
      'Row 3 has zebra stripe (#f8f9fa)'
    );
  }

  // ─── Test 5: empty rows ────────────────────────────────────────────────────

  {
    process.stdout.write('\nTest 5: Empty action items\n');

    const rows: Record<string, unknown>[] = [];
    const columns = [
      { header: 'Task', key: 'Task', width: 20 },
      { header: 'Description', key: 'Description', width: 20 },
      { header: 'Assignee', key: 'Assignee', width: 15 },
      { header: 'Priority', key: 'Priority', width: 12 },
      { header: 'Status', key: 'Status', width: 12 },
      { header: 'Due Date', key: 'DueDate', width: 14 },
      { header: 'Tags', key: 'Tags', width: 20 },
    ];

    const workbook = createStyledWorkbook({ sheetName: 'Tasks', columns, data: rows });
    const buf = await workbook.xlsx.writeBuffer();
    const raw = buf as unknown as Uint8Array;

    assert(raw.length > 0, 'Buffer is not empty (empty worksheet still valid)');
    assert(
      raw[0] === 0x50 && raw[1] === 0x4b,
      'Buffer starts with PK ZIP header'
    );

    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buf);
    const sheet = wb.getWorksheet('Tasks');

    assert(sheet !== undefined, 'Worksheet "Tasks" exists');
    assert(sheet!.rowCount <= 1, 'Worksheet has no data rows (rowCount <= 1)');
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
