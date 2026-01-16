import { db } from "./db";
import { mqtImports, mqtLines, mqtAlerts } from "@/drizzle/schema";
import { eq, and } from "drizzle-orm";

export interface MQTRow {
  itemCode: string;
  itemDescription?: string;
  plannedQuantity: number;
  executedQuantity: number;
  unit?: string;
}

export interface MQTImportResult {
  importId: number;
  totalRows: number;
  processedRows: number;
  errors: string[];
}

/**
 * Parse Google Sheets data from CSV format
 * Expected format: itemCode, itemDescription, plannedQuantity, executedQuantity, unit
 */
export async function parseGoogleSheetsData(csvData: string): Promise<MQTRow[]> {
  const lines = csvData.trim().split("\n");
  const rows: MQTRow[] = [];
  
  // Skip header row
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const parts = line.split(",").map(p => p.trim().replace(/^"|"$/g, ""));
    
    if (parts.length < 4) {
      throw new Error(`Row ${i + 1}: Invalid format. Expected at least 4 columns`);
    }
    
    const itemCode = parts[0];
    const itemDescription = parts[1] || undefined;
    const plannedQuantity = parseFloat(parts[2]);
    const executedQuantity = parseFloat(parts[3]);
    const unit = parts[4] || undefined;
    
    if (!itemCode) {
      throw new Error(`Row ${i + 1}: Item code is required`);
    }
    
    if (isNaN(plannedQuantity) || isNaN(executedQuantity)) {
      throw new Error(`Row ${i + 1}: Quantities must be numbers`);
    }
    
    rows.push({
      itemCode,
      itemDescription,
      plannedQuantity,
      executedQuantity,
      unit,
    });
  }
  
  return rows;
}

/**
 * Parse Excel data (assuming JSON format from client)
 */
export async function parseExcelData(jsonData: MQTRow[]): Promise<MQTRow[]> {
  if (!Array.isArray(jsonData)) {
    throw new Error("Excel data must be an array of rows");
  }
  
  const rows: MQTRow[] = [];
  
  for (let i = 0; i < jsonData.length; i++) {
    const row = jsonData[i];
    
    if (!row.itemCode) {
      throw new Error(`Row ${i + 1}: Item code is required`);
    }
    
    const plannedQuantity = parseFloat(String(row.plannedQuantity));
    const executedQuantity = parseFloat(String(row.executedQuantity));
    
    if (isNaN(plannedQuantity) || isNaN(executedQuantity)) {
      throw new Error(`Row ${i + 1}: Quantities must be numbers`);
    }
    
    rows.push({
      itemCode: String(row.itemCode),
      itemDescription: row.itemDescription ? String(row.itemDescription) : undefined,
      plannedQuantity,
      executedQuantity,
      unit: row.unit ? String(row.unit) : undefined,
    });
  }
  
  return rows;
}

/**
 * Calculate variance and status for MQT line
 */
function calculateVariance(planned: number, executed: number) {
  const variance = executed - planned;
  const variancePercentage = planned !== 0 ? (variance / planned) * 100 : 0;
  
  let status: "on_track" | "warning" | "critical" = "on_track";
  if (Math.abs(variancePercentage) > 20) {
    status = "critical";
  } else if (Math.abs(variancePercentage) > 10) {
    status = "warning";
  }
  
  return { variance, variancePercentage, status };
}

/**
 * Import MQT data into database
 */
export async function importMQTData(
  projectId: number,
  userId: number,
  rows: MQTRow[],
  source: "google_sheets" | "excel",
  sourceUrl?: string,
  fileName?: string
): Promise<MQTImportResult> {
  try {
    // Create import record
    const [importRecord] = await db
      .insert(mqtImports)
      .values({
        projectId,
        importedBy: userId,
        source,
        sourceUrl,
        fileName,
        status: "processing",
        totalRows: rows.length,
      });
    
    const importId = importRecord.insertId as number;
    let processedRows = 0;
    const errors: string[] = [];
    
    // Process each row
    for (const row of rows) {
      try {
        const { variance, variancePercentage, status } = calculateVariance(
          row.plannedQuantity,
          row.executedQuantity
        );
        
        // Insert MQT line
        await db.insert(mqtLines).values({
          importId,
          projectId,
          itemCode: row.itemCode,
          itemDescription: row.itemDescription,
          plannedQuantity: row.plannedQuantity.toString(),
          executedQuantity: row.executedQuantity.toString(),
          unit: row.unit,
          variance: variance.toString(),
          variancePercentage: variancePercentage.toString(),
          status,
        });
        
        // Create alert if status is not on_track
        if (status !== "on_track") {
          const severity = status === "critical" ? "critical" : "high";
          const alertType = status === "critical" ? "variance_critical" : "variance_high";
          
          const [lineRecord] = await db
            .select()
            .from(mqtLines)
            .where(
              and(
                eq(mqtLines.importId, importId),
                eq(mqtLines.itemCode, row.itemCode)
              )
            );
          
          if (lineRecord) {
            await db.insert(mqtAlerts).values({
              mqtLineId: lineRecord.id,
              projectId,
              alertType,
              severity,
              message: `Item ${row.itemCode}: Variance of ${variancePercentage.toFixed(2)}% detected (Planned: ${row.plannedQuantity}, Executed: ${row.executedQuantity})`,
              isResolved: 0,
            });
          }
        }
        
        processedRows++;
      } catch (error) {
        errors.push(
          `Row ${row.itemCode}: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }
    
    // Update import status
    await db
      .update(mqtImports)
      .set({
        status: errors.length === 0 ? "completed" : "completed",
      })
      .where(eq(mqtImports.id, importId));
    
    return {
      importId,
      totalRows: rows.length,
      processedRows,
      errors,
    };
  } catch (error) {
    throw new Error(
      `Import failed: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Get MQT data for a project
 */
export async function getMQTData(projectId: number, importId?: number) {
  let query = db
    .select()
    .from(mqtLines)
    .where(eq(mqtLines.projectId, projectId));
  
  if (importId) {
    query = query.where(eq(mqtLines.importId, importId));
  }
  
  return query;
}

/**
 * Get MQT alerts for a project
 */
export async function getMQTAlerts(projectId: number, resolved?: boolean) {
  let query = db
    .select()
    .from(mqtAlerts)
    .where(eq(mqtAlerts.projectId, projectId));
  
  if (resolved !== undefined) {
    query = query.where(eq(mqtAlerts.isResolved, resolved ? 1 : 0));
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
      resolvedAt: new Date().toISOString(),
      resolvedBy: userId,
    })
    .where(eq(mqtAlerts.id, alertId));
}
