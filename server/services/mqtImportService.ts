import { db } from '../db';
import { mqtImports, mqtLines, mqtAlerts } from '../../drizzle/schema';
import { google } from 'googleapis';
import * as XLSX from 'xlsx';
import axios from 'axios';

interface MQTRow {
  itemCode: string;
  itemDescription: string;
  plannedQuantity: number;
  executedQuantity: number;
  unit: string;
}

interface ImportResult {
  importId: number;
  totalRows: number;
  successRows: number;
  failedRows: number;
  alerts: Array<{
    itemCode: string;
    alertType: string;
    severity: string;
    message: string;
  }>;
}

const VARIANCE_THRESHOLD_WARNING = 10; // 10%
const VARIANCE_THRESHOLD_CRITICAL = 20; // 20%

/**
 * Parse Google Sheets data
 */
async function parseGoogleSheets(sheetUrl: string): Promise<MQTRow[]> {
  try {
    // Extract sheet ID from URL
    const sheetIdMatch = sheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (!sheetIdMatch) {
      throw new Error('Invalid Google Sheets URL');
    }

    const sheetId = sheetIdMatch[1];

    // Authenticate with Google Sheets API
    const credentials = {
      type: process.env.GOOGLE_SHEETS_API_TYPE,
      project_id: process.env.GOOGLE_SHEETS_API_PROJECT_ID,
      private_key_id: process.env.GOOGLE_SHEETS_API_PRIVATE_KEY_ID,
      private_key: process.env.GOOGLE_SHEETS_API_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      client_email: process.env.GOOGLE_SHEETS_API_CLIENT_EMAIL,
      client_id: process.env.GOOGLE_SHEETS_API_CLIENT_ID,
      auth_uri: process.env.GOOGLE_SHEETS_API_AUTH_URI,
      token_uri: process.env.GOOGLE_SHEETS_API_TOKEN_URI,
      auth_provider_x509_cert_url: process.env.GOOGLE_SHEETS_API_AUTH_PROVIDER_CERT_URL,
      client_x509_cert_url: process.env.GOOGLE_SHEETS_API_CLIENT_CERT_URL,
    };

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = google.sheets({ version: 'v4', authClient: auth });

    // Get sheet data
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: 'A1:F1000', // Adjust range as needed
    });

    const rows = response.data.values || [];
    if (rows.length < 2) {
      throw new Error('Sheet is empty or has no data');
    }

    // Parse header and data rows
    const headers = rows[0];
    const dataRows: MQTRow[] = [];

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0) continue;

      dataRows.push({
        itemCode: row[0]?.toString().trim() || '',
        itemDescription: row[1]?.toString().trim() || '',
        plannedQuantity: parseFloat(row[2]) || 0,
        executedQuantity: parseFloat(row[3]) || 0,
        unit: row[4]?.toString().trim() || '',
      });
    }

    return dataRows;
  } catch (error) {
    throw new Error(`Failed to parse Google Sheets: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Parse Excel file data
 */
async function parseExcelFile(fileBuffer: Buffer): Promise<MQTRow[]> {
  try {
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    const rows = XLSX.utils.sheet_to_json(sheet);

    const dataRows: MQTRow[] = rows.map((row: any) => ({
      itemCode: row.itemCode?.toString().trim() || row['Item Code']?.toString().trim() || '',
      itemDescription: row.itemDescription?.toString().trim() || row['Description']?.toString().trim() || '',
      plannedQuantity: parseFloat(row.plannedQuantity) || parseFloat(row['Planned Qty']) || 0,
      executedQuantity: parseFloat(row.executedQuantity) || parseFloat(row['Executed Qty']) || 0,
      unit: row.unit?.toString().trim() || row['Unit']?.toString().trim() || '',
    }));

    return dataRows;
  } catch (error) {
    throw new Error(`Failed to parse Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Calculate variance and generate alerts
 */
function calculateVariance(plannedQty: number, executedQty: number) {
  if (plannedQty === 0) {
    return { variance: 0, variancePercentage: 0, status: 'on_track' };
  }

  const variance = executedQty - plannedQty;
  const variancePercentage = (variance / plannedQty) * 100;

  let status = 'on_track';
  if (Math.abs(variancePercentage) >= VARIANCE_THRESHOLD_CRITICAL) {
    status = 'critical';
  } else if (Math.abs(variancePercentage) >= VARIANCE_THRESHOLD_WARNING) {
    status = 'warning';
  }

  return {
    variance,
    variancePercentage,
    status,
  };
}

/**
 * Generate alerts for variance
 */
function generateAlerts(
  itemCode: string,
  variancePercentage: number,
  status: string
): Array<{ alertType: string; severity: string; message: string }> {
  const alerts: Array<{ alertType: string; severity: string; message: string }> = [];

  if (status === 'critical') {
    alerts.push({
      alertType: 'variance_critical',
      severity: 'critical',
      message: `Critical variance detected: ${variancePercentage.toFixed(2)}% for item ${itemCode}`,
    });
  } else if (status === 'warning') {
    alerts.push({
      alertType: 'variance_high',
      severity: 'high',
      message: `High variance detected: ${variancePercentage.toFixed(2)}% for item ${itemCode}`,
    });
  }

  return alerts;
}

/**
 * Import MQT data from Google Sheets or Excel
 */
export async function importMQT(
  projectId: number,
  userId: number,
  source: 'google_sheets' | 'excel',
  sourceUrl?: string,
  fileBuffer?: Buffer,
  fileName?: string
): Promise<ImportResult> {
  try {
    // Create import record
    const importRecord = await db.insert(mqtImports).values({
      projectId,
      importedBy: userId,
      source,
      sourceUrl,
      fileName,
      status: 'processing',
      totalRows: 0,
    });

    const importId = importRecord[0].insertId as number;

    // Parse data based on source
    let rows: MQTRow[] = [];
    if (source === 'google_sheets' && sourceUrl) {
      rows = await parseGoogleSheets(sourceUrl);
    } else if (source === 'excel' && fileBuffer) {
      rows = await parseExcelFile(fileBuffer);
    } else {
      throw new Error('Invalid source or missing parameters');
    }

    // Insert MQT lines and generate alerts
    const alerts: Array<{
      itemCode: string;
      alertType: string;
      severity: string;
      message: string;
    }> = [];
    let successRows = 0;

    for (const row of rows) {
      try {
        const { variance, variancePercentage, status } = calculateVariance(
          row.plannedQuantity,
          row.executedQuantity
        );

        // Insert MQT line
        const lineResult = await db.insert(mqtLines).values({
          importId,
          projectId,
          itemCode: row.itemCode,
          itemDescription: row.itemDescription,
          plannedQuantity: row.plannedQuantity.toString(),
          executedQuantity: row.executedQuantity.toString(),
          unit: row.unit,
          variance: variance.toString(),
          variancePercentage: variancePercentage.toString(),
          status: status as 'on_track' | 'warning' | 'critical',
        });

        const lineId = lineResult[0].insertId as number;

        // Generate and insert alerts
        const lineAlerts = generateAlerts(row.itemCode, variancePercentage, status);
        for (const alert of lineAlerts) {
          await db.insert(mqtAlerts).values({
            mqtLineId: lineId,
            projectId,
            alertType: alert.alertType as 'variance_high' | 'variance_critical' | 'missing_data',
            severity: alert.severity as 'low' | 'medium' | 'high' | 'critical',
            message: alert.message,
            isResolved: 0,
          });

          alerts.push({
            itemCode: row.itemCode,
            ...alert,
          });
        }

        successRows++;
      } catch (error) {
        console.error(`Failed to insert row for item ${row.itemCode}:`, error);
      }
    }

    // Update import record with final status
    await db
      .update(mqtImports)
      .set({
        status: 'completed',
        totalRows: rows.length,
      })
      .where(({ id }) => id.eq(importId));

    return {
      importId,
      totalRows: rows.length,
      successRows,
      failedRows: rows.length - successRows,
      alerts,
    };
  } catch (error) {
    throw new Error(`MQT import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get MQT data for a project
 */
export async function getMQTData(projectId: number, importId?: number) {
  const query = db.select().from(mqtLines).where(({ projectId: pId }) => pId.eq(projectId));

  if (importId) {
    return query.where(({ importId: iId }) => iId.eq(importId));
  }

  return query;
}

/**
 * Get MQT alerts for a project
 */
export async function getMQTAlerts(projectId: number, isResolved?: boolean) {
  const query = db.select().from(mqtAlerts).where(({ projectId: pId }) => pId.eq(projectId));

  if (isResolved !== undefined) {
    return query.where(({ isResolved: resolved }) => resolved.eq(isResolved ? 1 : 0));
  }

  return query;
}

/**
 * Resolve MQT alert
 */
export async function resolveMQTAlert(alertId: number, userId: number) {
  return db
    .update(mqtAlerts)
    .set({
      isResolved: 1,
      resolvedBy: userId,
      resolvedAt: new Date().toISOString(),
    })
    .where(({ id }) => id.eq(alertId));
}
