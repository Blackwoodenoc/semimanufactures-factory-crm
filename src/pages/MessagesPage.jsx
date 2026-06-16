import { useState, useMemo, useContext, useEffect, useRef } from "react";
import { AppContext } from "../context/AppContext.js";
import { ROLES } from "../constants/index.js";
import { relTime } from "../utils/dates.js";
import { C } from "../theme/colors.js";
import { I } from "../icons/Icons.jsx";
import { Btn } from "../components/ui/index.jsx";

export function MessagesPage() {
  const { currentUser, users, messages, setMessages, setNotifications, notifications } = useContext(AppContext);
  const [selectedId, setSelectedId] = useState(null); // userId of the other person
  const [text, setText] = useState("");
  const [showCompose, setShowCompose] = useState(false);
  const [composeToId, setComposeToId] = useState("");
  const [composeText, setComposeText] = useState("");
  const threadRef = useRef(null);

  const role = ROLES.find(r => r.id === currentUser.roleId);
  const isManagerLike = role?.name === "admin" || role?.name === "owner" || role?.name === "manager";

  // Recipients available for composing
  const availableRecipients = useMemo(() => {
    return (users || []).filter(u => {
      if (u.id === currentUser.id) return false;
      if (u.status === "blocked") return false;
      return true;
    });
  }, [users, currentUser]);

  // Group messages into conversations by "other person"
  const conversations = useMemo(() => {
    const map = new Map();
    (messages || []).forEach(m => {
      const isMe = m.fromId === currentUser.id;
      const otherId = isMe ? m.toId : m.fromId;
      const otherName = isMe ? m.toName : m.fromName;
      if (!map.has(otherId)) map.set(otherId, { userId: otherId, name: otherName, msgs: [] });
      map.get(otherId).msgs.push(m);
    });
    return Array.from(map.values())
      .map(c => ({
        ...c,
        last: c.msgs[c.msgs.length - 1],
        unread: c.msgs.filter(m => m.toId === currentUser.id && !m.readBy?.includes(currentUser.id)).length,
      }))
      .sort((a, b) => new Date(b.last.createdAt) - new Date(a.last.createdAt));
  }, [messages, currentUser]);

  // Thread: all messages between me and selectedId
  const thread = useMemo(() => {
    if (!selectedId) return [];
    return (messages || [])
      .filter(m => (m.fromId === currentUser.id && m.toId === selectedId) || (m.fromId === selectedId && m.toId === currentUser.id))
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  }, [messages, currentUser, selectedId]);

  // Mark as read when opening a conversation
  useEffect(() => {
    if (!selectedId) return;
    const hasUnread = (messages || []).some(
      m => m.fromId === selectedId && m.toId === currentUser.id && !m.readBy?.includes(currentUser.id)
    );
    if (!hasUnread) return;
    setMessages(prev => prev.map(m =>
      m.fromId === selectedId && m.toId === currentUser.id && !m.readBy?.includes(currentUser.id)
        ? { ...m, readBy: [...(m.readBy || []), currentUser.id] }
        : m
    ));
  }, [selectedId]); // eslint-disable-line

  // Scroll to bottom of thread when it changes
  useEffect(() => {
    if (threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight;
  }, [thread.length, selectedId]);

  function sendMessage() {
    const trimmed = text.trim();
    if (!trimmed || !selectedId) return;
    const other = users.find(u => u.id === selectedId);
    const now = new Date().toISOString();
    const msg = {
      id: Date.now() + Math.random(),
      fromId: currentUser.id,
      fromName: currentUser.name,
      toId: selectedId,
      toName: other?.name || "?",
      text: trimmed,
      createdAt: now,
      readBy: [currentUser.id],
    };
    setMessages(prev => [...(prev || []), msg]);
    // Notification for recipient
    setNotifications(prev => [...(prev || []), {
      id: Date.now() + Math.random(),
      title: `Сообщение от ${currentUser.name.split(" ")[0]}`,
      type: "информация",
      content: trimmed.length > 80 ? trimmed.slice(0, 80) + "…" : trimmed,
      createdBy: currentUser.id,
      createdAt: now,
      readBy: [currentUser.id],
      targetAll: false,
      targetUsers: [selectedId],
    }]);
    setText("");
  }

  function sendCompose() {
    const trimmed = composeText.trim();
    const toId = Number(composeToId);
    if (!trimmed || !toId) return;
    const other = users.find(u => u.id === toId);
    const now = new Date().toISOString();
    const msg = {
      id: Date.now() + Math.random(),
      fromId: currentUser.id,
      fromName: currentUser.name,
      toId,
      toName: other?.name || "?",
      text: trimmed,
      createdAt: now,
      readBy: [currentUser.id],
    };
    setMessages(prev => [...(prev || []), msg]);
    setNotifications(prev => [...(prev || []), {
      id: Date.now() + Math.random(),
      title: `Сообщение от ${currentUser.name.split(" ")[0]}`,
      type: "информация",
      content: trimmed.length > 80 ? trimmed.slice(0, 80) + "…" : trimmed,
      createdBy: currentUser.id,
      createdAt: now,
      readBy: [currentUser.id],
      targetAll: false,
      targetUsers: [toId],
    }]);
    setSelectedId(toId);
    setComposeText("");
    setComposeToId("");
    setShowCompose(false);
  }

  const totalUnread = (messages || []).filter(m => m.toId === currentUser.id && !m.readBy?.includes(currentUser.id)).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <I.message size={20} style={{ color: C.primary }} />
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: C.text, display: "flex", alignItems: "center", gap: 8 }}>
          Ящик
          {totalUnread > 0 && <span style={{ minWidth: 20, height: 20, borderRadius: 10, background: C.danger, color: "#fff", fontSize: 11, fontWeight: 700, display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "0 6px" }}>{totalUnread > 9 ? "9+" : totalUnread}</span>}
        </h1>
      </div>

      <div style={{ display: "flex", gap: 12, flex: 1, minHeight: 0 }}>
        {/* ── Conversations list ── */}
        <div style={{ width: 260, flexShrink: 0, display: "flex", flexDirection: "column", gap: 8 }}>
          <Btn v="primary" sz="sm" icon={<I.plus size={13} />} onClick={() => setShowCompose(true)} style={{ width: "100%" }}>
            Новое сообщение
          </Btn>

          <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 4 }}>
            {conversations.length === 0 && (
              <div style={{ color: C.dim, fontSize: 12, textAlign: "center", marginTop: 32 }}>Нет сообщений</div>
            )}
            {conversations.map(c => {
              const active = selectedId === c.userId;
              return (
                <button
                  key={c.userId}
                  onClick={() => setSelectedId(c.userId)}
                  style={{
                    display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
                    borderRadius: 10, border: active ? `1px solid ${C.primary}44` : "1px solid transparent",
                    background: active ? `${C.primary}14` : C.surface,
                    cursor: "pointer", textAlign: "left", width: "100%",
                    transition: "all .15s",
                  }}
                >
                  <div style={{ width: 34, height: 34, borderRadius: 10, background: `linear-gradient(135deg, ${C.primary}33, ${C.primary}0a)`, border: `1px solid ${C.primary}33`, display: "flex", alignItems: "center", justifyContent: "center", color: C.primary, fontWeight: 800, fontSize: 14, flexShrink: 0 }}>
                    {(c.name || "?").charAt(0)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {c.name?.split(" ").slice(0, 2).join(" ") || "?"}
                      </span>
                      {c.unread > 0 && (
                        <span style={{ minWidth: 16, height: 16, borderRadius: 8, background: C.danger, color: "#fff", fontSize: 9, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 4px", flexShrink: 0 }}>
                          {c.unread > 9 ? "9+" : c.unread}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 11, color: C.dim, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 2 }}>
                      {c.last.fromId === currentUser.id ? "Вы: " : ""}{c.last.text}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Thread ── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`, overflow: "hidden", minWidth: 0 }}>
          {!selectedId ? (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 10, color: C.dim }}>
              <I.message size={32} />
              <span style={{ fontSize: 13 }}>Выберите диалог</span>
            </div>
          ) : (
            <>
              {/* Header */}
              {(() => {
                const other = users.find(u => u.id === selectedId);
                const otherRole = ROLES.find(r => r.id === other?.roleId);
                return (
                  <div style={{ padding: "12px 16px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 9, background: `linear-gradient(135deg, ${C.primary}33, ${C.primary}0a)`, border: `1px solid ${C.primary}33`, display: "flex", alignItems: "center", justifyContent: "center", color: C.primary, fontWeight: 800, fontSize: 13 }}>
                      {(other?.name || "?").charAt(0)}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{other?.name?.split(" ").slice(0, 2).join(" ") || "?"}</div>
                      <div style={{ fontSize: 11, color: C.dim }}>{otherRole?.label || ""}</div>
                    </div>
                  </div>
                );
              })()}

              {/* Messages */}
              <div ref={threadRef} style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: 8 }}>
                {thread.length === 0 && (
                  <div style={{ color: C.dim, fontSize: 12, textAlign: "center", marginTop: 32 }}>Нет сообщений</div>
                )}
                {thread.map(m => {
                  const mine = m.fromId === currentUser.id;
                  return (
                    <div key={m.id} style={{ display: "flex", justifyContent: mine ? "flex-end" : "flex-start" }}>
                      <div style={{
                        maxWidth: "72%", padding: "8px 12px", borderRadius: mine ? "12px 12px 4px 12px" : "12px 12px 12px 4px",
                        background: mine ? `${C.primary}22` : C.surface2,
                        border: `1px solid ${mine ? C.primary + "33" : C.border}`,
                      }}>
                        <div style={{ fontSize: 13, color: C.text, lineHeight: 1.5, wordBreak: "break-word" }}>{m.text}</div>
                        <div style={{ fontSize: 10, color: C.dim, marginTop: 4, textAlign: mine ? "right" : "left" }}>{relTime(m.createdAt)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Input */}
              <div style={{ padding: "12px 16px", borderTop: `1px solid ${C.border}`, display: "flex", gap: 8 }}>
                <input
                  value={text}
                  onChange={e => setText(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                  placeholder="Введите сообщение…"
                  style={{ flex: 1, background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 12px", color: C.text, fontSize: 13, outline: "none" }}
                />
                <Btn v="primary" sz="sm" onClick={sendMessage} disabled={!text.trim()} icon={<I.send size={14} />}>
                  Отправить
                </Btn>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Compose modal ── */}
      {showCompose && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,.6)", display: "flex", alignItems: "center", justifyContent: "center" }} onClick={e => e.target === e.currentTarget && setShowCompose(false)}>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24, width: 380, display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>Новое сообщение</div>
            <div>
              <div style={{ fontSize: 11, color: C.dim, marginBottom: 6 }}>Получатель</div>
              <select
                value={composeToId}
                onChange={e => setComposeToId(e.target.value)}
                style={{ width: "100%", background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 10px", color: C.text, fontSize: 13 }}
              >
                <option value="">— выберите сотрудника —</option>
                {availableRecipients.map(u => {
                  const r = ROLES.find(x => x.id === u.roleId);
                  return <option key={u.id} value={u.id}>{u.name} ({r?.label || ""})</option>;
                })}
              </select>
            </div>
            <div>
              <div style={{ fontSize: 11, color: C.dim, marginBottom: 6 }}>Сообщение</div>
              <textarea
                value={composeText}
                onChange={e => setComposeText(e.target.value)}
                placeholder="Текст сообщения…"
                rows={4}
                style={{ width: "100%", background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 10px", color: C.text, fontSize: 13, resize: "vertical", boxSizing: "border-box" }}
              />
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <Btn v="secondary" sz="sm" onClick={() => setShowCompose(false)}>Отмена</Btn>
              <Btn v="primary" sz="sm" onClick={sendCompose} disabled={!composeText.trim() || !composeToId} icon={<I.send size={13} />}>Отправить</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
