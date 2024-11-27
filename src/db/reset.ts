import { sql } from "drizzle-orm";
import { db } from ".";
import { execSync } from "child_process";

// if (!("DATABASE_URL" in process.env))
//   throw new Error("DATABASE_URL not found on .env.development");

async function reset() {
  console.log("⏳ Resetting database...");
  const start = Date.now();

//   const query = sql`
// 		DROP DATABASE IF EXISTS test_db;
//         CREATE DATABASE test_db;
// 		`;

//   await db.execute(query);

  execSync("psql -U postgres -c 'DROP DATABASE test_db' -c 'CREATE DATABASE test_db'")

//   execSync("npx drizzle-kit push");

  const end = Date.now();
  console.log(`✅ Reset end & took ${end - start}ms`);
  console.log("");
  process.exit(0);
}

reset().catch((err) => {
  console.error("❌ Reset failed");
  console.error(err);
  process.exit(1);
});

// psql -U postgres -c 'DROP DATABASE test_db WITH (FORCE)' -c 'CREATE DATABASE test_db'