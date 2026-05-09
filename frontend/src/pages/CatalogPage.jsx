// src/pages/CatalogPage.jsx

import React, { useState, useEffect } from "react";
import VehicleCard from "../components/VehicleCard";
import { getCatalog, filterCatalog } from "../services/api";

const FilterBtn = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    style={{
      padding: "5px 14px", borderRadius: 20,
      border: "1px solid",
      borderColor: active ? "var(--accent-mid)" : "var(--border)",
      background: active ? "var(--accent-dim)" : "transparent",
      color: active ? "var(--accent)" : "var(--text-secondary)",
      fontSize: 12, fontWeight: 600, cursor: "pointer",
      transition: "all 0.15s",
    }}
  >
    {children}
  </button>
);

export default function CatalogPage() {
  const [vehicles, setVehicles]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [search, setSearch]       = useState("");
  const [marcaFilter, setMarcaFilter] = useState("");
  const [tipoFilter, setTipoFilter]   = useState("");

  const MARCAS = ["BYD", "Tesla", "Hyundai", "Kia", "Renault", "Volkswagen", "Chevrolet", "Porsche", "BMW", "Mercedes", "Audi"];
  const TIPOS  = ["SUV", "Sedán", "Hatchback", "Crossover"];

  const fetchVehicles = async (marca = "", tipo = "") => {
    setLoading(true);
    setError(null);
    try {
      const result = marca || tipo
        ? await filterCatalog({ marca, tipo })
        : await getCatalog();
      setVehicles(result.vehicles || []);
    } catch (e) {
      setError("No se pudo cargar el catálogo. ¿Está el backend corriendo?");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchVehicles(); }, []);

  const handleMarca = (m) => {
    const newMarca = marcaFilter === m ? "" : m;
    setMarcaFilter(newMarca);
    fetchVehicles(newMarca, tipoFilter);
  };

  const handleTipo = (t) => {
    const newTipo = tipoFilter === t ? "" : t;
    setTipoFilter(newTipo);
    fetchVehicles(marcaFilter, newTipo);
  };

  const filtered = vehicles.filter(v =>
    search === "" ||
    `${v.marca} ${v.modelo} ${v.tipo}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ padding: "24px 28px", height: "100%", overflowY: "auto" }}>

      {/* Cabecera */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{
          fontFamily: "var(--font-display)", fontSize: 32,
          color: "var(--text-primary)", letterSpacing: 1, marginBottom: 4,
        }}>
          CATÁLOGO <span style={{ color: "var(--accent)" }}>ELÉCTRICO</span>
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
          {vehicles.length} vehículos disponibles · Base de conocimiento del asistente RAG
        </p>
      </div>

      {/* Búsqueda */}
      <div style={{ marginBottom: 16 }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por marca, modelo o tipo..."
          style={{
            width: "100%", padding: "10px 16px",
            background: "var(--bg-input)", border: "1px solid var(--border)",
            borderRadius: "var(--radius)", color: "var(--text-primary)",
            fontSize: 14, outline: "none", fontFamily: "var(--font-body)",
            transition: "border-color 0.2s",
          }}
          onFocus={e => e.target.style.borderColor = "var(--accent-mid)"}
          onBlur={e => e.target.style.borderColor = "var(--border)"}
        />
      </div>

      {/* Filtros por marca */}
      <div style={{ marginBottom: 10, display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
        <span style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.5 }}>Marca:</span>
        {MARCAS.map(m => (
          <FilterBtn key={m} active={marcaFilter === m} onClick={() => handleMarca(m)}>{m}</FilterBtn>
        ))}
      </div>

      {/* Filtros por tipo */}
      <div style={{ marginBottom: 24, display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
        <span style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.5 }}>Tipo:</span>
        {TIPOS.map(t => (
          <FilterBtn key={t} active={tipoFilter === t} onClick={() => handleTipo(t)}>{t}</FilterBtn>
        ))}
        {(marcaFilter || tipoFilter) && (
          <FilterBtn active={false} onClick={() => { setMarcaFilter(""); setTipoFilter(""); fetchVehicles(); }}>
            ✕ Limpiar filtros
          </FilterBtn>
        )}
      </div>

      {/* Grid de vehículos */}
      {loading && (
        <div style={{ textAlign: "center", padding: 60, color: "var(--text-muted)" }}>
          <div style={{
            width: 32, height: 32, border: "2px solid var(--accent)",
            borderTopColor: "transparent", borderRadius: "50%",
            animation: "spin 0.8s linear infinite", margin: "0 auto 12px",
          }} />
          Cargando catálogo...
        </div>
      )}

      {error && (
        <div style={{
          padding: 24, background: "#ff333310", border: "1px solid #ff333340",
          borderRadius: "var(--radius-lg)", color: "#ff6666", textAlign: "center",
        }}>
          {error}
        </div>
      )}

      {!loading && !error && (
        <>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 16 }}>
            Mostrando {filtered.length} vehículo{filtered.length !== 1 ? "s" : ""}
          </div>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: 20,
          }}>
            {filtered.map((v, i) => (
              <div key={v.id} style={{ animationDelay: `${i * 0.05}s` }}>
                <VehicleCard vehicle={v} />
              </div>
            ))}
          </div>
          {filtered.length === 0 && (
            <div style={{ textAlign: "center", padding: 60, color: "var(--text-muted)" }}>
              No se encontraron vehículos con estos filtros.
            </div>
          )}
        </>
      )}
    </div>
  );
}
