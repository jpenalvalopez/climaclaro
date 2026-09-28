const QUOTES_API_BASE_URL = (import.meta.env.VITE_QUOTES_API_BASE_URL || "").replace(/\/$/, "");

function apiUrl(path) {
  return `${QUOTES_API_BASE_URL}${path}`;
}

async function requestJson(path, options = {}) {
  const response = await fetch(apiUrl(path), {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json") ? await response.json() : null;

  if (!response.ok) {
    throw new Error(payload?.error || payload?.message || "Error al conectar con la API publica de presupuestos.");
  }

  return payload;
}

export function getPublicQuote(id, token) {
  return requestJson(`/api/public/quotes/${id}?token=${encodeURIComponent(token || "")}`);
}

export function acceptPublicQuote(id, token) {
  return requestJson(`/api/public/quotes/${id}/accept`, {
    method: "POST",
    body: JSON.stringify({ token }),
  });
}

export function getQuoteForBooking(id, token) {
  return requestJson(`/api/public/quotes/${id}/booking?token=${encodeURIComponent(token || "")}`);
}
