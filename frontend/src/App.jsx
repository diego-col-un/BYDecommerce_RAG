// src/App.jsx
// Layout principal con sidebar y navegación entre páginas

import React, { useState, useEffect } from "react";
import ChatBot from "./components/ChatBot";
import CatalogPage from "./pages/CatalogPage";
import ComparePage from "./pages/ComparePage";
import { healthCheck } from "./services/api";

const NAV_ITEMS = [
  { id: "chat",    label: "Asistente IA",  icon: "💬", desc: "Chat con RAG" },
  { id: "catalog", label: "Catálogo",       icon: "🚗", desc: "Ver vehículos" },
  { id: "compare", label: "Comparativa",    icon: "⚖️",  desc: "RAG vs LLM" },
];

function StatusDot({ ok }) {
  return (
    <span style={{
      display: "inline-block", width: 8, height: 8, borderRadius: "50%",
      background: ok === null ? "var(--text-muted)" : ok ? "var(--accent-green)" : "#ff4444",
      boxShadow: ok ? "0 0 8px var(--accent-green)" : "none",
      animation: ok ? "pulse-glow 2s infinite" : "none",
    }} />
  );
}

export default function App() {
  const [page, setPage]       = useState("chat");
  const [backendOk, setBackendOk] = useState(null);

  useEffect(() => {
    healthCheck()
      .then(() => setBackendOk(true))
      .catch(() => setBackendOk(false));
  }, []);

  return (
    <div style={{
      display: "flex", height: "100vh", overflow: "hidden",
      background: "var(--bg-void)",
    }}>

      {/* ── Sidebar ── */}
      <aside style={{
        width: 220, flexShrink: 0,
        background: "var(--bg-panel)",
        borderRight: "1px solid var(--border)",
        display: "flex", flexDirection: "column",
        padding: "0 0 20px",
      }}>

        {/* Logo */}
        <div style={{
          padding: "22px 20px 18px",
          borderBottom: "1px solid var(--border)",
          marginBottom: 8,
        }}>
          <div style={{
            fontFamily: "var(--font-display)", fontSize: 22,
            color: "var(--text-primary)", letterSpacing: 2, lineHeight: 1,
          }}>
            AUTO<span style={{ color: "var(--accent)" }}>ELECTRIC</span>
          </div>
          <div style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: 1, marginTop: 3 }}>
            AI · RAG CATALOG
          </div>
        </div>

        {/* Navegación */}
        <nav style={{ flex: 1, padding: "8px 10px" }}>
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => setPage(item.id)}
              style={{
                width: "100%", padding: "11px 14px",
                borderRadius: "var(--radius)",
                background: page === item.id ? "var(--accent-dim)" : "transparent",
                border: "1px solid",
                borderColor: page === item.id ? "var(--accent-mid)" : "transparent",
                color: page === item.id ? "var(--accent)" : "var(--text-secondary)",
                display: "flex", alignItems: "center", gap: 10,
                cursor: "pointer", textAlign: "left",
                marginBottom: 4, transition: "all 0.15s",
              }}
              onMouseEnter={e => {
                if (page !== item.id) {
                  e.currentTarget.style.background = "var(--bg-card)";
                  e.currentTarget.style.color = "var(--text-primary)";
                }
              }}
              onMouseLeave={e => {
                if (page !== item.id) {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "var(--text-secondary)";
                }
              }}
            >
              <span style={{ fontSize: 16 }}>{item.icon}</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1 }}>{item.label}</div>
                <div style={{ fontSize: 10, opacity: 0.6, marginTop: 2 }}>{item.desc}</div>
              </div>
            </button>
          ))}
        </nav>

        {/* Estado del backend */}
        <div style={{
          margin: "0 10px",
          padding: "10px 14px",
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius)",
          fontSize: 11,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <StatusDot ok={backendOk} />
            <span style={{ color: backendOk ? "var(--accent-green)" : backendOk === null ? "var(--text-muted)" : "#ff6666", fontWeight: 600 }}>
              {backendOk === null ? "Conectando..." : backendOk ? "Backend OK" : "Backend offline"}
            </span>
          </div>
          <div style={{ color: "var(--text-muted)", lineHeight: 1.4 }}>
            <div>🤖 Llama 3.1 8B</div>
            <div>⚡ LlamaIndex + FAISS</div>
            <div>🔤 Multilingual MPNET</div>
          </div>
        </div>

        {/* Info del proyecto */}
        <div style={{ padding: "12px 20px 0", fontSize: 10, color: "var(--text-muted)", lineHeight: 1.5 }}>
          Proyecto LLM Grounding<br/>
          Flask · React · OpenRouter<br/>
          RAG con catálogo de vehículos
        </div>
      </aside>

      {/* ── Contenido principal ── */}
      <main style={{
        flex: 1, overflow: "hidden",
        display: "flex", flexDirection: "column",
      }}>

        {/* Header */}
        <header style={{
          padding: "0 28px",
          height: 56,
          borderBottom: "1px solid var(--border)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          background: "var(--bg-panel)",
          flexShrink: 0,
        }}>
          <div>
            <span style={{ fontFamily: "var(--font-display)", fontSize: 18, color: "var(--text-primary)", letterSpacing: 0.5 }}>
              {NAV_ITEMS.find(n => n.id === page)?.icon}{" "}
              {NAV_ITEMS.find(n => n.id === page)?.label}
            </span>
          </div>
          <div style={{ display: "flex", gap: 20, fontSize: 12, color: "var(--text-muted)" }}>
            <span>20 vehículos indexados</span>
            <span>·</span>
            <span>OpenRouter API</span>
            <span>·</span>
            <span>FAISS Vector Store</span>
          </div>
        </header>

        {/* Página activa */}
        <div style={{ flex: 1, overflow: "hidden" }}>
          {page === "chat"    && <div style={{ height: "100%", display: "flex", flexDirection: "column" }}><ChatBot /></div>}
          {page === "catalog" && <CatalogPage />}
          {page === "compare" && <ComparePage />}
        </div>
      </main>
    </div>
  );
}
