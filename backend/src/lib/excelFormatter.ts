import ExcelJS from 'exceljs';

// ─── Color Palette ──────────────────────────────────────────────────────────

const COLORS = {
  headerBg: 'FF1a1a2e',
  headerFg: 'FFFFFFFF',
  zebraRow: 'FFF8F9FA',
  white: 'FFFFFFFF',
  border: 'FFd1d5db',

  // Priority colors (background)
  priority: {
    urgent: 'FFFEE2E2',
    high: 'FFFED7AA',
    medium: 'FFFEF9C3',
    low: 'FFDCFCE7',
  },

  // Status colors (text)
  status: {
    completed: 'FF166534',
    in_progress: 'FF1D4ED8',
    pending: 'FF6B7280',
    cancelled: 'FF991B1B',
  },
} as const;

// ─── Types ──────────────────────────────────────────────────────────────────

interface ColumnConfig {
  header: string;
  key: string;
  width?: number;
  wrap?: boolean;
}

interface StyleOptions {
  sheetName?: string;
  columns: ColumnConfig[];
  data: Record<string, unknown>[];
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function estimateWidth(value: unknown): number {
  if (value == null) return 10;
  const str = String(value);
  // Account for long strings, cap at 50
  return Math.min(Math.max(str.length + 2, 10), 50);
}

function autoFitColumns(worksheet: ExcelJS.Worksheet, data: Record<string, unknown>[], columns: ColumnConfig[]): void {
  columns.forEach((col, idx) => {
    const colNum = idx + 1;
    const headerWidth = estimateWidth(col.header);

    const maxDataWidth = data.reduce((max, row) => {
      const val = row[col.key];
      return Math.max(max, estimateWidth(val));
    }, 0);

    const width = col.width ?? Math.max(headerWidth, maxDataWidth);
    worksheet.getColumn(colNum).width = width;
  });
}

function applyThinBorder(cell: ExcelJS.Cell): void {
  cell.border = {
    top: { style: 'thin', color: { argb: COLORS.border } },
    left: { style: 'thin', color: { argb: COLORS.border } },
    bottom: { style: 'thin', color: { argb: COLORS.border } },
    right: { style: 'thin', color: { argb: COLORS.border } },
  };
}

// ─── Main Function ──────────────────────────────────────────────────────────

export function createStyledWorkbook(options: StyleOptions): ExcelJS.Workbook {
  const { sheetName = 'Sheet1', columns, data } = options;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Meetiva.ai';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet(sheetName, {
    views: [{ state: 'frozen', ySplit: 1 }],
  });

  // Set columns
  worksheet.columns = columns.map((col) => ({
    header: col.header,
    key: col.key,
    width: col.width ?? 15,
  }));

  // Auto-fit based on content
  autoFitColumns(worksheet, data, columns);

  // ─── Header Row ──────────────────────────────────────────────────────────

  const headerRow = worksheet.getRow(1);
  headerRow.height = 28;

  headerRow.eachCell((cell) => {
    cell.font = { bold: true, size: 11, color: { argb: COLORS.headerFg }, name: 'Calibri' };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.headerBg } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    applyThinBorder(cell);
  });

  // ─── Data Rows ───────────────────────────────────────────────────────────

  data.forEach((rowData, rowIdx) => {
    const row = worksheet.addRow(rowData);
    row.height = 22;

    const isEven = rowIdx % 2 === 0;

    row.eachCell((cell, colNumber) => {
      const colConfig = columns[colNumber - 1];
      const value = cell.value;

      // Base: zebra stripe
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: isEven ? COLORS.zebraRow : COLORS.white },
      };

      cell.font = { size: 10, name: 'Calibri', color: { argb: 'FF1F2937' } };
      cell.alignment = {
        vertical: 'middle',
        wrapText: colConfig?.wrap ?? false,
      };

      applyThinBorder(cell);

      // Priority column coloring
      if (colConfig?.key === 'Priority' && typeof value === 'string') {
        const bg = COLORS.priority[value as keyof typeof COLORS.priority];
        if (bg) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
          cell.font = { size: 10, name: 'Calibri', bold: true, color: { argb: '1f2937' } };
        }
      }

      // Status column coloring
      if (colConfig?.key === 'Status' && typeof value === 'string') {
        const fg = COLORS.status[value as keyof typeof COLORS.status];
        if (fg) {
          cell.font = { size: 10, name: 'Calibri', bold: true, color: { argb: fg } };
        }
      }
    });
  });

  // ─── Auto-filter on header ───────────────────────────────────────────────

  if (data.length > 0) {
    worksheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: columns.length },
    };
  }

  return workbook;
}
