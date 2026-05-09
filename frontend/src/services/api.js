// src/services/api.js
// Servicio centralizado para todas las llamadas al backend Flask

import axios from "axios";

const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 60000, // 60s — el LLM puede tardar en responder
  headers: { "Content-Type": "application/json" },
});

// ── Consultas RAG ─────────────────────────────────────────────────────────────

/** Consulta con RAG (grounding sobre el catálogo real) */
export const queryWithRAG = async (question) => {
  const { data } = await client.post("/query", { question });
  return data;
};

/** Consulta directa al LLM sin grounding (para comparativa) */
export const queryWithoutRAG = async (question) => {
  const { data } = await client.post("/query-no-rag", { question });
  return data;
};

// ── Catálogo ──────────────────────────────────────────────────────────────────

/** Obtiene todos los vehículos del catálogo */
export const getCatalog = async () => {
  const { data } = await client.get("/catalog");
  return data;
};

/** Filtra el catálogo */
export const filterCatalog = async ({ marca, tipo, precioMin, precioMax }) => {
  const params = new URLSearchParams();
  if (marca)    params.append("marca", marca);
  if (tipo)     params.append("tipo", tipo);
  if (precioMin) params.append("precio_min", precioMin);
  if (precioMax) params.append("precio_max", precioMax);
  const { data } = await client.get(`/catalog/filter?${params}`);
  return data;
};

/** Estadísticas del catálogo */
export const getCatalogStats = async () => {
  const { data } = await client.get("/catalog/stats");
  return data;
};

/** Health check del backend */
export const healthCheck = async () => {
  const { data } = await client.get("/health");
  return data;
};
