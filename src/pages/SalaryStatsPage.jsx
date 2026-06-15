import { useContext, useState, useMemo } from "react";
import { AppContext } from "../context/AppContext";
import { C, CC } from "../theme";
import { I } from "../icons";
import { ROLES } from "../constants";
import { Badge, Btn, Inp, Toast, TH, TD, Card, Title, PageH, Stat } from "../components/ui";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";

export default function SalaryStatsPage(){
  const {users,tasks,taskEmployees,productionOutputs,products,bonusRules,setBonusRules,baseSalaries,setBaseSalaries,currentUser,addLog}=useContext(AppContext);
  const role=ROLES.find(r=>r.id===currentUser.roleId);
  const isAdmin=role?.name==="admin";
  const workers=users.filter(u=>u.roleId===3&&u.status==="active");

  // ── Period ──
  const [period,setPeriod]=useState("month");
  const [customFrom,setCustomFrom]=useState(()=>new Date().toISOString().slice(0,10));
  const [customTo,setCustomTo]=useState(()=>new Date().toISOString().slice(0,10));
  const [sortBy,setSortBy]=useState("qty_desc");
  const [tab,setTab]=useState("stats"); // stats | rules
  const [toast,setToast]=useState(null);

  const getPeriodDates=()=>{
    const today=new Date();
    const todayStr=today.toISOString().slice(0,10);
    if(period==="today") return[todayStr,todayStr];
    if(period==="week"){
      const d=new Date(today);const day=d.getDay()||7;d.setDate(d.getDate()-day+1);
      const mon=d.toISOString().slice(0,10);
      const sun=new Date(d);sun.setDate(sun.getDate()+6);
      return[mon,sun.toISOString().slice(0,10)];
    }
    if(period==="month"){
      return[todayStr.slice(0,7)+"-01",todayStr];
    }
    return[customFrom,customTo];
  };
  const[fromDate,toDate]=getPeriodDates();

  // ── Per-worker calculation ──
  const workerStats=useMemo(()=>{
    return workers.map(w=>{
      const byProduct={};
      // from completed tasks
      taskEmployees.filter(te=>te.employeeId===w.id&&(te.status==="завершено"||te.status==="просрочено")).forEach(te=>{
        const task=tasks.find(t=>t.id===te.taskId);
        if(!task?.completedAt) return;
        const d=task.completedAt.slice(0,10);
        if(d<fromDate||d>toDate) return;
        const pname=products.find(p=>p.id===task.productId)?.name||"?";
        byProduct[pname]=(byProduct[pname]||0)+te.producedQty;
      });
      // from manual outputs
      (productionOutputs||[]).filter(o=>o.employeeId===w.id).forEach(o=>{
        const d=o.date.slice(0,10);
        if(d<fromDate||d>toDate) return;
        const pname=products.find(p=>p.id===o.productId)?.name||"?";
        byProduct[pname]=(byProduct[pname]||0)+o.quantity;
      });
      const totalQty=Object.values(byProduct).reduce((s,v)=>s+v,0);
      // bonus rule: highest fromQty ≤ totalQty
      const sortedRules=[...(bonusRules||[])].sort((a,b)=>b.fromQty-a.fromQty);
      const rule=sortedRules.find(r=>totalQty>=r.fromQty)||sortedRules[sortedRules.length-1]||{bonusPercent:0,label:"—",fromQty:0};
      const nextRule=sortedRules.find(r=>r.fromQty>totalQty&&r.fromQty>rule.fromQty)||null;
      const bonusPercent=rule.bonusPercent||0;
      const baseSalary=baseSalaries[w.id]||0;
      const bonusAmount=baseSalary>0?Math.round(baseSalary*bonusPercent/100):0;
      const toNext=nextRule?nextRule.fromQty-totalQty:0;
      return{w,totalQty,byProduct,bonusPercent,bonusLabel:rule.label,bonusFromQty:rule.fromQty,bonusAmount,baseSalary,toNext,nextRule};
    });
  },[workers,tasks,taskEmployees,productionOutputs,products,bonusRules,baseSalaries,fromDate,toDate]);

  const sorted=useMemo(()=>{
    const s=[...workerStats];
    if(sortBy==="qty_desc") s.sort((a,b)=>b.totalQty-a.totalQty);
    else if(sortBy==="qty_asc") s.sort((a,b)=>a.totalQty-b.totalQty);
    else if(sortBy==="bonus_desc") s.sort((a,b)=>b.bonusPercent-a.bonusPercent);
    else s.sort((a,b)=>a.w.name.localeCompare(b.w.name));
    return s;
  },[workerStats,sortBy]);

  // ── Daily trend data (all workers combined) ──
  const trendData=useMemo(()=>{
    const m={};
    taskEmployees.filter(te=>te.status==="завершено"||te.status==="просрочено").forEach(te=>{
      if(!workers.find(w=>w.id===te.employeeId)) return;
      const task=tasks.find(t=>t.id===te.taskId);
      if(!task?.completedAt) return;
      const d=task.completedAt.slice(0,10);
      if(d<fromDate||d>toDate) return;
      m[d]=(m[d]||0)+te.producedQty;
    });
    (productionOutputs||[]).forEach(o=>{
      if(!workers.find(w=>w.id===o.employeeId)) return;
      const d=o.date.slice(0,10);
      if(d<fromDate||d>toDate) return;
      m[d]=(m[d]||0)+o.quantity;
    });
    return Object.entries(m).sort(([a],[b])=>a.localeCompare(b)).map(([date,qty])=>({date:date.slice(5),qty}));
  },[taskEmployees,productionOutputs,tasks,workers,fromDate,toDate]);

  const barData=sorted.map(s=>({name:s.w.name.split(" ").slice(0,2).join(" "),qty:s.totalQty,bonus:s.bonusPercent}));
  const totalAll=workerStats.reduce((s,w)=>s+w.totalQty,0);
  const avgQty=workers.length?Math.round(totalAll/workers.length):0;
  const topWorker=sorted[0];

  // ── Bonus Rules Editor ──
  const [ruleForm,setRuleForm]=useState({fromQty:"",bonusPercent:"",label:""});
  const [ruleEdit,setRuleEdit]=useState(null);
  const [ruleErrs,setRuleErrs]=useState({});

  const saveRule=()=>{
    const e={};
    if(ruleForm.fromQty===""||+ruleForm.fromQty<0) e.fromQty="!";
    if(ruleForm.bonusPercent===""||+ruleForm.bonusPercent<0||+ruleForm.bonusPercent>100) e.bonusPercent="0–100";
    if(!ruleForm.label.trim()) e.label="!";
    setRuleErrs(e);if(Object.keys(e).length) return;
    if(ruleEdit){
      setBonusRules(p=>p.map(r=>r.id===ruleEdit.id?{...r,fromQty:+ruleForm.fromQty,bonusPercent:+ruleForm.bonusPercent,label:ruleForm.label}:r));
      setToast({message:"Правило обновлено",type:"success"});
    } else {
      setBonusRules(p=>[...p,{id:Date.now(),fromQty:+ruleForm.fromQty,bonusPercent:+ruleForm.bonusPercent,label:ruleForm.label}]);
      setToast({message:"Правило добавлено",type:"success"});
    }
    setRuleEdit(null);setRuleForm({fromQty:"",bonusPercent:"",label:""});
  };
  const deleteRule=id=>{
    if((bonusRules||[]).length<=1){setToast({message:"Нельзя удалить последнее правило",type:"error"});return;}
    setBonusRules(p=>p.filter(r=>r.id!==id));
    setToast({message:"Удалено",type:"error"});
  };
  const startEditRule=r=>{setRuleEdit(r);setRuleForm({fromQty:r.fromQty,bonusPercent:r.bonusPercent,label:r.label});};
  const sortedRules=[...(bonusRules||[])].sort((a,b)=>a.fromQty-b.fromQty);

  const periodLabel={today:"Сегодня",week:"Эта неделя",month:"Этот месяц",custom:"Период"}[period];
  const tabStyle=active=>({padding:"7px 16px",borderRadius:7,border:`1px solid ${active?C.primary:C.border}`,background:active?C.primaryBg:C.surface,color:active?C.primary:C.muted,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit"});

  return(
    <div>
      <PageH title="Статистика выработки и премии">
        <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
          {[["stats","Статистика"],["rules","Правила премий"]].map(([t,l])=>(
            (t==="rules"&&!isAdmin)?null:
            <button key={t} onClick={()=>setTab(t)} style={tabStyle(tab===t)}>{l}</button>
          ))}
        </div>
      </PageH>

      {tab==="stats"&&(<>
        {/* Period selector */}
        <Card s={{marginBottom:16,padding:"12px 16px"}}>
          <div style={{display:"flex",flexWrap:"wrap",gap:8,alignItems:"center"}}>
            <span style={{fontSize:12,color:C.muted,fontWeight:600}}>Период:</span>
            {[["today","Сегодня"],["week","Неделя"],["month","Месяц"],["custom","Произвольный"]].map(([v,l])=>(
              <button key={v} onClick={()=>setPeriod(v)} style={tabStyle(period===v)}>{l}</button>
            ))}
            {period==="custom"&&(<>
              <input type="date" value={customFrom} onChange={e=>setCustomFrom(e.target.value)} style={{padding:"6px 8px",background:C.bg,border:`1px solid ${C.border}`,borderRadius:6,color:C.text,fontSize:12,fontFamily:"inherit"}}/>
              <span style={{color:C.dim}}>—</span>
              <input type="date" value={customTo} onChange={e=>setCustomTo(e.target.value)} style={{padding:"6px 8px",background:C.bg,border:`1px solid ${C.border}`,borderRadius:6,color:C.text,fontSize:12,fontFamily:"inherit"}}/>
            </>)}
            <span style={{marginLeft:"auto",fontSize:11,color:C.dim}}>{fromDate} → {toDate}</span>
            <select value={sortBy} onChange={e=>setSortBy(e.target.value)} style={{padding:"6px 8px",background:C.bg,border:`1px solid ${C.border}`,borderRadius:6,color:C.text,fontSize:12,fontFamily:"inherit"}}>
              <option value="qty_desc">↓ По выработке</option>
              <option value="qty_asc">↑ По выработке</option>
              <option value="bonus_desc">↓ По премии</option>
              <option value="name">По имени</option>
            </select>
          </div>
        </Card>

        {/* Summary stats */}
        <div style={{display:"flex",flexWrap:"wrap",gap:12,marginBottom:16}}>
          <Stat icon={<I.factory size={18}/>} label={`Выработка (${periodLabel})`} value={`${totalAll} ед.`} color={C.success}/>
          <Stat icon={<I.people size={18}/>} label="Среднее на сотрудника" value={`${avgQty} ед.`} color={C.info}/>
          {topWorker&&<Stat icon={<I.star size={18}/>} label={`Лидер: ${topWorker.w.name.split(" ")[1]||topWorker.w.name}`} value={`${topWorker.totalQty} ед.`} color={C.primary}/>}
          {topWorker&&<Stat icon={<I.chart size={18}/>} label="Макс. премия" value={`+${topWorker.bonusPercent}%`} color={C.success}/>}
        </div>

        {/* Charts row */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))",gap:14,marginBottom:16}}>
          <Card>
            <Title>Выработка по сотрудникам</Title>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={C.border}/>
                <XAxis type="number" tick={{fill:C.dim,fontSize:10}}/>
                <YAxis type="category" dataKey="name" tick={{fill:C.text,fontSize:11}} width={80}/>
                <Tooltip contentStyle={{background:C.surface2,border:`1px solid ${C.border}`,borderRadius:8,color:C.text,fontSize:12}} formatter={(v,n)=>[v, n==="qty"?"Выработка":"Премия %"]}/>
                <Bar dataKey="qty" fill={C.success} radius={[0,4,4,0]} name="qty"/>
              </BarChart>
            </ResponsiveContainer>
          </Card>
          <Card>
            <Title>Выработка по дням</Title>
            {trendData.length>0?(
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={trendData}>
                  <defs><linearGradient id="gS" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.success} stopOpacity={.3}/><stop offset="95%" stopColor={C.success} stopOpacity={0}/></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border}/>
                  <XAxis dataKey="date" tick={{fill:C.dim,fontSize:10}}/>
                  <YAxis tick={{fill:C.dim,fontSize:10}}/>
                  <Tooltip contentStyle={{background:C.surface2,border:`1px solid ${C.border}`,borderRadius:8,color:C.text,fontSize:12}} formatter={v=>[v,"Выработка"]}/>
                  <Area type="monotone" dataKey="qty" stroke={C.success} fill="url(#gS)" name="Выработка"/>
                </AreaChart>
              </ResponsiveContainer>
            ):<div style={{height:220,display:"flex",alignItems:"center",justifyContent:"center",color:C.dim,fontSize:13}}>Нет данных за период</div>}
          </Card>
        </div>

        {/* Worker cards */}
        <div style={{display:"grid",gap:12}}>
          {sorted.map((s,i)=>{
            const breakdown=Object.entries(s.byProduct).sort((a,b)=>b[1]-a[1]);
            const bonusClr=s.bonusPercent>=15?C.success:s.bonusPercent>=10?C.primary:s.bonusPercent>=5?C.orange:C.dim;
            return(
              <Card key={s.w.id} s={{borderLeft:`3px solid ${bonusClr}`}}>
                <div style={{display:"flex",flexWrap:"wrap",gap:14,alignItems:"flex-start"}}>
                  {/* Avatar + name */}
                  <div style={{display:"flex",alignItems:"center",gap:10,minWidth:160}}>
                    <div style={{width:40,height:40,borderRadius:10,background:`${CC[i%CC.length]}15`,color:CC[i%CC.length],display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:17,border:`2px solid ${CC[i%CC.length]}30`,flexShrink:0}}>
                      {s.w.name.charAt(0)}
                    </div>
                    <div>
                      <div style={{fontSize:14,fontWeight:700,color:C.text}}>{s.w.name.split(" ").slice(0,2).join(" ")}</div>
                      <div style={{fontSize:11,color:C.dim}}>#{i+1} по выработке</div>
                    </div>
                  </div>

                  {/* Qty */}
                  <div style={{textAlign:"center",minWidth:80}}>
                    <div style={{fontSize:26,fontWeight:800,color:C.text}}>{s.totalQty}</div>
                    <div style={{fontSize:11,color:C.dim}}>единиц</div>
                  </div>

                  {/* Bonus */}
                  <div style={{padding:"8px 14px",background:`${bonusClr}12`,borderRadius:10,border:`1px solid ${bonusClr}25`,minWidth:120}}>
                    <div style={{fontSize:22,fontWeight:800,color:bonusClr}}>+{s.bonusPercent}%</div>
                    <div style={{fontSize:11,fontWeight:600,color:bonusClr,marginTop:1}}>{s.bonusLabel}</div>
                    <div style={{fontSize:10,color:C.dim,marginTop:2}}>от {s.bonusFromQty}+ ед.</div>
                  </div>

                  {/* Salary calc */}
                  <div style={{minWidth:140}}>
                    {s.baseSalary>0?(
                      <div style={{padding:"8px 14px",background:C.bg,borderRadius:8,border:`1px solid ${C.border}`}}>
                        <div style={{fontSize:11,color:C.dim}}>Базовая ставка</div>
                        <div style={{fontSize:14,fontWeight:600,color:C.text}}>{s.baseSalary.toLocaleString("ru")} ₽</div>
                        {s.bonusPercent>0&&<>
                          <div style={{fontSize:11,color:C.dim,marginTop:4}}>Премия</div>
                          <div style={{fontSize:14,fontWeight:700,color:C.success}}>+{s.bonusAmount.toLocaleString("ru")} ₽</div>
                          <div style={{height:1,background:C.border,margin:"6px 0"}}/>
                          <div style={{fontSize:13,fontWeight:800,color:C.text}}>{(s.baseSalary+s.bonusAmount).toLocaleString("ru")} ₽</div>
                        </>}
                      </div>
                    ):(
                      <div style={{fontSize:11,color:C.dim,padding:"8px 0"}}>Ставка не указана<br/><span style={{color:C.info}}>Задайте в Пользователях</span></div>
                    )}
                  </div>

                  {/* To next level */}
                  {s.toNext>0&&s.nextRule&&(
                    <div style={{fontSize:11,color:C.muted,padding:"8px 0",maxWidth:140}}>
                      <div>До уровня <strong style={{color:C.primary}}>{s.nextRule.label}</strong>:</div>
                      <div style={{fontWeight:700,color:C.primary,fontSize:13}}>{s.toNext} ед.</div>
                      <div style={{color:C.dim}}>(+{s.nextRule.bonusPercent}% премия)</div>
                    </div>
                  )}

                  {/* Product breakdown */}
                  {breakdown.length>0&&(
                    <div style={{flex:"1 1 160px"}}>
                      <div style={{fontSize:11,color:C.dim,marginBottom:6}}>По продуктам:</div>
                      <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                        {breakdown.map(([name,qty])=>(
                          <div key={name} style={{padding:"3px 9px",background:C.bg,borderRadius:6,border:`1px solid ${C.border}`,fontSize:11}}>
                            <span style={{color:C.muted}}>{name.length>12?name.slice(0,12)+"…":name}</span>
                            <span style={{fontWeight:700,color:C.text,marginLeft:5}}>{qty}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Progress to next level */}
                {s.nextRule&&s.totalQty>0&&(
                  <div style={{marginTop:12}}>
                    <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:C.dim,marginBottom:3}}>
                      <span>{s.bonusLabel} ({s.bonusFromQty} ед.)</span>
                      <span>{s.nextRule.label} ({s.nextRule.fromQty} ед.)</span>
                    </div>
                    <div style={{height:4,background:C.bg,borderRadius:2,overflow:"hidden"}}>
                      <div style={{height:"100%",width:`${Math.min(100,Math.round((s.totalQty-s.bonusFromQty)/(s.nextRule.fromQty-s.bonusFromQty)*100))}%`,background:bonusClr,borderRadius:2,transition:"width .4s"}}/>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
          {sorted.length===0&&<div style={{textAlign:"center",padding:50,color:C.dim,fontSize:13}}>Нет активных сотрудников</div>}
        </div>
      </>)}

      {tab==="rules"&&isAdmin&&(
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,alignItems:"start"}}>
          {/* Rules table */}
          <Card s={{padding:0,overflow:"hidden"}}>
            <div style={{padding:"14px 18px",borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <Title>Пороги премий</Title>
            </div>
            <table style={{width:"100%",borderCollapse:"collapse"}}>
              <thead><tr><TH>От (ед.)</TH><TH>Премия %</TH><TH>Название уровня</TH><TH></TH></tr></thead>
              <tbody>
                {sortedRules.map((r,i)=>{
                  const next=sortedRules[i+1];
                  return(
                    <tr key={r.id} style={{borderBottom:`1px solid ${C.border}`}}>
                      <TD s={{fontWeight:700,color:C.primary}}>{r.fromQty}+{next?` (до ${next.fromQty-1})`:""}</TD>
                      <TD><Badge color={r.bonusPercent>=15?"success":r.bonusPercent>=10?"primary":r.bonusPercent>=5?"orange":"info"}>+{r.bonusPercent}%</Badge></TD>
                      <TD s={{fontWeight:500}}>{r.label}</TD>
                      <TD><div style={{display:"flex",gap:4}}>
                        <Btn v="ghost" sz="sm" onClick={()=>startEditRule(r)} icon={<I.edit size={13}/>}/>
                        <Btn v="ghost" sz="sm" onClick={()=>deleteRule(r.id)} icon={<I.trash size={13}/>}/>
                      </div></TD>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div style={{padding:"10px 16px",borderTop:`1px solid ${C.border}`,fontSize:11,color:C.dim}}>
              Логика: находится наибольший порог ≤ выработки сотрудника → применяется его %.
            </div>
          </Card>

          {/* Rule form */}
          <Card>
            <Title>{ruleEdit?"Редактировать правило":"Новое правило"}</Title>
            <Inp label="От (количество единиц)" type="number" min="0" value={ruleForm.fromQty} onChange={e=>setRuleForm({...ruleForm,fromQty:e.target.value})} error={ruleErrs.fromQty} placeholder="напр. 100"/>
            <Inp label="Процент премии (%)" type="number" min="0" max="100" value={ruleForm.bonusPercent} onChange={e=>setRuleForm({...ruleForm,bonusPercent:e.target.value})} error={ruleErrs.bonusPercent} placeholder="напр. 10"/>
            <Inp label="Название уровня" value={ruleForm.label} onChange={e=>setRuleForm({...ruleForm,label:e.target.value})} error={ruleErrs.label} placeholder="напр. Отлично"/>
            <div style={{display:"flex",gap:8,marginTop:6}}>
              {ruleEdit&&<Btn v="secondary" onClick={()=>{setRuleEdit(null);setRuleForm({fromQty:"",bonusPercent:"",label:""});}}>Отмена</Btn>}
              <Btn v={ruleEdit?"primary":"success"} onClick={saveRule}>{ruleEdit?"Сохранить":"Добавить правило"}</Btn>
            </div>

            <div style={{marginTop:20,padding:"12px 14px",background:`${C.primary}08`,borderRadius:8,border:`1px solid ${C.primary}20`}}>
              <div style={{fontSize:12,fontWeight:700,color:C.text,marginBottom:8}}>Пример расчёта</div>
              {sortedRules.map((r,i)=>{
                const qty=r.fromQty+(sortedRules[i+1]?Math.floor((sortedRules[i+1].fromQty-r.fromQty)/2):100);
                return(
                  <div key={r.id} style={{fontSize:11,color:C.muted,marginBottom:3}}>
                    Выработка {qty} ед. → <strong style={{color:C.text}}>{r.label}</strong> → <span style={{color:C.success}}>+{r.bonusPercent}%</span>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}

      {toast&&<Toast {...toast} onClose={()=>setToast(null)}/>}
    </div>
  );
}
