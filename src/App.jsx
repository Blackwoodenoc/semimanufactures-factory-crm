import React, { useState, useEffect, useMemo, useCallback } from "react";
import { AppContext } from "./context/AppContext";
import { C } from "./theme";
import { I } from "./icons";
import { EthnicBorder } from "./components/decorative";
import { Badge, Btn } from "./components/ui";
import { usePersisted } from "./hooks/usePersisted";
import { useLocalStorage } from "./hooks/useLocalStorage";
import {
  ROLES,
  INIT_USERS, INIT_PRODUCTS, INIT_RAW_MATERIALS, INIT_RECIPES,
  INIT_TASKS, INIT_TASK_EMPLOYEES, INIT_EMPLOYEE_HISTORY, INIT_PRODUCTION_PLANS,
  INIT_CLIENTS, INIT_CLIENT_ORDERS, INIT_SALES, INIT_INVENTORY_MOVEMENTS,
  INIT_SUPPLIERS, INIT_DELIVERIES, INIT_RAW_MOVEMENTS, INIT_NOTIFICATIONS,
  INIT_MARKS, INIT_PRODUCTION_OUTPUTS, INIT_DEBTS, INIT_CAMERAS,
  INIT_BONUS_RULES, INIT_BASE_SALARIES,
} from "./constants";

import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import UsersPage from "./pages/UsersPage";
import ProductsPage from "./pages/ProductsPage";
import TasksPage from "./pages/TasksPage";
import RawMaterialsPage from "./pages/RawMaterialsPage";
import DeliveriesPage from "./pages/DeliveriesPage";
import EmployeeStatsPage from "./pages/EmployeeStatsPage";
import NotificationsPage from "./pages/NotificationsPage";
import MarksPage from "./pages/MarksPage";
import ReportsPage from "./pages/ReportsPage";
import WorkerHistoryPage from "./pages/WorkerHistoryPage";
import ClientsPage from "./pages/ClientsPage";
import SalesPage from "./pages/SalesPage";
import InventoryJournalPage from "./pages/InventoryJournalPage";
import ProductionPlanPage from "./pages/ProductionPlanPage";
import ProcurementPage from "./pages/ProcurementPage";
import ProfitAnalyticsPage from "./pages/ProfitAnalyticsPage";
import LogsPage from "./pages/LogsPage";
import DebtsPage from "./pages/DebtsPage";
import SalaryStatsPage from "./pages/SalaryStatsPage";
import ProductionOutputPage from "./pages/ProductionOutputPage";
import CameraPage from "./pages/CameraPage";
import OrdersBoardPage from "./pages/OrdersBoardPage";
import { OrdersBoardStandalone } from "./pages/OrdersBoardPage";
import NotificationBell from "./components/layout/NotificationBell";

export default function App(){
  const [currentUser,setCurrentUser]=useState(null);
  const [users,setUsers]=useState(INIT_USERS);
  const [products,setProducts]=usePersisted("dk_products",INIT_PRODUCTS);
  const [tasks,setTasks]=useState(INIT_TASKS);
  const [rawMaterials,setRawMaterials]=useState(INIT_RAW_MATERIALS);
  const [recipes,setRecipes]=useState(INIT_RECIPES);
  const [taskEmployees,setTaskEmployees]=usePersisted("dk_task_emps",INIT_TASK_EMPLOYEES);
  const [employeeHistory,setEmployeeHistory]=usePersisted("dk_emp_hist",INIT_EMPLOYEE_HISTORY);
  const [productionPlans,setProductionPlans]=usePersisted("dk_prod_plans",INIT_PRODUCTION_PLANS);
  const [clients,setClients]=useState(INIT_CLIENTS);
  const [clientOrders,setClientOrders]=usePersisted("dk_client_orders",INIT_CLIENT_ORDERS);
  const [sales,setSales]=useState(INIT_SALES);
  const [inventoryMovements,setInventoryMovements]=usePersisted("dk_inv_move",INIT_INVENTORY_MOVEMENTS);
  const [productionOutputs,setProductionOutputs]=usePersisted("dk_prod_outputs",INIT_PRODUCTION_OUTPUTS);
  const [bonusRules,setBonusRules]=usePersisted("dk_bonus_rules",INIT_BONUS_RULES);
  const [baseSalaries,setBaseSalaries]=usePersisted("dk_base_salaries",INIT_BASE_SALARIES);
  const [debts,setDebts]=usePersisted("dk_debts",INIT_DEBTS);
  const [cameras,setCameras]=useLocalStorage("dk_cameras",INIT_CAMERAS);
  const [suppliers,setSuppliers]=useState(INIT_SUPPLIERS);
  const [deliveries,setDeliveries]=useState(INIT_DELIVERIES);
  const [rawMovements,setRawMovements]=useState(INIT_RAW_MOVEMENTS);
  const [notifications,setNotifications]=useState(INIT_NOTIFICATIONS);
  const [marks,setMarks]=useState(INIT_MARKS);
  const [logs,setLogs]=useState([
    {id:1,userId:1,userName:"Иванов И.И.",message:"Система запущена",date:"2024-06-01T08:00:00"},
  ]);
  const [page,setPage]=useState("dashboard");
  const [sideOpen,setSideOpen]=useState(false);
  const [openGroups,setOpenGroups]=useState(()=>new Set(["main"]));
  const [hiddenWarnings,setHiddenWarnings]=useState(new Set());
  const [isMobile,setIsMobile]=useState(()=>typeof window!=="undefined"&&window.innerWidth<=768);
  const [serverOnline,setServerOnline]=useState(true);

  useEffect(()=>{
    const check=()=>{fetch("/api/ping",{cache:"no-store"}).then(()=>setServerOnline(true)).catch(()=>setServerOnline(false))};
    check();const t=setInterval(check,15000);return()=>clearInterval(t);
  },[]);
  useEffect(()=>{
    const h=()=>setIsMobile(window.innerWidth<=768);
    window.addEventListener("resize",h);return()=>window.removeEventListener("resize",h);
  },[]);

  const addLog=useCallback(msg=>{
    if(!currentUser) return;
    setLogs(p=>[...p,{id:Date.now(),userId:currentUser.id,userName:currentUser.name.split(" ").map((n,i)=>i===0?n:n[0]+".").join(" "),message:msg,date:new Date().toISOString()}]);
  },[currentUser]);

  const addNotification=useCallback((data)=>{
    setNotifications(p=>[...p,{
      id:Date.now()+Math.random(),
      title:data.title||"Уведомление",
      type:data.type||"информация",
      content:data.content||"",
      createdBy:currentUser?.id||0,
      createdAt:new Date().toISOString(),
      readBy:currentUser?[currentUser.id]:[],
      targetAll:data.targetAll||false,
      targetUsers:data.targetUsers||[],
    }]);
  },[currentUser]);

  const handleLogin=u=>{setCurrentUser(u);setPage("dashboard");setTimeout(()=>{setLogs(p=>[...p,{id:Date.now(),userId:u.id,userName:u.name.split(" ").map((n,i)=>i===0?n:n[0]+".").join(" "),message:"Вход в систему",date:new Date().toISOString()}])},100)};
  const handleLogout=()=>{if(currentUser)addLog("Выход");setCurrentUser(null);setPage("dashboard")};

  const production=tasks.filter(t=>t.status==="завершено").map(t=>({id:t.id,productId:t.productId,userIds:t.userIds||[],quantity:t.quantity,date:t.completedAt,note:t.note}));

  const ctx=useMemo(()=>({
    users,setUsers,products,setProducts,tasks,setTasks,rawMaterials,setRawMaterials,recipes,setRecipes,
    taskEmployees,setTaskEmployees,employeeHistory,setEmployeeHistory,
    productionPlans,setProductionPlans,
    clients,setClients,clientOrders,setClientOrders,
    sales,setSales,inventoryMovements,setInventoryMovements,
    suppliers,setSuppliers,deliveries,setDeliveries,rawMovements,setRawMovements,
    notifications,setNotifications,marks,setMarks,
    logs,setLogs,addLog,addNotification,currentUser,production,
    setPage,hiddenWarnings,setHiddenWarnings,
    productionOutputs,setProductionOutputs,
    bonusRules,setBonusRules,baseSalaries,setBaseSalaries,
    debts,setDebts,
    cameras,setCameras,
  }),[users,products,tasks,rawMaterials,recipes,taskEmployees,employeeHistory,productionPlans,clients,clientOrders,sales,inventoryMovements,suppliers,deliveries,rawMovements,notifications,marks,logs,addLog,addNotification,currentUser,production,page,hiddenWarnings,productionOutputs,bonusRules,baseSalaries,debts,cameras]); // eslint-disable-line

  const globalStyles=`
    @import url('https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;500;600;700;800&display=swap');
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Noto Sans',-apple-system,sans-serif;background:${C.bg};color:${C.text}}
    input,select,textarea,button{font-family:'Noto Sans',-apple-system,sans-serif}
    ::-webkit-scrollbar{width:5px;height:5px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:${C.border};border-radius:3px}
    @keyframes slideIn{from{transform:translateX(80px);opacity:0}to{transform:translateX(0);opacity:1}}
    @keyframes fadeUp{from{transform:translateY(8px);opacity:0}to{transform:translateY(0);opacity:1}}
    @keyframes pulseBorder{0%,100%{box-shadow:0 0 0 1px rgba(232,80,80,0.3)}50%{box-shadow:0 0 0 3px rgba(232,80,80,0.6)}}
    @keyframes pulseGlow{0%,100%{opacity:1}50%{opacity:0.3}}
    option{background:${C.surface};color:${C.text}}
    @media(max-width:640px){
      main{padding:10px !important}
      table{font-size:11px}
      .hide-mobile{display:none !important}
    }
  `;

  if(new URLSearchParams(window.location.search).get("board")==="1"){
    return <OrdersBoardStandalone/>;
  }

  if(!currentUser) return(
    <AppContext.Provider value={ctx}><style>{globalStyles}</style><LoginPage onLogin={handleLogin}/></AppContext.Provider>
  );

  const role=ROLES.find(r=>r.id===currentUser.roleId);
  const isAdmin=role?.name==="admin";
  const isManager=role?.name==="manager";
  const isWorker=role?.name==="worker";
  const isOwner=role?.name==="owner";

  const navGroups=[
    {id:"main",label:"Главная",icon:I.home,items:[
      {id:"dashboard",label:"Главная",ok:true},
    ]},
    {id:"production",label:"Производство",icon:I.factory,items:[
      {id:"tasks",label:"Задания",ok:true},
      {id:"products",label:"Товары",ok:true},
      {id:"prodOutput",label:"Выпуск",ok:true},
      {id:"planning",label:"Планирование",ok:isAdmin||isManager},
    ]},
    {id:"warehouse",label:"Склад",icon:I.warehouse,items:[
      {id:"raw",label:"Сырьё",ok:isAdmin||isManager},
      {id:"deliveries",label:"Поставки",ok:isAdmin||isManager},
      {id:"procurement",label:"Закупки",ok:isAdmin||isManager},
    ]},
    {id:"sales",label:"Торговля",icon:I.truck,items:[
      {id:"clients",label:"Клиенты",ok:isAdmin||isManager},
      {id:"sales",label:"Продажи",ok:isAdmin||isManager},
      {id:"inventory",label:"Движение",ok:isAdmin||isManager},
      {id:"ordersBoard",label:"Доска заказов",ok:isAdmin||isManager},
    ]},
    {id:"staff",label:"Персонал",icon:I.people,items:[
      {id:"empstats",label:"KPI",ok:isAdmin||isManager},
      {id:"salary",label:"Премии",ok:isAdmin||isManager},
      {id:"workerHistory",label:"История",ok:true},
      {id:"marks",label:"Отметки",ok:true},
      {id:"users",label:"Пользователи",ok:isAdmin},
    ]},
    {id:"analytics",label:"Аналитика",icon:I.analytics,items:[
      {id:"reports",label:"Отчёты",ok:isAdmin||isManager},
      {id:"profitAnalytics",label:"Прибыль",ok:isAdmin||isManager},
      {id:"logs",label:"Журнал",ok:isAdmin},
    ]},
    {id:"system",label:"Система",icon:I.gear,items:[
      {id:"notifications",label:"Уведомления",ok:true},
      {id:"debts",label:isOwner?"Долги сотрудников":"Мои долги",ok:true},
      {id:"cameras",label:"Камеры",ok:true},
    ]},
  ].map(g=>({...g,items:g.items.filter(i=>i.ok)})).filter(g=>g.items.length>0);

  let activeGroupId="main";
  for(const g of navGroups){if(g.items.some(i=>i.id===page)){activeGroupId=g.id;break;}}

  const isGroupOpen=(gid)=>gid===activeGroupId||openGroups.has(gid);
  const toggleGroup=(gid)=>{
    setOpenGroups(prev=>{
      const next=new Set(prev);
      if(gid===activeGroupId)return prev;
      if(next.has(gid))next.delete(gid);else next.add(gid);
      return next;
    });
  };

  const unreadCount=notifications.filter(n=>(n.targetAll||n.targetUsers?.includes(currentUser.id))&&!n.readBy?.includes(currentUser.id)).length;

  const renderPage=()=>{
    switch(page){
      case "dashboard":return <DashboardPage/>;
      case "tasks":return <TasksPage/>;
      case "products":return <ProductsPage/>;
      case "prodOutput":return <ProductionOutputPage/>;
      case "planning":return(isAdmin||isManager)?<ProductionPlanPage/>:<DashboardPage/>;
      case "raw":return(isAdmin||isManager)?<RawMaterialsPage/>:<DashboardPage/>;
      case "deliveries":return(isAdmin||isManager)?<DeliveriesPage/>:<DashboardPage/>;
      case "procurement":return(isAdmin||isManager)?<ProcurementPage/>:<DashboardPage/>;
      case "clients":return(isAdmin||isManager)?<ClientsPage/>:<DashboardPage/>;
      case "sales":return(isAdmin||isManager)?<SalesPage/>:<DashboardPage/>;
      case "inventory":return(isAdmin||isManager)?<InventoryJournalPage/>:<DashboardPage/>;
      case "ordersBoard":return(isAdmin||isManager)?<OrdersBoardPage/>:<DashboardPage/>;
      case "empstats":return(isAdmin||isManager)?<EmployeeStatsPage/>:<DashboardPage/>;
      case "salary":return(isAdmin||isManager)?<SalaryStatsPage/>:<DashboardPage/>;
      case "workerHistory":return <WorkerHistoryPage/>;
      case "notifications":return <NotificationsPage/>;
      case "debts":return <DebtsPage/>;
      case "marks":return <MarksPage/>;
      case "reports":return(isAdmin||isManager)?<ReportsPage/>:<DashboardPage/>;
      case "profitAnalytics":return(isAdmin||isManager)?<ProfitAnalyticsPage/>:<DashboardPage/>;
      case "users":return isAdmin?<UsersPage/>:<DashboardPage/>;
      case "logs":return isAdmin?<LogsPage/>:<DashboardPage/>;
      case "cameras":return <CameraPage/>;
      default:return <DashboardPage/>;
    }
  };

  return(
    <AppContext.Provider value={ctx}>
      <style>{globalStyles}</style>

      {sideOpen&&<div onClick={()=>setSideOpen(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.5)",zIndex:998}}/>}
      {!serverOnline&&<div style={{position:"fixed",top:0,left:0,right:0,zIndex:1001,background:C.danger,color:"#fff",padding:"5px 16px",fontSize:12,fontWeight:600,textAlign:"center",letterSpacing:.3}}>Нет соединения с сервером — изменения не сохраняются</div>}

      <aside style={{position:"fixed",top:0,left:0,bottom:0,width:220,background:C.surface,borderRight:`1px solid ${C.border}`,display:"flex",flexDirection:"column",transition:"transform .3s",zIndex:999,transform:isMobile&&!sideOpen?"translateX(-100%)":"translateX(0)"}}>
        <div style={{padding:"16px 14px",borderBottom:`1px solid ${C.border}`}}>
          <div style={{display:"flex",alignItems:"center",gap:9}}>
            <div style={{width:34,height:34,borderRadius:9,background:`linear-gradient(135deg, ${C.primary}25, ${C.primary}10)`,display:"flex",alignItems:"center",justifyContent:"center",color:C.primary,border:`1px solid ${C.primary}30`}}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                <path d="M2 17l10 5 10-5"/>
                <path d="M2 12l10 5 10-5"/>
              </svg>
            </div>
            <div><div style={{fontSize:15,fontWeight:800,color:C.text,letterSpacing:.5}}>Dikanish</div><div style={{fontSize:10,color:C.dim}}>v7.0</div></div>
          </div>
        </div>
        <EthnicBorder color={C.primary} height={2}/>
        <nav style={{flex:1,padding:"8px 8px",overflowY:"auto"}}>
          {navGroups.map(group=>{
            const GIco=group.icon;
            const isOpen=isGroupOpen(group.id);
            const groupHasActive=group.items.some(i=>i.id===page);
            const isSingle=group.items.length===1;
            const showBadgeOnGroup=group.id==="system"&&unreadCount>0;
            if(isSingle){
              const item=group.items[0];
              const active=page===item.id;
              return(
                <button key={group.id} onClick={()=>{setPage(item.id);setSideOpen(false)}} style={{display:"flex",alignItems:"center",gap:9,width:"100%",padding:"9px 11px",border:"none",borderRadius:7,background:active?C.primaryBg:"transparent",color:active?C.primary:C.muted,fontSize:13,fontWeight:active?700:500,cursor:"pointer",fontFamily:"inherit",marginBottom:2,textAlign:"left",borderLeft:active?`3px solid ${C.primary}`:"3px solid transparent",transition:"all .15s"}}>
                  <GIco size={16}/>{group.label}
                  {showBadgeOnGroup&&<span style={{marginLeft:"auto",minWidth:18,height:18,borderRadius:9,background:C.danger,color:"#fff",fontSize:10,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",padding:"0 5px"}}>{unreadCount>9?"9+":unreadCount}</span>}
                </button>
              );
            }
            return(
              <div key={group.id} style={{marginBottom:4}}>
                <button onClick={()=>toggleGroup(group.id)} style={{display:"flex",alignItems:"center",gap:9,width:"100%",padding:"9px 11px",border:"none",borderRadius:7,background:groupHasActive&&!isOpen?C.primaryBg:"transparent",color:groupHasActive?C.primary:C.muted,fontSize:13,fontWeight:groupHasActive?700:500,cursor:"pointer",fontFamily:"inherit",textAlign:"left",transition:"all .15s"}}>
                  <GIco size={16}/>
                  <span style={{flex:1}}>{group.label}</span>
                  {showBadgeOnGroup&&<span style={{minWidth:18,height:18,borderRadius:9,background:C.danger,color:"#fff",fontSize:10,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",padding:"0 5px",marginRight:4}}>{unreadCount>9?"9+":unreadCount}</span>}
                  <span style={{transition:"transform .2s",transform:isOpen?"rotate(180deg)":"rotate(0deg)",opacity:.5,flexShrink:0,display:"flex",alignItems:"center"}}><I.chevDown size={14}/></span>
                </button>
                <div style={{overflow:"hidden",maxHeight:isOpen?`${group.items.length*36+4}px`:"0px",transition:"max-height .25s ease",marginLeft:0}}>
                  {group.items.map(item=>{
                    const active=page===item.id;
                    const showItemBadge=item.id==="notifications"&&unreadCount>0;
                    return(
                      <button key={item.id} onClick={()=>{setPage(item.id);setSideOpen(false)}} style={{display:"flex",alignItems:"center",gap:9,width:"100%",padding:"7px 11px 7px 38px",border:"none",borderRadius:6,background:active?C.primaryBg:"transparent",color:active?C.primary:C.dim,fontSize:12,fontWeight:active?600:400,cursor:"pointer",fontFamily:"inherit",marginBottom:1,textAlign:"left",borderLeft:active?`3px solid ${C.primary}`:"3px solid transparent",transition:"all .15s"}}>
                        {item.label}
                        {showItemBadge&&<span style={{marginLeft:"auto",minWidth:16,height:16,borderRadius:8,background:C.danger,color:"#fff",fontSize:9,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",padding:"0 4px"}}>{unreadCount>9?"9+":unreadCount}</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>
        <div style={{padding:"12px 14px",borderTop:`1px solid ${C.border}`}}>
          <div style={{display:"flex",alignItems:"center",gap:9,marginBottom:8}}>
            <div style={{width:30,height:30,borderRadius:7,background:`linear-gradient(135deg, ${C.primary}25, ${C.primary}10)`,display:"flex",alignItems:"center",justifyContent:"center",color:C.primary,fontWeight:800,fontSize:13,border:`1px solid ${C.primary}25`}}>{currentUser.name.charAt(0)}</div>
            <div style={{flex:1,minWidth:0}}><div style={{fontSize:12,fontWeight:600,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{currentUser.name.split(" ").slice(0,2).join(" ")}</div><div style={{fontSize:10,color:C.dim}}>{role?.label}</div></div>
          </div>
          <Btn v="secondary" sz="sm" onClick={handleLogout} icon={<I.out size={13}/>} style={{width:"100%",justifyContent:"center"}}>Выйти</Btn>
        </div>
      </aside>

      <div style={{marginLeft:isMobile?0:220,minHeight:"100vh"}}>
        <header style={{padding:"10px 18px",borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",gap:10,background:C.surface}}>
          <button onClick={()=>setSideOpen(!sideOpen)} style={{background:"none",border:"none",color:C.muted,cursor:"pointer",padding:3}}><I.menu size={20}/></button>
          {(isAdmin||isManager)&&(()=>{
            const totalIncome=sales.reduce((s,sl)=>{const p=products.find(x=>x.id===sl.productId);return s+(p?.sellPrice||0)*sl.quantity},0)+clientOrders.filter(o=>o.status==="отгружен").reduce((s,o)=>s+o.total,0);
            const totalExpense=deliveries.reduce((s,d)=>s+d.totalPrice,0);
            const balance=totalIncome-totalExpense;
            const monthStr=new Date().toISOString().slice(0,7);
            const monthIncome=sales.filter(sl=>sl.createdAt?.startsWith(monthStr)).reduce((s,sl)=>{const p=products.find(x=>x.id===sl.productId);return s+(p?.sellPrice||0)*sl.quantity},0)+clientOrders.filter(o=>o.status==="отгружен"&&o.shippedAt?.startsWith(monthStr)).reduce((s,o)=>s+o.total,0);
            const monthExpense=deliveries.filter(d=>d.date?.startsWith(monthStr)).reduce((s,d)=>s+d.totalPrice,0);
            const monthProfit=monthIncome-monthExpense;
            const emoji=monthProfit>0?"🟢":monthProfit===0?"🟡":"🔴";
            return(
              <div style={{display:"flex",alignItems:"center",gap:8,padding:"4px 12px",background:C.bg,borderRadius:8,border:`1px solid ${C.border}`,cursor:"pointer"}} onClick={()=>setPage("profitAnalytics")} title="Подробная аналитика">
                <span style={{fontSize:12}}>{emoji}</span>
                <div style={{lineHeight:1.2}}>
                  <div style={{fontSize:11,fontWeight:700,color:balance>=0?C.success:C.danger}}>{balance>=0?"+":""}{(balance/1000).toFixed(0)}т ₽</div>
                  <div style={{fontSize:9,color:C.dim}}>мес: {monthProfit>=0?"+":""}{(monthProfit/1000).toFixed(0)}т</div>
                </div>
              </div>
            );
          })()}
          <div style={{flex:1}}/>
          <NotificationBell onGoToPage={setPage}/>
          <Badge color={isAdmin?"danger":isManager?"info":"primary"}>{role?.label}</Badge>
        </header>
        <main style={{padding:20,maxWidth:1200}}>{renderPage()}</main>
      </div>
    </AppContext.Provider>
  );
}
