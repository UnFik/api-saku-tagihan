import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { users, serviceTypes } from "./schema";
import bcrypt from "bcrypt";
import { is } from "drizzle-orm";
const db = drizzle(process.env.DATABASE_URL!);

async function main() {
  // const isUserAvailable = await db.select().from(users);

  // if (isUserAvailable.length > 0) {
  //   await db.delete(users);
  // }

  // await db.insert(users).values([
  //   {
  //     name: "Admin BAKH",
  //     username: "admin_bakh",
  //     role: "BAKHUM",
  //     password: await bcrypt.hash("Bakh2022", 10), // 10 adalah jumlah salt rounds
  //   },
  //   {
  //     name: "Admin FMIPA",
  //     username: "admin_fmipa",
  //     role: "FAKULTAS",
  //     password: await bcrypt.hash("adminfmipa321", 10),
  //   },
  // ]);
  // console.log("New user created!");

  // const admin = await db.select().from(users);
  // console.log("Getting all users from the database: ", admin);
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

  const service = await db.insert(serviceTypes).values([
    {
      name: "Invoice SPP/UKT D4 sd S3 (termasuk LSP)",
      type: "Tagihan Layanan Pendidikan",
      typeServiceId: "1",
      description: "Layanan 1",
    },
    {
      name: 'Invoice SPP Labschool, TTKA Ceria, PKh, SD PGSD, dll',
      type: "Tagihan Layanan Pendidikan Lainnya",
      typeServiceId: "2",
      description: "Layanan 2",
    },
    {
      name: 'Invoice Kerjasama Beasiswa',
      type: "Tagihan Layanan Pendidikan Lainnya",
      typeServiceId: "2",
      description: "Layanan 2",
    },
    {
      name: 'Invoice Kerjasama Bisnis (kerjasama UPT LBK dengan Perbanas, Pekerti BP3, UPT Bahasa, Edura, dll)',
      type: "Tagihan Layanan Non Pendidikan",
      typeServiceId: "3",
      description: "Layanan 3",
    },
    {
      name: 'Invoice Kerjasama Lab FMIPA, FT, UPT TIK, dll',
      type: "Tagihan Layanan Non Pendidikan",
      typeServiceId: "3",
      description: "Layanan 3",
    },
    {
      name: 'Invoice Kerjasama Pemerintah Non UKT',
      type: "Tagihan Layanan Non Pendidikan", 
      typeServiceId: "3",
      description: "Layanan 3",
    },
    {
      name: 'Invoice PPP',
      type: "Tagihan Layanan Non Pendidikan",
      typeServiceId: "3", 
      description: "Layanan 3",
    },
    {
      name: 'Invoice GOR',
      type: "Tagihan Layanan Non Pendidikan",
      typeServiceId: "3",
      description: "Layanan 3",
    },
    {
      name: 'Invoice Sarana Olahraga Lainnya',
      type: "Tagihan Layanan Non Pendidikan", 
      typeServiceId: "3",
      description: "Layanan 3",
    },
    {
      name: 'Invoice Bus / ELF',
      type: "Tagihan Layanan Non Pendidikan",
      typeServiceId: "3",
      description: "Layanan 3",
    },
    {
      name: 'Invoice Franchise',
      type: "Tagihan Layanan Non Pendidikan",
      typeServiceId: "3",
      description: "Layanan 3",
    },
    {
      name: 'Invoice Sewa Ruang/Aula/Gedung',
      type: "Tagihan Layanan Non Pendidikan",
      typeServiceId: "3",
      description: "Layanan 3",
    },
    {
      name: 'Invoice Kantin',
      type: "Tagihan Layanan Non Pendidikan",
      typeServiceId: "3",
      description: "Layanan 3",
    },
    {
      name: 'Invoice Kerjasama Penelitian dan Pengabdian Masyarakat',
      type: "Tagihan Layanan Non Pendidikan",
      typeServiceId: "3",
      description: "Layanan 3",
    }
  ])

  console.log("Jenis Layanan berhasil ditambahkan: ", service);

  process.exit(0);
}

main();
