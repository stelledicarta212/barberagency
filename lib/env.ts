const fallbackApiUrl = "https://api.agencia2c.cloud";

const apiUrl = (process.env.NEXT_PUBLIC_API_URL ?? fallbackApiUrl).trim();

if (!apiUrl.startsWith("http://") && !apiUrl.startsWith("https://")) {
  throw new Error(
    "NEXT_PUBLIC_API_URL must start with http:// or https://",
  );
}

export const env = {
  apiUrl,
} as const;

