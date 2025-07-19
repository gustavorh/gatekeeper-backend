import { injectable } from "inversify";
import { db } from "@/lib/db";
import { IRepository } from "@/types";
import { MySqlTable, MySqlColumn } from "drizzle-orm/mysql-core";
import { eq, sql } from "drizzle-orm";

@injectable()
export abstract class BaseRepository<T extends { id: number }>
  implements IRepository<T>
{
  constructor(
    protected table: MySqlTable<any>,
    protected idColumn: MySqlColumn<any, any>
  ) {}

  async findById(id: number): Promise<T | null> {
    try {
      const results = await db
        .select()
        .from(this.table)
        .where(eq(this.idColumn, id))
        .limit(1);

      return results.length > 0 ? (results[0] as T) : null;
    } catch (error) {
      console.error(`Error finding record by id ${id}:`, error);
      throw new Error(`Failed to find record by id`);
    }
  }

  async findAll(limit = 50, offset = 0): Promise<T[]> {
    try {
      const results = await db
        .select()
        .from(this.table)
        .limit(Math.min(limit, 100)) // Máximo 100 registros
        .offset(offset);

      return results as T[];
    } catch (error) {
      console.error(`Error finding all records:`, error);
      throw new Error(`Failed to find all records`);
    }
  }

  async create(entity: Omit<T, "id" | "createdAt" | "updatedAt">): Promise<T> {
    try {
      const result = await db.insert(this.table).values(entity as any);
      const insertId = Number(result[0].insertId);

      const created = await this.findById(insertId);
      if (!created) {
        throw new Error("Failed to retrieve created record");
      }

      return created;
    } catch (error) {
      console.error(`Error creating record:`, error);
      throw new Error(`Failed to create record`);
    }
  }

  async update(id: number, entity: Partial<T>): Promise<T | null> {
    try {
      // Verificar que el registro existe
      const existing = await this.findById(id);
      if (!existing) {
        return null;
      }

      await db
        .update(this.table)
        .set(entity as any)
        .where(eq(this.idColumn, id));

      // Retornar el registro actualizado
      return await this.findById(id);
    } catch (error) {
      console.error(`Error updating record with id ${id}:`, error);
      throw new Error(`Failed to update record`);
    }
  }

  async delete(id: number): Promise<boolean> {
    try {
      // Verificar que el registro existe
      const existing = await this.findById(id);
      if (!existing) {
        return false;
      }

      const result = await db.delete(this.table).where(eq(this.idColumn, id));

      return result[0].affectedRows > 0;
    } catch (error) {
      console.error(`Error deleting record with id ${id}:`, error);
      throw new Error(`Failed to delete record`);
    }
  }

  // Método auxiliar para contar registros
  protected async count(): Promise<number> {
    try {
      const result = await db
        .select({ count: sql<number>`count(*)` })
        .from(this.table);

      return result[0].count;
    } catch (error) {
      console.error(`Error counting records:`, error);
      throw new Error(`Failed to count records`);
    }
  }
}
