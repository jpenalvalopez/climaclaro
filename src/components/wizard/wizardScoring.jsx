/**
 * Scoring de recomendación de productos basado en respuestas del wizard.
 * Soporta modo single-room y multi-room (rooms_data).
 */

const AREA_TARGET = { "10-20": 15, "20-30": 25, "30-40": 35, "40+": 45 };
const KNOWN_BRANDS = ["daikin", "mitsubishi", "lg", "samsung", "fujitsu", "panasonic", "toshiba"];

export function scoreProducts(products, answers, maxRecommendations = 3) {
  const activeProducts = products.filter(p => p.active !== false && (p.stock === undefined || p.stock > 0));

  const roomsData = answers.rooms_data || [];
  const roomCount = roomsData.length > 0 ? roomsData.length : parseInt(answers.rooms || "1", 10);
  const prefs = Array.isArray(answers.preferences) ? answers.preferences : [];

  // Categorías preferidas según número de estancias
  let preferredCategories = [];
  if (roomCount <= 1) preferredCategories = ["monosplit"];
  else if (roomCount === 2) preferredCategories = ["multisplit", "monosplit"];
  else preferredCategories = ["multisplit", "conductos"];

  // Área representativa: mayor estancia si hay rooms_data, si no la única
  let areaVal = answers.area || answers.area_m2 || "20-30";
  let totalAreaTarget = 0;

  if (roomsData.length > 0) {
    // Estancia más grande para dimensionar la unidad exterior
    const areaValues = roomsData.map(r => AREA_TARGET[r.area_m2] || 25);
    const largestArea = Math.max(...areaValues);
    totalAreaTarget = areaValues.reduce((sum, v) => sum + v, 0);
    areaVal = Object.entries(AREA_TARGET).find(([, v]) => v === largestArea)?.[0] || "20-30";
  }

  const areaTarget = AREA_TARGET[areaVal] || 25;

  // Sol: si hay rooms_data, tomar el peor caso (más sol)
  const sunVal = roomsData.length > 0
    ? (roomsData.some(r => r.sun_exposure === "mucho") ? "mucho"
      : roomsData.some(r => r.sun_exposure === "medio") ? "medio" : "poco")
    : (answers.sun || "medio");

  const sunMultiplier = sunVal === "mucho" ? 1.2 : sunVal === "medio" ? 1.0 : 0.85;

  const scored = activeProducts.map(p => {
    let score = 0;

    // Categoría preferida
    if (preferredCategories[0] === p.category) score += 40;
    else if (preferredCategories.includes(p.category)) score += 20;

    // Proximidad de área (ajustada por sol)
    if (p.area_min_m2 && p.area_max_m2) {
      const midArea = (p.area_min_m2 + p.area_max_m2) / 2;
      const adjustedTarget = areaTarget * sunMultiplier;
      const dist = Math.abs(midArea - adjustedTarget);
      score += Math.max(0, 30 - dist);
    }

    // Preferencias
    if (prefs.includes("wifi") && p.has_wifi) score += 15;
    if (prefs.includes("eficiencia") && ["A+++", "A++"].includes(p.energy_rating)) score += 15;
    if (prefs.includes("presupuesto")) score -= (p.price || 0) / 100;
    if (prefs.includes("marca") && KNOWN_BRANDS.includes((p.brand || "").toLowerCase())) score += 10;
    if (prefs.includes("silencio") && p.noise_db && p.noise_db < 25) score += 10;

    // Destacados
    if (p.is_featured) score += 5;
    if (p.is_top_seller) score += 5;

    return { ...p, _score: score };
  });

  return scored
    .sort((a, b) => b._score - a._score)
    .slice(0, maxRecommendations);
}

/** Metadatos útiles para mostrar en el resultado */
export function getWizardSummary(answers) {
  const roomsData = answers.rooms_data || [];
  const roomCount = roomsData.length > 0 ? roomsData.length : parseInt(answers.rooms || "1", 10);

  let totalArea = 0;
  let largestArea = 0;
  if (roomsData.length > 0) {
    const vals = roomsData.map(r => AREA_TARGET[r.area_m2] || 25);
    totalArea = vals.reduce((s, v) => s + v, 0);
    largestArea = Math.max(...vals);
  }

  const recommendation =
    roomCount === 1 ? "Split individual" :
    roomCount === 2 ? "Multisplit 2×1" :
    roomCount >= 3 ? "Multisplit o conductos" : "Split individual";

  return { roomCount, totalArea, largestArea, recommendation };
}