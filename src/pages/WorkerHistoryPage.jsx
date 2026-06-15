import { useContext, useState, useMemo } from "react";
import { AppContext } from "../context/AppContext";
import { C } from "../theme";
import { I } from "../icons";
import { ROLES, fmtShort } from "../constants";
import { Badge, Card, Title, PageH } from "../components/ui";

export default function WorkerHistoryPage(){
  const {users,tasks,taskEmployees,employeeHistory,marks,currentUser,products,productionOutputs}=useContext(AppContext);
  const role=ROLES.find(r=>r.id===currentUser.roleId);
  const isWorker=role?.name==="worker";
  const workers=users.filter(u=>u.roleId===3);
  const [selectedWorker,setSelectedWorker]=useState(isWorker?currentUser.id:(workers[0]?.id||""));
  const [monthFilter,setMonthFilter]=useState("");

  const worker=users.find(u=>u.id===+selectedWorker);
  const wTEs=taskEmployees.filter(te=>te.employeeId===+selectedWorker);
  const doneTEs=wTEs.filter(te=>te.status==="завершено"||te.status==="просрочено");
  const fromTasks=doneTEs.reduce((s,te)=>s+te.producedQty,0);
  const fromOutputs=(productionOutputs||[]).filter(o=>o.employeeId===+selectedWorker).reduce((s,o)=>s+o.quantity,0);
  const totalProduced=fromTasks+fromOutputs;
  const wTasks=tasks.filter(t=>(t.userIds||[]).includes(+selectedWorker));
  const doneTasks=wTasks.filter(t=>t.status==="завершено"||t.status==="просрочено");
  const onTimeTasks=doneTasks.filter(t=>t.status==="завершено"&&new Date(t.completedAt)<=new Date(t.deadline));

  const history=useMemo(()=>{
    let h=[...employeeHistory.filter(eh=>eh.employeeId===+selectedWorker)];
    if(monthFilter){
      h=h.filter(eh=>eh.date.startsWith(monthFilter));
    }
    return h.sort((a,b)=>new Date(b.date)-new Date(a.date));
  },[employeeHistory,selectedWorker,monthFilter]);

  // Generate month options from history
  const months=useMemo(()=>{
    const s=new Set();
    employeeHistory.filter(eh=>eh.employeeId===+selectedWorker).forEach(eh=>{s.add(eh.date.slice(0,7))});
    return [...s].sort().reverse();
  },[employeeHistory,selectedWorker]);

  return(
    <div>
      <PageH title="История работников">
        {!isWorker&&<select value={selectedWorker} onChange={e=>setSelectedWorker(e.target.value)} style={{padding:"7px 9px",background:C.bg,border:`1px solid ${C.border}`,borderRadius:7,color:C.text,fontSize:12,fontFamily:"inherit"}}>
          {workers.map(w=><option key={w.id} value={w.id}>{w.name.split(" ").slice(0,2).join(" ")}</option>)}
        </select>}
        <select value={monthFilter} onChange={e=>setMonthFilter(e.target.value)} style={{padding:"7px 9px",background:C.bg,border:`1px solid ${C.border}`,borderRadius:7,color:C.text,fontSize:12,fontFamily:"inherit"}}>
          <option value="">Все месяцы</option>
          {months.map(m=><option key={m} value={m}>{m}</option>)}
        </select>
      </PageH>

      {/* Worker profile header */}
      {worker&&(
        <Card s={{marginBottom:16,padding:"18px 20px"}}>
          <div style={{display:"flex",flexWrap:"wrap",gap:20,alignItems:"center"}}>
            <div style={{width:50,height:50,borderRadius:12,background:`linear-gradient(135deg, ${C.primary}25, ${C.primary}10)`,display:"flex",alignItems:"center",justifyContent:"center",color:C.primary,fontWeight:800,fontSize:20,border:`2px solid ${C.primary}30`}}>{worker.name.charAt(0)}</div>
            <div style={{flex:"1 1 200px"}}>
              <div style={{fontSize:17,fontWeight:700,color:C.text}}>{worker.name}</div>
              <div style={{fontSize:12,color:C.muted,marginTop:2}}>{ROLES.find(r=>r.id===worker.roleId)?.label} · {worker.email}</div>
            </div>
            <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
              <div style={{background:C.bg,borderRadius:8,padding:"8px 14px",textAlign:"center",border:`1px solid ${C.border}`}}>
                <div style={{fontSize:18,fontWeight:800,color:C.primary}}>{doneTasks.length}</div>
                <div style={{fontSize:10,color:C.dim}}>Выполнено</div>
              </div>
              <div style={{background:C.bg,borderRadius:8,padding:"8px 14px",textAlign:"center",border:`1px solid ${C.border}`}}>
                <div style={{fontSize:18,fontWeight:800,color:C.success}}>{totalProduced}</div>
                <div style={{fontSize:10,color:C.dim}}>Произведено</div>
              </div>
              <div style={{background:C.bg,borderRadius:8,padding:"8px 14px",textAlign:"center",border:`1px solid ${C.border}`}}>
                <div style={{fontSize:18,fontWeight:800,color:doneTasks.length?(onTimeTasks.length/doneTasks.length*100)>=80?C.success:C.danger:C.dim}}>{doneTasks.length?(onTimeTasks.length/doneTasks.length*100).toFixed(0):0}%</div>
                <div style={{fontSize:10,color:C.dim}}>В срок</div>
              </div>
              <div style={{background:C.bg,borderRadius:8,padding:"8px 14px",textAlign:"center",border:`1px solid ${C.border}`}}>
                <div style={{fontSize:18,fontWeight:800,color:C.info}}>{marks.filter(m=>m.employeeId===+selectedWorker&&m.markType==="присутствие").length}</div>
                <div style={{fontSize:10,color:C.dim}}>Присутствие</div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* History table */}
      <Card s={{padding:0,overflow:"hidden"}}>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead><tr>
              <th style={{padding:"10px 14px",textAlign:"left",fontSize:11,fontWeight:600,color:"#8a8a9a",borderBottom:`1px solid ${C.border}`}}>Дата</th>
              <th style={{padding:"10px 14px",textAlign:"left",fontSize:11,fontWeight:600,color:"#8a8a9a",borderBottom:`1px solid ${C.border}`}}>Статус</th>
              <th style={{padding:"10px 14px",textAlign:"left",fontSize:11,fontWeight:600,color:"#8a8a9a",borderBottom:`1px solid ${C.border}`}}>Задания</th>
              <th style={{padding:"10px 14px",textAlign:"left",fontSize:11,fontWeight:600,color:"#8a8a9a",borderBottom:`1px solid ${C.border}`}}>Произведено</th>
              <th style={{padding:"10px 14px",textAlign:"left",fontSize:11,fontWeight:600,color:"#8a8a9a",borderBottom:`1px solid ${C.border}`}}>Время</th>
              <th style={{padding:"10px 14px",textAlign:"left",fontSize:11,fontWeight:600,color:"#8a8a9a",borderBottom:`1px solid ${C.border}`}}>Комментарий</th>
            </tr></thead>
            <tbody>
              {history.map(h=>(
                <tr key={h.id} style={{borderBottom:`1px solid ${C.border}`,background:h.attendance==="absent"?C.dangerBg:"transparent"}}>
                  <td style={{padding:"10px 14px",fontSize:13,fontWeight:500,whiteSpace:"nowrap",color:C.text}}>{h.date}</td>
                  <td style={{padding:"10px 14px"}}><Badge color={h.attendance==="present"?"success":"danger"}>{h.attendance==="present"?"Был":"Отсутствовал"}</Badge></td>
                  <td style={{padding:"10px 14px",fontWeight:600,color:C.text}}>{h.attendance==="present"?h.tasksCompleted:"—"}</td>
                  <td style={{padding:"10px 14px",fontWeight:600,color:C.primary}}>{h.attendance==="present"&&h.producedQty>0?h.producedQty:"—"}</td>
                  <td style={{padding:"10px 14px",color:C.muted,fontSize:12}}>{h.attendance==="present"&&h.workStart?`${h.workStart}–${h.workEnd}`:"—"}</td>
                  <td style={{padding:"10px 14px",color:C.dim,fontSize:12,maxWidth:200,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{h.comment||"—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      {history.length===0&&<div style={{textAlign:"center",padding:50,color:C.dim}}><I.clock size={36}/><p style={{marginTop:10}}>Нет записей</p></div>}

      {/* Task contributions */}
      <Card s={{marginTop:16}}>
        <Title>Вклад по заданиям</Title>
        <div style={{display:"grid",gap:8}}>
          {doneTEs.slice(0,20).map(te=>{
            const task=tasks.find(t=>t.id===te.taskId);
            const prod=task?products.find(p=>p.id===task.productId):null;
            return(
              <div key={te.id} style={{display:"flex",alignItems:"center",gap:12,padding:"8px 0",borderBottom:`1px solid ${C.border}`}}>
                <div style={{flex:1}}>
                  <span style={{fontSize:13,fontWeight:500,color:C.text}}>{prod?.name||"—"}</span>
                  <span style={{fontSize:11,color:C.dim,marginLeft:8}}>Задание #{te.taskId}</span>
                </div>
                <Badge color={te.status==="завершено"?"success":"danger"}>{te.producedQty} {prod?.unit||""}</Badge>
                <span style={{fontSize:11,color:C.dim}}>{task?fmtShort(task.completedAt):""}</span>
              </div>
            );
          })}
        </div>
        {doneTEs.length===0&&<div style={{textAlign:"center",padding:20,color:C.dim,fontSize:13}}>Нет выполненных заданий</div>}
      </Card>
    </div>
  );
}
