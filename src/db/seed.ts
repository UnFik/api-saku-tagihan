import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { users } from "./schema";
import bcrypt from "bcrypt";
import { is } from "drizzle-orm";
const db = drizzle(process.env.DATABASE_URL!);

async function main() {
  const isUserAvailable = await db.select().from(users);

  if (isUserAvailable.length > 0) {
    await db.delete(users);
  }

  await db.insert(users).values([
    {
      name: "Admin BAKH",
      username: "admin_bakh",
      role: "BAKHUM",
      password: await bcrypt.hash("Bakh2022", 10), // 10 adalah jumlah salt rounds
    },
    {
      name: "Admin FMIPA",
      username: "admin_fmipa",
      role: "FAKULTAS",
      password: await bcrypt.hash("adminfmipa321", 10),
    },
  ]);
  console.log("New user created!");

  const admin = await db.select().from(users);
  console.log("Getting all users from the database: ", admin);
  /*
  const users: {
    id: number;
    name: string;
    age: number;
    email: string;
  }[]
  */

  // await db
  //   .update(users)
  //   .set({
  //     age: 31,
  //   })
  //   .where(eq(users.email, user.email));
  // console.log("User info updated!");
  process.exit(0);
}

main();
