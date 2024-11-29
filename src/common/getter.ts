import { env } from "bun";
import { generateTokenMultibank } from "./utils";

interface ResponseData {
  status: string;
  data?: Array<any>;
  msg?: string;
  isi?: Array<any>;
}

export async function getProdiById(id: string) {
  const res: ResponseData = await fetch(
    `${env.SIAKAD_API_URL}/as400/programStudi/${id}`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    }
  )
    .then((response) => {
      return response.json();
    })
    .catch((error) => console.error("Error:", error));

  const resData = res && res.isi ? res.isi[0] : null;
  return resData;
}

export async function getBillIssueById(id: string, token?: string) {
  if (!token) {
    token = await generateTokenMultibank();
  }
  
  const res = await fetch(`${env.MULTIBANK_API_URL}/bill_issue/${id}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  })
    .then(async (response) => {
      if (response.status == 401) {
        // console.log(response);
        const token = await fetch(`${env.BASE_URL}/api/refresh-token`).then(
          (res) => res.json()
        );
        console.log(token);
        getBillIssueById(id, token);
      }
      return response.json();
    })
    .catch((error) => console.error("Error:", error));

  const billIssue = res.data;
  return billIssue;
}
