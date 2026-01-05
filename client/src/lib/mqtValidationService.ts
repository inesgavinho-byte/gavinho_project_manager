import type { MQTImportRow, ImportValidationError } from './mqtImportService';

export interface ValidationRule {
  id: number;
  name: string;
  ruleType: 'price_min' | 'price_max' | 'code_pattern' | 'quantity_min' | 'quantity_max' | 'duplicate_check';
  field: string;
  condition: string; // JSON string
  severity: 'error' | 'warning' | 'info';
  message?: string;
  enabled: boolean;
  category?: string;
}

interface PriceCondition {
  value: number;
}

interface CodePatternCondition {
  pattern: string;
}

interface QuantityCondition {
  value: number;
}

interface DuplicateCheckCondition {
  fields: string[]; // Fields to check for duplicates
  tolerance?: number; // Percentage tolerance for numeric fields
}

/**
 * Apply custom validation rules to imported MQT data
 */
export function applyValidationRules(
  data: MQTImportRow[],
  rules: ValidationRule[]
): ImportValidationError[] {
  const errors: ImportValidationError[] = [];
  const enabledRules = rules.filter(r => r.enabled);

  data.forEach((row, index) => {
    enabledRules.forEach(rule => {
      // Skip if rule has category filter and row doesn't match
      if (rule.category && row.category !== rule.category) {
        return;
      }

      const violation = validateRow(row, rule, index + 2); // +2 for header and 1-indexed
      if (violation) {
        errors.push(violation);
      }
    });
  });

  // Check for duplicates if any duplicate_check rules exist
  const duplicateRules = enabledRules.filter(r => r.ruleType === 'duplicate_check');
  duplicateRules.forEach(rule => {
    const duplicateErrors = checkDuplicates(data, rule);
    errors.push(...duplicateErrors);
  });

  return errors;
}

function validateRow(
  row: MQTImportRow,
  rule: ValidationRule,
  rowNumber: number
): ImportValidationError | null {
  try {
    const condition = JSON.parse(rule.condition);

    switch (rule.ruleType) {
      case 'price_min':
        return validatePriceMin(row, rule, condition as PriceCondition, rowNumber);
      
      case 'price_max':
        return validatePriceMax(row, rule, condition as PriceCondition, rowNumber);
      
      case 'code_pattern':
        return validateCodePattern(row, rule, condition as CodePatternCondition, rowNumber);
      
      case 'quantity_min':
        return validateQuantityMin(row, rule, condition as QuantityCondition, rowNumber);
      
      case 'quantity_max':
        return validateQuantityMax(row, rule, condition as QuantityCondition, rowNumber);
      
      default:
        return null;
    }
  } catch (error) {
    console.error('Error parsing rule condition:', error);
    return null;
  }
}

function validatePriceMin(
  row: MQTImportRow,
  rule: ValidationRule,
  condition: PriceCondition,
  rowNumber: number
): ImportValidationError | null {
  if (row.unitPrice === undefined || row.unitPrice === null) {
    return null; // Skip if no price
  }

  if (row.unitPrice < condition.value) {
    return {
      row: rowNumber,
      field: 'unitPrice',
      message: rule.message || `Preço unitário (${row.unitPrice}€) abaixo do mínimo permitido (${condition.value}€)`,
      severity: rule.severity === 'info' ? 'warning' : rule.severity,
    };
  }

  return null;
}

function validatePriceMax(
  row: MQTImportRow,
  rule: ValidationRule,
  condition: PriceCondition,
  rowNumber: number
): ImportValidationError | null {
  if (row.unitPrice === undefined || row.unitPrice === null) {
    return null; // Skip if no price
  }

  if (row.unitPrice > condition.value) {
    return {
      row: rowNumber,
      field: 'unitPrice',
      message: rule.message || `Preço unitário (${row.unitPrice}€) acima do máximo permitido (${condition.value}€)`,
      severity: rule.severity === 'info' ? 'warning' : rule.severity,
    };
  }

  return null;
}

function validateCodePattern(
  row: MQTImportRow,
  rule: ValidationRule,
  condition: CodePatternCondition,
  rowNumber: number
): ImportValidationError | null {
  try {
    const regex = new RegExp(condition.pattern);
    if (!regex.test(row.code)) {
      return {
        row: rowNumber,
        field: 'code',
        message: rule.message || `Código "${row.code}" não corresponde ao padrão esperado (${condition.pattern})`,
        severity: rule.severity === 'info' ? 'warning' : rule.severity,
      };
    }
  } catch (error) {
    console.error('Invalid regex pattern:', condition.pattern);
  }

  return null;
}

function validateQuantityMin(
  row: MQTImportRow,
  rule: ValidationRule,
  condition: QuantityCondition,
  rowNumber: number
): ImportValidationError | null {
  if (row.quantity < condition.value) {
    return {
      row: rowNumber,
      field: 'quantity',
      message: rule.message || `Quantidade (${row.quantity}) abaixo do mínimo permitido (${condition.value})`,
      severity: rule.severity === 'info' ? 'warning' : rule.severity,
    };
  }

  return null;
}

function validateQuantityMax(
  row: MQTImportRow,
  rule: ValidationRule,
  condition: QuantityCondition,
  rowNumber: number
): ImportValidationError | null {
  if (row.quantity > condition.value) {
    return {
      row: rowNumber,
      field: 'quantity',
      message: rule.message || `Quantidade (${row.quantity}) acima do máximo permitido (${condition.value})`,
      severity: rule.severity === 'info' ? 'warning' : rule.severity,
    };
  }

  return null;
}

function checkDuplicates(
  data: MQTImportRow[],
  rule: ValidationRule
): ImportValidationError[] {
  const errors: ImportValidationError[] = [];
  
  try {
    const condition = JSON.parse(rule.condition) as DuplicateCheckCondition;
    const seen = new Map<string, number[]>();

    data.forEach((row, index) => {
      // Create key from specified fields
      const key = condition.fields.map(field => {
        const value = (row as any)[field];
        return value !== undefined && value !== null ? String(value) : '';
      }).join('|');

      if (!seen.has(key)) {
        seen.set(key, [index + 2]); // +2 for header and 1-indexed
      } else {
        seen.get(key)!.push(index + 2);
      }
    });

    // Report duplicates
    seen.forEach((rows, key) => {
      if (rows.length > 1) {
        rows.forEach(rowNumber => {
          errors.push({
            row: rowNumber,
            field: condition.fields.join(', '),
            message: rule.message || `Item duplicado encontrado (linhas: ${rows.join(', ')})`,
            severity: rule.severity === 'info' ? 'warning' : rule.severity,
          });
        });
      }
    });
  } catch (error) {
    console.error('Error checking duplicates:', error);
  }

  return errors;
}

/**
 * Get default validation rules for a construction
 */
export function getDefaultValidationRules(): Partial<ValidationRule>[] {
  return [
    {
      name: 'Preço Mínimo Razoável',
      ruleType: 'price_min',
      field: 'unitPrice',
      condition: JSON.stringify({ value: 0.01 }),
      severity: 'warning',
      message: 'Preço unitário muito baixo - verificar se está correto',
      enabled: true,
    },
    {
      name: 'Preço Máximo Suspeito',
      ruleType: 'price_max',
      field: 'unitPrice',
      condition: JSON.stringify({ value: 10000 }),
      severity: 'warning',
      message: 'Preço unitário muito alto - verificar se está correto',
      enabled: true,
    },
    {
      name: 'Quantidade Mínima',
      ruleType: 'quantity_min',
      field: 'quantity',
      condition: JSON.stringify({ value: 0.01 }),
      severity: 'error',
      message: 'Quantidade deve ser maior que zero',
      enabled: true,
    },
    {
      name: 'Código Duplicado',
      ruleType: 'duplicate_check',
      field: 'code',
      condition: JSON.stringify({ fields: ['code'] }),
      severity: 'warning',
      message: 'Código duplicado encontrado',
      enabled: true,
    },
  ];
}
