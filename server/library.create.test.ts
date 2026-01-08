import { describe, it, expect } from "vitest";
import { createMaterial } from "./libraryDb.js";

describe("Library - Create Material", () => {
  it("should create a material successfully", async () => {
    const materialData = {
      name: "Test Material Vitest",
      description: "Test description",
      category: "Madeira",
      supplier: "Test Supplier",
      price: "100.00",
      unit: "m²",
      createdById: 1,
    };

    const result = await createMaterial(materialData);
    
    console.log("Create material result:", result);
    
    expect(result).toBeDefined();
    expect(result.name).toBe(materialData.name);
    expect(result.category).toBe(materialData.category);
  });
});
