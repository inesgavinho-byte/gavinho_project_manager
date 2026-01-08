import { describe, it, expect } from "vitest";
import { createTag, getAllTags, deleteTag } from "./libraryDb";

describe("Library Module - Basic Validation", () => {
  describe("Tags", () => {
    it("should create and list tags", async () => {
      // Create a tag
      await createTag({
        name: "Test-" + Date.now(),
        category: "general",
        color: "#00AA00",
      });

      // List all tags
      const tags = await getAllTags();
      expect(tags).toBeDefined();
      expect(Array.isArray(tags)).toBe(true);
      expect(tags.length).toBeGreaterThan(0);
    });

    it("should delete a tag", async () => {
      // Create a tag
      const tagName = "DeleteTest-" + Date.now();
      await createTag({
        name: tagName,
        category: "material",
        color: "#FF0000",
      });

      // Find the created tag
      const tags = await getAllTags();
      const createdTag = tags.find((t) => t.name === tagName);
      expect(createdTag).toBeDefined();

      // Delete the tag
      if (createdTag?.id) {
        await deleteTag(createdTag.id);

        // Verify deletion
        const tagsAfterDelete = await getAllTags();
        const stillExists = tagsAfterDelete.some((t) => t.id === createdTag.id);
        expect(stillExists).toBe(false);
      }
    });
  });
});
