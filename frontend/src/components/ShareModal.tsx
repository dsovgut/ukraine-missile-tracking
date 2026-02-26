import { useRef, useState } from "react";
import { toPng } from "html-to-image";
import { useTranslation } from "../i18n";

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

const SITE_URL = typeof window !== "undefined" ? window.location.origin : "";

export default function ShareModal({ card, onClose }: Props) {
  const { t } = useTranslation();
  const cardRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [embedCopied, setEmbedCopied] = useState(false);

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

  function getShareText() {
    return `${card.headline}\n\n${card.bigNumber} — ${card.bigNumberCaption}\n\n#StandWithUkraine #UkraineMissileTracker`;
  }

  function shareTwitter() {
    const text = encodeURIComponent(getShareText());
    const url = encodeURIComponent(SITE_URL);
    window.open(
      `https://x.com/intent/tweet?text=${text}&url=${url}`,
      "_blank",
      "noopener,noreferrer,width=600,height=400",
    );
  }

  function shareTelegram() {
    const text = encodeURIComponent(getShareText());
    const url = encodeURIComponent(SITE_URL);
    window.open(
      `https://t.me/share/url?url=${url}&text=${text}`,
      "_blank",
      "noopener,noreferrer,width=600,height=400",
    );
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(`${SITE_URL}\n\n${getShareText()}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  }

  async function copyEmbed() {
    const embedCode = `<iframe src="${SITE_URL}" width="100%" height="600" style="border:1px solid #222;border-radius:12px;background:#0a0a0a" title="Ukraine Missile Tracker"></iframe>`;
    try {
      await navigator.clipboard.writeText(embedCode);
      setEmbedCopied(true);
      setTimeout(() => setEmbedCopied(false), 2000);
    } catch {
      // fallback
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

        {/* ── Social share buttons ─────────────────────────────────── */}
        <div className="flex flex-wrap gap-2 justify-center flex-shrink-0">
          {/* Save Image */}
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="px-4 py-2 bg-white text-black text-sm font-bold rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {downloading ? t("shareSaving") : `\u2B07 ${t("shareSaveImage")}`}
          </button>

          {/* X/Twitter */}
          <button
            onClick={shareTwitter}
            className="px-4 py-2 bg-[#000] text-white text-sm font-semibold rounded-lg hover:bg-[#1a1a1a] transition-colors border border-[#333] cursor-pointer flex items-center gap-1.5"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
            {t("shareTwitter")}
          </button>

          {/* Telegram */}
          <button
            onClick={shareTelegram}
            className="px-4 py-2 bg-[#0088cc] text-white text-sm font-semibold rounded-lg hover:bg-[#006da3] transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
            </svg>
            {t("shareTelegram")}
          </button>

          {/* Copy Link */}
          <button
            onClick={copyLink}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              copied
                ? "bg-[#22c55e] text-white border border-[#22c55e]"
                : "bg-[#1a1a1a] text-white border border-[#333] hover:bg-[#252525]"
            }`}
          >
            {copied ? (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                {t("shareCopied")}
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                </svg>
                {t("shareCopyLink")}
              </>
            )}
          </button>

          {/* Embed */}
          <button
            onClick={copyEmbed}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              embedCopied
                ? "bg-[#22c55e] text-white border border-[#22c55e]"
                : "bg-[#1a1a1a] text-white border border-[#333] hover:bg-[#252525]"
            }`}
          >
            {embedCopied ? (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                {t("shareEmbedCopied")}
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="16 18 22 12 16 6"/>
                  <polyline points="8 6 2 12 8 18"/>
                </svg>
                {t("shareEmbed")}
              </>
            )}
          </button>

          {/* Close */}
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#1a1a1a] text-white text-sm font-semibold rounded-lg hover:bg-[#252525] transition-colors border border-[#333] cursor-pointer"
          >
            {t("shareClose")}
          </button>
        </div>

        <p className="text-[#404040] text-xs flex-shrink-0">
          {t("shareScreenshot")}
        </p>
      </div>
    </div>
  );
}
