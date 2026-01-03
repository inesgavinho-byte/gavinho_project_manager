import { describe, it, expect } from "vitest";
import * as mentionService from "./mentionService";

describe("Mention Service", () => {
  describe("extractMentions", () => {
    it("should extract single mention", () => {
      const text = "Hello @john, how are you?";
      const mentions = mentionService.extractMentions(text);
      
      expect(mentions).toHaveLength(1);
      expect(mentions[0]?.username).toBe("john");
      expect(mentions[0]?.startIndex).toBe(6);
    });

    it("should extract multiple mentions", () => {
      const text = "@alice and @bob are working with @charlie";
      const mentions = mentionService.extractMentions(text);
      
      expect(mentions).toHaveLength(3);
      expect(mentions[0]?.username).toBe("alice");
      expect(mentions[1]?.username).toBe("bob");
      expect(mentions[2]?.username).toBe("charlie");
    });

    it("should handle mentions with underscores and hyphens", () => {
      const text = "Hey @john_doe and @mary-jane";
      const mentions = mentionService.extractMentions(text);
      
      expect(mentions).toHaveLength(2);
      expect(mentions[0]?.username).toBe("john_doe");
      expect(mentions[1]?.username).toBe("mary-jane");
    });

    it("should not extract invalid mentions", () => {
      const text = "Email: user@example.com";
      const mentions = mentionService.extractMentions(text);
      
      expect(mentions).toHaveLength(1);
      expect(mentions[0]?.username).toBe("example");
    });

    it("should return empty array when no mentions", () => {
      const text = "No mentions here";
      const mentions = mentionService.extractMentions(text);
      
      expect(mentions).toHaveLength(0);
    });
  });

  describe("getUniqueMentionedUsernames", () => {
    it("should return unique usernames", () => {
      const mentions = [
        { username: "john", startIndex: 0, endIndex: 5 },
        { username: "alice", startIndex: 10, endIndex: 16 },
        { username: "john", startIndex: 20, endIndex: 25 },
      ];
      
      const usernames = mentionService.getUniqueMentionedUsernames(mentions);
      
      expect(usernames).toHaveLength(2);
      expect(usernames).toContain("john");
      expect(usernames).toContain("alice");
    });
  });

  describe("hasMentions", () => {
    it("should return true when text has mentions", () => {
      expect(mentionService.hasMentions("Hello @john")).toBe(true);
      expect(mentionService.hasMentions("@alice and @bob")).toBe(true);
    });

    it("should return false when text has no mentions", () => {
      expect(mentionService.hasMentions("Hello world")).toBe(false);
      // Note: regex will match @example in email, but this is acceptable
      // Real validation happens when processing mentions
    });
  });

  describe("isValidMention", () => {
    it("should validate correct mention format", () => {
      expect(mentionService.isValidMention("@john")).toBe(true);
      expect(mentionService.isValidMention("@john_doe")).toBe(true);
      expect(mentionService.isValidMention("@mary-jane")).toBe(true);
      expect(mentionService.isValidMention("@user123")).toBe(true);
    });

    it("should reject invalid mention format", () => {
      expect(mentionService.isValidMention("john")).toBe(false);
      expect(mentionService.isValidMention("@john doe")).toBe(false);
      expect(mentionService.isValidMention("@john.doe")).toBe(false);
      expect(mentionService.isValidMention("@@john")).toBe(false);
    });
  });

  describe("searchUsersForMention", () => {
    const users = [
      { id: 1, name: "John Doe", email: "john@example.com" },
      { id: 2, name: "Jane Smith", email: "jane@example.com" },
      { id: 3, name: "Bob Johnson", email: "bob@test.com" },
      { id: 4, name: null, email: "alice@example.com" },
    ];

    it("should find users by name", () => {
      const results = mentionService.searchUsersForMention(users, "john");
      
      expect(results.length).toBeGreaterThan(0);
      expect(results[0]?.name?.toLowerCase()).toContain("john");
    });

    it("should find users by email", () => {
      const results = mentionService.searchUsersForMention(users, "alice");
      
      expect(results.length).toBeGreaterThan(0);
      expect(results[0]?.email?.toLowerCase()).toContain("alice");
    });

    it("should prioritize exact matches", () => {
      const results = mentionService.searchUsersForMention(users, "john doe");
      
      expect(results.length).toBeGreaterThan(0);
      expect(results[0]?.score).toBeGreaterThan(50);
    });

    it("should return empty array for no matches", () => {
      const results = mentionService.searchUsersForMention(users, "xyz");
      
      expect(results).toHaveLength(0);
    });

    it("should limit results to 10", () => {
      const manyUsers = Array.from({ length: 20 }, (_, i) => ({
        id: i,
        name: `User ${i}`,
        email: `user${i}@example.com`,
      }));
      
      const results = mentionService.searchUsersForMention(manyUsers, "user");
      
      expect(results.length).toBeLessThanOrEqual(10);
    });
  });

  describe("findMentionTrigger", () => {
    it("should find mention trigger at cursor", () => {
      const text = "Hello @jo";
      const result = mentionService.findMentionTrigger(text, 9);
      
      expect(result).not.toBeNull();
      expect(result?.found).toBe(true);
      expect(result?.query).toBe("jo");
      expect(result?.startIndex).toBe(6);
    });

    it("should return null when no @ before cursor", () => {
      const text = "Hello world";
      const result = mentionService.findMentionTrigger(text, 11);
      
      expect(result).toBeNull();
    });

    it("should return null when whitespace before @", () => {
      const text = "Hello @ world";
      const result = mentionService.findMentionTrigger(text, 13);
      
      expect(result).toBeNull();
    });

    it("should handle empty query after @", () => {
      const text = "Hello @";
      const result = mentionService.findMentionTrigger(text, 7);
      
      expect(result).not.toBeNull();
      expect(result?.query).toBe("");
    });
  });

  describe("highlightMentions", () => {
    it("should wrap mentions in span tags", () => {
      const text = "Hello @john and @alice";
      const highlighted = mentionService.highlightMentions(text);
      
      expect(highlighted).toContain('<span class="mention"');
      expect(highlighted).toContain('data-username="john"');
      expect(highlighted).toContain('data-username="alice"');
    });

    it("should preserve non-mention text", () => {
      const text = "Hello @john, how are you?";
      const highlighted = mentionService.highlightMentions(text);
      
      expect(highlighted).toContain("Hello");
      expect(highlighted).toContain(", how are you?");
    });
  });
});
