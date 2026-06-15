import { useContext, useState } from "react";
import { AppContext } from "../context/AppContext";
import { C } from "../theme";
import { I } from "../icons";
import { ROLES, fmtShort, hashPassword } from "../constants";
import { Badge, Btn, Inp, Sel, Modal, Toast, TH, TD, Card, PageH, SearchBox } from "../components/ui";

export default function UsersPage(){
  const {users,setUsers,addLog,currentUser,baseSalaries,setBaseSalaries}=useContext(AppContext);
  const [modal,setModal]=useState(false);
  const [edit,setEdit]=useState(null);
  const [search,setSearch]=useState("");
  const [toast,setToast]=useState(null);
  const [form,setForm]=useState({name:"",email:"",password:"",roleId:2,status:"active",baseSalary:""});
  const [errs,setErrs]=useState({});

  const filtered=users.filter(u=>u.name.toLowerCase().includes(search.toLowerCase())||u.email.toLowerCase().includes(search.toLowerCase()));
  const openNew=()=>{setEdit(null);setForm({name:"",email:"",password:"",roleId:2,status:"active",baseSalary:""});setErrs({});setModal(true)};
  const openEdit=u=>{setEdit(u);setForm({name:u.name,email:u.email,password:"",roleId:u.roleId,status:u.status,baseSalary:baseSalaries[u.id]||""});setErrs({});setModal(true)};
  const validate=()=>{const e={};if(!form.name.trim())e.name="!";if(!form.email.trim())e.email="!";else if(!/\S+@\S+\.\S+/.test(form.email))e.email="Email";if(!edit&&!form.password)e.password="!";setErrs(e);return!Object.keys(e).length};
  const save=()=>{
    if(!validate())return;
    const sal=form.baseSalary?+form.baseSalary:0;
    if(edit){
      setUsers(p=>p.map(u=>u.id===edit.id?{...u,name:form.name,email:form.email,roleId:+form.roleId,status:form.status,...(form.password?{password:hashPassword(form.password)}:{})}:u));
      if(sal>0) setBaseSalaries(p=>({...p,[edit.id]:sal}));
      else setBaseSalaries(p=>{const n={...p};delete n[edit.id];return n;});
      addLog(`Обновлён: ${form.name}`);setToast({message:"Обновлён",type:"success"});
    }else{
      const newId=Date.now();
      setUsers(p=>[...p,{id:newId,name:form.name,email:form.email,password:hashPassword(form.password),roleId:+form.roleId,status:form.status,createdAt:new Date().toISOString()}]);
      if(sal>0) setBaseSalaries(p=>({...p,[newId]:sal}));
      addLog(`Создан: ${form.name}`);setToast({message:"Создан",type:"success"});
    }
    setModal(false);
  };
  const toggleBlock=u=>{const ns=u.status==="active"?"blocked":"active";setUsers(p=>p.map(x=>x.id===u.id?{...x,status:ns}:x));addLog(`${ns==="blocked"?"Заблок.":"Разблок."}: ${u.name}`);setToast({message:ns==="blocked"?"Заблокирован":"Разблокирован",type:ns==="blocked"?"error":"success"})};

  return(
    <div>
      <PageH title="Пользователи"><SearchBox value={search} onChange={e=>setSearch(e.target.value)}/><Btn onClick={openNew} icon={<I.plus size={15}/>}>Добавить</Btn></PageH>
      <Card s={{padding:0,overflow:"hidden"}}><div style={{overflowX:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr><TH>ФИО</TH><TH>Email</TH><TH>Роль</TH><TH>Статус</TH><TH>Создан</TH><TH></TH></tr></thead>
          <tbody>{filtered.map(u=>{const role=ROLES.find(r=>r.id===u.roleId);return(
            <tr key={u.id} style={{borderBottom:`1px solid ${C.border}`}}>
              <TD s={{fontWeight:500}}>{u.name}</TD><TD s={{color:C.muted}}>{u.email}</TD>
              <TD><Badge color={u.roleId===1?"danger":u.roleId===2?"info":"primary"}>{role?.label}</Badge></TD>
              <TD><Badge color={u.status==="active"?"success":"danger"}>{u.status==="active"?"Активен":"Заблокирован"}</Badge></TD>
              <TD s={{color:C.dim,fontSize:12}}>{fmtShort(u.createdAt)}</TD>
              <TD><div style={{display:"flex",gap:4}}><Btn v="ghost" sz="sm" onClick={()=>openEdit(u)} icon={<I.edit size={14}/>}/>{u.id!==currentUser.id&&<Btn v="ghost" sz="sm" onClick={()=>toggleBlock(u)} icon={u.status==="active"?<I.lock size={14}/>:<I.unlock size={14}/>}/>}</div></TD>
            </tr>)})}</tbody>
        </table></div></Card>
      <Modal open={modal} onClose={()=>setModal(false)} title={edit?"Редактировать":"Новый пользователь"}>
        <Inp label="ФИО" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} error={errs.name}/>
        <Inp label="Email" type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} error={errs.email}/>
        <Inp label={edit?"Новый пароль":"Пароль"} type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} error={errs.password}/>
        <Sel label="Роль" value={form.roleId} onChange={e=>setForm({...form,roleId:+e.target.value})} options={ROLES.map(r=>({value:r.id,label:r.label}))}/>
        <Sel label="Статус" value={form.status} onChange={e=>setForm({...form,status:e.target.value})} options={[{value:"active",label:"Активен"},{value:"blocked",label:"Заблокирован"}]}/>
        <Inp label="Базовая ставка (₽, необязательно)" type="number" min="0" value={form.baseSalary} onChange={e=>setForm({...form,baseSalary:e.target.value})} style={{}} placeholder="Например: 50000"/>
        <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:6}}><Btn v="secondary" onClick={()=>setModal(false)}>Отмена</Btn><Btn onClick={save}>{edit?"Сохранить":"Создать"}</Btn></div>
      </Modal>
      {toast&&<Toast {...toast} onClose={()=>setToast(null)}/>}
    </div>
  );
}
