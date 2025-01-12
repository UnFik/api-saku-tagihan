interface ResponseService {
  status: number;
  success: boolean;
  data?: any;
  message: string;
}

interface ResProdi {
  isi: DataProdi[];
  status: true;
}

interface DataProdi {
  kodeProdi: string;
  namaProdi: string;
  jenjangProdi: string;
  KoordProdi: string;
  NipKoordProdi: string;
  namaKoordProdi: string;
  kodeFakProdi: string;
  namaFakultas: string;
  akreditasiProdi: string;
  skProdi: string;
  prodi_dikti: string;
  pesan: string;
}

export type DrizzleWhere<T> =
  | SQL<unknown>
  | ((aliases: T) => SQL<T> | undefined)
  | undefined;
