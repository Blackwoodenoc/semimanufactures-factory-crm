import { useContext, useState, useMemo } from "react";
import { AppContext } from "../context/AppContext";
import { C } from "../theme";
import { I } from "../icons";
import { ROLES, fmtDate } from "../constants";
import { Btn, Inp, Sel, Txa, Modal, Confirm, Toast, TH, TD, Card, PageH, SearchBox, Stat } from "../components/ui";

export default function ProductionOutputPage(){
  const {productionOutputs,setProductionOutputs,products,setProducts,inventoryMovements,setInventoryMovements,employeeHistory,setEmployeeHistory,productionPlans,setProductionPlans,users,currentUser,addLog,addNotification}=useContext(AppContext);
  const role=ROLES.find(r=>r.id===currentUser.roleId);
  const isWorker=role?.name==="worker";
  const workers=users.filter(u=>u.roleId===3&&u.status==="active");
  const ap=products.filter(p=>!p.deleted);

  const [modal,setModal]=useState(false);
  const [edit,setEdit]=useState(null);
  const [confirm,setConfirm]=useState(null);
  const [toast,setToast]=useState(null);
  const [search,setSearch]=useState("");
  const [fEmp,setFEmp]=useState("all");
  const [errs,setErrs]=useState({});

  const emptyForm={
    employeeId:isWorker?currentUser.id:(workers[0]?.id||""),
    productId:ap[0]?.id||"",
    quantity:"",
    date:new Date().toISOString().slice(0,16),
    comment:""
  };
  const [form,setForm]=useState(emptyForm);

  const list=useMemo(()=>{
    let l=[...(productionOutputs||[])];
    if(fEmp!=="all") l=l.filter(o=>o.employeeId===+fEmp);
    if(search){
      const s=search.toLowerCase();
      l=l.filter(o=>{
        const p=products.find(x=>x.id===o.productId);
        const u=users.find(x=>x.id===o.employeeId);
        return p?.name.toLowerCase().includes(s)||u?.name.toLowerCase().includes(s)||o.comment?.toLowerCase().includes(s);
      });
    }
    return l.sort((a,b)=>new Date(b.date)-new Date(a.date));
  },[productionOutputs,fEmp,search,products,users]);

  const openNew=()=>{setEdit(null);setForm(emptyForm);setErrs({});setModal(true)};
  const openEdit=(o)=>{
    setEdit(o);
    setForm({employeeId:o.employeeId,productId:o.productId,quantity:o.quantity,date:o.date.slice(0,16),comment:o.comment||""});
    setErrs({});setModal(true);
  };

  const validate=()=>{
    const e={};
    if(!form.employeeId) e.employeeId="!";
    if(!form.productId) e.productId="!";
    if(!form.quantity||+form.quantity<=0) e.quantity="Укажите > 0";
    if(!form.date) e.date="!";
    setErrs(e);return!Object.keys(e).length;
  };

  const revertOutput=(out)=>{
    setProducts(p=>p.map(x=>x.id===out.productId?{...x,stock:Math.max(0,x.stock-out.quantity),updatedAt:new Date().toISOString()}:x));
    setInventoryMovements(p=>p.filter(m=>m.refId!==`output-${out.id}`));
    const ds=out.date.slice(0,10);
    setEmployeeHistory(p=>p.map(h=>h.employeeId===out.employeeId&&h.date===ds?{...h,producedQty:Math.max(0,h.producedQty-out.quantity)}:h));
    setProductionPlans(p=>p.map(pl=>{
      if(pl.productId===out.productId&&pl.productionDate===ds&&pl.status!=="отменён"){
        const nc=Math.max(0,pl.completedQty-out.quantity);
        return{...pl,completedQty:nc,status:nc>=pl.plannedQty?"выполнен":nc>0?"в процессе":"запланирован"};
      }return pl;
    }));
  };

  const applyOutput=(out,stockBefore)=>{
    const newBalance=stockBefore+out.quantity;
    setProducts(p=>p.map(x=>x.id===out.productId?{...x,stock:x.stock+out.quantity,updatedAt:new Date().toISOString()}:x));
    setInventoryMovements(p=>[...p,{id:out.id+0.1,productId:out.productId,type:"output",quantity:out.quantity,balance:newBalance,refId:`output-${out.id}`,createdAt:out.date}]);
    const ds=out.date.slice(0,10);
    setEmployeeHistory(p=>{
      const ex=p.find(h=>h.employeeId===out.employeeId&&h.date===ds);
      if(ex) return p.map(h=>h.id===ex.id?{...h,producedQty:h.producedQty+out.quantity}:h);
      return [...p,{id:Date.now()+Math.random(),employeeId:out.employeeId,date:ds,attendance:"present",tasksCompleted:0,producedQty:out.quantity,workStart:"09:00",workEnd:"18:00",comment:""}];
    });
    setProductionPlans(p=>p.map(pl=>{
      if(pl.productId===out.productId&&pl.productionDate===ds&&pl.status!=="отменён"){
        const nc=Math.min(pl.plannedQty,pl.completedQty+out.quantity);
        return{...pl,completedQty:nc,status:nc>=pl.plannedQty?"выполнен":"в процессе"};
      }return pl;
    }));
  };

  const save=()=>{
    if(!validate()) return;
    const qty=+form.quantity;const productId=+form.productId;const employeeId=+form.employeeId;
    const now=new Date().toISOString();
    const curStock=products.find(p=>p.id===productId)?.stock||0;
    const prod=products.find(p=>p.id===productId);
    const emp=users.find(u=>u.id===employeeId);
    if(edit){
      const stockBefore=edit.productId===productId?Math.max(0,curStock-edit.quantity):curStock;
      revertOutput(edit);
      const newOut={...edit,productId,employeeId,quantity:qty,date:new Date(form.date).toISOString(),comment:form.comment,updatedAt:now};
      setProductionOutputs(p=>p.map(o=>o.id===edit.id?newOut:o));
      applyOutput(newOut,stockBefore);
      addLog(`Выпуск изменён: ${prod?.name} x${qty} → ${emp?.name?.split(" ").slice(0,2).join(" ")}`);
      setToast({message:"Запись обновлена",type:"success"});
    } else {
      const id=Date.now();
      const newOut={id,productId,employeeId,quantity:qty,date:new Date(form.date).toISOString(),comment:form.comment,createdAt:now,createdBy:currentUser.id};
      setProductionOutputs(p=>[...(p||[]),newOut]);
      applyOutput(newOut,curStock);
      addLog(`Выпуск: ${prod?.name} x${qty} → ${emp?.name?.split(" ").slice(0,2).join(" ")}`);
      addNotification({title:`Выпуск: ${prod?.name} x${qty}`,type:"информация",content:`${emp?.name?.split(" ").slice(0,2).join(" ")} зафиксировал выпуск ${prod?.name} — ${qty} ${prod?.unit}`,targetAll:true});
      setToast({message:"Выпуск зафиксирован!",type:"success"});
    }
    setModal(false);
  };

  const doDelete=(o)=>{
    revertOutput(o);
    setProductionOutputs(p=>(p||[]).filter(x=>x.id!==o.id));
    const prod=products.find(p=>p.id===o.productId);
    addLog(`Выпуск удалён: ${prod?.name} x${o.quantity}`);
    setToast({message:"Запись удалена",type:"error"});
    setConfirm(null);
  };

  const totalQty=(productionOutputs||[]).reduce((s,o)=>s+o.quantity,0);
  const todayStr=new Date().toISOString().slice(0,10);
  const todayQty=(productionOutputs||[]).filter(o=>o.date.startsWith(todayStr)).reduce((s,o)=>s+o.quantity,0);
  const selectedProd=ap.find(p=>p.id===+form.productId);

  return(
    <div>
      <PageH title="Выпуск готовой продукции">
        <SearchBox value={search} onChange={e=>setSearch(e.target.value)} ph="Поиск..."/>
        {!isWorker&&(
          <select value={fEmp} onChange={e=>setFEmp(e.target.value)} style={{padding:"7px 9px",background:C.bg,border:`1px solid ${C.border}`,borderRadius:7,color:C.text,fontSize:12,fontFamily:"inherit"}}>
            <option value="all">Все сотрудники</option>
            {workers.map(w=><option key={w.id} value={w.id}>{w.name.split(" ").slice(0,2).join(" ")}</option>)}
          </select>
        )}
        <Btn onClick={openNew} icon={<I.plus size={15}/>}>Добавить выпуск</Btn>
      </PageH>

      <div style={{display:"flex",flexWrap:"wrap",gap:12,marginBottom:16}}>
        <Stat icon={<I.factory size={18}/>} label="Всего выпущено" value={`${totalQty} ед.`} color={C.success}/>
        <Stat icon={<I.check size={18}/>} label="Сегодня" value={`${todayQty} ед.`} color={C.primary}/>
        <Stat icon={<I.file size={18}/>} label="Записей всего" value={(productionOutputs||[]).length} color={C.info}/>
      </div>

      <Card s={{padding:0,overflow:"hidden"}}>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead><tr><TH>Дата</TH><TH>Сотрудник</TH><TH>Продукт</TH><TH>Кол-во</TH><TH>Комментарий</TH><TH></TH></tr></thead>
            <tbody>
              {list.map(o=>{
                const prod=products.find(p=>p.id===o.productId);
                const emp=users.find(u=>u.id===o.employeeId);
                return(
                  <tr key={o.id} style={{borderBottom:`1px solid ${C.border}`}}>
                    <TD s={{fontSize:12,whiteSpace:"nowrap"}}>{fmtDate(o.date)}</TD>
                    <TD s={{fontWeight:500}}>{emp?.name?.split(" ").slice(0,2).join(" ")||"—"}</TD>
                    <TD>{prod?.name||"—"}</TD>
                    <TD s={{fontWeight:700,color:C.success}}>+{o.quantity} {prod?.unit||""}</TD>
                    <TD s={{color:C.dim,fontSize:12,maxWidth:180,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{o.comment||"—"}</TD>
                    <TD><div style={{display:"flex",gap:4}}>
                      <Btn v="ghost" sz="sm" onClick={()=>openEdit(o)} icon={<I.edit size={14}/>}/>
                      <Btn v="ghost" sz="sm" onClick={()=>setConfirm({title:"Удалить выпуск?",message:`Удалить запись "${prod?.name} x${o.quantity}"? Остаток склада будет скорректирован.`,onConfirm:()=>doDelete(o)})} icon={<I.trash size={14}/>}/>
                    </div></TD>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
      {list.length===0&&(
        <div style={{textAlign:"center",padding:50,color:C.dim}}>
          <I.factory size={36}/><p style={{marginTop:10,fontSize:13}}>Нет записей о выпуске.<br/>Нажмите «Добавить выпуск».</p>
        </div>
      )}

      <Modal open={modal} onClose={()=>setModal(false)} title={edit?"Редактировать выпуск":"Новый выпуск продукции"}>
        <Sel label="Сотрудник" value={form.employeeId}
          onChange={e=>setForm({...form,employeeId:e.target.value})}
          error={errs.employeeId}
          options={[{value:"",label:"Выберите"},...workers.map(w=>({value:w.id,label:w.name.split(" ").slice(0,2).join(" ")}))]}/>
        <Sel label="Продукт" value={form.productId}
          onChange={e=>setForm({...form,productId:e.target.value})}
          error={errs.productId}
          options={[{value:"",label:"Выберите"},...ap.map(p=>({value:p.id,label:`${p.name} (на складе: ${p.stock} ${p.unit})`}))]}/>
        <Inp label="Количество" type="number" min="1" step="1" value={form.quantity}
          onChange={e=>setForm({...form,quantity:e.target.value})} error={errs.quantity}/>
        <Inp label="Дата и время" type="datetime-local" value={form.date}
          onChange={e=>setForm({...form,date:e.target.value})} error={errs.date}/>
        <Txa label="Комментарий (необязательно)" value={form.comment}
          onChange={e=>setForm({...form,comment:e.target.value})} placeholder="Например: утренняя партия"/>
        {selectedProd&&form.quantity&&+form.quantity>0&&(
          <div style={{padding:"10px 14px",background:`${C.success}10`,borderRadius:8,border:`1px solid ${C.success}25`,marginBottom:12,fontSize:13}}>
            <span style={{color:C.muted}}>Склад после сохранения: </span>
            <span style={{fontWeight:700,color:C.success}}>
              {selectedProd.stock} → {selectedProd.stock+(edit&&edit.productId===+form.productId?-edit.quantity:0)+(+form.quantity)} {selectedProd.unit}
            </span>
          </div>
        )}
        <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:6}}>
          <Btn v="secondary" onClick={()=>setModal(false)}>Отмена</Btn>
          <Btn v="success" onClick={save}>{edit?"Сохранить":"Зафиксировать выпуск"}</Btn>
        </div>
      </Modal>

      {confirm&&<Confirm open={!!confirm} onClose={()=>setConfirm(null)} title={confirm.title} message={confirm.message} onConfirm={confirm.onConfirm}/>}
      {toast&&<Toast {...toast} onClose={()=>setToast(null)}/>}
    </div>
  );
}
