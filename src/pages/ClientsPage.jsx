import { useContext, useState, useMemo } from "react";
import { AppContext } from "../context/AppContext";
import { C } from "../theme";
import { I } from "../icons";
import { ORDER_STATUSES, ORDER_PRIORITIES, fmtShort } from "../constants";
import { Badge, Btn, Inp, Sel, Txa, Modal, Toast, TH, TD, Card, PageH } from "../components/ui";

export default function ClientsPage(){
  const {clients,setClients,clientOrders,setClientOrders,products,setProducts,addLog,currentUser,users,sales,inventoryMovements,setInventoryMovements,addNotification}=useContext(AppContext);
  const [tab,setTab]=useState("clients");
  const [modal,setModal]=useState(false);
  const [orderModal,setOrderModal]=useState(false);
  const [toast,setToast]=useState(null);
  const [errs,setErrs]=useState({});
  const [selectedClient,setSelectedClient]=useState(null);
  const [historyOrder,setHistoryOrder]=useState(null);
  const [form,setForm]=useState({name:"",contact:"",phone:"",email:"",address:"",comment:""});
  const ap=products.filter(p=>!p.deleted);
  const [orderForm,setOrderForm]=useState({clientId:"",items:[{productId:ap[0]?.id||"",qty:""}],note:""});

  // Calculate reserved quantities (orders in non-final status)
  const reserved=useMemo(()=>{
    const m={};
    clientOrders.filter(o=>o.status==="новый"||o.status==="в производстве"||o.status==="готов").forEach(o=>{
      o.items.forEach(it=>{m[it.productId]=(m[it.productId]||0)+it.qty});
    });
    return m;
  },[clientOrders]);

  const getAvailable=(productId)=>{
    const p=products.find(x=>x.id===productId);
    return (p?.stock||0)-(reserved[productId]||0);
  };

  const openNewClient=()=>{setForm({name:"",contact:"",phone:"",email:"",address:"",comment:""});setErrs({});setModal(true)};
  const saveClient=()=>{
    if(!form.name.trim()){setErrs({name:"!"});return}
    setClients(p=>[...p,{id:Date.now(),name:form.name,contact:form.contact,phone:form.phone,email:form.email,address:form.address,comment:form.comment,createdAt:new Date().toISOString()}]);
    addLog(`Клиент: ${form.name}`);setToast({message:"Клиент добавлен",type:"success"});setModal(false);
  };

  const addOrderItem=()=>setOrderForm(f=>({...f,items:[...f.items,{productId:ap[0]?.id||"",qty:""}]}));
  const removeOrderItem=(i)=>setOrderForm(f=>({...f,items:f.items.filter((_,idx)=>idx!==i)}));
  const updateOrderItem=(i,field,val)=>setOrderForm(f=>({...f,items:f.items.map((it,idx)=>idx===i?{...it,[field]:val}:it)}));

  const openNewOrder=()=>{setOrderForm({clientId:clients[0]?.id||"",items:[{productId:ap[0]?.id||"",qty:""}],note:"",priority:"нормальный"});setErrs({});setOrderModal(true)};

  const saveOrder=()=>{
    if(!orderForm.clientId){setErrs({clientId:"!"});return}
    const validItems=orderForm.items.filter(it=>it.productId&&it.qty&&+it.qty>0);
    if(!validItems.length){setToast({message:"Добавьте товары",type:"error"});return}
    // Check stock
    for(const it of validItems){
      const avail=getAvailable(+it.productId);
      const pName=products.find(p=>p.id===+it.productId)?.name;
      if(+it.qty>avail){setToast({message:`Недостаточно: ${pName} (доступно ${avail})`,type:"error"});return}
    }
    const total=validItems.reduce((s,it)=>{const p=products.find(x=>x.id===+it.productId);return s+(p?p.sellPrice*+it.qty:0)},0);
    const now=new Date().toISOString();
    setClientOrders(p=>[...p,{id:Date.now(),clientId:+orderForm.clientId,items:validItems.map(it=>({productId:+it.productId,qty:+it.qty})),orderDate:now,status:"новый",total,note:orderForm.note,priority:orderForm.priority||"нормальный",statusChangedAt:now,shippedAt:null,shippedBy:null,history:[{from:null,to:"новый",userId:currentUser.id,userName:currentUser.name,at:now}]}]);
    addLog(`Заказ: ${clients.find(c=>c.id===+orderForm.clientId)?.name} — ${total.toLocaleString("ru")} ₽`);
    setToast({message:"Заказ создан (товар зарезервирован)",type:"success"});setOrderModal(false);
  };

  const updateOrderStatus=(order,newStatus)=>{
    const now=new Date().toISOString();
    setClientOrders(p=>p.map(o=>o.id===order.id?{...o,status:newStatus,statusChangedAt:now,history:[...(o.history||[]),{from:o.status,to:newStatus,userId:currentUser.id,userName:currentUser.name,at:now}]}:o));
    setToast({message:"Статус обновлён",type:"success"});
  };

  // SHIP ORDER — deduct stock
  const shipOrder=(order)=>{
    const now=new Date().toISOString();
    // Check stock availability
    for(const it of order.items){
      const p=products.find(x=>x.id===it.productId);
      if(!p||p.stock<it.qty){
        setToast({message:`Недостаточно: ${p?.name||"?"} (на складе ${p?.stock||0}, нужно ${it.qty})`,type:"error"});return;
      }
    }
    // Deduct stock and log movements
    order.items.forEach(it=>{
      setProducts(prev=>prev.map(p=>{
        if(p.id!==it.productId) return p;
        const newStock=p.stock-it.qty;
        return {...p,stock:newStock,updatedAt:now};
      }));
      const p=products.find(x=>x.id===it.productId);
      setInventoryMovements(prev=>[...prev,{id:Date.now()+Math.random(),productId:it.productId,type:"order_shipment",quantity:-it.qty,balance:(p?.stock||0)-it.qty,refId:`order-${order.id}`,createdAt:now}]);
    });
    setClientOrders(prev=>prev.map(o=>o.id===order.id?{...o,status:"отгружен",shippedAt:now,shippedBy:currentUser.id,history:[...(o.history||[]),{from:o.status,to:"отгружен",userId:currentUser.id,userName:currentUser.name,at:now}]}:o));
    const cName=clients.find(c=>c.id===order.clientId)?.name;
    addLog(`Отгрузка заказа #${order.id} для ${cName}`);
    addNotification({title:`Заказ #${order.id} отгружен`,type:"информация",content:`Заказ для ${cName} отгружен`,targetAll:true});
    setToast({message:"Заказ отгружен, товар списан со склада",type:"success"});
  };

  const clientStats=clients.map(c=>{
    const orders=clientOrders.filter(o=>o.clientId===c.id);
    return{...c,orderCount:orders.length,totalSpent:orders.reduce((s,o)=>s+o.total,0)};
  });

  const stIco=(s)=>s==="отгружен"?"success":s==="отменён"?"danger":s==="готов"?"purple":"info";

  return(
    <div>
      <PageH title="Клиенты и заказы">
        <div style={{display:"flex",gap:5,alignItems:"center"}}>
          {[["clients","Клиенты"],["orders","Заказы"]].map(([id,lb])=>(
            <button key={id} onClick={()=>setTab(id)} style={{padding:"6px 14px",borderRadius:7,border:`1px solid ${tab===id?C.primary:C.border}`,background:tab===id?C.primaryBg:C.surface,color:tab===id?C.primary:C.muted,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>{lb}</button>
          ))}
          <button onClick={()=>window.open(window.location.href.split("?")[0]+"?board=1","_blank")} style={{padding:"6px 14px",borderRadius:7,border:`1px solid ${C.border}`,background:C.surface,color:C.muted,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:5}}>⬡ Панель</button>
        </div>
        {tab==="clients"&&<Btn onClick={openNewClient} icon={<I.plus size={15}/>}>Новый клиент</Btn>}
        {tab==="orders"&&<Btn onClick={openNewOrder} icon={<I.plus size={15}/>}>Новый заказ</Btn>}
      </PageH>

      {tab==="clients"&&(
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:12}}>
          {clientStats.map(c=>(
            <Card key={c.id} s={{cursor:"pointer"}} onClick={()=>setSelectedClient(selectedClient===c.id?null:c.id)}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                <div style={{fontSize:15,fontWeight:700,color:C.text}}>{c.name}</div>
                <Badge color="info">{c.orderCount} зак.</Badge>
              </div>
              <div style={{fontSize:12,color:C.muted}}>{c.contact} · {c.phone}</div>
              {c.address&&<div style={{fontSize:11,color:C.dim}}>{c.address}</div>}
              <div style={{marginTop:8}}><Badge color="success">{c.totalSpent.toLocaleString("ru")} ₽</Badge></div>
              {selectedClient===c.id&&(
                <div style={{marginTop:12,borderTop:`1px solid ${C.border}`,paddingTop:10}}>
                  <div style={{fontSize:12,fontWeight:600,color:C.text,marginBottom:6}}>История заказов:</div>
                  {clientOrders.filter(o=>o.clientId===c.id).sort((a,b)=>new Date(b.orderDate)-new Date(a.orderDate)).map(o=>(
                    <div key={o.id} style={{padding:"6px 0",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <div>
                        <div style={{fontSize:12,color:C.text}}>{o.items.map(it=>{const p=products.find(x=>x.id===it.productId);return`${p?.name||"?"} x${it.qty}`}).join(", ")}</div>
                        <div style={{fontSize:10,color:C.dim}}>{fmtShort(o.orderDate)} {o.shippedAt?`· Отгружен: ${fmtShort(o.shippedAt)}`:""}</div>
                      </div>
                      <Badge color={stIco(o.status)} s={{fontSize:10}}>{o.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {tab==="orders"&&(
        <Card s={{padding:0,overflow:"hidden"}}><div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead><tr><TH>#</TH><TH>Дата</TH><TH>Клиент</TH><TH>Товары</TH><TH>Сумма</TH><TH>Статус</TH><TH>Отгрузка</TH><TH></TH><TH></TH></tr></thead>
            <tbody>{[...clientOrders].sort((a,b)=>new Date(b.orderDate)-new Date(a.orderDate)).map(o=>{
              const cl=clients.find(c=>c.id===o.clientId);
              const shipper=o.shippedBy?users.find(u=>u.id===o.shippedBy):null;
              return(
                <tr key={o.id} style={{borderBottom:`1px solid ${C.border}`}}>
                  <TD s={{fontWeight:600,color:C.dim}}>#{o.id}</TD>
                  <TD s={{fontSize:12,whiteSpace:"nowrap"}}>{fmtShort(o.orderDate)}</TD>
                  <TD s={{fontWeight:500}}>{cl?.name||"—"}</TD>
                  <TD s={{fontSize:12}}>{o.items.map(it=>{const p=products.find(x=>x.id===it.productId);return`${p?.name||"?"} x${it.qty}`}).join(", ")}</TD>
                  <TD s={{fontWeight:700,color:C.primary}}>{o.total.toLocaleString("ru")} ₽</TD>
                  <TD>
                    {o.status!=="отгружен"&&o.status!=="отменён"?
                      <select value={o.status} onChange={e=>updateOrderStatus(o,e.target.value)} style={{padding:"4px 6px",background:C.bg,border:`1px solid ${C.border}`,borderRadius:5,color:C.text,fontSize:11,fontFamily:"inherit"}}>
                        {ORDER_STATUSES.filter(s=>s!=="отгружен").map(s=><option key={s} value={s}>{s}</option>)}
                      </select>
                      :<Badge color={stIco(o.status)}>{o.status}</Badge>
                    }
                  </TD>
                  <TD s={{fontSize:11,color:C.dim}}>
                    {o.shippedAt?<span>{fmtShort(o.shippedAt)}<br/>{shipper?.name?.split(" ").slice(0,2).join(" ")}</span>:"—"}
                  </TD>
                  <TD>
                    {(o.status==="готов")&&<Btn sz="sm" v="success" onClick={()=>shipOrder(o)} icon={<I.truck size={13}/>}>Отгрузить</Btn>}
                  </TD>
                  <TD>
                    {(o.history||[]).length>0&&<button onClick={()=>setHistoryOrder(o)} style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:11,padding:"2px 6px",borderRadius:4,textDecoration:"underline",fontFamily:"inherit"}} title="История изменений">История</button>}
                  </TD>
                </tr>
              );
            })}</tbody>
          </table>
        </div></Card>
      )}

      {/* New Client Modal */}
      <Modal open={modal} onClose={()=>setModal(false)} title="Новый клиент" width={480}>
        <Inp label="Название компании" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} error={errs.name}/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 12px"}}>
          <Inp label="Контактное лицо" value={form.contact} onChange={e=>setForm({...form,contact:e.target.value})}/>
          <Inp label="Телефон" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/>
          <Inp label="Email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/>
          <Inp label="Адрес" value={form.address} onChange={e=>setForm({...form,address:e.target.value})}/>
        </div>
        <Txa label="Комментарий" value={form.comment} onChange={e=>setForm({...form,comment:e.target.value})}/>
        <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:6}}><Btn v="secondary" onClick={()=>setModal(false)}>Отмена</Btn><Btn onClick={saveClient}>Добавить</Btn></div>
      </Modal>

      {/* New Order Modal with stock check */}
      <Modal open={orderModal} onClose={()=>setOrderModal(false)} title="Новый заказ" width={560}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 12px"}}>
          <Sel label="Клиент" value={orderForm.clientId} onChange={e=>setOrderForm({...orderForm,clientId:e.target.value})} error={errs.clientId} options={[{value:"",label:"Выберите"},...clients.map(c=>({value:c.id,label:c.name}))]}/>
          <Sel label="Приоритет" value={orderForm.priority||"нормальный"} onChange={e=>setOrderForm({...orderForm,priority:e.target.value})} options={ORDER_PRIORITIES.map(p=>({value:p,label:p}))}/>
        </div>
        <div style={{marginBottom:12}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
            <label style={{fontSize:12,fontWeight:500,color:C.muted}}>Товары</label>
            <Btn v="secondary" sz="sm" onClick={addOrderItem} icon={<I.plus size={12}/>}>Добавить</Btn>
          </div>
          {orderForm.items.map((it,i)=>{
            const avail=it.productId?getAvailable(+it.productId):0;
            const shortage=it.qty&&+it.qty>avail;
            return(
              <div key={i} style={{display:"flex",gap:8,marginBottom:6,alignItems:"flex-end"}}>
                <div style={{flex:2}}>
                  <select value={it.productId} onChange={e=>updateOrderItem(i,"productId",e.target.value)} style={{width:"100%",padding:"7px 8px",background:C.bg,border:`1px solid ${C.border}`,borderRadius:6,color:C.text,fontSize:12,fontFamily:"inherit"}}>
                    {ap.map(p=><option key={p.id} value={p.id}>{p.name} — {p.sellPrice} ₽ (дост: {getAvailable(p.id)})</option>)}
                  </select>
                </div>
                <div style={{flex:1}}>
                  <input type="number" placeholder="Кол-во" value={it.qty} onChange={e=>updateOrderItem(i,"qty",e.target.value)} style={{width:"100%",padding:"7px 8px",background:C.bg,border:`1px solid ${shortage?C.danger:C.border}`,borderRadius:6,color:shortage?C.danger:C.text,fontSize:12,fontFamily:"inherit",boxSizing:"border-box"}}/>
                </div>
                {shortage&&<span style={{fontSize:10,color:C.danger,flexShrink:0}}>мало!</span>}
                {orderForm.items.length>1&&<button onClick={()=>removeOrderItem(i)} style={{background:"none",border:"none",color:C.danger,cursor:"pointer",padding:4}}><I.x size={14}/></button>}
              </div>
            );
          })}
          {(()=>{const t=orderForm.items.reduce((s,it)=>{const p=products.find(x=>x.id===+it.productId);return s+(p&&it.qty?p.sellPrice*(+it.qty):0)},0);return t>0?<div style={{textAlign:"right",fontSize:14,fontWeight:700,color:C.primary,marginTop:6}}>Итого: {t.toLocaleString("ru")} ₽</div>:null})()}
        </div>
        <Txa label="Примечание" value={orderForm.note} onChange={e=>setOrderForm({...orderForm,note:e.target.value})}/>
        <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:8}}><Btn v="secondary" onClick={()=>setOrderModal(false)}>Отмена</Btn><Btn onClick={saveOrder}>Создать заказ</Btn></div>
      </Modal>

      {/* Order history modal */}
      <Modal open={!!historyOrder} onClose={()=>setHistoryOrder(null)} title={`История заказа #${historyOrder?.id}`} width={420}>
        {historyOrder&&(
          <div>
            {(historyOrder.history||[]).length===0
              ? <div style={{color:C.dim,fontSize:13,textAlign:"center",padding:"16px 0"}}>История не записана</div>
              : (historyOrder.history||[]).map((h,i)=>(
                <div key={i} style={{display:"flex",alignItems:"flex-start",gap:10,padding:"8px 0",borderBottom:i<(historyOrder.history.length-1)?`1px solid ${C.border}`:"none"}}>
                  <div style={{width:8,height:8,borderRadius:"50%",background:C.primary,marginTop:5,flexShrink:0}}/>
                  <div>
                    <div style={{fontSize:12,color:C.text}}>
                      {h.from?<><span style={{color:C.dim}}>{h.from}</span>{" → "}<span style={{fontWeight:600}}>{h.to}</span></>:<span style={{fontWeight:600}}>Создан: {h.to}</span>}
                    </div>
                    <div style={{fontSize:11,color:C.dim,marginTop:2}}>{h.userName} · {h.at?new Date(h.at).toLocaleString("ru",{day:"2-digit",month:"2-digit",year:"2-digit",hour:"2-digit",minute:"2-digit"}):""}</div>
                  </div>
                </div>
              ))
            }
          </div>
        )}
      </Modal>
      {toast&&<Toast {...toast} onClose={()=>setToast(null)}/>}
    </div>
  );
}
