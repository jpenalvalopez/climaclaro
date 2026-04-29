/**
 * CMS helpers — getText, getContent, useCmsTexts hook
 */
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

const CMS_QUERY_KEY = ["cms_webtexts"];

// ── getContent ─────────────────────────────────────────────────────────────────
export async function getContent(key, fallbackTitle = "", fallbackContent = "") {
  try {
    const results = await base44.entities.WebContent.filter({ key, active: true }, "sort_order", 1);
    if (results?.[0]) {
      // El SDK devuelve los campos directamente en el objeto (no anidados en .data)
      const item = results[0];
      return {
        title: item.title || fallbackTitle,
        content: item.content || fallbackContent,
        content_format: item.content_format || "markdown",
        image_url: item.image_url || null,
      };
    }
  } catch {
    // fall through
  }
  return { title: fallbackTitle, content: fallbackContent, content_format: "markdown" };
}

// ── useCmsTexts React hook ─────────────────────────────────────────────────────
export function useCmsTexts() {
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: CMS_QUERY_KEY,
    queryFn: () => base44.entities.WebText.list("sort_order", 500), // carga TODOS, activos e inactivos
    staleTime: 0,
  });

  // Suscripción en tiempo real: cualquier cambio en WebText invalida la query
  useEffect(() => {
    const unsub = base44.entities.WebText.subscribe(() => {
      queryClient.invalidateQueries({ queryKey: CMS_QUERY_KEY });
    });
    return unsub;
  }, [queryClient]);

  // cache: { key -> { value, active } }
  const cache = {};
  if (data) {
    for (const r of data) cache[r.key] = { value: r.value, active: r.active !== false };
  }

  // Si la clave existe en BD y está inactiva → devuelve "". Si no existe → devuelve fallback.
  const t = (key, fallback = "") => {
    if (!cache[key]) return fallback;
    return cache[key].active ? cache[key].value : "";
  };
  return { t };
}

// ── invalidateCmsCache ─────────────────────────────────────────────────────────
export function invalidateCmsCache(queryClient) {
  if (queryClient) {
    queryClient.invalidateQueries({ queryKey: CMS_QUERY_KEY });
  }
}