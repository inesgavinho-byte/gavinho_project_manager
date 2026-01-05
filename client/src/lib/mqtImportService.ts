import * as XLSX from 'xlsx';

export interface MQTImportRow {
  code: string;
  category: string;
  type?: string;
  subtype?: string;
  zone?: string;
  description: string;
  unit: string;
  quantity: number;
  unitPrice?: number;
  totalPrice?: number;
  supplier?: string;
  notes?: string;
}

export interface ImportValidationError {
  row: number;
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ImportResult {
  data: MQTImportRow[];
  errors: ImportValidationError[];
  warnings: ImportValidationError[];
  summary: {
    total: number;
    valid: number;
    errors: number;
    warnings: number;
  };
}

/**
 * Parse Excel file and extract MQT data
 */
export async function parseExcelFile(file: File): Promise<ImportResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Get first sheet
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
        
        // Parse and validate
        const result = parseAndValidate(jsonData);
        resolve(result);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Parse and validate MQT data from Excel rows
 */
function parseAndValidate(rows: any[][]): ImportResult {
  const data: MQTImportRow[] = [];
  const errors: ImportValidationError[] = [];
  const warnings: ImportValidationError[] = [];

  // Skip header row (assuming first row is header)
  const headerRow = rows[0];
  const dataRows = rows.slice(1);

  // Detect column indices (flexible mapping)
  const columnMap = detectColumns(headerRow);

  dataRows.forEach((row, index) => {
    const rowNumber = index + 2; // +2 because we skipped header and arrays are 0-indexed

    // Skip empty rows
    if (!row || row.every(cell => !cell)) {
      return;
    }

    try {
      const item: MQTImportRow = {
        code: getCellValue(row, columnMap.code),
        category: getCellValue(row, columnMap.category),
        type: getCellValue(row, columnMap.type),
        subtype: getCellValue(row, columnMap.subtype),
        zone: getCellValue(row, columnMap.zone),
        description: getCellValue(row, columnMap.description),
        unit: getCellValue(row, columnMap.unit),
        quantity: parseFloat(getCellValue(row, columnMap.quantity)) || 0,
        unitPrice: parseFloat(getCellValue(row, columnMap.unitPrice)) || undefined,
        totalPrice: parseFloat(getCellValue(row, columnMap.totalPrice)) || undefined,
        supplier: getCellValue(row, columnMap.supplier),
        notes: getCellValue(row, columnMap.notes),
      };

      // Validate required fields
      if (!item.code) {
        errors.push({
          row: rowNumber,
          field: 'code',
          message: 'Código é obrigatório',
          severity: 'error',
        });
      }

      if (!item.category) {
        errors.push({
          row: rowNumber,
          field: 'category',
          message: 'Categoria é obrigatória',
          severity: 'error',
        });
      }

      if (!item.description) {
        errors.push({
          row: rowNumber,
          field: 'description',
          message: 'Descrição é obrigatória',
          severity: 'error',
        });
      }

      if (!item.unit) {
        errors.push({
          row: rowNumber,
          field: 'unit',
          message: 'Unidade é obrigatória',
          severity: 'error',
        });
      }

      if (!item.quantity || item.quantity <= 0) {
        errors.push({
          row: rowNumber,
          field: 'quantity',
          message: 'Quantidade deve ser maior que zero',
          severity: 'error',
        });
      }

      // Warnings for optional but recommended fields
      if (!item.unitPrice) {
        warnings.push({
          row: rowNumber,
          field: 'unitPrice',
          message: 'Preço unitário não definido',
          severity: 'warning',
        });
      }

      // Check for duplicate codes
      const duplicate = data.find(d => d.code === item.code);
      if (duplicate) {
        warnings.push({
          row: rowNumber,
          field: 'code',
          message: `Código duplicado: ${item.code}`,
          severity: 'warning',
        });
      }

      data.push(item);
    } catch (error) {
      errors.push({
        row: rowNumber,
        field: 'general',
        message: `Erro ao processar linha: ${error}`,
        severity: 'error',
      });
    }
  });

  return {
    data,
    errors,
    warnings,
    summary: {
      total: data.length,
      valid: data.length - errors.filter(e => e.severity === 'error').length,
      errors: errors.length,
      warnings: warnings.length,
    },
  };
}

/**
 * Detect column indices from header row
 */
function detectColumns(headerRow: any[]): Record<string, number> {
  const columnMap: Record<string, number> = {};

  headerRow.forEach((header, index) => {
    const normalized = String(header).toLowerCase().trim();

    // Map common column names (Portuguese and English)
    if (normalized.match(/c[óo]digo|code/)) columnMap.code = index;
    else if (normalized.match(/categoria|category/)) columnMap.category = index;
    else if (normalized.match(/tipo|type/)) columnMap.type = index;
    else if (normalized.match(/subtipo|subtype/)) columnMap.subtype = index;
    else if (normalized.match(/zona|zone/)) columnMap.zone = index;
    else if (normalized.match(/descri[çc][ãa]o|description/)) columnMap.description = index;
    else if (normalized.match(/unidade|unit|un\./)) columnMap.unit = index;
    else if (normalized.match(/quantidade|quantity|qtd/)) columnMap.quantity = index;
    else if (normalized.match(/pre[çc]o.*unit[áa]rio|unit.*price|p\.u\./)) columnMap.unitPrice = index;
    else if (normalized.match(/pre[çc]o.*total|total.*price|p\.t\./)) columnMap.totalPrice = index;
    else if (normalized.match(/fornecedor|supplier/)) columnMap.supplier = index;
    else if (normalized.match(/notas|notes|observa[çc][õo]es/)) columnMap.notes = index;
  });

  return columnMap;
}

/**
 * Get cell value safely
 */
function getCellValue(row: any[], index: number | undefined): string {
  if (index === undefined || index < 0 || index >= row.length) {
    return '';
  }
  const value = row[index];
  return value !== null && value !== undefined ? String(value).trim() : '';
}

/**
 * Export MQT data to Excel
 */
export function exportToExcel(data: MQTImportRow[], filename: string = 'mqt_export.xlsx') {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'MQT');
  XLSX.writeFile(workbook, filename);
}


/**
 * Parse Google Sheets URL and extract sheet ID
 */
export function parseGoogleSheetsUrl(url: string): { spreadsheetId: string; sheetId?: string } | null {
  // Format: https://docs.google.com/spreadsheets/d/{spreadsheetId}/edit#gid={sheetId}
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (!match) return null;

  const spreadsheetId = match[1];
  const gidMatch = url.match(/[#&]gid=([0-9]+)/);
  const sheetId = gidMatch ? gidMatch[1] : undefined;

  return { spreadsheetId, sheetId };
}

/**
 * Fetch Google Sheets data via public API (requires sheet to be published)
 * For private sheets, this would need OAuth authentication on the backend
 */
export async function fetchGoogleSheetsData(spreadsheetId: string, sheetId?: string): Promise<any[][]> {
  try {
    // Use Google Sheets API v4 (requires API key or OAuth)
    // For now, we'll use the simpler CSV export approach for public sheets
    const exportUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv${sheetId ? `&gid=${sheetId}` : ''}`;
    
    const response = await fetch(exportUrl);
    if (!response.ok) {
      throw new Error('Failed to fetch Google Sheets data. Make sure the sheet is published or publicly accessible.');
    }

    const csvText = await response.text();
    return parseCSV(csvText);
  } catch (error) {
    throw new Error(`Google Sheets import failed: ${error}`);
  }
}

/**
 * Parse CSV text into 2D array
 */
function parseCSV(csvText: string): any[][] {
  const lines = csvText.split('\n');
  const result: any[][] = [];

  lines.forEach(line => {
    if (!line.trim()) return;
    
    // Simple CSV parser (handles quoted values)
    const row: any[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        row.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    row.push(current.trim());
    result.push(row);
  });

  return result;
}

/**
 * Import from Google Sheets URL
 */
export async function importFromGoogleSheets(url: string): Promise<ImportResult> {
  const parsed = parseGoogleSheetsUrl(url);
  if (!parsed) {
    throw new Error('Invalid Google Sheets URL');
  }

  const data = await fetchGoogleSheetsData(parsed.spreadsheetId, parsed.sheetId);
  return parseAndValidate(data);
}
