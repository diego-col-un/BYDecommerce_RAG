// src/components/VehicleCard.jsx

import React, { useState } from "react";

const formatCOP = (n) => `$${Number(n).toLocaleString("es-CO")} COP`;

const StatPill = ({ label, value, highlight }) => (
  <div style={{
    display: "flex", flexDirection: "column", alignItems: "center",
    padding: "8px 12px",
    background: highlight ? "var(--accent-dim)" : "var(--bg-panel)",
    border: `1px solid ${highlight ? "var(--accent-mid)" : "var(--border)"}`,
    borderRadius: "var(--radius)",
    minWidth: 70,
  }}>
    <span style={{
      fontSize: 16, fontWeight: 700,
      color: highlight ? "var(--accent)" : "var(--text-primary)",
      fontFamily: "var(--font-display)", letterSpacing: 0.5,
    }}>{value}</span>
    <span style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.5, marginTop: 1 }}>
      {label}
    </span>
  </div>
);

const Badge = ({ text, color = "var(--accent)" }) => (
  <span style={{
    padding: "2px 8px", borderRadius: 20,
    background: color + "15", border: `1px solid ${color}40`,
    color, fontSize: 11, fontWeight: 600,
  }}>{text}</span>
);

export default function VehicleCard({ vehicle }) {
  const [expanded, setExpanded] = useState(false);

  const getBrandColor = (marca) => {
    const colors = {
      BYD: "var(--accent)",
      Tesla: "#e82127",
      Hyundai: "#002c5f",
      Kia: "#bb162b",
      Renault: "#efdf00",
      Volkswagen: "#001e50",
      Chevrolet: "#f7c80a",
      Porsche: "#9b1c20",
      BMW: "#0066cc",
      Mercedes: "#c0c0c0",
      Audi: "#bb0a30",
    };
    return colors[marca] || "var(--accent)";
  };

  const brandColor = getBrandColor(vehicle.marca);

  return (
    <div style={{
      background: "var(--bg-card)",
      border: "1px solid var(--border)",
      borderTop: `3px solid ${brandColor}`,
      borderRadius: "var(--radius-lg)",
      overflow: "hidden",
      transition: "all 0.25s ease",
      animation: "fadeUp 0.4s ease forwards",
    }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = "translateY(-3px)";
        e.currentTarget.style.boxShadow = `0 8px 32px ${brandColor}20`;
        e.currentTarget.style.borderColor = `${brandColor}60`;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
        e.currentTarget.style.borderColor = "var(--border)";
      }}
    >
      {/* Cabecera */}
      <div style={{ padding: "16px 18px 12px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
          <div>
            <div style={{
              fontSize: 11, fontWeight: 700, color: brandColor,
              textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 2,
            }}>{vehicle.marca}</div>
            <div style={{
              fontSize: 20, fontFamily: "var(--font-display)",
              color: "var(--text-primary)", letterSpacing: 0.5, lineHeight: 1.1,
            }}>
              {vehicle.modelo} <span style={{ color: "var(--text-muted)", fontFamily: "var(--font-body)", fontSize: 14 }}>{vehicle.año}</span>
            </div>
          </div>
          <Badge text={vehicle.tipo.split(" ")[0]} color={brandColor} />
        </div>

        {/* Precio */}
        <div style={{
          fontSize: 18, fontWeight: 700, color: "var(--text-primary)",
          marginTop: 8,
        }}>
          {formatCOP(vehicle.precio_cop)}
          <span style={{ fontSize: 13, color: "var(--text-secondary)", fontWeight: 400, marginLeft: 8 }}>
            / ${Number(vehicle.precio_usd).toLocaleString()} USD
          </span>
        </div>
      </div>

      {/* Stats principales */}
      <div style={{
        display: "flex", gap: 8, padding: "0 18px 14px",
        overflowX: "auto", flexWrap: "wrap",
      }}>
        <StatPill label="Autonomía" value={`${vehicle.autonomia_km}km`} highlight />
        <StatPill label="0-100" value={`${vehicle.aceleracion_0_100}s`} />
        <StatPill label="Potencia" value={`${vehicle.potencia_hp}HP`} />
        <StatPill label="Batería" value={`${vehicle.bateria_kwh}kWh`} />
        <StatPill label="Carga DC" value={`${vehicle.carga_rapida_min}min`} />
      </div>

      {/* Detalles expandibles */}
      <div style={{ borderTop: "1px solid var(--border)" }}>
        <button
          onClick={() => setExpanded(!expanded)}
          style={{
            width: "100%", padding: "10px 18px",
            background: "transparent", border: "none",
            color: "var(--text-secondary)", fontSize: 12,
            cursor: "pointer", display: "flex", justifyContent: "space-between",
            alignItems: "center", transition: "color 0.2s",
          }}
          onMouseEnter={e => e.currentTarget.style.color = "var(--accent)"}
          onMouseLeave={e => e.currentTarget.style.color = "var(--text-secondary)"}
        >
          <span>Ver especificaciones completas</span>
          <span style={{ transform: expanded ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }}>▾</span>
        </button>

        {expanded && (
          <div style={{ padding: "0 18px 16px", animation: "fadeUp 0.2s ease" }}>
            {/* Specs adicionales */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 16px", marginBottom: 12 }}>
              {[
                ["Motor", vehicle.motor],
                ["Torque", `${vehicle.torque_nm} Nm`],
                ["Tracción", vehicle.traccion],
                ["Vel. máx", `${vehicle.velocidad_max_kmh} km/h`],
                ["Pasajeros", vehicle.pasajeros],
                ["Maletero", `${vehicle.maletero_litros} L`],
                ["Pantalla", `${vehicle.pantalla_pulgadas}"`],
                ["Garantía", `${vehicle.garantia_años} años`],
                ["Gtía batería", `${vehicle.garantia_bateria_años} años`],
                ["ADAS", vehicle.tecnologia_conduccion],
              ].map(([k, v]) => (
                <div key={k} style={{ fontSize: 12 }}>
                  <span style={{ color: "var(--text-muted)" }}>{k}: </span>
                  <span style={{ color: "var(--text-secondary)", fontWeight: 500 }}>{v}</span>
                </div>
              ))}
            </div>

            {/* Features con íconos */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
              {vehicle.camara_360 === "Sí" && <Badge text="📷 Cámara 360°" color="var(--accent-green)" />}
              {vehicle.techo_panoramico === "Sí" && <Badge text="☀️ Techo panorámico" color="var(--accent-green)" />}
              {vehicle.asientos_electricos === "Sí" && <Badge text="💺 Asientos eléctricos" color="var(--accent-green)" />}
            </div>

            {/* Descripción */}
            <p style={{
              fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6,
              borderLeft: `2px solid ${brandColor}40`, paddingLeft: 10,
            }}>
              {vehicle.descripcion}
            </p>

            {/* Colores */}
            <div style={{ marginTop: 10, fontSize: 12, color: "var(--text-muted)" }}>
              🎨 {vehicle.color_disponibles}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
