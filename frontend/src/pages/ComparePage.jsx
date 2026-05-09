// src/pages/ComparePage.jsx
// Página dedicada a demostrar ventajas del grounding RAG vs LLM puro

import React, { useState } from "react";
import { queryWithRAG, queryWithoutRAG } from "../services/api";

const DEMO_QUESTIONS = [
  "¿Cuál es el precio exacto del BYD Atto 3?",
  "¿Cuántos segundos tarda el BYD Seal de 0 a 100 km/h?",
  "¿Qué vehículo tiene certificación IP67 de resistencia al agua?",
  "¿Cuál es la autonomía del Mercedes EQS?",
  "¿El IONIQ 6 tiene carga de 800V?",
];

function ResultPanel({ title, result, color, loading }) {
  return (
    <div style={{
      flex: 1, background: "var(--bg-card)",
      border: `1px solid ${color}30`,
      borderTop: `3px solid ${color}`,
      borderRadius: "var(--radius-lg)",
      padding: 20, minHeight: 300,
    }}>
      <div style={{
        fontSize: 11, fontWeight: 700, color,
        textTransform: "uppercase", letterSpacing: 1, marginBottom: 12,
      }}>{title}</div>

      {loading && (
        <div style={{ display: "flex", gap: 6, alignItems: "center", color: "var(--text-muted)" }}>
          <div style={{
            width: 14, height: 14, border: `2px solid ${color}`,
            borderTopColor: "transparent", borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }} />
          Generando respuesta...
        </div>
      )}

      {result && !loading && (
        <>
          <div style={{
            fontSize: 14, color: "var(--text-primary)", lineHeight: 1.65,
            marginBottom: result.sources?.length ? 16 : 0,
            whiteSpace: "pre-wrap",
          }}>
            {result.answer}
          </div>

          {result.warning && (
            <div style={{
              marginTop: 12, padding: "8px 12px",
              background: "#ff6b3510", border: "1px solid #ff6b3530",
              borderRadius: "var(--radius)", fontSize: 12, color: "#ff9966",
            }}>
              {result.warning}
            </div>
          )}

          {result.sources?.length > 0 && (
            <div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 8, textTransform: "uppercase" }}>
                📚 Documentos recuperados ({result.sources.length})
              </div>
              {result.sources.map((s, i) => (
                <div key={i} style={{
                  background: "var(--bg-panel)", border: "1px solid var(--border)",
                  borderRadius: "var(--radius)", padding: "8px 12px", marginBottom: 6,
                  fontSize: 12,
                }}>
                  <span style={{ color: color, fontWeight: 600 }}>{s.marca} {s.modelo}</span>
                  <span style={{ color: "var(--text-muted)", marginLeft: 8 }}>
                    · {(s.relevancia * 100).toFixed(0)}% similitud
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {!result && !loading && (
        <div style={{ color: "var(--text-muted)", fontSize: 13 }}>
          Haz una consulta para ver la respuesta aquí.
        </div>
      )}
    </div>
  );
}

export default function ComparePage() {
  const [question, setQuestion] = useState("");
  const [ragResult, setRagResult]   = useState(null);
  const [noRagResult, setNoRagResult] = useState(null);
  const [loadingRag, setLoadingRag]     = useState(false);
  const [loadingNoRag, setLoadingNoRag] = useState(false);

  const runComparison = async (q) => {
    const query = q || question;
    if (!query.trim()) return;
    setQuestion(query);
    setRagResult(null);
    setNoRagResult(null);

    // Lanzar ambas consultas en paralelo
    setLoadingRag(true);
    setLoadingNoRag(true);

    const [ragRes, noRagRes] = await Promise.allSettled([
      queryWithRAG(query),
      queryWithoutRAG(query),
    ]);

    if (ragRes.status === "fulfilled") setRagResult(ragRes.value);
    else setRagResult({ answer: `Error: ${ragRes.reason.message}`, sources: [] });
    setLoadingRag(false);

    if (noRagRes.status === "fulfilled") setNoRagResult(noRagRes.value);
    else setNoRagResult({ answer: `Error: ${noRagRes.reason.message}`, sources: [] });
    setLoadingNoRag(false);
  };

  return (
    <div style={{ padding: "24px 28px", height: "100%", overflowY: "auto" }}>

      {/* Cabecera */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{
          fontFamily: "var(--font-display)", fontSize: 32,
          color: "var(--text-primary)", letterSpacing: 1, marginBottom: 4,
        }}>
          COMPARATIVA <span style={{ color: "var(--accent)" }}>RAG vs LLM</span>
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
          Demuestra la diferencia entre grounding con catálogo real vs respuestas inventadas.
        </p>
      </div>

      {/* Explicación visual */}
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 40px 1fr",
        gap: 0, marginBottom: 28, alignItems: "center",
      }}>
        {[
          { icon: "🤖", title: "LLM Sin Grounding", desc: "El modelo responde con su memoria de entrenamiento. Puede inventar precios, especificaciones o modelos.", color: "var(--accent-warm)" },
          null,
          { icon: "⚡", title: "LLM + RAG (Grounding)", desc: "El modelo primero busca en el catálogo real, luego genera la respuesta basada SOLO en los documentos.", color: "var(--accent-green)" },
        ].map((item, i) =>
          item === null ? (
            <div key="vs" style={{ textAlign: "center", fontFamily: "var(--font-display)", fontSize: 24, color: "var(--text-muted)" }}>VS</div>
          ) : (
            <div key={i} style={{
              background: "var(--bg-card)", border: `1px solid ${item.color}30`,
              borderRadius: "var(--radius-lg)", padding: "16px 20px",
            }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>{item.icon}</div>
              <div style={{ fontWeight: 600, color: item.color, marginBottom: 6, fontSize: 14 }}>{item.title}</div>
              <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5 }}>{item.desc}</div>
            </div>
          )
        )}
      </div>

      {/* Input de consulta */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 10 }}>
          <input
            value={question}
            onChange={e => setQuestion(e.target.value)}
            onKeyDown={e => e.key === "Enter" && runComparison()}
            placeholder="Escribe una pregunta sobre algún vehículo..."
            style={{
              flex: 1, padding: "11px 16px",
              background: "var(--bg-input)", border: "1px solid var(--border)",
              borderRadius: "var(--radius)", color: "var(--text-primary)",
              fontSize: 14, outline: "none", fontFamily: "var(--font-body)",
            }}
          />
          <button
            onClick={() => runComparison()}
            disabled={loadingRag || loadingNoRag || !question.trim()}
            style={{
              padding: "0 24px",
              background: "var(--accent)", color: "#000",
              border: "none", borderRadius: "var(--radius)",
              fontWeight: 700, fontSize: 14, cursor: "pointer",
              opacity: loadingRag || !question.trim() ? 0.5 : 1,
              transition: "opacity 0.2s",
            }}
          >
            Comparar
          </button>
        </div>
      </div>

      {/* Preguntas de demo */}
      <div style={{ marginBottom: 28, display: "flex", flexWrap: "wrap", gap: 8 }}>
        <span style={{ fontSize: 11, color: "var(--text-muted)", alignSelf: "center" }}>Demo rápida:</span>
        {DEMO_QUESTIONS.map((q, i) => (
          <button
            key={i}
            onClick={() => runComparison(q)}
            style={{
              padding: "5px 12px", fontSize: 12,
              background: "var(--bg-card)", border: "1px solid var(--border)",
              borderRadius: 20, color: "var(--text-secondary)",
              cursor: "pointer", transition: "all 0.15s",
            }}
            onMouseEnter={e => { e.target.style.borderColor = "var(--accent-mid)"; e.target.style.color = "var(--accent)"; }}
            onMouseLeave={e => { e.target.style.borderColor = "var(--border)"; e.target.style.color = "var(--text-secondary)"; }}
          >
            {q}
          </button>
        ))}
      </div>

      {/* Paneles de resultados en paralelo */}
      <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
        <ResultPanel
          title="⚠️ Sin Grounding (LLM puro)"
          result={noRagResult}
          loading={loadingNoRag}
          color="var(--accent-warm)"
        />
        <ResultPanel
          title="⚡ Con Grounding RAG"
          result={ragResult}
          loading={loadingRag}
          color="var(--accent-green)"
        />
      </div>
    </div>
  );
}
