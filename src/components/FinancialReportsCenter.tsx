import React, { useState, useEffect } from "react";
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  DollarSign, 
  CreditCard, 
  Layers, 
  Box, 
  PieChart, 
  Percent, 
  ChevronRight, 
  Download, 
  Printer, 
  Plus, 
  Trash2, 
  AlertTriangle, 
  CheckCircle, 
  Info, 
  ArrowLeftRight, 
  ShoppingBag, 
  Building, 
  Sliders, 
  FileText, 
  RefreshCw,
  Eye,
  Settings
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart as RePieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from "recharts";

// Predefined date helpers
const getTodayDate = () => new Date().toISOString().substring(0, 10);

const getPredefinedDates = (period: string) => {
  const today = new Date();
  let from = getTodayDate();
  let to = getTodayDate();

  if (period === "yesterday") {
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    from = yesterday.toISOString().substring(0, 10);
    to = yesterday.toISOString().substring(0, 10);
  } else if (period === "thisWeek") {
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Monday
    const monday = new Date(today.setDate(diff));
    from = monday.toISOString().substring(0, 10);
    to = getTodayDate();
  } else if (period === "thisMonth") {
    from = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().substring(0, 10);
    to = getTodayDate();
  } else if (period === "lastMonth") {
    const firstDay = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth(), 0);
    from = firstDay.toISOString().substring(0, 10);
    to = lastDay.toISOString().substring(0, 10);
  }
  return { from, to };
};

const getPreviousPeriodDates = (fromStr: string, toStr: string) => {
  const from = new Date(fromStr);
  const to = new Date(toStr);
  const diffTime = Math.abs(to.getTime() - from.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  
  const prevTo = new Date(from);
  prevTo.setDate(prevTo.getDate() - 1);
  const prevFrom = new Date(prevTo);
  prevFrom.setDate(prevFrom.getDate() - diffDays + 1);
  
  return {
    from: prevFrom.toISOString().substring(0, 10),
    to: prevTo.toISOString().substring(0, 10)
  };
};

const COLORS = ["#4f46e5", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

interface ReportsCenterProps {
  saasTier?: number;
}

export default function FinancialReportsCenter({ saasTier = 4 }: ReportsCenterProps) {
  // Main and sub tab states
  const [activeTab, setActiveTab] = useState<"overview" | "sales" | "payments" | "items" | "inventory" | "profitability" | "branches" | "fixed-expenses">("overview");

  // Filters State
  const [period, setPeriod] = useState<string>(() => localStorage.getItem("rep_period") || "thisMonth");
  const [from, setFrom] = useState<string>(() => localStorage.getItem("rep_from") || getPredefinedDates("thisMonth").from);
  const [to, setTo] = useState<string>(() => localStorage.getItem("rep_to") || getPredefinedDates("thisMonth").to);
  const [comparePeriod, setComparePeriod] = useState<string>(() => localStorage.getItem("rep_comparePeriod") || "previous_period");
  const [compareFrom, setCompareFrom] = useState<string>(() => localStorage.getItem("rep_compareFrom") || getPreviousPeriodDates(getPredefinedDates("thisMonth").from, getPredefinedDates("thisMonth").to).from);
  const [compareTo, setCompareTo] = useState<string>(() => localStorage.getItem("rep_compareTo") || getPreviousPeriodDates(getPredefinedDates("thisMonth").from, getPredefinedDates("thisMonth").to).to);
  
  const [branchFilter, setBranchFilter] = useState<string>(() => localStorage.getItem("rep_branchFilter") || "all");
  const [fulfillmentFilter, setFulfillmentFilter] = useState<string>(() => localStorage.getItem("rep_fulfillmentFilter") || "all");
  const [sourceFilter, setSourceFilter] = useState<string>(() => localStorage.getItem("rep_sourceFilter") || "all");

  // Active Tab Data state
  const [loading, setLoading] = useState<boolean>(true);
  const [reportData, setReportData] = useState<any>(null);

  // Sales granularity
  const [salesGranularity, setSalesGranularity] = useState<"daily" | "hourly" | "weekly" | "monthly">("daily");

  // Items sorting/filtering
  const [itemsCategory, setItemsCategory] = useState<string>("All");
  const [itemsSortBy, setItemsSortBy] = useState<string>("quantity");
  const [itemsSortDir, setItemsSortDir] = useState<"asc" | "desc">("desc");

  // Fixed Expenses Crud state
  const [expensesList, setExpensesList] = useState<any[]>([]);
  const [showAddExpense, setShowAddExpense] = useState<boolean>(false);
  const [newExp, setNewExp] = useState({
    name: "",
    nameAr: "",
    category: "rent",
    amount: "",
    branchId: "all",
    frequency: "monthly",
    effectiveFrom: "",
    notes: ""
  });

  // Persist filter settings to localStorage
  useEffect(() => {
    localStorage.setItem("rep_period", period);
    localStorage.setItem("rep_from", from);
    localStorage.setItem("rep_to", to);
    localStorage.setItem("rep_comparePeriod", comparePeriod);
    localStorage.setItem("rep_compareFrom", compareFrom);
    localStorage.setItem("rep_compareTo", compareTo);
    localStorage.setItem("rep_branchFilter", branchFilter);
    localStorage.setItem("rep_fulfillmentFilter", fulfillmentFilter);
    localStorage.setItem("rep_sourceFilter", sourceFilter);
  }, [period, from, to, comparePeriod, compareFrom, compareTo, branchFilter, fulfillmentFilter, sourceFilter]);

  // Adjust date filters on period change
  const handlePeriodChange = (val: string) => {
    setPeriod(val);
    if (val !== "custom") {
      const dates = getPredefinedDates(val);
      setFrom(dates.from);
      setTo(dates.to);
      if (comparePeriod === "previous_period") {
        const prev = getPreviousPeriodDates(dates.from, dates.to);
        setCompareFrom(prev.from);
        setCompareTo(prev.to);
      }
    }
  };

  const handleCustomDateChange = (type: "from" | "to", val: string) => {
    if (type === "from") {
      setFrom(val);
      if (comparePeriod === "previous_period") {
        const prev = getPreviousPeriodDates(val, to);
        setCompareFrom(prev.from);
        setCompareTo(prev.to);
      }
    } else {
      setTo(val);
      if (comparePeriod === "previous_period") {
        const prev = getPreviousPeriodDates(from, val);
        setCompareFrom(prev.from);
        setCompareTo(prev.to);
      }
    }
  };

  const handleComparePeriodChange = (val: string) => {
    setComparePeriod(val);
    if (val === "previous_period") {
      const prev = getPreviousPeriodDates(from, to);
      setCompareFrom(prev.from);
      setCompareTo(prev.to);
    } else {
      setCompareFrom("");
      setCompareTo("");
    }
  };

  // Fetch Report Data
  const fetchReport = async () => {
    setLoading(true);
    try {
      let url = `/api/reports/${activeTab}?from=${from}&to=${to}&branchId=${branchFilter}&fulfillmentType=${fulfillmentFilter}&orderSource=${sourceFilter}`;
      if (compareFrom && compareTo) {
        url += `&compareFrom=${compareFrom}&compareTo=${compareTo}`;
      }
      
      if (activeTab === "sales") {
        url += `&granularity=${salesGranularity}`;
      } else if (activeTab === "items") {
        url += `&categoryId=${itemsCategory}&sortBy=${itemsSortBy}&sortDir=${itemsSortDir}`;
      }

      const res = await fetch(url);
      const data = await res.json();
      setReportData(data);
    } catch (err) {
      console.error("Error fetching financial report:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchExpenses = async () => {
    try {
      const res = await fetch("/api/reports/fixed-expenses");
      const data = await res.json();
      setExpensesList(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [activeTab, from, to, compareFrom, compareTo, branchFilter, fulfillmentFilter, sourceFilter, salesGranularity, itemsCategory, itemsSortBy, itemsSortDir]);

  useEffect(() => {
    if (activeTab === "fixed-expenses" || activeTab === "profitability") {
      fetchExpenses();
    }
  }, [activeTab]);

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExp.name || !newExp.amount) return;

    try {
      const res = await fetch("/api/reports/fixed-expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newExp,
          amount: Math.round(parseFloat(newExp.amount) * 100) // to piasters
        })
      });
      if (res.ok) {
        setNewExp({
          name: "",
          nameAr: "",
          category: "rent",
          amount: "",
          branchId: "all",
          frequency: "monthly",
          effectiveFrom: "",
          notes: ""
        });
        setShowAddExpense(false);
        fetchExpenses();
        fetchReport();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا المصروف؟")) return;
    try {
      const res = await fetch(`/api/reports/fixed-expenses/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchExpenses();
        fetchReport();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Export functions
  const exportCSV = (dataList: any[], filename: string) => {
    if (!dataList || dataList.length === 0) return;
    const headers = Object.keys(dataList[0]).join(",");
    const rows = dataList.map(row => 
      Object.values(row).map(val => {
        const str = String(val).replace(/"/g, '""');
        return str.includes(",") ? `"${str}"` : str;
      }).join(",")
    );
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  // Formatting helpers
  const formatEGP = (num: number) => {
    return new Intl.NumberFormat("ar-EG", { style: "currency", currency: "EGP" }).format(num);
  };

  const getPercentChange = (current: number, previous: number) => {
    if (!previous || previous === 0) return null;
    const diff = current - previous;
    return (diff / previous) * 100;
  };

  const renderTrendBadge = (curr: number, prev?: number) => {
    if (prev === undefined) return null;
    const percent = getPercentChange(curr, prev);
    if (percent === null) return null;
    const isPositive = percent >= 0;
    
    return (
      <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${
        isPositive ? "bg-emerald-55 text-emerald-700" : "bg-rose-55 text-rose-700"
      }`}>
        {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
        {isPositive ? "+" : ""}{percent.toFixed(1)}%
      </span>
    );
  };

  return (
    <div className="space-y-6 text-slate-800 font-sans" id="financial-reports-hub" dir="rtl">
      {/* 1. Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-xxs">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight font-display flex items-center gap-2">
            <Layers className="w-6 h-6 text-indigo-650" />
            مركز التقارير المالية والتحليل الإستراتيجي
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            متابعة فورية للمبيعات، ربحية الأصناف، جرد المخزون، والمصاريف الثابتة مع المقارنة بالفترات السابقة للفروع.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handlePrint}
            className="p-2.5 text-slate-600 hover:text-indigo-650 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-100 rounded-xl transition-all cursor-pointer"
            title="طباعة التقرير"
          >
            <Printer className="w-4 h-4" />
          </button>
          <button 
            onClick={fetchReport}
            className="p-2.5 text-slate-600 hover:text-indigo-650 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-100 rounded-xl transition-all cursor-pointer"
            title="تحديث البيانات"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. UNIVERSAL FILTER BAR */}
      <div className="bg-white p-6 rounded-3xl border border-slate-150/80 shadow-xxs space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Period Filter */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-indigo-650" />
              الفترة الزمنية
            </label>
            <select 
              value={period} 
              onChange={(e) => handlePeriodChange(e.target.value)}
              className="w-full text-xs font-semibold bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-2.5 focus:border-indigo-650 focus:bg-white transition-colors cursor-pointer"
            >
              <option value="today">اليوم (مباشر)</option>
              <option value="yesterday">أمس</option>
              <option value="thisWeek">هذا الأسبوع</option>
              <option value="thisMonth">هذا الشهر</option>
              <option value="lastMonth">الشهر الماضي</option>
              <option value="custom">تاريخ مخصص...</option>
            </select>
          </div>

          {/* Dates Selection (Enabled for Custom) */}
          <div className="space-y-1.5 md:col-span-1">
            <label className="text-xs font-bold text-slate-600">التاريخ من / إلى</label>
            <div className="flex items-center gap-2">
              <input 
                type="date" 
                value={from}
                onChange={(e) => handleCustomDateChange("from", e.target.value)}
                disabled={period !== "custom"}
                className="w-full text-xs font-semibold bg-slate-50/50 disabled:opacity-65 border border-slate-200 rounded-xl px-3 py-2 focus:border-indigo-650 focus:bg-white transition-all cursor-pointer"
              />
              <span className="text-xs font-bold text-slate-400">إلى</span>
              <input 
                type="date" 
                value={to}
                onChange={(e) => handleCustomDateChange("to", e.target.value)}
                disabled={period !== "custom"}
                className="w-full text-xs font-semibold bg-slate-50/50 disabled:opacity-65 border border-slate-200 rounded-xl px-3 py-2 focus:border-indigo-650 focus:bg-white transition-all cursor-pointer"
              />
            </div>
          </div>

          {/* Comparison Period */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
              <ArrowLeftRight className="w-3.5 h-3.5 text-amber-500" />
              مقارنة بالفترة المرجعية
            </label>
            <select 
              value={comparePeriod} 
              onChange={(e) => handleComparePeriodChange(e.target.value)}
              className="w-full text-xs font-semibold bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-2.5 focus:border-indigo-650 focus:bg-white transition-colors cursor-pointer"
            >
              <option value="previous_period">الفترة السابقة مباشرة</option>
              <option value="none">بدون مقارنة</option>
            </select>
          </div>

          {/* Branch Filter */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-emerald-500" />
              الفرع المستهدف
            </label>
            <select 
              value={branchFilter} 
              onChange={(e) => setBranchFilter(e.target.value)}
              className="w-full text-xs font-semibold bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-2.5 focus:border-indigo-650 focus:bg-white transition-colors cursor-pointer"
            >
              <option value="all">كافة الفروع والمواقع</option>
              <option value="branch-a">فرع المعادي الرئيسي</option>
              <option value="branch-b">فرع مصر الجديدة</option>
            </select>
          </div>
        </div>

        {/* Advanced Filters Drawer (Fulfillment Type & Order Source) */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex flex-wrap gap-3 items-center">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">تصفية متقدمة:</span>
            {/* Fulfillment */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-150 px-3 py-1 rounded-full text-xs">
              <span className="text-slate-500 font-semibold">قناة الخدمة:</span>
              <select 
                value={fulfillmentFilter} 
                onChange={(e) => setFulfillmentFilter(e.target.value)}
                className="bg-transparent border-none text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="all">الكل</option>
                <option value="dine_in">صالة (Dine-in)</option>
                <option value="takeaway">تيك أواي</option>
                <option value="delivery">توصيل</option>
              </select>
            </div>
            {/* Order Source */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-150 px-3 py-1 rounded-full text-xs">
              <span className="text-slate-500 font-semibold">مصدر الطلب:</span>
              <select 
                value={sourceFilter} 
                onChange={(e) => setSourceFilter(e.target.value)}
                className="bg-transparent border-none text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="all">الكل</option>
                <option value="pos">الكاشير / POS</option>
                <option value="app">تطبيق الهاتف</option>
                <option value="aggregator">منصات التوصيل (Talabat/Careem)</option>
              </select>
            </div>
          </div>

          {compareFrom && compareTo && (
            <div className="text-[11px] font-bold text-slate-400 bg-slate-50 px-3 py-1 rounded-lg">
              الفترة المرجعية المقارنة: <span className="text-slate-600">{compareFrom}</span> إلى <span className="text-slate-600">{compareTo}</span>
            </div>
          )}
        </div>
      </div>

      {/* 3. REPORT CENTER SIDEBAR NAVIGATION & DETAILS CONTAINER */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Reports Navigation Sidebar */}
        <div className="lg:col-span-1 bg-white p-4 rounded-3xl border border-slate-100 shadow-xxs space-y-2">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-3 mb-3">أقسام التقارير</p>
          
          {[
            { id: "overview", label: "لوحة الملخص", icon: TrendingUp, color: "text-indigo-600" },
            { id: "sales", label: "المبيعات والإيرادات", icon: DollarSign, color: "text-emerald-600" },
            { id: "payments", label: "طرق الدفع", icon: CreditCard, color: "text-amber-500" },
            { id: "items", label: "الأصناف والمنيو", icon: Layers, color: "text-purple-600" },
            { id: "inventory", label: "الجرد والمخزون", icon: Box, color: "text-blue-500" },
            { id: "profitability", label: "التكاليف والربحية", icon: Percent, color: "text-rose-500" },
            { id: "branches", label: "مقارنة الفروع", icon: Building, color: "text-slate-600" },
            { id: "fixed-expenses", label: "المصاريف الثابتة", icon: Settings, color: "text-indigo-650" },
          ].map((nav) => {
            const Icon = nav.icon;
            const isActive = activeTab === nav.id;
            return (
              <button
                key={nav.id}
                onClick={() => {
                  setActiveTab(nav.id as any);
                  setReportData(null);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl transition-all cursor-pointer text-right ${
                  isActive 
                    ? "bg-slate-900 text-white shadow-sm font-bold" 
                    : "hover:bg-slate-50 text-slate-600 font-semibold"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? "text-white" : nav.color}`} />
                  <span className="text-xs">{nav.label}</span>
                </div>
                <ChevronRight className={`w-3.5 h-3.5 ${isActive ? "text-white" : "text-slate-350"}`} />
              </button>
            );
          })}
        </div>

        {/* Detailed Report Content Area */}
        <div className="lg:col-span-4 min-h-[450px]">
          {loading ? (
            <div className="w-full h-full min-h-[400px] bg-white rounded-3xl border border-slate-100 flex flex-col items-center justify-center space-y-4">
              <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-650 rounded-full animate-spin"></div>
              <p className="text-xs font-bold text-slate-400">جاري تجميع البيانات المالية وتحليل السجلات...</p>
            </div>
          ) : !reportData ? (
            <div className="w-full h-full min-h-[400px] bg-white rounded-3xl border border-slate-100 flex flex-col items-center justify-center space-y-4 text-center p-6">
              <AlertTriangle className="w-12 h-12 text-amber-500 animate-bounce" />
              <h3 className="text-sm font-bold text-slate-900">حدث خطأ في تحميل البيانات</h3>
              <p className="text-xs text-slate-500">نواجه مشكلة في الاتصال بالخادم. يرجى إعادة المحاولة.</p>
              <button onClick={fetchReport} className="px-4 py-2 bg-indigo-650 text-white rounded-xl text-xs font-bold">إعادة المحاولة</button>
            </div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              
              {/* SECTION A: OVERVIEW DASHBOARD */}
              {activeTab === "overview" && (
                <div className="space-y-6">
                  {/* KPI Row 1 */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Gross Sales */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xxs">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">إجمالي المبيعات (Gross)</p>
                          <h4 className="text-xl font-black text-slate-900 mt-1 font-mono">
                            {formatEGP(reportData.current.grossSales)}
                          </h4>
                        </div>
                        <div className="w-8 h-8 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-650">
                          <DollarSign className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="mt-3 flex items-center gap-1.5">
                        {renderTrendBadge(reportData.current.grossSales, reportData.previous?.grossSales)}
                        <span className="text-[10px] text-slate-400">مقارنة بالسابق</span>
                      </div>
                    </div>

                    {/* Net Revenue */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xxs">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">صافي الإيرادات (Net)</p>
                          <h4 className="text-xl font-black text-slate-900 mt-1 font-mono">
                            {formatEGP(reportData.current.netRevenue)}
                          </h4>
                        </div>
                        <div className="w-8 h-8 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                          <TrendingUp className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="mt-3 flex items-center gap-1.5">
                        {renderTrendBadge(reportData.current.netRevenue, reportData.previous?.netRevenue)}
                        <span className="text-[10px] text-slate-400">بعد استبعاد الضريبة والخصم</span>
                      </div>
                    </div>

                    {/* Orders Count */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xxs">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">عدد الطلبات المكتملة</p>
                          <h4 className="text-xl font-black text-slate-900 mt-1 font-mono">
                            {reportData.current.ordersCount} طلب
                          </h4>
                        </div>
                        <div className="w-8 h-8 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600">
                          <ShoppingBag className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="mt-3 flex items-center gap-1.5">
                        {renderTrendBadge(reportData.current.ordersCount, reportData.previous?.ordersCount)}
                        <span className="text-[10px] text-slate-400 font-sans">معدل تشغيل الفترات</span>
                      </div>
                    </div>

                    {/* AOV */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xxs">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">متوسط قيمة الطلب (AOV)</p>
                          <h4 className="text-xl font-black text-slate-900 mt-1 font-mono">
                            {formatEGP(reportData.current.averageOrderValue)}
                          </h4>
                        </div>
                        <div className="w-8 h-8 bg-amber-50 rounded-xl flex items-center justify-center text-amber-500">
                          <ArrowLeftRight className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="mt-3 flex items-center gap-1.5">
                        {renderTrendBadge(reportData.current.averageOrderValue, reportData.previous?.averageOrderValue)}
                        <span className="text-[10px] text-slate-400">متوسط قيمة سلة العميل</span>
                      </div>
                    </div>
                  </div>

                  {/* KPI Row 2 - Secondary Metrics */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {/* Cash */}
                    <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 flex items-center justify-between">
                      <div>
                        <p className="text-[9px] font-bold text-slate-400">النقد المحصل (Cash)</p>
                        <p className="text-xs font-bold text-slate-800 mt-0.5 font-mono">{formatEGP(reportData.current.cashSales)}</p>
                      </div>
                      <span className="text-[9px] font-extrabold text-indigo-650 bg-indigo-50 px-2 py-0.5 rounded-full">نقدياً</span>
                    </div>

                    {/* Tax */}
                    <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 flex items-center justify-between">
                      <div>
                        <p className="text-[9px] font-bold text-slate-400">ضريبة القيمة المضافة (Tax)</p>
                        <p className="text-xs font-bold text-slate-800 mt-0.5 font-mono">{formatEGP(reportData.current.taxAmount)}</p>
                      </div>
                      <span className="text-[9px] font-extrabold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">محصلة</span>
                    </div>

                    {/* Discount */}
                    <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 flex items-center justify-between">
                      <div>
                        <p className="text-[9px] font-bold text-slate-400">إجمالي الخصومات (Discount)</p>
                        <p className="text-xs font-bold text-slate-800 mt-0.5 font-mono">{formatEGP(reportData.current.discountAmount)}</p>
                      </div>
                      <span className="text-[9px] font-extrabold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">تخفيضات</span>
                    </div>

                    {/* Voided */}
                    <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 flex items-center justify-between">
                      <div>
                        <p className="text-[9px] font-bold text-slate-400">الطلبات الملغاة والملغاة</p>
                        <p className="text-xs font-bold text-slate-800 mt-0.5 font-mono">{formatEGP(reportData.current.voidedAmount)}</p>
                      </div>
                      <span className="text-[9px] font-extrabold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">تعديل</span>
                    </div>
                  </div>

                  {/* Revenue Trend Chart & Breakdown */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Line Chart */}
                    <div className="lg:col-span-2 bg-white p-5 rounded-3xl border border-slate-100 shadow-xxs">
                      <h3 className="text-xs font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-indigo-650" />
                        منحنى تطور المبيعات اليومية والمقارنة بالمرجع
                      </h3>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={reportData.revenueByDay}>
                            <defs>
                              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2}/>
                                <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} />
                            <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                            <Tooltip formatter={(value) => formatEGP(Number(value))} />
                            <Legend fontSize={10} />
                            <Area type="monotone" name="الفترة الحالية" dataKey="revenue" stroke="#4f46e5" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRevenue)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Breakdown Pie Charts */}
                    <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xxs flex flex-col justify-between">
                      <div>
                        <h3 className="text-xs font-bold text-slate-900 mb-4">قنوات توزيع الإيراد</h3>
                        <div className="h-40 relative flex items-center justify-center">
                          <ResponsiveContainer width="100%" height="100%">
                            <RePieChart>
                              <Pie
                                data={[
                                  { name: "صالة", value: reportData.breakdowns.current.fulfillment.dine_in },
                                  { name: "تيك أواي", value: reportData.breakdowns.current.fulfillment.takeaway },
                                  { name: "توصيل فرعي", value: reportData.breakdowns.current.fulfillment.delivery }
                                ]}
                                cx="50%"
                                cy="50%"
                                innerRadius={45}
                                outerRadius={60}
                                paddingAngle={5}
                                dataKey="value"
                              >
                                {[0, 1, 2].map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index]} />
                                ))}
                              </Pie>
                              <Tooltip formatter={(value) => formatEGP(Number(value))} />
                            </RePieChart>
                          </ResponsiveContainer>
                          <div className="absolute text-center">
                            <p className="text-[9px] font-bold text-slate-400">إجمالي الموزع</p>
                            <p className="text-sm font-black text-slate-900 mt-0.5">{formatEGP(reportData.current.netRevenue)}</p>
                          </div>
                        </div>
                      </div>

                      {/* Legends */}
                      <div className="space-y-2 mt-4">
                        {[
                          { name: "صالة (Dine-in)", value: reportData.breakdowns.current.fulfillment.dine_in, color: COLORS[0] },
                          { name: "تيك أواي (Takeaway)", value: reportData.breakdowns.current.fulfillment.takeaway, color: COLORS[1] },
                          { name: "توصيل فرعي (Delivery)", value: reportData.breakdowns.current.fulfillment.delivery, color: COLORS[2] }
                        ].map((item, index) => {
                          const total = reportData.current.netRevenue || 1;
                          const pct = (item.value / total) * 100;
                          return (
                            <div key={index} className="flex justify-between items-center text-xs">
                              <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                                <span className="text-slate-600 font-semibold">{item.name}</span>
                              </div>
                              <span className="font-mono font-bold text-slate-800">{pct.toFixed(1)}%</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Top Selling Items & Highlights Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Top Items Table */}
                    <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xxs">
                      <h3 className="text-xs font-bold text-slate-900 mb-3 flex items-center gap-2">
                        <ShoppingBag className="w-4 h-4 text-purple-500" />
                        الأصناف الخمسة الأكثر مبيعاً (من حيث الكمية)
                      </h3>
                      <div className="overflow-x-auto">
                        <table className="w-full text-right text-xs">
                          <thead>
                            <tr className="border-b border-slate-100 text-slate-400 font-bold">
                              <th className="py-2.5">اسم الصنف</th>
                              <th className="py-2.5 text-center">الكمية المباعة</th>
                              <th className="py-2.5 text-left">إجمالي قيمة المبيعات</th>
                            </tr>
                          </thead>
                          <tbody>
                            {reportData.topItems.map((it: any, index: number) => (
                              <tr key={index} className="border-b border-slate-50 hover:bg-slate-50/50">
                                <td className="py-3 font-semibold text-slate-800 flex items-center gap-2">
                                  <span className="w-5 h-5 rounded-lg bg-indigo-50 text-indigo-650 flex items-center justify-center text-[10px] font-black">
                                    {index + 1}
                                  </span>
                                  {it.name}
                                </td>
                                <td className="py-3 text-center font-bold font-mono">{it.quantity} وحدة</td>
                                <td className="py-3 text-left font-bold font-mono text-emerald-600">{formatEGP(it.revenue)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Highlights & Quick Insights */}
                    <div className="bg-gradient-to-br from-indigo-950 to-slate-900 p-6 rounded-3xl text-white flex flex-col justify-between">
                      <div>
                        <span className="text-[9px] text-indigo-300 font-black uppercase tracking-widest bg-indigo-900/55 px-2.5 py-1 rounded-full">
                          ذكاء الأعمال الفوري (Business Insights)
                        </span>
                        <h4 className="text-base font-extrabold mt-3 text-white">الفرع الأكثر أداءً وملاحظات التشغيل</h4>
                        <p className="text-xs text-indigo-100 leading-relaxed mt-2">
                          يقود <b>{reportData.topBranch.nameAr}</b> قنوات المبيعات بإجمالي إيراد محقق تبلغ قيمته <span className="text-amber-300 font-black font-mono">{formatEGP(reportData.topBranch.sales)}</span> خلال الفترة المحددة.
                        </p>
                      </div>

                      <div className="space-y-3 mt-4 pt-4 border-t border-indigo-800/60">
                        <div className="flex items-start gap-3">
                          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <div className="text-xs">
                            <p className="font-bold text-white">مؤشر سلة العميل (AOV)</p>
                            <p className="text-indigo-200 mt-0.5">متوسط فاتورة العميل الحالية مستقر، مما يدل على نجاح سياسات التسعير وعروض الأصناف الجانبية.</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <Info className="w-4 h-4 text-indigo-300 shrink-0 mt-0.5" />
                          <div className="text-xs">
                            <p className="font-bold text-white">تحسين توزيع القنوات</p>
                            <p className="text-indigo-200 mt-0.5">تبين أن التوصيل المباشر أو غير المباشر يساهم بحصة جيدة، ننصح بزيادة حملات الترويج المباشر للهاتف.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION B: SALES & REVENUE */}
              {activeTab === "sales" && (
                <div className="space-y-6">
                  {/* Controls Row */}
                  <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xxs flex justify-between items-center flex-wrap gap-2">
                    <h3 className="text-xs font-bold text-slate-800">تفاصيل توزيع المبيعات الإجمالية</h3>
                    <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                      {[
                        { id: "daily", label: "يومي" },
                        { id: "weekly", label: "أسبوعي" },
                        { id: "monthly", label: "شهري" },
                        { id: "hourly", label: "ساعي" },
                      ].map(g => (
                        <button
                          key={g.id}
                          onClick={() => setSalesGranularity(g.id as any)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            salesGranularity === g.id 
                              ? "bg-white text-slate-900 shadow-xxs" 
                              : "text-slate-500 hover:text-slate-800"
                          }`}
                        >
                          {g.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Revenue Stacked Bar Chart */}
                  <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xxs">
                    <h3 className="text-xs font-bold text-slate-900 mb-4">المبيعات المقسمة وفق قنوات التوزيع عبر الوقت</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={reportData.periodBreakdown}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="period" stroke="#94a3b8" fontSize={10} tickLine={false} />
                          <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                          <Tooltip formatter={(value) => formatEGP(Number(value))} />
                          <Legend />
                          <Bar name="صالة" dataKey="dineIn" stackId="a" fill="#4f46e5" />
                          <Bar name="تيك أواي" dataKey="takeaway" stackId="a" fill="#10b981" />
                          <Bar name="توصيل" dataKey="delivery" stackId="a" fill="#f59e0b" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Hourly Heatmap Grid */}
                  <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xxs">
                    <h3 className="text-xs font-bold text-slate-900 mb-3 flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-indigo-650" />
                      خريطة الحرارة لضغط المبيعات (أيام الأسبوع × الساعات)
                    </h3>
                    <p className="text-[11px] text-slate-400 mb-4">كثافة تركيز المبيعات لتحديد الساعات الذهبية وضغوطات تحضير المطبخ.</p>
                    
                    <div className="overflow-x-auto">
                      <div className="min-w-[600px] grid grid-cols-15 gap-1.5 text-center text-[10px]">
                        {/* Header Row */}
                        <div className="col-span-2 font-bold text-slate-500 py-1 text-right">اليوم</div>
                        {Array.from({ length: 14 }).map((_, i) => {
                          const h = i + 9;
                          const formattedHour = h > 12 ? `${h-12} م` : `${h} ص`;
                          return (
                            <div key={i} className="font-bold text-slate-400 py-1 font-mono">{formattedHour}</div>
                          );
                        })}

                        {/* Data rows mapped deterministically */}
                        {["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"].map((day, dIdx) => {
                          return (
                            <React.Fragment key={dIdx}>
                              <div className="col-span-2 font-bold text-slate-700 py-1.5 text-right flex items-center">{day}</div>
                              {Array.from({ length: 14 }).map((_, hIdx) => {
                                const h = hIdx + 9;
                                // Find value from flatHeatmap
                                const match = reportData.flatHeatmap.find((fh: any) => fh.day === day && parseInt(fh.hour) === h);
                                const val = match ? match.sales : 0;
                                
                                // Color scale logic
                                let bg = "bg-slate-50 text-slate-300";
                                if (val > 3000) bg = "bg-indigo-600 text-white font-extrabold shadow-xxs";
                                else if (val > 1500) bg = "bg-indigo-400 text-white font-bold";
                                else if (val > 500) bg = "bg-indigo-200 text-indigo-950 font-semibold";
                                else if (val > 0) bg = "bg-indigo-50 text-indigo-900";

                                return (
                                  <div 
                                    key={hIdx} 
                                    className={`py-2 rounded-lg transition-all text-[9px] flex items-center justify-center font-mono ${bg}`}
                                    title={`${day} ساعة ${h}: ${formatEGP(val)}`}
                                  >
                                    {val > 0 ? Math.round(val) : "-"}
                                  </div>
                                );
                              })}
                            </React.Fragment>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Revenue Summary Table */}
                  <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xxs">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xs font-bold text-slate-900">جدول تقرير تحليل الإيرادات الدوري</h3>
                      <button 
                        onClick={() => exportCSV(reportData.periodBreakdown, `sales_report_${from}_to_${to}.csv`)}
                        className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-650 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        تصدير الملف CSV
                      </button>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-right text-xs">
                        <thead>
                          <tr className="border-b border-slate-100 text-slate-400 font-bold">
                            <th className="py-2.5">الفترة الزمنية</th>
                            <th className="py-2.5 text-center">الطلبات</th>
                            <th className="py-2.5 text-left">إجمالي المبيعات</th>
                            <th className="py-2.5 text-left">الخصوم الممنوحة</th>
                            <th className="py-2.5 text-left">صافي قبل الضريبة</th>
                            <th className="py-2.5 text-left">الضريبة المضافة</th>
                            <th className="py-2.5 text-left">الصافي النهائي</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reportData.periodBreakdown.map((row: any, idx: number) => (
                            <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50/50">
                              <td className="py-3 font-semibold text-slate-800 font-mono">{row.period}</td>
                              <td className="py-3 text-center font-bold font-mono">{row.orders}</td>
                              <td className="py-3 text-left font-bold font-mono text-slate-700">{formatEGP(row.totalSales)}</td>
                              <td className="py-3 text-left font-bold font-mono text-rose-600">{formatEGP(row.discounts)}</td>
                              <td className="py-3 text-left font-bold font-mono text-slate-700">{formatEGP(row.netRevenue - row.tax)}</td>
                              <td className="py-3 text-left font-bold font-mono text-slate-500">{formatEGP(row.tax)}</td>
                              <td className="py-3 text-left font-bold font-mono text-emerald-600">{formatEGP(row.netRevenue)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION C: PAYMENT METHODS */}
              {activeTab === "payments" && (
                <div className="space-y-6">
                  {/* Payments Breakdown Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { key: "cash", label: "نقدية (Cash)", color: "text-emerald-600", bg: "bg-emerald-50" },
                      { key: "card", label: "شبكة / بطاقة مالي", color: "text-indigo-650", bg: "bg-indigo-50" },
                      { key: "digital_wallet", label: "محافظ إلكترونية", color: "text-amber-500", bg: "bg-amber-50" },
                      { key: "split", label: "مدفوعات مجزأة", color: "text-purple-600", bg: "bg-purple-50" }
                    ].map((item, idx) => {
                      const data = reportData.methods[item.key] || { amount: 0, transactions: 0, avg: 0 };
                      return (
                        <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xxs">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-[10px] font-bold text-slate-400">{item.label}</p>
                              <h4 className="text-lg font-black text-slate-900 mt-1 font-mono">
                                {formatEGP(data.amount)}
                              </h4>
                            </div>
                            <div className={`w-8 h-8 ${item.bg} ${item.color} rounded-xl flex items-center justify-center`}>
                              <CreditCard className="w-4 h-4" />
                            </div>
                          </div>
                          <div className="mt-3 pt-3 border-t border-slate-50 flex justify-between text-[10px] text-slate-400 font-sans">
                            <span>العمليات: <b>{data.transactions}</b></span>
                            <span>متوسط العملية: <b className="text-slate-600 font-mono">{formatEGP(data.avg)}</b></span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Cash vs Digital and Card Network Breakdown */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Card Networks Visualizer */}
                    <div className="lg:col-span-2 bg-white p-5 rounded-3xl border border-slate-100 shadow-xxs">
                      <h3 className="text-xs font-bold text-slate-900 mb-4">توزيع مبيعات الفيزا والبطاقات البنكية</h3>
                      <div className="h-60">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={[
                            { name: "شبكة Visa", مبيعات: reportData.cardNetworks.Visa },
                            { name: "Mastercard", مبيعات: reportData.cardNetworks.Mastercard },
                            { name: "شبكة ميزة المصرية", مبيعات: reportData.cardNetworks.Meeza }
                          ]}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                            <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                            <Tooltip formatter={(value) => formatEGP(Number(value))} />
                            <Bar name="إجمالي المدفوع" dataKey="مبيعات" fill="#4f46e5" radius={[6, 6, 0, 0]}>
                              <Cell fill="#1e3a8a" />
                              <Cell fill="#ea580c" />
                              <Cell fill="#059669" />
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Cash vs Digital Mix Pie */}
                    <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xxs flex flex-col justify-between">
                      <div>
                        <h3 className="text-xs font-bold text-slate-900 mb-4">نسبة النقدية مقابل المدفوعات الرقمية</h3>
                        <div className="h-40 relative flex items-center justify-center">
                          <ResponsiveContainer width="100%" height="100%">
                            <RePieChart>
                              <Pie
                                data={[
                                  { name: "كاش", value: reportData.methods.cash.amount },
                                  { name: "رقمي وبطاقات", value: reportData.methods.card.amount + reportData.methods.digital_wallet.amount + reportData.methods.split.amount }
                                ]}
                                cx="50%"
                                cy="50%"
                                innerRadius={45}
                                outerRadius={60}
                                dataKey="value"
                              >
                                <Cell fill="#10b981" />
                                <Cell fill="#4f46e5" />
                              </Pie>
                              <Tooltip formatter={(value) => formatEGP(Number(value))} />
                            </RePieChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      <div className="space-y-2 mt-4">
                        <div className="flex justify-between items-center text-xs">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                            <span className="text-slate-600 font-semibold">تحصيل كاش (نقدية)</span>
                          </div>
                          <span className="font-mono font-bold text-slate-800">
                            {formatEGP(reportData.methods.cash.amount)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-indigo-650"></span>
                            <span className="text-slate-600 font-semibold">مدفوعات إلكترونية / بطاقات</span>
                          </div>
                          <span className="font-mono font-bold text-slate-800">
                            {formatEGP(reportData.methods.card.amount + reportData.methods.digital_wallet.amount + reportData.methods.split.amount)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Aggregators Settlement Table */}
                  <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xxs">
                    <h3 className="text-xs font-bold text-slate-900 mb-3">حسابات منصات التوصيل والتسويات المالية</h3>
                    <p className="text-[11px] text-slate-400 mb-4">ملخص مبيعات تطبيقات التوصيل المستحقة، بعد خصم العقد المعتمد والعمولة المعيارية.</p>

                    <div className="overflow-x-auto">
                      <table className="w-full text-right text-xs">
                        <thead>
                          <tr className="border-b border-slate-100 text-slate-400 font-bold">
                            <th className="py-2.5">اسم المنصة</th>
                            <th className="py-2.5 text-center">الطلبات</th>
                            <th className="py-2.5 text-left">مبيعات المنصة</th>
                            <th className="py-2.5 text-left">معدل العمولات</th>
                            <th className="py-2.5 text-left">قيمة العمولات المخصومة</th>
                            <th className="py-2.5 text-left">المستحق المحقق الصافي</th>
                            <th className="py-2.5 text-center">حالة التسوية</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reportData.aggregatorSettlement.map((row: any, idx: number) => {
                            const pct = row.sales > 0 ? (row.commission / row.sales) * 100 : 15;
                            return (
                              <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50/50">
                                <td className="py-3 font-semibold text-slate-800">{row.name}</td>
                                <td className="py-3 text-center font-bold font-mono">{row.orders}</td>
                                <td className="py-3 text-left font-bold font-mono text-slate-700">{formatEGP(row.sales)}</td>
                                <td className="py-3 text-left font-bold font-mono text-slate-500">{pct.toFixed(1)}%</td>
                                <td className="py-3 text-left font-bold font-mono text-rose-600">{formatEGP(row.commission)}</td>
                                <td className="py-3 text-left font-bold font-mono text-emerald-600">{formatEGP(row.net)}</td>
                                <td className="py-3 text-center">
                                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
                                    row.status.includes("✅") ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                                  }`}>
                                    {row.status}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION D: ITEM PERFORMANCE */}
              {activeTab === "items" && (
                <div className="space-y-6">
                  {/* Filter and Matrix Explanation */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* BCG Matrix quadrant visualizer */}
                    <div className="lg:col-span-2 bg-white p-5 rounded-3xl border border-slate-100 shadow-xxs">
                      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                        <div>
                          <h3 className="text-xs font-bold text-slate-900">مصفوفة هارفارد الهندسية لقائمة الطعام (BCG Matrix)</h3>
                          <p className="text-[10px] text-slate-400 mt-0.5">تصنيف علمي يربط حجم الطلب (الشعبية) مع هامش ربح كل صنف (الربحية).</p>
                        </div>
                        <select 
                          value={itemsCategory} 
                          onChange={(e) => setItemsCategory(e.target.value)}
                          className="text-[11px] font-bold bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none cursor-pointer"
                        >
                          <option value="All">جميع الفئات</option>
                          <option value="Mains">الرئيسية (Mains)</option>
                          <option value="Starters">المقبلات (Starters)</option>
                          <option value="Desserts">الحلويات</option>
                          <option value="Drinks">المشروبات</option>
                        </select>
                      </div>

                      {/* Graphic Grid */}
                      <div className="grid grid-cols-2 gap-4 h-72 text-right text-xs">
                        {/* STAR quadrant */}
                        <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100 flex flex-col justify-between">
                          <div>
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[9px] font-black rounded-md uppercase">النجم (Star)</span>
                            <p className="text-[11px] font-bold text-slate-700 mt-2">شعبية فائقة + ربحية عالية</p>
                            <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">أصناف قيادية تدعم النشاط. الإستراتيجية: حافظ على مواصفات الطهي والترويج المستمر.</p>
                          </div>
                          <span className="text-[10px] font-bold text-emerald-700">توصية: حماية الصنف وتثبيت الأسعار</span>
                        </div>

                        {/* PUZZLE quadrant */}
                        <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-100 flex flex-col justify-between">
                          <div>
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[9px] font-black rounded-md uppercase">اللغز (Puzzle)</span>
                            <p className="text-[11px] font-bold text-slate-700 mt-2">طلب منخفض + ربح ممتاز</p>
                            <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">أصناف عالية القيمة لكنها خاملة. الإستراتيجية: الترويج والدمج مع عروض جماعية.</p>
                          </div>
                          <span className="text-[10px] font-bold text-amber-700">توصية: دمج تسويقي وتغيير الموضع</span>
                        </div>

                        {/* PLOWHORSE quadrant */}
                        <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 flex flex-col justify-between">
                          <div>
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[9px] font-black rounded-md uppercase">الحصان (Plowhorse)</span>
                            <p className="text-[11px] font-bold text-slate-700 mt-2">شعبية ضخمة + ربح منخفض</p>
                            <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">عناصر تسحب الحشود لكن تكلفتها مرهقة. الإستراتيجية: تقليل حصص المكونات أو رفع السعر قليلاً.</p>
                          </div>
                          <span className="text-[10px] font-bold text-blue-700">توصية: هندسة التكاليف والمقادير</span>
                        </div>

                        {/* DOG quadrant */}
                        <div className="bg-rose-50/50 p-4 rounded-2xl border border-rose-100 flex flex-col justify-between">
                          <div>
                            <span className="px-2 py-0.5 bg-rose-100 text-rose-800 text-[9px] font-black rounded-md uppercase">الكلب (Dog)</span>
                            <p className="text-[11px] font-bold text-slate-700 mt-2">شعبية ميتة + ربح ضئيل</p>
                            <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">أصناف تأخذ مساحة مخزنية دون فائدة. الإستراتيجية: إلغاء التدريجي من قائمة الطعام أو إعادة الابتكار.</p>
                          </div>
                          <span className="text-[10px] font-bold text-rose-700">توصية: إزاحة وتطهير المنيو</span>
                        </div>
                      </div>
                    </div>

                    {/* Quick performance radar */}
                    <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xxs flex flex-col justify-between">
                      <h3 className="text-xs font-bold text-slate-900 mb-2">توزيع الأصناف جغرافياً وفئات المبيعات</h3>
                      <div className="h-56">
                        <ResponsiveContainer width="100%" height="100%">
                          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={reportData.categoryAnalysis}>
                            <PolarGrid />
                            <PolarAngleAxis dataKey="category" fontSize={9} />
                            <PolarRadiusAxis fontSize={9} />
                            <Radar name="الأصناف" dataKey="quantity" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.4} />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>
                      <p className="text-[10px] text-slate-400 text-center">أقسام ومعدلات مبيعات الوجبات والطلبات الجانبية</p>
                    </div>
                  </div>

                  {/* Dynamic Interactive Item Table */}
                  <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xxs">
                    <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                      <h3 className="text-xs font-bold text-slate-900">سجل تحليل الأصناف التفصيلي</h3>
                      <button 
                        onClick={() => exportCSV(reportData.matrix, `item_performance_${from}_to_${to}.csv`)}
                        className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-650 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        تصدير تحليل المنيو CSV
                      </button>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-right text-xs">
                        <thead>
                          <tr className="border-b border-slate-100 text-slate-400 font-bold">
                            <th className="py-2.5">اسم وجبة / الصنف</th>
                            <th className="py-2.5 text-center">القسم</th>
                            <th className="py-2.5 text-center">الكمية المباعة</th>
                            <th className="py-2.5 text-left">التسعير</th>
                            <th className="py-2.5 text-left">التكلفة (Recipe)</th>
                            <th className="py-2.5 text-left">إجمالي الإيرادات</th>
                            <th className="py-2.5 text-left">صافي أرباح الصنف</th>
                            <th className="py-2.5 text-center">نسبة تكلفة الصنف</th>
                            <th className="py-2.5 text-center">تصنيف BCG</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reportData.matrix.map((row: any, idx: number) => {
                            let badge = "bg-slate-100 text-slate-700";
                            if (row.classification === "Star") badge = "bg-emerald-50 text-emerald-700 border border-emerald-100";
                            else if (row.classification === "Plowhorse") badge = "bg-blue-50 text-blue-700 border border-blue-100";
                            else if (row.classification === "Puzzle") badge = "bg-amber-50 text-amber-700 border border-amber-100";
                            else badge = "bg-rose-50 text-rose-700 border border-rose-100";

                            return (
                              <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50/50">
                                <td className="py-3 font-semibold text-slate-800">{row.name}</td>
                                <td className="py-3 text-center text-slate-500 font-sans">{row.category}</td>
                                <td className="py-3 text-center font-bold font-mono">{row.quantity} وحدة</td>
                                <td className="py-3 text-left font-bold font-mono text-slate-700">{formatEGP(row.price)}</td>
                                <td className="py-3 text-left font-bold font-mono text-slate-500">{formatEGP(row.theoreticalCost)}</td>
                                <td className="py-3 text-left font-bold font-mono text-slate-700">{formatEGP(row.revenue)}</td>
                                <td className="py-3 text-left font-bold font-mono text-emerald-600">{formatEGP(row.totalProfit)}</td>
                                <td className="py-3 text-center font-bold font-mono text-slate-600">
                                  {row.foodCostPercent.toFixed(1)}%
                                </td>
                                <td className="py-3 text-center">
                                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${badge}`}>
                                    {row.classification === "Star" ? "⭐ نجم" :
                                     row.classification === "Plowhorse" ? "🐎 حصان جر" :
                                     row.classification === "Puzzle" ? "🧩 لغز" : "🐕 كلب"}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION E: INVENTORY & STOCK */}
              {activeTab === "inventory" && (
                <div className="space-y-6">
                  {/* Stock Status Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xxs flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400">القيمة الإجمالية للمخزن الحالي</p>
                        <h4 className="text-xl font-black text-slate-900 mt-1 font-mono">{formatEGP(reportData.status.stockValue)}</h4>
                      </div>
                      <div className="w-10 h-10 bg-indigo-50 text-indigo-650 rounded-xl flex items-center justify-center">
                        <Box className="w-5 h-5" />
                      </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xxs flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400">الأصناف المتوفرة والآمنة</p>
                        <h4 className="text-xl font-black text-slate-900 mt-1 font-mono">{reportData.status.inStockCount} خامة</h4>
                      </div>
                      <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                        <CheckCircle className="w-5 h-5" />
                      </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xxs flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400">مواد تحت حد الطلب (منخفضة)</p>
                        <h4 className="text-xl font-black text-slate-900 mt-1 font-mono text-amber-600">{reportData.status.underMinCount} خامة</h4>
                      </div>
                      <div className="w-10 h-10 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center">
                        <AlertTriangle className="w-5 h-5" />
                      </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xxs flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400">خامات نافدة تماماً (OOS)</p>
                        <h4 className="text-xl font-black text-slate-900 mt-1 font-mono text-rose-600">{reportData.status.outOfStockCount} خامة</h4>
                      </div>
                      <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center">
                        <Trash2 className="w-5 h-5" />
                      </div>
                    </div>
                  </div>

                  {/* Stock Movements Detail Table */}
                  <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xxs">
                    <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                      <h3 className="text-xs font-bold text-slate-900">حركات الجرد والمخازن التفصيلية</h3>
                      <button 
                        onClick={() => exportCSV(reportData.movements, `stock_movements_${from}_to_${to}.csv`)}
                        className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-650 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        تصدير حركة المخازن CSV
                      </button>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-right text-xs">
                        <thead>
                          <tr className="border-b border-slate-100 text-slate-400 font-bold">
                            <th className="py-2.5">المكون / الخامة</th>
                            <th className="py-2.5 text-center">الوحدة</th>
                            <th className="py-2.5 text-center">المخزون الإفتتاحي</th>
                            <th className="py-2.5 text-center">الكمية المضافة</th>
                            <th className="py-2.5 text-center">الاستهلاك النظري</th>
                            <th className="py-2.5 text-center">الهدر والفساد</th>
                            <th className="py-2.5 text-center">المخزون الفعلي المغلق</th>
                            <th className="py-2.5 text-center">انحراف الكمية</th>
                            <th className="py-2.5 text-left">قيمة الانحراف المالي</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reportData.movements.map((row: any, idx: number) => {
                            const isPositive = row.varianceQty >= 0;
                            return (
                              <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50/50">
                                <td className="py-3 font-semibold text-slate-800">{row.name}</td>
                                <td className="py-3 text-center text-slate-500 font-sans">{row.baseUom}</td>
                                <td className="py-3 text-center font-mono">{row.openingStock}</td>
                                <td className="py-3 text-center font-mono text-indigo-600 font-bold">{row.receivedStock > 0 ? `+${row.receivedStock}` : "0"}</td>
                                <td className="py-3 text-center font-mono text-slate-500">{row.theoreticalUsage.toFixed(1)}</td>
                                <td className="py-3 text-center font-mono text-rose-600">{row.wasteQty > 0 ? row.wasteQty.toFixed(1) : "0"}</td>
                                <td className="py-3 text-center font-mono font-bold">{row.actualClosingStock.toFixed(1)}</td>
                                <td className={`py-3 text-center font-mono font-bold ${isPositive ? "text-slate-600" : "text-rose-600"}`}>
                                  {row.varianceQty.toFixed(1)}
                                </td>
                                <td className={`py-3 text-left font-mono font-bold ${isPositive ? "text-slate-600" : "text-rose-600"}`}>
                                  {formatEGP(row.varianceCost)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Waste and Purchase Summary Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Waste Breakdown by Reasons */}
                    <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xxs">
                      <h3 className="text-xs font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <Trash2 className="w-4 h-4 text-rose-500" />
                        الهدر وفساد الخامات المحسوبة (كلفة الفقد)
                      </h3>
                      {reportData.waste.totalWasteCost === 0 ? (
                        <div className="p-8 text-center text-slate-400 text-xs">
                          لا توجد سجلات هدر مقيدة في هذه الساعات الزمنية.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
                          {/* Left pie */}
                          <div className="h-40 relative flex items-center justify-center">
                            <ResponsiveContainer width="100%" height="100%">
                              <RePieChart>
                                <Pie
                                  data={reportData.waste.reasons}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={40}
                                  outerRadius={55}
                                  dataKey="cost"
                                >
                                  {reportData.waste.reasons.map((entry: any, index: number) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                  ))}
                                </Pie>
                                <Tooltip formatter={(value) => formatEGP(Number(value))} />
                              </RePieChart>
                            </ResponsiveContainer>
                          </div>
                          {/* Right descriptions */}
                          <div className="space-y-2 text-xs">
                            {reportData.waste.reasons.map((r: any, idx: number) => (
                              <div key={idx} className="flex justify-between items-center">
                                <span className="font-semibold text-slate-600">{r.name}</span>
                                <span className="font-mono font-bold text-rose-600">{formatEGP(r.cost)}</span>
                              </div>
                            ))}
                            <div className="pt-2 border-t border-slate-100 flex justify-between font-bold text-slate-800 text-xs">
                              <span>إجمالي كلفة الفقد:</span>
                              <span className="font-mono">{formatEGP(reportData.waste.totalWasteCost)}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Purchase orders summary */}
                    <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xxs">
                      <h3 className="text-xs font-bold text-slate-900 mb-3 flex items-center gap-2">
                        <ShoppingBag className="w-4 h-4 text-emerald-500" />
                        إمدادات الشراء ومستحقات الموردين الحالية
                      </h3>
                      <div className="space-y-3">
                        {reportData.purchase.purchaseOrders.map((po: any, idx: number) => (
                          <div key={idx} className="flex justify-between items-center p-3 bg-slate-50/50 rounded-xl border border-slate-100 text-xs">
                            <div>
                              <p className="font-bold text-slate-800">{po.supplier}</p>
                              <p className="text-[10px] text-slate-400 mt-0.5">{po.id} — {po.date}</p>
                            </div>
                            <div className="text-left">
                              <p className="font-mono font-bold text-slate-800">{formatEGP(po.amount)}</p>
                              <p className="text-[10px] text-slate-500 font-bold mt-0.5">{po.status}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION F: COSTS & PROFITABILITY (P&L CENTER) */}
              {activeTab === "profitability" && (
                <div className="space-y-6">
                  
                  {/* High level financial overview cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xxs">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">مجمل الربح (Gross Profit)</p>
                      <h4 className="text-xl font-black text-slate-950 mt-1 font-mono">{formatEGP(reportData.pl.grossProfit)}</h4>
                      <p className="text-[10px] text-slate-400 mt-2">
                        المبيعات الصافية بعد خصم تكلفة المواد COGS المباشرة.
                      </p>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xxs">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">الأرباح التشغيلية EBITDA</p>
                      <h4 className="text-xl font-black text-slate-950 mt-1 font-mono">{formatEGP(reportData.pl.ebitda)}</h4>
                      <p className="text-[10px] text-slate-400 mt-2">
                        الأرباح قبل اقتطاع ضريبة EPL Platform وقبل الاستهلاك.
                      </p>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xxs">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">صافي ربح المالك النهائي</p>
                      <h4 className={`text-xl font-black mt-1 font-mono ${reportData.pl.netProfit >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                        {formatEGP(reportData.pl.netProfit)}
                      </h4>
                      <p className="text-[10px] text-slate-400 mt-2">
                        الأرباح الصافية الحرة الخاضعة للمالك بعد خصم EPL Fees.
                      </p>
                    </div>
                  </div>

                  {/* THE FAMOUS P&L STATEMENT (قائمة الأرباح والخسائر المعيارية) */}
                  <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xxs" id="pl-statement-sheet">
                    <div className="flex justify-between items-center border-b border-slate-150 pb-4 mb-4">
                      <div>
                        <h3 className="text-base font-extrabold text-slate-950">قائمة الأرباح والخسائر القياسية (P&L Statement)</h3>
                        <p className="text-xs text-slate-400 mt-0.5">التقارير المحاسبية القياسية للفترة من {from} إلى {to}</p>
                      </div>
                      <span className="text-xxs font-black text-slate-500 bg-slate-100 px-3 py-1 rounded-xl">ميزان مراجعة حقيقي</span>
                    </div>

                    <div className="space-y-4 text-xs font-sans">
                      {/* 1. REVENUE SECTION */}
                      <div className="space-y-2">
                        <div className="flex justify-between font-bold text-slate-950 border-b border-slate-100 pb-1 text-sm">
                          <span>الإيرادات والمبيعات:</span>
                          <span>القيمة الكلية</span>
                        </div>
                        <div className="flex justify-between text-slate-650 ps-4">
                          <span>إجمالي المبيعات (أصناف + خدمات):</span>
                          <span className="font-mono">{formatEGP(reportData.pl.revenue.grossSales)}</span>
                        </div>
                        <div className="flex justify-between text-rose-600 ps-4">
                          <span>خصم ضريبة القيمة المضافة:</span>
                          <span className="font-mono">({formatEGP(reportData.pl.revenue.taxAmount)})</span>
                        </div>
                        <div className="flex justify-between text-rose-600 ps-4">
                          <span>خصم الخصومات والعروض الممنوحة للعملاء:</span>
                          <span className="font-mono">({formatEGP(reportData.pl.revenue.discountAmount)})</span>
                        </div>
                        <div className="flex justify-between text-rose-600 ps-4">
                          <span>خصم قيمة الإلغاءات والمردودات (Voids):</span>
                          <span className="font-mono">({formatEGP(reportData.pl.revenue.voidsAmount)})</span>
                        </div>
                        <div className="flex justify-between font-extrabold text-slate-950 bg-slate-50/50 p-2.5 rounded-lg">
                          <span>صافي الإيرادات:</span>
                          <span className="font-mono text-emerald-600">{formatEGP(reportData.pl.revenue.netRevenue)}</span>
                        </div>
                      </div>

                      {/* 2. COGS SECTION */}
                      <div className="space-y-2">
                        <div className="flex justify-between font-bold text-slate-950 border-b border-slate-100 pb-1 text-sm">
                          <span>تكلفة المبيعات (COGS):</span>
                          <span></span>
                        </div>
                        <div className="flex justify-between text-rose-600 ps-4">
                          <span>تكلفة المواد الغذائية المستهلكة (المقادير والوصفات النظري):</span>
                          <span className="font-mono">({formatEGP(reportData.pl.cogs.theoreticalMaterialCost)})</span>
                        </div>
                        <div className="flex justify-between text-rose-600 ps-4">
                          <span>كلفة الهدر والفساد ومواد منتهية الصلاحية:</span>
                          <span className="font-mono">({formatEGP(reportData.pl.cogs.wasteCost)})</span>
                        </div>
                        <div className="flex justify-between font-extrabold text-slate-950 bg-slate-50/50 p-2.5 rounded-lg">
                          <span>إجمالي كلفة المبيعات (COGS):</span>
                          <span className="font-mono">({formatEGP(reportData.pl.cogs.totalCOGS)})</span>
                        </div>
                      </div>

                      {/* Gross Margin Row */}
                      <div className="flex justify-between font-black text-slate-950 bg-slate-100 p-3 rounded-lg text-sm">
                        <span>مجمل الأرباح التجارية (Gross Profit):</span>
                        <span className="font-mono text-emerald-600">{formatEGP(reportData.pl.grossProfit)}</span>
                      </div>

                      {/* 3. OPERATING EXPENSES (OPEX) */}
                      <div className="space-y-2">
                        <div className="flex justify-between font-bold text-slate-950 border-b border-slate-100 pb-1 text-sm">
                          <span>المصاريف والتشغيل (OPEX):</span>
                          <span></span>
                        </div>
                        <div className="flex justify-between text-slate-650 ps-4">
                          <span>إيجار الفروع وفترات المعارض:</span>
                          <span className="font-mono">({formatEGP(reportData.pl.opex.rentExpense)})</span>
                        </div>
                        <div className="flex justify-between text-slate-650 ps-4">
                          <span>فواتير الخدمات والطاقة (كهرباء ومياه وغاز وإنترنت):</span>
                          <span className="font-mono">({formatEGP(reportData.pl.opex.utilitiesExpense)})</span>
                        </div>
                        <div className="flex justify-between text-slate-650 ps-4">
                          <span>أجور ورواتب العاملين والمكافآت (تلقائي من HR Suite):</span>
                          <span className="font-mono">({formatEGP(reportData.pl.opex.salariesExpense)})</span>
                        </div>
                        <div className="flex justify-between text-slate-650 ps-4">
                          <span>التسويق والإعلانات والتمويل الرقمي:</span>
                          <span className="font-mono">({formatEGP(reportData.pl.opex.marketingExpense)})</span>
                        </div>
                        <div className="flex justify-between text-slate-650 ps-4">
                          <span>الصيانة الدورية وتطوير البنية التحتية:</span>
                          <span className="font-mono">({formatEGP(reportData.pl.opex.maintenanceExpense)})</span>
                        </div>
                        <div className="flex justify-between text-slate-650 ps-4">
                          <span>عمولات منصات التوصيل ومقدمي التوصيل الخارجي:</span>
                          <span className="font-mono">({formatEGP(reportData.pl.opex.aggregatorCommission)})</span>
                        </div>
                        <div className="flex justify-between text-slate-650 ps-4">
                          <span>عهد الكاشير والمصروفات النثرية المقيدة:</span>
                          <span className="font-mono">({formatEGP(reportData.pl.opex.cashierPettyCash)})</span>
                        </div>
                        <div className="flex justify-between text-slate-650 ps-4">
                          <span>أخرى ومصاريف تشغيل غير مصنفة:</span>
                          <span className="font-mono">({formatEGP(reportData.pl.opex.otherExpense)})</span>
                        </div>
                        <div className="flex justify-between font-extrabold text-slate-950 bg-slate-50/50 p-2.5 rounded-lg">
                          <span>إجمالي المصروفات التشغيلية (OPEX):</span>
                          <span className="font-mono">({formatEGP(reportData.pl.opex.totalOpex)})</span>
                        </div>
                      </div>

                      {/* EBITDA Row */}
                      <div className="flex justify-between font-black text-slate-950 bg-slate-100 p-3 rounded-lg text-sm">
                        <span>إجمالي الأرباح قبل الفوائد والضرائب والإهلاك (EBITDA):</span>
                        <span className="font-mono text-emerald-600">{formatEGP(reportData.pl.ebitda)}</span>
                      </div>

                      {/* 4. PLATFORM COMMISSIONS / PLATFORM FEES */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-rose-600 ps-4">
                          <span>رسوم تشغيل عمولة المنصة EPL Platform Fees (1% من الصافي):</span>
                          <span className="font-mono">({formatEGP(reportData.pl.opex.eplfoodCommission)})</span>
                        </div>
                      </div>

                      {/* NET PROFIT FINAL ROW */}
                      <div className="flex justify-between font-black text-white bg-slate-950 p-4 rounded-xl text-base">
                        <span>الربح النهائي الخالص للمالك (Net Profit):</span>
                        <span className="font-mono text-amber-300">{formatEGP(reportData.pl.netProfit)}</span>
                      </div>
                    </div>
                  </div>

                  {/* BREAK-EVEN ANALYSIS SECTION (تحليل نقطة التعادل والتشغيل) */}
                  <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xxs">
                    <h3 className="text-xs font-bold text-slate-900 mb-2 flex items-center gap-2">
                      <Percent className="w-4 h-4 text-rose-500" />
                      تحليل وهندسة نقطة التعادل (Break-Even Engineering Analysis)
                    </h3>
                    <p className="text-[11px] text-slate-400 mb-4">
                      المحاسبة الإستراتيجية لمستويات الخطر وحساب حجم المبيعات المطلوب لتغطية التكاليف التشغيلية بالكامل.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-right">
                        <p className="text-[10px] font-bold text-slate-400">التكاليف الثابتة الهيكلية</p>
                        <p className="text-base font-black text-slate-950 mt-1 font-mono">{formatEGP(reportData.breakEven.fixedCosts)}</p>
                        <p className="text-[9px] text-slate-400 mt-1">الإيجارات والخدمات والرواتب الأساسية</p>
                      </div>

                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-right">
                        <p className="text-[10px] font-bold text-slate-400">هامش المساهمة المتوسط</p>
                        <p className="text-base font-black text-slate-950 mt-1 font-mono">{(reportData.breakEven.contributionMarginPercent * 100).toFixed(1)}%</p>
                        <p className="text-[9px] text-slate-400 mt-1">العائد بعد تلبية المواد COGS</p>
                      </div>

                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-right">
                        <p className="text-[10px] font-bold text-slate-400">حجم مبيعات التعادل المطلوب</p>
                        <p className="text-base font-black text-indigo-650 mt-1 font-mono">{formatEGP(reportData.breakEven.breakEvenPoint)}</p>
                        <p className="text-[9px] text-slate-400 mt-1">قيمة المبيعات اللازمة لتجنب الخسارة</p>
                      </div>

                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-right">
                        <p className="text-[10px] font-bold text-slate-400">أهداف التشغيل والطلبات يومياً</p>
                        <p className="text-base font-black text-emerald-600 mt-1 font-mono">{Math.ceil(reportData.breakEven.breakEvenOrdersDaily)} طلب/يوم</p>
                        <p className="text-[9px] text-slate-400 mt-1">بمتوسط قيمة الفاتورة الحالية</p>
                      </div>
                    </div>

                    {/* Progress representation */}
                    <div className="mt-4 p-4 rounded-2xl border border-slate-100 space-y-2">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-slate-600">نسبة تحقيق التعادل للشهر الحالي:</span>
                        <span className="text-slate-900 font-mono">
                          {((reportData.pl.revenue.netRevenue / (reportData.breakEven.breakEvenPoint || 1)) * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden flex shadow-xxs">
                        <div 
                          className="h-full bg-gradient-to-r from-indigo-500 to-indigo-650 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, (reportData.pl.revenue.netRevenue / (reportData.breakEven.breakEvenPoint || 1)) * 100)}%` }}
                        ></div>
                      </div>
                      <p className="text-[10px] text-slate-400">
                        * عندما يتجاوز هذا الشريط حاجز 100%، يبدأ المالك في تسجيل صافي ربح فعلي بعد خصم كافة التكاليف الثابتة والمتغيرة.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION G: BRANCH COMPARISON */}
              {activeTab === "branches" && (
                <div className="space-y-6">
                  {/* Side-by-side comparison matrix */}
                  <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xxs">
                    <h3 className="text-xs font-bold text-slate-900 mb-4 flex items-center gap-2">
                      <Building className="w-4 h-4 text-slate-600" />
                      مصفوفة المقارنة التنافسية بين الفروع والمواقع
                    </h3>

                    <div className="overflow-x-auto">
                      <table className="w-full text-right text-xs">
                        <thead>
                          <tr className="border-b border-slate-100 text-slate-400 font-bold">
                            <th className="py-2.5">اسم الفرع المستهدف</th>
                            <th className="py-2.5 text-left">قيمة مبيعات الفرع</th>
                            <th className="py-2.5 text-center">حصة الفرع من الإيراد %</th>
                            <th className="py-2.5 text-center">الطلبات المنجزة</th>
                            <th className="py-2.5 text-left">متوسط قيمة السلة (AOV)</th>
                            <th className="py-2.5 text-center">معدل تكلفة المواد %</th>
                            <th className="py-2.5 text-center">معدل إلغاء السجلات Voids</th>
                            <th className="py-2.5 text-center">توزيع التحصيل (نقد/فيزا)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reportData.branches.map((b: any, idx: number) => (
                            <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50/50">
                              <td className="py-3 font-extrabold text-slate-800">{b.nameAr}</td>
                              <td className="py-3 text-left font-bold font-mono text-indigo-650">{formatEGP(b.sales)}</td>
                              <td className="py-3 text-center font-bold font-mono text-slate-700">{b.percentOfTotal.toFixed(1)}%</td>
                              <td className="py-3 text-center font-bold font-mono">{b.ordersCount} طلب</td>
                              <td className="py-3 text-left font-bold font-mono">{formatEGP(b.avgOrderValue)}</td>
                              <td className="py-3 text-center font-bold font-mono text-slate-600">{b.costPercent.toFixed(1)}%</td>
                              <td className="py-3 text-center font-bold font-mono text-rose-600">{b.cancellationRate.toFixed(1)}%</td>
                              <td className="py-3 text-center text-[10px] font-sans">
                                <div className="flex items-center justify-center gap-1.5">
                                  <span className="text-emerald-600 font-bold">💵 {b.cashPercent.toFixed(0)}%</span>
                                  <span className="text-slate-400">/</span>
                                  <span className="text-indigo-600 font-bold">💳 {b.cardPercent.toFixed(0)}%</span>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Branch Alerts and Anomalies Detection */}
                  <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xxs">
                    <h3 className="text-xs font-bold text-slate-900 mb-3 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                      نظام التنبيهات الذكي لرصد الاختلافات والانحرافات (Anomaly Detection)
                    </h3>
                    <p className="text-[11px] text-slate-400 mb-4">
                      تحليل خوارزمي متقدم لرصد الأنماط غير العادية وسلوك الكاشيرات والتشغيل بالفروع مقارنة بالمعايير.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {reportData.anomalies.map((alert: any, idx: number) => {
                        let style = "bg-amber-50 border-amber-100 text-amber-800";
                        if (alert.severity === "success") {
                          style = "bg-emerald-50 border-emerald-100 text-emerald-800";
                        } else if (alert.severity === "danger") {
                          style = "bg-rose-50 border-rose-100 text-rose-800";
                        }
                        return (
                          <div key={idx} className={`p-4 rounded-2xl border flex items-start gap-3 text-xs ${style}`}>
                            <Info className="w-4 h-4 shrink-0 mt-0.5" />
                            <div>
                              <p className="font-extrabold">{alert.branchName}</p>
                              <p className="mt-1 leading-relaxed opacity-90">{alert.message}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION H: FIXED EXPENSES CRUD SETTINGS */}
              {activeTab === "fixed-expenses" && (
                <div className="space-y-6">
                  
                  {/* Top explanation */}
                  <div className="bg-slate-50 p-5 rounded-3xl border border-slate-150/60 flex justify-between items-center flex-wrap gap-4 text-right">
                    <div>
                      <h3 className="text-xs font-bold text-slate-900">سجل إعدادات المصروفات والتشغيل غير المباشر</h3>
                      <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                        تتيح لك هذه الإعدادات قيد وتعديل المصروفات الإدارية للفروع (مثل الإيجار، الكهرباء، خدمات الاتصالات) لكي تندمج تلقائياً مع حسابات الأرباح والخسائر P&L.
                      </p>
                    </div>
                    <button
                      onClick={() => setShowAddExpense(!showAddExpense)}
                      className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      إضافة مصروف تشغيلي جديد
                    </button>
                  </div>

                  {/* Add Expense Drawer */}
                  <AnimatePresence>
                    {showAddExpense && (
                      <motion.form 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        onSubmit={handleAddExpense}
                        className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xxs space-y-4 overflow-hidden text-right"
                      >
                        <h4 className="text-xs font-bold text-slate-900">بيانات المصروف الجديد</h4>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500">اسم المصروف (بالعربية)</label>
                            <input 
                              type="text" 
                              required
                              placeholder="إيجار معرض أكتوبر"
                              value={newExp.nameAr}
                              onChange={(e) => setNewExp({ ...newExp, nameAr: e.target.value, name: e.target.value })}
                              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:bg-white"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500">تصنيف المصروف</label>
                            <select 
                              value={newExp.category}
                              onChange={(e) => setNewExp({ ...newExp, category: e.target.value })}
                              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none cursor-pointer"
                            >
                              <option value="rent">إيجار (Rent)</option>
                              <option value="utilities">مرافق وطاقة (Utilities)</option>
                              <option value="salaries">رواتب وأجور (Salaries)</option>
                              <option value="marketing">تسويق وإعلان (Marketing)</option>
                              <option value="maintenance">صيانة (Maintenance)</option>
                              <option value="other">أخرى (Other)</option>
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500">المبلغ الشهري (EGP)</label>
                            <input 
                              type="number" 
                              required
                              placeholder="8500"
                              value={newExp.amount}
                              onChange={(e) => setNewExp({ ...newExp, amount: e.target.value })}
                              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:bg-white"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500">تطبيق على فرع</label>
                            <select 
                              value={newExp.branchId}
                              onChange={(e) => setNewExp({ ...newExp, branchId: e.target.value })}
                              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none cursor-pointer"
                            >
                              <option value="all">كل الشركة والنشاط</option>
                              <option value="branch-a">فرع المعادي الرئيسي</option>
                              <option value="branch-b">فرع مصر الجديدة</option>
                            </select>
                          </div>
                        </div>

                        <div className="flex justify-end gap-2 text-xs pt-2">
                          <button 
                            type="button" 
                            onClick={() => setShowAddExpense(false)}
                            className="px-3.5 py-2 bg-slate-100 text-slate-600 rounded-lg font-bold"
                          >
                            إلغاء
                          </button>
                          <button 
                            type="submit" 
                            className="px-4 py-2 bg-indigo-650 text-white rounded-lg font-bold"
                          >
                            تأكيد الإضافة والقيد
                          </button>
                        </div>
                      </motion.form>
                    )}
                  </AnimatePresence>

                  {/* Expenses List Table */}
                  <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xxs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-right text-xs">
                        <thead>
                          <tr className="border-b border-slate-100 text-slate-400 font-bold">
                            <th className="py-2.5">اسم بند المصروف التشغيلي</th>
                            <th className="py-2.5 text-center">التصنيف المحاسبي</th>
                            <th className="py-2.5 text-center">الفرع المطبق</th>
                            <th className="py-2.5 text-center">تواتر السداد</th>
                            <th className="py-2.5 text-left">المبلغ الشهري المستحق</th>
                            <th className="py-2.5 text-center">تاريخ الميزان المالي</th>
                            <th className="py-2.5 text-center">الإجراء</th>
                          </tr>
                        </thead>
                        <tbody>
                          {expensesList.map((row: any, idx: number) => {
                            const bName = row.branchId === "all" ? "الشركة ككل" : (row.branchId === "branch-a" ? "فرع المعادي" : "فرع مصر الجديدة");
                            const categoryAr = 
                              row.category === "rent" ? "إيجار فروع" :
                              row.category === "utilities" ? "مرافق وطاقة" :
                              row.category === "salaries" ? "رواتب وأجور" :
                              row.category === "marketing" ? "تسويق وإعلام" :
                              row.category === "maintenance" ? "أعمال صيانة" : "مصروف تشغيلي آخر";

                            return (
                              <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50/50">
                                <td className="py-3 font-extrabold text-slate-800">{row.nameAr || row.name}</td>
                                <td className="py-3 text-center text-slate-500 font-sans">{categoryAr}</td>
                                <td className="py-3 text-center text-slate-600 font-bold">{bName}</td>
                                <td className="py-3 text-center text-slate-400">شهري</td>
                                <td className="py-3 text-left font-bold font-mono text-indigo-650">{formatEGP(row.amount / 100)}</td>
                                <td className="py-3 text-center font-mono text-slate-400">{row.effectiveFrom || "2025-01"}</td>
                                <td className="py-3 text-center">
                                  <button 
                                    onClick={() => handleDeleteExpense(row.id)}
                                    className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                                    title="حذف البند"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

            </motion.div>
          )}
        </div>

      </div>

    </div>
  );
}
