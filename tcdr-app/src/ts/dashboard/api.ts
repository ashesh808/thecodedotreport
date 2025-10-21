import type { RunAllResponse } from "./types";

const RUN_ENDPOINT = "/run";

export async function postRunAll(): Promise<{
  response: Response;
  payload: RunAllResponse | null;
}> {
  const response = await fetch(RUN_ENDPOINT, { method: "POST" });
  const payload = await readJson<RunAllResponse>(response);
  return { response, payload };
}

async function readJson<T>(response: Response): Promise<T | null> {
  const raw = await response.text();
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}
