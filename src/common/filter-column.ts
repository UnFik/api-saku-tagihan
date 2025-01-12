import {
  eq,
  ilike,
  gt,
  lt,
  gte,
  lte,
  type Column,
} from "drizzle-orm";

type FilterOperator = 
  | "eq"      // Sama dengan
  | "gt"      // Lebih besar dari
  | "lt"      // Lebih kecil dari
  | "gte"     // Lebih besar atau sama dengan
  | "lte"     // Lebih kecil atau sama dengan
  | "ilike";  // Case insensitive LIKE (hanya untuk string)

export function filterColumn({
  column,
  value,
  operator = "eq"
}: {
  column: Column<any, any, any>;
  value: string | number | null;
  operator?: FilterOperator;
}) {
  if (value === null || value === undefined) return undefined;

  // Jika kolom bertipe number, gunakan operator numerik
  if (typeof value === "number") {
    switch (operator) {
      case "gt":
        return gt(column, value);
      case "lt":
        return lt(column, value);
      case "gte":
        return gte(column, value);
      case "lte":
        return lte(column, value);
      default:
        return eq(column, value);
    }
  }

  // Jika kolom bertipe string, bisa gunakan ilike
  if (typeof value === "string" && operator === "ilike") {
    return ilike(column, `%${value}%`);
  }

  // Default gunakan equals
  return eq(column, value);
}
  