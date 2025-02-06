export interface User {
  name: string;
  username: string;
  role: string;
}

export interface AuthSiakad {
  username?: string;
  mode?: string;
  nama?: string;
  kelamin?: string;
  status: boolean;
  unit?: string;
  Authorization?: string;
  msg: string;
}
