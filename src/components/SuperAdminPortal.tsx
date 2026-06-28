import React, { useState, useEffect } from "react";
import { 
  Building2, 
  Users, 
  DollarSign, 
  ShieldAlert, 
  Plus, 
  Check, 
  X, 
  Power, 
  Unlock, 
  AlertTriangle, 
  Globe, 
  TrendingUp, 
  Receipt, 
  RefreshCw,
  Search,
  CheckCircle2,
  Trash2,
  Settings,
  Briefcase,
  Layers,
  ArrowUpRight,
  ChevronDown,
  Info,
  MapPin,
  Edit,
  Phone,
  Clock,
  Tv
} from "lucide-react";
import { Organization, FeatureKey, PlanKey, RevenueShareInvoice, FeatureRequest, PLANS } from "../types";

interface SuperAdminPortalProps {
  onLogout: () => void;
}

export default function SuperAdminPortal({ onLogout }: SuperAdminPortalProps) {
  const [activeTab, setActiveTab] = useState<"tenants" | "commissions" | "requests" | "white_label" | "analytics" | "outlets">("tenants");
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [invoices, setInvoices] = useState<RevenueShareInvoice[]>([]);
  const [requests, setRequests] = useState<FeatureRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Branches & Outlets state
  const [branches, setBranches] = useState<any[]>([]);
  const [showAddBranch, setShowAddBranch] = useState(false);
  const [editingBranch, setEditingBranch] = useState<any | null>(null);
  const [newBranch, setNewBranch] = useState({
    orgId: "org-default",
    name: "",
    nameAr: "",
    slug: "",
    phone: "",
    address: "",
    primaryColor: "#4f46e5",
    logo: "",
    estimatedWaitMinutes: 15,
    minOrderDelivery: 40,
    deliveryFeeBase: 10
  });

  const [addingRegisterToBranchId, setAddingRegisterToBranchId] = useState<string | null>(null);
  const [newRegister, setNewRegister] = useState({
    name: "",
    nameAr: ""
  });
  
  // Platform KPIs
  const [kpis, setKpis] = useState({
    activeRestaurantsCount: 0,
    totalPlatformSales: 0,
    commissionsThisMonth: 0,
    totalUnpaidCommissions: 0
  });

  // Create Tenant Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTenant, setNewTenant] = useState({
    name: "",
    legalName: "",
    ownerEmail: "",
    ownerPassword: "owner",
    ownerPhone: "",
    plan: "growth" as PlanKey,
    revenueSharePercent: 1.5,
    maxBranches: 3,
    logo: "",
    primaryColor: "#4f46e5"
  });

  // Feature Edit modal state
  const [selectedTenantForFeatures, setSelectedTenantForFeatures] = useState<Organization | null>(null);

  // Suspend modal state
  const [suspendingTenant, setSuspendingTenant] = useState<Organization | null>(null);
  const [suspendReason, setSuspendReason] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [notification, setNotification] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [createTenantError, setCreateTenantError] = useState<string | null>(null);

  const fetchPlatformData = async () => {
    setLoading(true);
    try {
      // 1. Get tenants
      const resOrgs = await fetch("/platform/organizations");
      if (resOrgs.ok) {
        const orgsData = await resOrgs.json();
        setOrganizations(orgsData);
      }

      // 2. Get invoices
      const resInvs = await fetch("/platform/revenue/invoices");
      if (resInvs.ok) {
        const invsData = await resInvs.json();
        setInvoices(invsData);
      }

      // 3. Get feature requests
      const resReqs = await fetch("/platform/feature-requests");
      if (resReqs.ok) {
        const reqsData = await resReqs.json();
        setRequests(reqsData);
      }

      // 4. Get overview KPIs
      const resOverview = await fetch("/platform/analytics/overview");
      if (resOverview.ok) {
        const overviewData = await resOverview.json();
        setKpis(overviewData);
      }

      // 5. Get all branches
      const resBranches = await fetch("/api/branches");
      if (resBranches.ok) {
        const branchesData = await resBranches.json();
        setBranches(branchesData);
      }
    } catch (err) {
      console.error("Failed to load platform data:", err);
      showNotification("فشل تحميل بيانات المنصة الأساسية", "error");
    } finally {
      setLoading(false);
    }
  };

  // --- Branches & Register CRUD for SuperAdmin ---
  const handleCreateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBranch.name.trim() || !newBranch.nameAr.trim()) {
      showNotification("يرجى إدخال الاسم بالإنجليزية والعربية للفرع الجديد", "error");
      return;
    }

    try {
      const res = await fetch("/api/branches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newBranch)
      });

      if (res.ok) {
        showNotification("تم إنشاء الفرع بنجاح وتعيينه للمطعم المحدد!", "success");
        setShowAddBranch(false);
        setNewBranch({
          orgId: "org-default",
          name: "",
          nameAr: "",
          slug: "",
          phone: "",
          address: "",
          primaryColor: "#4f46e5",
          logo: "",
          estimatedWaitMinutes: 15,
          minOrderDelivery: 40,
          deliveryFeeBase: 10
        });
        fetchPlatformData();
      } else {
        const errData = await res.json();
        showNotification(errData.error || "فشل إنشاء الفرع.", "error");
      }
    } catch (err) {
      showNotification("حدث خطأ أثناء الاتصال بالخادم لإنشاء الفرع.", "error");
    }
  };

  const handleUpdateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBranch) return;

    try {
      const res = await fetch(`/api/branches/${editingBranch.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingBranch)
      });

      if (res.ok) {
        showNotification("تم تحديث بيانات الفرع بنجاح!", "success");
        setEditingBranch(null);
        fetchPlatformData();
      } else {
        const errData = await res.json();
        showNotification(errData.error || "فشل تعديل بيانات الفرع.", "error");
      }
    } catch (err) {
      showNotification("حدث خطأ أثناء تعديل بيانات الفرع.", "error");
    }
  };

  const handleDeleteBranch = async (id: string) => {
    if (!confirm("هل أنت متأكد من رغبتك في حذف هذا الفرع نهائياً؟ ستتم إزالة كافة أجهزة الكاشير والبيانات المرتبطة به.")) return;

    try {
      const res = await fetch(`/api/branches/${id}`, {
        method: "DELETE"
      });

      if (res.ok) {
        showNotification("تم حذف الفرع بنجاح من المنصة.", "success");
        fetchPlatformData();
      } else {
        showNotification("فشل حذف الفرع.", "error");
      }
    } catch (err) {
      showNotification("حدث خطأ في الشبكة أثناء محاولة حذف الفرع.", "error");
    }
  };

  const handleAddRegister = async (branchId: string) => {
    if (!newRegister.name.trim() || !newRegister.nameAr.trim()) {
      alert("يرجى إدخال اسم جهاز الكاشير بالإنجليزية والعربية.");
      return;
    }

    try {
      const res = await fetch(`/api/branches/${branchId}/registers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newRegister)
      });

      if (res.ok) {
        setNewRegister({ name: "", nameAr: "" });
        setAddingRegisterToBranchId(null);
        showNotification("تمت إضافة جهاز كاشير جديد للفرع بنجاح!", "success");
        fetchPlatformData();
      } else {
        alert("فشل إضافة جهاز الكاشير.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteRegister = async (branchId: string, regId: string) => {
    if (!confirm("هل أنت متأكد من حذف جهاز الكاشير هذا؟")) return;

    try {
      const res = await fetch(`/api/branches/${branchId}/registers/${regId}`, {
        method: "DELETE"
      });

      if (res.ok) {
        showNotification("تم إقصاء جهاز الكاشير بنجاح.", "success");
        fetchPlatformData();
      } else {
        alert("فشل حذف جهاز الكاشير.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchPlatformData();
  }, []);

  const showNotification = (text: string, type: "success" | "error") => {
    setNotification({ text, type });
    setTimeout(() => setNotification(null), 5000);
  };

  // Create Tenant
  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateTenantError(null);
    try {
      const res = await fetch("/platform/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTenant)
      });
      if (res.ok) {
        showNotification("تم تسجيل المطعم الجديد بنجاح وعزل بيئة البيانات له", "success");
        setIsCreateModalOpen(false);
        setCreateTenantError(null);
        setNewTenant({
          name: "",
          legalName: "",
          ownerEmail: "",
          ownerPassword: "owner",
          ownerPhone: "",
          plan: "growth",
          revenueSharePercent: 1.5,
          maxBranches: 3,
          logo: "",
          primaryColor: "#4f46e5"
        });
        fetchPlatformData();
      } else {
        const err = await res.json();
        throw new Error(err.error || "خطأ غير معروف");
      }
    } catch (err: any) {
      setCreateTenantError(err.message);
      showNotification(`فشل إنشاء المطعم: ${err.message}`, "error");
    }
  };

  // Suspend Tenant
  const handleSuspendTenant = async () => {
    if (!suspendingTenant) return;
    try {
      const res = await fetch(`/platform/organizations/${suspendingTenant.id}/suspend`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: suspendReason || "متأخرات مالية مستحقة" })
      });
      if (res.ok) {
        showNotification(`تم إيقاف حساب مطعم "${suspendingTenant.name}" فوراً وحجب جميع الخدمات`, "success");
        setSuspendingTenant(null);
        setSuspendReason("");
        fetchPlatformData();
      }
    } catch (err) {
      showNotification("فشل إيقاف الحساب", "error");
    }
  };

  // Unsuspend Tenant
  const handleUnsuspendTenant = async (orgId: string, orgName: string) => {
    try {
      const res = await fetch(`/platform/organizations/${orgId}/unsuspend`, {
        method: "PATCH"
      });
      if (res.ok) {
        showNotification(`تم تنشيط حساب مطعم "${orgName}" وإتاحة الوصول مرة أخرى`, "success");
        fetchPlatformData();
      }
    } catch (err) {
      showNotification("فشل تنشيط الحساب", "error");
    }
  };

  // Toggle Tenant Custom Feature Flag
  const handleToggleFeature = async (orgId: string, featureKey: FeatureKey, currentStatus: boolean) => {
    try {
      const res = await fetch(`/platform/organizations/${orgId}/features`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ featureKey, enabled: !currentStatus })
      });
      if (res.ok) {
        showNotification("تم تحديث مفاتيح المزايا الخاصة بالمطعم بشكل فوري", "success");
        // Update local state
        setOrganizations(prev => prev.map(o => {
          if (o.id === orgId) {
            const updatedFeatures = [...o.customFeatures];
            const fIdx = updatedFeatures.findIndex(f => f.key === featureKey);
            if (fIdx !== -1) {
              updatedFeatures[fIdx].enabled = !currentStatus;
            } else {
              updatedFeatures.push({ key: featureKey, enabled: !currentStatus });
            }
            return { ...o, customFeatures: updatedFeatures };
          }
          return o;
        }));
      }
    } catch (err) {
      showNotification("فشل تحديث المزايا", "error");
    }
  };

  // Approve Feature Request
  const handleApproveRequest = async (reqId: string, orgName: string, featKey: string) => {
    try {
      const res = await fetch(`/platform/feature-requests/${reqId}/approve`, {
        method: "POST"
      });
      if (res.ok) {
        showNotification(`تمت الموافقة وتفعيل ميزة "${featKey}" وتطبيق الزيادة النسبية لمطعم ${orgName}`, "success");
        fetchPlatformData();
      }
    } catch (err) {
      showNotification("فشل تفعيل الميزة", "error");
    }
  };

  // Reject Feature Request
  const handleRejectRequest = async (reqId: string) => {
    try {
      const res = await fetch(`/platform/feature-requests/${reqId}/reject`, {
        method: "POST"
      });
      if (res.ok) {
        showNotification("تم رفض طلب تفعيل الميزة وإخطار مالك المطعم", "success");
        fetchPlatformData();
      }
    } catch (err) {
      showNotification("فشل رفض الطلب", "error");
    }
  };

  // Generate Invoices for Period
  const handleGenerateInvoices = async () => {
    const period = new Date().toISOString().substring(0, 7); // current month "YYYY-MM"
    try {
      const res = await fetch("/platform/revenue/invoices/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ period })
      });
      const data = await res.json();
      if (res.ok) {
        showNotification(data.message || "تم توليد فواتير الشهر الجاري بنجاح", "success");
        fetchPlatformData();
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      showNotification(`فشل توليد الفواتير: ${err.message || "لا توجد معاملات مستحقة حتى الآن"}`, "error");
    }
  };

  // Record Invoice Payment
  const handlePayInvoice = async (invoiceId: string, dueAmount: number) => {
    try {
      const res = await fetch(`/platform/revenue/invoices/${invoiceId}/mark-paid`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method: "bank_transfer", reference: `TRX-${Date.now()}` })
      });
      if (res.ok) {
        showNotification(`تم تسجيل دفعة بقيمة ${(dueAmount / 100).toFixed(2)} ج.م وتحديث الأرصدة المعلقة`, "success");
        fetchPlatformData();
      }
    } catch (err) {
      showNotification("فشل تسجيل عملية السداد", "error");
    }
  };

  // Reset tenant owner password
  const handleResetPassword = async (orgId: string, orgName: string) => {
    try {
      const res = await fetch(`/platform/organizations/${orgId}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: "owner" })
      });
      if (res.ok) {
        showNotification(`تمت إعادة تعيين كلمة مرور مطعم ${orgName} إلى الافتراضية "owner"`, "success");
      }
    } catch (err) {
      showNotification("فشل إعادة تعيين كلمة المرور", "error");
    }
  };

  const formatCurrency = (piasters: number) => {
    return `${(piasters / 100).toLocaleString("ar-EG", { minimumFractionDigits: 2 })} ج.م`;
  };

  const filteredTenants = organizations.filter(org => {
    const matchesSearch = org.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          org.ownerEmail.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || org.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Feature definition list for toggles
  const ALL_FEATURES: { key: FeatureKey; name: string; nameAr: string; desc: string }[] = [
    { key: "pos_basic", name: "Basic POS", nameAr: "نظام المبيعات الكاشير الأساسي", desc: "تشغيل شاشة الكاشير والطلبات" },
    { key: "kds", name: "Kitchen Display (KDS)", nameAr: "شاشة المطبخ الذكية (KDS)", desc: "عرض وتحديث الطلبات للطهاة" },
    { key: "menu_management", name: "Menu Engine", nameAr: "إدارة قائمة الأصناف والمعدلات", desc: "التحكم في الوجبات والتسعير" },
    { key: "basic_reports", name: "Basic Reporting", nameAr: "تقارير مبيعات أساسية", desc: "تحليل مبيعات بسيط يومي" },
    { key: "delivery_management", name: "Delivery Dispatcher", nameAr: "إدارة طلبات التوصيل والطيارين", desc: "تتبع وتوزيع طياري الديليفري" },
    { key: "guest_portal", name: "Guest Portal (Self-Ordering)", nameAr: "بوابة الويب الذاتية للزبائن (بلمسة)", desc: "طلب زبائن الطاولة وعرض القائمة بـ QR" },
    { key: "cost_control", name: "Cost Control & Audits", nameAr: "التحكم في التكاليف والتدقيق العشوائي", desc: "تحليل مخزون وربحية الأطباق" },
    { key: "shift_management", name: "Shift Cash Drawers", nameAr: "إدارة الورديات والصناديق النقدية", desc: "مراقبة العجز والزيادة والفتح والإغلاق" },
    { key: "inventory", name: "Pro Inventory & Recipes", nameAr: "مخازن متطورة والمكونات الفرعية", desc: "خصم أوتوماتيكي مع المبيعات ووصفات الأكل" },
    { key: "hr_payroll", name: "HR Payroll & Attendance", nameAr: "شؤون الموظفين وجدول الرواتب وحضور البصمة", desc: "تتبع الحضور والانصراف، والخصومات والسلف" },
    { key: "crm_loyalty", name: "CRM & Loyalty Programs", nameAr: "ولاء الزبائن والمكافآت (CRM)", desc: "نقاط مكافآت وحملات تسويقية للزبائن" },
    { key: "aggregator_integration", name: "Aggregators (Talabat/Careem)", nameAr: "ربط فوري وتلقائي مع تطبيقات دليفري", desc: "تلقي طلبات طلبات وكريم فورا بشاشة الكاشير" },
    { key: "multi_branch", name: "Multi-branch Routing", nameAr: "دعم سلاسل الفروع المتعددة", desc: "لوحة تحكم موحدة وتوجيه الطلبات عبر الفروع" },
    { key: "advanced_reports", name: "BI Advanced Analytics", nameAr: "ذكاء تقارير التحليل المالي المتطور", desc: "رسوم بيانية ومقارنة فروع ومؤشرات ربحية عميقة" },
    { key: "white_label", name: "Enterprise Custom Domain", nameAr: "تخصيص الهوية والنطاق الحصري (White Label)", desc: "تشغيل مطعمك تحت نطاق مستقل تماماً" }
  ];

  // Calculate Churn Risks
  const getChurnRiskScore = (org: Organization) => {
    let riskPoints = 0;
    let factors: string[] = [];
    
    // Check overdue invoices
    const overdueInvsCount = invoices.filter(i => i.organizationId === org.id && i.status === "sent" && new Date(i.dueDate) < new Date()).length;
    if (overdueInvsCount > 0) {
      riskPoints += overdueInvsCount * 25;
      factors.push(`لديه ${overdueInvsCount} فواتير عمولات متأخرة الدفع`);
    }

    // Check last active (simulate inactivity)
    const daysSinceActive = Math.floor((Date.now() - new Date(org.lastActiveAt).getTime()) / (1000 * 60 * 60 * 24));
    if (daysSinceActive > 5) {
      riskPoints += 40;
      factors.push(`خمول كامل بالخادم منذ ${daysSinceActive} أيام`);
    }

    let riskLevel: "low" | "medium" | "high" = "low";
    if (riskPoints >= 60) riskLevel = "high";
    else if (riskPoints >= 25) riskLevel = "medium";

    return { riskLevel, riskPoints, factors };
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans" dir="rtl" id="super-admin-portal">
      
      {/* Super admin specialized dark navbar */}
      <header className="bg-slate-950 border-b border-slate-800 sticky top-0 z-40 px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg">
            <ShieldAlert className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h1 className="text-sm font-black tracking-tight leading-none text-white font-display">
              EPLFOOD <span className="text-indigo-400">SUPER ADMIN</span>
            </h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Platform Master Controller</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={fetchPlatformData}
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-all cursor-pointer"
            title="تحديث البيانات"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          
          <div className="h-4 w-px bg-slate-800"></div>

          <button
            onClick={onLogout}
            className="px-3 py-1.5 bg-red-650 hover:bg-red-700 text-xs font-bold rounded-lg text-white transition-all cursor-pointer"
          >
            خروج المسؤول
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
        
        {/* Toast notifications */}
        {notification && (
          <div className={`fixed top-4 left-4 md:left-8 z-[100] max-w-sm p-4 rounded-xl shadow-2xl border text-right animate-fade-in flex items-start gap-3 text-xs leading-relaxed ${
            notification.type === "success" 
              ? "bg-emerald-950/95 border-emerald-500/30 text-emerald-300" 
              : "bg-red-950/95 border-red-500/30 text-red-300"
          }`}>
            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-400" />
            <div>{notification.text}</div>
          </div>
        )}

        {/* 1. Master KPI Analytics Row */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-4" id="platform-kpis">
          
          <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl flex items-center justify-between group hover:border-indigo-500/30 transition-all">
            <div className="space-y-1">
              <span className="text-xxs font-bold text-slate-500 uppercase tracking-wider block">المطاعم النشطة المعزولة</span>
              <span className="text-2xl font-extrabold text-white tracking-tight block">
                {loading ? "..." : kpis.activeRestaurantsCount}
              </span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-all">
              <Building2 className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl flex items-center justify-between group hover:border-emerald-500/30 transition-all">
            <div className="space-y-1">
              <span className="text-xxs font-bold text-slate-500 uppercase tracking-wider block">إجمالي مبيعات المطاعم</span>
              <span className="text-2xl font-extrabold text-emerald-400 tracking-tight block">
                {loading ? "..." : formatCurrency(kpis.totalPlatformSales)}
              </span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-all">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl flex items-center justify-between group hover:border-violet-500/30 transition-all">
            <div className="space-y-1">
              <span className="text-xxs font-bold text-slate-500 uppercase tracking-wider block">عمولاتك المحصلة هذا الشهر</span>
              <span className="text-2xl font-extrabold text-violet-400 tracking-tight block">
                {loading ? "..." : formatCurrency(kpis.commissionsThisMonth)}
              </span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-400 group-hover:scale-110 transition-all">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl flex items-center justify-between group hover:border-amber-500/30 transition-all">
            <div className="space-y-1">
              <span className="text-xxs font-bold text-slate-500 uppercase tracking-wider block">أرباح معلقة قيد التحصيل</span>
              <span className="text-2xl font-extrabold text-amber-400 tracking-tight block">
                {loading ? "..." : formatCurrency(kpis.totalUnpaidCommissions)}
              </span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-all">
              <Receipt className="w-5 h-5" />
            </div>
          </div>

        </section>

        {/* 2. Secondary Platform Advisor Banner */}
        <section className="bg-indigo-950/20 border border-indigo-500/20 rounded-2xl p-4 flex items-start gap-3">
          <Info className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
          <div className="text-xs text-indigo-200 leading-relaxed text-right">
            <span className="font-bold text-white block mb-1">دليل مالك المنصة السحابية:</span>
            أنت في لوحة التحكم المركزية لـ <b className="text-white">Super Admin</b>. من هنا، يمكنك التحكم في تفعيل المزايا المتقدمة لكل مستأجر على حدة، وتعديل خططهم السنوية أو الشهرية، وتعليق الحسابات المتأخرة فورياً، بالإضافة لتسجيل الفواتير وتخصيص أسماء النطاقات (Custom Domains). البيانات معزولة بالكامل خلف طبقة المصادقة الأمنية.
          </div>
        </section>

        {/* 3. Tab bar and controllers */}
        <div className="border-b border-slate-800 flex justify-between items-center gap-4 flex-wrap pb-0" id="portal-sub-tabs">
          <div className="flex gap-1 overflow-x-auto">
            <button
              onClick={() => setActiveTab("tenants")}
              className={`px-4 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "tenants" 
                  ? "border-indigo-500 text-white" 
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              المطاعم المسجلة (Tenants)
            </button>
            <button
              onClick={() => setActiveTab("commissions")}
              className={`px-4 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "commissions" 
                  ? "border-indigo-500 text-white" 
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              دورة العمولات والتحصيل
            </button>
            <button
              onClick={() => setActiveTab("requests")}
              className={`px-4 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap relative ${
                activeTab === "requests" 
                  ? "border-indigo-500 text-white" 
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              طلبات تفعيل المزايا
              {requests.filter(r => r.status === "pending").length > 0 && (
                <span className="w-2 h-2 rounded-full bg-red-500 absolute top-2.5 left-2 animate-ping"></span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("white_label")}
              className={`px-4 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "white_label" 
                  ? "border-indigo-500 text-white" 
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              النطاقات والهوية (White Label)
            </button>
            <button
              onClick={() => setActiveTab("analytics")}
              className={`px-4 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "analytics" 
                  ? "border-indigo-500 text-white" 
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              مخاطر خمول العملاء (Churn Risk)
            </button>
            <button
              onClick={() => setActiveTab("outlets")}
              className={`px-4 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "outlets" 
                  ? "border-indigo-500 text-white" 
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              الفروع وأجهزة الكاشير (Outlets & Registers)
            </button>
          </div>

          {activeTab === "tenants" && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-xs font-bold rounded-xl text-white shadow-md flex items-center gap-1.5 cursor-pointer mb-2"
            >
              <Plus className="w-4 h-4" />
              إضافة مطعم جديد (SaaS Tenant)
            </button>
          )}

          {activeTab === "outlets" && (
            <button
              onClick={() => {
                setNewBranch({
                  orgId: organizations[0]?.id || "org-default",
                  name: "",
                  nameAr: "",
                  slug: "",
                  phone: "",
                  address: "",
                  primaryColor: "#4f46e5",
                  logo: "",
                  estimatedWaitMinutes: 15,
                  minOrderDelivery: 40,
                  deliveryFeeBase: 10
                });
                setShowAddBranch(true);
              }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-xs font-bold rounded-xl text-white shadow-md flex items-center gap-1.5 cursor-pointer mb-2"
            >
              <Plus className="w-4 h-4" />
              إضافة فرع جديد (Add Branch)
            </button>
          )}

          {activeTab === "commissions" && (
            <button
              onClick={handleGenerateInvoices}
              className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-xs font-bold rounded-xl text-white shadow-md flex items-center gap-1.5 cursor-pointer mb-2"
            >
              <Receipt className="w-4 h-4" />
              توليد فواتير دورة الشهر الحالية
            </button>
          )}
        </div>

        {/* 4. Tab Contents */}

        {/* --- Tenants List Tab --- */}
        {activeTab === "tenants" && (
          <div className="space-y-4">
            {/* Search and Filters */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 flex gap-4 flex-col sm:flex-row justify-between items-center">
              <div className="relative w-full max-w-md">
                <input
                  type="text"
                  placeholder="ابحث عن مطعم، مالك، بريد..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-4 pr-10 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <Search className="w-4.5 h-4.5 text-slate-500 absolute right-3 top-3" />
              </div>

              <div className="flex gap-2 w-full sm:w-auto">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-slate-900 border border-slate-800 text-xs text-white px-3 py-2 rounded-xl"
                >
                  <option value="all">كل الحالات</option>
                  <option value="active">نشط</option>
                  <option value="suspended">موقوف مؤقتاً</option>
                  <option value="trial">تجريبي</option>
                </select>
              </div>
            </div>

            {/* Grid list of tenants */}
            {loading ? (
              <div className="text-center py-12 text-slate-500 text-xs">جاري جلب قائمة المستأجرين وبنيات العزل...</div>
            ) : filteredTenants.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs">لا يوجد مطاعم مطابقة للبحث حالياً.</div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filteredTenants.map((org) => {
                  const overdueCount = invoices.filter(i => i.organizationId === org.id && i.status === "sent" && new Date(i.dueDate) < new Date()).length;
                  return (
                    <div 
                      key={org.id}
                      className={`bg-slate-950 border rounded-2xl p-6 transition-all relative overflow-hidden group flex flex-col justify-between ${
                        org.status === "suspended" 
                          ? "border-red-500/30 bg-red-950/5" 
                          : "border-slate-800 hover:border-slate-700"
                      }`}
                    >
                      {/* Accent color bar */}
                      <div className="absolute top-0 right-0 left-0 h-1.5" style={{ backgroundColor: org.primaryColor || "#4f46e5" }}></div>

                      <div>
                        {/* Header metadata */}
                        <div className="flex justify-between items-start gap-4 mb-4">
                          <div className="flex items-center gap-3">
                            <img 
                              src={org.logo} 
                              alt={org.name} 
                              className="w-12 h-12 rounded-xl object-cover border border-slate-800"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=100&auto=format&fit=crop&q=60";
                              }}
                            />
                            <div>
                              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                                {org.name}
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                  org.plan === "enterprise" ? "bg-purple-950 text-purple-400 border border-purple-800/30" :
                                  org.plan === "professional" ? "bg-indigo-950 text-indigo-400 border border-indigo-800/30" :
                                  org.plan === "growth" ? "bg-cyan-950 text-cyan-400 border border-cyan-800/30" :
                                  "bg-slate-900 text-slate-400"
                                }`}>
                                  {PLANS[org.plan]?.nameAr || org.plan}
                                </span>
                              </h3>
                              <p className="text-xxs text-slate-500 mt-0.5">{org.legalName}</p>
                            </div>
                          </div>

                          <span className={`px-2 py-1 rounded-lg text-xxs font-bold ${
                            org.status === "active" ? "bg-emerald-950 text-emerald-400 border border-emerald-900/30" :
                            org.status === "suspended" ? "bg-red-950 text-red-400 border border-red-900/30" :
                            "bg-amber-950 text-amber-400 border border-amber-900/30"
                          }`}>
                            {org.status === "active" ? "نشط" : org.status === "suspended" ? "موقوف" : "تجريبي"}
                          </span>
                        </div>

                        {/* Tenant credentials & setup info */}
                        <div className="grid grid-cols-2 gap-4 py-4 border-y border-slate-900 text-xxs text-slate-400 mb-4">
                          <div>
                            <span className="text-slate-500 block mb-0.5">البريد المالك</span>
                            <span className="text-slate-200 font-medium">{org.ownerEmail}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block mb-0.5">الهاتف</span>
                            <span className="text-slate-200">{org.ownerPhone || "—"}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block mb-0.5">العمولة الفعلية للربحية</span>
                            <span className="text-white font-extrabold">{org.revenueSharePercent}% مبيعات</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block mb-0.5">مستحقات معلقة بالذمة</span>
                            <span className="text-amber-400 font-extrabold">{formatCurrency(org.totalRevenueShareOwed)}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block mb-0.5">إجمالي مبيعات المطعم</span>
                            <span className="text-emerald-400 font-extrabold">{formatCurrency(org.totalSales || 0)}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block mb-0.5">الطلبات المستكملة</span>
                            <span className="text-indigo-400 font-extrabold">{org.orderCount || 0} طلب دفَع</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block mb-0.5">سقف الموارد والمطابخ</span>
                            <span className="text-slate-200">
                              فروع {org.maxBranches} | مستخدم {org.maxUsers} | وجبات {org.maxMenuItems}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500 block mb-0.5">تاريخ تسجيل العقد</span>
                            <span className="text-slate-300">{new Date(org.createdAt).toLocaleDateString("ar-EG")}</span>
                          </div>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex justify-between items-center gap-2 flex-wrap pt-2">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setSelectedTenantForFeatures(org)}
                            className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-850 hover:text-indigo-400 border border-slate-800 rounded-lg text-xxs font-bold transition-all cursor-pointer flex items-center gap-1"
                          >
                            <Settings className="w-3.5 h-3.5" />
                            تخصيص الميزات والأبواب ({org.customFeatures.filter(f => f.enabled).length})
                          </button>

                          <button
                            onClick={() => handleResetPassword(org.id, org.name)}
                            className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-850 hover:text-white border border-slate-800 rounded-lg text-xxs font-bold transition-all cursor-pointer"
                            title="إعادة تعيين كلمة مرور المالك إلى الافتراضي 'owner'"
                          >
                            صفّر الباسورد
                          </button>
                        </div>

                        {org.status === "suspended" ? (
                          <button
                            onClick={() => handleUnsuspendTenant(org.id, org.name)}
                            className="px-3 py-1.5 bg-emerald-650 hover:bg-emerald-700 text-xxs font-bold text-white rounded-lg transition-all cursor-pointer flex items-center gap-1"
                          >
                            <Power className="w-3.5 h-3.5" />
                            تنشيط وإلغاء الحجب
                          </button>
                        ) : (
                          <button
                            onClick={() => setSuspendingTenant(org)}
                            className="px-3 py-1.5 bg-red-650 hover:bg-red-700 text-xxs font-bold text-white rounded-lg transition-all cursor-pointer flex items-center gap-1"
                          >
                            <Power className="w-3.5 h-3.5" />
                            إيقاف مؤقت (حجب)
                          </button>
                        )}
                      </div>

                      {overdueCount > 0 && (
                        <div className="mt-3 p-2 bg-amber-950/50 border border-amber-900/30 text-amber-400 text-xxs rounded-lg flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span>تحذير: لديه <b>{overdueCount}</b> فواتير مستحقة الدفع بالكامل!</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* --- Commissions & Billing Tab --- */}
        {activeTab === "commissions" && (
          <div className="space-y-6">
            <div className="bg-slate-950 border border-slate-850 rounded-2xl p-6 space-y-4">
              <h3 className="text-sm font-bold text-white">دورة تسوية العمولات لشهر {new Date().toLocaleDateString("ar-EG", { month: "long" })}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                تقوم المنصة آلياً برصد كل طلب يتم استكماله أو سداده في أي مطعم من المطاعم المسجلة. يتم احتساب النسبة المحددة مسبقاً (مثال 1.5% أو 2.0%) وتراكمها في حصيلة الحساب. بمجرد نهاية الشهر أو عند الطلب، اضغط على زر توليد فواتير دورة الشهر الحالية لتصدير كشف حساب وإرسال إشعار الدفع المعزول لكل مستأجر.
              </p>
            </div>

            {/* Invoices table */}
            <div className="bg-slate-950 border border-slate-850 rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-slate-850">
                <h4 className="text-xs font-bold text-slate-300">الفواتير وحصائل التحصيل</h4>
              </div>

              {invoices.length === 0 ? (
                <div className="p-12 text-center text-slate-500 text-xs">لا توجد فواتير تم توليدها حتى الآن. انقر على الزر لتصدير فواتير المستأجرين المستحقة.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-900 text-slate-400 text-xxs font-bold">
                      <tr>
                        <th className="p-4">المطعم</th>
                        <th className="p-4">الفترة</th>
                        <th className="p-4">حجم مبيعات المطعم</th>
                        <th className="p-4">النسبة</th>
                        <th className="p-4">العمولة المستحقة</th>
                        <th className="p-4">الحالة</th>
                        <th className="p-4">تاريخ الاستحقاق</th>
                        <th className="p-4 text-left">إجراء</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900 text-slate-300">
                      {invoices.map((inv) => {
                        const targetOrg = organizations.find(o => o.id === inv.organizationId);
                        return (
                          <tr key={inv.id} className="hover:bg-slate-900/30 transition-all">
                            <td className="p-4 font-bold text-white">{targetOrg?.name || "مطعم مجهول"}</td>
                            <td className="p-4 font-mono">{inv.period}</td>
                            <td className="p-4 font-mono text-slate-300">{formatCurrency(inv.totalSales)}</td>
                            <td className="p-4 font-mono text-slate-400">{inv.revenueSharePercent}%</td>
                            <td className="p-4 font-bold text-amber-400">{formatCurrency(inv.revenueShareDue)}</td>
                            <td className="p-4">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                inv.status === "paid" 
                                  ? "bg-emerald-950 text-emerald-400" 
                                  : "bg-amber-950 text-amber-400"
                              }`}>
                                {inv.status === "paid" ? "تم التحصيل" : "مستحقة قيد السداد"}
                              </span>
                            </td>
                            <td className="p-4 text-slate-400">{new Date(inv.dueDate).toLocaleDateString("ar-EG")}</td>
                            <td className="p-4 text-left">
                              {inv.status !== "paid" ? (
                                <button
                                  onClick={() => handlePayInvoice(inv.id, inv.revenueShareDue)}
                                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-xxs font-bold text-white rounded-md transition-all cursor-pointer"
                                >
                                  سجل كـ "مدفوع بالكامل"
                                </button>
                              ) : (
                                <span className="text-[10px] text-slate-500 font-mono flex items-center justify-end gap-1">
                                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                                  TRX-OK
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- Feature Requests Queue Tab --- */}
        {activeTab === "requests" && (
          <div className="space-y-4">
            <div className="bg-slate-950 border border-slate-850 rounded-2xl p-6">
              <h3 className="text-sm font-bold text-white mb-2">طلبات تفعيل الميزات المتطورة والمغلقة</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                عندما يحاول المطعم المشترك في الباقة الأساسية (Starter) أو المتوسطة (Growth) تشغيل ميزة مغلقة في باقته، تقدم المنصة زر "طلب تفعيل الميزة" الذي يرسل إشعاراً فورياً إلى هنا. الموافقة تفعل الميزة فورياً للمستأجر المقابل، وتطبق تلقائياً الزيادة النسبية المخصصة على العمولة لتلك الميزة (مثلاً زيادة 0.5% للربط الفوري مع تطبيقات التوصيل).
              </p>
            </div>

            {requests.length === 0 ? (
              <div className="bg-slate-950 border border-slate-850 rounded-2xl p-12 text-center text-slate-500 text-xs">لا توجد طلبات معلقة من المطاعم حالياً.</div>
            ) : (
              <div className="bg-slate-950 border border-slate-850 rounded-2xl overflow-hidden divide-y divide-slate-900">
                {requests.map((req) => (
                  <div key={req.id} className="p-5 flex justify-between items-center gap-4 hover:bg-slate-900/10 transition-all flex-col sm:flex-row text-right">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-black text-white">{req.organizationName}</span>
                        <span className="text-[10px] font-mono text-slate-500">ID: {req.organizationId}</span>
                      </div>
                      <p className="text-xs text-slate-300">
                        طلب تفعيل ميزة: <b className="text-indigo-400">{ALL_FEATURES.find(f => f.key === req.featureKey)?.nameAr || req.featureKey}</b>
                      </p>
                      <p className="text-[10px] text-slate-500">تم الطلب بتاريخ: {new Date(req.requestedAt).toLocaleString("ar-EG")}</p>
                    </div>

                    <div className="flex items-center gap-2.5">
                      {req.status === "pending" ? (
                        <>
                          <button
                            onClick={() => handleApproveRequest(req.id, req.organizationName, req.featureKey)}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-xs font-bold text-white rounded-xl shadow transition-all cursor-pointer flex items-center gap-1"
                          >
                            <Check className="w-4 h-4" />
                            تفعيل فوري + زيادة النسبة
                          </button>
                          <button
                            onClick={() => handleRejectRequest(req.id)}
                            className="px-3 py-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-xs font-bold text-slate-400 hover:text-white rounded-xl transition-all cursor-pointer flex items-center gap-1"
                          >
                            <X className="w-4 h-4" />
                            رفض
                          </button>
                        </>
                      ) : (
                        <span className={`px-2.5 py-1.5 rounded-lg text-xxs font-bold ${
                          req.status === "approved" ? "bg-emerald-950 text-emerald-400" : "bg-red-950 text-red-400"
                        }`}>
                          {req.status === "approved" ? "تم التفعيل بنجاح" : "مرفوض"}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* --- White Label and Domains Mapping Tab --- */}
        {activeTab === "white_label" && (
          <div className="space-y-6">
            <div className="bg-slate-950 border border-slate-850 rounded-2xl p-6">
              <h3 className="text-sm font-bold text-white mb-2">تخصيص النطاقات وهوية المنصة المستقلة (White-Label Systems)</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                تتيح المنصة لكبار العملاء (Enterprise Tenants) إمكانية ربط مطاعمهم وفروعهم بنطاق مخصص خاص بهم بالكامل (مثل: <b className="text-white">app.eplfood.com</b>). عند تفعيل هذا الباب، يتعرف الخادم على النطاق تلقائياً ويقوم بتحميل شعار المطعم، وألوان هويته، وقائمته المعزولة دون أدنى مرجع لمنصة eplfood.
              </p>
            </div>

            <div className="bg-slate-950 border border-slate-850 rounded-2xl overflow-hidden p-6 space-y-4">
              <h4 className="text-xs font-bold text-slate-300">خارطة توجيه النطاقات المعرفة بالخادم (DNS/Hosts Mapping)</h4>
              
              <div className="space-y-3">
                <div className="p-4 bg-slate-900 border border-slate-850 rounded-xl flex justify-between items-center flex-wrap gap-2 text-xs">
                  <div>
                    <span className="font-mono text-slate-300 block mb-0.5">app.eplfood.com</span>
                    <span className="text-xxs text-indigo-400">نطاق المضيف العام (افتراضي)</span>
                  </div>
                  <span className="text-xxs text-slate-500 font-bold">موجه لـ: Nile Restaurants & Default Tenants</span>
                </div>

                <div className="p-4 bg-slate-900 border border-slate-850 rounded-xl flex justify-between items-center flex-wrap gap-2 text-xs">
                  <div>
                    <span className="font-mono text-white block mb-0.5">admin.eplfood.com</span>
                    <span className="text-xxs text-violet-400">لوحة مالك المنصة</span>
                  </div>
                  <span className="text-xxs text-slate-500 font-bold">موجه لـ: Super Admin Panel Only</span>
                </div>

                <div className="p-4 bg-slate-900 border border-slate-850 rounded-xl flex justify-between items-center flex-wrap gap-2 text-xs">
                  <div>
                    <span className="font-mono text-amber-300 block mb-0.5">princess-cafe.com</span>
                    <span className="text-xxs text-amber-500">نطاق مخصص (Enterprise Feature)</span>
                  </div>
                  <span className="text-xxs text-amber-500 font-bold">موجه لـ: Princess Cafe (org-starter)</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- Analytics and Churn Risk Detector Tab --- */}
        {activeTab === "analytics" && (
          <div className="space-y-6">
            <div className="bg-slate-950 border border-slate-850 rounded-2xl p-6">
              <h3 className="text-sm font-bold text-white mb-2">رادار فحص خمول العملاء ومؤشرات المغادرة (Churn Risk Engine)</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                تقوم خوارزمية ذكاء الأعمال المدمجة لدينا بمراقبة دورة حياة المطاعم وتحديد العملاء الأكثر عرضة لإيقاف اشتراكاتهم أو مغادرة المنصة. يرتكز الفحص على معدلات الطلبات، وحجم الفواتير المتأخرة، وتواريخ آخر وردية نشطة.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Risk list */}
              <div className="bg-slate-950 border border-slate-850 rounded-2xl p-6 space-y-4">
                <h4 className="text-xs font-bold text-white">نتائج الفحص ومؤشر الخطر</h4>

                <div className="space-y-3">
                  {organizations.map(org => {
                    const { riskLevel, riskPoints, factors } = getChurnRiskScore(org);
                    return (
                      <div key={org.id} className="p-4 bg-slate-900 rounded-xl border border-slate-850 flex justify-between items-start gap-4">
                        <div className="space-y-1.5">
                          <span className="text-xs font-bold text-white">{org.name}</span>
                          <div className="space-y-1">
                            {factors.map((f, i) => (
                              <p key={i} className="text-[10px] text-slate-400 flex items-center gap-1">
                                <span className="w-1 h-1 rounded-full bg-slate-500"></span>
                                {f}
                              </p>
                            ))}
                            {factors.length === 0 && <p className="text-[10px] text-emerald-400">✓ صحة تشغيلية ممتازة وتفاعل يومي</p>}
                          </div>
                        </div>

                        <div className="text-left shrink-0">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold block mb-1 text-center ${
                            riskLevel === "high" ? "bg-red-950 text-red-400" :
                            riskLevel === "medium" ? "bg-amber-950 text-amber-400" :
                            "bg-emerald-950 text-emerald-400"
                          }`}>
                            {riskLevel === "high" ? "مخاطر عالية جداً" :
                             riskLevel === "medium" ? "مخاطر متوسطة" : "آمن / متفاعل"}
                          </span>
                          <span className="text-xxs text-slate-500 block">نقاط المخاطرة: {riskPoints}/100</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Actionable recommendations */}
              <div className="bg-slate-950 border border-slate-850 rounded-2xl p-6 space-y-4">
                <h4 className="text-xs font-bold text-white">توصيات تشغيلية لحفظ العملاء</h4>

                <div className="space-y-3.5 text-xs text-slate-300">
                  <div className="p-3 bg-red-950/20 border border-red-900/30 rounded-lg flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                    <p className="leading-relaxed text-xxs">
                      <b>مستأجرين في نطاق الخطر العالي:</b> يرجى إرسال تنبيه بالبريد الإلكتروني فوراً لمديري الحسابات وعرض خطة سداد للعمولات المتأخرة لتجنب الإيقاف التلقائي.
                    </p>
                  </div>

                  <div className="p-3 bg-indigo-950/20 border border-indigo-900/30 rounded-lg flex items-start gap-2">
                    <Info className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
                    <p className="leading-relaxed text-xxs">
                      <b>التسويق بالميزات:</b> تم رصد مطاعم في الباقة الأساسية تحاول الاستعلام عن ميزات مغلقة. يوصى بإرسال خصم ترويجي 20% للترقية السنوية لباقة Growth.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "outlets" && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-slate-950 border border-slate-850 rounded-2xl p-6">
              <h3 className="text-sm font-bold text-white mb-2">إدارة الفروع والمواقع وأجهزة الكاشير الملحقة</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                من هنا يمكنك التحكم بكافة فروع المطاعم المشتركة في المنصة، وتعيين كل فرع لمطعم (Tenant) محدد، وتنزيل أو تعديل أجهزة الكاشير (Registers) الملحقة بكل فرع لتشغيل نظام المبيعات POS.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {branches.map((branch: any) => {
                const tenant = organizations.find(org => org.id === branch.orgId);
                return (
                  <div key={branch.id} className="bg-slate-950 border border-slate-850 rounded-2xl p-6 flex flex-col justify-between gap-4">
                    <div className="space-y-4 text-right" dir="rtl">
                      {/* Branch Info Card */}
                      <div className="flex items-start gap-4">
                        <img 
                          src={branch.logo || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=200"} 
                          alt={branch.name} 
                          className="w-14 h-14 rounded-xl object-cover border border-slate-800 shrink-0"
                        />
                        <div className="space-y-1 text-right flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold text-slate-400 flex items-center gap-1">
                              <span className="bg-indigo-950 text-indigo-400 text-[10px] font-black px-2 py-0.5 rounded-full">
                                {tenant ? tenant.name : "غير معين"}
                              </span>
                            </h4>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setEditingBranch(branch)}
                                className="p-1.5 text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-lg transition-colors cursor-pointer animate-none"
                                title="تعديل بيانات الفرع"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteBranch(branch.id)}
                                className="p-1.5 text-rose-400 hover:text-rose-300 bg-rose-950/20 hover:bg-rose-950/40 border border-rose-900/30 rounded-lg transition-colors cursor-pointer animate-none"
                                title="حذف الفرع"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                          <h3 className="text-sm font-extrabold text-white">{branch.nameAr} <span className="text-xs font-normal text-slate-500 font-sans">({branch.name})</span></h3>
                          <p className="text-xxs text-slate-400 flex items-center gap-1 justify-end">
                            <MapPin className="w-3 h-3 text-slate-500" />
                            {branch.address || "العنوان غير محدد"}
                          </p>
                          {branch.phone && (
                            <p className="text-xxs text-slate-400 flex items-center gap-1 font-sans justify-end" dir="ltr">
                              <Phone className="w-3 h-3 text-slate-500 shrink-0" />
                              {branch.phone}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Cashier registers section */}
                      <div className="pt-4 border-t border-slate-850/60 text-right space-y-3">
                        <h5 className="text-xxs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1 justify-end">
                          <Tv className="w-3.5 h-3.5 text-indigo-450" />
                          أجهزة كاشير نقاط البيع النشطة ({branch.registers?.length || 0})
                        </h5>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {branch.registers?.map((reg: any) => (
                            <div key={reg.id} className="p-2.5 bg-slate-900 border border-slate-850/80 rounded-xl flex items-center justify-between gap-2 text-xxs">
                              <button
                                onClick={() => handleDeleteRegister(branch.id, reg.id)}
                                className="p-1 text-slate-500 hover:text-red-400 rounded transition-colors cursor-pointer"
                                title="حذف الجهاز"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                              <div className="text-right">
                                <span className="font-extrabold text-white block">{reg.nameAr || reg.name}</span>
                                <span className="text-[10px] text-slate-500 font-mono">{reg.id}</span>
                              </div>
                            </div>
                          ))}
                          {(!branch.registers || branch.registers.length === 0) && (
                            <div className="col-span-2 text-center py-4 bg-slate-900/40 border border-dashed border-slate-850 rounded-xl text-xxs text-slate-500">
                              لا توجد أجهزة كاشير مضافة لهذا الفرع حالياً.
                            </div>
                          )}
                        </div>

                        {/* Register addition subform */}
                        {addingRegisterToBranchId === branch.id ? (
                          <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
                            <div className="grid grid-cols-2 gap-2 text-right">
                              <div>
                                <label className="text-[10px] font-bold text-slate-400 block mb-1">اسم الجهاز بالعربية</label>
                                <input 
                                  type="text" 
                                  placeholder="كاشير الصالة الرئيسي"
                                  value={newRegister.nameAr}
                                  onChange={(e) => setNewRegister({ ...newRegister, nameAr: e.target.value })}
                                  className="w-full text-xxs bg-slate-950 border border-slate-800 rounded px-2 py-1 text-white text-right"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] font-bold text-slate-400 block mb-1">الاسم بالإنجليزية</label>
                                <input 
                                  type="text" 
                                  placeholder="Main Dine-In POS"
                                  value={newRegister.name}
                                  onChange={(e) => setNewRegister({ ...newRegister, name: e.target.value })}
                                  className="w-full text-xxs bg-slate-950 border border-slate-800 rounded px-2 py-1 text-white text-right"
                                />
                              </div>
                            </div>
                            <div className="flex justify-end gap-1.5 text-xxs">
                              <button 
                                onClick={() => setAddingRegisterToBranchId(null)}
                                className="px-2.5 py-1 bg-slate-800 text-slate-300 rounded"
                              >
                                إلغاء
                              </button>
                              <button 
                                onClick={() => handleAddRegister(branch.id)}
                                className="px-2.5 py-1 bg-indigo-650 text-white font-bold rounded"
                              >
                                إضافة
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex justify-end">
                            <button
                              onClick={() => {
                                setNewRegister({ name: "", nameAr: "" });
                                setAddingRegisterToBranchId(branch.id);
                              }}
                              className="text-xxs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer pt-1"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              تسجيل جهاز كاشير (POS Terminal) جديد للفرع
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              {branches.length === 0 && (
                <div className="col-span-2 text-center py-12 bg-slate-950 border border-dashed border-slate-850 rounded-2xl text-xs text-slate-400">
                  لا توجد فروع مسجلة على المنصة حالياً. اضغط على "إضافة فرع جديد" بالأعلى لتهيئة أول فرع.
                </div>
              )}
            </div>
          </div>
        )}

      </main>

      {/* CREATE NEW TENANT MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 w-full max-w-xl rounded-2xl overflow-hidden shadow-2xl animate-scale-up">
            <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900">
              <h3 className="text-xs font-black text-white">إضافة مطعم شريك جديد (SaaS Tenant Architecture)</h3>
              <button onClick={() => { setIsCreateModalOpen(false); setCreateTenantError(null); }} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTenant} className="p-5 space-y-4 text-right">
              {createTenantError && (
                <div className="p-3 bg-red-950/80 border border-red-500/30 text-red-300 text-xs rounded-lg text-right flex items-start gap-2 leading-relaxed">
                  <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-red-400" />
                  <div>
                    <span className="font-bold block text-red-400 mb-0.5">فشل إضافة المطعم:</span>
                    {createTenantError}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xxs font-bold text-slate-400 mb-1.5">اسم المطعم التجاري</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: مطعم الفيروز"
                    value={newTenant.name}
                    onChange={(e) => setNewTenant({ ...newTenant, name: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xxs font-bold text-slate-400 mb-1.5">الاسم القانوني للشركة</label>
                  <input
                    type="text"
                    placeholder="مثال: شركة الفيروز للمطاعم ذ.م.م"
                    value={newTenant.legalName}
                    onChange={(e) => setNewTenant({ ...newTenant, legalName: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xxs font-bold text-slate-400 mb-1.5">البريد الإلكتروني للمالك</label>
                  <input
                    type="email"
                    required
                    placeholder="owner@fayrouz.com"
                    value={newTenant.ownerEmail}
                    onChange={(e) => setNewTenant({ ...newTenant, ownerEmail: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-left text-white font-sans"
                  />
                </div>
                <div>
                  <label className="block text-xxs font-bold text-slate-400 mb-1.5">رقم الهاتف المالك</label>
                  <input
                    type="text"
                    placeholder="01012345678"
                    value={newTenant.ownerPhone}
                    onChange={(e) => setNewTenant({ ...newTenant, ownerPhone: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-left text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xxs font-bold text-slate-400 mb-1.5">باقة الاشتراك الأساسية</label>
                  <select
                    value={newTenant.plan}
                    onChange={(e) => {
                      const selPlan = e.target.value as PlanKey;
                      setNewTenant({ 
                        ...newTenant, 
                        plan: selPlan,
                        revenueSharePercent: PLANS[selPlan].revenueSharePercent,
                        maxBranches: PLANS[selPlan].maxBranches
                      });
                    }}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white"
                  >
                    <option value="starter">باقة المبتدئ (Starter)</option>
                    <option value="growth">باقة النمو المتقدمة (Growth)</option>
                    <option value="professional">الباقة الاحترافية (Professional)</option>
                    <option value="enterprise">باقة المؤسسات الكبرى (Enterprise)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xxs font-bold text-slate-400 mb-1.5">نسبة عمولة المنصة (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={newTenant.revenueSharePercent}
                    onChange={(e) => setNewTenant({ ...newTenant, revenueSharePercent: parseFloat(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xxs font-bold text-slate-400 mb-1.5">رابط لوجو المطعم (Logo URL)</label>
                  <input
                    type="text"
                    placeholder="https://images.unsplash.com/..."
                    value={newTenant.logo}
                    onChange={(e) => setNewTenant({ ...newTenant, logo: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xxs font-bold text-slate-400 mb-1.5">كود لون الهوية الرئيسي</label>
                  <input
                    type="color"
                    value={newTenant.primaryColor}
                    onChange={(e) => setNewTenant({ ...newTenant, primaryColor: e.target.value })}
                    className="w-full h-9 bg-slate-900 border border-slate-800 rounded-lg p-1 text-xs text-white cursor-pointer"
                  />
                </div>
              </div>

              <div className="p-3 bg-indigo-950/20 border border-indigo-900/30 rounded-lg text-[10px] text-indigo-300 leading-relaxed">
                ملاحظة أمنية: إنشاء المطعم سينشئ تلقائياً قاعدة بيانات معزولة بالكامل (Tenant Sandbox) ولن يتمكن من رؤية أي مبيعات أو أطباق أو ورديات المطاعم الأخرى، وسيحصل المالك على كلمة مرور افتراضية هي "owner".
              </div>

              <div className="pt-3 border-t border-slate-850 flex justify-end gap-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-650 hover:bg-indigo-750 text-xs font-bold text-white rounded-xl shadow cursor-pointer"
                >
                  تسجيل وتدشين المستأجر المعزول
                </button>
                <button
                  type="button"
                  onClick={() => { setIsCreateModalOpen(false); setCreateTenantError(null); }}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-xs font-bold text-slate-400 rounded-xl cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUSPEND TENANT MODAL */}
      {suspendingTenant && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl animate-scale-up">
            <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900">
              <h3 className="text-xs font-black text-white">تأكيد إيقاف حساب مطعم "{suspendingTenant.name}"</h3>
              <button onClick={() => setSuspendingTenant(null)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-right">
              <p className="text-xs text-slate-300">
                سيؤدي تعليق الحساب إلى منع المالك وجميع طاقم الكاشير والمطبخ من استخدام النظام فوراً، وستظهر لهم شاشة "تم حجب حساب المطعم الخاص بك لمتأخرات العمولات".
              </p>

              <div>
                <label className="block text-xxs font-bold text-slate-400 mb-1.5">سبب إيقاف الحساب بالتفصيل</label>
                <textarea
                  required
                  placeholder="مثال: لم يتم سداد فواتير العمولات لشهر يونيو 2026 بعد انتهاء فترة السماح."
                  value={suspendReason}
                  onChange={(e) => setSuspendReason(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-white h-24"
                />
              </div>

              <div className="pt-3 border-t border-slate-850 flex justify-end gap-2">
                <button
                  onClick={handleSuspendTenant}
                  className="px-4 py-2 bg-red-650 hover:bg-red-750 text-xs font-bold text-white rounded-xl shadow cursor-pointer"
                >
                  حجب الحساب الآن
                </button>
                <button
                  type="button"
                  onClick={() => setSuspendingTenant(null)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-xs font-bold text-slate-400 rounded-xl cursor-pointer"
                >
                  تراجع
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM FEATURE FLAGS EDIT MODAL */}
      {selectedTenantForFeatures && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl animate-scale-up">
            <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900">
              <div className="text-right">
                <h3 className="text-xs font-black text-white">تخصيص الميزات والموديلات لمطعم "{selectedTenantForFeatures.name}"</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">الباقة الحالية: {selectedTenantForFeatures.plan.toUpperCase()}</p>
              </div>
              <button onClick={() => setSelectedTenantForFeatures(null)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 max-h-[60vh] overflow-y-auto space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-right">
                {ALL_FEATURES.map((feat) => {
                  const isEnabled = selectedTenantForFeatures.customFeatures.find(f => f.key === feat.key)?.enabled;
                  return (
                    <div 
                      key={feat.key}
                      className={`p-3.5 rounded-xl border transition-all flex items-start gap-3 justify-between ${
                        isEnabled 
                          ? "bg-indigo-950/10 border-indigo-500/30 text-white" 
                          : "bg-slate-900/40 border-slate-850 text-slate-400"
                      }`}
                    >
                      <div className="space-y-1">
                        <span className="text-xs font-bold text-white block">{feat.nameAr}</span>
                        <span className="text-xxs text-slate-500 block leading-tight">{feat.desc}</span>
                        <span className="text-[9px] font-mono text-slate-500 block uppercase">{feat.key}</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleToggleFeature(selectedTenantForFeatures.id, feat.key, !!isEnabled)}
                        className={`w-11 h-6 rounded-full transition-all relative ${
                          isEnabled ? "bg-indigo-600" : "bg-slate-800"
                        }`}
                      >
                        <span className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${
                          isEnabled ? "left-1" : "left-6"
                        }`}></span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-4 bg-slate-900 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedTenantForFeatures(null)}
                className="px-5 py-2 bg-indigo-650 hover:bg-indigo-750 text-xs font-bold text-white rounded-xl shadow cursor-pointer"
              >
                حفظ وإغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD NEW BRANCH MODAL */}
      {showAddBranch && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 w-full max-w-xl rounded-2xl overflow-hidden shadow-2xl animate-scale-up text-right">
            <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900">
              <h3 className="text-xs font-black text-white">إضافة فرع أو موقع جديد للمطعم الشريك</h3>
              <button onClick={() => setShowAddBranch(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBranch} className="p-5 space-y-4 font-sans" dir="rtl">
              <div className="grid grid-cols-2 gap-4 text-right">
                <div>
                  <label className="block text-xxs font-bold text-slate-400 mb-1.5">المطعم التابع (SaaS Tenant)</label>
                  <select
                    value={newBranch.orgId}
                    onChange={(e) => setNewBranch({ ...newBranch, orgId: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-white"
                  >
                    {organizations.map(org => (
                      <option key={org.id} value={org.id}>{org.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xxs font-bold text-slate-400 mb-1.5">الاسم الفريد بالإنجليزية (Slug/ID)</label>
                  <input
                    type="text"
                    required
                    placeholder="fayrouz-nasr-city"
                    value={newBranch.slug}
                    onChange={(e) => setNewBranch({ ...newBranch, slug: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-right">
                <div>
                  <label className="block text-xxs font-bold text-slate-400 mb-1.5">اسم الفرع بالعربية</label>
                  <input
                    type="text"
                    required
                    placeholder="فرع مدينة نصر"
                    value={newBranch.nameAr}
                    onChange={(e) => setNewBranch({ ...newBranch, nameAr: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xxs font-bold text-slate-400 mb-1.5">اسم الفرع بالإنجليزية</label>
                  <input
                    type="text"
                    required
                    placeholder="Nasr City Branch"
                    value={newBranch.name}
                    onChange={(e) => setNewBranch({ ...newBranch, name: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-right">
                <div>
                  <label className="block text-xxs font-bold text-slate-400 mb-1.5">عنوان الفرع بالتفصيل</label>
                  <input
                    type="text"
                    placeholder="شارع عباس العقاد، بجوار كوك دور"
                    value={newBranch.address}
                    onChange={(e) => setNewBranch({ ...newBranch, address: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xxs font-bold text-slate-400 mb-1.5">رقم هاتف الفرع</label>
                  <input
                    type="text"
                    placeholder="0222718290"
                    value={newBranch.phone}
                    onChange={(e) => setNewBranch({ ...newBranch, phone: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 text-right">
                <div>
                  <label className="block text-xxs font-bold text-slate-400 mb-1.5">وقت تحضير الطلب (دقيقة)</label>
                  <input
                    type="number"
                    value={newBranch.estimatedWaitMinutes}
                    onChange={(e) => setNewBranch({ ...newBranch, estimatedWaitMinutes: parseInt(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xxs font-bold text-slate-400 mb-1.5">الحد الأدنى للتوصيل (EGP)</label>
                  <input
                    type="number"
                    value={newBranch.minOrderDelivery}
                    onChange={(e) => setNewBranch({ ...newBranch, minOrderDelivery: parseFloat(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xxs font-bold text-slate-400 mb-1.5">سعر التوصيل الأساسي (EGP)</label>
                  <input
                    type="number"
                    value={newBranch.deliveryFeeBase}
                    onChange={(e) => setNewBranch({ ...newBranch, deliveryFeeBase: parseFloat(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-right">
                <div>
                  <label className="block text-xxs font-bold text-slate-400 mb-1.5">شعار أو لوجو الفرع (URL)</label>
                  <input
                    type="text"
                    placeholder="https://images.unsplash.com/..."
                    value={newBranch.logo}
                    onChange={(e) => setNewBranch({ ...newBranch, logo: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xxs font-bold text-slate-400 mb-1.5">كود لون الهوية للفرع</label>
                  <input
                    type="color"
                    value={newBranch.primaryColor}
                    onChange={(e) => setNewBranch({ ...newBranch, primaryColor: e.target.value })}
                    className="w-full h-10 bg-slate-900 border border-slate-800 rounded-lg p-1 text-xs text-white cursor-pointer"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-850 flex justify-end gap-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-650 hover:bg-indigo-750 text-xs font-bold text-white rounded-xl shadow cursor-pointer"
                >
                  تأكيد وإنشاء الفرع
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddBranch(false)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-xs font-bold text-slate-400 rounded-xl cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT EXISTING BRANCH MODAL */}
      {editingBranch && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 w-full max-w-xl rounded-2xl overflow-hidden shadow-2xl animate-scale-up text-right">
            <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900">
              <h3 className="text-xs font-black text-white">تعديل بيانات فرع "{editingBranch.nameAr || editingBranch.name}"</h3>
              <button onClick={() => setEditingBranch(null)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateBranch} className="p-5 space-y-4 font-sans" dir="rtl">
              <div className="grid grid-cols-2 gap-4 text-right">
                <div>
                  <label className="block text-xxs font-bold text-slate-400 mb-1.5">المطعم التابع (SaaS Tenant)</label>
                  <select
                    value={editingBranch.orgId || "org-default"}
                    onChange={(e) => setEditingBranch({ ...editingBranch, orgId: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-white"
                  >
                    {organizations.map(org => (
                      <option key={org.id} value={org.id}>{org.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xxs font-bold text-slate-400 mb-1.5">الاسم الفريد بالإنجليزية (Slug/ID)</label>
                  <input
                    type="text"
                    required
                    placeholder="fayrouz-nasr-city"
                    value={editingBranch.slug || ""}
                    onChange={(e) => setEditingBranch({ ...editingBranch, slug: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-right">
                <div>
                  <label className="block text-xxs font-bold text-slate-400 mb-1.5">اسم الفرع بالعربية</label>
                  <input
                    type="text"
                    required
                    placeholder="فرع مدينة نصر"
                    value={editingBranch.nameAr || ""}
                    onChange={(e) => setEditingBranch({ ...editingBranch, nameAr: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xxs font-bold text-slate-400 mb-1.5">اسم الفرع بالإنجليزية</label>
                  <input
                    type="text"
                    required
                    placeholder="Nasr City Branch"
                    value={editingBranch.name || ""}
                    onChange={(e) => setEditingBranch({ ...editingBranch, name: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-right">
                <div>
                  <label className="block text-xxs font-bold text-slate-400 mb-1.5">عنوان الفرع بالتفصيل</label>
                  <input
                    type="text"
                    placeholder="شارع عباس العقاد، بجوار كوك دور"
                    value={editingBranch.address || ""}
                    onChange={(e) => setEditingBranch({ ...editingBranch, address: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xxs font-bold text-slate-400 mb-1.5">رقم هاتف الفرع</label>
                  <input
                    type="text"
                    placeholder="0222718290"
                    value={editingBranch.phone || ""}
                    onChange={(e) => setEditingBranch({ ...editingBranch, phone: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 text-right">
                <div>
                  <label className="block text-xxs font-bold text-slate-400 mb-1.5">وقت تحضير الطلب (دقيقة)</label>
                  <input
                    type="number"
                    value={editingBranch.estimatedWaitMinutes || 15}
                    onChange={(e) => setEditingBranch({ ...editingBranch, estimatedWaitMinutes: parseInt(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xxs font-bold text-slate-400 mb-1.5">الحد الأدنى للتوصيل (EGP)</label>
                  <input
                    type="number"
                    value={editingBranch.minOrderDelivery || 40}
                    onChange={(e) => setEditingBranch({ ...editingBranch, minOrderDelivery: parseFloat(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xxs font-bold text-slate-400 mb-1.5">سعر التوصيل الأساسي (EGP)</label>
                  <input
                    type="number"
                    value={editingBranch.deliveryFeeBase || 10}
                    onChange={(e) => setEditingBranch({ ...editingBranch, deliveryFeeBase: parseFloat(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-right">
                <div>
                  <label className="block text-xxs font-bold text-slate-400 mb-1.5">شعار أو لوجو الفرع (URL)</label>
                  <input
                    type="text"
                    placeholder="https://images.unsplash.com/..."
                    value={editingBranch.logo || ""}
                    onChange={(e) => setEditingBranch({ ...editingBranch, logo: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xxs font-bold text-slate-400 mb-1.5">كود لون الهوية للفرع</label>
                  <input
                    type="color"
                    value={editingBranch.primaryColor || "#4f46e5"}
                    onChange={(e) => setEditingBranch({ ...editingBranch, primaryColor: e.target.value })}
                    className="w-full h-10 bg-slate-900 border border-slate-800 rounded-lg p-1 text-xs text-white cursor-pointer"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-850 flex justify-end gap-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-650 hover:bg-indigo-750 text-xs font-bold text-white rounded-xl shadow cursor-pointer"
                >
                  حفظ التعديلات
                </button>
                <button
                  type="button"
                  onClick={() => setEditingBranch(null)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-xs font-bold text-slate-400 rounded-xl cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
