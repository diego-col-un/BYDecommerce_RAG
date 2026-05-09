// src/components/ChatBot.jsx
// Chat principal con modo RAG activado/desactivado para comparativa

import React, { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { queryWithRAG, queryWithoutRAG } from "../services/api";

const SUGGESTIONS = [
  "¿Cuál es el BYD más económico del catálogo?",
  "Compara el BYD Han vs el Tesla Model 3",
  "¿Qué vehículo tiene mayor autonomía?",
  "¿Cuál SUV eléctrico tiene 7 plazas?",
  "¿Qué modelo carga más rápido de 10% a 80%?",
  "Recomiéndame un eléctrico por menos de $150 millones",
];

function TypingDots() {
  return (
    <div style={{ display: "flex", gap: 4, alignItems: "center", padding: "4px 0" }}>
      {[0, 1, 2].map(i => (
        <span key={i} style={{
          width: 6, height: 6, borderRadius: "50%",
          background: "var(--accent)",
          animation: `blink 1.2s ease-in-out ${i * 0.2}s infinite`,
          display: "inline-block",
        }} />
      ))}
    </div>
  );
}

function SourceCard({ source, index }) {
  return (
    <div style={{
      background: "var(--bg-panel)",
      border: "1px solid var(--border)",
      borderLeft: "3px solid var(--accent)",
      borderRadius: "var(--radius)",
      padding: "10px 14px",
      marginTop: 6,
      animation: "slide-in 0.3s ease forwards",
      animationDelay: `${index * 0.08}s`,
      opacity: 0,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <span style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: 13 }}>
          {source.marca} {source.modelo} {source.año}
        </span>
        <span style={{
          fontSize: 11, color: "var(--accent)", background: "var(--accent-dim)",
          padding: "2px 8px", borderRadius: 20, fontWeight: 600,
        }}>
          {(source.relevancia * 100).toFixed(0)}% relevante
        </span>
      </div>
      <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>
        {source.tipo} · ${source.precio_cop?.toLocaleString("es-CO")} COP
      </div>
    </div>
  );
}

function Message({ msg }) {
  const isUser = msg.role === "user";
  const isError = msg.role === "error";

  return (
    <div style={{
      display: "flex",
      justifyContent: isUser ? "flex-end" : "flex-start",
      marginBottom: 20,
      animation: "fadeUp 0.3s ease forwards",
    }}>
      {!isUser && (
        <div style={{
          width: 32, height: 32, borderRadius: "50%",
          background: isError ? "#ff3333" : "linear-gradient(135deg, var(--accent) 0%, #0090cc 100%)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 14, fontWeight: 700, color: "#000",
          flexShrink: 0, marginRight: 10, marginTop: 2,
          boxShadow: isError ? "0 0 12px #ff333340" : "0 0 12px var(--accent-mid)",
        }}>
          {isError ? "!" : "AI"}
        </div>
      )}

      <div style={{ maxWidth: "78%", minWidth: 60 }}>
        {/* Badge de modo */}
        {msg.mode && (
          <div style={{
            fontSize: 10, fontWeight: 700, letterSpacing: 1,
            color: msg.mode.includes("RAG") && !msg.mode.includes("sin") ? "var(--accent-green)" : "var(--accent-warm)",
            marginBottom: 4,
            textTransform: "uppercase",
          }}>
            {msg.mode.includes("RAG") && !msg.mode.includes("sin") ? "⚡ Con Grounding RAG" : "⚠️ Sin Grounding"}
          </div>
        )}

        {/* Burbuja del mensaje */}
        <div style={{
          background: isUser ? "linear-gradient(135deg, #00d4ff20, #0090cc20)" : "var(--bg-card)",
          border: isUser
            ? "1px solid var(--accent-mid)"
            : isError
              ? "1px solid #ff333340"
              : "1px solid var(--border)",
          borderRadius: isUser ? "16px 16px 4px 16px" : "4px 16px 16px 16px",
          padding: "12px 16px",
          color: isError ? "#ff6666" : "var(--text-primary)",
          fontSize: 14,
          lineHeight: 1.65,
        }}>
          {msg.loading ? <TypingDots /> : (
            <div className="markdown-body">
              <ReactMarkdown>{msg.content}</ReactMarkdown>
            </div>
          )}
        </div>

        {/* Warning sin RAG */}
        {msg.warning && (
          <div style={{
            marginTop: 6, fontSize: 11, color: "var(--accent-warm)",
            background: "#ff6b3510", border: "1px solid #ff6b3530",
            borderRadius: "var(--radius)", padding: "6px 10px",
          }}>
            {msg.warning}
          </div>
        )}

        {/* Fuentes RAG */}
        {msg.sources && msg.sources.length > 0 && (
          <div style={{ marginTop: 8 }}>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>
              📚 Fuentes del catálogo ({msg.sources.length})
            </div>
            {msg.sources.map((s, i) => <SourceCard key={i} source={s} index={i} />)}
          </div>
        )}
      </div>

      {isUser && (
        <div style={{
          width: 32, height: 32, borderRadius: "50%",
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 14, flexShrink: 0, marginLeft: 10, marginTop: 2,
        }}>
          👤
        </div>
      )}
    </div>
  );
}

export default function ChatBot() {
  const [messages, setMessages] = useState([{
    role: "assistant",
    content: "¡Bienvenido a **AutoElectric AI** 🚗⚡\n\nSoy tu asesor inteligente de vehículos eléctricos. Consulta especificaciones, compara modelos, pregunta por precios y autonomía — todo respaldado por nuestro catálogo real.\n\n¿En qué te puedo ayudar hoy?",
    mode: null,
  }]);
  const [input, setInput]     = useState("");
  const [ragMode, setRagMode] = useState(true);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text) => {
    const question = (text || input).trim();
    if (!question || loading) return;

    setInput("");
    setLoading(true);

    // Agregar mensaje del usuario
    setMessages(prev => [...prev, { role: "user", content: question }]);

    // Placeholder "escribiendo..."
    const loadingId = Date.now();
    setMessages(prev => [...prev, { role: "assistant", content: "", loading: true, id: loadingId }]);

    try {
      const result = ragMode
        ? await queryWithRAG(question)
        : await queryWithoutRAG(question);

      setMessages(prev => prev.map(m =>
        m.id === loadingId
          ? {
              role: "assistant",
              content: result.answer,
              mode: result.mode,
              sources: result.sources || [],
              warning: result.warning,
            }
          : m
      ));
    } catch (err) {
      setMessages(prev => prev.map(m =>
        m.id === loadingId
          ? { role: "error", content: `Error al consultar el servidor: ${err.message}\n\nAsegúrate de que el backend Flask esté corriendo en puerto 5000.` }
          : m
      ));
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", position: "relative" }}>

      {/* Toggle RAG / Sin RAG */}
      <div style={{
        padding: "12px 20px",
        borderBottom: "1px solid var(--border)",
        display: "flex", alignItems: "center", gap: 12,
        background: "var(--bg-panel)",
        flexShrink: 0,
      }}>
        <span style={{ fontSize: 12, color: "var(--text-secondary)", fontWeight: 500 }}>Modo de respuesta:</span>
        <div style={{ display: "flex", gap: 8 }}>
          {[true, false].map(mode => (
            <button
              key={String(mode)}
              onClick={() => setRagMode(mode)}
              style={{
                padding: "5px 14px",
                borderRadius: 20,
                border: "1px solid",
                borderColor: ragMode === mode ? (mode ? "var(--accent-green)" : "var(--accent-warm)") : "var(--border)",
                background: ragMode === mode ? (mode ? "#00ff8815" : "#ff6b3515") : "transparent",
                color: ragMode === mode ? (mode ? "var(--accent-green)" : "var(--accent-warm)") : "var(--text-muted)",
                fontSize: 12, fontWeight: 600, cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              {mode ? "⚡ Con RAG (catálogo real)" : "⚠️ Sin RAG (LLM solo)"}
            </button>
          ))}
        </div>
        {!ragMode && (
          <span style={{ fontSize: 11, color: "var(--accent-warm)", marginLeft: "auto" }}>
            Modo comparativa: puede generar información inventada
          </span>
        )}
      </div>

      {/* Historial de mensajes */}
      <div style={{
        flex: 1, overflowY: "auto",
        padding: "24px 20px",
      }}>
        {messages.map((msg, i) => <Message key={i} msg={msg} />)}
        <div ref={bottomRef} />
      </div>

      {/* Sugerencias rápidas */}
      {messages.length < 3 && (
        <div style={{
          padding: "0 20px 12px",
          display: "flex", flexWrap: "wrap", gap: 8,
        }}>
          {SUGGESTIONS.map((s, i) => (
            <button
              key={i}
              onClick={() => sendMessage(s)}
              disabled={loading}
              style={{
                padding: "6px 12px",
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: 20,
                color: "var(--text-secondary)",
                fontSize: 12, cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={e => {
                e.target.style.borderColor = "var(--accent-mid)";
                e.target.style.color = "var(--accent)";
              }}
              onMouseLeave={e => {
                e.target.style.borderColor = "var(--border)";
                e.target.style.color = "var(--text-secondary)";
              }}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div style={{
        padding: "12px 20px 20px",
        borderTop: "1px solid var(--border)",
        background: "var(--bg-panel)",
        flexShrink: 0,
      }}>
        <div style={{
          display: "flex", gap: 10, alignItems: "flex-end",
          background: "var(--bg-input)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)",
          padding: "10px 14px",
          transition: "border-color 0.2s",
        }}
          onFocusCapture={e => e.currentTarget.style.borderColor = "var(--accent-mid)"}
          onBlurCapture={e => e.currentTarget.style.borderColor = "var(--border)"}
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Pregunta sobre cualquier vehículo del catálogo..."
            rows={1}
            style={{
              flex: 1, background: "transparent", border: "none", outline: "none",
              color: "var(--text-primary)", fontSize: 14, resize: "none",
              fontFamily: "var(--font-body)", lineHeight: 1.5,
              maxHeight: 120, overflowY: "auto",
            }}
            onInput={e => {
              e.target.style.height = "auto";
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
            }}
          />
          <button
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
            style={{
              width: 36, height: 36, borderRadius: "50%",
              background: loading || !input.trim() ? "var(--border)" : "var(--accent)",
              border: "none", cursor: loading || !input.trim() ? "default" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0, transition: "all 0.2s",
              boxShadow: !loading && input.trim() ? "0 0 12px var(--accent-mid)" : "none",
            }}
          >
            {loading ? (
              <div style={{
                width: 14, height: 14, border: "2px solid #fff",
                borderTopColor: "transparent", borderRadius: "50%",
                animation: "spin 0.8s linear infinite",
              }} />
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M22 2L11 13" stroke={input.trim() ? "#000" : "#666"} strokeWidth="2" strokeLinecap="round"/>
                <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke={input.trim() ? "#000" : "#666"} strokeWidth="2" strokeLinejoin="round"/>
              </svg>
            )}
          </button>
        </div>
        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 6, textAlign: "center" }}>
          Enter para enviar · Shift+Enter para nueva línea
        </div>
      </div>
    </div>
  );
}
