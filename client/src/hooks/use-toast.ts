import { useState } from "react";

interface Toast {
  title: string;
  description?: string;
  variant?: "default" | "destructive";
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = ({ title, description, variant = "default" }: Toast) => {
    // Simple console log for now - can be enhanced with a toast UI component later
    console.log(`[Toast ${variant}] ${title}${description ? `: ${description}` : ""}`);
    
    // You can add actual toast UI implementation here
    // For now, we'll just use browser alert for important messages
    if (variant === "destructive") {
      alert(`${title}\n${description || ""}`);
    }
  };

  return { toast, toasts };
}
