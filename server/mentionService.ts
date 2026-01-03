/**
 * Mention Service - Parse and handle @mentions in comments
 */

export interface MentionMatch {
  username: string;
  startIndex: number;
  endIndex: number;
}

/**
 * Extract all @mentions from text
 * Matches @username format (alphanumeric, underscore, hyphen)
 */
export function extractMentions(text: string): MentionMatch[] {
  const mentionRegex = /@([a-zA-Z0-9_-]+)/g;
  const mentions: MentionMatch[] = [];
  let match;

  while ((match = mentionRegex.exec(text)) !== null) {
    mentions.push({
      username: match[1],
      startIndex: match.index,
      endIndex: match.index + match[0].length,
    });
  }

  return mentions;
}

/**
 * Replace @mentions with HTML spans for highlighting
 */
export function highlightMentions(text: string): string {
  return text.replace(
    /@([a-zA-Z0-9_-]+)/g,
    '<span class="mention" data-username="$1">@$1</span>'
  );
}

/**
 * Get unique usernames from mention matches
 */
export function getUniqueMentionedUsernames(mentions: MentionMatch[]): string[] {
  const usernames = mentions.map(m => m.username);
  return Array.from(new Set(usernames));
}

/**
 * Check if text contains any mentions
 */
export function hasMentions(text: string): boolean {
  return /@([a-zA-Z0-9_-]+)/.test(text);
}

/**
 * Validate mention format
 */
export function isValidMention(mention: string): boolean {
  return /^@[a-zA-Z0-9_-]+$/.test(mention);
}

/**
 * Search users by name or email for autocomplete
 * Returns matches sorted by relevance
 */
export function searchUsersForMention(
  users: Array<{ id: number; name: string | null; email: string | null }>,
  query: string
): Array<{ id: number; name: string | null; email: string | null; score: number }> {
  const lowerQuery = query.toLowerCase();
  
  return users
    .map(user => {
      let score = 0;
      const name = user.name?.toLowerCase() || '';
      const email = user.email?.toLowerCase() || '';
      
      // Exact name match
      if (name === lowerQuery) score += 100;
      // Name starts with query
      else if (name.startsWith(lowerQuery)) score += 50;
      // Name contains query
      else if (name.includes(lowerQuery)) score += 25;
      
      // Email starts with query
      if (email.startsWith(lowerQuery)) score += 40;
      // Email contains query
      else if (email.includes(lowerQuery)) score += 20;
      
      return { ...user, score };
    })
    .filter(user => user.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10); // Return top 10 matches
}

/**
 * Format user for display in autocomplete
 */
export function formatUserForAutocomplete(user: {
  id: number;
  name: string | null;
  email: string | null;
}): string {
  if (user.name && user.email) {
    return `${user.name} (${user.email})`;
  }
  return user.name || user.email || `User ${user.id}`;
}

/**
 * Extract mention trigger position from text
 * Returns the position where @ was typed for autocomplete
 */
export function findMentionTrigger(text: string, cursorPosition: number): {
  found: boolean;
  startIndex: number;
  query: string;
} | null {
  // Look backwards from cursor for @
  let startIndex = -1;
  for (let i = cursorPosition - 1; i >= 0; i--) {
    const char = text[i];
    
    // Found @ - this is the start
    if (char === '@') {
      startIndex = i;
      break;
    }
    
    // Hit whitespace or special char before @ - no mention
    if (char === ' ' || char === '\n') {
      return null;
    }
  }
  
  if (startIndex === -1) {
    return null;
  }
  
  // Extract query between @ and cursor
  const query = text.substring(startIndex + 1, cursorPosition);
  
  // Validate query format (alphanumeric, underscore, hyphen only)
  if (!/^[a-zA-Z0-9_-]*$/.test(query)) {
    return null;
  }
  
  return {
    found: true,
    startIndex,
    query,
  };
}
