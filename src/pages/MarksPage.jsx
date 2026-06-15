import { useContext, useState, useMemo } from "react";
import { AppContext } from "../context/AppContext";
import { C } from "../theme";
import { I } from "../icons";
import { ROLES, MARK_TYPES, fmtDate, fmtShort } from "../constants";
import { Badge, Btn, Sel, Txa, Modal, Confirm, Toast, TH, TD, Card, PageH, SearchBox } from "../components/ui";

export default function MarksPage(){
  const {marks,setMarks,users,tasks,products,currentUser,addLog}=useContext(AppContext);
  const [modal,setModal]=useState(false);
  const [edit,setEdit]=useState(null);
  const [confirm,setConfirm]=useState(null);
  const [toast,setToast]=useState(null);
  const [search,setSearch]=useState("");
  const [fType,setFType]=useState("all");
  const [fEmployee,setFEmployee]=useState("all");
  const [errs,setErrs]=useState({});
  const role=ROLES.find(r=>r.id===currentUser.roleId);
  const isAdmin=role?.name==="admin";
  const isManager=role?.name==="manager";
  const isWorker=role?.name==="worker";
  const canCreate=isAdmin||isManager;
  const canEditDel=isAdmin;

  const workers=users.filter(u=>u.roleId===3);
  const completedTasks=tasks.filter(t=>t.status==="завершено"||t.status==="просрочено");
  const empty={employeeId:workers[0]?.id||"",markType:"присутствие",relatedTaskId:"",comment:""};
  const [form,setForm]=useState(empty);

  const visible=useMemo(()=>{
    let list=isWorker?marks.filter(m=>m.employeeId===currentUser.id):[...marks];
    if(search){const s=search.toLowerCase();list=list.filter(m=>{const emp=users.find(u=>u.id===m.employeeId);return emp?.name.toLowerCase().includes(s)||m.comment?.toLowerCase().includes(s)})}
    if(fType!=="all")list=list.filter(m=>m.markType===fType);
    if(fEmployee!=="all")list=list.filter(m=>m.employeeId===+fEmployee);
    return list.sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
  },[marks,search,fType,fEmployee,isWorker,currentUser]);

  const openNew=()=>{setEdit(null);setForm(empty);setErrs({});setModal(true)};
  const openEdit=m=>{setEdit(m);setForm({employeeId:m.employeeId,markType:m.markType,relatedTaskId:m.relatedTaskId||"",comment:m.comment||""});setErrs({});setModal(true)};
  const validate=()=>{const e={};if(!form.employeeId)e.employeeId="!";setErrs(e);return!Object.keys(e).length};

  const save=()=>{
    if(!validate())return;
    const empName=users.find(u=>u.id===+form.employeeId)?.name?.split(" ").slice(0,2).join(" ");
    if(edit){
      setMarks(p=>p.map(m=>m.id===edit.id?{...m,employeeId:+form.employeeId,markType:form.markType,relatedTaskId:form.relatedTaskId?+form.relatedTaskId:null,comment:form.comment}:m));
      addLog(`Отметка обновлена: ${empName}`);
      setToast({message:"Обновлено",type:"success"});
    }else{
      setMarks(p=>[...p,{id:Date.now(),employeeId:+form.employeeId,markType:form.markType,relatedTaskId:form.relatedTaskId?+form.relatedTaskId:null,createdBy:currentUser.id,createdAt:new Date().toISOString(),comment:form.comment}]);
      addLog(`Отметка: ${form.markType} — ${empName}`);
      setToast({message:"Отметка создана",type:"success"});
    }
    setModal(false);
  };

  const del=m=>{const empName=users.find(u=>u.id===m.employeeId)?.name?.split(" ").slice(0,2).join(" ");setConfirm({title:"Удалить отметку?",message:`Удалить отметку для ${empName}?`,onConfirm:()=>{setMarks(p=>p.filter(x=>x.id!==m.id));addLog(`Удалена отметка: ${empName}`);setToast({message:"Удалено",type:"error"});setConfirm(null)}})};

  const mtColor=t=>t==="присутствие"?"success":"info";
  const mtIcon=t=>t==="присутствие"?<I.user size={14}/>:<I.check size={14}/>;

  const todayPresent=marks.filter(m=>m.markType==="присутствие"&&fmtShort(m.createdAt)===fmtShort(new Date().toISOString())).map(m=>m.employeeId);
  const markPresence=(wId)=>{
    if(todayPresent.includes(wId)) return;
    setMarks(p=>[...p,{id:Date.now(),employeeId:wId,markType:"присутствие",relatedTaskId:null,createdBy:currentUser.id,createdAt:new Date().toISOString(),comment:""}]);
    const empName=users.find(u=>u.id===wId)?.name?.split(" ").slice(0,2).join(" ");
    addLog(`Присутствие: ${empName}`);
    setToast({message:`${empName} — отмечен`,type:"success"});
  };

  return(
    <div>
      <PageH title="Отметки сотрудников">
        <SearchBox value={search} onChange={e=>setSearch(e.target.value)}/>
        <select value={fType} onChange={e=>setFType(e.target.value)} style={{padding:"7px 9px",background:C.bg,border:`1px solid ${C.border}`,borderRadius:7,color:C.text,fontSize:12,fontFamily:"inherit"}}><option value="all">Все типы</option>{MARK_TYPES.map(t=><option key={t} value={t}>{t}</option>)}</select>
        {!isWorker&&<select value={fEmployee} onChange={e=>setFEmployee(e.target.value)} style={{padding:"7px 9px",background:C.bg,border:`1px solid ${C.border}`,borderRadius:7,color:C.text,fontSize:12,fontFamily:"inherit"}}><option value="all">Все сотрудники</option>{workers.map(w=><option key={w.id} value={w.id}>{w.name.split(" ").slice(0,2).join(" ")}</option>)}</select>}
        {canCreate&&<Btn onClick={openNew} icon={<I.plus size={15}/>}>Новая отметка</Btn>}
      </PageH>

      {canCreate&&(
        <Card s={{marginBottom:16}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
            <I.user size={16}/>
            <span style={{fontSize:14,fontWeight:700,color:C.text}}>Присутствие сегодня</span>
            <span style={{fontSize:12,color:C.dim}}>{fmtShort(new Date().toISOString())}</span>
          </div>
          <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
            {workers.map(w=>{
              const present=todayPresent.includes(w.id);
              return(
                <button key={w.id} onClick={()=>markPresence(w.id)} disabled={present} style={{display:"flex",alignItems:"center",gap:6,padding:"8px 14px",borderRadius:8,border:`1px solid ${present?C.success+"40":C.border}`,background:present?C.successBg:C.surface2,color:present?C.success:C.text,cursor:present?"default":"pointer",fontFamily:"inherit",fontSize:13,fontWeight:500,opacity:present?.8:1,transition:"all .15s"}}>
                  {present?<I.check size={14}/>:<I.user size={14}/>}
                  {w.name.split(" ").slice(0,2).join(" ")}
                  {present&&<span style={{fontSize:10,marginLeft:2}}>✓</span>}
                </button>
              );
            })}
          </div>
        </Card>
      )}

      <Card s={{padding:0,overflow:"hidden"}}><div style={{overflowX:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr>
          <TH>Дата/Время</TH><TH>Сотрудник</TH><TH>Тип</TH><TH>Заказ</TH><TH>Автор</TH><TH>Комментарий</TH>{canEditDel&&<TH></TH>}
        </tr></thead>
          <tbody>{visible.map(m=>{
            const emp=users.find(u=>u.id===m.employeeId);
            const author=users.find(u=>u.id===m.createdBy);
            const task=m.relatedTaskId?tasks.find(t=>t.id===m.relatedTaskId):null;
            const prod=task?products.find(p=>p.id===task.productId):null;
            return(
              <tr key={m.id} style={{borderBottom:`1px solid ${C.border}`}}>
                <TD s={{fontSize:12,whiteSpace:"nowrap"}}>{fmtDate(m.createdAt)}</TD>
                <TD s={{fontWeight:500}}>{emp?.name?.split(" ").slice(0,2).join(" ")||"—"}</TD>
                <TD><Badge color={mtColor(m.markType)}>{mtIcon(m.markType)} <span style={{marginLeft:4}}>{m.markType}</span></Badge></TD>
                <TD s={{color:C.muted,fontSize:12}}>{task?`#${task.id} ${prod?.name||""} x${task.quantity}`:"—"}</TD>
                <TD s={{color:C.dim,fontSize:12}}>{author?.name?.split(" ").slice(0,2).join(" ")||"—"}</TD>
                <TD s={{color:C.muted,fontSize:12,maxWidth:200,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{m.comment||"—"}</TD>
                {canEditDel&&<TD><div style={{display:"flex",gap:4}}>
                  <Btn v="ghost" sz="sm" onClick={()=>openEdit(m)} icon={<I.edit size={13}/>}/>
                  <Btn v="ghost" sz="sm" onClick={()=>del(m)} icon={<I.trash size={13}/>}/>
                </div></TD>}
              </tr>
            );
          })}</tbody>
        </table></div></Card>
      {visible.length===0&&<div style={{textAlign:"center",padding:50,color:C.dim}}><I.clip size={36}/><p style={{marginTop:10}}>Нет отметок</p></div>}

      <Modal open={modal} onClose={()=>setModal(false)} title={edit?"Редактировать отметку":"Новая отметка"}>
        <Sel label="Сотрудник" value={form.employeeId} onChange={e=>setForm({...form,employeeId:e.target.value})} error={errs.employeeId} options={[{value:"",label:"Выберите"},...workers.map(w=>({value:w.id,label:w.name}))]}/>
        <Sel label="Тип отметки" value={form.markType} onChange={e=>setForm({...form,markType:e.target.value})} options={MARK_TYPES.map(t=>({value:t,label:t}))}/>
        {form.markType==="выполненный заказ"&&(
          <Sel label="Связанный заказ" value={form.relatedTaskId} onChange={e=>setForm({...form,relatedTaskId:e.target.value})} options={[{value:"",label:"Без привязки"},...completedTasks.filter(t=>(t.userIds||[]).includes(+form.employeeId)).map(t=>{const p=products.find(x=>x.id===t.productId);return{value:t.id,label:`#${t.id} ${p?.name||""} x${t.quantity}`}})]}/>
        )}
        <Txa label="Комментарий" value={form.comment} onChange={e=>setForm({...form,comment:e.target.value})}/>
        <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:6}}><Btn v="secondary" onClick={()=>setModal(false)}>Отмена</Btn><Btn onClick={save}>{edit?"Сохранить":"Создать"}</Btn></div>
      </Modal>
      {confirm&&<Confirm open onClose={()=>setConfirm(null)} {...confirm}/>}
      {toast&&<Toast {...toast} onClose={()=>setToast(null)}/>}
    </div>
  );
}
