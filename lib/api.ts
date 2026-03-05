import { env } from "@/lib/env";
import type { TableName } from "@/lib/types";

type Primitive = string | number | boolean;

export type QueryParams = Record<
  string,
  Primitive | Primitive[] | null | undefined
>;

export type RequestMethod = "GET" | "POST" | "PATCH" | "DELETE";

export interface RequestOptions {
  method?: RequestMethod;
  query?: QueryParams;
  body?: unknown;
  auth?: boolean;
  headers?: HeadersInit;
}

export interface PostgrestErrorPayload {
  code?: string;
  details?: string;
  hint?: string;
  message?: string;
}

export class PostgrestError extends Error {
  status: number;
  payload: PostgrestErrorPayload | null;

  constructor(
    message: string,
    status: number,
    payload: PostgrestErrorPayload | null = null,
  ) {
    super(message);
    this.name = "PostgrestError";
    this.status = status;
    this.payload = payload;
  }
}

type TokenGetter = () => string | null | Promise<string | null>;

let inMemoryToken: string | null = null;
let tokenGetter: TokenGetter | null = null;

export function setAuthToken(token: string | null) {
  inMemoryToken = token;
}

export function setAuthTokenGetter(getter: TokenGetter | null) {
  tokenGetter = getter;
}

async function resolveAuthToken() {
  if (tokenGetter) {
    return tokenGetter();
  }

  if (inMemoryToken) {
    return inMemoryToken;
  }

  if (typeof window === "undefined") {
    try {
      const { cookies } = await import("next/headers");
      const cookieStore = await cookies();
      const token = cookieStore.get("ba_pgrst_token")?.value ?? null;
      if (token) return token;
    } catch {
      return null;
    }
  }

  return null;
}

function toQueryString(query?: QueryParams) {
  if (!query) {
    return "";
  }

  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (value === null || value === undefined) {
      continue;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        params.append(key, String(item));
      }
      continue;
    }

    params.set(key, String(value));
  }

  const queryString = params.toString();
  return queryString ? `?${queryString}` : "";
}

async function parseErrorPayload(response: Response) {
  try {
    const data = (await response.json()) as PostgrestErrorPayload;
    return data;
  } catch {
    return null;
  }
}

async function parseResponse<T>(response: Response) {
  if (response.status === 204) {
    return null as T;
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return null as T;
  }

  return (await response.json()) as T;
}

export async function postgrestRequest<T>(
  resource: string,
  options: RequestOptions = {},
) {
  const {
    method = "GET",
    query,
    body,
    auth = true,
    headers: customHeaders,
  } = options;

  const requestHeaders = new Headers(customHeaders);
  requestHeaders.set("Accept", "application/json");

  if (body !== undefined && method !== "GET") {
    requestHeaders.set("Content-Type", "application/json");
    requestHeaders.set("Prefer", "return=representation");
  }

  if (auth) {
    const token = await resolveAuthToken();
    if (!token) {
      throw new PostgrestError("Missing auth token for private request", 401);
    }
    requestHeaders.set("Authorization", `Bearer ${token}`);
  }

  const queryString = toQueryString(query);
  const url = `${env.apiUrl}/${resource}${queryString}`;

  const response = await fetch(url, {
    method,
    headers: requestHeaders,
    body: body !== undefined && method !== "GET" ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });

  if (!response.ok) {
    const payload = await parseErrorPayload(response);
    throw new PostgrestError(
      payload?.message ?? "PostgREST request failed",
      response.status,
      payload,
    );
  }

  return parseResponse<T>(response);
}

export function getFrom<T>(resource: TableName | string, query?: QueryParams, auth = true) {
  return postgrestRequest<T>(resource, { method: "GET", query, auth });
}

export function postTo<TResponse, TBody>(
  resource: TableName | string,
  body: TBody,
  auth = true,
) {
  return postgrestRequest<TResponse>(resource, { method: "POST", body, auth });
}

export function patchTo<TResponse, TBody>(
  resource: TableName | string,
  body: TBody,
  query?: QueryParams,
  auth = true,
) {
  return postgrestRequest<TResponse>(resource, {
    method: "PATCH",
    body,
    query,
    auth,
  });
}

export function deleteFrom<TResponse>(
  resource: TableName | string,
  query?: QueryParams,
  auth = true,
) {
  return postgrestRequest<TResponse>(resource, {
    method: "DELETE",
    query,
    auth,
  });
}
