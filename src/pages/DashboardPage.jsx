import React, { useState, useContext, useMemo } from "react";
import { AreaChart, Area, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { AppContext } from "../context/AppContext";
import { C, CC } from "../theme";
import { I } from "../icons";
import { ROLES, fmtShort } from "../constants";
import { Badge, Btn, Stat, Card, Title } from "../components/ui";

export default function DashboardPage(){
  const {products,users,currentUser,tasks,rawMaterials,deliveries,notifications,marks,taskEmployees,recipes,clientOrders,sales,productionPlans,setPage,hiddenWarnings,setHiddenWarnings,productionOutputs}=useContext(AppContext);
  const ap=products.filter(p=>!p.deleted);
  const role=ROLES.find(r=>r.id===currentUser.roleId);
  const canSeeFinance=role?.name!=="worker";
  const isWorker=role?.name==="worker";
  const isAdmin=role?.name==="admin";
  const todayStr=new Date().toISOString().slice(0,10);
  const [selectedWarns,setSelectedWarns]=useState(new Set());
  const [showHidden,setShowHidden]=useState(false);

  const todayTasks=tasks.filter(t=>t.completedAt&&t.completedAt.startsWith(todayStr));
  const todayProduced=todayTasks.reduce((s,t)=>s+t.quantity,0);

  const allWorkers=users.filter(u=>u.roleId===3&&u.status==="active");
  const busyWorkerIds=new Set();
  tasks.filter(t=>t.status==="в работе").forEach(t=>(t.userIds||[]).forEach(id=>busyWorkerIds.add(id)));
  const busyCount=busyWorkerIds.size;

  const bestWorker=useMemo(()=>{
    const m={};taskEmployees.filter(te=>te.status==="завершено"||te.status==="просрочено").forEach(te=>{m[te.employeeId]=(m[te.employeeId]||0)+te.producedQty});
    (productionOutputs||[]).forEach(o=>{m[o.employeeId]=(m[o.employeeId]||0)+o.quantity});
    const entries=Object.entries(m).sort((a,b)=>b[1]-a[1]);
    if(!entries.length) return null;
    const w=users.find(u=>u.id===+entries[0][0]);
    return {name:w?.name?.split(" ").slice(0,2).join(" ")||"?",produced:entries[0][1]};
  },[taskEmployees,users,productionOutputs]);

  const lowRaw=rawMaterials.filter(r=>r.stock<=r.minStock*1.5);
  const criticalRaw=rawMaterials.filter(r=>r.stock<=r.minStock);
  const lowProducts=ap.filter(p=>p.stock<20);
  const overdueTasks=tasks.filter(t=>!t.completedAt&&new Date()>new Date(t.deadline)&&t.status!=="завершено"&&t.status!=="просрочено");
  const todayPresence=marks.filter(m=>m.markType==="присутствие"&&m.createdAt.startsWith(todayStr)).map(m=>m.employeeId);
  const absentWorkers=allWorkers.filter(w=>!todayPresence.includes(w.id));

  const forecasts=useMemo(()=>{
    const completedTasks=tasks.filter(t=>t.status==="завершено"&&t.completedAt);
    if(!completedTasks.length) return [];
    const daysSpan=Math.max(1,Math.ceil((Date.now()-new Date(completedTasks[completedTasks.length-1]?.createdAt||Date.now()).getTime())/(1000*60*60*24)));
    const prodForecasts=ap.map(p=>{
      const produced=completedTasks.filter(t=>t.productId===p.id).reduce((s,t)=>s+t.quantity,0);
      const dailyRate=produced/daysSpan;
      const daysLeft=dailyRate>0?Math.floor(p.stock/dailyRate):999;
      return{name:p.name,stock:p.stock,unit:p.unit,dailyRate:+dailyRate.toFixed(1),daysLeft,type:"product"};
    }).filter(f=>f.daysLeft<30);
    const rawForecasts=rawMaterials.map(r=>{
      const totalUsed=tasks.filter(t=>t.status==="завершено").reduce((s,t)=>{
        const recipe=recipes.find(rc=>rc.productId===t.productId);
        const item=recipe?.items.find(it=>it.rawId===r.id);
        return s+(item?item.qty*t.quantity:0);
      },0);
      const dailyRate=totalUsed/daysSpan;
      const daysLeft=dailyRate>0?Math.floor(r.stock/dailyRate):999;
      return{name:r.name,stock:r.stock,unit:r.unit,dailyRate:+dailyRate.toFixed(2),daysLeft,type:"raw"};
    }).filter(f=>f.daysLeft<30);
    return [...prodForecasts,...rawForecasts].sort((a,b)=>a.daysLeft-b.daysLeft);
  },[ap,rawMaterials,tasks,recipes]);

  const totalValue=ap.reduce((s,p)=>s+p.stock*p.sellPrice,0);
  const activeTasks=tasks.filter(t=>t.status==="назначено"||t.status==="в работе").length;
  const unreadNotifs=notifications.filter(n=>(n.targetAll||n.targetUsers?.includes(currentUser.id))&&!n.readBy?.includes(currentUser.id)).length;

  const prodByDay=useMemo(()=>{
    const m={};tasks.filter(t=>t.status==="завершено").forEach(t=>{const d=fmtShort(t.completedAt);m[d]=(m[d]||0)+t.quantity;});
    return Object.entries(m).map(([date,qty])=>({date,qty})).slice(-10);
  },[tasks]);
  const rawStockData=rawMaterials.slice(0,8).map(r=>({name:r.name.length>10?r.name.slice(0,10)+"…":r.name,stock:r.stock,min:r.minStock}));
  const workerStats=useMemo(()=>{
    return allWorkers.map(w=>{
      const fromTasks=taskEmployees.filter(te=>te.employeeId===w.id&&(te.status==="завершено"||te.status==="просрочено")).reduce((s,te)=>s+te.producedQty,0);
      const fromOutputs=(productionOutputs||[]).filter(o=>o.employeeId===w.id).reduce((s,o)=>s+o.quantity,0);
      const produced=fromTasks+fromOutputs;
      const wTasks=tasks.filter(t=>(t.userIds||[]).includes(w.id));
      const done=wTasks.filter(t=>t.status==="завершено");
      return{name:w.name.split(" ").slice(0,2).join(" "),done:done.length,total:wTasks.length,produced};
    }).sort((a,b)=>b.produced-a.produced);
  },[allWorkers,tasks,taskEmployees,productionOutputs]);

  const warnings=[];
  criticalRaw.forEach(r=>warnings.push({key:`raw-${r.id}`,type:"danger",icon:<I.alert size={14}/>,text:`Сырьё: ${r.name} — осталось ${r.stock} ${r.unit} (мин. ${r.minStock})`}));
  lowProducts.forEach(p=>warnings.push({key:`prod-${p.id}`,type:"warning",icon:<I.box size={14}/>,text:`Товар: ${p.name} — осталось ${p.stock} ${p.unit}`}));
  overdueTasks.forEach(t=>{const pr=products.find(p=>p.id===t.productId);warnings.push({key:`task-${t.id}`,type:"danger",icon:<I.clock size={14}/>,text:`Просрочено задание #${t.id}: ${pr?.name||"?"} x${t.quantity}`})});
  absentWorkers.forEach(w=>warnings.push({key:`absent-${w.id}`,type:"warning",icon:<I.user size={14}/>,text:`${w.name.split(" ").slice(0,2).join(" ")} не отметил присутствие`}));
  const visibleWarnings=warnings.filter(w=>!hiddenWarnings.has(w.key));
  const hiddenWarningsList=warnings.filter(w=>hiddenWarnings.has(w.key));
  const toggleWarn=(key)=>setSelectedWarns(p=>{const n=new Set(p);n.has(key)?n.delete(key):n.add(key);return n});
  const hideSelected=()=>{setHiddenWarnings(p=>{const n=new Set(p);selectedWarns.forEach(k=>n.add(k));return n});setSelectedWarns(new Set())};
  const hideAll=()=>{setHiddenWarnings(p=>{const n=new Set(p);warnings.forEach(w=>n.add(w.key));return n});setSelectedWarns(new Set())};
  const unhideAll=()=>{setHiddenWarnings(new Set());setShowHidden(false)};

  const budget=useMemo(()=>{
    const totalSalesIncome=sales.reduce((s,sl)=>{const p=products.find(x=>x.id===sl.productId);return s+(p?.sellPrice||0)*sl.quantity},0);
    const totalOrderIncome=clientOrders.filter(o=>o.status==="отгружен").reduce((s,o)=>s+o.total,0);
    const totalIncome=totalSalesIncome+totalOrderIncome;
    const totalExpense=deliveries.reduce((s,d)=>s+d.totalPrice,0);
    const balance=totalIncome-totalExpense;
    const monthStr=new Date().toISOString().slice(0,7);
    const mSales=sales.filter(sl=>sl.createdAt?.startsWith(monthStr)).reduce((s,sl)=>{const p=products.find(x=>x.id===sl.productId);return s+(p?.sellPrice||0)*sl.quantity},0);
    const mOrders=clientOrders.filter(o=>o.status==="отгружен"&&o.shippedAt?.startsWith(monthStr)).reduce((s,o)=>s+o.total,0);
    const mExpense=deliveries.filter(d=>d.date?.startsWith(monthStr)).reduce((s,d)=>s+d.totalPrice,0);
    const monthIncome=mSales+mOrders;
    const monthProfit=monthIncome-mExpense;
    const pendingOrdersValue=clientOrders.filter(o=>o.status==="новый"||o.status==="в производстве"||o.status==="готов").reduce((s,o)=>s+o.total,0);
    return{totalIncome,totalExpense,balance,monthIncome,mExpense,monthProfit,pendingOrdersValue};
  },[sales,clientOrders,deliveries,products]);

  return(
    <div>
      <div style={{marginBottom:20}}>
        <h1 style={{margin:0,fontSize:23,fontWeight:800,color:C.text}}>Добро пожаловать, {currentUser.name.split(" ")[1]||currentUser.name}</h1>
        <p style={{margin:"3px 0 0",color:C.muted,fontSize:13}}>{role?.label} · {fmtShort(new Date().toISOString())}</p>
      </div>

      {canSeeFinance&&(
        <Card s={{marginBottom:16,padding:"16px 20px",background:`linear-gradient(135deg, ${C.surface} 0%, ${C.surface2} 100%)`,border:`1px solid ${C.primary}20`}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
            <div style={{width:32,height:32,borderRadius:8,background:`${C.primary}15`,display:"flex",alignItems:"center",justifyContent:"center",color:C.primary}}><I.chart size={16}/></div>
            <div style={{fontSize:15,fontWeight:800,color:C.text}}>Финансы</div>
            <span style={{fontSize:14,marginLeft:4}}>{budget.monthProfit>0?"🟢":budget.monthProfit===0?"🟡":"🔴"}</span>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:10}}>
            <div style={{padding:"10px 14px",background:C.bg,borderRadius:8,border:`1px solid ${C.border}`}}>
              <div style={{fontSize:10,color:C.dim,textTransform:"uppercase",letterSpacing:.5}}>Баланс</div>
              <div style={{fontSize:20,fontWeight:800,color:budget.balance>=0?C.success:C.danger}}>{budget.balance>=0?"+":""}{(budget.balance/1000).toFixed(0)}т ₽</div>
            </div>
            <div style={{padding:"10px 14px",background:C.bg,borderRadius:8,border:`1px solid ${C.border}`}}>
              <div style={{fontSize:10,color:C.dim,textTransform:"uppercase",letterSpacing:.5}}>Доходы за месяц</div>
              <div style={{fontSize:18,fontWeight:700,color:C.success}}>+{(budget.monthIncome/1000).toFixed(0)}т ₽</div>
            </div>
            <div style={{padding:"10px 14px",background:C.bg,borderRadius:8,border:`1px solid ${C.border}`}}>
              <div style={{fontSize:10,color:C.dim,textTransform:"uppercase",letterSpacing:.5}}>Расходы за месяц</div>
              <div style={{fontSize:18,fontWeight:700,color:C.danger}}>-{(budget.mExpense/1000).toFixed(0)}т ₽</div>
            </div>
            <div style={{padding:"10px 14px",background:budget.monthProfit>=0?C.successBg:C.dangerBg,borderRadius:8,border:`1px solid ${budget.monthProfit>=0?C.success:C.danger}20`}}>
              <div style={{fontSize:10,color:C.dim,textTransform:"uppercase",letterSpacing:.5}}>Чистая прибыль</div>
              <div style={{fontSize:18,fontWeight:700,color:budget.monthProfit>=0?C.success:C.danger}}>{budget.monthProfit>=0?"+":""}{(budget.monthProfit/1000).toFixed(0)}т ₽</div>
            </div>
          </div>
          {budget.pendingOrdersValue>0&&(
            <div style={{marginTop:10,fontSize:11,color:C.muted,display:"flex",alignItems:"center",gap:6}}>
              <I.truck size={12}/> Ожидаемый доход от заказов в работе: <span style={{fontWeight:700,color:C.primary}}>+{(budget.pendingOrdersValue/1000).toFixed(0)}т ₽</span>
            </div>
          )}
        </Card>
      )}

      <Card s={{marginBottom:16,padding:"12px 16px"}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
          <I.target size={15}/>
          <span style={{fontSize:13,fontWeight:700,color:C.text}}>Быстрые действия</span>
        </div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          {isWorker?(<>
            <button onClick={()=>setPage("tasks")} style={{display:"flex",alignItems:"center",gap:6,padding:"9px 16px",borderRadius:8,border:`1px solid ${C.info}30`,background:`${C.info}10`,color:C.info,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}><I.tasks size={14}/>Мои задания</button>
            <button onClick={()=>setPage("prodOutput")} style={{display:"flex",alignItems:"center",gap:6,padding:"9px 16px",borderRadius:8,border:`1px solid ${C.success}30`,background:`${C.success}10`,color:C.success,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}><I.factory size={14}/>Зафиксировать выпуск</button>
            <button onClick={()=>setPage("marks")} style={{display:"flex",alignItems:"center",gap:6,padding:"9px 16px",borderRadius:8,border:`1px solid ${C.primary}30`,background:`${C.primary}10`,color:C.primary,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}><I.check size={14}/>Отметки</button>
          </>):(<>
            {[
              {label:"Создать задание",icon:<I.tasks size={14}/>,pg:"tasks",clr:C.primary},
              {label:"Быстрая продажа",icon:<I.truck size={14}/>,pg:"sales",clr:C.success},
              {label:"Новый заказ",icon:<I.send size={14}/>,pg:"clients",clr:C.orange},
              {label:"Добавить поставку",icon:<I.down size={14}/>,pg:"deliveries",clr:C.info},
              ...(isAdmin?[{label:"Добавить товар",icon:<I.plus size={14}/>,pg:"products",clr:C.purple}]:[]),
            ].map((a,i)=>(
              <button key={i} onClick={()=>setPage(a.pg)} style={{display:"flex",alignItems:"center",gap:6,padding:"9px 16px",borderRadius:8,border:`1px solid ${a.clr}30`,background:`${a.clr}10`,color:a.clr,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit",transition:"all .15s"}}>
                {a.icon}{a.label}
              </button>
            ))}
          </>)}
        </div>
      </Card>

      {(visibleWarnings.length>0||hiddenWarningsList.length>0)&&!isWorker&&(
        <Card s={{marginBottom:16,padding:"12px 16px",borderLeft:`3px solid ${C.danger}`}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8,flexWrap:"wrap",gap:6}}>
            <div style={{fontSize:13,fontWeight:700,color:C.danger,display:"flex",alignItems:"center",gap:6}}>
              <I.alert size={16}/> Предупреждения ({visibleWarnings.length})
            </div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              {selectedWarns.size>0&&<Btn v="ghost" sz="sm" onClick={hideSelected} style={{fontSize:11,color:C.muted}}>Скрыть выбранные ({selectedWarns.size})</Btn>}
              {visibleWarnings.length>0&&<Btn v="ghost" sz="sm" onClick={hideAll} style={{fontSize:11,color:C.dim}}>Скрыть все</Btn>}
              {hiddenWarningsList.length>0&&<Btn v="ghost" sz="sm" onClick={()=>setShowHidden(!showHidden)} style={{fontSize:11,color:C.info}}>{showHidden?"Закрыть":"Показать"} скрытые ({hiddenWarningsList.length})</Btn>}
              {hiddenWarningsList.length>0&&<Btn v="ghost" sz="sm" onClick={unhideAll} style={{fontSize:11,color:C.dim}}>Восстановить</Btn>}
            </div>
          </div>
          <div style={{display:"grid",gap:5}}>
            {visibleWarnings.map(w=>(
              <div key={w.key} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 10px",background:w.type==="danger"?C.dangerBg:`${C.primary}10`,borderRadius:7,fontSize:12,color:w.type==="danger"?C.danger:C.primary}}>
                <input type="checkbox" checked={selectedWarns.has(w.key)} onChange={()=>toggleWarn(w.key)} style={{accentColor:C.primary,cursor:"pointer",flexShrink:0}}/>
                {w.icon}<span style={{flex:1}}>{w.text}</span>
                <button onClick={()=>setHiddenWarnings(p=>{const n=new Set(p);n.add(w.key);return n})} style={{background:"none",border:"none",color:C.dim,cursor:"pointer",padding:2,fontSize:14,lineHeight:1}} title="Скрыть">×</button>
              </div>
            ))}
          </div>
          {visibleWarnings.length===0&&hiddenWarningsList.length>0&&<div style={{fontSize:12,color:C.dim,padding:"4px 0"}}>Все предупреждения скрыты</div>}
          {showHidden&&hiddenWarningsList.length>0&&(
            <div style={{marginTop:10,paddingTop:8,borderTop:`1px solid ${C.border}`}}>
              <div style={{fontSize:11,fontWeight:600,color:C.dim,marginBottom:6}}>Скрытые:</div>
              {hiddenWarningsList.map(w=>(
                <div key={w.key} style={{display:"flex",alignItems:"center",gap:8,padding:"4px 10px",fontSize:11,color:C.dim,opacity:.6}}>
                  {w.icon}<span style={{flex:1}}>{w.text}</span>
                  <button onClick={()=>setHiddenWarnings(p=>{const n=new Set(p);n.delete(w.key);return n})} style={{background:"none",border:"none",color:C.info,cursor:"pointer",padding:2,fontSize:10,fontFamily:"inherit"}}>показать</button>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      <div style={{display:"flex",flexWrap:"wrap",gap:12,marginBottom:22}}>
        <Stat icon={<I.check size={18}/>} label="Сегодня произведено" value={`${todayProduced} ед.`} color={C.success}/>
        <Stat icon={<I.tasks size={18}/>} label="Активные задания" value={activeTasks} color={C.info}/>
        <Stat icon={<I.users size={18}/>} label="Загрузка работников" value={`${busyCount}/${allWorkers.length}`} color={busyCount>0?C.primary:C.dim}/>
        {bestWorker&&<Stat icon={<I.star size={18}/>} label={`Лучший: ${bestWorker.name}`} value={bestWorker.produced} color={C.primary}/>}
        <Stat icon={<I.bell size={18}/>} label="Непрочитанных" value={unreadNotifs} color={unreadNotifs>0?C.danger:C.dim}/>
        {canSeeFinance&&<Stat icon={<I.box size={18}/>} label="Склад (стоимость)" value={`${(totalValue/1000).toFixed(0)}т ₽`} color={C.cyan}/>}
      </div>

      {forecasts.length>0&&!isWorker&&(
        <Card s={{marginBottom:16}}>
          <Title>Прогноз остатков</Title>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:8}}>
            {forecasts.slice(0,8).map((f,i)=>(
              <div key={i} style={{padding:"8px 12px",background:C.bg,borderRadius:8,border:`1px solid ${f.daysLeft<=3?C.danger:f.daysLeft<=7?C.primary:C.border}30`}}>
                <div style={{display:"flex",justifyContent:"space-between"}}>
                  <span style={{fontSize:12,fontWeight:500,color:C.text}}>{f.name}</span>
                  <Badge color={f.daysLeft<=3?"danger":f.daysLeft<=7?"primary":"success"} s={{fontSize:10}}>{f.daysLeft} дн.</Badge>
                </div>
                <div style={{fontSize:11,color:C.dim,marginTop:2}}>Остаток: {f.stock} {f.unit} · Расход: ~{f.dailyRate}/{f.unit} в день</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {!isWorker&&(
        <Card s={{marginBottom:16}}>
          <Title>Остатки сырья</Title>
          <div style={{display:"grid",gap:8}}>
            {rawMaterials.slice(0,8).map(r=>{
              const pct=r.minStock>0?Math.min(100,Math.round(r.stock/r.minStock*50)):100;
              const clr=r.stock<=r.minStock?C.danger:r.stock<=r.minStock*2?C.primary:C.success;
              return(
                <div key={r.id} style={{display:"flex",alignItems:"center",gap:10}}>
                  <span style={{fontSize:12,color:C.text,width:110,flexShrink:0}}>{r.name}</span>
                  <div style={{flex:1,height:6,background:C.bg,borderRadius:3,overflow:"hidden"}}>
                    <div style={{height:"100%",width:`${pct}%`,background:clr,borderRadius:3,transition:"width .3s"}}/>
                  </div>
                  <span style={{fontSize:11,fontWeight:600,color:clr,width:70,textAlign:"right"}}>{r.stock} {r.unit}</span>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(320px,1fr))",gap:14}}>
        <Card><Title>Производство по дням</Title>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={prodByDay}><defs><linearGradient id="gP" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.primary} stopOpacity={.3}/><stop offset="95%" stopColor={C.primary} stopOpacity={0}/></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border}/><XAxis dataKey="date" tick={{fill:C.dim,fontSize:10}}/><YAxis tick={{fill:C.dim,fontSize:10}}/>
              <Tooltip contentStyle={{background:C.surface2,border:`1px solid ${C.border}`,borderRadius:8,color:C.text,fontSize:12}}/>
              <Area type="monotone" dataKey="qty" stroke={C.primary} fill="url(#gP)" name="Кол-во"/>
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card><Title>Остатки сырья vs минимум</Title>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={rawStockData}><CartesianGrid strokeDasharray="3 3" stroke={C.border}/>
              <XAxis dataKey="name" tick={{fill:C.dim,fontSize:9}}/><YAxis tick={{fill:C.dim,fontSize:10}}/>
              <Tooltip contentStyle={{background:C.surface2,border:`1px solid ${C.border}`,borderRadius:8,color:C.text,fontSize:12}}/>
              <Bar dataKey="stock" fill={C.info} radius={[3,3,0,0]} name="Остаток"/>
              <Bar dataKey="min" fill={C.danger} radius={[3,3,0,0]} name="Минимум"/>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card><Title>Эффективность сотрудников</Title>
          {workerStats.map((w,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"7px 0",borderBottom:i<workerStats.length-1?`1px solid ${C.border}`:"none"}}>
              <div style={{width:26,height:26,borderRadius:7,background:`${CC[i]}15`,color:CC[i],display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700}}>{i+1}</div>
              <div style={{flex:1}}>
                <div style={{fontSize:13,color:C.text,fontWeight:500}}>{w.name}</div>
                <div style={{fontSize:11,color:C.dim}}>Выполнено: {w.done}/{w.total}</div>
              </div>
              <div style={{fontSize:14,fontWeight:700,color:C.text}}>{w.produced}</div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}
