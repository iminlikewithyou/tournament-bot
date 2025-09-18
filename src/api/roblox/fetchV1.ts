import { getCsrf } from "./getCsrf.js";

interface JsonFetchOptions {
  method?: string;
  includeCookie?: boolean;
  includeCsrf?: boolean;
  body?: BodyInit | null;
}

export async function fetchV1<T>(
  url: string,
  {
    method = "GET",
    includeCookie = true,
    includeCsrf = false,
    body,
  }: JsonFetchOptions = {}
): Promise<T> {
  let csrf: string | undefined;
  if (includeCsrf) {
    csrf = await getCsrf();
  }

  let headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (includeCookie)
    headers["Cookie"] = `.ROBLOSECURITY=${process.env.ROBLOSECURITY!}`;
  if (includeCsrf && csrf) headers["X-Csrf-Token"] = csrf;

  const response = await (
    await fetch(url, {
      method,
      headers,
      body,
    })
  ).json();

  if (response.errors) {
    console.error("Error with fetchV1!", response.errors);
    throw response.errors;
  }
  return response;
}
