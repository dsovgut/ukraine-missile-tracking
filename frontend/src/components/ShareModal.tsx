import { useRef, useState } from "react";
import { toPng } from "html-to-image";

export interface ShareBar {
  label: string;
  sublabel?: string;
  value: number;
  color: string;
  isHighlight?: boolean;
}

export interface ShareCardData {
  category: string;
  categoryColor: string;
  headline: string;
  bigNumber: string;
  bigNumberCaption: string;
  comparisonNote: string;
  bars: ShareBar[];
  bullets?: string[];
  sourceNote: string;
}

interface Props {
  card: ShareCardData;
  onClose: () => void;
}

export default function ShareModal({ card, onClose }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  async function handleDownload() {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        pixelRatio: 3,
        cacheBust: true,
        style: { fontFamily: "system-ui, -apple-system, sans-serif" },
      });
      const a = document.createElement("a");
      a.download = "ukraine-in-perspective.png";
      a.href = dataUrl;
      a.click();
    } catch {
      // fallback: prompt user to screenshot
    } finally {
      setDownloading(false);
    }
  }

  const maxBarVal = card.bars.length > 0 ? Math.max(...card.bars.map((b) => b.value)) : 1;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
      onClick={onClose}
    >
      <div
        className="flex flex-col items-center gap-4 max-h-screen overflow-y-auto py-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Share card (9:16 portrait) ─────────────────────────────── */}
        <div
          ref={cardRef}
          style={{
            width: 360,
            minHeight: 640,
            background: "#0a0a0a",
            fontFamily: "system-ui, -apple-system, sans-serif",
          }}
          className="relative flex flex-col rounded-2xl border border-[#222] overflow-hidden flex-shrink-0"
        >
          {/* Ukrainian flag accent bar */}
          <div style={{ display: "flex", height: 3, flexShrink: 0 }}>
            <div style={{ flex: 1, background: "#005BBB" }} />
            <div style={{ flex: 1, background: "#FFD700" }} />
          </div>

          <div style={{ padding: "28px 28px 24px", display: "flex", flexDirection: "column", flex: 1 }}>
            {/* Header row */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.18em", color: "#555", textTransform: "uppercase" }}>
                In Perspective
              </span>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  padding: "2px 8px",
                  borderRadius: 4,
                  background: card.categoryColor + "22",
                  color: card.categoryColor,
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                }}
              >
                {card.category}
              </span>
            </div>

            {/* Headline */}
            <p style={{ color: "#f1f5f9", fontWeight: 700, fontSize: 18, lineHeight: 1.4, marginBottom: 24 }}>
              {card.headline}
            </p>

            {/* Big number */}
            <div
              style={{
                borderLeft: `3px solid ${card.categoryColor}`,
                paddingLeft: 16,
                marginBottom: 24,
              }}
            >
              <div style={{ fontSize: 52, fontWeight: 900, color: "#fff", lineHeight: 1, marginBottom: 6 }}>
                {card.bigNumber}
              </div>
              <div style={{ fontSize: 13, color: "#737373" }}>{card.bigNumberCaption}</div>
            </div>

            {/* Bar comparison */}
            {card.bars.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 20 }}>
                {card.bars.map((bar) => (
                  <div key={bar.label}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 5 }}>
                      <span style={{ color: bar.isHighlight ? "#f1f5f9" : "#737373", fontWeight: bar.isHighlight ? 600 : 400 }}>
                        {bar.label}
                      </span>
                      <span style={{ color: bar.isHighlight ? bar.color : "#737373", fontWeight: bar.isHighlight ? 600 : 400 }}>
                        {bar.value.toLocaleString()}
                      </span>
                    </div>
                    <div style={{ height: 8, borderRadius: 4, background: "#1a1a1a", overflow: "hidden" }}>
                      <div
                        style={{
                          height: "100%",
                          borderRadius: 4,
                          width: `${(bar.value / maxBarVal) * 100}%`,
                          background: bar.color,
                          opacity: bar.isHighlight ? 1 : 0.45,
                        }}
                      />
                    </div>
                    {bar.sublabel && (
                      <div style={{ fontSize: 10, color: "#404040", marginTop: 3 }}>{bar.sublabel}</div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Bullets (for "what could it buy") */}
            {card.bullets && card.bullets.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
                {card.bullets.map((b) => (
                  <div key={b} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                    <div
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: card.categoryColor,
                        marginTop: 6,
                        flexShrink: 0,
                      }}
                    />
                    <span style={{ fontSize: 13, color: "#e2e8f0", lineHeight: 1.5 }}>{b}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Comparison note */}
            {card.comparisonNote && (
              <p style={{ fontSize: 12, color: "#737373", lineHeight: 1.6, fontStyle: "italic", marginBottom: 20 }}>
                {card.comparisonNote}
              </p>
            )}

            {/* Footer */}
            <div style={{ marginTop: "auto", paddingTop: 16, borderTop: "1px solid #1e1e1e" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                <p style={{ fontSize: 9, color: "#404040", lineHeight: 1.5, maxWidth: 220 }}>
                  {card.sourceNote}
                </p>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2 }}>
                  <div style={{ display: "flex", gap: 4 }}>
                    <div style={{ width: 6, height: 6, background: "#005BBB", borderRadius: 1 }} />
                    <div style={{ width: 6, height: 6, background: "#FFD700", borderRadius: 1 }} />
                  </div>
                  <p style={{ fontSize: 9, fontWeight: 700, color: "#555", letterSpacing: "0.05em" }}>
                    #StandWithUkraine
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex gap-3 flex-shrink-0">
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="px-5 py-2.5 bg-white text-black text-sm font-bold rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {downloading ? "Saving…" : "⬇ Save Image"}
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-[#1a1a1a] text-white text-sm font-semibold rounded-lg hover:bg-[#252525] transition-colors border border-[#333] cursor-pointer"
          >
            Close
          </button>
        </div>
        <p className="text-[#404040] text-xs flex-shrink-0">
          Or just screenshot this card to share
        </p>
      </div>
    </div>
  );
}
