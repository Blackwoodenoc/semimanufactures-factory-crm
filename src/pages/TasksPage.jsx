import { useContext, useState, useMemo, useEffect } from "react";
import { AppContext } from "../context/AppContext";
import { C } from "../theme";
import { I } from "../icons";
import { ROLES, TASK_STATUSES, fmtDate, fmtShort } from "../constants";
import { Badge, Btn, Inp, Sel, Txa, Modal, Toast, Card, PageH } from "../components/ui";

export default function TasksPage(){
  const {tasks,setTasks,taskEmployees,setTaskEmployees,products,setProducts,users,rawMaterials,setRawMaterials,recipes,setRawMovements,addLog,currentUser,addNotification,employeeHistory,setEmployeeHistory}=useContext(AppContext);
  const [modal,setModal]=useState(false);
  const [completeModal,setCompleteModal]=useState(null);
  const [toast,setToast]=useState(null);
  const [errs,setErrs]=useState({});
  const [filter,setFilter]=useState("all");
  const role=ROLES.find(r=>r.id===currentUser.roleId);
  const isWorker=role?.name==="worker";
  const canCreate=role?.name==="admin"||role?.name==="manager";

  const ap=products.filter(p=>!p.deleted);
  const workers=users.filter(u=>u.roleId===3&&u.status==="active");
  const [form,setForm]=useState({productId:ap[0]?.id||"",userIds:[],quantity:"",deadline:"",note:""});
  const [rawCheck,setRawCheck]=useState(null);
  const [empQtys,setEmpQtys]=useState({});

  const filtered=useMemo(()=>{
    let l=isWorker?tasks.filter(t=>(t.userIds||[]).includes(currentUser.id)):[...tasks];
    if(filter!=="all") l=l.filter(t=>t.status===filter);
    return l.sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
  },[tasks,filter,isWorker,currentUser]);

  const checkRaw=(productId,qty)=>{
    const recipe=recipes.find(r=>r.productId===+productId);
    if(!recipe) return {ok:true,items:[]};
    const items=recipe.items.map(it=>{
      const raw=rawMaterials.find(r=>r.id===it.rawId);
      const needed=it.qty*qty;
      return {rawId:it.rawId,name:raw?.name||"?",needed:+needed.toFixed(3),available:raw?.stock||0,unit:raw?.unit||"",enough:raw?raw.stock>=needed:false};
    });
    return {ok:items.every(i=>i.enough),items};
  };

  const toggleUser=(uid)=>{
    setForm(f=>({...f,userIds:f.userIds.includes(uid)?f.userIds.filter(x=>x!==uid):[...f.userIds,uid]}));
  };

  const openNew=()=>{
    setForm({productId:ap[0]?.id||"",userIds:[],quantity:"",deadline:new Date(Date.now()+86400000).toISOString().slice(0,16),note:""});
    setRawCheck(null);setErrs({});setModal(true);
  };

  useEffect(()=>{
    if(modal&&form.productId&&form.quantity&&+form.quantity>0){
      setRawCheck(checkRaw(form.productId,+form.quantity));
    }else{setRawCheck(null)}
  },[form.productId,form.quantity,modal]);

  const validate=()=>{const e={};if(!form.productId)e.productId="!";if(!form.userIds.length)e.userIds="!";if(!form.quantity||+form.quantity<=0)e.quantity="!";if(!form.deadline)e.deadline="!";setErrs(e);return!Object.keys(e).length};

  const save=()=>{
    if(!validate())return;
    const rc=checkRaw(form.productId,+form.quantity);
    if(!rc.ok){setToast({message:"Недостаточно сырья!",type:"error"});return}
    const now=new Date().toISOString();
    const taskId=Date.now();
    const task={id:taskId,productId:+form.productId,userIds:form.userIds,quantity:+form.quantity,status:"назначено",createdAt:now,deadline:form.deadline,completedAt:null,note:form.note};
    setTasks(p=>[...p,task]);
    // Create task_employees entries
    const newTEs=form.userIds.map((uid,i)=>({id:taskId+i+1,taskId,employeeId:uid,producedQty:0,status:"назначено",createdAt:now}));
    setTaskEmployees(p=>[...p,...newTEs]);
    const pName=products.find(p=>p.id===+form.productId)?.name;
    const names=form.userIds.map(uid=>users.find(u=>u.id===uid)?.name?.split(" ").slice(0,2).join(" ")).join(", ");
    addLog(`Задание: ${pName} x${form.quantity} → ${names}`);
    addNotification({title:`Новое задание: ${pName}`,type:"информация",content:`Назначено: ${pName} x${form.quantity} → ${names}. Срок: ${fmtDate(form.deadline)}`,targetUsers:form.userIds});
    setToast({message:"Задание создано",type:"success"});setModal(false);
  };

  const openComplete=(t)=>{
    const initial={};
    (t.userIds||[]).forEach(uid=>{
      const eq=Math.floor(t.quantity/(t.userIds||[]).length);
      initial[uid]=eq;
    });
    // Adjust remainder to first user
    const remainder=t.quantity-Object.values(initial).reduce((s,v)=>s+v,0);
    if(remainder>0&&(t.userIds||[]).length>0) initial[(t.userIds||[])[0]]+=remainder;
    setEmpQtys(initial);
    setCompleteModal(t);
  };

  const doComplete=()=>{
    const t=completeModal;if(!t)return;
    const totalAssigned=Object.values(empQtys).reduce((s,v)=>s+(+v||0),0);
    if(totalAssigned!==t.quantity){setToast({message:`Сумма (${totalAssigned}) должна равняться ${t.quantity}`,type:"error"});return}
    const now=new Date().toISOString();
    const recipe=recipes.find(r=>r.productId===t.productId);
    if(recipe){
      recipe.items.forEach(it=>{
        const needed=it.qty*t.quantity;
        setRawMaterials(p=>p.map(r=>r.id===it.rawId?{...r,stock:+(r.stock-needed).toFixed(3),updatedAt:now}:r));
        setRawMovements(p=>[...p,{id:Date.now()+Math.random(),rawId:it.rawId,type:"out",quantity:+needed.toFixed(3),reason:`Задание #${t.id}`,date:now}]);
      });
    }
    setProducts(p=>p.map(x=>x.id===t.productId?{...x,stock:x.stock+t.quantity,updatedAt:now}:x));
    const isLate=new Date(now)>new Date(t.deadline);
    setTasks(p=>p.map(x=>x.id===t.id?{...x,status:isLate?"просрочено":"завершено",completedAt:now}:x));
    // Update task_employees with individual produced quantities
    Object.entries(empQtys).forEach(([uid,qty])=>{
      setTaskEmployees(p=>p.map(te=>te.taskId===t.id&&te.employeeId===+uid?{...te,producedQty:+qty,status:isLate?"просрочено":"завершено"}:te));
    });
    // Update employee_history
    const dateStr=now.slice(0,10);
    Object.entries(empQtys).forEach(([uid,qty])=>{
      setEmployeeHistory(p=>{
        const existing=p.find(h=>h.employeeId===+uid&&h.date===dateStr);
        if(existing){
          return p.map(h=>h.id===existing.id?{...h,tasksCompleted:h.tasksCompleted+1,producedQty:h.producedQty+(+qty)}:h);
        }
        return [...p,{id:Date.now()+Math.random(),employeeId:+uid,date:dateStr,attendance:"present",tasksCompleted:1,producedQty:+qty,workStart:"09:00",workEnd:fmtDate(now).slice(-5),comment:""}];
      });
    });
    const pName=products.find(p=>p.id===t.productId)?.name;
    const names=(t.userIds||[]).map(uid=>users.find(u=>u.id===uid)?.name?.split(" ").slice(0,2).join(" ")).join(", ");
    addLog(`Завершено: ${pName} x${t.quantity}${isLate?" (просрочено)":""} → ${names}`);
    addNotification({title:`Задание ${isLate?"просрочено":"выполнено"}: ${pName}`,type:isLate?"ошибка":"информация",content:`${names} ${isLate?"просрочили":"завершили"}: ${pName} x${t.quantity}`,targetAll:true});
    rawMaterials.forEach(r=>{
      const cur=r.stock-(recipe?.items.find(x=>x.rawId===r.id)?.qty||0)*t.quantity;
      if(cur<=r.minStock){addNotification({title:`Низкий остаток: ${r.name}`,type:"предупреждение",content:`${r.name}: остаток ${cur.toFixed(1)} ${r.unit} при минимуме ${r.minStock} ${r.unit}`,targetAll:true})}
    });
    setToast({message:isLate?"Завершено с опозданием":"Завершено!",type:isLate?"warn":"success"});
    setCompleteModal(null);
  };

  const startTask=(t)=>{
    setTasks(p=>p.map(x=>x.id===t.id?{...x,status:"в работе"}:x));
    setTaskEmployees(p=>p.map(te=>te.taskId===t.id?{...te,status:"в работе"}:te));
    addLog(`Начато: задание #${t.id}`);
    setToast({message:"Задание начато",type:"info"});
  };

  const tColor=s=>s==="завершено"?"success":s==="в работе"?"info":s==="просрочено"?"danger":"primary";

  return(
    <div>
      <PageH title="Производственные задания">
        <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
          {["all",...TASK_STATUSES].map(s=>(
            <button key={s} onClick={()=>setFilter(s)} style={{padding:"6px 14px",borderRadius:7,border:`1px solid ${filter===s?C.primary:C.border}`,background:filter===s?C.primaryBg:C.surface,color:filter===s?C.primary:C.muted,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>{s==="all"?"Все":s}</button>
          ))}
        </div>
        {canCreate&&<Btn onClick={openNew} icon={<I.plus size={15}/>}>Новое задание</Btn>}
      </PageH>

      <div style={{display:"grid",gap:10}}>
        {filtered.map(t=>{
          const prod=products.find(p=>p.id===t.productId);
          const tWorkers=(t.userIds||[]).map(uid=>users.find(u=>u.id===uid));
          const tEmps=taskEmployees.filter(te=>te.taskId===t.id);
          const isOverdue=!t.completedAt&&new Date()>new Date(t.deadline)&&t.status!=="завершено"&&t.status!=="просрочено";
          const canAct=isWorker?(t.userIds||[]).includes(currentUser.id):true;
          return(
            <Card key={t.id} s={{display:"flex",flexDirection:"column",gap:10,padding:"14px 18px",borderLeft:`3px solid ${isOverdue?C.danger:t.status==="завершено"?C.success:t.status==="в работе"?C.info:C.primary}`}}>
              <div style={{display:"flex",flexWrap:"wrap",alignItems:"center",gap:14}}>
                <div style={{flex:"1 1 200px"}}>
                  <div style={{fontSize:14,fontWeight:700,color:C.text}}>{prod?.name||"—"} <span style={{fontWeight:400,color:C.muted}}>x{t.quantity}</span></div>
                  <div style={{fontSize:12,color:C.dim,marginTop:2}}>Создано: {fmtShort(t.createdAt)} · Срок: {fmtShort(t.deadline)}</div>
                  {t.completedAt&&<div style={{fontSize:11,color:C.dim}}>Завершено: {fmtDate(t.completedAt)}</div>}
                  {t.note&&<div style={{fontSize:11,color:C.dim,fontStyle:"italic",marginTop:2}}>{t.note}</div>}
                </div>
                <Badge color={isOverdue?"danger":tColor(t.status)}>{isOverdue?"просрочено":t.status}</Badge>
                <div style={{display:"flex",gap:5}}>
                  {t.status==="назначено"&&canAct&&<Btn sz="sm" v="info" onClick={()=>startTask(t)} style={{background:C.infoBg,color:C.info,border:`1px solid ${C.info}30`}}>Начать</Btn>}
                  {t.status==="в работе"&&canAct&&<Btn sz="sm" v="success" onClick={()=>openComplete(t)}>Завершить</Btn>}
                </div>
              </div>
              {/* Employees list */}
              <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                <span style={{fontSize:11,color:C.dim,lineHeight:"24px"}}>Исполнители:</span>
                {tWorkers.map((w,i)=>{
                  const te=tEmps.find(e=>e.employeeId===w?.id);
                  return w?<Badge key={i} color={te?.producedQty>0?"success":"info"} s={{fontSize:11}}>
                    {w.name.split(" ").slice(0,2).join(" ")}{te?.producedQty>0?` — ${te.producedQty}`:""}
                  </Badge>:null;
                })}
              </div>
              {/* Tech card */}
              {prod?.techCard&&prod.techCard.length>0&&(
                <details style={{fontSize:12,color:C.muted}}>
                  <summary style={{cursor:"pointer",fontWeight:600,color:C.primary,fontSize:11,padding:"4px 0"}}>Технологическая карта</summary>
                  <ol style={{margin:"6px 0 0 16px",padding:0,lineHeight:1.8}}>
                    {prod.techCard.map((step,i)=><li key={i} style={{color:C.text,fontSize:12}}>{step}</li>)}
                  </ol>
                </details>
              )}
            </Card>
          );
        })}
      </div>
      {filtered.length===0&&<div style={{textAlign:"center",padding:50,color:C.dim}}><I.tasks size={36}/><p style={{marginTop:10}}>Нет заданий</p></div>}

      {/* Create task modal */}
      <Modal open={modal} onClose={()=>setModal(false)} title="Новое задание" width={540}>
        <Sel label="Товар" value={form.productId} onChange={e=>setForm({...form,productId:e.target.value})} error={errs.productId} options={[{value:"",label:"Выберите"},...ap.map(p=>({value:p.id,label:`${p.name} (${p.category})`}))]}/>
        <div style={{marginBottom:12}}>
          <label style={{display:"block",fontSize:12,fontWeight:500,color:C.muted,marginBottom:6}}>Исполнители {errs.userIds&&<span style={{color:C.danger}}>(выберите хотя бы одного)</span>}</label>
          <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
            {workers.map(w=>{
              const sel=form.userIds.includes(w.id);
              return <button key={w.id} onClick={()=>toggleUser(w.id)} style={{padding:"6px 12px",borderRadius:7,border:`1px solid ${sel?C.primary:C.border}`,background:sel?C.primaryBg:C.surface2,color:sel?C.primary:C.muted,fontSize:12,fontWeight:sel?600:400,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:5}}>
                <span style={{width:14,height:14,borderRadius:4,border:`2px solid ${sel?C.primary:C.border}`,background:sel?C.primary:"transparent",display:"inline-flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{sel&&<I.check size={10}/>}</span>
                {w.name.split(" ").slice(0,2).join(" ")}
              </button>;
            })}
          </div>
        </div>
        <Inp label="Количество" type="number" value={form.quantity} onChange={e=>setForm({...form,quantity:e.target.value})} error={errs.quantity}/>
        <Inp label="Срок выполнения" type="datetime-local" value={form.deadline} onChange={e=>setForm({...form,deadline:e.target.value})} error={errs.deadline}/>
        <Txa label="Примечание" value={form.note} onChange={e=>setForm({...form,note:e.target.value})}/>
        {rawCheck&&(
          <div style={{background:rawCheck.ok?C.successBg:C.dangerBg,border:`1px solid ${rawCheck.ok?"rgba(90,158,95,.2)":"rgba(196,78,61,.2)"}`,borderRadius:8,padding:12,marginTop:8}}>
            <div style={{fontSize:13,fontWeight:600,color:rawCheck.ok?C.success:C.danger,marginBottom:6}}>{rawCheck.ok?"✅ Сырья достаточно":"❌ Недостаточно сырья"}</div>
            {rawCheck.items.map((it,i)=>(
              <div key={i} style={{display:"flex",justifyContent:"space-between",fontSize:12,padding:"2px 0",color:it.enough?C.text:C.danger}}>
                <span>{it.name}</span><span>{it.needed} / {it.available} {it.unit} {it.enough?"✓":"✗"}</span>
              </div>
            ))}
          </div>
        )}
        <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:10}}>
          <Btn v="secondary" onClick={()=>setModal(false)}>Отмена</Btn>
          <Btn onClick={save} disabled={rawCheck&&!rawCheck.ok}>Создать</Btn>
        </div>
      </Modal>

      {/* Complete task modal — distribute quantities */}
      <Modal open={!!completeModal} onClose={()=>setCompleteModal(null)} title="Завершение задания" width={480}>
        {completeModal&&(()=>{
          const t=completeModal;
          const prod=products.find(p=>p.id===t.productId);
          const total=Object.values(empQtys).reduce((s,v)=>s+(+v||0),0);
          const isValid=total===t.quantity;
          return(<div>
            <div style={{marginBottom:14}}>
              <div style={{fontSize:15,fontWeight:700,color:C.text}}>{prod?.name} — {t.quantity} {prod?.unit}</div>
              <div style={{fontSize:12,color:C.muted,marginTop:4}}>Распределите количество между исполнителями:</div>
            </div>
            {(t.userIds||[]).map(uid=>{
              const w=users.find(u=>u.id===uid);
              return(
                <div key={uid} style={{display:"flex",alignItems:"center",gap:10,marginBottom:10,padding:10,background:C.bg,borderRadius:8,border:`1px solid ${C.border}`}}>
                  <div style={{flex:1,fontSize:13,fontWeight:500,color:C.text}}>{w?.name?.split(" ").slice(0,2).join(" ")}</div>
                  <input type="number" min="0" value={empQtys[uid]||""} onChange={e=>setEmpQtys({...empQtys,[uid]:+e.target.value||0})} style={{width:80,padding:"6px 8px",background:C.surface2,border:`1px solid ${C.border}`,borderRadius:6,color:C.text,fontSize:13,fontFamily:"inherit",textAlign:"right"}}/>
                  <span style={{fontSize:12,color:C.dim,width:30}}>{prod?.unit}</span>
                </div>
              );
            })}
            <div style={{display:"flex",justifyContent:"space-between",padding:"10px 0",borderTop:`1px solid ${C.border}`,marginTop:6}}>
              <span style={{fontSize:13,fontWeight:600,color:C.text}}>Итого:</span>
              <span style={{fontSize:14,fontWeight:800,color:isValid?C.success:C.danger}}>{total} / {t.quantity} {prod?.unit}</span>
            </div>
            {!isValid&&<div style={{fontSize:12,color:C.danger,marginBottom:8}}>Сумма должна равняться {t.quantity}</div>}
            <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:6}}>
              <Btn v="secondary" onClick={()=>setCompleteModal(null)}>Отмена</Btn>
              <Btn v="success" onClick={doComplete} disabled={!isValid}>Завершить</Btn>
            </div>
          </div>);
        })()}
      </Modal>
      {toast&&<Toast {...toast} onClose={()=>setToast(null)}/>}
    </div>
  );
}
