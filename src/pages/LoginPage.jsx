import { useState, useEffect } from "react";
import { C, glassCardStyle } from "../theme/colors.js";
import { I } from "../icons/Icons.jsx";
import { EthnicBorder, Btn, Inp } from "../components/ui/index.jsx";

const DEMO_ACCOUNTS = [
  { label: "Директор", email: "director@factory.ru", pw: "director123", color: "danger" },
  { label: "Менеджер", email: "manager@factory.ru", pw: "manager123", color: "info" },
  { label: "Владелец", email: "owner@factory.ru", pw: "owner123", color: "purple" },
  { label: "Лепщица 1", email: "lep1@factory.ru", pw: "worker123", color: "primary" },
  { label: "Фасовщица", email: "packer@factory.ru", pw: "worker123", color: "cyan" },
  { label: "Курьер", email: "courier@factory.ru", pw: "worker123", color: "orange" },
];

const LoginPage = ({ onLogin }) => {
  const [email, setEmail] = useState("director@factory.ru");
  const [pw, setPw] = useState("director123");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [apiOk, setApiOk] = useState(null);

  useEffect(() => {
    let mounted = true;
    const check = () => {
      fetch("/api/health", { cache: "no-store" })
        .then(r => { if (mounted) setApiOk(r.ok); })
        .catch(() => { if (mounted) setApiOk(false); });
    };
    check();
    const t = setInterval(check, 5000);
    return () => { mounted = false; clearInterval(t); };
  }, []);

  const go = async () => {
    if (loading) return;
    setLoading(true); setErr("");
    try {
      const r = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password: pw }) });
      if (!r.ok) { const data = await r.json(); setErr(data.error || "Ошибка входа"); return; }
      const data = await r.json();
      onLogin(data);
    } catch { setErr("Сервер недоступен. Запустите: npm run dev"); }
    finally { setLoading(false); }
  };

  const colorMap = { danger: C.danger, info: C.info, purple: C.purple, primary: C.primary, cyan: C.cyan, orange: C.orange };

  return (
    <div className="app-bg" style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 440, animation: "softFadeIn .5s ease" }}>
        <div style={{ ...glassCardStyle, borderRadius: 22, overflow: "hidden", marginBottom: 16, boxShadow: "0 32px 80px rgba(0,0,0,.5), inset 0 1px 0 rgba(255,255,255,.10)" }}>
          <EthnicBorder color={C.primary} height={3} />
          <div style={{ padding: "36px 36px 32px" }}>
            <div style={{ textAlign: "center", marginBottom: 28 }}>
              <div style={{
                width: 60, height: 60, borderRadius: 16,
                background: `linear-gradient(135deg, rgba(211,166,70,.28), rgba(211,166,70,.08))`,
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                marginBottom: 14, color: C.primary,
                border: "1px solid rgba(211,166,70,.30)",
                boxShadow: "0 8px 28px rgba(211,166,70,.18)",
              }}>
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <path d="M2 17l10 5 10-5" />
                  <path d="M2 12l10 5 10-5" />
                </svg>
              </div>
              <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: C.text, letterSpacing: 0.5 }}>Dikanish</h1>
              <p style={{ margin: "6px 0 0", color: C.muted, fontSize: 13 }}>Factory OS · Production CRM</p>
              <div style={{ marginTop: 12 }}><EthnicBorder color={C.primary} height={2} /></div>
            </div>
            {apiOk === false && (
              <div style={{ background: C.dangerBg, border: `1px solid ${C.danger}40`, borderRadius: 12, padding: "10px 14px", marginBottom: 14, fontSize: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7, fontWeight: 700, color: C.danger, marginBottom: 4 }}><I.alert size={15} /> Backend не запущен</div>
                <div style={{ color: C.muted }}>Запустите: <code style={{ color: C.primary }}>npm run dev</code></div>
              </div>
            )}
            {err && (
              <div style={{ background: C.dangerBg, border: `1px solid ${C.danger}35`, borderRadius: 12, padding: "10px 14px", marginBottom: 14, display: "flex", alignItems: "center", gap: 7, color: C.danger, fontSize: 12 }}>
                <I.alert size={15} />{err}
              </div>
            )}
            <Inp label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} disabled={loading} />
            <Inp label="Пароль" type="password" value={pw} onChange={e => setPw(e.target.value)} onKeyDown={e => e.key === "Enter" && go()} disabled={loading} />
            <Btn onClick={go} style={{ width: "100%", justifyContent: "center", padding: 12, marginTop: 4 }} sz="lg" disabled={loading}>{loading ? "Вход..." : "Войти"}</Btn>
          </div>
        </div>
        <div style={{ ...glassCardStyle, borderRadius: 16, padding: "16px 18px" }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: C.dim, marginBottom: 10, letterSpacing: 0.5, textTransform: "uppercase" }}>Демо-аккаунты</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
            {DEMO_ACCOUNTS.map(a => (
              <button key={a.email} onClick={() => { setEmail(a.email); setPw(a.pw) }} style={{
                background: `${colorMap[a.color]}12`, border: `1px solid ${colorMap[a.color]}30`,
                borderRadius: 10, padding: "8px 6px", cursor: "pointer", fontFamily: "inherit", textAlign: "center",
                transition: "transform .18s ease, border-color .18s ease",
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: colorMap[a.color] }}>{a.label}</div>
                <div style={{ fontSize: 9, color: C.dim, marginTop: 2 }}>{a.email.split("@")[0]}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export { LoginPage };
