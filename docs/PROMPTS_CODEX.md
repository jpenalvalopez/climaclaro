# Prompts reutilizables para Codex — ClimaClaro

---

## PROMPT 1 — Entender la web

Antes de tocar código, lee:

- AGENTS.md
- docs/PROJECT_CONTEXT.md
- docs/BUSINESS_RULES.md
- docs/ARCHITECTURE.md

Después responde:

1. Qué es ClimaClaro.
2. Qué flujo tiene el usuario.
3. Qué partes afectan a conversión.
4. Qué riesgos hay si se modifica mal.

No modifiques código.

---

## PROMPT 2 — Mejorar conversión

Quiero mejorar la conversión en ClimaClaro.

Antes de tocar código:

1. Lee la documentación.
2. Identifica puntos de fricción.
3. Propón mejoras simples.

No implementes sin validar primero.

---

## PROMPT 3 — Crear funcionalidad

Quiero implementar:

[DESCRIBIR FUNCIONALIDAD]

Antes:

1. Lee AGENTS.md.
2. Revisa docs/.
3. Identifica impacto en UX.
4. Propón plan.

Después:
- Cambios mínimos.
- No romper flujo actual.

---

## PROMPT 4 — Arreglar bug

Problema:

[DESCRIBIR]

Antes:

1. Leer docs.
2. Identificar causa.

Después:
- Corregir solo lo necesario.
- Explicar solución.

---

## PROMPT 5 — Revisar antes de producción

Comprueba:

- UX correcta
- Botones visibles
- No errores
- No roturas

Devuelve:

- Problemas
- Riesgos
- Si está listo

---

## PROMPT 6 — Flujo completo

Revisa el flujo:

- Wizard
- Producto
- Presupuesto
- Reserva

Y mejora la experiencia sin romper nada.
