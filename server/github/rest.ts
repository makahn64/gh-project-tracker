export async function rest<T>(token: string, method: string, path: string, body: object | undefined, fetchFn: typeof fetch = fetch): Promise<T> {
  const res = await fetchFn(`https://api.github.com${path}`, {
    method,
    headers: { authorization: `Bearer ${token}`, accept: 'application/vnd.github+json', 'content-type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message ?? `GitHub returned ${res.status}`);
  return data as T;
}
