// Small helper to fetch and safely handle non-JSON responses
export default async function fetchJson(url, options = {}) {
  const resp = await fetch(url, options);
  const contentType = (resp.headers.get('content-type') || '').toLowerCase();

  // If JSON, parse; otherwise return text so caller can decide
  if (contentType.includes('application/json')) {
    const json = await resp.json();
    return { ok: resp.ok, status: resp.status, json };
  }

  // Not JSON (likely HTML or plain text) — return text for diagnostics
  const text = await resp.text();
  return { ok: resp.ok, status: resp.status, text, contentType };
}
