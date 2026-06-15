import { useContext, useState } from "react";
import { AppContext } from "../context/AppContext";
import { C } from "../theme";
import { I } from "../icons";
import { fmtDate } from "../constants";
import { Card, PageH, SearchBox } from "../components/ui";

export default function LogsPage(){
  const {logs}=useContext(AppContext);
  const [search,setSearch]=useState("");
  const filtered=logs.filter(l=>l.message.toLowerCase().includes(search.toLowerCase())||l.userName.toLowerCase().includes(search.toLowerCase())).sort((a,b)=>new Date(b.date)-new Date(a.date));
  return(
    <div>
      <PageH title="Журнал действий"><SearchBox value={search} onChange={e=>setSearch(e.target.value)} ph="Поиск в логах..."/></PageH>
      <Card s={{maxHeight:600,overflow:"auto"}}>
        {filtered.length===0?<div style={{textAlign:"center",padding:50,color:C.dim}}>Нет записей</div>:
        filtered.map((l,i)=>(
          <div key={l.id} style={{padding:"10px 0",borderBottom:i<filtered.length-1?`1px solid ${C.border}`:"none",display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:32,height:32,borderRadius:8,background:C.primaryBg,color:C.primary,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><I.clock size={14}/></div>
            <div style={{flex:1}}><div style={{fontSize:13,color:C.text}}>{l.message}</div><div style={{fontSize:11,color:C.dim}}>{l.userName} · {fmtDate(l.date)}</div></div>
          </div>
        ))}
      </Card>
    </div>
  );
}
