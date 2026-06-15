import { useEffect } from "react";
import { C, glassCardStyle, glassHeavyStyle } from "../../theme/colors.js";
import { I } from "../../icons/Icons.jsx";

export const EthnicBorder = ({ color = C.primary, height = 2 }) => (
  <div style={{ width: "100%", height, background: `repeating-linear-gradient(90deg, ${color} 0px, ${color} 8px, transparent 8px, transparent 12px, ${color}50 12px, ${color}50 16px, transparent 16px, transparent 24px)`, opacity: 0.35, borderRadius: 1 }} />
);

export const EthnicCorner = ({ size = 20, color = C.primary, position = "topLeft" }) => {
  const s = { position: "absolute", width: size, height: size, opacity: 0.15 };
  const pos = position === "topLeft" ? { top: -1, left: -1 } : position === "topRight" ? { top: -1, right: -1 } : position === "bottomLeft" ? { bottom: -1, left: -1 } : { bottom: -1, right: -1 };
  const rotate = position === "topLeft" ? "0" : position === "topRight" ? "90" : position === "bottomLeft" ? "270" : "180";
  return (
    <svg style={{ ...s, ...pos, transform: `rotate(${rotate}deg)` }} viewBox="0 0 20 20" fill="none">
      <path d="M0 0h20v2H2v18H0V0z" fill={color} />
      <path d="M4 4h4v2H6v2H4V4z" fill={color} />
    </svg>
  );
};

export const Badge = ({ children, color = "primary", s = {} }) => {
  const m = {
    primary: { bg: C.primaryBg, c: C.primary },
    success: { bg: C.successBg, c: C.success },
    danger: { bg: C.dangerBg, c: C.danger },
    info: { bg: C.infoBg, c: C.info },
    purple: { bg: C.purpleBg, c: C.purple },
    cyan: { bg: C.cyanBg, c: C.cyan },
    pink: { bg: C.pinkBg, c: C.pink },
    orange: { bg: C.orangeBg, c: C.orange },
  };
  const v = m[color] || m.primary;
  return <span style={{ display: "inline-flex", alignItems: "center", padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 600, background: v.bg, color: v.c, letterSpacing: 0.3, border: `1px solid ${v.c}30`, ...s }}>{children}</span>;
};

export const Btn = ({ children, onClick, v = "primary", sz = "md", disabled, style = {}, icon }) => {
  const base = {
    display: "inline-flex", alignItems: "center", gap: 6, border: "none", borderRadius: 11,
    cursor: disabled ? "not-allowed" : "pointer", fontWeight: 600, fontFamily: "inherit",
    transition: "background .18s ease, border-color .18s ease, transform .18s ease, box-shadow .18s ease, color .18s ease",
    opacity: disabled ? 0.5 : 1, whiteSpace: "nowrap",
  };
  const sizes = { sm: { padding: "5px 12px", fontSize: 12 }, md: { padding: "8px 16px", fontSize: 13 }, lg: { padding: "11px 22px", fontSize: 15 } };
  const vars = {
    primary: {
      background: `linear-gradient(135deg, ${C.primary}, ${C.primary2})`,
      color: "#1A1510",
      boxShadow: "0 10px 28px rgba(211,166,70,.24), inset 0 1px 0 rgba(255,255,255,.25)",
      border: "1px solid rgba(255,255,255,.12)",
    },
    secondary: {
      background: "rgba(255,255,255,.06)",
      color: C.text,
      border: "1px solid rgba(255,255,255,.10)",
      backdropFilter: "blur(12px)",
    },
    danger: { background: C.dangerBg, color: C.danger, border: "1px solid rgba(255,107,95,.28)" },
    ghost: { background: "transparent", color: C.muted, border: "1px solid transparent" },
    success: {
      background: `linear-gradient(135deg, ${C.success}, #5AB86A)`,
      color: "#1A1510",
      boxShadow: "0 8px 24px rgba(111,208,129,.2)",
    },
  };
  return (
    <button
      onClick={disabled ? undefined : onClick}
      onMouseEnter={e => { if (!disabled && v === "primary") e.currentTarget.style.transform = "translateY(-1px)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = "none"; }}
      style={{ ...base, ...sizes[sz], ...vars[v], ...style }}
    >
      {icon}{children}
    </button>
  );
};

const fieldBase = {
  width: "100%", padding: "9px 12px",
  background: "rgba(0,0,0,.22)",
  border: "1px solid rgba(255,255,255,.10)",
  borderRadius: 10, color: C.text, fontSize: 14, fontFamily: "inherit",
  outline: "none", boxSizing: "border-box",
  transition: "border-color .18s ease, box-shadow .18s ease",
};

export const Inp = ({ label, error, style = {}, cStyle = {}, ...r }) => (
  <div style={{ marginBottom: 12, ...cStyle }}>
    {label && <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: C.muted, marginBottom: 4 }}>{label}</label>}
    <input
      style={{ ...fieldBase, border: `1px solid ${error ? C.danger : "rgba(255,255,255,.10)"}`, ...style }}
      onFocus={e => { e.target.style.borderColor = C.primary; e.target.style.boxShadow = `0 0 0 2px ${C.ring}`; }}
      onBlur={e => { e.target.style.borderColor = error ? C.danger : "rgba(255,255,255,.10)"; e.target.style.boxShadow = "none"; }}
      {...r}
    />
    {error && <div style={{ color: C.danger, fontSize: 11, marginTop: 2 }}>{error}</div>}
  </div>
);

export const Sel = ({ label, options, error, cStyle = {}, ...r }) => (
  <div style={{ marginBottom: 12, ...cStyle }}>
    {label && <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: C.muted, marginBottom: 4 }}>{label}</label>}
    <select style={{ ...fieldBase, border: `1px solid ${error ? C.danger : "rgba(255,255,255,.10)"}`, appearance: "none" }} {...r}>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </div>
);

export const Txa = ({ label, cStyle = {}, ...r }) => (
  <div style={{ marginBottom: 12, ...cStyle }}>
    {label && <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: C.muted, marginBottom: 4 }}>{label}</label>}
    <textarea style={{ ...fieldBase, resize: "vertical", minHeight: 70 }} {...r} />
  </div>
);

export const Modal = ({ open, onClose, title, children, width = 520 }) => {
  if (!open) return null;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={onClose}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(8,6,4,.72)", backdropFilter: "blur(8px)" }} />
      <div
        style={{
          position: "relative", ...glassCardStyle, ...glassHeavyStyle,
          width: "100%", maxWidth: width, maxHeight: "90vh", overflow: "auto",
          borderRadius: 22, boxShadow: "0 32px 80px rgba(0,0,0,.55), inset 0 1px 0 rgba(255,255,255,.10)",
        }}
        onClick={e => e.stopPropagation()}
      >
        <EthnicBorder color={C.primary} height={2} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,.08)" }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: C.text }}>{title}</h3>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.10)", borderRadius: 8, color: C.muted, cursor: "pointer", padding: 6, display: "flex" }}><I.x size={16} /></button>
        </div>
        <div style={{ padding: "16px 20px" }}>{children}</div>
      </div>
    </div>
  );
};

export const Confirm = ({ open, onClose, onConfirm, title, message }) => (
  <Modal open={open} onClose={onClose} title={title} width={400}>
    <p style={{ color: C.muted, margin: "0 0 18px", lineHeight: 1.5 }}>{message}</p>
    <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
      <Btn v="secondary" onClick={onClose}>Отмена</Btn>
      <Btn v="danger" onClick={onConfirm}>Подтвердить</Btn>
    </div>
  </Modal>
);

export const Stat = ({ icon, label, value, color = C.primary, sub }) => (
  <div style={{ ...glassCardStyle, padding: "16px 18px", flex: "1 1 180px", minWidth: 160, position: "relative", overflow: "hidden" }}>
    <div style={{ position: "absolute", top: 0, right: 0, width: 70, height: 70, background: `radial-gradient(circle at top right, ${color}12, transparent 70%)` }} />
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
      <div style={{ width: 38, height: 38, borderRadius: 11, background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center", color, border: `1px solid ${color}28`, backdropFilter: "blur(8px)" }}>{icon}</div>
      {sub && <span style={{ fontSize: 11, fontWeight: 600, color: sub.startsWith("+") ? C.success : sub.startsWith("-") ? C.danger : C.muted }}>{sub}</span>}
    </div>
    <div style={{ fontSize: 26, fontWeight: 800, color: C.text, marginBottom: 2, lineHeight: 1.1 }}>{value}</div>
    <div style={{ fontSize: 12, color: C.muted }}>{label}</div>
  </div>
);

export const MetricCard = ({ label, value, color = C.primary, sub }) => (
  <div style={{ ...glassHeavyStyle, borderRadius: 14, padding: "12px 14px" }}>
    <div style={{ fontSize: 10, color: C.dim, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 800, color }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{sub}</div>}
  </div>
);

export const SectionTitle = ({ children, sub }) => (
  <div style={{ marginBottom: 14 }}>
    <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: C.text }}>{children}</h3>
    {sub && <p style={{ margin: "4px 0 0", fontSize: 12, color: C.dim }}>{sub}</p>}
  </div>
);

export const DataPanel = ({ children, s = {} }) => (
  <div style={{ ...glassHeavyStyle, borderRadius: 16, padding: 0, overflow: "hidden", ...s }}>{children}</div>
);

export const Toast = ({ message, type = "success", onClose }) => {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
  const c = { success: C.success, error: C.danger, info: C.info, warn: C.primary };
  return (
    <div style={{
      position: "fixed", top: 20, right: 20, zIndex: 9999,
      ...glassCardStyle, padding: "10px 18px",
      border: `1px solid ${c[type]}40`,
      display: "flex", alignItems: "center", gap: 8,
      animation: "slideIn .3s ease",
    }}>
      <div style={{ width: 7, height: 7, borderRadius: "50%", background: c[type] }} />
      <span style={{ color: C.text, fontSize: 13 }}>{message}</span>
    </div>
  );
};

export const TH = ({ children }) => (
  <th style={{
    padding: "10px 14px", textAlign: "left", fontSize: 10, fontWeight: 600,
    color: C.muted, textTransform: "uppercase", letterSpacing: 0.6,
    borderBottom: "1px solid rgba(255,255,255,.08)",
    background: "rgba(255,255,255,.05)",
    position: "sticky", top: 0, zIndex: 1,
  }}>{children}</th>
);

export const TD = ({ children, s = {} }) => (
  <td style={{ padding: "10px 14px", fontSize: 13, color: C.text, borderBottom: "1px solid rgba(255,255,255,.06)", ...s }}>{children}</td>
);

export const Card = ({ children, s = {}, hero, onClick, className = "" }) => {
  const clickable = !!onClick;
  return (
    <div
      className={clickable ? `clickable-glass ${className}` : className}
      onClick={onClick}
      style={{
        ...glassCardStyle,
        padding: hero ? "22px" : 18,
        position: "relative",
        cursor: clickable ? "pointer" : undefined,
        ...s,
      }}
    >
      {children}
    </div>
  );
};

export const GlassCard = Card;

export const Title = ({ children }) => <h3 style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 700, color: C.text }}>{children}</h3>;

export const PageH = ({ title, children, sub }) => (
  <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 20 }}>
    <div>
      <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: C.text }}>{title}</h1>
      {sub && <p style={{ margin: "4px 0 0", fontSize: 12, color: C.dim }}>{sub}</p>}
    </div>
    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>{children}</div>
  </div>
);

export const SearchBox = ({ value, onChange, ph = "Поиск..." }) => (
  <div style={{ position: "relative" }}>
    <input
      placeholder={ph} value={value} onChange={onChange}
      style={{
        padding: "8px 12px 8px 34px",
        background: "rgba(0,0,0,.22)",
        border: "1px solid rgba(255,255,255,.10)",
        borderRadius: 10, color: C.text, fontSize: 13,
        fontFamily: "inherit", outline: "none", width: 200,
      }}
    />
    <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: C.dim }}><I.search size={15} /></span>
  </div>
);
