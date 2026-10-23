export async function graphql<T>(token: string, query: string, variables: object, fetchFn: typeof fetch = fetch): Promise<T> {
  const res = await fetchFn('https://api.github.com/graphql', {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.message ?? `GitHub returned ${res.status}`);
  if (body.errors?.length) throw new Error(body.errors[0].message);
  return body.data as T;
}
