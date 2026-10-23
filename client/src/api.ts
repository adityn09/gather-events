const base = import.meta.env.VITE_API_URL || "/api";
export async function api<T>(
  path: string,
  method = "GET",
  data?: unknown,
): Promise<T> {
  const controller = new AbortController(),
    timer = setTimeout(() => controller.abort(), 15000);
  try {
    const r = await fetch(base + path, {
      method,
      credentials: "include",
      headers: data === undefined ? {} : { "Content-Type": "application/json" },
      body: data === undefined ? undefined : JSON.stringify(data),
      signal: controller.signal,
    });
    if (r.status === 204) return undefined as T;
    const body = await r
      .json()
      .catch(() => ({
        message: "The service returned an unexpected response.",
      }));
    if (!r.ok)
      throw new Error(body.message || "The request could not be completed.");
    return body as T;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError")
      throw new Error("The request took too long. Please try again.");
    throw error;
  } finally {
    clearTimeout(timer);
  }
}
export async function downloadAttendance(id: string) {
  const r = await fetch(base + "/events/" + id + "/attendance.csv", {
    credentials: "include",
    signal: AbortSignal.timeout(15000),
  });
  if (!r.ok) throw new Error("The attendance export could not be downloaded.");
  const url = URL.createObjectURL(await r.blob());
  const a = document.createElement("a");
  a.href = url;
  a.download = "gather-attendance.csv";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
