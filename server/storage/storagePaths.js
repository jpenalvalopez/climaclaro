import { isPdfMime, normalizeIdentifier, validateKind } from "./fileValidation.js";

const INSTALLATION_PHASES = ["antes", "durante", "despues"];
const BRAND_ASSET_KINDS = ["logo", "hero"];
const SERVICE_ASSET_KINDS = ["hero", "gallery", "documents"];
const WEB_ASSET_KINDS = ["home", "banners", "icons"];

function requireValue(value, fieldName) {
  if (!value) {
    const error = new Error(`${fieldName} es obligatorio.`);
    error.status = 400;
    throw error;
  }
  return value;
}

export function getLeadPhotoPath(leadId, filename) {
  return `leads/${normalizeIdentifier(requireValue(leadId, "leadId"), "leadId")}/fotos_cliente/${filename}`;
}

export function getQuotePdfPath(quoteNumber) {
  return `presupuestos/${normalizeIdentifier(requireValue(quoteNumber, "quoteNumber"), "quoteNumber")}/presupuesto.pdf`;
}

export function getQuotePhotoPath(quoteNumber, filename) {
  return `presupuestos/${normalizeIdentifier(requireValue(quoteNumber, "quoteNumber"), "quoteNumber")}/fotos/${filename}`;
}

export function getOrderDocumentPath(orderNumber, filename) {
  return `pedidos/${normalizeIdentifier(requireValue(orderNumber, "orderNumber"), "orderNumber")}/documentos/${filename}`;
}

export function getOrderInvoicePath(orderNumber) {
  return `pedidos/${normalizeIdentifier(requireValue(orderNumber, "orderNumber"), "orderNumber")}/factura.pdf`;
}

export function getInstallationPhotoPath(installationId, phase, filename) {
  const safePhase = validateKind(requireValue(phase, "phase"), INSTALLATION_PHASES, "phase");
  return `instalaciones/${normalizeIdentifier(requireValue(installationId, "installationId"), "installationId")}/${safePhase}/${filename}`;
}

export function getInstallationReportPath(installationId) {
  return `instalaciones/${normalizeIdentifier(requireValue(installationId, "installationId"), "installationId")}/reporte.pdf`;
}

export function getInstallationSignaturePath(installationId, filename) {
  return `instalaciones/${normalizeIdentifier(requireValue(installationId, "installationId"), "installationId")}/firma_cliente/${filename}`;
}

export function getClientDocumentPath(clientId, filename) {
  return `clientes/${normalizeIdentifier(requireValue(clientId, "clientId"), "clientId")}/documentos/${filename}`;
}

export function getPublicProductImagePath(brandSlug, productSlug, filename) {
  return `productos/${normalizeIdentifier(requireValue(brandSlug, "brandSlug"), "brandSlug")}/${normalizeIdentifier(requireValue(productSlug, "productSlug"), "productSlug")}/gallery/${filename}`;
}

export function getPublicProductMainImagePath(brandSlug, productSlug, filename) {
  return `productos/${normalizeIdentifier(requireValue(brandSlug, "brandSlug"), "brandSlug")}/${normalizeIdentifier(requireValue(productSlug, "productSlug"), "productSlug")}/main/${filename}`;
}

export function getPublicProductManualPath(brandSlug, productSlug, filename) {
  return `productos/${normalizeIdentifier(requireValue(brandSlug, "brandSlug"), "brandSlug")}/${normalizeIdentifier(requireValue(productSlug, "productSlug"), "productSlug")}/manuals/${filename}`;
}

export function getPublicProductDatasheetPath(brandSlug, productSlug, filename) {
  return `productos/${normalizeIdentifier(requireValue(brandSlug, "brandSlug"), "brandSlug")}/${normalizeIdentifier(requireValue(productSlug, "productSlug"), "productSlug")}/datasheets/${filename}`;
}

export function getPublicBrandAssetPath(brandSlug, kind, filename) {
  const safeKind = validateKind(requireValue(kind, "kind"), BRAND_ASSET_KINDS, "kind");
  return `marcas/${normalizeIdentifier(requireValue(brandSlug, "brandSlug"), "brandSlug")}/${safeKind}/${filename}`;
}

export function getPublicServiceAssetPath(serviceSlug, kind, filename) {
  const safeKind = validateKind(requireValue(kind, "kind"), SERVICE_ASSET_KINDS, "kind");
  return `servicios/${normalizeIdentifier(requireValue(serviceSlug, "serviceSlug"), "serviceSlug")}/${safeKind}/${filename}`;
}

export function getPublicWebAssetPath(kind, filename) {
  const safeKind = validateKind(kind || "home", WEB_ASSET_KINDS, "kind");
  return `web/${safeKind}/${filename}`;
}

export function getPublicBrandingAssetPath(kind, filename) {
  return `branding/${normalizeIdentifier(kind || "general", "kind")}/${filename}`;
}

export function getTempUploadPath(filename) {
  return `temp/uploads/${filename}`;
}

export function getTempPdfPath(filename) {
  return `temp/pdf_generados/${filename}`;
}

export function resolveStoragePath({ type, filename, mimeType, fields = {} }) {
  switch (type) {
    case "public_web_asset":
      return { visibility: "public", entityType: "web", objectPath: getPublicWebAssetPath(fields.kind, filename) };
    case "public_product_image":
      return {
        visibility: "public",
        entityType: "product",
        objectPath: fields.kind === "main"
          ? getPublicProductMainImagePath(fields.brandSlug, fields.productSlug, filename)
          : getPublicProductImagePath(fields.brandSlug, fields.productSlug, filename),
      };
    case "public_product_manual":
      return { visibility: "public", entityType: "product", objectPath: getPublicProductManualPath(fields.brandSlug, fields.productSlug, filename) };
    case "public_product_datasheet":
      return { visibility: "public", entityType: "product", objectPath: getPublicProductDatasheetPath(fields.brandSlug, fields.productSlug, filename) };
    case "public_brand_asset":
      return { visibility: "public", entityType: "brand", objectPath: getPublicBrandAssetPath(fields.brandSlug, fields.kind, filename) };
    case "public_service_asset":
      return { visibility: "public", entityType: "service", objectPath: getPublicServiceAssetPath(fields.serviceSlug, fields.kind || "gallery", filename) };
    case "lead_photo":
      return { visibility: "private", entityType: "lead", objectPath: getLeadPhotoPath(fields.entityId || fields.leadId, filename) };
    case "quote_pdf":
      if (!isPdfMime(mimeType)) throw Object.assign(new Error("El presupuesto debe ser PDF."), { status: 400 });
      return { visibility: "private", entityType: "quote", objectPath: getQuotePdfPath(fields.quoteNumber || fields.entityId) };
    case "quote_photo":
      return { visibility: "private", entityType: "quote", objectPath: getQuotePhotoPath(fields.quoteNumber || fields.entityId, filename) };
    case "order_document":
      return { visibility: "private", entityType: "order", objectPath: getOrderDocumentPath(fields.orderNumber || fields.entityId, filename) };
    case "order_invoice":
      if (!isPdfMime(mimeType)) throw Object.assign(new Error("La factura debe ser PDF."), { status: 400 });
      return { visibility: "private", entityType: "order", objectPath: getOrderInvoicePath(fields.orderNumber || fields.entityId) };
    case "installation_photo":
      return { visibility: "private", entityType: "installation", objectPath: getInstallationPhotoPath(fields.installationId || fields.entityId, fields.phase, filename) };
    case "installation_report":
      if (!isPdfMime(mimeType)) throw Object.assign(new Error("El reporte debe ser PDF."), { status: 400 });
      return { visibility: "private", entityType: "installation", objectPath: getInstallationReportPath(fields.installationId || fields.entityId) };
    case "installation_signature":
      return { visibility: "private", entityType: "installation", objectPath: getInstallationSignaturePath(fields.installationId || fields.entityId, filename) };
    case "client_document":
      return { visibility: "private", entityType: "client", objectPath: getClientDocumentPath(fields.clientId || fields.entityId, filename) };
    case "temp_upload":
      return { visibility: "temp", entityType: "temp", objectPath: getTempUploadPath(filename) };
    default:
      throw Object.assign(new Error("Tipo de archivo no permitido."), { status: 400 });
  }
}
