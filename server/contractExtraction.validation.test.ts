/**
 * Tests for PDF validation functionality
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { writeFileSync, unlinkSync, mkdirSync, existsSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { validatePDF } from "./contractExtractionService";

describe("PDF Validation", () => {
  const testDir = join(tmpdir(), "pdf-validation-tests");
  
  beforeAll(() => {
    // Create test directory
    if (!existsSync(testDir)) {
      mkdirSync(testDir, { recursive: true });
    }
  });
  
  afterAll(() => {
    // Clean up test files
    try {
      const files = [
        "valid.pdf",
        "invalid-format.txt",
        "corrupted.pdf",
        "empty.pdf",
        "large.pdf"
      ];
      files.forEach(file => {
        try {
          unlinkSync(join(testDir, file));
        } catch (e) {
          // Ignore errors
        }
      });
    } catch (e) {
      // Ignore cleanup errors
    }
  });
  
  it("should validate a valid PDF file", () => {
    const validPdfPath = join(testDir, "valid.pdf");
    
    // Create a minimal valid PDF
    const pdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj
2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj
3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
>>
endobj
xref
0 4
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
trailer
<<
/Size 4
/Root 1 0 R
>>
startxref
190
%%EOF`;
    
    writeFileSync(validPdfPath, pdfContent);
    
    const result = validatePDF(validPdfPath);
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });
  
  it("should reject non-PDF files (invalid magic bytes)", () => {
    const txtFilePath = join(testDir, "invalid-format.txt");
    writeFileSync(txtFilePath, "This is a text file, not a PDF");
    
    const result = validatePDF(txtFilePath);
    expect(result.valid).toBe(false);
    expect(result.errorCode).toBe("INVALID_FORMAT");
    expect(result.error).toContain("Formato de arquivo inválido");
  });
  
  it("should reject corrupted PDF (missing %%EOF)", () => {
    const corruptedPdfPath = join(testDir, "corrupted.pdf");
    
    // PDF with valid header but missing EOF marker
    const corruptedContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
>>
endobj`;
    
    writeFileSync(corruptedPdfPath, corruptedContent);
    
    const result = validatePDF(corruptedPdfPath);
    expect(result.valid).toBe(false);
    expect(result.errorCode).toBe("CORRUPTED_PDF");
    expect(result.error).toContain("corrompido ou incompleto");
  });
  
  it("should reject empty files", () => {
    const emptyFilePath = join(testDir, "empty.pdf");
    writeFileSync(emptyFilePath, "");
    
    const result = validatePDF(emptyFilePath);
    expect(result.valid).toBe(false);
    expect(result.errorCode).toBe("EMPTY_FILE");
    expect(result.error).toContain("Arquivo vazio");
  });
  
  it("should reject files larger than 50MB", () => {
    const largePdfPath = join(testDir, "large.pdf");
    
    // Create a file larger than 50MB (51MB)
    const size51MB = 51 * 1024 * 1024;
    const largeContent = Buffer.alloc(size51MB);
    
    // Add valid PDF header and footer
    const header = Buffer.from("%PDF-1.4\n");
    const footer = Buffer.from("\n%%EOF");
    
    header.copy(largeContent, 0);
    footer.copy(largeContent, size51MB - footer.length);
    
    writeFileSync(largePdfPath, largeContent);
    
    const result = validatePDF(largePdfPath);
    expect(result.valid).toBe(false);
    expect(result.errorCode).toBe("FILE_TOO_LARGE");
    expect(result.error).toContain("muito grande");
    expect(result.error).toContain("51.0MB");
  });
  
  it("should handle non-existent files gracefully", () => {
    const nonExistentPath = join(testDir, "does-not-exist.pdf");
    
    const result = validatePDF(nonExistentPath);
    expect(result.valid).toBe(false);
    expect(result.errorCode).toBe("CORRUPTED_PDF");
    expect(result.error).toContain("Erro ao validar arquivo");
  });
});
