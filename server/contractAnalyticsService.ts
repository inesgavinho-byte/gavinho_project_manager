/**
 * Contract Analytics Service
 * Provides analytics and statistics for contracts dashboard
 */

import { getDb } from "./db";
import { projects } from "../drizzle/schema";
import { isNull, and, gte, lte, sql } from "drizzle-orm";

export interface ContractStats {
  totalContracts: number;
  totalValue: number;
  averageValue: number;
  activeContracts: number;
  expiredContracts: number;
  expiringSoon: number; // Expiring in next 30 days
}

export interface ContractByType {
  type: string;
  count: number;
  totalValue: number;
  averageValue: number;
}

export interface ContractTimeline {
  month: string;
  year: number;
  count: number;
  totalValue: number;
}

export interface ContractLocation {
  location: string;
  count: number;
  totalValue: number;
  lat?: number;
  lng?: number;
}

/**
 * Get overall contract statistics
 */
export async function getContractStats(): Promise<ContractStats> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const today = new Date();
  const in30Days = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

  // Get all projects with contracts
  const allProjects = await db
    .select()
    .from(projects)
    .where(isNull(projects.deletedAt));

  const contractProjects = allProjects.filter(p => p.contractValue);

  const totalContracts = contractProjects.length;
  const totalValue = contractProjects.reduce((sum, p) => {
    return sum + (parseFloat(p.contractValue || "0"));
  }, 0);
  const averageValue = totalContracts > 0 ? totalValue / totalContracts : 0;

  const activeContracts = contractProjects.filter(p => {
    if (!p.contractDeadline) return false;
    return new Date(p.contractDeadline) >= today;
  }).length;

  const expiredContracts = contractProjects.filter(p => {
    if (!p.contractDeadline) return false;
    return new Date(p.contractDeadline) < today;
  }).length;

  const expiringSoon = contractProjects.filter(p => {
    if (!p.contractDeadline) return false;
    const deadline = new Date(p.contractDeadline);
    return deadline >= today && deadline <= in30Days;
  }).length;

  return {
    totalContracts,
    totalValue,
    averageValue,
    activeContracts,
    expiredContracts,
    expiringSoon,
  };
}

/**
 * Get contracts grouped by type
 */
export async function getContractsByType(): Promise<ContractByType[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const allProjects = await db
    .select()
    .from(projects)
    .where(isNull(projects.deletedAt));

  const contractProjects = allProjects.filter(p => p.contractValue && p.contractType);

  // Group by type
  const typeMap = new Map<string, { count: number; totalValue: number }>();

  for (const project of contractProjects) {
    const type = project.contractType || "Não especificado";
    const value = parseFloat(project.contractValue || "0");

    if (!typeMap.has(type)) {
      typeMap.set(type, { count: 0, totalValue: 0 });
    }

    const current = typeMap.get(type)!;
    current.count++;
    current.totalValue += value;
  }

  // Convert to array
  const result: ContractByType[] = [];
  for (const [type, data] of typeMap.entries()) {
    result.push({
      type,
      count: data.count,
      totalValue: data.totalValue,
      averageValue: data.totalValue / data.count,
    });
  }

  // Sort by total value descending
  result.sort((a, b) => b.totalValue - a.totalValue);

  return result;
}

/**
 * Get contract timeline (monthly aggregation)
 */
export async function getContractTimeline(): Promise<ContractTimeline[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const allProjects = await db
    .select()
    .from(projects)
    .where(isNull(projects.deletedAt));

  const contractProjects = allProjects.filter(
    p => p.contractValue && p.contractSignedDate
  );

  // Group by month/year
  const timelineMap = new Map<string, { count: number; totalValue: number; year: number }>();

  for (const project of contractProjects) {
    if (!project.contractSignedDate) continue;

    const date = new Date(project.contractSignedDate);
    const year = date.getFullYear();
    const month = date.toLocaleString('pt-PT', { month: 'long' });
    const key = `${year}-${month}`;
    const value = parseFloat(project.contractValue || "0");

    if (!timelineMap.has(key)) {
      timelineMap.set(key, { count: 0, totalValue: 0, year });
    }

    const current = timelineMap.get(key)!;
    current.count++;
    current.totalValue += value;
  }

  // Convert to array
  const result: ContractTimeline[] = [];
  for (const [key, data] of timelineMap.entries()) {
    const month = key.split('-')[1];
    result.push({
      month,
      year: data.year,
      count: data.count,
      totalValue: data.totalValue,
    });
  }

  // Sort by year and month
  result.sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    const months = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 
                    'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
    return months.indexOf(a.month.toLowerCase()) - months.indexOf(b.month.toLowerCase());
  });

  return result;
}

/**
 * Get contracts grouped by location
 */
export async function getContractsByLocation(): Promise<ContractLocation[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const allProjects = await db
    .select()
    .from(projects)
    .where(isNull(projects.deletedAt));

  const contractProjects = allProjects.filter(p => p.contractValue && p.location);

  // Group by location
  const locationMap = new Map<string, { count: number; totalValue: number }>();

  for (const project of contractProjects) {
    const location = project.location || "Não especificado";
    const value = parseFloat(project.contractValue || "0");

    if (!locationMap.has(location)) {
      locationMap.set(location, { count: 0, totalValue: 0 });
    }

    const current = locationMap.get(location)!;
    current.count++;
    current.totalValue += value;
  }

  // Convert to array
  const result: ContractLocation[] = [];
  for (const [location, data] of locationMap.entries()) {
    result.push({
      location,
      count: data.count,
      totalValue: data.totalValue,
    });
  }

  // Sort by count descending
  result.sort((a, b) => b.count - a.count);

  return result;
}

/**
 * Get filtered contracts based on criteria
 */
export async function getFilteredContracts(filters: {
  year?: number;
  status?: "active" | "expired" | "expiring_soon" | "all";
  type?: string;
}): Promise<any[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  let allProjects = await db
    .select()
    .from(projects)
    .where(isNull(projects.deletedAt));

  // Filter by contract existence
  allProjects = allProjects.filter(p => p.contractValue);

  // Filter by year
  if (filters.year) {
    allProjects = allProjects.filter(p => {
      if (!p.contractSignedDate) return false;
      return new Date(p.contractSignedDate).getFullYear() === filters.year;
    });
  }

  // Filter by status
  if (filters.status && filters.status !== "all") {
    const today = new Date();
    const in30Days = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

    allProjects = allProjects.filter(p => {
      if (!p.contractDeadline) return false;
      const deadline = new Date(p.contractDeadline);

      switch (filters.status) {
        case "active":
          return deadline >= today;
        case "expired":
          return deadline < today;
        case "expiring_soon":
          return deadline >= today && deadline <= in30Days;
        default:
          return true;
      }
    });
  }

  // Filter by type
  if (filters.type && filters.type !== "all") {
    allProjects = allProjects.filter(p => p.contractType === filters.type);
  }

  return allProjects;
}
