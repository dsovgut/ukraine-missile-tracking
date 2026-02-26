import { useTranslation } from "../i18n";

export default function LangToggle() {
  const { lang, setLang } = useTranslation();
  return (
    <div className="flex border border-brand-border rounded-lg overflow-hidden text-xs font-bold">
      <button
        onClick={() => setLang("en")}
        className={`px-3 py-1.5 transition-colors ${
          lang === "en" ? "bg-brand-red text-white" : "text-[#555] hover:text-[#888]"
        }`}
      >
        EN
      </button>
      <button
        onClick={() => setLang("uk")}
        className={`px-3 py-1.5 transition-colors ${
          lang === "uk" ? "bg-brand-red text-white" : "text-[#555] hover:text-[#888]"
        }`}
      >
        УК
      </button>
    </div>
  );
}
