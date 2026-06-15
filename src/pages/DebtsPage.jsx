import { useContext, useState, useMemo } from "react";
import { AppContext } from "../context/AppContext";
import { C } from "../theme";
import { I } from "../icons";
import { ROLES, DEBT_STATUSES, fmtShort } from "../constants";
import { Badge, Btn, Inp, Sel, Txa, Modal, Confirm, Toast, Card, Title, PageH, SearchBox, Stat } from "../components/ui";

export default function DebtsPage(){
  const {debts,setDebts,users,currentUser,addLog}=useContext(AppContext);
  const role=ROLES.find(r=>r.id===currentUser.roleId);
  const isOwner=role?.name==="owner";

  // ── State ──
  const [tab,setTab]=useState(isOwner?"all":"my"); // "my" | "all" (owner only)
  const [modal,setModal]=useState(false);
  const [payModal,setPayModal]=useState(null); // debt object for partial payment
  const [edit,setEdit]=useState(null);
  const [confirm,setConfirm]=useState(null);
  const [toast,setToast]=useState(null);
  const [search,setSearch]=useState("");
  const [fStatus,setFStatus]=useState("all");
  const [fUser,setFUser]=useState("all");
  const [errs,setErrs]=useState({});
  const [payErrs,setPayErrs]=useState({});

  const emptyForm={
    amount:"", description:"", date:new Date().toISOString().slice(0,10),
    dueDate:"", status:"активен", comment:""
  };
  const [form,setForm]=useState(emptyForm);
  const [payForm,setPayForm]=useState({amount:"",date:new Date().toISOString().slice(0,10),note:""});

  // Debts the current user is allowed to see
  const myDebts=useMemo(()=>
    (debts||[]).filter(d=>d.userId===currentUser.id).sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt))
  ,[debts,currentUser]);

  const allDebts=useMemo(()=>{
    let l=[...(debts||[])];
    if(fUser!=="all") l=l.filter(d=>d.userId===+fUser);
    if(fStatus!=="all") l=l.filter(d=>d.status===fStatus);
    if(search){
      const s=search.toLowerCase();
      l=l.filter(d=>{
        const u=users.find(x=>x.id===d.userId);
        return d.description.toLowerCase().includes(s)||u?.name.toLowerCase().includes(s)||d.comment?.toLowerCase().includes(s);
      });
    }
    return l.sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
  },[debts,fUser,fStatus,search,users]);

  // Owner summary
  const ownerSummary=useMemo(()=>{
    const byUser={};
    (debts||[]).filter(d=>d.status!=="погашен").forEach(d=>{
      if(!byUser[d.userId]) byUser[d.userId]={userId:d.userId,active:0,count:0};
      byUser[d.userId].active+=d.remaining;
      byUser[d.userId].count++;
    });
    return Object.values(byUser).sort((a,b)=>b.active-a.active);
  },[debts]);

  const totalActive=(debts||[]).filter(d=>d.status!=="погашен").reduce((s,d)=>s+d.remaining,0);

  // ── CRUD ──
  const validate=()=>{
    const e={};
    if(!form.amount||+form.amount<=0) e.amount="Укажите сумму > 0";
    if(!form.description.trim()) e.description="Обязательное поле";
    if(!form.date) e.date="!";
    setErrs(e);return!Object.keys(e).length;
  };

  const openNew=()=>{setEdit(null);setForm(emptyForm);setErrs({});setModal(true)};
  const openEdit=d=>{
    setEdit(d);
    setForm({amount:d.amount,description:d.description,date:d.date,dueDate:d.dueDate||"",status:d.status,comment:d.comment||""});
    setErrs({});setModal(true);
  };

  const save=()=>{
    if(!validate()) return;
    const now=new Date().toISOString();
    if(edit){
      setDebts(p=>(p||[]).map(d=>d.id===edit.id?{
        ...d,
        amount:+form.amount,
        remaining:d.remaining+(+form.amount-d.amount), // adjust remaining by delta
        description:form.description,
        date:form.date,
        dueDate:form.dueDate||null,
        status:form.status,
        comment:form.comment,
        updatedAt:now,
      }:d));
      addLog(`Долг обновлён: ${form.description}`);
      setToast({message:"Обновлено",type:"success"});
    } else {
      const id=Date.now();
      setDebts(p=>[...(p||[]),{
        id,userId:currentUser.id,amount:+form.amount,remaining:+form.amount,
        description:form.description,date:form.date,dueDate:form.dueDate||null,
        status:"активен",comment:form.comment,payments:[],createdAt:now,
      }]);
      addLog(`Долг добавлен: ${form.description} ${form.amount}₽`);
      setToast({message:"Долг записан",type:"success"});
    }
    setModal(false);
  };

  const doDelete=d=>{
    setDebts(p=>(p||[]).filter(x=>x.id!==d.id));
    addLog(`Долг удалён: ${d.description}`);
    setToast({message:"Удалено",type:"error"});
    setConfirm(null);
  };

  // ── Partial payment ──
  const openPay=d=>{setPayModal(d);setPayForm({amount:"",date:new Date().toISOString().slice(0,10),note:""});setPayErrs({});};
  const savePay=()=>{
    const e={};
    if(!payForm.amount||+payForm.amount<=0) e.amount="Укажите сумму > 0";
    if(+payForm.amount>payModal.remaining) e.amount=`Не больше остатка (${payModal.remaining}₽)`;
    setPayErrs(e);if(Object.keys(e).length) return;
    const now=new Date().toISOString();
    setDebts(p=>(p||[]).map(d=>{
      if(d.id!==payModal.id) return d;
      const newRemaining=+(d.remaining-+payForm.amount).toFixed(2);
      const newStatus=newRemaining<=0?"погашен":newRemaining<d.amount?"частично погашен":"активен";
      return{...d,remaining:newRemaining,status:newStatus,payments:[...(d.payments||[]),{id:Date.now(),amount:+payForm.amount,date:payForm.date,note:payForm.note}],updatedAt:now};
    }));
    addLog(`Погашение долга: ${payModal.description} −${payForm.amount}₽`);
    setToast({message:"Платёж записан",type:"success"});
    setPayModal(null);
  };

  const statusColor=s=>s==="погашен"?"success":s==="частично погашен"?"orange":"danger";
  const dueBadge=d=>{
    if(!d.dueDate||d.status==="погашен") return null;
    const days=Math.ceil((new Date(d.dueDate)-new Date())/(1000*60*60*24));
    if(days<0) return <Badge color="danger" s={{fontSize:10}}>Просрочен на {-days}д</Badge>;
    if(days<=3) return <Badge color="orange" s={{fontSize:10}}>Срок через {days}д</Badge>;
    return null;
  };

  const DebtCard=({d,canEdit:ce})=>{
    const pct=d.amount>0?Math.round((1-d.remaining/d.amount)*100):100;
    const owner=users.find(u=>u.id===d.userId);
    return(
      <Card s={{borderLeft:`3px solid ${C[statusColor(d.status)]}`}}>
        <div style={{display:"flex",flexWrap:"wrap",gap:12,alignItems:"flex-start"}}>
          {isOwner&&owner&&(
            <div style={{display:"flex",alignItems:"center",gap:8,minWidth:130}}>
              <div style={{width:32,height:32,borderRadius:8,background:`${C.primary}15`,color:C.primary,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:14}}>{owner.name.charAt(0)}</div>
              <div style={{fontSize:12,fontWeight:600,color:C.text}}>{owner.name.split(" ").slice(0,2).join(" ")}</div>
            </div>
          )}
          <div style={{flex:"1 1 180px"}}>
            <div style={{fontSize:14,fontWeight:700,color:C.text}}>{d.description}</div>
            <div style={{fontSize:11,color:C.dim,marginTop:2}}>Добавлен: {fmtShort(d.createdAt)}{d.dueDate&&` · Срок: ${fmtShort(d.dueDate)}`}</div>
            {d.comment&&<div style={{fontSize:11,color:C.muted,marginTop:2,fontStyle:"italic"}}>{d.comment}</div>}
          </div>
          <div style={{textAlign:"right",minWidth:110}}>
            <div style={{fontSize:20,fontWeight:800,color:d.status==="погашен"?C.success:C.danger}}>{d.remaining.toLocaleString("ru")}₽</div>
            {d.remaining!==d.amount&&<div style={{fontSize:11,color:C.dim}}>из {d.amount.toLocaleString("ru")}₽</div>}
            <Badge color={statusColor(d.status)} s={{marginTop:4,fontSize:10}}>{d.status}</Badge>
            {dueBadge(d)&&<div style={{marginTop:4}}>{dueBadge(d)}</div>}
          </div>
          {ce&&(
            <div style={{display:"flex",gap:4,flexDirection:"column"}}>
              {d.status!=="погашен"&&<Btn sz="sm" v="success" onClick={()=>openPay(d)} icon={<I.check size={13}/>}>Погасить</Btn>}
              <div style={{display:"flex",gap:4}}>
                <Btn v="ghost" sz="sm" onClick={()=>openEdit(d)} icon={<I.edit size={13}/>}/>
                <Btn v="ghost" sz="sm" onClick={()=>setConfirm({title:"Удалить долг?",message:`Удалить "${d.description}"?`,onConfirm:()=>doDelete(d)})} icon={<I.trash size={13}/>}/>
              </div>
            </div>
          )}
        </div>
        {/* Progress bar */}
        {d.amount>0&&d.status!=="активен"&&(
          <div style={{marginTop:10}}>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:C.dim,marginBottom:2}}>
              <span>Погашено: {pct}%</span><span>Остаток: {d.remaining.toLocaleString("ru")}₽</span>
            </div>
            <div style={{height:4,background:C.bg,borderRadius:2,overflow:"hidden"}}>
              <div style={{height:"100%",width:`${pct}%`,background:C.success,borderRadius:2,transition:"width .4s"}}/>
            </div>
          </div>
        )}
        {/* Payment history */}
        {(d.payments||[]).length>0&&(
          <div style={{marginTop:8,paddingTop:8,borderTop:`1px solid ${C.border}`}}>
            <div style={{fontSize:11,color:C.dim,marginBottom:4}}>История погашений:</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
              {(d.payments||[]).map(p=>(
                <div key={p.id} style={{padding:"3px 9px",background:C.successBg,borderRadius:6,border:`1px solid ${C.success}20`,fontSize:11}}>
                  <span style={{fontWeight:700,color:C.success}}>−{p.amount.toLocaleString("ru")}₽</span>
                  <span style={{color:C.dim,marginLeft:5}}>{fmtShort(p.date)}{p.note&&` · ${p.note}`}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
    );
  };

  const tabStyle=active=>({padding:"7px 16px",borderRadius:7,border:`1px solid ${active?C.primary:C.border}`,background:active?C.primaryBg:C.surface,color:active?C.primary:C.muted,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit"});

  return(
    <div>
      <PageH title={isOwner?"Долги сотрудников":"Мои долги"}>
        {isOwner&&(
          <div style={{display:"flex",gap:5}}>
            <button onClick={()=>setTab("all")} style={tabStyle(tab==="all")}>Все долги</button>
            <button onClick={()=>setTab("my")} style={tabStyle(tab==="my")}>Мои долги</button>
          </div>
        )}
        {tab==="my"&&<Btn onClick={openNew} icon={<I.plus size={15}/>}>Добавить долг</Btn>}
      </PageH>

      {/* Owner summary view */}
      {isOwner&&tab==="all"&&(
        <>
          {/* Filters */}
          <Card s={{marginBottom:16,padding:"12px 16px"}}>
            <div style={{display:"flex",flexWrap:"wrap",gap:8,alignItems:"center"}}>
              <SearchBox value={search} onChange={e=>setSearch(e.target.value)} ph="Поиск..."/>
              <select value={fUser} onChange={e=>setFUser(e.target.value)} style={{padding:"7px 9px",background:C.bg,border:`1px solid ${C.border}`,borderRadius:7,color:C.text,fontSize:12,fontFamily:"inherit"}}>
                <option value="all">Все сотрудники</option>
                {users.filter(u=>u.status==="active").map(u=><option key={u.id} value={u.id}>{u.name.split(" ").slice(0,2).join(" ")}</option>)}
              </select>
              <select value={fStatus} onChange={e=>setFStatus(e.target.value)} style={{padding:"7px 9px",background:C.bg,border:`1px solid ${C.border}`,borderRadius:7,color:C.text,fontSize:12,fontFamily:"inherit"}}>
                <option value="all">Все статусы</option>
                {DEBT_STATUSES.map(s=><option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </Card>

          {/* Summary stats */}
          <div style={{display:"flex",flexWrap:"wrap",gap:12,marginBottom:16}}>
            <Stat icon={<I.alert size={18}/>} label="Общий долг (активные)" value={`${totalActive.toLocaleString("ru")}₽`} color={C.danger}/>
            <Stat icon={<I.users size={18}/>} label="Должников" value={ownerSummary.length} color={C.orange}/>
            <Stat icon={<I.file size={18}/>} label="Всего записей" value={(debts||[]).length} color={C.info}/>
          </div>

          {/* Per-user summary */}
          {ownerSummary.length>0&&(
            <Card s={{marginBottom:16}}>
              <Title>Долги по сотрудникам</Title>
              <div style={{display:"grid",gap:6}}>
                {ownerSummary.map(s=>{
                  const u=users.find(x=>x.id===s.userId);
                  return(
                    <div key={s.userId} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:`1px solid ${C.border}`}}>
                      <div style={{width:28,height:28,borderRadius:7,background:`${C.danger}15`,color:C.danger,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:12}}>{u?.name.charAt(0)||"?"}</div>
                      <span style={{flex:1,fontSize:13,fontWeight:500,color:C.text}}>{u?.name.split(" ").slice(0,2).join(" ")||"—"}</span>
                      <Badge color="primary" s={{fontSize:11}}>{s.count} долг{s.count===1?"":"а"}</Badge>
                      <span style={{fontWeight:700,color:C.danger,fontSize:14}}>{s.active.toLocaleString("ru")}₽</span>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* All debts list */}
          <div style={{display:"grid",gap:10}}>
            {allDebts.map(d=><DebtCard key={d.id} d={d} canEdit={false}/>)}
            {allDebts.length===0&&<div style={{textAlign:"center",padding:50,color:C.dim,fontSize:13}}><I.check size={32}/><p style={{marginTop:10}}>Долгов не найдено</p></div>}
          </div>
        </>
      )}

      {/* My debts view (all non-owner users + owner "my" tab) */}
      {tab==="my"&&(
        <>
          <div style={{display:"flex",flexWrap:"wrap",gap:12,marginBottom:16}}>
            <Stat icon={<I.alert size={18}/>} label="Активный долг" value={`${myDebts.filter(d=>d.status!=="погашен").reduce((s,d)=>s+d.remaining,0).toLocaleString("ru")}₽`} color={C.danger}/>
            <Stat icon={<I.file size={18}/>} label="Всего записей" value={myDebts.length} color={C.info}/>
            <Stat icon={<I.check size={18}/>} label="Погашено" value={myDebts.filter(d=>d.status==="погашен").length} color={C.success}/>
          </div>
          <div style={{display:"grid",gap:10}}>
            {myDebts.map(d=><DebtCard key={d.id} d={d} canEdit={true}/>)}
            {myDebts.length===0&&(
              <div style={{textAlign:"center",padding:50,color:C.dim,fontSize:13}}>
                <I.check size={32}/><p style={{marginTop:10}}>Долгов нет. Нажмите «Добавить долг».</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Add/Edit modal */}
      <Modal open={modal} onClose={()=>setModal(false)} title={edit?"Редактировать долг":"Новый долг"} width={480}>
        <Inp label="Сумма (₽)" type="number" min="1" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})} error={errs.amount} placeholder="Например: 5000"/>
        <Inp label="Описание / причина" value={form.description} onChange={e=>setForm({...form,description:e.target.value})} error={errs.description} placeholder="Например: Аванс за январь"/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 12px"}}>
          <Inp label="Дата возникновения" type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})} error={errs.date}/>
          <Inp label="Срок погашения (необязательно)" type="date" value={form.dueDate} onChange={e=>setForm({...form,dueDate:e.target.value})}/>
        </div>
        {edit&&(
          <Sel label="Статус" value={form.status} onChange={e=>setForm({...form,status:e.target.value})} options={DEBT_STATUSES.map(s=>({value:s,label:s}))}/>
        )}
        <Txa label="Комментарий (необязательно)" value={form.comment} onChange={e=>setForm({...form,comment:e.target.value})} placeholder="Дополнительные сведения"/>
        <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:6}}>
          <Btn v="secondary" onClick={()=>setModal(false)}>Отмена</Btn>
          <Btn v={edit?"primary":"danger"} onClick={save}>{edit?"Сохранить":"Добавить долг"}</Btn>
        </div>
      </Modal>

      {/* Partial payment modal */}
      <Modal open={!!payModal} onClose={()=>setPayModal(null)} title="Погашение долга" width={400}>
        {payModal&&(
          <>
            <div style={{padding:"8px 12px",background:C.dangerBg,borderRadius:8,border:`1px solid ${C.danger}20`,marginBottom:14,fontSize:13}}>
              <span style={{color:C.muted}}>{payModal.description} · </span>
              <span style={{fontWeight:700,color:C.danger}}>Остаток: {payModal.remaining.toLocaleString("ru")}₽</span>
            </div>
            <Inp label="Сумма погашения (₽)" type="number" min="1" max={payModal.remaining} value={payForm.amount} onChange={e=>setPayForm({...payForm,amount:e.target.value})} error={payErrs.amount} placeholder={`До ${payModal.remaining}₽`}/>
            <Inp label="Дата платежа" type="date" value={payForm.date} onChange={e=>setPayForm({...payForm,date:e.target.value})}/>
            <Inp label="Примечание (необязательно)" value={payForm.note} onChange={e=>setPayForm({...payForm,note:e.target.value})} placeholder="Например: наличными"/>
            {payForm.amount&&+payForm.amount>0&&+payForm.amount<=payModal.remaining&&(
              <div style={{padding:"8px 12px",background:C.successBg,borderRadius:8,border:`1px solid ${C.success}20`,marginBottom:12,fontSize:12,color:C.success}}>
                После погашения останется: <strong>{(payModal.remaining-+payForm.amount).toLocaleString("ru")}₽</strong>
                {+payForm.amount===payModal.remaining&&" — долг будет закрыт"}
              </div>
            )}
            <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:6}}>
              <Btn v="secondary" onClick={()=>setPayModal(null)}>Отмена</Btn>
              <Btn v="success" onClick={savePay} icon={<I.check size={14}/>}>Записать платёж</Btn>
            </div>
          </>
        )}
      </Modal>

      {confirm&&<Confirm open={!!confirm} onClose={()=>setConfirm(null)} title={confirm.title} message={confirm.message} onConfirm={confirm.onConfirm}/>}
      {toast&&<Toast {...toast} onClose={()=>setToast(null)}/>}
    </div>
  );
}
