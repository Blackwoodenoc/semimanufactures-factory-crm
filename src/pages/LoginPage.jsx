import React, { useState, useContext } from "react";
import { AppContext } from "../context/AppContext";
import { C } from "../theme";
import { I } from "../icons";
import { EthnicBorder } from "../components/decorative";
import { Inp, Btn } from "../components/ui";
import { hashPassword } from "../constants";

export default function LoginPage({onLogin}){
  const [email,setEmail]=useState("admin@factory.ru");
  const [pw,setPw]=useState("admin123");
  const [err,setErr]=useState("");
  const {users}=useContext(AppContext);
  const go=()=>{
    const u=users.find(x=>x.email===email);
    if(!u) return setErr("Пользователь не найден");
    if(u.password!==hashPassword(pw)) return setErr("Неверный пароль");
    if(u.status==="blocked") return setErr("Аккаунт заблокирован");
    setErr(""); onLogin(u);
  };
  return(
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:`radial-gradient(ellipse at 30% 20%, #2A2218 0%, ${C.bg} 70%)`,padding:20}}>
      <div style={{width:"100%",maxWidth:400,background:C.surface,borderRadius:16,border:`1px solid ${C.border}`,padding:0,boxShadow:`0 20px 60px rgba(0,0,0,.4), 0 0 80px ${C.primary}08`,overflow:"hidden"}}>
        <EthnicBorder color={C.primary} height={4}/>
        <div style={{padding:"34px 34px 30px"}}>
          <div style={{textAlign:"center",marginBottom:28}}>
            <div style={{width:56,height:56,borderRadius:14,background:`linear-gradient(135deg, ${C.primary}20, ${C.primary}08)`,display:"inline-flex",alignItems:"center",justifyContent:"center",marginBottom:12,color:C.primary,border:`2px solid ${C.primary}30`,boxShadow:`0 4px 20px ${C.primary}15`}}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                <path d="M2 17l10 5 10-5"/>
                <path d="M2 12l10 5 10-5"/>
              </svg>
            </div>
            <h1 style={{margin:0,fontSize:24,fontWeight:800,color:C.text,letterSpacing:1}}>Dikanish</h1>
            <p style={{margin:"5px 0 0",color:C.muted,fontSize:13}}>Система управления производством v7</p>
            <div style={{marginTop:10}}><EthnicBorder color={C.primary} height={2}/></div>
          </div>
          {err&&<div style={{background:C.dangerBg,border:`1px solid rgba(196,78,61,.25)`,borderRadius:7,padding:"8px 12px",marginBottom:14,display:"flex",alignItems:"center",gap:7,color:C.danger,fontSize:12}}><I.alert size={15}/>{err}</div>}
          <Inp label="Email" type="email" value={email} onChange={e=>setEmail(e.target.value)}/>
          <Inp label="Пароль" type="password" value={pw} onChange={e=>setPw(e.target.value)} onKeyDown={e=>e.key==="Enter"&&go()}/>
          <Btn onClick={go} style={{width:"100%",justifyContent:"center",padding:11,marginTop:4}} sz="lg">Войти</Btn>
          <div style={{marginTop:18,padding:12,background:C.bg,borderRadius:7,fontSize:11,color:C.dim,lineHeight:1.6,border:`1px solid ${C.border}`}}>
            <strong style={{color:C.muted}}>Демо:</strong><br/>admin@factory.ru / admin123<br/>manager@factory.ru / manager123<br/>worker@factory.ru / worker123<br/>owner@factory.ru / owner123
          </div>
        </div>
      </div>
    </div>
  );
}
