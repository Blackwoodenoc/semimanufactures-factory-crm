import { useContext, useState, useMemo } from "react";
import { AppContext } from "../context/AppContext";
import { C } from "../theme";
import { I } from "../icons";
import { ROLES, NOTIF_TYPES, fmtDate } from "../constants";
import { Badge, Btn, Inp, Sel, Txa, Modal, Confirm, Toast, Card, PageH, SearchBox } from "../components/ui";

export default function NotificationsPage(){
  const {notifications,setNotifications,users,currentUser,addLog}=useContext(AppContext);
  const [modal,setModal]=useState(false);
  const [edit,setEdit]=useState(null);
  const [confirm,setConfirm]=useState(null);
  const [toast,setToast]=useState(null);
  const [search,setSearch]=useState("");
  const [fType,setFType]=useState("all");
  const [errs,setErrs]=useState({});
  const role=ROLES.find(r=>r.id===currentUser.roleId);
  const isAdmin=role?.name==="admin";

  const empty={title:"",type:"информация",content:"",targetAll:true,targetUsers:[]};
  const [form,setForm]=useState(empty);

  const visible=useMemo(()=>{
    let list=isAdmin?[...notifications]:notifications.filter(n=>n.targetAll||n.targetUsers?.includes(currentUser.id));
    if(search)list=list.filter(n=>n.title.toLowerCase().includes(search.toLowerCase())||n.content.toLowerCase().includes(search.toLowerCase()));
    if(fType!=="all")list=list.filter(n=>n.type===fType);
    return list.sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
  },[notifications,search,fType,isAdmin,currentUser]);

  const markRead=(id)=>{
    setNotifications(p=>p.map(n=>n.id===id?{...n,readBy:[...(n.readBy||[]).filter(x=>x!==currentUser.id),currentUser.id]}:n));
  };

  const openNew=()=>{setEdit(null);setForm(empty);setErrs({});setModal(true)};
  const openEdit=n=>{setEdit(n);setForm({title:n.title,type:n.type,content:n.content,targetAll:n.targetAll,targetUsers:n.targetUsers||[]});setErrs({});setModal(true)};
  const validate=()=>{const e={};if(!form.title.trim())e.title="!";if(!form.content.trim())e.content="!";setErrs(e);return!Object.keys(e).length};

  const save=()=>{
    if(!validate())return;
    if(edit){
      setNotifications(p=>p.map(n=>n.id===edit.id?{...n,title:form.title,type:form.type,content:form.content,targetAll:form.targetAll,targetUsers:form.targetUsers}:n));
      addLog(`Уведомление обновлено: ${form.title}`);
      setToast({message:"Обновлено",type:"success"});
    }else{
      setNotifications(p=>[...p,{id:Date.now(),title:form.title,type:form.type,content:form.content,createdBy:currentUser.id,createdAt:new Date().toISOString(),readBy:[currentUser.id],targetAll:form.targetAll,targetUsers:form.targetUsers}]);
      addLog(`Уведомление создано: ${form.title}`);
      setToast({message:"Создано",type:"success"});
    }
    setModal(false);
  };

  const del=n=>{setConfirm({title:"Удалить уведомление?",message:`Удалить «${n.title}»?`,onConfirm:()=>{setNotifications(p=>p.filter(x=>x.id!==n.id));addLog(`Удалено уведомление: ${n.title}`);setToast({message:"Удалено",type:"error"});setConfirm(null)}})};

  const nColor=t=>t==="ошибка"?"danger":t==="предупреждение"?"orange":"info";
  const nIcon=t=>t==="ошибка"?<I.alert size={16}/>:t==="предупреждение"?<I.alert size={16}/>:<I.bell size={16}/>;

  return(
    <div>
      <PageH title="Уведомления">
        <SearchBox value={search} onChange={e=>setSearch(e.target.value)}/>
        <select value={fType} onChange={e=>setFType(e.target.value)} style={{padding:"7px 9px",background:C.bg,border:`1px solid ${C.border}`,borderRadius:7,color:C.text,fontSize:12,fontFamily:"inherit"}}><option value="all">Все типы</option>{NOTIF_TYPES.map(t=><option key={t} value={t}>{t}</option>)}</select>
        {isAdmin&&<Btn onClick={openNew} icon={<I.plus size={15}/>}>Создать</Btn>}
      </PageH>
      <div style={{display:"grid",gap:10}}>
        {visible.map(n=>{
          const isRead=n.readBy?.includes(currentUser.id);
          const author=n.createdBy===0?"Система":users.find(u=>u.id===n.createdBy)?.name?.split(" ").slice(0,2).join(" ")||"Система";
          return(
            <Card key={n.id} s={{padding:"14px 18px",borderLeft:`3px solid ${n.type==="ошибка"?C.danger:n.type==="предупреждение"?C.orange:C.info}`,opacity:isRead?.85:1}}>
              <div style={{display:"flex",flexWrap:"wrap",alignItems:"flex-start",gap:12}}>
                <div style={{width:34,height:34,borderRadius:8,background:`${n.type==="ошибка"?C.danger:n.type==="предупреждение"?C.orange:C.info}15`,color:n.type==="ошибка"?C.danger:n.type==="предупреждение"?C.orange:C.info,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{nIcon(n.type)}</div>
                <div style={{flex:1,minWidth:200}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:2}}>
                    <span style={{fontSize:14,fontWeight:isRead?500:700,color:C.text}}>{n.title}</span>
                    {!isRead&&<div style={{width:7,height:7,borderRadius:"50%",background:C.primary}}/>}
                    <Badge color={nColor(n.type)}>{n.type}</Badge>
                  </div>
                  <div style={{fontSize:13,color:C.muted,lineHeight:1.5,marginBottom:4}}>{n.content}</div>
                  <div style={{fontSize:11,color:C.dim,display:"flex",gap:12,flexWrap:"wrap"}}>
                    <span>{fmtDate(n.createdAt)}</span>
                    <span>Автор: {author}</span>
                    {n.targetAll?<span>Для всех</span>:<span>Для: {n.targetUsers?.map(uid=>users.find(u=>u.id===uid)?.name?.split(" ")[0]).join(", ")}</span>}
                  </div>
                </div>
                <div style={{display:"flex",gap:5,flexShrink:0}}>
                  {!isRead&&<Btn v="ghost" sz="sm" onClick={()=>markRead(n.id)}>Прочитано</Btn>}
                  {isAdmin&&<Btn v="ghost" sz="sm" onClick={()=>openEdit(n)} icon={<I.edit size={13}/>}/>}
                  {isAdmin&&<Btn v="ghost" sz="sm" onClick={()=>del(n)} icon={<I.trash size={13}/>}/>}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
      {visible.length===0&&<div style={{textAlign:"center",padding:50,color:C.dim}}><I.bell size={36}/><p style={{marginTop:10}}>Нет уведомлений</p></div>}

      <Modal open={modal} onClose={()=>setModal(false)} title={edit?"Редактировать":"Новое уведомление"} width={520}>
        <Inp label="Заголовок" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} error={errs.title}/>
        <Sel label="Тип" value={form.type} onChange={e=>setForm({...form,type:e.target.value})} options={NOTIF_TYPES.map(t=>({value:t,label:t}))}/>
        <Txa label="Содержание" value={form.content} onChange={e=>setForm({...form,content:e.target.value})}/>
        <div style={{marginBottom:12}}>
          <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",fontSize:13,color:C.text}}>
            <input type="checkbox" checked={form.targetAll} onChange={e=>setForm({...form,targetAll:e.target.checked,targetUsers:e.target.checked?[]:form.targetUsers})} style={{accentColor:C.primary}}/>
            Для всех пользователей
          </label>
        </div>
        {!form.targetAll&&(
          <div style={{marginBottom:12}}>
            <label style={{display:"block",fontSize:12,fontWeight:500,color:C.muted,marginBottom:6}}>Выберите получателей</label>
            <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
              {users.map(u=>{
                const sel=form.targetUsers.includes(u.id);
                return <button key={u.id} onClick={()=>setForm({...form,targetUsers:sel?form.targetUsers.filter(x=>x!==u.id):[...form.targetUsers,u.id]})} style={{padding:"5px 10px",borderRadius:6,border:`1px solid ${sel?C.primary:C.border}`,background:sel?C.primaryBg:C.surface,color:sel?C.primary:C.muted,fontSize:12,cursor:"pointer",fontFamily:"inherit",fontWeight:sel?600:400}}>{u.name.split(" ").slice(0,2).join(" ")}</button>;
              })}
            </div>
          </div>
        )}
        <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:6}}><Btn v="secondary" onClick={()=>setModal(false)}>Отмена</Btn><Btn onClick={save}>{edit?"Сохранить":"Создать"}</Btn></div>
      </Modal>
      {confirm&&<Confirm open onClose={()=>setConfirm(null)} {...confirm}/>}
      {toast&&<Toast {...toast} onClose={()=>setToast(null)}/>}
    </div>
  );
}
