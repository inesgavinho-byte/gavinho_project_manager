import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { trpc } from "@/lib/trpc";
import { Textarea } from "@/components/ui/textarea";

interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  onSubmit?: () => void;
}

interface User {
  id: number;
  name: string | null;
  email: string | null;
  score: number;
}

export function MentionInput({
  value,
  onChange,
  placeholder,
  className,
  disabled,
  onSubmit,
}: MentionInputProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [cursorPosition, setCursorPosition] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Search users when typing @mention
  const { data: users = [] } = trpc.mentions.searchUsers.useQuery(
    { query: mentionQuery },
    { enabled: showSuggestions && mentionQuery.length > 0 }
  );

  // Handle text change
  const handleChange = (newValue: string) => {
    onChange(newValue);
    
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    const position = textarea.selectionStart;
    setCursorPosition(position);
    
    // Check if we're typing a mention
    const textBeforeCursor = newValue.substring(0, position);
    const mentionMatch = textBeforeCursor.match(/@([a-zA-Z0-9_-]*)$/);
    
    if (mentionMatch) {
      setMentionQuery(mentionMatch[1]);
      setShowSuggestions(true);
      setSelectedIndex(0);
    } else {
      setShowSuggestions(false);
      setMentionQuery("");
    }
  };

  // Insert mention
  const insertMention = (user: User) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    const textBeforeCursor = value.substring(0, cursorPosition);
    const textAfterCursor = value.substring(cursorPosition);
    
    // Find the @ symbol position
    const atIndex = textBeforeCursor.lastIndexOf("@");
    if (atIndex === -1) return;
    
    // Replace @query with @username
    const username = user.name || user.email || `user${user.id}`;
    const cleanUsername = username.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_-]/g, "");
    const newText = 
      textBeforeCursor.substring(0, atIndex) + 
      `@${cleanUsername} ` + 
      textAfterCursor;
    
    onChange(newText);
    setShowSuggestions(false);
    setMentionQuery("");
    
    // Set cursor position after the mention
    setTimeout(() => {
      const newPosition = atIndex + cleanUsername.length + 2; // +2 for @ and space
      textarea.setSelectionRange(newPosition, newPosition);
      textarea.focus();
    }, 0);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (!showSuggestions || users.length === 0) {
      // Allow Ctrl+Enter or Cmd+Enter to submit
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && onSubmit) {
        e.preventDefault();
        onSubmit();
      }
      return;
    }
    
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, users.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
        break;
      case "Enter":
      case "Tab":
        e.preventDefault();
        if (users[selectedIndex]) {
          insertMention(users[selectedIndex]);
        }
        break;
      case "Escape":
        e.preventDefault();
        setShowSuggestions(false);
        setMentionQuery("");
        break;
    }
  };

  // Scroll selected item into view
  useEffect(() => {
    if (suggestionsRef.current && showSuggestions) {
      const selectedElement = suggestionsRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: "nearest" });
      }
    }
  }, [selectedIndex, showSuggestions]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node) &&
        textareaRef.current &&
        !textareaRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative">
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={className}
        disabled={disabled}
        rows={3}
      />
      
      {showSuggestions && users.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full max-h-60 overflow-y-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg mt-1"
        >
          {users.map((user, index) => (
            <div
              key={user.id}
              onClick={() => insertMention(user)}
              className={`px-4 py-2 cursor-pointer transition-colors ${
                index === selectedIndex
                  ? "bg-blue-50 dark:bg-blue-900/20"
                  : "hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
            >
              <div className="font-medium text-sm">
                {user.name || user.email || `User ${user.id}`}
              </div>
              {user.name && user.email && (
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {user.email}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      
      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
        Digite @ para mencionar alguém. Use Ctrl+Enter para enviar.
      </div>
    </div>
  );
}

/**
 * Component to render text with highlighted mentions
 */
interface MentionTextProps {
  text: string;
  className?: string;
}

export function MentionText({ text, className }: MentionTextProps) {
  // Parse text and highlight mentions
  const parts = text.split(/(@[a-zA-Z0-9_-]+)/g);
  
  return (
    <span className={className}>
      {parts.map((part, index) => {
        if (part.startsWith("@")) {
          return (
            <span
              key={index}
              className="mention bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-1 rounded font-medium"
              data-username={part.substring(1)}
            >
              {part}
            </span>
          );
        }
        return <span key={index}>{part}</span>;
      })}
    </span>
  );
}
