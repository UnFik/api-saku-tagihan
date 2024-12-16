import { error, type Context } from "elysia";
import { type JwtContext } from "./jwt";
import { env } from "bun";

export async function getAuthUserId({
  headers: { authorization },
  jwt,
  cookie: { authorization: cookieAuthorization },
}: Pick<Context, "headers"> & JwtContext & Pick<Context, "cookie">) {
  const token = authorization?.replace("Bearer ", "");
  let payload = await jwt.verify(token);
  if (!payload) {
    if (cookieAuthorization.value) {
      const tokenCookie = `${cookieAuthorization.value}`;
      payload = await jwt.verify(tokenCookie);
    }

    if (!payload) {
      throw unauthorized();
    }
  }

  return { userId: payload.id.toString(), token };
}

export function invalid(cause?: any) {
  return error(400, {
    errors: { body: [cause ? `${cause}` : "Bad Request"] },
  });
}

export function unauthorized(cause?: any) {
  return error(401, {
    errors: { body: [cause ? `${cause.message}` : "Invalid credentials"] },
  });
}

export function unprocessable(cause?: any) {
  return error(422, {
    errors: {
      body:
        cause?.length || 0 > 0
          ? cause
          : [cause ? `${cause}` : "Validation failed, check parameters"],
    },
  });
}

export function notFound(cause?: any) {
  return error(404, {
    errors: { body: [cause ? `${cause}` : "Invalid resource identifier"] },
  });
}

export function toSlug(str: string) {
  return str
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-");
}

export function isDefined<T>(thing?: T | null | undefined): thing is T {
  return thing !== undefined && thing !== null;
}

export function isString(thing?: string | null | undefined): thing is string {
  return typeof thing === "string";
}

export function generateNumberId() {
  const min = 1000;
  const max = 999999;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export async function generateTokenMultibank() {
  try {
    const response = await fetch(`${env.MULTIBANK_API_URL}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user: env.MULTIBANK_USERNAME,
        password: env.MULTIBANK_PASSWORD,
      }),
    });

    const result = await response.json();
    console.log("token refreshed", result);
    if (result.status !== 200) {
      throw new Error(`Error: ${result.message}`);
    }

    return result.data.remember_token;
  } catch (error) {
    throw new Error(`Failed to process response: ${error}`);
  }
}

export const refreshTokenMultibank = async () => {
  const res = await fetch(`${env.BASE_URL}/api/refresh-token`, {
    credentials: 'include'
  });

  if (!res.ok) {
    unprocessable(`Failed to refresh token: ${res.status}`);
  }

  const data = await res.json();
  
  if (typeof window !== 'undefined') {
    document.cookie = `multibank=${data.token}; path=/; secure; samesite=strict`;
  }
  
  return data.token;
};
