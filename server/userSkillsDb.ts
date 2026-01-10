import { getDb } from "./db";
import { sql } from "drizzle-orm";

export interface UserSkill {
  id: number;
  userId: number;
  skillName: string;
  proficiencyLevel: "beginner" | "intermediate" | "advanced" | "expert";
  yearsOfExperience: number;
  description: string | null;
  endorsements: number;
  isEndorsed: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSkillInput {
  skillName: string;
  proficiencyLevel: "beginner" | "intermediate" | "advanced" | "expert";
  yearsOfExperience?: number;
  description?: string;
}

export interface UpdateSkillInput {
  proficiencyLevel?: "beginner" | "intermediate" | "advanced" | "expert";
  yearsOfExperience?: number;
  description?: string;
}

/**
 * Get all skills for a user
 */
export async function getUserSkills(userId: number): Promise<UserSkill[]> {
  const db = await getDb();
  if (!db) return [];

  const result = await db.execute(
    sql`SELECT * FROM userSkills WHERE userId = ? ORDER BY endorsements DESC, skillName ASC`,
    [userId]
  );

  return (result[0] as UserSkill[]) || [];
}

/**
 * Get a specific skill by ID
 */
export async function getSkillById(skillId: number, userId: number): Promise<UserSkill | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db.execute(
    sql`SELECT * FROM userSkills WHERE id = ? AND userId = ?`,
    [skillId, userId]
  );

  const skills = result[0] as UserSkill[];
  return skills.length > 0 ? skills[0] : null;
}

/**
 * Create a new skill for a user
 */
export async function createSkill(
  userId: number,
  input: CreateSkillInput
): Promise<UserSkill | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db.execute(
      sql`INSERT INTO userSkills (userId, skillName, proficiencyLevel, yearsOfExperience, description)
          VALUES (?, ?, ?, ?, ?)`,
      [
        userId,
        input.skillName,
        input.proficiencyLevel,
        input.yearsOfExperience || 0,
        input.description || null,
      ]
    );

    const insertId = (result[0] as any)?.insertId;
    if (insertId) {
      return getSkillById(insertId, userId);
    }
    return null;
  } catch (error) {
    console.error("Error creating skill:", error);
    return null;
  }
}

/**
 * Update an existing skill
 */
export async function updateSkill(
  skillId: number,
  userId: number,
  input: UpdateSkillInput
): Promise<UserSkill | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const updates: string[] = [];
    const values: any[] = [];

    if (input.proficiencyLevel !== undefined) {
      updates.push("proficiencyLevel = ?");
      values.push(input.proficiencyLevel);
    }

    if (input.yearsOfExperience !== undefined) {
      updates.push("yearsOfExperience = ?");
      values.push(input.yearsOfExperience);
    }

    if (input.description !== undefined) {
      updates.push("description = ?");
      values.push(input.description);
    }

    if (updates.length === 0) {
      return getSkillById(skillId, userId);
    }

    updates.push("updatedAt = CURRENT_TIMESTAMP");
    values.push(skillId, userId);

    const query = `UPDATE userSkills SET ${updates.join(", ")} WHERE id = ? AND userId = ?`;
    await db.execute(sql.raw(query), values);

    return getSkillById(skillId, userId);
  } catch (error) {
    console.error("Error updating skill:", error);
    return null;
  }
}

/**
 * Delete a skill
 */
export async function deleteSkill(skillId: number, userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    const result = await db.execute(
      sql`DELETE FROM userSkills WHERE id = ? AND userId = ?`,
      [skillId, userId]
    );

    return (result[0] as any)?.affectedRows > 0;
  } catch (error) {
    console.error("Error deleting skill:", error);
    return false;
  }
}

/**
 * Add endorsement to a skill
 */
export async function endorseSkill(skillId: number, userId: number): Promise<UserSkill | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    await db.execute(
      sql`UPDATE userSkills SET endorsements = endorsements + 1 WHERE id = ? AND userId = ?`,
      [skillId, userId]
    );

    return getSkillById(skillId, userId);
  } catch (error) {
    console.error("Error endorsing skill:", error);
    return null;
  }
}

/**
 * Get top skills for a user (ordered by endorsements)
 */
export async function getTopUserSkills(userId: number, limit: number = 5): Promise<UserSkill[]> {
  const db = await getDb();
  if (!db) return [];

  const result = await db.execute(
    sql`SELECT * FROM userSkills WHERE userId = ? ORDER BY endorsements DESC, skillName ASC LIMIT ?`,
    [userId, limit]
  );

  return (result[0] as UserSkill[]) || [];
}

/**
 * Search skills by name
 */
export async function searchSkills(userId: number, query: string): Promise<UserSkill[]> {
  const db = await getDb();
  if (!db) return [];

  const result = await db.execute(
    sql`SELECT * FROM userSkills WHERE userId = ? AND skillName LIKE ? ORDER BY endorsements DESC, skillName ASC`,
    [userId, `%${query}%`]
  );

  return (result[0] as UserSkill[]) || [];
}

/**
 * Get skills by proficiency level
 */
export async function getSkillsByLevel(
  userId: number,
  level: "beginner" | "intermediate" | "advanced" | "expert"
): Promise<UserSkill[]> {
  const db = await getDb();
  if (!db) return [];

  const result = await db.execute(
    sql`SELECT * FROM userSkills WHERE userId = ? AND proficiencyLevel = ? ORDER BY endorsements DESC, skillName ASC`,
    [userId, level]
  );

  return (result[0] as UserSkill[]) || [];
}

/**
 * Get total endorsements for a user
 */
export async function getTotalEndorsements(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const result = await db.execute(
    sql`SELECT COALESCE(SUM(endorsements), 0) as total FROM userSkills WHERE userId = ?`,
    [userId]
  );

  const rows = result[0] as any[];
  return rows.length > 0 ? rows[0].total : 0;
}

/**
 * Get skill statistics for a user
 */
export async function getSkillStats(userId: number): Promise<{
  totalSkills: number;
  expertCount: number;
  advancedCount: number;
  intermediateCount: number;
  beginnerCount: number;
  totalEndorsements: number;
  averageYearsExperience: number;
}> {
  const db = await getDb();
  if (!db) {
    return {
      totalSkills: 0,
      expertCount: 0,
      advancedCount: 0,
      intermediateCount: 0,
      beginnerCount: 0,
      totalEndorsements: 0,
      averageYearsExperience: 0,
    };
  }

  const result = await db.execute(
    sql`SELECT 
        COUNT(*) as totalSkills,
        SUM(CASE WHEN proficiencyLevel = 'expert' THEN 1 ELSE 0 END) as expertCount,
        SUM(CASE WHEN proficiencyLevel = 'advanced' THEN 1 ELSE 0 END) as advancedCount,
        SUM(CASE WHEN proficiencyLevel = 'intermediate' THEN 1 ELSE 0 END) as intermediateCount,
        SUM(CASE WHEN proficiencyLevel = 'beginner' THEN 1 ELSE 0 END) as beginnerCount,
        COALESCE(SUM(endorsements), 0) as totalEndorsements,
        COALESCE(AVG(yearsOfExperience), 0) as averageYearsExperience
      FROM userSkills WHERE userId = ?`,
    [userId]
  );

  const rows = result[0] as any[];
  if (rows.length === 0) {
    return {
      totalSkills: 0,
      expertCount: 0,
      advancedCount: 0,
      intermediateCount: 0,
      beginnerCount: 0,
      totalEndorsements: 0,
      averageYearsExperience: 0,
    };
  }

  return {
    totalSkills: rows[0].totalSkills || 0,
    expertCount: rows[0].expertCount || 0,
    advancedCount: rows[0].advancedCount || 0,
    intermediateCount: rows[0].intermediateCount || 0,
    beginnerCount: rows[0].beginnerCount || 0,
    totalEndorsements: rows[0].totalEndorsements || 0,
    averageYearsExperience: rows[0].averageYearsExperience || 0,
  };
}
