import { db } from "./db";
import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";

export interface BiaConfigSettings {
  tone: "friendly" | "professional" | "casual";
  reportFrequency: "daily" | "weekly" | "never";
  blockageThreshold: "low" | "medium" | "high";
  operatingHoursStart: string;
  operatingHoursEnd: string;
  autoApprovalLevel: "none" | "low" | "medium" | "high";
  notificationEmail: boolean;
  notificationInApp: boolean;
  notificationSlack: boolean;
  responseDelay: "immediate" | "batched" | "scheduled";
}

export const DEFAULT_BIA_CONFIG: BiaConfigSettings = {
  tone: "friendly",
  reportFrequency: "daily",
  blockageThreshold: "high",
  operatingHoursStart: "08:00",
  operatingHoursEnd: "18:00",
  autoApprovalLevel: "none",
  notificationEmail: true,
  notificationInApp: true,
  notificationSlack: false,
  responseDelay: "immediate",
};

export async function getBiaConfig(userId: number): Promise<BiaConfigSettings> {
  // For now, return default config
  // In future, this will query the database
  return DEFAULT_BIA_CONFIG;
}

export async function updateBiaConfig(
  userId: number,
  config: Partial<BiaConfigSettings>
): Promise<BiaConfigSettings> {
  // For now, just return updated config
  // In future, this will save to database
  return { ...DEFAULT_BIA_CONFIG, ...config };
}

export async function resetBiaConfig(userId: number): Promise<BiaConfigSettings> {
  // For now, just return default config
  // In future, this will reset in database
  return DEFAULT_BIA_CONFIG;
}
