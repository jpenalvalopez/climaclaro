export function requireAdminApiSecret(req, res, next) {
  const configuredSecret = process.env.ADMIN_API_SECRET;

  if (!configuredSecret) {
    return res.status(503).json({
      error: "ADMIN_API_SECRET no esta configurado. Define ADMIN_API_SECRET para permitir escrituras admin de Quotes.",
    });
  }

  const providedSecret = req.get("x-admin-api-secret");

  if (!providedSecret || providedSecret !== configuredSecret) {
    return res.status(401).json({
      error: "No autorizado para modificar presupuestos Quote.",
    });
  }

  return next();
}
