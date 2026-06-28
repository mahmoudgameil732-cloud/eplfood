import React, { useState } from "react";
import { 
  Info, 
  X, 
  Check, 
  Layers, 
  Scale, 
  Clock, 
  Share2, 
  Users, 
  Calendar, 
  Briefcase, 
  DollarSign, 
  Fingerprint, 
  UtensilsCrossed, 
  ChefHat, 
  BookOpen, 
  TrendingUp, 
  ClipboardList, 
  ChevronRight,
  Sparkles
} from "lucide-react";

export type DepartmentType =
  | "customer-portal"
  | "staff-waiter"
  | "staff-kitchen"
  | "owner-dashboard"
  | "owner-ingredients"
  | "owner-recipes"
  | "owner-bcg"
  | "owner-variance"
  | "owner-shifts"
  | "owner-aggregators"
  | "owner-attendance"
  | "owner-employees"
  | "owner-schedules"
  | "owner-leaves"
  | "owner-payroll"
  | "owner-devices";

interface GuideContent {
  title: string;
  subtitle: string;
  icon: any;
  overview: string;
  steps: string[];
  underTheHood: string[];
}

const guidesDataEn: Record<DepartmentType, GuideContent> = {
  "customer-portal": {
    title: "Guest Order Terminal (POS)",
    subtitle: "Dine-In, Takeaway, and Delivery customer-facing ordering center.",
    icon: UtensilsCrossed,
    overview: "The Guest Order Terminal serves as your primary multi-channel Point-of-Sale. It enables guests or table operators to customize dishes, view real-time calculations, select dining tables, and settle payments instantly. Every checkout streams revenue directly into the active cashier shift.",
    steps: [
      "Confirm active shift session in the bottom metadata bar.",
      "Select the fulfillment model (Dine-In, Takeaway, or Delivery) from the top panel.",
      "Assign a physical Table (Dine-In) or enter customer contact/shipping details (Delivery).",
      "Browse the menu categories on the left and tap items to add them to the cart.",
      "Configure required or optional modifiers (e.g. extra cheese, cooking temperature) in the popup modal.",
      "Tap 'Settle Order' to choose cash, card, loyalty points, or split payment modes.",
      "Record settlement to complete the transaction and review the physical-style thermal receipt."
    ],
    underTheHood: [
      "Calculates standard VAT and localized delivery surcharges on the client-side before submission.",
      "Automatically updates physical table occupancy statuses inside the live database.",
      "Directs receipt totals to the open shift ledger, tracking expected cash and card drawer balances."
    ]
  },
  "staff-waiter": {
    title: "Host / Floor Waiter Terminal",
    subtitle: "Real-time table mapping, course firing, and service controls.",
    icon: Users,
    overview: "Designed for waitstaff, this screen provides a dynamic map of all tables in the restaurant alongside order statuses, elapsed timers, and active cashier shift indicators. It is the hub for seating, modifying tickets, and routing cash operations.",
    steps: [
      "Check the interactive table circles colored by status: Empty (Green), Occupied (Orange), Dirty (Red), or Reserved (Blue).",
      "Tap any Empty table and select 'Start Table Order' to seat a customer and open the POS menu.",
      "Tap any Occupied table to review their ordered items, cooking status, and current subtotal.",
      "Click 'Fire Course' next to pending items to notify the Kitchen Chef that preparation should begin.",
      "Use 'Split Bill' to divide items between different seats or diners for separate payments.",
      "Record cashier safe drops or payouts (petty cash adjustments) directly from the drawer controls panel."
    ],
    underTheHood: [
      "Synchronizes active table and order state across all waiter tablets using a high-frequency polling broker.",
      "Ensures full audit protection by logging voided or canceled actions with security authorizations.",
      "Tracks elapsed service duration timers to flag table alerts for servers."
    ]
  },
  "staff-kitchen": {
    title: "Kitchen Display System (KDS)",
    subtitle: "Real-time ticket dispatcher and preparation tracking for line chefs.",
    icon: ChefHat,
    overview: "The Kitchen Display System replaces paper tickets by dispatching incoming food orders in real-time. Banners classify Dine-In, Takeaway, and Delivery orders, allowing chefs to organize cooking lines, track preparation timers, and communicate order readiness.",
    steps: [
      "Monitor incoming order tickets, sorted chronologically by elapsed waiting time.",
      "Review item names, portion sizes, and detailed customer modifier requests (e.g., 'Medium-Rare', 'No Onions').",
      "Click 'Mark Cooking' on a ticket when you start preparing the dish. This updates waitstaff dashboards.",
      "Click 'Mark Completed' when the dish is fully cooked and plated. This moves the ticket to 'Ready to Serve'.",
      "Hand over the hot plate to the runner, and clear the completed ticket from the chef queue."
    ],
    underTheHood: [
      "Maintains ticket age counters to visually flag delayed orders (turning yellow/red).",
      "Synchronizes preparation states with the centralized database so waitstaff see real-time updates.",
      "Enables high-throughput kitchen coordination with persistent local caching."
    ]
  },
  "owner-dashboard": {
    title: "SaaS Command Dashboard",
    subtitle: "Multi-tenant operational oversight, KPI charts, and AI advisors.",
    icon: Layers,
    overview: "The command cockpit for restaurant owners. Tracks real-time multi-tenant revenue streams, sales counts, product popularity, and includes automated Gemini AI marketing agents to boost profits.",
    steps: [
      "Analyze top KPI cards: Gross Revenue, Total Orders, Active Tables, and average ticket size.",
      "Review the Sales & Category breakdown charts to understand peak ordering patterns.",
      "Monitor the Popular Dishes list to optimize ingredient purchasing strategies.",
      "Scroll to the Gemini Menu Advisor to read AI-powered optimization strategies.",
      "Click 'Generate Marketing Content' to have Gemini create custom promotional social ads for low-volume items.",
      "Monitor your subscription tier and click 'Upgrade Tier' to unlock premium HR and variance modules."
    ],
    underTheHood: [
      "Queries Firestore aggregations to compute live financial indexes safely isolated by tenant ID.",
      "Interfaces server-side with Gemini-3.5 API keys to generate context-specific marketing text.",
      "Controls module access based on active multi-tenant plan configurations (Silver, Gold, Platinum, Enterprise)."
    ]
  },
  "owner-ingredients": {
    title: "Ingredients Master Inventory",
    subtitle: "Raw material setup, measure rules, and base cost control.",
    icon: ClipboardList,
    overview: "The foundation of menu costing. Here you register raw materials (e.g., Beef, Milk, Oil), define their default purchasing units, set supplier details, and manage purchase prices.",
    steps: [
      "Click the 'Add Raw Ingredient' button in the ingredients table.",
      "Input the ingredient name, category, and standard purchase unit (e.g., kg, liter, piece).",
      "Define the current purchase cost per unit (e.g., $10 per kg) to establish base costing.",
      "Set safety stock alert limits and select the preferred supplier from the database."
    ],
    underTheHood: [
      "Establishes strict database structures linking raw material costs directly to your menu catalog.",
      "Updating an ingredient purchase price automatically triggers re-calculations across all linked recipes in real-time."
    ]
  },
  "owner-recipes": {
    title: "Recipe & Theoretical Costing Engine",
    subtitle: "Portion yield setups, trimming factors, and gross profit tracking.",
    icon: Scale,
    overview: "Links physical menu items to raw ingredients. Calculates the exact food cost of every dish served to determine gross margins and suggest appropriate menu pricing.",
    steps: [
      "Select a menu dish from the active catalog listing (e.g., Cast Iron Ribeye Steak).",
      "Click 'Link Ingredient' to attach raw materials needed to prepare this dish.",
      "Enter the exact portion weight required per serving (e.g., 0.3 kg of Ribeye, 0.05 kg of Butter).",
      "Configure the trim yield percentage (e.g., 90% to account for fat/waste during prep).",
      "Evaluate the generated Theoretical Food Cost % and retail markup margin."
    ],
    underTheHood: [
      "Multiplies the portion cost by the raw material purchase price, dividing by the yield factor.",
      "Flags high-risk dishes whose cost ratios exceed the recommended target threshold of 35%."
    ]
  },
  "owner-bcg": {
    title: "Menu Engineering Matrix (BCG Matrix)",
    subtitle: "Mapping menu items by volume and profitability with Gemini AI optimization.",
    icon: TrendingUp,
    overview: "A strategic visual matrix plotting menu items across four quadrants based on their popularity (sales count) and profitability (profit margin) to guide menu optimization.",
    steps: [
      "Analyze the BCG Matrix scatter plot and identify the four quadrants:",
      "• Stars: High volume, high margin. Maintain quality and promote heavily.",
      "• Plowhorses: High volume, low margin. Raise prices or reduce portion costs.",
      "• Puzzles: Low volume, high margin. Rename, re-position, or offer promotions.",
      "• Dogs: Low volume, low margin. Archive or replace.",
      "Read the Gemini Menu Strategist's analysis for automatic menu engineering advice."
    ],
    underTheHood: [
      "Calculates median volume percentages and profitability margins to dynamically classify items.",
      "Leverages Gemini API to read the active BCG matrix classifications and draft targeted promotional campaigns."
    ]
  },
  "owner-variance": {
    title: "Stocktake & Variance Auditor",
    subtitle: "Physical audits vs. calculated sales usage metrics.",
    icon: ClipboardList,
    overview: "Audits differences between expected inventory (calculated from menu sales) and physical inventory counts to identify shrinkage, kitchen spoilage, or theft.",
    steps: [
      "Log kitchen waste events (e.g. expired milk, dropped steaks) to record regular spoilage.",
      "Initiate a physical stock count in your storeroom.",
      "Enter counted physical stock into the 'Actual Count' column for each ingredient.",
      "Review the calculated 'Variance' column indicating shortages or overages, with exact monetary values.",
      "Click 'Rollover Stock Cycle' to archive current data and set counted stock as the starting stock for the next period."
    ],
    underTheHood: [
      "Maintains expected stock based on: Starting Stock + Purchases - Theoretical Sales Usage - Recorded Waste.",
      "Theoretical Sales Usage is calculated in real-time by multiplying total menu sales by linked recipe ingredients."
    ]
  },
  "owner-shifts": {
    title: "Cashier Shifts & Drawer Audits",
    subtitle: "Drawer drops, payouts, expected safe balances, and cash audits.",
    icon: Clock,
    overview: "Audit cashier stations, safe drops, and payouts. Compares counted drawer totals with calculated revenue to flag and resolve discrepancies.",
    steps: [
      "Click 'Open New Shift Session', assign a cashier, and enter the starting drawer cash float.",
      "Record drawer inflows (Paid-In) or outflows (Paid-Out for supplier cash payments).",
      "Monitor cashier drops, which move excess cash from the drawer to the secure safe during a shift.",
      "At the end of a shift, direct the cashier to count drawer cash and click 'Close Shift'.",
      "Compare 'Expected Drawer Cash' against 'Counted Cash' to identify shortages or overages before sealing the shift."
    ],
    underTheHood: [
      "Computes Expected Cash: Start Float + Cash Sales + Paid-In - Paid-Out - Drops.",
      "Logs discrepancies with timestamped manager audits for accountability."
    ]
  },
  "owner-aggregators": {
    title: "Food Delivery Aggregator Bridge",
    subtitle: "Talabat & Careem menu syncing, order webhooks, and retry logs.",
    icon: Share2,
    overview: "Integrates third-party delivery platforms. Manages menu synchronization, webhooks, and retry queues to streamline delivery channels.",
    steps: [
      "Toggle aggregator active states and input authentication credentials in the settings panel.",
      "Click 'Sync Local Menu Configuration' to push active dishes and prices to third-party delivery channels.",
      "Monitor incoming orders in the webhook logs panel.",
      "Use the simulation widget to send a test order webhook (e.g. Talabat order) to verify ticket flow.",
      "Click 'Retry Delivery Log' on any failed incoming orders to re-process payloads."
    ],
    underTheHood: [
      "Transforms third-party payload structures into the standard local restaurant format in real-time.",
      "Saves API audit trails to debug webhook delivery issues."
    ]
  },
  "owner-attendance": {
    title: "Live Attendance Monitor",
    subtitle: "Shift start statuses, lateness logs, and manual punch overrides.",
    icon: Clock,
    overview: "Real-time monitoring of scheduled staff, showing check-in statuses, clock-in/out times, and managers' manual corrections.",
    steps: [
      "Monitor the live feed of clocked-in employees, including their location and roles.",
      "Locate yellow 'Late' tags indicating staff who checked in after their scheduled shift start.",
      "Click 'Manual Attendance Entry' to record retroactive clock-ins/outs for employees who forgot to punch cards.",
      "Audit clocking records and corrections to ensure payroll calculations remain accurate."
    ],
    underTheHood: [
      "Compares real-time biometric terminal logs with the Weekly Shift Planner to determine lateness timers.",
      "Stores manual manager adjustments in audit sheets to secure wage records."
    ]
  },
  "owner-employees": {
    title: "Employee Master Register",
    subtitle: "Personnel profiles, contract base salaries, allowances, and deductions.",
    icon: Users,
    overview: "Manage staff cards, contact numbers, active job roles, and detailed compensation packages.",
    steps: [
      "Click the 'Add New Employee' button.",
      "Input employee contact details and assign system roles (Waiter, Chef, Manager, Cashier).",
      "Specify their base salary (monthly contract or hourly rate) and pay cycle.",
      "Configure custom monthly allowances (Housing, Transport) and statutory deductions (Insurance, Social Security)."
    ],
    underTheHood: [
      "Isolates staff registers securely within the active tenant's organization ID.",
      "Feeds employee data directly into the Weekly Planner and Payroll Engine."
    ]
  },
  "owner-schedules": {
    title: "Weekly Shift Planner",
    subtitle: "Visual calendar scheduling, hour control, and labor allocation.",
    icon: Calendar,
    overview: "Enables managers to plan weekly schedules and assign staff slots, ensuring complete restaurant floor coverage.",
    steps: [
      "View the weekly calendar grid listing employees horizontally.",
      "Click 'Create Schedule Entry' to assign a work slot to an employee.",
      "Select the date, start time, and end time for the shift.",
      "Review total weekly hours per employee to prevent fatigue or overtime costs.",
      "Publish schedule updates to notify the team."
    ],
    underTheHood: [
      "Performs real-time validation checks to prevent overlapping schedule slots.",
      "Blocks scheduling attempts for employees on approved leaves."
    ]
  },
  "owner-leaves": {
    title: "Leaves & Vacation Center",
    subtitle: "Vacation tracking, leave quotas, and approvals.",
    icon: Briefcase,
    overview: "Centralized leave request center. Tracks remaining leave balances and manages requests for vacation or sick days.",
    steps: [
      "Monitor the pending leave requests list.",
      "Check the applicant's remaining leave balance against their annual entitlement (default 21 days).",
      "Click 'Approve Request' to approve vacation days and automatically block schedule overlaps.",
      "Click 'Reject Request' and provide an explanatory reason for the employee."
    ],
    underTheHood: [
      "Dynamically recalculates leave balances upon approval.",
      "Integrates with the Weekly Planner to ensure employees on leave cannot be scheduled for shifts."
    ]
  },
  "owner-payroll": {
    title: "HR Payroll Engine",
    subtitle: "Pay-stub calculations, lateness deductions, and disbursement records.",
    icon: DollarSign,
    overview: "Calculates net employee salaries by combining base pay, allowances, scheduled hours, unexcused absences, late penalties, and tax deductions.",
    steps: [
      "Select the payroll month (e.g. June 2026) to process.",
      "Click 'Calculate Payroll Run' to process attendance timing data, allowances, and penalties.",
      "Review generated salary sheets to confirm accurate calculations.",
      "Click 'Approve Payroll' to freeze calculations.",
      "Disburse salaries and click 'Mark All Paid' to record bank transfers and close the period."
    ],
    underTheHood: [
      "Applies exact mathematical formulas: Base Pay + Allowances - Absences Deductions - Lateness Penalties - Statutory Taxes.",
      "Locks finalized records in firestore databases to prevent editing."
    ]
  },
  "owner-devices": {
    title: "Biometric IoT Terminals",
    subtitle: "IoT device emulations, finger/face scanning simulation, and clock-in logs.",
    icon: Fingerprint,
    overview: "Integrates cloud-connected physical biometric scanners (fingerprint/face scanners) with your SaaS suite to automate clocking logs.",
    steps: [
      "Click 'Register Biometric Terminal' and enter its local name, IP address, and location.",
      "Ensure the device shows 'Online' with a green status indicator.",
      "Select an employee and click 'Simulate Scan' to generate a virtual finger punch.",
      "Click 'Sync Device Records' to pull punch logs and update attendance logs instantly."
    ],
    underTheHood: [
      "Emulates polling IoT terminal APIs to fetch raw punch logs.",
      "Matches device logs with employee ID profiles to update the database."
    ]
  }
};

const guidesDataAr: Record<DepartmentType, GuideContent> = {
  "customer-portal": {
    title: "محطة طلبات الضيوف (POS)",
    subtitle: "مركز تلقي طلبات تناول الطعام في الصالة، السفري، والتوصيل الموجه للعملاء.",
    icon: UtensilsCrossed,
    overview: "تعمل محطة طلبات الضيوف بنظام نقاط البيع متعدد القنوات. تتيح للعملاء أو مشغلي الطاولات تخصيص الأطباق، ومراجعة الفواتير المحدثة، وتحديد الطاولات، وتسوية المدفوعات فوراً. تتدفق إيرادات كل عملية دفع مباشرة إلى الوردية النشطة لتتبعها بأمان.",
    steps: [
      "تأكد من وجود وردية نشطة في شريط الحالة السفلي للبرنامج.",
      "اختر طريقة استلام الطلب (داخل الصالة، سفري، أو توصيل) من اللوحة العلوية.",
      "اختر طاولة محددة (للطلبات داخل الصالة) أو أدخل بيانات العميل والتوصيل (لطلبات التوصيل).",
      "تصفح أقسام القائمة في الجانب الأيمن وانقر على الأطباق لإضافتها للسلة.",
      "قم بتخصيص إضافات الطبق (مثل الجبن الإضافي، درجة الشواء) في النافذة المنبثقة.",
      "اضغط على زر 'دفع وتسوية الطلب' لتحديد طريقة الدفع (نقداً، بطاقة، نقاط ولاء، أو تقسيم الفاتورة).",
      "سجل عملية التسوية لإتمام الطلب وطباعة الإيصال الحراري المخصص."
    ],
    underTheHood: [
      "حساب ضريبة القيمة المضافة ورسوم التوصيل تلقائياً في واجهة العميل قبل الإرسال.",
      "تحديث حالة إشغال الطاولات تلقائياً في قاعدة البيانات الحية لمنع الأخطاء.",
      "إرسال إجمالي المبيعات إلى سجل الوردية المفتوحة ومقارنة المقبوضات المتوقعة مع النقدية الفعلية."
    ]
  },
  "staff-waiter": {
    title: "محطة نادل الخدمة / مضيف الصالة",
    subtitle: "خريطة تفاعلية للطاولات في الوقت الفعلي، وتوجيه وجبات الطعام، وعناصر التحكم بالصالة.",
    icon: Users,
    overview: "صممت هذه الشاشة خصيصاً لطاقم الخدمة لتقديم خريطة تفاعلية حية لجميع طاولات المطعم مدعومة بحالة الطلبات، ومؤقتات تتبع الخدمة، ومؤشرات الورديات. وتعد الشاشة المركزية للترحيب بالزبائن وتسكينهم وتعديل الفواتير وعمليات الصندوق.",
    steps: [
      "راقب الدوائر التفاعلية للطاولات الملونة حسب الحالة: فارغة (أخضر)، مشغولة (برتقالي)، بحاجة لتنظيف (أحمر)، أو محجوزة (أزرق).",
      "انقر على أي طاولة فارغة ثم اختر 'بدء طلب جديد' لتسكين الزبائن وفتح قائمة الطلبات.",
      "اضغط على أي طاولة مشغولة لمراجعة الأطباق المطلوبة وحالة الطهي والمجموع الفرعي الحالي.",
      "اضغط على زر 'إرسال للمطبخ' بجانب الوجبات المعلقة لإبلاغ الطاهي ببدء التحضير فوراً.",
      "استخدم ميزة 'تقسيم الفاتورة' لتوزيع الحساب على مقاعد أو عملاء مختلفين للدفع المنفصل.",
      "سجل عمليات سحب النقدية أو المصروفات النثرية مباشرة من لوحة التحكم بالصندوق المالي."
    ],
    underTheHood: [
      "مزامنة حالة الطاولات والطلبات النشطة عبر جميع أجهزة الخدمة باستخدام آلية تحديث فوري.",
      "توفير حماية كاملة لسجل العمليات عبر تسجيل أي طلبات ملغاة وتأكيدها بصلاحيات الإدارة.",
      "احتساب الوقت المنقضي لتقديم الخدمة لتنبيه طاقم الصالة حيال أي تأخير."
    ]
  },
  "staff-kitchen": {
    title: "شاشة عرض المطبخ (KDS)",
    subtitle: "موزع تذاكر الطلبات الفوري ومتابعة مراحل الطهي والتحضير للطهاة.",
    icon: ChefHat,
    overview: "تحل شاشة عرض المطبخ الرقمية محل الفواتير الورقية التقليدية حيث تعرض التذاكر الواردة فوراً. توضح البطاقات نوع الطلب (داخل المطعم، سفري، أو توصيل) لمساعدة الطهاة على تنظيم العمل، وتتبع أوقات التحضير، وتسهيل الإرسال.",
    steps: [
      "تابع تذاكر الطلبات الواردة المرتبة زمنياً بناءً على وقت الانتظار المنقضي.",
      "راجع تفاصيل الوجبات والكميات والملاحظات الخاصة التي طلبها الزبون بدقة (مثل: 'متوسط الاستواء' أو 'بدون بصل').",
      "انقر على زر 'بدء الطهي' على التذكرة عند بدء العمل على الطبق لإشعار طاقم الخدمة بالصالة.",
      "اضغط على 'اكتمل التحضير' بمجرد الانتهاء من طهي وتنسيق الوجبة لتنتقل إلى قائمة 'جاهز للتقديم'.",
      "سلم الأطباق الساخنة لموظف التوصيل الداخلي وامسح التذكرة المكتملة من قائمة شاشة المطبخ."
    ],
    underTheHood: [
      "تحديث مؤقتات فترات الانتظار لتلوين التذاكر المتأخرة باللون (الأصفر/الأحمر) للتنبيه.",
      "ربط وتحديث حالة التحضير بقاعدة البيانات الحية ليتابعها طاقم الصالة لحظة بلحظة.",
      "إتاحة تنسيق ومزامنة فورية بين طهاة الأقسام المختلفة مع تخزين مؤقت ومستمر لضمان عدم فقدان البيانات."
    ]
  },
  "owner-dashboard": {
    title: "لوحة تحكم المدير ومؤشرات الأداء",
    subtitle: "متابعة حية للعمليات متعددة الفروع، الرسوم البيانية، ومستشار الذكاء الاصطناعي (Gemini).",
    icon: Layers,
    overview: "لوحة القيادة والتحكم الشاملة لأصحاب ومدرّاء المطاعم. تمكنك من تتبع الإيرادات في الوقت الفعلي، وأعداد الطلبات، والوجبات الأكثر مبيعاً، وتتضمن مستشار ذكاء اصطناعي ذكي لزيادة هوامش الأرباح وتصميم الحملات.",
    steps: [
      "حلل مؤشرات الأداء الرئيسية: إجمالي الإيرادات، عدد الطلبات، الطاولات النشطة، ومتوسط قيمة الفاتورة.",
      "راجع مخططات توزيع المبيعات والأقسام لتحديد أوقات الذروة والمبيعات الأعلى.",
      "تابع قائمة الأطباق الأكثر مبيعاً لتحسين استراتيجيات شراء وتخزين المكونات.",
      "تصفح قسم مستشار قائمة الطعام الذكي (Gemini Menu Advisor) لقراءة تحليلات الذكاء الاصطناعي لتطوير الأداء.",
      "اضغط على 'إنشاء محتوى تسويقي' ليدعك نموذج Gemini تصمم إعلانات ترويجية مخصصة للأطباق منخفضة الطلب.",
      "راقب مستوى اشتراكك الحالي واضغط على 'ترقية الباقة' لفتح ميزات متطورة لإدارة الموارد البشرية وجرد المخزون."
    ],
    underTheHood: [
      "الاستعلام المباشر من قاعدة بيانات Firestore لحساب المؤشرات المالية لكل فرع ومنظمة بأمان وعزل تام.",
      "الاتصال المباشر من جهة الخادم بواجهة برمجة تطبيقات Gemini-3.5 لتقديم استشارات مخصصة بدقة عالية.",
      "تطبيق نظام تحكم مرن بالصلاحيات والميزات بناءً على باقة الاشتراك الحالية للمستخدم."
    ]
  },
  "owner-ingredients": {
    title: "الدليل الرئيسي للمكونات والمواد الخام",
    subtitle: "إعداد المواد الأولية، ووحدات القياس، وضبط تكاليف الشراء الأساسية.",
    icon: ClipboardList,
    overview: "اللبنة الأساسية لحساب تكاليف لوائح الطعام. هنا تقوم بتسجيل وتوصيف المواد الخام (مثل اللحوم، الحليب، الزيوت)، وتحديد وحدات قياس الشراء الافتراضية، وبيانات الموردين، وتكاليف الشراء بدقة.",
    steps: [
      "اضغط على زر 'إضافة مكون خام' في جدول المواد الخام.",
      "أدخل اسم المكون، التصنيف المناسب، ووحدة الشراء القياسية (كيلوغرام، لتر، قطعة).",
      "حدد تكلفة الشراء الحالية لكل وحدة قياس (مثلاً: 10 دولارات للكيلو) لتأسيس نظام التكاليف.",
      "عين حد الأمان للتنبيه بنقص المخزون وحدد المورد المفضل للمكون من القائمة."
    ],
    underTheHood: [
      "بناء بنية بيانات قوية تربط تكاليف المواد الخام مباشرة بجميع الوجبات المسجلة في القائمة.",
      "تعديل سعر شراء أي مكون خام يعيد تلقائياً حساب وتحديث تكاليف جميع الوصفات المرتبطة به في نفس اللحظة."
    ]
  },
  "owner-recipes": {
    title: "محرك حساب تكلفة الوصفات والربحية",
    subtitle: "تحديد كميات الحصص، ونسب الهدر، وتتبع هامش الربح الإجمالي للطبق.",
    icon: Scale,
    overview: "يربط بين أطباق القائمة والمكونات الخام المستخدمة في تحضيرها. يقوم بحساب التكلفة الفعلية الدقيقة لكل طبق لتحديد هوامش الربح واقتراح أسعار البيع الأنسب.",
    steps: [
      "اختر طبقاً من أطباق قائمة الطعام النشطة (مثل: شريحة لحم ريب آي).",
      "انقر على زر 'ربط المكونات' لإرفاق المواد الخام اللازمة لإعداد هذا الطبق بالتفصيل.",
      "أدخل الوزن أو الحجم الدقيق المطلوب لكل حصة (مثلاً: 0.3 كجم من لحم ريب آي، 0.05 كجم من الزبدة).",
      "اضبط نسبة الهدر أو التشذيب (مثلاً: 90% لحساب الفاقد والدهون المستبعدة أثناء التحضير).",
      "راجع نسبة تكلفة الغذاء المقدرة وهامش الربح المقترح لتعديل سعر البيع النهائي."
    ],
    underTheHood: [
      "احتساب تكلفة الحصة بضرب كميات المكونات بأسعار شرائها مع تصحيحها بناءً على معامل الهدر.",
      "إطلاق تنبيهات للأطباق التي تتجاوز نسبة تكلفة الغذاء فيها الحد المسموح به عالمياً وهو 35%."
    ]
  },
  "owner-bcg": {
    title: "مصفوفة هندسة قائمة الطعام (BCG Matrix)",
    subtitle: "تصنيف الأطباق حسب حجم المبيعات والربحية بدعم من تحليلات Gemini.",
    icon: TrendingUp,
    overview: "مصفوفة تحليلية مرئية ترسم أطباق المطعم ضمن أربعة أرباع رئيسية بناءً على شعبيتها (معدل المبيعات) وربحيتها (هامش الربح) لتوجيه قرارات التطوير والاستبعاد.",
    steps: [
      "حلل مخطط مصفوفة هندسة المنيو وتعرف على الأرباع الأربعة الرئيسية للوجبات:",
      "• النجوم (Stars): مبيعات عالية وأرباح عالية. حافظ على الجودة وسوق لها بقوة.",
      "• خيول العمل (Plowhorses): مبيعات عالية وأرباح منخفضة. ارفع سعر البيع أو قلل تكلفة المكونات.",
      "• الألغاز (Puzzles): مبيعات منخفضة وأرباح عالية. أعد تسميتها، حسن طريقة تقديمها أو اعرض عليها خصماً.",
      "• الكلاب (Dogs): مبيعات منخفضة وأرباح منخفضة. استبعدها أو استبدلها بوجبات جديدة.",
      "اقرأ التوصيات التلقائية المقدمة من مستشار قائمة الطعام الذكي (Gemini) لاتخاذ قرارات تسويقية وتصحيحية ذكية."
    ],
    underTheHood: [
      "حساب متوسط معدلات المبيعات ومتوسط هوامش الربح لتصنيف الأطباق ديناميكياً بدقة حسابية.",
      "الاستعانة بنموذج الذكاء الاصطناعي Gemini لقراءة بيانات المصفوفة وصياغة حملات ترويجية واقتراح أسعار أفضل."
    ]
  },
  "owner-variance": {
    title: "مدقق التباين وفروقات الجرد الفعلي",
    subtitle: "مقارنة مخزون المستودعات الفعلي مع الاستهلاك التقديري المبني على المبيعات.",
    icon: ClipboardList,
    overview: "يقوم بالتحقق من الاختلافات والفروق بين المخزون المتوقع (الذي يحتسبه النظام تلقائياً بناءً على مبيعات الأطباق) وبين المخزون الفعلي المجرود لتحديد نسب الهدر والسرقة والتلف.",
    steps: [
      "سجل عمليات الهدر والتالف اليومية في المطبخ (مثل: الحليب منتهي الصلاحية، اللحوم التالفة) لتوثيق الاستهلاك غير العادي.",
      "ابدأ عملية جرد فعلي كامل للمستودع ومخزن المطبخ.",
      "أدخل كميات الجرد الفعلي في عمود 'الكمية الفعلية' لكل مكون من المكونات.",
      "راجع عمود 'التباين الفعلي' الذي يوضح الفروق بالكمية والقيمة المالية الدقيقة.",
      "اضغط على زر 'ترحيل دورة المخزون' لأرشفة البيانات الحالية واعتماد الكميات الحالية كمخزون بداية للدورة القادمة."
    ],
    underTheHood: [
      "توقع المخزون بناءً على المعادلة: مخزون البداية + المشتريات - الاستهلاك التقديري للمبيعات - الهدر المسجل.",
      "يتم حساب الاستهلاك التقديري بضرب مبيعات الوجبات بالكميات المحددة في الوصفات المرتبطة بكل طبق."
    ]
  },
  "owner-shifts": {
    title: "إدارة الصندوق المالي والورديات",
    subtitle: "مراقبة المقبوضات والمدفوعات والمبالغ الموردة والتدقيق المالي الفوري للورديات.",
    icon: Clock,
    overview: "نظام التدقيق لورديات الكاشير وسحب الأموال والمدفوعات. يطابق المقبوضات الفعلية مع المبيعات المسجلة بالخزينة لبيان أي عجز أو زيادة وتأكيد مطابقة الصندوق.",
    steps: [
      "اضغط على 'فتح وردية جديدة'، وعين كاشير محدد، وأدخل رصيد عهدة البداية النقدي.",
      "سجل المقبوضات الإضافية (مبالغ واردة) أو المدفوعات النقدية (مبالغ صادرة لمدفوعات الموردين من الصندوق).",
      "راقب عمليات إيداع الإيرادات (drops) لنقل الفوائض النقدية من الصندوق إلى الخزنة الآمنة للمطعم أثناء الوردية.",
      "عند انتهاء الوردية، وجه الكاشير لجرد وعد النقدية الفعلي ثم اضغط على زر 'إغلاق الوردية'.",
      "قارن 'المبلغ المتوقع بالصندوق' مع 'المبلغ المجرود' لكشف أي عجز أو زيادة بدقة قبل اعتماد إغلاق الوردية نهائياً."
    ],
    underTheHood: [
      "حساب النقدية المتوقعة: عهدة البداية + المبيعات النقدية + المقبوضات الصادرة - المدفوعات النقدية - الإيداعات الموردة للشركة.",
      "تسجيل وإثبات أي فروقات صندوقية مع سجل تدقيق يضم التوقيت واسم المدير المسؤول لضمان الرقابة الكاملة."
    ]
  },
  "owner-aggregators": {
    title: "منصة الربط مع تطبيقات التوصيل",
    subtitle: "مزامنة لوائح الطعام مع تطبيقات طلبات وكريم، وإدارة واجهات الطلب الفورية وسجلات التكرار.",
    icon: Share2,
    overview: "يربط مطعمك بتطبيقات التوصيل الشهيرة (طلبات، كريم). يتيح تحديث ومزامنة قوائم الوجبات والأسعار، واستلام الطلبات فوراً، ومراجعة سجلات الربط والطلبات لتفادي ضياع المبيعات.",
    steps: [
      "قم بتفعيل منصة التوصيل المطلوبة وأدخل مفاتيح الربط وتأكيد الاتصال في لوحة الإعدادات.",
      "اضغط على 'مزامنة قائمة الطعام المحلية' لدفع الوجبات والأسعار الجديدة فوراً إلى تطبيق التوصيل.",
      "راقب الطلبات الواردة وسجل استدعاء البيانات في لوحة سجلات الويب هولك (Webhook Logs).",
      "استخدم محاكي الطلبات لإرسال طلب تجريبي (مثلاً: طلب محاكي من تطبيق طلبات) للتأكد من وصول الطلب بنجاح للشاشات.",
      "اضغط على زر 'إعادة محاولة معالجة الطلب' لإعادة معالجة أي طلب وارد واجه خطأ في الاتصال."
    ],
    underTheHood: [
      "تحويل تركيبة البيانات الواردة من واجهات التطبيقات الخارجية وتكييفها فورياً لتطابق بنية بيانات نظامك المحلي.",
      "الاحتفاظ بسجل كامل وتحليلي لكافة الطلبات الواردة لتمكين مهندسي النظام من تشخيص وحل مشاكل الاتصال."
    ]
  },
  "owner-attendance": {
    title: "شاشة مراقبة الحضور والانصراف الحية",
    subtitle: "حالة حضور الموظفين، تتبع التأخرات، وتسجيل التعديلات اليدوية من الإدارة.",
    icon: Clock,
    overview: "متابعة فورية للموظفين المجدولين للعمل في اليوم الحالي، تظهر أوقات تسجيل الدخول والخروج الفعلي، مع إمكانية تصحيح البيانات يدوياً من قبل الإدارة.",
    steps: [
      "راقب القائمة الحية للموظفين المسجلين حضوراً وتعرف على مواقعهم وأدوارهم النشطة.",
      "انتبه للعلامات الصفراء التي تشير إلى 'التأخر' لمن يسجلون الدخول بعد الموعد المحدد لورديتهم المجدولة.",
      "اضغط على زر 'تسجيل حضور يدوي' لتسجيل وتعديل أوقات الدخول والخروج يدوياً للموظفين الذين نسوا تمرير بطاقاتهم.",
      "راجع ودقق السجلات والتصحيحات لضمان دقة احتساب ساعات العمل في كشوف المرتبات الشهرية."
    ],
    underTheHood: [
      "مقارنة سجلات أجهزة البصمة الحيوية مع مخطط جدول العمل الأسبوعي لتحديد فترات التأخر بدقة.",
      "حفظ التعديلات اليدوية للمدراء في سجل تدقيق محمي لضمان الشفافية ومنع التلاعب بالمرتبات."
    ]
  },
  "owner-employees": {
    title: "السجل الرئيسي للموظفين والكوادر",
    subtitle: "الملفات الشخصية، عقود الرواتب الأساسية، البدلات والخصومات.",
    icon: Users,
    overview: "إدارة شاملة لبيانات الموظفين، تفاصيل عقودهم، المسميات الوظيفية، وصيغ حزم الرواتب الشهرية والتعويضات.",
    steps: [
      "اضغط على زر 'إضافة موظف جديد' لتسجيل موظف في المنشأة.",
      "أدخل البيانات الشخصية للموظف، وعين دوره الوظيفي في المطعم (نادل، طاهٍ، مدير، كاشير).",
      "أدخل الراتب الأساسي المتعاقد عليه وطريقة الدفع (شهري ثابت أو بالساعة).",
      "أضف البدلات الشهرية الثابتة (بدل سكن، بدل انتقال) والخصومات الرسمية المعتمدة (تأمينات اجتماعية، ضرائب)."
    ],
    underTheHood: [
      "تخزين وعزل سجلات الموظفين بالكامل بأمان تحت معرف المنشأة (Organization ID).",
      "توفير بيانات الموظفين لتغذية محرك التخطيط الأسبوعي ومحرك احتساب الرواتب تلقائياً."
    ]
  },
  "owner-schedules": {
    title: "مخطط وجدول الورديات الأسبوعي",
    subtitle: "جدولة الموظفين بصورة مرئية، وتوزيع ساعات العمل وضمان تغطية الصالة.",
    icon: Calendar,
    overview: "تتيح للمدراء تخطيط ساعات العمل الأسبوعية، وتعيين الأدوار والمواقع لضمان تغطية كافة أقسام المطعم على مدار الساعة دون زيادة تكاليف العمالة.",
    steps: [
      "راجع التقويم الأسبوعي المرئي الذي يعرض الموظفين والورديات بشكل أفقي منظم.",
      "انقر على زر 'إضافة فترة عمل' لتعيين وردية جديدة لأحد الموظفين.",
      "حدد اليوم، وساعة البدء، وساعة انتهاء الوردية المخصصة للموظف.",
      "تحقق من مجموع ساعات العمل الأسبوعية لكل موظف لتفادي الإرهاق أو تكاليف العمل الإضافي غير المبررة.",
      "اعتمد وانشر الجدول الأسبوعي لإشعار الموظفين بفترات عملهم الجديدة."
    ],
    underTheHood: [
      "التحقق المالي والتشغيلي المباشر لمنع تعارض وتداخل ورديات الموظف الواحد.",
      "حظر جدولة الموظفين في الأيام التي حصلوا فيها على إجازات رسمية أو مرضية معتمدة."
    ]
  },
  "owner-leaves": {
    title: "إدارة الإجازات والطلبات",
    subtitle: "متابعة رصيد الإجازات السنوي للموظفين، ومعالجة طلبات الغياب والاعتمادات.",
    icon: Briefcase,
    overview: "المركز الموحد لتلقي وإدارة طلبات الإجازات السنوية والمرضية، مع تحديث فوري للأرصدة المستحقة لكل موظف لتفادي نقص الكوادر أثناء العمل.",
    steps: [
      "راجع قائمة طلبات الإجازات الواردة من الموظفين بانتظار المراجعة.",
      "تحقق من رصيد إجازات الموظف المتبقي بمقارنته برصيده السنوي المعتمد (الافتراضي 21 يوماً).",
      "اضغط على زر 'اعتماد الطلب' للموافقة على الإجازة ومنع جدولة الموظف في مخطط العمل لتلك الفترة تلقائياً.",
      "اضغط على زر 'رفض الطلب' مع تدوين سبب الرفض لتوضيح القرار للموظف."
    ],
    underTheHood: [
      "تعديل واحتساب رصيد الإجازات المتبقي فور اعتماد الإجازات من قبل الإدارة.",
      "الربط التلقائي مع مخطط العمل الأسبوعي لحظر وتظليل فترات الإجازة للموظف لمنع تعيين ورديات له بالخطأ."
    ]
  },
  "owner-payroll": {
    title: "محرك احتساب الرواتب والمستحقات",
    subtitle: "احتساب الرواتب الصافية وتطبيق خصومات التأخر والغرامات وتسجيل الصرف.",
    icon: DollarSign,
    overview: "يقوم باحتساب صافي رواتب الموظفين بدقة من خلال الجمع بين الراتب الأساسي والبدلات، وساعات العمل الفعلية، وخصومات أيام الغياب، وغرامات التأخر، وضريبة التأمينات.",
    steps: [
      "اختر شهر الرواتب المطلوب معالجته (مثال: يونيو 2026).",
      "اضغط على زر 'تشغيل واحتساب الرواتب' لتحليل سجلات حضور الموظفين والبدلات والغرامات تلقائياً.",
      "راجع مسودة كشف الرواتب الناتجة للتأكد من خلوها من الأخطاء المالية.",
      "اضغط على زر 'اعتماد كشف الرواتب' لتجميد البيانات ومنع إجراء أي تعديلات عليها لاحقاً.",
      "قم بتحويل الرواتب للموظفين واضغط على 'تسجيل كمدفوع بالكامل' لتوثيق الصرف المالي وإغلاق الدورة المالية للشهر."
    ],
    underTheHood: [
      "تطبيق المعادلة الحسابية الصارمة: صافي الراتب = الراتب الأساسي + البدلات - خصومات الغياب - غرامات التأخير - الاستقطاعات والضرائب.",
      "قفل كشوف الرواتب المعتمدة في قاعدة بيانات Firestore لمنع التلاعب بالسجلات المالية وحفظها للتدقيق القانوني."
    ]
  },
  "owner-devices": {
    title: "أجهزة البصمة وإنترنت الأشياء (IoT)",
    subtitle: "إدارة أجهزة تسجيل الحضور، محاكاة قراءة البصمات، وسحب سجلات الدخول والخروج.",
    icon: Fingerprint,
    overview: "يربط مطعمك بأجهزة بصمة الحضور والانصراف الحيوية المتصلة بالإنترنت (سواءً بصمة اليد أو الوجه) لأتمتة سحب الحضور ومنع التحايل.",
    steps: [
      "اضغط على زر 'تسجيل جهاز بصمة جديد' وأدخل اسم الجهاز، وعنوان IP الخاص به، وموقعه الفعلي.",
      "تأكد من إشارة الجهاز بحالة 'متصل' باللون الأخضر.",
      "اختر موظفاً واضغط على 'محاكاة تمرير البصمة' لتوليد عملية دخول أو خروج افتراضية للتجربة.",
      "اضغط على 'سحب ومزامنة بيانات الجهاز' لجلب سجلات البصمة وتحديث كشوف حضور الموظفين فوراً."
    ],
    underTheHood: [
      "محاكاة قراءة سجلات الاستدعاء من خوادم أجهزة البصمة الخارجية وسحبها عبر الويب.",
      "مطابقة بصمة الموظف المسجلة مع قاعدة بيانات الموظفين لتحديث أوقات الحضور الفعلي فوراً وبدون تدخل بشري."
    ]
  }
};

const uiLabels = {
  en: {
    howToUse: "How to Use",
    viewGuide: "View Step-by-Step Interactive Guide",
    onboarding: "Interactive Onboarding:",
    stepsPracticed: (completed: number, total: number, percent: number) => `${completed} of ${total} steps practiced (${percent}%)`,
    overview: "Overview",
    stepsLabel: (completed: number, total: number) => `Interactive Steps (${completed}/${total})`,
    tech: "SaaS Under the Hood",
    howDoIUse: "How do I use this guide?",
    howDoIUseDesc: "Switch to the Interactive Steps tab above. Read each operational milestone and physically perform them in the application interface, checking them off as you master each process!",
    checklistHeader: "Step-by-Step Training Checklist",
    stepPrefix: "STEP",
    underTheHoodHeader: "Multi-Tenant Architecture & Data Flow",
    securityActive: "Isolated Tenant Security active · Nile SaaS Core",
    resetProgress: "Reset Progress",
    gotIt: "Got It, Let's Try!",
    guideTag: "Guide"
  },
  ar: {
    howToUse: "دليل الاستخدام",
    viewGuide: "عرض الدليل التدريبي التفاعلي خطوة بخطوة",
    onboarding: "التدريب العملي التفاعلي:",
    stepsPracticed: (completed: number, total: number, percent: number) => `تم إنجاز ${completed} من أصل ${total} خطوة (${percent}%)`,
    overview: "نظرة عامة",
    stepsLabel: (completed: number, total: number) => `الخطوات التفاعلية (${completed}/${total})`,
    tech: "خبايا النظام والربط التقني",
    howDoIUse: "كيف أستعين بهذا الدليل؟",
    howDoIUseDesc: "انتقل لتبويب الخطوات التفاعلية الموضح بالأعلى. اقرأ كل خطوة تشغيلية بتمعن ثم جربها بنفسك مباشرة على شاشة التطبيق أمامك، وضع علامة صح عليها عند إتقانك لها!",
    checklistHeader: "قائمة فحص الأداء التشغيلي العملي",
    stepPrefix: "الخطوة",
    underTheHoodHeader: "البنية السحابية التحتية وجريان البيانات للشركات",
    securityActive: "تشفير وحماية البيانات النشطة · النواة نايل السحابية",
    resetProgress: "إعادة تصفير التقدم",
    gotIt: "حسناً، فهمت الطريقة!",
    guideTag: "دليل"
  }
};

interface DepartmentGuideProps {
  department: DepartmentType;
  buttonSize?: "xs" | "sm" | "md";
  buttonVariant?: "pill" | "icon" | "outline" | "solid";
}

export default function DepartmentGuide({ 
  department, 
  buttonSize = "sm", 
  buttonVariant = "outline" 
}: DepartmentGuideProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "steps" | "tech">("overview");
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});
  const [lang, setLang] = useState<"en" | "ar">("en");

  const guide = lang === "ar" ? guidesDataAr[department] : guidesDataEn[department];
  if (!guide) return null;

  const IconComponent = guide.icon;
  const labels = uiLabels[lang];

  const toggleStep = (stepIndex: number) => {
    setChecklist(prev => ({
      ...prev,
      [`${department}-${stepIndex}`]: !prev[`${department}-${stepIndex}`]
    }));
  };

  const getCompletedCount = () => {
    return guide.steps.filter((_, idx) => checklist[`${department}-${idx}`]).length;
  };

  const progressPercent = Math.round((getCompletedCount() / guide.steps.length) * 100);

  // Button classes
  let btnClasses = "inline-flex items-center gap-1.5 font-bold transition-all duration-200 cursor-pointer shadow-xxs rounded-xl font-sans ";
  if (buttonVariant === "pill") {
    btnClasses += "bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-full ";
  } else if (buttonVariant === "icon") {
    btnClasses = "p-1.5 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition-all cursor-pointer ";
  } else if (buttonVariant === "solid") {
    btnClasses += "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm ";
  } else {
    btnClasses += "bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 ";
  }

  // Size classes
  if (buttonVariant !== "icon") {
    if (buttonSize === "xs") {
      btnClasses += "px-2 py-1 text-[10px] ";
    } else if (buttonSize === "md") {
      btnClasses += "px-4 py-2 text-sm ";
    } else {
      btnClasses += "px-3 py-1.5 text-xs ";
    }
  }

  const textAlignmentClass = lang === "ar" ? "text-right" : "text-left";

  return (
    <div className="inline-block" id={`dept-guide-trigger-${department}`}>
      <button 
        onClick={() => setIsOpen(true)}
        className={btnClasses}
        title={labels.viewGuide}
      >
        <Info className={buttonVariant === "icon" ? "w-4 h-4" : "w-3.5 h-3.5 text-indigo-500"} />
        {buttonVariant !== "icon" && <span>{labels.howToUse}</span>}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-100 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          {/* Overlay background */}
          <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-xs transition-opacity" onClick={() => setIsOpen(false)}></div>

          {/* Modal Container */}
          <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-6">
            <div 
              className={`relative transform overflow-hidden rounded-2xl bg-white ${textAlignmentClass} shadow-2xl transition-all w-full max-w-2xl animate-scale-up`} 
              id={`dept-guide-modal-${department}`}
              dir={lang === "ar" ? "rtl" : "ltr"}
            >
              
              {/* Card Accent line */}
              <div className="h-1.5 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>

              {/* Header */}
              <div className="bg-slate-50/50 px-6 py-5 border-b border-slate-100 flex justify-between items-start gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100/50 shadow-xxs">
                    <IconComponent className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-black text-slate-900 tracking-tight leading-none" id="modal-title">
                        {guide.title}
                      </h3>
                      <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider">
                        <Sparkles className="w-2.5 h-2.5" /> {labels.guideTag}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1.5 leading-snug font-medium">
                      {guide.subtitle}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* Language Switcher */}
                  <div className="bg-slate-100 p-0.5 rounded-xl flex items-center border border-slate-200 shadow-xxs">
                    <button
                      onClick={() => setLang("en")}
                      className={`px-2 py-1 text-[9px] font-bold rounded-lg transition-all cursor-pointer ${
                        lang === "en"
                          ? "bg-white text-indigo-600 shadow-xxs"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      EN
                    </button>
                    <button
                      onClick={() => setLang("ar")}
                      className={`px-2 py-1 text-[9px] font-bold rounded-lg transition-all cursor-pointer ${
                        lang === "ar"
                          ? "bg-white text-indigo-600 shadow-xxs"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      عربي
                    </button>
                  </div>

                  <button 
                    onClick={() => setIsOpen(false)}
                    className="p-1.5 rounded-xl hover:bg-slate-200/60 text-slate-450 hover:text-slate-800 transition-colors cursor-pointer"
                  >
                    <X className="w-4.5 h-4.5" />
                  </button>
                </div>
              </div>

              {/* Progress Bar (Visible across all tabs to encourage interaction) */}
              <div className="px-6 py-3 bg-indigo-50/30 border-b border-indigo-100/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-extrabold text-indigo-850 uppercase tracking-wider">{labels.onboarding}</span>
                  <span className="text-[10px] font-bold text-slate-500">
                    {labels.stepsPracticed(getCompletedCount(), guide.steps.length, progressPercent)}
                  </span>
                </div>
                <div className="w-full sm:w-44 bg-slate-200 rounded-full h-1.5 overflow-hidden shadow-inner shrink-0">
                  <div 
                    className="bg-indigo-650 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  ></div>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="flex border-b border-slate-150 px-6 bg-white gap-4 overflow-x-auto scrollbar-none">
                {[
                  { id: "overview", label: labels.overview, icon: BookOpen },
                  { id: "steps", label: labels.stepsLabel(getCompletedCount(), guide.steps.length), icon: ClipboardList },
                  { id: "tech", label: labels.tech, icon: Layers }
                ].map((t) => {
                  const TabIcon = t.icon;
                  const isSelected = activeTab === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setActiveTab(t.id as any)}
                      className={`pb-3 pt-4 text-xs font-bold border-b-2 px-1 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                        isSelected
                          ? "border-indigo-650 text-indigo-650"
                          : "border-transparent text-slate-400 hover:text-slate-600"
                      }`}
                    >
                      <TabIcon className="w-3.5 h-3.5" />
                      <span>{t.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Content Panel */}
              <div className="px-6 py-6 max-h-[380px] overflow-y-auto bg-white">
                
                {activeTab === "overview" && (
                  <div className="space-y-4 animate-fade-in text-xs leading-relaxed text-slate-600">
                    <p className="font-semibold text-slate-700 text-sm">
                      {guide.overview}
                    </p>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-start gap-2.5">
                      <Info className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-slate-900 block mb-1">{labels.howDoIUse}</span>
                        {labels.howDoIUseDesc}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "steps" && (
                  <div className="space-y-4 animate-fade-in">
                    <p className="text-xxs uppercase font-extrabold tracking-wider text-slate-400">
                      {labels.checklistHeader}
                    </p>
                    <div className="space-y-3">
                      {guide.steps.map((step, index) => {
                        const isCompleted = !!checklist[`${department}-${index}`];
                        return (
                          <div 
                            key={index} 
                            onClick={() => toggleStep(index)}
                            className={`p-3 rounded-xl border transition-all flex items-start gap-3 cursor-pointer group ${
                              isCompleted 
                                ? "bg-emerald-50/50 border-emerald-150" 
                                : "bg-slate-50/40 hover:bg-slate-50 border-slate-150/70 hover:border-indigo-150"
                            }`}
                          >
                            {/* Check Circle Box */}
                            <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                              isCompleted 
                                ? "bg-emerald-500 border-emerald-500 text-white" 
                                : "bg-white border-slate-300 group-hover:border-indigo-400 text-transparent"
                            }`}>
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </div>

                            {/* Step Text */}
                            <div className="min-w-0 flex-1">
                              <span className={`text-xxs font-black block mb-0.5 ${isCompleted ? "text-emerald-800" : "text-slate-400"}`}>
                                {labels.stepPrefix} {index + 1}
                              </span>
                              <p className={`text-xs font-semibold leading-relaxed ${isCompleted ? "text-slate-550 line-through" : "text-slate-700"}`}>
                                {step}
                              </p>
                            </div>

                            <ChevronRight className={`w-4 h-4 text-slate-300 group-hover:text-slate-500 shrink-0 transition-transform ${isCompleted ? "rotate-90 text-emerald-550" : ""} ${lang === "ar" ? "rotate-180" : ""}`} />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {activeTab === "tech" && (
                  <div className="space-y-4 animate-fade-in text-xs leading-relaxed text-slate-600">
                    <p className="text-xxs uppercase font-extrabold tracking-wider text-slate-400">
                      {labels.underTheHoodHeader}
                    </p>
                    <div className="space-y-3">
                      {guide.underTheHood.map((techItem, index) => (
                        <div key={index} className="flex items-start gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                          <div className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs shrink-0 border border-indigo-100/55">
                            {index + 1}
                          </div>
                          <p className="font-semibold text-slate-700 pt-0.5">
                            {techItem}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>

              {/* Footer */}
              <div className="bg-slate-50/80 px-6 py-4 border-t border-slate-100 flex flex-col sm:flex-row sm:justify-between items-center gap-3">
                <span className="text-[10px] text-slate-450 font-bold">
                  {labels.securityActive}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      // Reset checklist
                      const updatedChecklist = { ...checklist };
                      guide.steps.forEach((_, idx) => {
                        delete updatedChecklist[`${department}-${idx}`];
                      });
                      setChecklist(updatedChecklist);
                    }}
                    className="px-3 py-1.5 text-xxs font-black text-slate-500 hover:text-slate-800 uppercase tracking-wider cursor-pointer whitespace-nowrap"
                  >
                    {labels.resetProgress}
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="px-4 py-2 bg-indigo-650 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-xxs whitespace-nowrap"
                  >
                    {labels.gotIt}
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
