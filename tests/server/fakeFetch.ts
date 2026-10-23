export interface Call { url: string; method: string; body: any }

/** A fetch stand-in that answers each call with the next queued response. */
export function fakeFetch(responses: { status?: number; json: unknown }[]) {
  const calls: Call[] = [];
  const fn = async (url: string | URL, init?: RequestInit) => {
    calls.push({ url: String(url), method: init?.method ?? 'GET', body: init?.body ? JSON.parse(String(init.body)) : undefined });
    const r = responses.shift();
    if (!r) throw new Error(`unexpected call ${url}`);
    const status = r.status ?? 200;
    return new Response(JSON.stringify(r.json), { status, headers: { 'content-type': 'application/json' } });
  };
  return { fn: fn as typeof fetch, calls };
}
