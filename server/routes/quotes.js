import { Router } from "express";
import crypto from "node:crypto";
import { getDatabaseMissingMessage, getPool, hasDatabaseUrl, query } from "../db.js";
import { requireAdminApiSecret } from "../middleware/adminAuth.js";

const router = Router();
const VALID_STATUSES = new Set(["draft", "sent", "accepted", "rejected", "expired"]);

function roundCurrency(value) {
  return Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;
}

function normalizeQuoteItems(items = [], defaultTaxRate = 21) {
  return (Array.isArray(items) ? items : [])
    .filter((item) => item && String(item.name || "").trim())
    .map((item) => {
      const quantity = Math.max(0, Number(item.quantity || 0));
      const unitPrice = roundCurrency(item.unit_price);
      const taxRate = Number(item.tax_rate ?? defaultTaxRate);
      return {
        type: item.type || "custom",
        name: String(item.name || "").trim(),
        description: String(item.description || "").trim(),
        quantity,
        unit_price: unitPrice,
        tax_rate: taxRate,
        total: roundCurrency(quantity * unitPrice),
        product_id: item.product_id || "",
        service_id: item.service_id || "",
      };
    });
}

function calculateQuoteTotals(items = [], taxRate = 21) {
  const normalizedItems = normalizeQuoteItems(items, taxRate);
  const subtotal = roundCurrency(normalizedItems.reduce((sum, item) => sum + item.total, 0));
  const normalizedTaxRate = Number(taxRate || 0);
  const taxAmount = roundCurrency(subtotal * (normalizedTaxRate / 100));
  const total = roundCurrency(subtotal + taxAmount);
  return {
    items: normalizedItems,
    subtotal,
    tax_rate: normalizedTaxRate,
    tax_amount: taxAmount,
    total,
  };
}

function normalizeStatus(status) {
  const nextStatus = status || "draft";
  if (!VALID_STATUSES.has(nextStatus)) {
    const error = new Error("Estado de presupuesto no valido.");
    error.statusCode = 400;
    throw error;
  }
  return nextStatus;
}

function nullableText(value) {
  const text = String(value || "").trim();
  return text || null;
}

function dateOnly(value) {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
}

function mapQuote(row) {
  if (!row) return null;
  return {
    ...row,
    source_type: row.source_type || "manual",
    items: row.items || [],
    subtotal: Number(row.subtotal || 0),
    tax_rate: Number(row.tax_rate || 0),
    tax_amount: Number(row.tax_amount || 0),
    total: Number(row.total || 0),
    valid_until: dateOnly(row.valid_until),
    created_at: row.created_at?.toISOString?.() || row.created_at,
    updated_at: row.updated_at?.toISOString?.() || row.updated_at,
    created_date: row.created_at?.toISOString?.() || row.created_at,
  };
}

function mapPublicQuote(row) {
  if (!row) return null;
  return {
    id: row.id,
    quote_number: row.quote_number,
    status: row.status,
    customer_name: row.customer_name,
    customer_email: row.customer_email,
    customer_phone: row.customer_phone,
    customer_address: row.customer_address,
    customer_postal_code: row.customer_postal_code,
    customer_city: row.customer_city,
    customer_province: row.customer_province,
    items: row.items || [],
    subtotal: Number(row.subtotal || 0),
    tax_rate: Number(row.tax_rate || 0),
    tax_amount: Number(row.tax_amount || 0),
    total: Number(row.total || 0),
    valid_until: dateOnly(row.valid_until),
    terms: row.terms,
    accepted_at: row.accepted_at?.toISOString?.() || row.accepted_at,
    created_at: row.created_at?.toISOString?.() || row.created_at,
    created_date: row.created_at?.toISOString?.() || row.created_at,
  };
}

function mapBookingQuote(row) {
  if (!row) return null;
  return {
    id: row.id,
    quote_number: row.quote_number,
    status: row.status,
    customer_name: row.customer_name,
    customer_email: row.customer_email,
    customer_phone: row.customer_phone,
    customer_address: row.customer_address,
    customer_postal_code: row.customer_postal_code,
    customer_city: row.customer_city,
    customer_province: row.customer_province,
  };
}

async function getQuoteById(id) {
  const result = await query("select * from quotes where id = $1 limit 1", [id]);
  return result.rows[0] || null;
}

function validatePublicToken(row, token) {
  if (!row) {
    const error = new Error("Presupuesto no encontrado.");
    error.statusCode = 404;
    throw error;
  }

  if (!token || !row.public_token || token !== row.public_token) {
    const error = new Error("Este enlace de presupuesto no es valido o ha caducado.");
    error.statusCode = 403;
    throw error;
  }
}

function publicError(res, error) {
  return res.status(error.statusCode || 500).json({
    error: error.statusCode ? error.message : "No se pudo cargar el presupuesto.",
    details: error.statusCode ? undefined : error.message,
  });
}

async function generateQuoteNumber(client, now = new Date()) {
  const year = now.getFullYear();
  const prefix = `PRES-${year}-`;
  await client.query("select pg_advisory_xact_lock($1)", [year]);
  const result = await client.query(
    "select quote_number from quotes where quote_number like $1 order by quote_number desc limit 1",
    [`${prefix}%`]
  );
  const lastNumber = result.rows[0]?.quote_number || "";
  const next = lastNumber.startsWith(prefix) ? Number.parseInt(lastNumber.slice(prefix.length), 10) + 1 : 1;
  return `${prefix}${String(Number.isFinite(next) ? next : 1).padStart(4, "0")}`;
}

function generatePublicToken() {
  return crypto.randomUUID();
}

function buildQuotePayload(body = {}) {
  const status = normalizeStatus(body.status);
  const totals = calculateQuoteTotals(body.items, body.tax_rate ?? 21);
  return {
    status,
    customer_name: nullableText(body.customer_name),
    customer_email: nullableText(body.customer_email),
    customer_phone: nullableText(body.customer_phone),
    customer_address: nullableText(body.customer_address),
    customer_postal_code: nullableText(body.customer_postal_code),
    customer_city: nullableText(body.customer_city),
    customer_province: nullableText(body.customer_province),
    source_type: nullableText(body.source_type) || "manual",
    source_id: nullableText(body.source_id),
    items: totals.items,
    subtotal: totals.subtotal,
    tax_rate: totals.tax_rate,
    tax_amount: totals.tax_amount,
    total: totals.total,
    valid_until: body.valid_until || null,
    notes: body.notes || null,
    terms: body.terms || null,
    pdf_url: body.pdf_url || null,
    accepted_at: body.accepted_at || null,
  };
}

router.get("/health", async (_req, res) => {
  if (!hasDatabaseUrl()) {
    return res.status(503).json({
      ok: false,
      database: "missing",
      message: getDatabaseMissingMessage(),
    });
  }

  try {
    await query("select 1");
    return res.json({
      ok: true,
      database: "connected",
      service: "quotes",
    });
  } catch (error) {
    return res.status(503).json({
      ok: false,
      database: "error",
      message: error.message,
    });
  }
});

router.get("/quotes", requireAdminApiSecret, async (_req, res) => {
  if (!hasDatabaseUrl()) {
    return res.status(503).json({
      error: getDatabaseMissingMessage(),
      quotes: [],
    });
  }

  try {
    const result = await query(
      "select * from quotes order by created_at desc limit 300"
    );
    return res.json(result.rows.map(mapQuote));
  } catch (error) {
    return res.status(500).json({
      error: "No se pudieron cargar los presupuestos Quote.",
      details: error.message,
    });
  }
});

router.get("/public/quotes/:id", async (req, res) => {
  if (!hasDatabaseUrl()) {
    return res.status(503).json({ error: getDatabaseMissingMessage() });
  }

  try {
    const quote = await getQuoteById(req.params.id);
    validatePublicToken(quote, req.query.token);
    return res.json(mapPublicQuote(quote));
  } catch (error) {
    return publicError(res, error);
  }
});

router.post("/public/quotes/:id/accept", async (req, res) => {
  if (!hasDatabaseUrl()) {
    return res.status(503).json({ error: getDatabaseMissingMessage() });
  }

  try {
    const quote = await getQuoteById(req.params.id);
    const token = req.body?.token || req.query.token;
    validatePublicToken(quote, token);

    if (quote.status === "accepted") {
      return res.json(mapPublicQuote(quote));
    }

    const result = await query(
      `update quotes
       set status = 'accepted',
           accepted_at = coalesce(accepted_at, now()),
           updated_at = now()
       where id = $1
       returning *`,
      [req.params.id]
    );
    return res.json(mapPublicQuote(result.rows[0]));
  } catch (error) {
    return publicError(res, error);
  }
});

router.get("/public/quotes/:id/booking", async (req, res) => {
  if (!hasDatabaseUrl()) {
    return res.status(503).json({ error: getDatabaseMissingMessage() });
  }

  try {
    const quote = await getQuoteById(req.params.id);
    validatePublicToken(quote, req.query.token);

    if (quote.status !== "accepted") {
      return res.status(409).json({
        error: "Este presupuesto todavia no esta aceptado. Para reservar instalacion primero debes aceptar el presupuesto.",
      });
    }

    return res.json(mapBookingQuote(quote));
  } catch (error) {
    return publicError(res, error);
  }
});

router.post("/quotes", requireAdminApiSecret, async (req, res) => {
  if (!hasDatabaseUrl()) {
    return res.status(503).json({ error: getDatabaseMissingMessage() });
  }

  const pool = getPool();
  const client = await pool.connect();

  try {
    const payload = buildQuotePayload(req.body);
    if (!payload.customer_name || !payload.customer_phone) {
      return res.status(400).json({ error: "Nombre y telefono del cliente son obligatorios." });
    }

    await client.query("begin");
    const quoteNumber = await generateQuoteNumber(client);
    const publicToken = generatePublicToken();
    const result = await client.query(
      `insert into quotes (
        quote_number, public_token, status, customer_name, customer_email, customer_phone,
        customer_address, customer_postal_code, customer_city, customer_province,
        source_type, source_id, items, subtotal, tax_rate, tax_amount, total,
        valid_until, notes, terms, pdf_url, accepted_at
      ) values (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13::jsonb, $14, $15, $16, $17, $18, $19, $20, $21, $22
      ) returning *`,
      [
        quoteNumber,
        publicToken,
        payload.status,
        payload.customer_name,
        payload.customer_email,
        payload.customer_phone,
        payload.customer_address,
        payload.customer_postal_code,
        payload.customer_city,
        payload.customer_province,
        payload.source_type,
        payload.source_id,
        JSON.stringify(payload.items),
        payload.subtotal,
        payload.tax_rate,
        payload.tax_amount,
        payload.total,
        payload.valid_until,
        payload.notes,
        payload.terms,
        payload.pdf_url,
        payload.accepted_at,
      ]
    );
    await client.query("commit");
    return res.status(201).json(mapQuote(result.rows[0]));
  } catch (error) {
    await client.query("rollback").catch(() => {});
    return res.status(error.statusCode || 500).json({
      error: error.statusCode ? error.message : "No se pudo crear el presupuesto Quote.",
      details: error.statusCode ? undefined : error.message,
    });
  } finally {
    client.release();
  }
});

router.put("/quotes/:id", requireAdminApiSecret, async (req, res) => {
  if (!hasDatabaseUrl()) {
    return res.status(503).json({ error: getDatabaseMissingMessage() });
  }

  try {
    const payload = buildQuotePayload(req.body);
    if (!payload.customer_name || !payload.customer_phone) {
      return res.status(400).json({ error: "Nombre y telefono del cliente son obligatorios." });
    }

    const result = await query(
      `update quotes set
        status = $2,
        customer_name = $3,
        customer_email = $4,
        customer_phone = $5,
        customer_address = $6,
        customer_postal_code = $7,
        customer_city = $8,
        customer_province = $9,
        source_type = $10,
        source_id = $11,
        items = $12::jsonb,
        subtotal = $13,
        tax_rate = $14,
        tax_amount = $15,
        total = $16,
        valid_until = $17,
        notes = $18,
        terms = $19,
        pdf_url = coalesce($20, pdf_url),
        accepted_at = $21,
        updated_at = now()
      where id = $1
      returning *`,
      [
        req.params.id,
        payload.status,
        payload.customer_name,
        payload.customer_email,
        payload.customer_phone,
        payload.customer_address,
        payload.customer_postal_code,
        payload.customer_city,
        payload.customer_province,
        payload.source_type,
        payload.source_id,
        JSON.stringify(payload.items),
        payload.subtotal,
        payload.tax_rate,
        payload.tax_amount,
        payload.total,
        payload.valid_until,
        payload.notes,
        payload.terms,
        payload.pdf_url,
        payload.accepted_at,
      ]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ error: "Presupuesto Quote no encontrado." });
    }

    return res.json(mapQuote(result.rows[0]));
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      error: error.statusCode ? error.message : "No se pudo actualizar el presupuesto Quote.",
      details: error.statusCode ? undefined : error.message,
    });
  }
});

router.delete("/quotes/:id", requireAdminApiSecret, async (req, res) => {
  if (!hasDatabaseUrl()) {
    return res.status(503).json({ error: getDatabaseMissingMessage() });
  }

  try {
    const result = await query("delete from quotes where id = $1 returning id", [req.params.id]);
    if (!result.rows[0]) {
      return res.status(404).json({ error: "Presupuesto Quote no encontrado." });
    }
    return res.json({ ok: true });
  } catch (error) {
    return res.status(500).json({
      error: "No se pudo eliminar el presupuesto Quote.",
      details: error.message,
    });
  }
});

export default router;
