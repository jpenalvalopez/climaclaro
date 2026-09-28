const QUOTES_API_BASE_URL = (import.meta.env.VITE_QUOTES_API_BASE_URL || "").replace(/\/$/, "");
const ADMIN_API_SECRET = import.meta.env.VITE_ADMIN_API_SECRET || "";

function apiUrl(path) {
  return `${QUOTES_API_BASE_URL}${path}`;
}

async function requestJson(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (ADMIN_API_SECRET) {
    headers["x-admin-api-secret"] = ADMIN_API_SECRET;
  }

  const response = await fetch(apiUrl(path), {
    headers,
    ...options,
  });

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json") ? await response.json() : null;

  if (!response.ok) {
    throw new Error(payload?.error || payload?.message || "Error al conectar con la API de presupuestos.");
  }

  return payload;
}

export function listQuotes() {
  return requestJson("/api/quotes");
}

export function createQuote(data) {
  return requestJson("/api/quotes", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateQuote(id, data) {
  return requestJson(`/api/quotes/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteQuote(id) {
  return requestJson(`/api/quotes/${id}`, {
    method: "DELETE",
  });
}
