export const hashPassword = (p) => btoa(p + "_hashed_salt_2024");

export const ROLES = [
  { id: 1, name: "admin",    label: "Администратор"  },
  { id: 2, name: "manager",  label: "Менеджер"       },
  { id: 3, name: "worker",   label: "Сотрудник цеха" },
  { id: 4, name: "owner",    label: "Владелец"       },
];
export const CATEGORIES = ["Пельмени","Котлеты","Вареники","Блинчики","Манты","Хинкали","Чебуреки","Голубцы"];
export const UNITS = ["кг","шт","уп"];
export const STATUSES = ["в производстве","готов","снят с производства"];
export const TASK_STATUSES = ["назначено","в работе","завершено","просрочено"];
export const RAW_CATEGORIES = ["Мясо","Тесто","Овощи","Специи","Масло","Молочные","Мука","Прочее"];
export const RAW_UNITS = ["кг","л","шт","г"];
export const NOTIF_TYPES = ["информация","предупреждение","ошибка"];
export const MARK_TYPES = ["присутствие","выполненный заказ"];
export const PLAN_STATUSES = ["запланирован","в процессе","выполнен","отменён"];
export const ORDER_STATUSES = ["новый","сборка","в производстве","готов","отгружен","отменён"];
export const ORDER_PRIORITIES = ["нормальный","важный","срочный"];
export const BOARD_COLUMNS = [
  {id:"новый",          label:"Новые"},
  {id:"сборка",         label:"Сборка"},
  {id:"в производстве", label:"В производстве"},
  {id:"готов",          label:"Готово ✓"},
];
export const MOVEMENT_TYPES = {production:"Производство",output:"Выпуск (ручной)",sale:"Продажа",order_shipment:"Отгрузка заказа",manual_adjustment:"Коррекция"};
export const CAMERA_SOURCE_TYPES = ["demo","iframe","image","mjpeg","mp4","hls","rtsp"];
export const CAMERA_SOURCE_LABELS = {demo:"Демо (заглушка)",iframe:"iframe / Web UI",image:"JPEG snapshot",mjpeg:"MJPEG поток",mp4:"MP4 видео",hls:"HLS (.m3u8)",rtsp:"RTSP (не поддержан)"};
export const CAMERA_ZONES = ["Цех","Склад","Вход","Офис","Улица","Прочее"];
export const DEBT_STATUSES = ["активен","частично погашен","погашен"];

export const fmtDate = (d) => { if(!d) return "—"; const dt=new Date(d); return dt.toLocaleDateString("ru-RU",{day:"2-digit",month:"2-digit",year:"numeric"})+" "+dt.toLocaleTimeString("ru-RU",{hour:"2-digit",minute:"2-digit"}); };
export const fmtShort = (d) => { if(!d) return "—"; return new Date(d).toLocaleDateString("ru-RU",{day:"2-digit",month:"2-digit",year:"numeric"}); };
export const fmtTime = (d) => { if(!d) return "—"; return new Date(d).toLocaleTimeString("ru-RU",{hour:"2-digit",minute:"2-digit"}); };
export const daysBetween = (a,b) => Math.round((new Date(b)-new Date(a))/(1000*60*60*24));
export const relTime = (d) => { const diff=Date.now()-new Date(d).getTime(); const m=Math.floor(diff/60000); if(m<1)return "только что"; if(m<60)return `${m} мин назад`; const h=Math.floor(m/60); if(h<24)return `${h}ч назад`; return fmtShort(d); };

export const INIT_USERS = [
  { id:1, name:"Иванов Иван Иванович", email:"admin@factory.ru", password:hashPassword("admin123"), roleId:1, status:"active", createdAt:"2024-01-15T10:00:00" },
  { id:2, name:"Петрова Мария Сергеевна", email:"manager@factory.ru", password:hashPassword("manager123"), roleId:2, status:"active", createdAt:"2024-02-20T09:00:00" },
  { id:3, name:"Сидоров Алексей Дмитриевич", email:"worker@factory.ru", password:hashPassword("worker123"), roleId:3, status:"active", createdAt:"2024-03-10T08:00:00" },
  { id:4, name:"Козлова Анна Петровна", email:"worker2@factory.ru", password:hashPassword("worker123"), roleId:3, status:"active", createdAt:"2024-03-15T08:00:00" },
  { id:5, name:"Морозов Дмитрий Олегович", email:"worker3@factory.ru", password:hashPassword("worker123"), roleId:3, status:"active", createdAt:"2024-04-01T08:00:00" },
  { id:6, name:"Усманов Рустам Ахмедович", email:"owner@factory.ru",  password:hashPassword("owner123"),  roleId:4, status:"active", createdAt:"2024-01-01T08:00:00" },
];

export const INIT_PRODUCTS = [
  { id:1, name:"Пельмени Домашние", category:"Пельмени", description:"Классические с говядиной и бараниной", costPrice:280, sellPrice:450, stock:150, unit:"кг", status:"готов", createdAt:"2024-01-20T10:00:00", updatedAt:"2024-06-01T12:00:00", deleted:false, techCard:["Подготовить тесто пельменное (замес 20 мин)","Подготовить фарш: говядина + баранина + лук + специи","Раскатать тесто, нарезать кружки","Лепка пельменей (ручная или автомат)","Заморозка при -18°C (2 часа)","Упаковка и маркировка"] },
  { id:2, name:"Котлеты По-киевски", category:"Котлеты", description:"Куриные котлеты с маслом", costPrice:320, sellPrice:520, stock:80, unit:"шт", status:"в производстве", createdAt:"2024-02-15T09:00:00", updatedAt:"2024-06-02T14:00:00", deleted:false, techCard:["Отбить куриное филе","Завернуть сливочное масло в филе","Панировка: мука → яйцо → сухари","Обжарка 3 мин с каждой стороны","Доготовка в духовке 15 мин при 180°C","Охлаждение и упаковка"] },
  { id:3, name:"Вареники с картошкой", category:"Вареники", description:"С картофелем и жареным луком", costPrice:200, sellPrice:350, stock:200, unit:"кг", status:"готов", createdAt:"2024-03-01T11:00:00", updatedAt:"2024-06-03T10:00:00", deleted:false, techCard:["Приготовить тесто","Сварить и размять картофель","Обжарить лук, добавить в начинку","Раскатать тесто, вырезать кружки","Лепка вареников","Заморозка и упаковка"] },
  { id:4, name:"Блинчики с мясом", category:"Блинчики", description:"Тонкие блинчики с мясной начинкой", costPrice:250, sellPrice:400, stock:60, unit:"шт", status:"готов", createdAt:"2024-03-15T08:00:00", updatedAt:"2024-06-04T09:00:00", deleted:false, techCard:["Приготовить блинное тесто","Выпечка блинов на сковороде","Приготовить мясную начинку","Завернуть начинку в блины","Обжарка блинчиков","Охлаждение и упаковка"] },
  { id:5, name:"Манты Узбекские", category:"Манты", description:"Традиционные с бараниной", costPrice:350, sellPrice:550, stock:40, unit:"шт", status:"в производстве", createdAt:"2024-04-01T10:00:00", updatedAt:"2024-06-05T11:00:00", deleted:false, techCard:["Подготовить тесто (тонкое раскатывание)","Нарезать баранину и лук кубиками","Добавить специи и курдючный жир","Лепка мантов (классическая форма)","Варка на пару 45 мин","Охлаждение и упаковка"] },
];

export const INIT_RAW_MATERIALS = [
  { id:1, name:"Говядина", category:"Мясо", unit:"кг", stock:500, minStock:100, costPerUnit:650, updatedAt:"2024-06-01T10:00:00" },
  { id:2, name:"Телятина", category:"Мясо", unit:"кг", stock:400, minStock:80, costPerUnit:550, updatedAt:"2024-06-01T10:00:00" },
  { id:3, name:"Курица (филе)", category:"Мясо", unit:"кг", stock:300, minStock:60, costPerUnit:380, updatedAt:"2024-06-01T10:00:00" },
  { id:4, name:"Баранина", category:"Мясо", unit:"кг", stock:150, minStock:50, costPerUnit:800, updatedAt:"2024-06-01T10:00:00" },
  { id:5, name:"Тесто пельменное", category:"Тесто", unit:"кг", stock:600, minStock:150, costPerUnit:120, updatedAt:"2024-06-01T10:00:00" },
  { id:6, name:"Тесто блинное", category:"Тесто", unit:"кг", stock:200, minStock:50, costPerUnit:90, updatedAt:"2024-06-01T10:00:00" },
  { id:7, name:"Картофель", category:"Овощи", unit:"кг", stock:800, minStock:200, costPerUnit:45, updatedAt:"2024-06-01T10:00:00" },
  { id:8, name:"Лук репчатый", category:"Овощи", unit:"кг", stock:300, minStock:80, costPerUnit:35, updatedAt:"2024-06-01T10:00:00" },
  { id:9, name:"Масло сливочное", category:"Масло", unit:"кг", stock:100, minStock:30, costPerUnit:900, updatedAt:"2024-06-01T10:00:00" },
  { id:10, name:"Специи (микс)", category:"Специи", unit:"кг", stock:50, minStock:10, costPerUnit:1200, updatedAt:"2024-06-01T10:00:00" },
  { id:11, name:"Соль", category:"Специи", unit:"кг", stock:100, minStock:20, costPerUnit:30, updatedAt:"2024-06-01T10:00:00" },
];

export const INIT_RECIPES = [
  { id:1, productId:1, items:[{rawId:1,qty:0.3,unit:"кг"},{rawId:2,qty:0.3,unit:"кг"},{rawId:5,qty:0.4,unit:"кг"},{rawId:8,qty:0.05,unit:"кг"},{rawId:10,qty:0.01,unit:"кг"},{rawId:11,qty:0.02,unit:"кг"}], createdAt:"2024-01-20T10:00:00", updatedAt:"2024-01-20T10:00:00" },
  { id:2, productId:2, items:[{rawId:3,qty:0.15,unit:"кг"},{rawId:9,qty:0.03,unit:"кг"},{rawId:10,qty:0.005,unit:"кг"},{rawId:11,qty:0.01,unit:"кг"}], createdAt:"2024-02-15T09:00:00", updatedAt:"2024-02-15T09:00:00" },
  { id:3, productId:3, items:[{rawId:5,qty:0.4,unit:"кг"},{rawId:7,qty:0.5,unit:"кг"},{rawId:8,qty:0.08,unit:"кг"},{rawId:9,qty:0.02,unit:"кг"},{rawId:11,qty:0.01,unit:"кг"}], createdAt:"2024-03-01T11:00:00", updatedAt:"2024-03-01T11:00:00" },
  { id:4, productId:4, items:[{rawId:1,qty:0.1,unit:"кг"},{rawId:2,qty:0.1,unit:"кг"},{rawId:6,qty:0.2,unit:"кг"},{rawId:8,qty:0.03,unit:"кг"},{rawId:10,qty:0.005,unit:"кг"}], createdAt:"2024-03-15T08:00:00", updatedAt:"2024-03-15T08:00:00" },
  { id:5, productId:5, items:[{rawId:4,qty:0.25,unit:"кг"},{rawId:5,qty:0.35,unit:"кг"},{rawId:8,qty:0.1,unit:"кг"},{rawId:10,qty:0.015,unit:"кг"},{rawId:11,qty:0.02,unit:"кг"}], createdAt:"2024-04-01T10:00:00", updatedAt:"2024-04-01T10:00:00" },
];

export const INIT_TASKS = [
  { id:1, productId:1, userIds:[3], quantity:50, status:"завершено", createdAt:"2024-06-01T08:00:00", deadline:"2024-06-01T18:00:00", completedAt:"2024-06-01T16:30:00", note:"Утренняя партия" },
  { id:2, productId:2, userIds:[4], quantity:100, status:"завершено", createdAt:"2024-06-01T08:00:00", deadline:"2024-06-01T18:00:00", completedAt:"2024-06-01T17:00:00", note:"" },
  { id:3, productId:3, userIds:[5], quantity:75, status:"завершено", createdAt:"2024-06-02T08:00:00", deadline:"2024-06-02T18:00:00", completedAt:"2024-06-02T15:00:00", note:"" },
  { id:4, productId:1, userIds:[3,4], quantity:60, status:"завершено", createdAt:"2024-06-03T08:00:00", deadline:"2024-06-03T18:00:00", completedAt:"2024-06-03T19:30:00", note:"Просрочено на 1.5ч" },
  { id:5, productId:4, userIds:[4,5], quantity:120, status:"завершено", createdAt:"2024-06-04T08:00:00", deadline:"2024-06-05T18:00:00", completedAt:"2024-06-04T17:00:00", note:"" },
  { id:6, productId:5, userIds:[3,4,5], quantity:40, status:"завершено", createdAt:"2024-06-05T08:00:00", deadline:"2024-06-05T18:00:00", completedAt:"2024-06-05T16:00:00", note:"" },
  { id:7, productId:1, userIds:[3,5], quantity:80, status:"в работе", createdAt:"2024-06-10T08:00:00", deadline:"2024-06-10T20:00:00", completedAt:null, note:"Крупная партия" },
  { id:8, productId:2, userIds:[4], quantity:60, status:"назначено", createdAt:"2024-06-12T08:00:00", deadline:"2024-06-13T18:00:00", completedAt:null, note:"" },
  { id:9, productId:3, userIds:[3,5], quantity:90, status:"назначено", createdAt:"2024-06-12T08:00:00", deadline:"2024-06-14T18:00:00", completedAt:null, note:"" },
];

export const INIT_TASK_EMPLOYEES = [
  { id:1, taskId:1, employeeId:3, producedQty:50, status:"завершено", createdAt:"2024-06-01T08:00:00" },
  { id:2, taskId:2, employeeId:4, producedQty:100, status:"завершено", createdAt:"2024-06-01T08:00:00" },
  { id:3, taskId:3, employeeId:5, producedQty:75, status:"завершено", createdAt:"2024-06-02T08:00:00" },
  { id:4, taskId:4, employeeId:3, producedQty:35, status:"завершено", createdAt:"2024-06-03T08:00:00" },
  { id:5, taskId:4, employeeId:4, producedQty:25, status:"завершено", createdAt:"2024-06-03T08:00:00" },
  { id:6, taskId:5, employeeId:4, producedQty:70, status:"завершено", createdAt:"2024-06-04T08:00:00" },
  { id:7, taskId:5, employeeId:5, producedQty:50, status:"завершено", createdAt:"2024-06-04T08:00:00" },
  { id:8, taskId:6, employeeId:3, producedQty:15, status:"завершено", createdAt:"2024-06-05T08:00:00" },
  { id:9, taskId:6, employeeId:4, producedQty:15, status:"завершено", createdAt:"2024-06-05T08:00:00" },
  { id:10, taskId:6, employeeId:5, producedQty:10, status:"завершено", createdAt:"2024-06-05T08:00:00" },
  { id:11, taskId:7, employeeId:3, producedQty:0, status:"в работе", createdAt:"2024-06-10T08:00:00" },
  { id:12, taskId:7, employeeId:5, producedQty:0, status:"в работе", createdAt:"2024-06-10T08:00:00" },
  { id:13, taskId:8, employeeId:4, producedQty:0, status:"назначено", createdAt:"2024-06-12T08:00:00" },
  { id:14, taskId:9, employeeId:3, producedQty:0, status:"назначено", createdAt:"2024-06-12T08:00:00" },
  { id:15, taskId:9, employeeId:5, producedQty:0, status:"назначено", createdAt:"2024-06-12T08:00:00" },
];

export const INIT_EMPLOYEE_HISTORY = [
  { id:1, employeeId:3, date:"2024-06-01", attendance:"present", tasksCompleted:1, producedQty:50, workStart:"09:00", workEnd:"16:30", comment:"Пришёл вовремя" },
  { id:2, employeeId:4, date:"2024-06-01", attendance:"present", tasksCompleted:1, producedQty:100, workStart:"09:00", workEnd:"17:00", comment:"" },
  { id:3, employeeId:5, date:"2024-06-01", attendance:"present", tasksCompleted:0, producedQty:0, workStart:"09:02", workEnd:"18:00", comment:"Опоздание 2 мин" },
  { id:4, employeeId:3, date:"2024-06-02", attendance:"present", tasksCompleted:0, producedQty:0, workStart:"08:50", workEnd:"18:00", comment:"" },
  { id:5, employeeId:4, date:"2024-06-02", attendance:"present", tasksCompleted:0, producedQty:0, workStart:"09:00", workEnd:"18:00", comment:"" },
  { id:6, employeeId:5, date:"2024-06-02", attendance:"present", tasksCompleted:1, producedQty:75, workStart:"09:00", workEnd:"15:00", comment:"Отлично" },
  { id:7, employeeId:3, date:"2024-06-03", attendance:"present", tasksCompleted:1, producedQty:35, workStart:"08:45", workEnd:"19:30", comment:"Задание просрочено" },
  { id:8, employeeId:4, date:"2024-06-03", attendance:"present", tasksCompleted:1, producedQty:25, workStart:"09:00", workEnd:"19:30", comment:"" },
  { id:9, employeeId:5, date:"2024-06-03", attendance:"absent", tasksCompleted:0, producedQty:0, workStart:"", workEnd:"", comment:"Больничный" },
  { id:10, employeeId:4, date:"2024-06-04", attendance:"present", tasksCompleted:1, producedQty:70, workStart:"09:00", workEnd:"17:00", comment:"" },
  { id:11, employeeId:5, date:"2024-06-04", attendance:"present", tasksCompleted:1, producedQty:50, workStart:"09:00", workEnd:"17:00", comment:"" },
  { id:12, employeeId:3, date:"2024-06-05", attendance:"present", tasksCompleted:1, producedQty:15, workStart:"09:00", workEnd:"16:00", comment:"" },
  { id:13, employeeId:4, date:"2024-06-05", attendance:"present", tasksCompleted:1, producedQty:15, workStart:"09:00", workEnd:"16:00", comment:"" },
  { id:14, employeeId:5, date:"2024-06-05", attendance:"present", tasksCompleted:1, producedQty:10, workStart:"09:00", workEnd:"16:00", comment:"" },
];

export const INIT_PRODUCTION_PLANS = [
  { id:1, productId:1, plannedQty:200, completedQty:120, productionDate:"2024-06-10", employeeIds:[3,4], createdBy:1, createdAt:"2024-06-08T10:00:00", status:"в процессе" },
  { id:2, productId:2, plannedQty:150, completedQty:150, productionDate:"2024-06-11", employeeIds:[4,5], createdBy:2, createdAt:"2024-06-09T09:00:00", status:"выполнен" },
  { id:3, productId:3, plannedQty:100, completedQty:0, productionDate:"2024-06-12", employeeIds:[3,5], createdBy:2, createdAt:"2024-06-10T08:00:00", status:"запланирован" },
  { id:4, productId:5, plannedQty:80, completedQty:40, productionDate:"2024-06-12", employeeIds:[3,4,5], createdBy:1, createdAt:"2024-06-10T08:30:00", status:"в процессе" },
  { id:5, productId:1, plannedQty:300, completedQty:0, productionDate:"2024-06-15", employeeIds:[3,4], createdBy:2, createdAt:"2024-06-12T09:00:00", status:"запланирован" },
  { id:6, productId:4, plannedQty:200, completedQty:0, productionDate:"2024-06-16", employeeIds:[4,5], createdBy:2, createdAt:"2024-06-12T09:30:00", status:"запланирован" },
];

export const INIT_CLIENTS = [
  { id:1, name:'Магазин "Халяль"', contact:"Ахмед Магомедов", phone:"+7(928)100-20-30", email:"halal@shop.ru", address:"ул. Ленина 15", comment:"Постоянный клиент", createdAt:"2024-02-01T10:00:00" },
  { id:2, name:'Кафе "Домашнее"', contact:"Марина Иванова", phone:"+7(928)200-30-40", email:"home@cafe.ru", address:"пр. Мира 42", comment:"Заказ каждую неделю", createdAt:"2024-03-10T09:00:00" },
  { id:3, name:'Супермаркет "Свежесть"', contact:"Олег Петров", phone:"+7(928)300-40-50", email:"fresh@market.ru", address:"ул. Победы 8", comment:"Крупные партии", createdAt:"2024-04-15T11:00:00" },
];

export const INIT_CLIENT_ORDERS = [
  { id:1, clientId:1, items:[{productId:1,qty:100},{productId:2,qty:50}], orderDate:"2024-06-01T10:00:00", status:"отгружен", total:67000, note:"", priority:"нормальный", statusChangedAt:"2024-06-02T14:00:00", shippedAt:"2024-06-02T14:00:00", shippedBy:2 },
  { id:2, clientId:2, items:[{productId:3,qty:50},{productId:4,qty:80}], orderDate:"2024-06-05T09:00:00", status:"отгружен", total:49500, note:"Срочный заказ", priority:"срочный", statusChangedAt:"2024-06-06T10:00:00", shippedAt:"2024-06-06T10:00:00", shippedBy:2 },
  { id:3, clientId:1, items:[{productId:1,qty:200},{productId:5,qty:40}], orderDate:"2024-06-10T10:00:00", status:"в производстве", total:112000, note:"", priority:"важный", statusChangedAt:"2024-06-10T11:00:00", shippedAt:null, shippedBy:null },
  { id:4, clientId:3, items:[{productId:1,qty:300},{productId:2,qty:100},{productId:3,qty:150}], orderDate:"2024-06-12T08:00:00", status:"новый", total:239500, note:"Большой заказ", priority:"нормальный", statusChangedAt:"2024-06-12T08:00:00", shippedAt:null, shippedBy:null },
];

export const INIT_SALES = [
  { id:1, productId:1, quantity:50, clientId:1, soldBy:2, createdAt:"2024-06-03T11:00:00" },
  { id:2, productId:2, quantity:30, clientId:null, soldBy:2, createdAt:"2024-06-04T15:00:00" },
  { id:3, productId:3, quantity:20, clientId:2, soldBy:2, createdAt:"2024-06-06T12:00:00" },
];

export const INIT_INVENTORY_MOVEMENTS = [
  { id:1, productId:1, type:"production", quantity:50, balance:200, refId:"task-1", createdAt:"2024-06-01T16:30:00" },
  { id:2, productId:2, type:"production", quantity:100, balance:180, refId:"task-2", createdAt:"2024-06-01T17:00:00" },
  { id:3, productId:1, type:"order_shipment", quantity:-100, balance:100, refId:"order-1", createdAt:"2024-06-02T14:00:00" },
  { id:4, productId:1, type:"sale", quantity:-50, balance:50, refId:"sale-1", createdAt:"2024-06-03T11:00:00" },
  { id:5, productId:3, type:"order_shipment", quantity:-50, balance:150, refId:"order-2", createdAt:"2024-06-06T10:00:00" },
];

export const INIT_SUPPLIERS = [
  { id:1, name:"МясоТорг", contact:"+7(495)123-45-67", email:"info@myasotorg.ru" },
  { id:2, name:"ТестоПром", contact:"+7(495)234-56-78", email:"sales@testoprom.ru" },
  { id:3, name:"АгроФерма", contact:"+7(495)345-67-89", email:"zakaz@agro.ru" },
  { id:4, name:"СпецМикс", contact:"+7(495)456-78-90", email:"opt@specmix.ru" },
];

export const INIT_DELIVERIES = [
  { id:1, supplierId:1, rawId:1, quantity:200, pricePerUnit:630, totalPrice:126000, date:"2024-06-01T10:00:00", userId:2 },
  { id:2, supplierId:1, rawId:2, quantity:150, pricePerUnit:530, totalPrice:79500, date:"2024-06-01T10:00:00", userId:2 },
  { id:3, supplierId:2, rawId:5, quantity:300, pricePerUnit:110, totalPrice:33000, date:"2024-06-02T09:00:00", userId:2 },
  { id:4, supplierId:3, rawId:7, quantity:500, pricePerUnit:40, totalPrice:20000, date:"2024-06-03T11:00:00", userId:2 },
  { id:5, supplierId:3, rawId:8, quantity:200, pricePerUnit:30, totalPrice:6000, date:"2024-06-03T11:00:00", userId:2 },
  { id:6, supplierId:4, rawId:10, quantity:20, pricePerUnit:1100, totalPrice:22000, date:"2024-06-05T14:00:00", userId:2 },
  { id:7, supplierId:1, rawId:3, quantity:100, pricePerUnit:360, totalPrice:36000, date:"2024-06-07T10:00:00", userId:2 },
];

export const INIT_RAW_MOVEMENTS = [
  { id:1, rawId:1, type:"in", quantity:200, reason:"Поставка #1", date:"2024-06-01T10:00:00" },
  { id:2, rawId:2, type:"in", quantity:150, reason:"Поставка #2", date:"2024-06-01T10:00:00" },
  { id:3, rawId:1, type:"out", quantity:15, reason:"Задание #1: Пельмени 50кг", date:"2024-06-01T16:30:00" },
  { id:4, rawId:5, type:"in", quantity:300, reason:"Поставка #3", date:"2024-06-02T09:00:00" },
  { id:5, rawId:7, type:"in", quantity:500, reason:"Поставка #4", date:"2024-06-03T11:00:00" },
];

export const INIT_NOTIFICATIONS = [
  { id:1, title:"Система запущена", type:"информация", content:"Система управления производством успешно запущена.", createdBy:1, createdAt:"2024-06-01T08:00:00", readBy:[1], targetAll:true, targetUsers:[] },
  { id:2, title:"Низкий остаток: Специи (микс)", type:"предупреждение", content:"Остаток специй приближается к минимальному уровню. Текущий запас: 50 кг при минимуме 10 кг.", createdBy:0, createdAt:"2024-06-03T09:00:00", readBy:[], targetAll:true, targetUsers:[] },
  { id:3, title:"Задание #1 выполнено", type:"информация", content:"Сидоров А.Д. завершил задание: Пельмени Домашние x50 кг.", createdBy:0, createdAt:"2024-06-01T16:30:00", readBy:[1,2], targetAll:true, targetUsers:[] },
  { id:4, title:"Задание #4 просрочено", type:"ошибка", content:"Сидоров А.Д. просрочил задание #4: Пельмени Домашние x60 кг на 1.5 часа.", createdBy:0, createdAt:"2024-06-03T19:30:00", readBy:[1], targetAll:true, targetUsers:[] },
  { id:5, title:"Новая поставка от МясоТорг", type:"информация", content:"Получена поставка: Говядина 200 кг, Телятина 150 кг.", createdBy:0, createdAt:"2024-06-01T10:00:00", readBy:[1,2], targetAll:true, targetUsers:[] },
  { id:6, title:"Пропущена отметка присутствия", type:"предупреждение", content:"Козлова А.П. не отметилась на смене 2024-06-05.", createdBy:0, createdAt:"2024-06-05T10:00:00", readBy:[], targetAll:false, targetUsers:[1,2,4] },
  { id:7, title:"Обновление системы", type:"информация", content:"Добавлены модули: управление поставками, KPI сотрудников, рецептуры.", createdBy:1, createdAt:"2024-06-10T08:00:00", readBy:[1], targetAll:true, targetUsers:[] },
];

export const INIT_MARKS = [
  { id:1, employeeId:3, markType:"присутствие", relatedTaskId:null, createdBy:2, createdAt:"2024-06-01T07:55:00", comment:"Пришёл вовремя" },
  { id:2, employeeId:4, markType:"присутствие", relatedTaskId:null, createdBy:2, createdAt:"2024-06-01T07:58:00", comment:"" },
  { id:3, employeeId:5, markType:"присутствие", relatedTaskId:null, createdBy:2, createdAt:"2024-06-01T08:02:00", comment:"Опоздание 2 мин" },
  { id:4, employeeId:3, markType:"выполненный заказ", relatedTaskId:1, createdBy:2, createdAt:"2024-06-01T16:30:00", comment:"Выполнено качественно" },
  { id:5, employeeId:4, markType:"выполненный заказ", relatedTaskId:2, createdBy:2, createdAt:"2024-06-01T17:00:00", comment:"" },
  { id:6, employeeId:3, markType:"присутствие", relatedTaskId:null, createdBy:2, createdAt:"2024-06-02T07:50:00", comment:"" },
  { id:7, employeeId:4, markType:"присутствие", relatedTaskId:null, createdBy:2, createdAt:"2024-06-02T08:00:00", comment:"" },
  { id:8, employeeId:5, markType:"выполненный заказ", relatedTaskId:3, createdBy:2, createdAt:"2024-06-02T15:00:00", comment:"Отлично" },
  { id:9, employeeId:3, markType:"присутствие", relatedTaskId:null, createdBy:2, createdAt:"2024-06-03T07:45:00", comment:"" },
  { id:10, employeeId:3, markType:"выполненный заказ", relatedTaskId:4, createdBy:1, createdAt:"2024-06-03T19:30:00", comment:"Задание просрочено на 1.5ч" },
];

export const INIT_PRODUCTION_OUTPUTS = [];
export const INIT_DEBTS = [];

export const INIT_CAMERAS = [
  {id:1, name:"Цех — линия 1",      zone:"Цех",    type:"demo", url:"", enabled:true,  description:"Производственная линия №1", refreshSec:5},
  {id:2, name:"Склад готовой продукции", zone:"Склад",  type:"demo", url:"", enabled:true,  description:"Зона хранения",           refreshSec:5},
  {id:3, name:"Вход в здание",       zone:"Вход",   type:"demo", url:"", enabled:true,  description:"Главный вход",              refreshSec:5},
  {id:4, name:"Офис менеджера",      zone:"Офис",   type:"demo", url:"", enabled:true,  description:"Рабочее место менеджера",   refreshSec:5},
];

export const INIT_BONUS_RULES = [
  { id:1, fromQty:0,   bonusPercent:0,  label:"Стандарт"     },
  { id:2, fromQty:100, bonusPercent:5,  label:"Хорошо"       },
  { id:3, fromQty:250, bonusPercent:10, label:"Отлично"      },
  { id:4, fromQty:500, bonusPercent:15, label:"Топ результат"},
  { id:5, fromQty:800, bonusPercent:20, label:"Рекорд"       },
];

export const INIT_BASE_SALARIES = {};
