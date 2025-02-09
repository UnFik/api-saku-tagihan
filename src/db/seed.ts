import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { users, serviceTypes, unit, activationPeriods } from "./schema";
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

  const service = await db
    .insert(serviceTypes)
    .values([
      {
        name: "Tagihan SPP/UKT D4 sd S3 (termasuk LSP)",
        type: "Tagihan Layanan Pendidikan",
        typeServiceId: "1",
        description: "Layanan 1",
      },
      {
        name: "Tagihan SPP Labschool, TTKA Ceria, PKh, SD PGSD, dll",
        type: "Tagihan Layanan Pendidikan Lainnya",
        typeServiceId: "2",
        description: "Layanan 2",
      },
      {
        name: "Tagihan Kerjasama Beasiswa",
        type: "Tagihan Layanan Pendidikan Lainnya",
        typeServiceId: "2",
        description: "Layanan 2",
      },
      {
        name: "Tagihan Kerjasama Bisnis (kerjasama UPT LBK dengan Perbanas, Pekerti BP3, UPT Bahasa, Edura, dll)",
        type: "Tagihan Layanan Non Pendidikan",
        typeServiceId: "3",
        description: "Layanan 3",
      },
      {
        name: "Tagihan Kerjasama Lab FMIPA, FT, UPT TIK, dll",
        type: "Tagihan Layanan Non Pendidikan",
        typeServiceId: "3",
        description: "Layanan 3",
      },
      {
        name: "Tagihan Kerjasama Pemerintah Non UKT",
        type: "Tagihan Layanan Non Pendidikan",
        typeServiceId: "3",
        description: "Layanan 3",
      },
      {
        name: "Tagihan PPP",
        type: "Tagihan Layanan Non Pendidikan",
        typeServiceId: "3",
        description: "Layanan 3",
      },
      {
        name: "Tagihan GOR",
        type: "Tagihan Layanan Non Pendidikan",
        typeServiceId: "3",
        description: "Layanan 3",
      },
      {
        name: "Tagihan Sarana Olahraga Lainnya",
        type: "Tagihan Layanan Non Pendidikan",
        typeServiceId: "3",
        description: "Layanan 3",
      },
      {
        name: "Tagihan Bus / ELF",
        type: "Tagihan Layanan Non Pendidikan",
        typeServiceId: "3",
        description: "Layanan 3",
      },
      {
        name: "Tagihan Franchise",
        type: "Tagihan Layanan Non Pendidikan",
        typeServiceId: "3",
        description: "Layanan 3",
      },
      {
        name: "Tagihan Sewa Ruang/Aula/Gedung",
        type: "Tagihan Layanan Non Pendidikan",
        typeServiceId: "3",
        description: "Layanan 3",
      },
      {
        name: "Tagihan Kantin",
        type: "Tagihan Layanan Non Pendidikan",
        typeServiceId: "3",
        description: "Layanan 3",
      },
      {
        name: "Tagihan Kerjasama Penelitian dan Pengabdian Masyarakat",
        type: "Tagihan Layanan Non Pendidikan",
        typeServiceId: "3",
        description: "Layanan 3",
      },
    ])
    .returning({
      id: serviceTypes.id,
      name: serviceTypes.name,
      type: serviceTypes.type,
      typeServiceId: serviceTypes.typeServiceId,
      description: serviceTypes.description,
      createdAt: serviceTypes.createdAt,
      updateAt: serviceTypes.updateAt,
    });

  const insertUnit = await db.insert(unit).values([
    {
      name: "Fakultas Teknologi Informasi",
      code: "FTII",
      abbreviation: "FTI",
    },
    {
      name: "Fakultas Teknologi Industri",
      code: "FTI",
      abbreviation: "FTI",
    },
    {
      name: "Fakultas Ilmu Pendidikan",
      code: "140801",
      abbreviation: "FIP",
    },
    {
      name: "Fakultas Bahasa dan Seni",
      code: "140802",
      abbreviation: "FBS",
    },
    {
      name: "Fakultas Matematika dan Ilmu Pengetahuan Alam",
      code: "140803",
      abbreviation: "FMIPA",
    },
    {
      name: "Fakultas Ilmu Sosial dan Hukum",
      code: "140804",
      abbreviation: "FISH",
    },
    {
      name: "Fakultas Teknik",
      code: "140805",
      abbreviation: "FT",
    },
    {
      name: "Fakultas Ilmu Keolahragaan dan Kesehatan",
      code: "140806",
      abbreviation: "FIKK",
    },
    {
      name: "Sekolah Pascasarjana & PPG",
      code: "140807",
      abbreviation: "Pascasarjana",
    },
    {
      name: "Fakultas Ekonomi dan Bisnis",
      code: "140808",
      abbreviation: "FEB",
    },
    {
      name: "Fakultas Psikologi",
      code: "140809",
      abbreviation: "FPsi",
    },
    {
      name: "Rektorat",
      code: "140810",
      abbreviation: "Rektorat",
    },
    {
      name: "Wakil Rektor I",
      code: "140814",
      abbreviation: "WR I",
    },
    {
      name: "Wakil Rektor II",
      code: "140818",
      abbreviation: "WR II",
    },
    {
      name: "Wakil Rektor III",
      code: "140825",
      abbreviation: "WR III",
    },
    {
      name: "Wakil Rektor IV",
      code: "140828",
      abbreviation: "WR IV",
    },
    {
      name: "Lembaga Penelitian dan Pengabdian Kepada Masyarakat",
      code: "140830",
      abbreviation: "LP2M",
    },
    {
      name: "Badan Pengembangan Pendidikan dan Pembelajaran",
      code: "140831",
      abbreviation: "BP3",
    },
    {
      name: "Direktorat Akademik",
      code: "140815",
      abbreviation: "Dit. Akademik",
    },
    {
      name: "Direktorat Sumber Daya dan Pengadaan Barang/Jasa",
      code: "140820",
      abbreviation: "Dit. SDPBJ",
    },
    {
      name: "Direktorat Keuangan dan Perencanaan",
      code: "140819",
      abbreviation: "Dit. Keuangan",
    },
    {
      name: "Perpustakaan",
      code: "140816",
      abbreviation: "PERPUS",
    },
    {
      name: "Pusat Teknologi Informasi dan Komunikasi",
      code: "140827",
      abbreviation: "PUSTIKOM",
    },
    {
      name: "Pusat Layanan Psikologi dan Bimbingan Konseling",
      code: "140835",
      abbreviation: "PLPBK",
    },
    {
      name: "Pusat Bahasa",
      code: "140834",
      abbreviation: "BAHASA",
    },
    {
      name: "Satuan Pengawas Internal",
      code: "140836",
      abbreviation: "SPI",
    },
    {
      name: "Majelis Wali Amanah & Komite Audit",
      code: "140813",
      abbreviation: "DEWAS",
    },
    {
      name: "Labschool",
      code: "140832",
      abbreviation: "LABSCHOOL",
    },
    {
      name: "Remunerasi ASN & PT PTNBH",
      code: "140821",
      abbreviation: "REMUN",
    },
    {
      name: "Belanja Gaji PTT PTNBH",
      code: "140822",
      abbreviation: "PTTPTNBH",
    },
    {
      name: "Badan Pengelola Usaha",
      code: "140833",
      abbreviation: "BPU",
    },
    {
      name: "Sekretaris Universitas",
      code: "140811",
      abbreviation: "SEKUN",
    },
    {
      name: "Senat Akademik Universitas",
      code: "140812",
      abbreviation: "SENAT",
    },
    {
      name: "Direktorat Kemahasiswaan dan Alumni",
      code: "140817",
      abbreviation: "Dit. Kemahasiswaan",
    },
    {
      name: "Remunerasi Kerjasama",
      code: "140823",
      abbreviation: "Remunerasi Kerjasama",
    },
    {
      name: "Belanja Pegawai Lainnya",
      code: "140824",
      abbreviation: "Belanja Pegawai Lainnya",
    },
    {
      name: "Direktorat Inovasi dan Hilirisasi, Sistem Informasi dan Pemeringkatan",
      code: "140826",
      abbreviation: "Dit. Inovasi, SI, dan Pemeringkatan",
    },
    {
      name: "Direktorat Kerjasama dan Bisnis",
      code: "140829",
      abbreviation: "Dit. Kerjasama",
    },
    {
      name: "Satuan Penjaminan Mutu",
      code: "140837",
      abbreviation: "SPM",
    },
  ]);

  console.log(service, "Jenis Layanan berhasil ditambahkan");
  const user = await db
    .insert(users)
    .values([
      {
        name: "Pustikom",
        username: "pustikom",
        role: "superadmin",
        password: await bcrypt.hash("11111", 10),
      },
      {
        name: "Admin Keuangan",
        username: "keuangan",
        role: "superadmin",
        password: await bcrypt.hash("11111", 10),
      },
    ])
    .returning({
      id: users.id,
      name: users.name,
      username: users.username,
      role: users.role,
      createdAt: users.createdAt,
      updateAt: users.updateAt,
    });

  const activationPeriod = await db.insert(activationPeriods).values({
    semester: "121",
  });

  console.log(user, "Pengguna Berhasil ditambahkan");

  process.exit(0);
}

main();
