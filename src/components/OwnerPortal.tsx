import React, { useState, useEffect } from "react";
import { 
  DollarSign, 
  ShoppingBag, 
  TrendingUp, 
  Users, 
  Sparkles, 
  Plus, 
  Trash2, 
  Copy, 
  Check, 
  UtensilsCrossed, 
  Tag, 
  FileText, 
  AlertCircle,
  Clock,
  Package,
  BookOpen,
  Layers,
  Activity,
  Edit,
  Save,
  PlusCircle,
  CheckCircle2,
  ListOrdered,
  Database,
  Search,
  Scale,
  Percent,
  HelpCircle,
  Printer,
  Receipt,
  ChevronLeft,
  Lock,
  ShieldAlert,
  Share2,
  Sliders,
  RefreshCw,
  Globe,
  Fingerprint,
  Calendar,
  Briefcase,
  MapPin
} from "lucide-react";
import { MenuItem, DynamicStats, StaffUser, AttendanceLog, StaffSchedule, LeaveRequest, PayrollRun, BiometricDevice } from "../types";
import DepartmentGuide, { DepartmentType } from "./DepartmentGuide";
import { TeamManagement } from "./TeamManagement";
import FinancialReportsCenter from "./FinancialReportsCenter";
import OutletsManager from "./OutletsManager";

interface OwnerPortalProps {
  menu: MenuItem[];
  onRefreshMenu: () => void;
  user?: any;
  org?: any;
  onRefreshAuth?: () => void;
}

export default function OwnerPortal({ menu, onRefreshMenu, user, org, onRefreshAuth }: OwnerPortalProps) {
  // Stats state
  const [stats, setStats] = useState<DynamicStats>({
    totalRevenue: 0,
    ordersCount: 0,
    activeOrdersCount: 0,
    popularDishes: [],
    occupancyRate: 0,
    averageSlaMinutes: 0,
    discrepanciesCount: 0,
  });
  const [loadingStats, setLoadingStats] = useState(true);

  // Manual Add dish state
  const [newDish, setNewDish] = useState({
    name: "",
    description: "",
    price: "",
    category: "Mains",
    image: "Steak",
  });
  const [addingDish, setAddingDish] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Cost control & Inventory SaaS States
  const [ownerSubTab, setOwnerSubTab] = useState<"dashboard" | "costing" | "shifts" | "aggregators" | "hr" | "team" | "reports" | "outlets">("dashboard");
  const [costSubTab, setCostSubTab] = useState<"ingredients" | "recipes" | "bcg" | "variance">("ingredients");

  // --- HR & Payroll SaaS States ---
  const [hrSubTab, setHrSubTab] = useState<"attendance" | "employees" | "schedules" | "leaves" | "payroll" | "devices">("attendance");
  const [staffList, setStaffList] = useState<StaffUser[]>([]);
  const [attendanceLogs, setAttendanceLogs] = useState<AttendanceLog[]>([]);
  const [schedules, setSchedules] = useState<StaffSchedule[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [payrollRuns, setPayrollRuns] = useState<PayrollRun[]>([]);
  const [biometricDevices, setBiometricDevices] = useState<BiometricDevice[]>([]);
  const [loadingHr, setLoadingHr] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<StaffUser | null>(null);
  const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false);
  const [showManualAttendanceModal, setShowManualAttendanceModal] = useState(false);
  const [showAddDeviceModal, setShowAddDeviceModal] = useState(false);
  const [selectedPayrollPeriod, setSelectedPayrollPeriod] = useState("2026-06");
  const [activePayrollRun, setActivePayrollRun] = useState<PayrollRun | null>(null);

  const fetchHrData = async () => {
    setLoadingHr(true);
    try {
      const [staffRes, attRes, schedRes, leaveRes, devRes] = await Promise.all([
        fetch("/api/staff").then((r) => r.json()),
        fetch("/api/attendance").then((r) => r.json()),
        fetch("/api/schedules").then((r) => r.json()),
        fetch("/api/leave").then((r) => r.json()),
        fetch("/api/biometric/devices").then((r) => r.json())
      ]);

      if (Array.isArray(staffRes)) setStaffList(staffRes);
      if (Array.isArray(attRes)) setAttendanceLogs(attRes);
      if (Array.isArray(schedRes)) setSchedules(schedRes);
      if (Array.isArray(leaveRes)) setLeaveRequests(leaveRes);
      if (Array.isArray(devRes)) setBiometricDevices(devRes);

      try {
        const payrollRes = await fetch(`/api/payroll/${selectedPayrollPeriod}`).then((r) => {
          if (!r.ok) throw new Error("No payroll yet");
          return r.json();
        });
        setActivePayrollRun(payrollRes);
      } catch (e) {
        setActivePayrollRun(null);
      }
    } catch (err) {
      console.error("Error fetching HR data:", err);
    } finally {
      setLoadingHr(false);
    }
  };

  useEffect(() => {
    if (ownerSubTab === "hr") {
      fetchHrData();
    }
  }, [ownerSubTab, selectedPayrollPeriod]);

  // SaaS Multi-Tier Configuration State derived from backend Multi-Tenant org context
  const saasTier: 1 | 2 | 3 | 4 = !org ? 4 : (
    org.plan === "starter" ? 1 : (
      org.plan === "growth" ? 2 : (
        org.plan === "professional" ? 3 : 4
      )
    )
  );

  const isFeatureEnabled = (featureKey: string): boolean => {
    if (!org) return true;
    if (user?.features?.includes(featureKey)) return true;
    if (org.customFeatures?.some((f: any) => f.key === featureKey && f.enabled)) return true;
    if (org.plan === "enterprise") return true;
    if (org.plan === "professional" && ["pos_basic", "kds", "menu_management", "basic_reports", "delivery_management", "guest_portal", "cost_control", "shift_management", "inventory", "hr_payroll"].includes(featureKey)) return true;
    if (org.plan === "growth" && ["pos_basic", "kds", "menu_management", "basic_reports", "delivery_management", "guest_portal", "shift_management", "inventory"].includes(featureKey)) return true;
    return false;
  };

  const isModuleUnlocked = (requiredTier: number, featureKeys: string[]): boolean => {
    if (saasTier >= requiredTier) return true;
    return featureKeys.some(fk => isFeatureEnabled(fk));
  };

  const effectiveSaasTier = Math.max(
    saasTier,
    isFeatureEnabled("inventory") ? 2 : 1,
    isFeatureEnabled("cost_control") ? 3 : 1,
    isFeatureEnabled("aggregator_integration") ? 4 : 1,
    isFeatureEnabled("advanced_reports") ? 4 : 1
  ) as 1 | 2 | 3 | 4;

  const handleRequestFeature = async (featureKey: string) => {
    try {
      const res = await fetch("/api/tenant/feature-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ featureKey })
      });
      const data = await res.json();
      if (res.ok) {
        alert(`تم إرسال طلب تفعيل الميزة (${featureKey}) إلى مسؤول المنصة بنجاح! سيتم المراجعة والتفعيل بشكل فوري.`);
        if (onRefreshAuth) onRefreshAuth();
      } else {
        alert(data.error || "تم إرسال هذا الطلب مسبقاً لمراجعة مسؤول المنصة.");
      }
    } catch (err) {
      console.error(err);
      alert("حدث خطأ أثناء إرسال الطلب.");
    }
  };

  const setSaasTier = (tier: number) => {
    const featKey = tier === 3 ? "cost_control" : "aggregator_integration";
    handleRequestFeature(featKey);
  };

  // Inventory & Cost Variance states
  const [varianceData, setVarianceData] = useState<any[]>([]);
  const [loadingVariance, setLoadingVariance] = useState(false);
  const [wasteLogs, setWasteLogs] = useState<any[]>([]);
  const [loadingWaste, setLoadingWaste] = useState(false);
  const [showWasteModal, setShowWasteModal] = useState(false);
  const [wasteIngredientId, setWasteIngredientId] = useState("");
  const [wasteQuantity, setWasteQuantity] = useState("");
  const [wasteReason, setWasteReason] = useState("");
  const [showRolloverModal, setShowRolloverModal] = useState(false);
  const [rolloverPin, setRolloverPin] = useState("");
  
  // Stocktake inline editor
  const [editingStocktakeIngId, setEditingStocktakeIngId] = useState<string | null>(null);
  const [stocktakeOpening, setStocktakeOpening] = useState("");
  const [stocktakeReceived, setStocktakeReceived] = useState("");
  const [stocktakeClosing, setStocktakeClosing] = useState("");
  
  // Aggregators Integration states
  const [aggregatorSettings, setAggregatorSettings] = useState<any>({
    autoAccept: true,
    talabatCommission: 15,
    careemCommission: 18,
    deliverySurcharge: 1.50
  });
  const [aggregatorLogs, setAggregatorLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [simulatingWebhook, setSimulatingWebhook] = useState(false);
  
  // Shift Management States
  const [shifts, setShifts] = useState<any[]>([]);
  const [loadingShifts, setLoadingShifts] = useState(false);
  const [selectedShiftId, setSelectedShiftId] = useState<string | null>(null);
  const [printLayout, setPrintLayout] = useState<"screen" | "thermal">("screen");
  const [voidReason, setVoidReason] = useState("");
  const [showVoidModal, setShowVoidModal] = useState(false);
  const [managerPin, setManagerPin] = useState("");
  const [showForceCloseModal, setShowForceCloseModal] = useState(false);
  const [forceClosePin, setForceClosePin] = useState("");
  const [voidPin, setVoidPin] = useState("");

  // Ledger Shift Filtering and Sorting States
  const [ledgerCashierQuery, setLedgerCashierQuery] = useState("");
  const [ledgerShiftNumberQuery, setLedgerShiftNumberQuery] = useState("");
  const [ledgerDateQuery, setLedgerDateQuery] = useState("");
  const [ledgerSortBy, setLedgerSortBy] = useState("newest");

  // Shift Intelligence & Audit Center States
  const [shiftSection, setShiftSection] = useState<"ledger" | "analytics">("ledger");
  const [shiftBranchFilter, setShiftBranchFilter] = useState("All");
  const [shiftCashierFilter, setShiftCashierFilter] = useState("All");
  const [shiftStatusFilter, setShiftStatusFilter] = useState("All");
  const [shiftFlagsFilter, setShiftFlagsFilter] = useState("All");
  const [shiftVarianceFilter, setShiftVarianceFilter] = useState("All");
  const [shiftDateFrom, setShiftDateFrom] = useState("");
  const [shiftDateTo, setShiftDateTo] = useState("");
  const [arabicInsights, setArabicInsights] = useState(false);

  const [analyticsOverview, setAnalyticsOverview] = useState<any | null>(null);
  const [analyticsCashier, setAnalyticsCashier] = useState<any[]>([]);
  const [analyticsHeatmap, setAnalyticsHeatmap] = useState<any[]>([]);
  const [analyticsVoids, setAnalyticsVoids] = useState<any | null>(null);
  const [analyticsInsights, setAnalyticsInsights] = useState<any[]>([]);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [shiftAuditLog, setShiftAuditLog] = useState<any[]>([]);
  const [loadingShiftAuditLog, setLoadingShiftAuditLog] = useState(false);

  useEffect(() => {
    if (selectedShiftId) {
      setLoadingShiftAuditLog(true);
      fetch(`/api/shifts/${selectedShiftId}/audit-log`)
        .then((res) => {
          if (res.ok) return res.json();
          throw new Error("Failed to load shift audit log");
        })
        .then((data) => setShiftAuditLog(data))
        .catch((err) => console.error(err))
        .finally(() => setLoadingShiftAuditLog(false));
    } else {
      setShiftAuditLog([]);
    }
  }, [selectedShiftId]);
  
  // Ingredients list & form
  const [ingredients, setIngredients] = useState<any[]>([]);
  const [loadingIngredients, setLoadingIngredients] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<any | null>(null);
  const [ingredientFilterCategory, setIngredientFilterCategory] = useState("All");
  const [ingredientSearchQuery, setIngredientSearchQuery] = useState("");
  
  const [newIngredient, setNewIngredient] = useState({
    name: "",
    category: "Produce",
    baseUom: "kg",
    costPerBaseUnit: "",
    yieldPercent: "100",
    allergens: [] as string[],
    supplierReference: "",
    shelfLifeDays: "7",
    spoilageClass: "Medium" as "High" | "Medium" | "Low"
  });
  
  // Recipes list
  const [recipes, setRecipes] = useState<any[]>([]);
  const [loadingRecipes, setLoadingRecipes] = useState(false);
  const [selectedRecipeDishId, setSelectedRecipeDishId] = useState<string | null>(null);
  const [selectedSubRecipeId, setSelectedSubRecipeId] = useState<string | null>(null);
  const [creatingSubRecipe, setCreatingSubRecipe] = useState(false);

  // Add Ingredient Link state
  const [selectedLinkIngredientId, setSelectedLinkIngredientId] = useState<string>("");
  const [linkQuantity, setLinkQuantity] = useState<string>("");

  const [newSubRecipe, setNewSubRecipe] = useState({
    name: "",
    yieldQuantity: "1.0",
    baseUom: "kg"
  });

  // Dynamic Menu Engineering matrix
  const [bcgData, setBcgData] = useState<any>(null);
  const [loadingBcg, setLoadingBcg] = useState(false);

  // Helper lists
  const allergenOptions = ["Dairy", "Gluten", "Nuts", "Seafood", "Fish", "Egg", "Soy", "Sesame", "Molluscs"];

  // AI Menu Generator state
  const [cuisineTheme, setCuisineTheme] = useState("Italian Coastal Fusion");
  const [chefProfile, setChefProfile] = useState("Modern Gourmet Bistro");
  const [itemType, setItemType] = useState("Mains");
  const [aiGeneratedItems, setAiGeneratedItems] = useState<any[]>([]);
  const [generatingMenu, setGeneratingMenu] = useState(false);
  const [aiError, setAiError] = useState("");

  // AI Campaign Marketing state
  const [selectedCampaignDish, setSelectedCampaignDish] = useState<string>("");
  const [promotionType, setPromotionType] = useState("Weekend Special Discount");
  const [customCampaignPrompt, setCustomCampaignPrompt] = useState("");
  const [generatedCampaignCopy, setGeneratedCampaignCopy] = useState("");
  const [generatingCampaign, setGeneratingCampaign] = useState(false);
  const [campaignError, setCampaignError] = useState("");
  const [campaignCopied, setCampaignCopied] = useState(false);

  // Selection states
  const [selectedFilterCategory, setSelectedFilterCategory] = useState("All");

  // Lifted HR states to prevent violating Rules of Hooks
  const [searchTerm, setSearchTerm] = useState("");
  const [empForm, setEmpForm] = useState({
    name: "",
    role: "cashier",
    pin: "1234",
    nationalId: "",
    phone: "",
    address: "",
    jobTitle: "",
    department: "FOH",
    employmentType: "full_time" as const,
    salaryType: "monthly" as const,
    baseSalary: 3000, // stored in EGP for form, converted to piasters
    hourlyRate: 15,
    overtimeRate: 1.5,
    biometricId: "",
    biometricDeviceId: "dev-1"
  });

  const [attForm, setAttForm] = useState({
    employeeId: "",
    date: new Date().toISOString().split("T")[0],
    checkInTime: "09:00",
    checkOutTime: "17:00",
    note: "",
    status: "present" as const
  });

  const [devForm, setDevForm] = useState({
    name: "",
    ipAddress: "192.168.1.100",
    port: 4370,
    deviceSecret: "zkteco-secret-key-1",
    syncMethod: "both" as const
  });

  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  const [editingStaffTab, setEditingStaffTab] = useState<"profile" | "allowances" | "deductions">("profile");
  
  // Allowances / Deductions inline creation
  const [newAllowance, setNewAllowance] = useState({ name: "", amount: 0, type: "fixed" as const });
  const [newDeduction, setNewDeduction] = useState({ name: "", amount: 0, type: "fixed" as const });

  // Fetch stats initially & periodically
  const fetchStats = async () => {
    const fetchWithRetry = async (url: string, retries = 6, delay = 500): Promise<Response> => {
      try {
        const res = await fetch(url);
        if (!res.ok && [502, 503, 504].includes(res.status) && retries > 0) {
          await new Promise(resolve => setTimeout(resolve, delay));
          return fetchWithRetry(url, retries - 1, delay * 1.5);
        }
        return res;
      } catch (error) {
        if (retries > 0) {
          await new Promise(resolve => setTimeout(resolve, delay));
          return fetchWithRetry(url, retries - 1, delay * 1.5);
        }
        throw error;
      }
    };

    try {
      setLoadingStats(true);
      const res = await fetchWithRetry("/api/stats" + (org?.id ? `?orgId=${org.id}` : ""));
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error("Failed to fetch statistics:", err);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    fetchStats();
    // Auto refresh stats every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [menu]);

  // Cost & Inventory SaaS API Fetchers
  const fetchIngredients = async () => {
    try {
      setLoadingIngredients(true);
      const res = await fetch("/api/ingredients");
      if (res.ok) {
        const data = await res.json();
        setIngredients(data);
      }
    } catch (err) {
      console.error("Failed to fetch ingredients:", err);
    } finally {
      setLoadingIngredients(false);
    }
  };

  const fetchRecipes = async () => {
    try {
      setLoadingRecipes(true);
      const res = await fetch("/api/recipes");
      if (res.ok) {
        const data = await res.json();
        setRecipes(data);
      }
    } catch (err) {
      console.error("Failed to fetch recipes:", err);
    } finally {
      setLoadingRecipes(false);
    }
  };

  const fetchBcgData = async () => {
    try {
      setLoadingBcg(true);
      const res = await fetch("/api/menu-engineering");
      if (res.ok) {
        const data = await res.json();
        setBcgData(data);
      }
    } catch (err) {
      console.error("Failed to fetch menu engineering data:", err);
    } finally {
      setLoadingBcg(false);
    }
  };

  const fetchVariance = async () => {
    try {
      setLoadingVariance(true);
      const res = await fetch("/api/inventory-variance");
      if (res.ok) {
        const data = await res.json();
        setVarianceData(data);
      }
    } catch (err) {
      console.error("Failed to fetch inventory variance:", err);
    } finally {
      setLoadingVariance(false);
    }
  };

  const fetchWasteLogs = async () => {
    try {
      setLoadingWaste(true);
      const res = await fetch("/api/waste-logs");
      if (res.ok) {
        const data = await res.json();
        setWasteLogs(data);
      }
    } catch (err) {
      console.error("Failed to fetch waste logs:", err);
    } finally {
      setLoadingWaste(false);
    }
  };

  const handleUpdateStocktake = async (ingredientId: string, opening: number, received: number, closing: number | null) => {
    try {
      const res = await fetch("/api/inventory-variance/stocktake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ingredientId, openingStock: opening, receivedStock: received, closingStock: closing }),
      });
      if (res.ok) {
        fetchVariance();
        setEditingStocktakeIngId(null);
      } else {
        alert("Failed to update stocktake values.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddWasteLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wasteIngredientId || !wasteQuantity || !wasteReason) {
      alert("All fields are required.");
      return;
    }
    try {
      const res = await fetch("/api/waste-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ingredientId: wasteIngredientId,
          quantity: parseFloat(wasteQuantity),
          reason: wasteReason,
          recordedBy: "Executive Auditor"
        }),
      });
      if (res.ok) {
        setShowWasteModal(false);
        setWasteIngredientId("");
        setWasteQuantity("");
        setWasteReason("");
        fetchVariance();
        fetchWasteLogs();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to log waste.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRolloverPeriod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rolloverPin) {
      alert("Manager PIN is required.");
      return;
    }
    try {
      const res = await fetch("/api/inventory-variance/rollover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ managerPin: rolloverPin, reason: "Weekly audit cycle rollover" }),
      });
      if (res.ok) {
        setShowRolloverModal(false);
        setRolloverPin("");
        alert("Inventory period rolled over successfully! Current actual stocks moved to opening balances.");
        fetchVariance();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to rollover period.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchShifts = async () => {
    try {
      setLoadingShifts(true);
      const res = await fetch("/api/shifts");
      if (res.ok) {
        const data = await res.json();
        setShifts(data);
      }
    } catch (err) {
      console.error("Failed to fetch shifts:", err);
    } finally {
      setLoadingShifts(false);
    }
  };

  const fetchAnalyticsData = async () => {
    try {
      setLoadingAnalytics(true);
      const params = new URLSearchParams();
      if (shiftBranchFilter !== "All") params.append("branchId", shiftBranchFilter);
      if (shiftCashierFilter !== "All") params.append("cashierId", shiftCashierFilter);
      if (shiftDateFrom) params.append("from", shiftDateFrom);
      if (shiftDateTo) params.append("to", shiftDateTo);

      const queryString = params.toString() ? `?${params.toString()}` : "";

      const [overviewRes, cashierRes, heatmapRes, voidsRes, insightsRes] = await Promise.all([
        fetch(`/api/shifts/analytics/overview${queryString}`),
        fetch(`/api/shifts/analytics/cashier-comparison${queryString}`),
        fetch(`/api/shifts/analytics/timing-heatmap${queryString}`),
        fetch(`/api/shifts/analytics/void-analysis${queryString}`),
        fetch(`/api/shifts/analytics/insights${queryString}`)
      ]);

      if (overviewRes.ok) setAnalyticsOverview(await overviewRes.json());
      if (cashierRes.ok) setAnalyticsCashier(await cashierRes.json());
      if (heatmapRes.ok) setAnalyticsHeatmap(await heatmapRes.json());
      if (voidsRes.ok) setAnalyticsVoids(await voidsRes.json());
      if (insightsRes.ok) setAnalyticsInsights(await insightsRes.json());
    } catch (err) {
      console.error("Failed to fetch shift analytics:", err);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  useEffect(() => {
    if (shiftSection === "analytics") {
      fetchAnalyticsData();
    }
  }, [shiftSection, shiftBranchFilter, shiftCashierFilter, shiftDateFrom, shiftDateTo]);

  const fetchAggregatorLogs = async () => {
    setLoadingLogs(true);
    try {
      const res = await fetch("/api/aggregators/logs");
      if (res.ok) {
        const data = await res.json();
        setAggregatorLogs(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingLogs(false);
    }
  };

  const fetchAggregatorSettings = async () => {
    try {
      const res = await fetch("/api/aggregators/settings");
      if (res.ok) {
        const data = await res.json();
        setAggregatorSettings(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateAggregatorSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const res = await fetch("/api/aggregators/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(aggregatorSettings)
      });
      if (res.ok) {
        alert("Aggregator integration parameters synced successfully!");
        fetchAggregatorSettings();
      }
    } catch (e) {
      console.error(e);
      alert("Failed to sync parameters.");
    } finally {
      setSavingSettings(false);
    }
  };

  const handleManualMenuSync = async (platform: string) => {
    setSyncStatus(`Pushing restaurant menu catalog to ${platform} system API...`);
    try {
      const res = await fetch(`/api/aggregators/sync-menu?platform=${platform}`, {
        method: "POST"
      });
      if (res.ok) {
        const data = await res.json();
        setSyncStatus(`Successfully synchronized ${data.syncedItemsCount} dishes to ${platform} catalog!`);
        fetchAggregatorLogs();
      } else {
        const err = await res.json();
        setSyncStatus(`Sync failed: ${err.error}`);
      }
    } catch (e) {
      console.error(e);
      setSyncStatus("Network timeout syncing menu.");
    }
  };

  const handleSimulateWebhook = async (platform: string) => {
    setSimulatingWebhook(true);
    try {
      const res = await fetch(`/api/webhooks/${platform}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: `${platform.toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`,
          customerName: "Audrey Hepburn",
          customerPhone: "+96279998877",
          deliveryAddress: "Rainbow Street, House 4B",
          items: [
            {
              itemId: menu[0]?.id || "item_beef_tenderloin",
              name: menu[0]?.name || "Beef Tenderloin",
              price: menu[0]?.price || 24.50,
              quantity: 1,
              notes: "Medium rare please"
            }
          ],
          totalAmount: menu[0]?.price || 24.50
        })
      });
      if (res.ok) {
        alert(`Inbound aggregator webhook simulated successfully! Injected order is now visible on active preparation boards.`);
        fetchAggregatorLogs();
      } else {
        const err = await res.json();
        alert(`Simulation rejected: ${err.error}`);
      }
    } catch (e) {
      console.error(e);
      alert("Simulation failed due to connection error.");
    } finally {
      setSimulatingWebhook(false);
    }
  };

  const handleClearLogs = async () => {
    if (!confirm("Are you sure you want to purge event logs and audit archives?")) return;
    try {
      const res = await fetch("/api/aggregators/clear-logs", { method: "POST" });
      if (res.ok) {
        fetchAggregatorLogs();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRetryFailedStatusPush = async (logId: string) => {
    try {
      const res = await fetch("/api/aggregators/retry-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logId })
      });
      if (res.ok) {
        alert("Outbound state synchronization retry succeeded!");
        fetchAggregatorLogs();
      } else {
        const err = await res.json();
        alert(`Retry failed: ${err.error}`);
      }
    } catch (e) {
      console.error(e);
      alert("Retry failed due to network error.");
    }
  };

  useEffect(() => {
    if (ownerSubTab === "costing") {
      fetchIngredients();
      fetchRecipes();
      fetchBcgData();
      if (costSubTab === "variance") {
        fetchVariance();
        fetchWasteLogs();
      }
    } else if (ownerSubTab === "shifts") {
      fetchShifts();
    } else if (ownerSubTab === "aggregators") {
      fetchAggregatorLogs();
      fetchAggregatorSettings();
    }
  }, [ownerSubTab, costSubTab, menu]);

  // Save raw material ingredient (Create / Edit)
  const handleSaveIngredient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIngredient.name || !newIngredient.costPerBaseUnit) return;

    try {
      const url = editingIngredient ? `/api/ingredients/${editingIngredient.id}` : "/api/ingredients";
      const method = editingIngredient ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newIngredient,
          costPerBaseUnit: parseFloat(newIngredient.costPerBaseUnit),
          yieldPercent: parseInt(newIngredient.yieldPercent),
          shelfLifeDays: parseInt(newIngredient.shelfLifeDays)
        })
      });

      if (res.ok) {
        setNewIngredient({
          name: "",
          category: "Produce",
          baseUom: "kg",
          costPerBaseUnit: "",
          yieldPercent: "100",
          allergens: [],
          supplierReference: "",
          shelfLifeDays: "7",
          spoilageClass: "Medium"
        });
        setEditingIngredient(null);
        fetchIngredients();
        fetchRecipes();
        fetchBcgData();
      }
    } catch (err) {
      console.error("Failed to save ingredient:", err);
    }
  };

  // Delete raw material ingredient
  const handleDeleteIngredient = async (id: string) => {
    if (!confirm("Are you sure you want to remove this raw material? If linked to recipes, they may show costing errors.")) return;
    try {
      const res = await fetch(`/api/ingredients/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchIngredients();
        fetchRecipes();
        fetchBcgData();
      }
    } catch (err) {
      console.error("Failed to delete ingredient:", err);
    }
  };

  // Create standalone sub-recipe
  const handleCreateSubRecipe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubRecipe.name) return;

    try {
      const res = await fetch("/api/recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newSubRecipe.name,
          isSubRecipe: true,
          ingredients: [],
          yieldQuantity: parseFloat(newSubRecipe.yieldQuantity),
          baseUom: newSubRecipe.baseUom,
          menuItemId: null
        })
      });

      if (res.ok) {
        setNewSubRecipe({ name: "", yieldQuantity: "1.0", baseUom: "kg" });
        setCreatingSubRecipe(false);
        fetchRecipes();
      }
    } catch (err) {
      console.error("Failed to create sub-recipe:", err);
    }
  };

  // Delete standalone sub-recipe
  const handleDeleteSubRecipe = async (id: string) => {
    if (!confirm("Are you sure you want to remove this sub-recipe? All linked recipes will lose its cost calculations.")) return;
    try {
      const res = await fetch(`/api/recipes/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchRecipes();
        fetchBcgData();
      }
    } catch (err) {
      console.error("Failed to delete sub-recipe:", err);
    }
  };

  // Add ingredient link to a recipe BOM
  const handleAddRecipeIngredient = async (recipeId: string, ingredientId: string, isSubRecipeLink: boolean, quantity: number) => {
    const rec = recipes.find(r => r.id === recipeId);
    if (!rec) return;

    const existing = rec.ingredients.find((i: any) => i.ingredientId === ingredientId && i.isSubRecipeLink === isSubRecipeLink);
    let updatedIngredients = [...rec.ingredients];
    if (existing) {
      existing.quantity += quantity;
    } else {
      updatedIngredients.push({ ingredientId, isSubRecipeLink, quantity });
    }

    try {
      const res = await fetch(`/api/recipes/${recipeId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ingredients: updatedIngredients })
      });

      if (res.ok) {
        fetchRecipes();
        fetchBcgData();
      }
    } catch (err) {
      console.error("Failed to update recipe:", err);
    }
  };

  // Remove ingredient link from recipe BOM
  const handleRemoveRecipeIngredient = async (recipeId: string, ingredientId: string, isSubRecipeLink: boolean) => {
    const rec = recipes.find(r => r.id === recipeId);
    if (!rec) return;

    const updatedIngredients = rec.ingredients.filter(
      (i: any) => !(i.ingredientId === ingredientId && i.isSubRecipeLink === isSubRecipeLink)
    );

    try {
      const res = await fetch(`/api/recipes/${recipeId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ingredients: updatedIngredients })
      });

      if (res.ok) {
        fetchRecipes();
        fetchBcgData();
      }
    } catch (err) {
      console.error("Failed to remove recipe ingredient:", err);
    }
  };

  // Initialize empty recipe for a dish
  const handleInitializeRecipe = async (menuItemId: string, dishName: string) => {
    try {
      const res = await fetch("/api/recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          menuItemId,
          isSubRecipe: false,
          name: `${dishName} Recipe`,
          ingredients: [],
          yieldQuantity: 1,
          baseUom: "unit"
        })
      });

      if (res.ok) {
        fetchRecipes();
        fetchBcgData();
      }
    } catch (err) {
      console.error("Failed to initialize recipe:", err);
    }
  };

  // Handle manual adding of a dish
  const handleAddDish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDish.name || !newDish.price) return;

    try {
      setAddingDish(true);
      const res = await fetch("/api/menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newDish.name,
          description: newDish.description,
          price: parseFloat(newDish.price),
          category: newDish.category,
          image: newDish.image,
        }),
      });

      if (res.ok) {
        setNewDish({ name: "", description: "", price: "", category: "Mains", image: "Steak" });
        onRefreshMenu();
        fetchStats();
      }
    } catch (err) {
      console.error("Failed to create dish manually:", err);
    } finally {
      setAddingDish(false);
    }
  };

  // Handle deletion of a dish
  const handleDeleteDish = async (dishId: string) => {
    try {
      const res = await fetch(`/api/menu/${dishId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        onRefreshMenu();
        fetchStats();
        setConfirmDeleteId(null);
      }
    } catch (err) {
      console.error("Failed to delete dish:", err);
    }
  };

  // Turn menu availability switch
  const handleToggleAvailability = async (dish: MenuItem) => {
    try {
      const res = await fetch(`/api/menu/${dish.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAvailable: !dish.isAvailable }),
      });
      if (res.ok) {
        onRefreshMenu();
      }
    } catch (err) {
      console.error("Failed to toggle availability:", err);
    }
  };

  // AI Menu Generation Call
  const handleGenerateAiMenu = async () => {
    if (!cuisineTheme) {
      setAiError("Please supply a menu style / cuisine theme.");
      return;
    }
    setAiError("");
    setGeneratingMenu(true);
    setAiGeneratedItems([]);

    try {
      const res = await fetch("/api/gemini/generate-menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cuisineTheme,
          chefProfile,
          itemType,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setAiGeneratedItems(data.items);
      } else {
        setAiError(data.error || "Failed to prompt Gemini. Try again.");
      }
    } catch (err) {
      setAiError("Connection to AI services failed. Check your local API keys.");
    } finally {
      setGeneratingMenu(false);
    }
  };

  // Insert AI generated dish in live menu
  const handleAddAiDishToMenu = async (aiDish: any) => {
    try {
      const res = await fetch("/api/menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: aiDish.name,
          description: aiDish.description,
          price: aiDish.price,
          category: itemType,
          image: aiDish.imagePlaceholder || "Steak",
        }),
      });

      if (res.ok) {
        // Remove from the preview list so client knows it was selected
        setAiGeneratedItems((prev) => prev.filter((item) => item.name !== aiDish.name));
        onRefreshMenu();
        fetchStats();
      }
    } catch (err) {
      console.error("Failed to add AI dish:", err);
    }
  };

  // AI Campaign Builder Call
  const handleGenerateCampaign = async () => {
    if (!selectedCampaignDish) {
      setCampaignError("Please select a dish to promote.");
      return;
    }
    setCampaignError("");
    setGeneratingCampaign(true);
    setGeneratedCampaignCopy("");

    try {
      const res = await fetch("/api/gemini/marketing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dishName: selectedCampaignDish,
          promotionType,
          customPrompt: customCampaignPrompt,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setGeneratedCampaignCopy(data.copy);
      } else {
        setCampaignError(data.error || "Failed to make marketing draft.");
      }
    } catch (err) {
      setCampaignError("Underlying network failed.");
    } finally {
      setGeneratingCampaign(false);
    }
  };

  const copyCampaignToClipboard = () => {
    if (!generatedCampaignCopy) return;
    navigator.clipboard.writeText(generatedCampaignCopy);
    setCampaignCopied(true);
    setTimeout(() => setCampaignCopied(false), 2000);
  };

  const handleForceCloseShift = async (shiftId: string, pin: string) => {
    try {
      const res = await fetch(`/api/shifts/${shiftId}/force-close`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-eplfood-session": JSON.stringify(user || { role: "org_admin" })
        },
        body: JSON.stringify({ managerName: "Platform Owner", managerPin: pin }),
      });
      if (res.ok) {
        setShowForceCloseModal(false);
        setForceClosePin("");
        fetchShifts();
        alert("Shift force-closed successfully!");
      } else {
        const data = await res.json();
        alert(data.error || "Failed to force close shift.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleVoidShift = async (shiftId: string, pin: string) => {
    if (!voidReason) {
      alert("Please provide a void justification first.");
      return;
    }
    if (!pin) {
      alert("Manager PIN is required.");
      return;
    }
    try {
      const res = await fetch(`/api/shifts/${shiftId}/void`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-eplfood-session": JSON.stringify(user || { role: "org_admin" })
        },
        body: JSON.stringify({ reason: voidReason, managerName: "Executive Auditor", managerPin: pin }),
      });
      if (res.ok) {
        setShowVoidModal(false);
        setVoidReason("");
        setVoidPin("");
        fetchShifts();
        alert("Shift voided successfully and archived.");
      } else {
        const data = await res.json();
        alert(data.error || "Failed to void shift.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const renderAggregatorsLockOverlay = () => {
    return (
      <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/60 shadow-xs max-w-2xl mx-auto space-y-6 my-12 animate-fade-in" id="aggregators-lock-panel">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-500 border border-slate-200 shadow-xxs">
          <Lock className="w-8 h-8 text-indigo-650" />
        </div>
        <div className="space-y-2">
          <span className="text-[10px] font-black bg-indigo-100 text-indigo-800 border border-indigo-200 px-3 py-1 rounded-full uppercase tracking-wider">
            Enterprise Module Only
          </span>
          <h3 className="text-xl font-bold text-slate-900 tracking-tight">Talabat & Careem Direct Connect Locked</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            The external aggregator sync adapter, webhook listener simulation, and rider commission settlement ledgers require a <b>Tier 4 (Enterprise) SaaS Subscription</b>.
          </p>
        </div>
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setSaasTier(4)}
            className="px-6 py-3 bg-indigo-650 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-650/10 hover:shadow-lg cursor-pointer flex items-center gap-2 mx-auto"
          >
            <Sparkles className="w-4 h-4" />
            Upgrade to Tier 4 (Enterprise) Now
          </button>
        </div>
      </div>
    );
  };

  const renderCostingTier3LockOverlay = (featureName: string) => {
    return (
      <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/60 shadow-xs max-w-md mx-auto space-y-6 my-12 animate-fade-in" id="costing-lock-panel">
        <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-500 border border-slate-200 shadow-xxs">
          <Lock className="w-6 h-6 text-indigo-650" />
        </div>
        <div className="space-y-2">
          <span className="text-[8px] font-black bg-indigo-100 text-indigo-800 border border-indigo-200 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
            Professional Tier Feature
          </span>
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">{featureName} Locked</h3>
          <p className="text-xxs text-slate-500 leading-relaxed">
            Theoretical cost modeling, real-time variance stocktakes, waste log monitoring, and BCG matrix analytics are locked. Requires a <b>Tier 3 (Professional) Subscription</b>.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setSaasTier(3)}
          className="px-4 py-2 bg-indigo-650 hover:bg-indigo-600 text-white rounded-lg text-xxs font-bold cursor-pointer mx-auto flex items-center gap-1.5"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Upgrade to Tier 3 (Professional)
        </button>
      </div>
    );
  };

  const renderAggregatorsTab = () => {
    return (
      <div className="space-y-6" id="aggregator-center-tab">
        <div className="bg-slate-900 text-white rounded-3xl p-6 border border-slate-850 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-fade-in">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black bg-emerald-500 text-white px-2 py-0.5 rounded-full uppercase tracking-wider">AGGREGATOR API DIRECT CONNECT</span>
              <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                <Globe className="w-3.5 h-3.5 text-emerald-400 animate-pulse" /> API Gateway Active
              </span>
            </div>
            <h3 className="text-md font-bold">Talabat & Careem Operational Control Center</h3>
            <p className="text-xxs text-slate-400">Configure delivery markups, review order ingestion payloads, sync food items, and audit automated settlements.</p>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <button
              onClick={() => handleManualMenuSync("talabat")}
              className="flex-1 md:flex-initial px-3.5 py-2 bg-slate-800 hover:bg-slate-750 text-white border border-slate-700 font-bold rounded-xl text-xxs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-amber-500" />
              Sync Talabat Menu
            </button>
            <button
              onClick={() => handleManualMenuSync("careem")}
              className="flex-1 md:flex-initial px-3.5 py-2 bg-slate-800 hover:bg-slate-750 text-white border border-slate-700 font-bold rounded-xl text-xxs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-blue-500" />
              Sync Careem Menu
            </button>
          </div>
        </div>

        {syncStatus && (
          <div className="p-3.5 bg-indigo-50 border border-indigo-100 rounded-2xl text-indigo-800 text-xxs font-bold animate-pulse flex items-center justify-between">
            <span>{syncStatus}</span>
            <button onClick={() => setSyncStatus(null)} className="text-[9px] text-indigo-400 hover:text-indigo-600 underline">Dismiss</button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left panel: Settings Parameters */}
          <div className="lg:col-span-4 space-y-6">
            <form onSubmit={handleUpdateAggregatorSettings} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs space-y-4">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
                <Sliders className="w-4 h-4 text-indigo-600" />
                Markups & Commissions
              </h4>

              <div className="space-y-3.5 text-xxs text-slate-700">
                <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-150">
                  <div>
                    <span className="font-bold text-slate-800 block">Auto-Accept Orders</span>
                    <span className="text-[9px] text-slate-400">Instantly route items to preparation boards.</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={!!aggregatorSettings.autoAccept}
                    onChange={(e) => setAggregatorSettings({ ...aggregatorSettings, autoAccept: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-650 focus:ring-indigo-500 cursor-pointer"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-slate-500 uppercase">Talabat Direct Commission (%)</label>
                  <input
                    type="number"
                    value={aggregatorSettings.talabatCommission ?? ""}
                    onChange={(e) => setAggregatorSettings({ ...aggregatorSettings, talabatCommission: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-slate-500 uppercase">Careem Direct Commission (%)</label>
                  <input
                    type="number"
                    value={aggregatorSettings.careemCommission ?? ""}
                    onChange={(e) => setAggregatorSettings({ ...aggregatorSettings, careemCommission: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-slate-500 uppercase">Fixed Delivery Rider Surcharge ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={aggregatorSettings.deliverySurcharge ?? ""}
                    onChange={(e) => setAggregatorSettings({ ...aggregatorSettings, deliverySurcharge: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={savingSettings}
                className="w-full py-2.5 bg-indigo-650 hover:bg-indigo-600 text-white rounded-xl font-bold text-xs cursor-pointer shadow-xs"
              >
                {savingSettings ? "Updating gateway..." : "Save Parameters"}
              </button>
            </form>

            {/* Sandbox Simulator Panel */}
            <div className="bg-slate-50 p-5 rounded-3xl border border-slate-200 space-y-4">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200 pb-2">
                <Globe className="w-4 h-4 text-indigo-600" />
                API Webhook Simulator
              </h4>
              <p className="text-[10px] text-slate-500 leading-relaxed">
                Send a live mock food delivery ticket directly to your platform webhooks to test end-to-end routing without going live.
              </p>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={simulatingWebhook}
                  onClick={() => handleSimulateWebhook("talabat")}
                  className="p-2.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-850 rounded-xl font-bold text-[10px] flex items-center justify-center gap-1 cursor-pointer"
                >
                  Simulate Talabat
                </button>
                <button
                  type="button"
                  disabled={simulatingWebhook}
                  onClick={() => handleSimulateWebhook("careem")}
                  className="p-2.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-850 rounded-xl font-bold text-[10px] flex items-center justify-center gap-1 cursor-pointer"
                >
                  Simulate Careem
                </button>
              </div>
            </div>
          </div>

          {/* Right panel: Events & logs history */}
          <div className="lg:col-span-8 bg-white p-5 rounded-3xl border border-slate-100 shadow-xs space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-emerald-600" />
                Webhook Auditing Logs & Outbound Syncs
              </h4>
              <button
                type="button"
                onClick={handleClearLogs}
                className="text-[9px] text-rose-500 hover:text-rose-600 font-bold cursor-pointer"
              >
                Purge Archives
              </button>
            </div>

            {loadingLogs ? (
              <div className="flex flex-col items-center justify-center py-20 text-center gap-2">
                <div className="w-6 h-6 border-2 border-slate-200 border-t-indigo-600 rounded-full animate-spin"></div>
                <p className="text-[10px] text-slate-400 font-medium">Downloading operational sync records...</p>
              </div>
            ) : aggregatorLogs.length === 0 ? (
              <div className="text-center py-20 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <HelpCircle className="w-8 h-8 text-slate-350 mx-auto" />
                <h5 className="text-xs font-bold text-slate-700 mt-2">No aggregator logs available</h5>
                <p className="text-[10px] text-slate-400 mt-0.5">Use the simulator on the left to trigger inbound webhooks or sync menu items.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                      <th className="pb-2">Timestamp</th>
                      <th className="pb-2">Event Scope</th>
                      <th className="pb-2">Platform</th>
                      <th className="pb-2">Sales ID / Ref</th>
                      <th className="pb-2 text-right">Settlement ($)</th>
                      <th className="pb-2 text-center">API Response</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xxs font-semibold text-slate-700">
                    {aggregatorLogs.map((log: any) => {
                      const comm = log.commissionDeducted || 0;
                      const payout = log.payoutAmount || log.amount || 0;
                      const isFailed = log.responseStatus === "failure" || log.status === "failed";
                      
                      return (
                        <tr key={log.id} className="hover:bg-slate-50/50">
                          <td className="py-2.5 font-mono text-[9px] text-slate-400">
                            {new Date(log.timestamp || log.createdAt).toLocaleTimeString()}
                          </td>
                          <td className="py-2.5">
                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                              log.eventType === "inbound_webhook" ? "bg-emerald-50 text-emerald-700" : "bg-indigo-50 text-indigo-700"
                            }`}>
                              {log.eventType === "inbound_webhook" ? "Order Ingestion" : log.eventType || "Menu Sync"}
                            </span>
                          </td>
                          <td className="py-2.5 capitalize font-bold text-slate-900">{log.platform}</td>
                          <td className="py-2.5 font-mono text-[9px]">{log.platformOrderId || log.syncedItemsCount || "-"}</td>
                          <td className="py-2.5 text-right font-mono">
                            {comm > 0 ? (
                              <div className="space-y-0.5">
                                <p className="text-slate-800">${payout.toFixed(2)}</p>
                                <p className="text-[8px] text-rose-500 font-semibold italic">Deduct ${comm.toFixed(2)} commission</p>
                              </div>
                            ) : (
                              log.amount ? `$${log.amount.toFixed(2)}` : "Catalog push"
                            )}
                          </td>
                          <td className="py-2.5 text-center">
                            {isFailed ? (
                              <div className="flex flex-col items-center gap-1">
                                <span className="text-[8px] bg-rose-50 text-rose-700 border border-rose-200 px-1.5 py-0.2 rounded font-black uppercase flex items-center gap-0.5">
                                  <ShieldAlert className="w-2.5 h-2.5" /> Failed
                                </span>
                                <button
                                  onClick={() => handleRetryFailedStatusPush(log.id)}
                                  className="text-[8px] text-indigo-650 hover:text-indigo-850 font-black flex items-center gap-0.5 cursor-pointer"
                                >
                                  <RefreshCw className="w-2.5 h-2.5" /> Retry Push
                                </button>
                              </div>
                            ) : (
                              <span className="text-[8px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.2 rounded font-black uppercase">
                                ✓ Connected
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
      </div>
    );
  };

  const renderHrTab = () => {
    // Modals & Action Handlers
    const handleAddStaff = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
        const res = await fetch("/api/staff", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...empForm,
            baseSalary: empForm.baseSalary * 100, // convert to piasters
            hourlyRate: empForm.hourlyRate * 100 // convert to piasters
          })
        });
        if (res.ok) {
          setShowAddEmployeeModal(false);
          setEmpForm({
            name: "",
            role: "cashier",
            pin: "1234",
            nationalId: "",
            phone: "",
            address: "",
            jobTitle: "",
            department: "FOH",
            employmentType: "full_time",
            salaryType: "monthly",
            baseSalary: 3000,
            hourlyRate: 15,
            overtimeRate: 1.5,
            biometricId: "",
            biometricDeviceId: "dev-1"
          });
          fetchHrData();
        }
      } catch (err) {
        console.error(err);
      }
    };

    const handleUpdateStaffProfile = async (staffId: string, updatedFields: Partial<StaffUser>) => {
      try {
        const res = await fetch(`/api/staff/${staffId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedFields)
        });
        if (res.ok) {
          fetchHrData();
        }
      } catch (err) {
        console.error(err);
      }
    };

    const handleAddAllowance = async (staffId: string) => {
      if (!newAllowance.name || newAllowance.amount <= 0) return;
      const staff = staffList.find((s) => s.id === staffId);
      if (!staff) return;

      const allowances = [...(staff.allowances || [])];
      allowances.push({
        id: `allow-${Date.now()}`,
        name: newAllowance.name,
        amount: newAllowance.type === "fixed" ? newAllowance.amount * 100 : newAllowance.amount, // piasters if fixed, % if pct
        type: newAllowance.type,
        active: true
      });

      await handleUpdateStaffProfile(staffId, { allowances });
      setNewAllowance({ name: "", amount: 0, type: "fixed" });
    };

    const handleToggleAllowance = async (staffId: string, allowanceId: string) => {
      const staff = staffList.find((s) => s.id === staffId);
      if (!staff) return;

      const allowances = (staff.allowances || []).map((a) => 
        a.id === allowanceId ? { ...a, active: !a.active } : a
      );

      await handleUpdateStaffProfile(staffId, { allowances });
    };

    const handleAddDeduction = async (staffId: string) => {
      if (!newDeduction.name || newDeduction.amount <= 0) return;
      const staff = staffList.find((s) => s.id === staffId);
      if (!staff) return;

      const deductions = [...(staff.deductions || [])];
      deductions.push({
        id: `ded-${Date.now()}`,
        name: newDeduction.name,
        amount: newDeduction.type === "fixed" ? newDeduction.amount * 100 : newDeduction.amount,
        type: newDeduction.type,
        active: true
      });

      await handleUpdateStaffProfile(staffId, { deductions });
      setNewDeduction({ name: "", amount: 0, type: "fixed" });
    };

    const handleToggleDeduction = async (staffId: string, deductionId: string) => {
      const staff = staffList.find((s) => s.id === staffId);
      if (!staff) return;

      const deductions = (staff.deductions || []).map((d) => 
        d.id === deductionId ? { ...d, active: !d.active } : d
      );

      await handleUpdateStaffProfile(staffId, { deductions });
    };

    const handleManualAttendance = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!attForm.employeeId) return;

      const checkInISO = `${attForm.date}T${attForm.checkInTime}:00.000Z`;
      const checkOutISO = `${attForm.date}T${attForm.checkOutTime}:00.000Z`;

      try {
        const res = await fetch("/api/attendance/manual-entry", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            employeeId: attForm.employeeId,
            date: attForm.date,
            checkIn: checkInISO,
            checkOut: checkOutISO,
            manualEntryNote: attForm.note,
            status: attForm.status,
            checkInSource: "manual",
            checkOutSource: "manual"
          })
        });
        if (res.ok) {
          setShowManualAttendanceModal(false);
          setAttForm({
            employeeId: "",
            date: new Date().toISOString().split("T")[0],
            checkInTime: "09:00",
            checkOutTime: "17:00",
            note: "",
            status: "present"
          });
          fetchHrData();
        }
      } catch (err) {
        console.error(err);
      }
    };

    const handleApproveLeave = async (id: string) => {
      const note = prompt("Approved Review Note (optional):") || "Approved";
      try {
        const res = await fetch(`/api/leave/${id}/approve`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reviewNote: note })
        });
        if (res.ok) {
          fetchHrData();
        }
      } catch (err) {
        console.error(err);
      }
    };

    const handleRejectLeave = async (id: string) => {
      const note = prompt("Reason for Rejection:") || "Rejected";
      try {
        const res = await fetch(`/api/leave/${id}/reject`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reviewNote: note })
        });
        if (res.ok) {
          fetchHrData();
        }
      } catch (err) {
        console.error(err);
      }
    };

    const handleCalculatePayroll = async () => {
      try {
        const res = await fetch("/api/payroll/calculate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            branchId: "branch-a",
            period: selectedPayrollPeriod
          })
        });
        if (res.ok) {
          const run = await res.json();
          setActivePayrollRun(run);
          fetchHrData();
        }
      } catch (err) {
        console.error(err);
      }
    };

    const handleApprovePayroll = async (runId: string) => {
      try {
        const res = await fetch(`/api/payroll/${runId}/approve`, {
          method: "PATCH"
        });
        if (res.ok) {
          const updated = await res.json();
          setActivePayrollRun(updated);
          fetchHrData();
        }
      } catch (err) {
        console.error(err);
      }
    };

    const handleMarkPaidPayroll = async (runId: string) => {
      const method = prompt("Enter payment method (bank_transfer / cash / wallet):") || "bank_transfer";
      try {
        const res = await fetch(`/api/payroll/${runId}/mark-paid`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentMethod: method })
        });
        if (res.ok) {
          const updated = await res.json();
          setActivePayrollRun(updated);
          fetchHrData();
        }
      } catch (err) {
        console.error(err);
      }
    };

    const handleSyncDevice = async (id: string) => {
      try {
        const res = await fetch(`/api/biometric/devices/${id}/sync`, { method: "POST" });
        if (res.ok) {
          const data = await res.json();
          alert(`Successfully synced biometric log hashes!\nSynced: ${data.syncedCount} new check-in/out records from device terminal.`);
          fetchHrData();
        }
      } catch (err) {
        console.error(err);
      }
    };

    const handleAddDevice = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
        const res = await fetch("/api/biometric/devices", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(devForm)
        });
        if (res.ok) {
          setShowAddDeviceModal(false);
          setDevForm({
            name: "",
            ipAddress: "192.168.1.100",
            port: 4370,
            deviceSecret: "zkteco-secret-key-1",
            syncMethod: "both"
          });
          fetchHrData();
        }
      } catch (err) {
        console.error(err);
      }
    };

    const getStatusPill = (status: string) => {
      switch (status) {
        case "present":
          return <span className="px-2 py-0.5 text-xxs bg-emerald-50 text-emerald-700 font-bold rounded-full">حاضر (Present)</span>;
        case "late":
          return <span className="px-2 py-0.5 text-xxs bg-amber-50 text-amber-700 font-bold rounded-full">متأخر (Late)</span>;
        case "absent":
          return <span className="px-2 py-0.5 text-xxs bg-rose-50 text-rose-700 font-bold rounded-full">غائب (Absent)</span>;
        case "leave":
          return <span className="px-2 py-0.5 text-xxs bg-indigo-50 text-indigo-700 font-bold rounded-full">إجازة (Leave)</span>;
        default:
          return <span className="px-2 py-0.5 text-xxs bg-slate-50 text-slate-700 font-bold rounded-full">{status}</span>;
      }
    };

    // Filters
    const filteredStaff = staffList.filter((s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.employeeCode.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const todayStr = new Date().toISOString().split("T")[0];
    const todayLogs = attendanceLogs.filter((l) => l.date === todayStr);

    return (
      <div className="space-y-6 animate-fade-in">
        {/* Module Header card */}
        <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-rose-500 text-white rounded-md text-[10px] font-bold tracking-wider uppercase">SaaS Module</span>
              <h2 className="text-xl font-bold tracking-tight">HR, Attendance & Payroll Portal</h2>
            </div>
            <p className="text-xxs text-slate-400 mt-1">
              Synchronized biometric logs, real-time Egyptian compliant payroll calculation, and central employee roster management.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => fetchHrData()}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-750 text-xxs font-bold rounded-lg flex items-center gap-1.5 transition cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 animate-spin-hover" />
              Refresh
            </button>
            <button
              onClick={() => setShowManualAttendanceModal(true)}
              className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-xxs font-bold rounded-lg flex items-center gap-1.5 transition cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              Record Manual Entry
            </button>
          </div>
        </div>

        {/* HR Sub-tabs Header */}
        <div className="flex border-b border-slate-200 overflow-x-auto gap-4">
          {[
            { id: "attendance", label: "Live attendance", icon: Clock },
            { id: "employees", label: "Employee register", icon: Users },
            { id: "schedules", label: "Shift planner", icon: Calendar },
            { id: "leaves", label: "Leaves center", icon: Briefcase },
            { id: "payroll", label: "Payroll engine", icon: DollarSign },
            { id: "devices", label: "Biometric terminals", icon: Fingerprint }
          ].map((t) => {
            const Icon = t.icon;
            const isSel = hrSubTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setHrSubTab(t.id as any)}
                className={`pb-3 text-xs font-bold border-b-2 px-1 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  isSel
                    ? "border-rose-600 text-rose-600 font-extrabold"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                <Icon className={`w-4 h-4 ${isSel ? "text-rose-600" : "text-slate-400"}`} />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* --- 1. LIVE ATTENDANCE DASHBOARD PANEL --- */}
        {hrSubTab === "attendance" && (
          <div className="space-y-6">
            {/* KPI grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-xs flex items-center gap-3">
                <div className="p-2.5 bg-slate-50 rounded-xl text-slate-600">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Total Active Staff</p>
                  <h3 className="text-lg font-bold text-slate-800">{staffList.length}</h3>
                </div>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-xs flex items-center gap-3">
                <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Checked-In Today</p>
                  <h3 className="text-lg font-bold text-slate-800">{todayLogs.filter((l) => l.checkIn).length}</h3>
                </div>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-xs flex items-center gap-3">
                <div className="p-2.5 bg-amber-50 rounded-xl text-amber-600">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Late Today</p>
                  <h3 className="text-lg font-bold text-slate-800">{todayLogs.filter((l) => l.status === "late").length}</h3>
                </div>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-xs flex items-center gap-3">
                <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">On Approved Leave</p>
                  <h3 className="text-lg font-bold text-slate-800">{todayLogs.filter((l) => l.status === "leave").length}</h3>
                </div>
              </div>
            </div>

            {/* Attendance logs list card */}
            <div className="bg-white rounded-2xl border border-slate-150 shadow-xs">
              <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Attendance Sheet (سجل الحضور والإنصراف)</h3>
                  <p className="text-xxs text-slate-500 mt-0.5">Real-time terminal checks and manual entries for today.</p>
                </div>
                <span className="px-3 py-1 bg-slate-50 rounded-lg text-xxs font-bold text-slate-700 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                  Live Today: {todayStr}
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                      <th className="p-4">Staff Member</th>
                      <th className="p-4">Code</th>
                      <th className="p-4">Check-In</th>
                      <th className="p-4">Check-Out</th>
                      <th className="p-4">Hours Worked</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Method / Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {staffList.map((emp) => {
                      const log = attendanceLogs.find((l) => l.employeeId === emp.id && l.date === todayStr);
                      return (
                        <tr key={emp.id} className="hover:bg-slate-50/50 transition">
                          <td className="p-4 font-bold text-slate-800">{emp.name}</td>
                          <td className="p-4 text-xxs text-slate-500 font-mono">{emp.employeeCode}</td>
                          <td className="p-4 font-mono text-xxs">
                            {log?.checkIn ? new Date(log.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "—"}
                          </td>
                          <td className="p-4 font-mono text-xxs">
                            {log?.checkOut ? new Date(log.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "—"}
                          </td>
                          <td className="p-4 font-mono font-bold text-slate-700">
                            {log?.hoursWorked ? `${log.hoursWorked.toFixed(2)} hrs` : "0.00"}
                          </td>
                          <td className="p-4">{getStatusPill(log?.status || "absent")}</td>
                          <td className="p-4 text-right text-xxs text-slate-500">
                            {log ? (
                              <div className="flex flex-col items-end">
                                <span className="font-semibold flex items-center gap-1">
                                  {log.checkInSource === "biometric" ? (
                                    <>
                                      <Fingerprint className="w-3 h-3 text-rose-500" />
                                      ZK biometric
                                    </>
                                  ) : (
                                    "Manual Owner HUD"
                                  )}
                                </span>
                                {log.manualEntryNote && <span className="text-[10px] text-amber-600 mt-0.5">{log.manualEntryNote}</span>}
                              </div>
                            ) : (
                              <span className="text-slate-400 italic">No punches today</span>
                            )}
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

        {/* --- 2. EMPLOYEE REGISTER PANEL --- */}
        {hrSubTab === "employees" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white rounded-2xl border border-slate-150 p-5 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="relative w-full md:w-64">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search name or EMP code..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-xl text-xxs focus:outline-none focus:border-rose-500"
                  />
                </div>
                <button
                  onClick={() => setShowAddEmployeeModal(true)}
                  className="w-full md:w-auto px-4 py-2 bg-slate-900 hover:bg-slate-800 text-xxs font-bold text-white rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  Add Employee
                </button>
              </div>

              <div className="bg-white rounded-2xl border border-slate-150 shadow-xs overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                      <th className="p-4">Name</th>
                      <th className="p-4">Job Title</th>
                      <th className="p-4">Base Salary</th>
                      <th className="p-4">Fingerprint ID</th>
                      <th className="p-4">PIN</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredStaff.map((emp) => {
                      const isSelected = selectedEmployee?.id === emp.id;
                      return (
                        <tr
                          key={emp.id}
                          onClick={() => {
                            setSelectedEmployee(emp);
                            setEditingStaffId(emp.id);
                          }}
                          className={`hover:bg-slate-55/60 transition cursor-pointer ${
                            isSelected ? "bg-rose-50/40 border-l-4 border-rose-600" : ""
                          }`}
                        >
                          <td className="p-4 font-bold text-slate-800">
                            <div>{emp.name}</div>
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">{emp.employeeCode} • {emp.department}</div>
                          </td>
                          <td className="p-4 text-slate-600 font-medium">
                            <span className="px-2 py-0.5 bg-slate-100 rounded-md text-xxs">{emp.jobTitle}</span>
                          </td>
                          <td className="p-4 font-bold text-slate-800">
                            EGP {(emp.baseSalary / 100).toLocaleString([], { minimumFractionDigits: 2 })}
                            <span className="text-[10px] text-slate-400 font-medium block">/{emp.salaryType}</span>
                          </td>
                          <td className="p-4 font-mono text-xxs text-slate-500">
                            {emp.biometricId ? (
                              <span className="flex items-center gap-1 text-slate-700">
                                <Fingerprint className="w-3.5 h-3.5 text-rose-500" />
                                Code: {emp.biometricId}
                              </span>
                            ) : (
                              <span className="text-amber-500 font-semibold italic">Unmapped</span>
                            )}
                          </td>
                          <td className="p-4 font-mono text-xxs text-slate-500">{emp.pin}</td>
                          <td className="p-4 text-right">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedEmployee(emp);
                                setEditingStaffId(emp.id);
                              }}
                              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Employee Profile and Allowance Config side-panel */}
            <div className="bg-white rounded-2xl border border-slate-150 p-5 shadow-xs space-y-6">
              {selectedEmployee ? (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">{selectedEmployee.name}</h3>
                    <p className="text-xxs text-slate-500 font-mono">{selectedEmployee.employeeCode} • Profile Center</p>
                  </div>

                  {/* Tabs within configuration */}
                  <div className="flex border-b border-slate-100 gap-4 text-xxs font-bold">
                    <button
                      onClick={() => setEditingStaffTab("profile")}
                      className={`pb-2 ${editingStaffTab === "profile" ? "text-rose-600 border-b-2 border-rose-600" : "text-slate-400"}`}
                    >
                      Basic Info
                    </button>
                    <button
                      onClick={() => setEditingStaffTab("allowances")}
                      className={`pb-2 ${editingStaffTab === "allowances" ? "text-rose-600 border-b-2 border-rose-600" : "text-slate-400"}`}
                    >
                      Allowances ({selectedEmployee.allowances?.length || 0})
                    </button>
                    <button
                      onClick={() => setEditingStaffTab("deductions")}
                      className={`pb-2 ${editingStaffTab === "deductions" ? "text-rose-600 border-b-2 border-rose-600" : "text-slate-400"}`}
                    >
                      Deductions ({selectedEmployee.deductions?.length || 0})
                    </button>
                  </div>

                  {/* Basic Profile editing tab */}
                  {editingStaffTab === "profile" && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Base Monthly Salary (EGP)</label>
                        <input
                          type="number"
                          value={selectedEmployee.baseSalary / 100}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            handleUpdateStaffProfile(selectedEmployee.id, { baseSalary: val * 100 });
                            setSelectedEmployee({ ...selectedEmployee, baseSalary: val * 100 });
                          }}
                          className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xxs focus:outline-none focus:border-rose-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Fingerprint Biometric Mapping ID</label>
                        <input
                          type="text"
                          value={selectedEmployee.biometricId || ""}
                          onChange={(e) => {
                            handleUpdateStaffProfile(selectedEmployee.id, { biometricId: e.target.value });
                            setSelectedEmployee({ ...selectedEmployee, biometricId: e.target.value });
                          }}
                          className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xxs font-mono focus:outline-none focus:border-rose-500"
                          placeholder="ZKTeco Registered User ID"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">PIN Code</label>
                          <input
                            type="text"
                            value={selectedEmployee.pin}
                            onChange={(e) => {
                              handleUpdateStaffProfile(selectedEmployee.id, { pin: e.target.value });
                              setSelectedEmployee({ ...selectedEmployee, pin: e.target.value });
                            }}
                            className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xxs font-mono focus:outline-none focus:border-rose-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Department</label>
                          <select
                            value={selectedEmployee.department}
                            onChange={(e) => {
                              handleUpdateStaffProfile(selectedEmployee.id, { department: e.target.value });
                              setSelectedEmployee({ ...selectedEmployee, department: e.target.value });
                            }}
                            className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xxs focus:outline-none focus:border-rose-500"
                          >
                            <option value="FOH">Front of House (FOH)</option>
                            <option value="BOH">Back of House (BOH)</option>
                            <option value="Management">Management</option>
                            <option value="Delivery">Delivery / Logistics</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Allowances List & Creation tab */}
                  {editingStaffTab === "allowances" && (
                    <div className="space-y-4">
                      <div className="border border-slate-100 rounded-xl p-3 bg-slate-50 space-y-2">
                        <span className="text-[10px] text-slate-500 font-bold block">Add Allowance</span>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            placeholder="e.g. بدل وجبات"
                            value={newAllowance.name}
                            onChange={(e) => setNewAllowance({ ...newAllowance, name: e.target.value })}
                            className="px-2 py-1 border border-slate-250 rounded-lg text-xxs bg-white focus:outline-none"
                          />
                          <input
                            type="number"
                            placeholder="Amount EGP"
                            value={newAllowance.amount || ""}
                            onChange={(e) => setNewAllowance({ ...newAllowance, amount: parseFloat(e.target.value) || 0 })}
                            className="px-2 py-1 border border-slate-250 rounded-lg text-xxs bg-white focus:outline-none"
                          />
                        </div>
                        <button
                          onClick={() => handleAddAllowance(selectedEmployee.id)}
                          className="w-full py-1 bg-slate-800 text-white rounded-lg text-xxs font-bold"
                        >
                          Add Allowance to salary schedule
                        </button>
                      </div>

                      <div className="space-y-2">
                        <span className="text-[10px] text-slate-400 font-bold block">Configured Allowances (العلاوات والبدلات)</span>
                        {selectedEmployee.allowances && selectedEmployee.allowances.length > 0 ? (
                          <div className="divide-y divide-slate-100 bg-white border border-slate-100 rounded-xl">
                            {selectedEmployee.allowances.map((al) => (
                              <div key={al.id} className="p-3 flex justify-between items-center text-xxs">
                                <div>
                                  <span className="font-bold text-slate-800">{al.name}</span>
                                  <span className="text-[10px] text-slate-400 block">
                                    {al.type === "fixed" ? `EGP ${al.amount / 100}` : `${al.amount}% of base`}
                                  </span>
                                </div>
                                <input
                                  type="checkbox"
                                  checked={al.active}
                                  onChange={() => handleToggleAllowance(selectedEmployee.id, al.id)}
                                  className="w-3.5 h-3.5 accent-rose-600 cursor-pointer"
                                />
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xxs text-slate-400 italic block">No allowance templates mapped.</span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Deductions List & Creation tab */}
                  {editingStaffTab === "deductions" && (
                    <div className="space-y-4">
                      <div className="border border-slate-100 rounded-xl p-3 bg-slate-50 space-y-2">
                        <span className="text-[10px] text-slate-500 font-bold block">Add Deduction</span>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            placeholder="e.g. تأمين طبي"
                            value={newDeduction.name}
                            onChange={(e) => setNewDeduction({ ...newDeduction, name: e.target.value })}
                            className="px-2 py-1 border border-slate-250 rounded-lg text-xxs bg-white focus:outline-none"
                          />
                          <input
                            type="number"
                            placeholder="Amount EGP"
                            value={newDeduction.amount || ""}
                            onChange={(e) => setNewDeduction({ ...newDeduction, amount: parseFloat(e.target.value) || 0 })}
                            className="px-2 py-1 border border-slate-250 rounded-lg text-xxs bg-white focus:outline-none"
                          />
                        </div>
                        <button
                          onClick={() => handleAddDeduction(selectedEmployee.id)}
                          className="w-full py-1 bg-slate-800 text-white rounded-lg text-xxs font-bold"
                        >
                          Add Deduction schedule
                        </button>
                      </div>

                      <div className="space-y-2">
                        <span className="text-[10px] text-slate-400 font-bold block">Configured Deductions (الإستقطاعات)</span>
                        {selectedEmployee.deductions && selectedEmployee.deductions.length > 0 ? (
                          <div className="divide-y divide-slate-100 bg-white border border-slate-100 rounded-xl">
                            {selectedEmployee.deductions.map((de) => (
                              <div key={de.id} className="p-3 flex justify-between items-center text-xxs">
                                <div>
                                  <span className="font-bold text-slate-800">{de.name}</span>
                                  <span className="text-[10px] text-slate-400 block">
                                    {de.type === "fixed" ? `EGP ${de.amount / 100}` : `${de.amount}% of base`}
                                  </span>
                                </div>
                                <input
                                  type="checkbox"
                                  checked={de.active}
                                  onChange={() => handleToggleDeduction(selectedEmployee.id, de.id)}
                                  className="w-3.5 h-3.5 accent-rose-600 cursor-pointer"
                                />
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xxs text-slate-400 italic block">No deductions mapped.</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center gap-2">
                  <Users className="w-8 h-8 text-slate-200" />
                  <p className="text-xxs text-slate-400">Select an employee from the table register to view, edit, or configure profile specifics.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- 3. WEEKLY SHIFT PLANNER --- */}
        {hrSubTab === "schedules" && (
          <div className="bg-white rounded-2xl border border-slate-150 p-6 shadow-xs space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800 font-mono">Shift Schedules & Duty Planner</h3>
                <p className="text-xxs text-slate-500 mt-0.5">Configure contracted working shifts for standard biometric check-in grace checks.</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xxs text-slate-400 font-bold">Week Starting:</span>
                <span className="px-3 py-1 bg-slate-100 rounded-lg text-xxs font-mono font-bold text-slate-700">2026-06-22</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-slate-100 rounded-xl">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100 text-center">
                    <th className="p-3 text-left">Employee</th>
                    <th className="p-3">Mon (الإثنين)</th>
                    <th className="p-3">Tue (الثلاثاء)</th>
                    <th className="p-3">Wed (الأربعاء)</th>
                    <th className="p-3">Thu (الخميس)</th>
                    <th className="p-3">Fri (الجمعة)</th>
                    <th className="p-3">Sat (السبت)</th>
                    <th className="p-3">Sun (الأحد)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-center">
                  {staffList.map((emp) => {
                    const sched = schedules.find((s) => s.employeeId === emp.id && s.weekStartDate === "2026-06-22");
                    const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;
                    return (
                      <tr key={emp.id} className="hover:bg-slate-50/40">
                        <td className="p-3 text-left font-bold text-slate-800">
                          {emp.name}
                          <span className="text-[10px] text-slate-400 block">{emp.jobTitle}</span>
                        </td>
                        {days.map((day) => {
                          const shift = sched?.days?.[day];
                          return (
                            <td key={day} className="p-3 text-center">
                              {shift?.isWorkDay ? (
                                <div className="p-1 bg-emerald-50 rounded-lg text-emerald-800 text-[10px] font-semibold">
                                  {shift.shiftStart} - {shift.shiftEnd}
                                  <span className="text-[9px] text-emerald-600 block">{shift.contractedHours} hrs</span>
                                </div>
                              ) : (
                                <div className="p-1 bg-rose-50 rounded-lg text-rose-700 text-[10px] font-semibold">
                                  Rest Day
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- 4. LEAVES MANAGEMENT CENTER --- */}
        {hrSubTab === "leaves" && (
          <div className="bg-white rounded-2xl border border-slate-150 p-6 shadow-xs space-y-6">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Time-off & Annual Leaves Ledger</h3>
              <p className="text-xxs text-slate-500 mt-0.5">Review, approve, or reject employee annual leave and sick day logs.</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-slate-100 rounded-xl">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                    <th className="p-4">Employee</th>
                    <th className="p-4">Leave Type</th>
                    <th className="p-4">Dates</th>
                    <th className="p-4">Total Days</th>
                    <th className="p-4">Reason Given</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Approvals</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {leaveRequests.length > 0 ? (
                    leaveRequests.map((req) => (
                      <tr key={req.id} className="hover:bg-slate-50/50">
                        <td className="p-4 font-bold text-slate-800">{req.employeeName}</td>
                        <td className="p-4 capitalize">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            req.leaveType === "sick" ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-850"
                          }`}>
                            {req.leaveType}
                          </span>
                        </td>
                        <td className="p-4 font-mono text-xxs text-slate-600">
                          {req.startDate} to {req.endDate}
                        </td>
                        <td className="p-4 font-bold text-slate-700">{req.totalDays} Days</td>
                        <td className="p-4 text-xxs text-slate-500 italic max-w-xs truncate">{req.reason}</td>
                        <td className="p-4">
                          {req.status === "pending" && <span className="px-2 py-0.5 text-xxs bg-amber-50 text-amber-700 font-bold rounded-full">معلق (Pending)</span>}
                          {req.status === "approved" && <span className="px-2 py-0.5 text-xxs bg-emerald-50 text-emerald-700 font-bold rounded-full">مقبول (Approved)</span>}
                          {req.status === "rejected" && <span className="px-2 py-0.5 text-xxs bg-rose-50 text-rose-700 font-bold rounded-full">مرفوض (Rejected)</span>}
                        </td>
                        <td className="p-4 text-right">
                          {req.status === "pending" ? (
                            <div className="flex justify-end gap-1.5">
                              <button
                                onClick={() => handleApproveLeave(req.id)}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-550 text-white font-bold text-[10px] rounded-lg cursor-pointer"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleRejectLeave(req.id)}
                                className="px-2.5 py-1 bg-rose-600 hover:bg-rose-550 text-white font-bold text-[10px] rounded-lg cursor-pointer"
                              >
                                Reject
                              </button>
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">
                              Reviewed by {req.reviewedBy} {req.reviewNote && `(${req.reviewNote})`}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400 italic">
                        No historical leave requests filed in ledger.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- 5. EGYPTIAN COMPLIANT PAYROLL ENGINE --- */}
        {hrSubTab === "payroll" && (
          <div className="space-y-6">
            {/* Run Payroll trigger card */}
            <div className="bg-white rounded-2xl border border-slate-150 p-5 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-rose-50 rounded-xl text-rose-600">
                  <DollarSign className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Salary Calculation Center (نظام حساب الرواتب)</h3>
                  <p className="text-xxs text-slate-500">Calculate net payroll with absent deductions, delay fines, custom allowances and taxes.</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <input
                  type="month"
                  value={selectedPayrollPeriod}
                  onChange={(e) => setSelectedPayrollPeriod(e.target.value)}
                  className="px-3 py-1.5 border border-slate-200 rounded-xl text-xxs font-bold focus:outline-none focus:border-rose-500"
                />
                <button
                  onClick={() => handleCalculatePayroll()}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-xxs font-bold text-white rounded-xl transition cursor-pointer"
                >
                  Run Salary Engine
                </button>
              </div>
            </div>

            {/* Calculated payroll sheet if available */}
            {activePayrollRun ? (
              <div className="space-y-6">
                {/* Aggregate overview metrics */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div className="bg-slate-50 border border-slate-150 p-4 rounded-xl text-center">
                    <span className="text-[9px] text-slate-500 uppercase tracking-wider block mb-1">Gross Payroll</span>
                    <span className="text-sm font-bold text-slate-800 font-mono">EGP {(activePayrollRun.totals.grossPayroll / 100).toLocaleString()}</span>
                  </div>
                  <div className="bg-slate-50 border border-slate-150 p-4 rounded-xl text-center">
                    <span className="text-[9px] text-slate-500 uppercase tracking-wider block mb-1">Total Allowances</span>
                    <span className="text-sm font-bold text-emerald-700 font-mono">+ EGP {(activePayrollRun.totals.totalAllowances / 100).toLocaleString()}</span>
                  </div>
                  <div className="bg-slate-50 border border-slate-150 p-4 rounded-xl text-center">
                    <span className="text-[9px] text-slate-500 uppercase tracking-wider block mb-1">Deductions & Fines</span>
                    <span className="text-sm font-bold text-rose-700 font-mono">- EGP {(activePayrollRun.totals.totalDeductions / 100).toLocaleString()}</span>
                  </div>
                  <div className="bg-slate-50 border border-slate-150 p-4 rounded-xl text-center">
                    <span className="text-[9px] text-slate-500 uppercase tracking-wider block mb-1">Total Overtime Pay</span>
                    <span className="text-sm font-bold text-indigo-700 font-mono">+ EGP {(activePayrollRun.totals.totalOvertimePay / 100).toLocaleString()}</span>
                  </div>
                  <div className="bg-slate-900 text-white p-4 rounded-xl text-center">
                    <span className="text-[9px] text-slate-400 uppercase tracking-wider block mb-1">Net Disbursement</span>
                    <span className="text-sm font-bold font-mono">EGP {(activePayrollRun.totals.netPayroll / 100).toLocaleString()}</span>
                  </div>
                </div>

                {/* Payroll run header and controls */}
                <div className="bg-white rounded-2xl border border-slate-150 shadow-xs">
                  <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">Individual Staff Salary Breakdown</h4>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] text-slate-500">Status:</span>
                        {activePayrollRun.status === "draft" && (
                          <span className="px-2 py-0.5 bg-amber-150 text-amber-800 font-bold text-[9px] rounded-full uppercase tracking-wider">Draft Payroll</span>
                        )}
                        {activePayrollRun.status === "approved" && (
                          <span className="px-2 py-0.5 bg-emerald-500 text-white font-bold text-[9px] rounded-full uppercase tracking-wider flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            Approved
                          </span>
                        )}
                        {activePayrollRun.status === "paid" && (
                          <span className="px-2 py-0.5 bg-blue-600 text-white font-bold text-[9px] rounded-full uppercase tracking-wider">Disbursed (Paid)</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {activePayrollRun.status === "draft" && (
                        <button
                          onClick={() => handleApprovePayroll(activePayrollRun.id)}
                          className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xxs rounded-lg cursor-pointer"
                        >
                          Approve and Finalize Sheet
                        </button>
                      )}
                      {activePayrollRun.status === "approved" && (
                        <button
                          onClick={() => handleMarkPaidPayroll(activePayrollRun.id)}
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xxs rounded-lg cursor-pointer"
                        >
                          Mark as Disbursed (Paid)
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Individual employee sheet table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                          <th className="p-4">Employee</th>
                          <th className="p-4">Base Salary</th>
                          <th className="p-4">Overtime Pay</th>
                          <th className="p-4">Late Delay Fine</th>
                          <th className="p-4">Absence Cut</th>
                          <th className="p-4">Allowances</th>
                          <th className="p-4">Taxes / Insurance</th>
                          <th className="p-4 font-bold text-slate-900">Net EGP</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono">
                        {activePayrollRun.employees.map((slip: any) => (
                          <tr key={slip.employeeId} className="hover:bg-slate-50/50">
                            <td className="p-4 font-sans font-bold text-slate-800 text-xs">{slip.employeeName}</td>
                            <td className="p-4">EGP {(slip.baseSalary / 100).toLocaleString()}</td>
                            <td className="p-4 text-emerald-600 font-semibold">+ EGP {(slip.overtimePay / 100).toLocaleString()}</td>
                            <td className="p-4 text-rose-600 font-semibold">- EGP {(slip.lateDeduction / 100).toLocaleString()}</td>
                            <td className="p-4 text-rose-600 font-semibold">- EGP {(slip.absentDeduction / 100).toLocaleString()}</td>
                            <td className="p-4 text-emerald-600 font-semibold">+ EGP {(slip.totalAllowances / 100).toLocaleString()}</td>
                            <td className="p-4 text-rose-600 font-semibold">- EGP {(slip.totalDeductions / 100).toLocaleString()}</td>
                            <td className="p-4 text-xs font-bold font-sans text-slate-900">EGP {(slip.netPay / 100).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-24 text-center gap-3 bg-white border border-slate-150 rounded-2xl p-6">
                <DollarSign className="w-10 h-10 text-slate-200" />
                <div className="max-w-md">
                  <p className="text-xs font-bold text-slate-700">No Payroll Sheet Formulated</p>
                  <p className="text-xxs text-slate-400 mt-1">
                    Select a calendar month above and click "Run Salary Engine" to compile the active, biometrically reconciled payroll summary.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- 6. BIOMETRIC DEVICES CENTER PANEL --- */}
        {hrSubTab === "devices" && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-150 p-5 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Active Biometric Terminal registry</h3>
                <p className="text-xxs text-slate-500 mt-0.5">Register and manage fingerprint/face recognition devices (e.g., ZKTeco SDK terminals).</p>
              </div>
              <button
                onClick={() => setShowAddDeviceModal(true)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-xxs font-bold text-white rounded-xl flex items-center gap-1.5 transition cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                Add Biometric Device
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {biometricDevices.map((dev) => (
                <div key={dev.id} className="bg-white border border-slate-150 p-5 rounded-2xl shadow-xs space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2.5 bg-slate-50 text-slate-700 rounded-xl">
                        <Fingerprint className="w-5 h-5 text-rose-500 animate-pulse" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-850">{dev.name}</h4>
                        <span className="text-[10px] text-slate-400 font-semibold font-mono">
                          {dev.ipAddress}:{dev.port}
                        </span>
                      </div>
                    </div>
                    <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 font-bold rounded-full text-[9px] uppercase tracking-wider flex items-center gap-1">
                      <span className="w-1 h-1 bg-emerald-500 rounded-full"></span>
                      {dev.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 border-y border-slate-100 py-3 text-xxs">
                    <div>
                      <span className="text-[9px] text-slate-400 block uppercase font-bold">Sync Method</span>
                      <span className="font-semibold capitalize text-slate-700">{dev.syncMethod}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 block uppercase font-bold">Last Sync At</span>
                      <span className="font-semibold text-slate-700 font-mono">
                        {dev.lastSyncAt ? new Date(dev.lastSyncAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Never"}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center gap-3">
                    <span className="text-[10px] text-slate-400 font-mono select-all">Secret key: {dev.deviceSecret}</span>
                    <button
                      onClick={() => handleSyncDevice(dev.id)}
                      className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xxs rounded-lg flex items-center gap-1 transition cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Trigger ZKTeco Sync
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- MANUAL ATTENDANCE DIALOG OVERLAY MODAL --- */}
        {showManualAttendanceModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100 space-y-4 animate-scale-up">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Record Manual Attendance Entry</h3>
                  <p className="text-xxs text-slate-500">Record cashier or chef attendance manually as fallback override.</p>
                </div>
                <button
                  onClick={() => setShowManualAttendanceModal(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-750"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleManualAttendance} className="space-y-4">
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Select Employee</label>
                  <select
                    value={attForm.employeeId}
                    onChange={(e) => setAttForm({ ...attForm, employeeId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xxs focus:outline-none focus:border-rose-500"
                    required
                  >
                    <option value="">-- Choose Employee --</option>
                    {staffList.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} ({emp.employeeCode})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Date</label>
                    <input
                      type="date"
                      value={attForm.date}
                      onChange={(e) => setAttForm({ ...attForm, date: e.target.value })}
                      className="w-full px-2 py-1.5 border border-slate-200 rounded-xl text-xxs focus:outline-none focus:border-rose-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Check-In</label>
                    <input
                      type="time"
                      value={attForm.checkInTime}
                      onChange={(e) => setAttForm({ ...attForm, checkInTime: e.target.value })}
                      className="w-full px-2 py-1.5 border border-slate-200 rounded-xl text-xxs focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Check-Out</label>
                    <input
                      type="time"
                      value={attForm.checkOutTime}
                      onChange={(e) => setAttForm({ ...attForm, checkOutTime: e.target.value })}
                      className="w-full px-2 py-1.5 border border-slate-200 rounded-xl text-xxs focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Status Pin Override</label>
                  <select
                    value={attForm.status}
                    onChange={(e) => setAttForm({ ...attForm, status: e.target.value as any })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xxs focus:outline-none focus:border-rose-500"
                  >
                    <option value="present">حاضر (Present)</option>
                    <option value="late">متأخر (Late)</option>
                    <option value="absent">غائب (Absent)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Manual Override Reason Note</label>
                  <textarea
                    value={attForm.note}
                    onChange={(e) => setAttForm({ ...attForm, note: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xxs focus:outline-none focus:border-rose-500"
                    placeholder="Enter manual correction reasoning (e.g. نسي التوقيع بالبصمة)"
                    rows={2}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xxs rounded-xl"
                >
                  Save Override Log
                </button>
              </form>
            </div>
          </div>
        )}

        {/* --- ADD NEW EMPLOYEE DIALOG MODAL --- */}
        {showAddEmployeeModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100 space-y-4 animate-scale-up max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Register Staff Member</h3>
                  <p className="text-xxs text-slate-500">Create profile, pin codes, and base salary schedules.</p>
                </div>
                <button
                  onClick={() => setShowAddEmployeeModal(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-750"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleAddStaff} className="space-y-4 text-xs">
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Full Name (الاسم بالكامل)</label>
                  <input
                    type="text"
                    value={empForm.name}
                    onChange={(e) => setEmpForm({ ...empForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xxs focus:outline-none focus:border-rose-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Pin Override</label>
                    <input
                      type="text"
                      value={empForm.pin}
                      onChange={(e) => setEmpForm({ ...empForm, pin: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xxs font-mono"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Role / Access</label>
                    <select
                      value={empForm.role}
                      onChange={(e) => setEmpForm({ ...empForm, role: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xxs"
                    >
                      <option value="cashier">Cashier (كاشير)</option>
                      <option value="chef">Kitchen Chef (شيف)</option>
                      <option value="rider">Rider (طيار دليفري)</option>
                      <option value="manager">Branch Manager (مدير فرع)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Department</label>
                    <select
                      value={empForm.department}
                      onChange={(e) => setEmpForm({ ...empForm, department: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xxs"
                    >
                      <option value="FOH">Front of House (FOH)</option>
                      <option value="BOH">Back of House (BOH)</option>
                      <option value="Management">Management</option>
                      <option value="Delivery">Delivery Logistics</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Salary Type</label>
                    <select
                      value={empForm.salaryType}
                      onChange={(e) => setEmpForm({ ...empForm, salaryType: e.target.value as any })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xxs"
                    >
                      <option value="monthly">Monthly Salary</option>
                      <option value="hourly">Hourly wage</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Base Monthly (EGP)</label>
                    <input
                      type="number"
                      value={empForm.baseSalary}
                      onChange={(e) => setEmpForm({ ...empForm, baseSalary: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xxs"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">ZKTeco Biometric Mapping ID</label>
                    <input
                      type="text"
                      value={empForm.biometricId}
                      onChange={(e) => setEmpForm({ ...empForm, biometricId: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xxs font-mono"
                      placeholder="e.g. 5"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">National ID (14 Digits الرقم القومي)</label>
                  <input
                    type="text"
                    value={empForm.nationalId}
                    onChange={(e) => setEmpForm({ ...empForm, nationalId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xxs font-mono"
                    maxLength={14}
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xxs rounded-xl"
                >
                  Create Employee Profile
                </button>
              </form>
            </div>
          </div>
        )}

        {/* --- ADD NEW BIOMETRIC DEVICE TERMINAL DIALOG --- */}
        {showAddDeviceModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100 space-y-4 animate-scale-up">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Add Biometric Terminal</h3>
                  <p className="text-xxs text-slate-500">Register TCP IP biometric attendance hardware (ZKTeco compatible).</p>
                </div>
                <button
                  onClick={() => setShowAddDeviceModal(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-750"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleAddDevice} className="space-y-4 text-xs">
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Device Name (الموقع)</label>
                  <input
                    type="text"
                    value={devForm.name}
                    onChange={(e) => setDevForm({ ...devForm, name: e.target.value })}
                    placeholder="e.g. الباب الرئيسي - فرع التجمع"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xxs"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">TCP IP Address</label>
                    <input
                      type="text"
                      value={devForm.ipAddress}
                      onChange={(e) => setDevForm({ ...devForm, ipAddress: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xxs font-mono"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Port</label>
                    <input
                      type="number"
                      value={devForm.port}
                      onChange={(e) => setDevForm({ ...devForm, port: parseInt(e.target.value) || 4370 })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xxs font-mono"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Access Secret Token Key</label>
                  <input
                    type="text"
                    value={devForm.deviceSecret}
                    onChange={(e) => setDevForm({ ...devForm, deviceSecret: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xxs font-mono"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xxs rounded-xl"
                >
                  Register Hardware Device
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderShiftsTab = () => {
    if (loadingShifts) {
      return (
        <div className="flex flex-col items-center justify-center py-24 text-center gap-2">
          <div className="w-8 h-8 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin"></div>
          <p className="text-xs text-slate-500">Retrieving gapless cashier shift ledger...</p>
        </div>
      );
    }

    const activeShiftDetail = shifts.find((s) => s.id === selectedShiftId);

    if (activeShiftDetail) {
      const s = activeShiftDetail;
      const stats = s.liveStats || {
        totalSales: 0,
        orderCount: 0,
        salesByFulfillment: { dine_in: { count: 0, revenue: 0 }, takeaway: { count: 0, revenue: 0 }, delivery: { count: 0, revenue: 0 } },
        paymentsBreakdown: { cash: 0, card: 0, loyalty: 0 },
        cashSummary: { openingFloat: s.openingFloat, cashSales: 0, cashRefunds: 0, paidIn: 0, paidOut: 0, safeDrops: 0, expenses: 0, expectedInDrawer: s.openingFloat },
        deliverySummary: { riderBreakdown: [], aggregate: { totalDeliveries: 0, totalOutstanding: 0, totalSettled: 0 } },
        ordersByStatus: { completed: 0, voided: { count: 0, value: 0 }, refunded: { count: 0, value: 0 } },
        itemSummary: [],
        salesBySource: {}
      };

      // Format time
      const formatTime = (iso: string | null) => {
        if (!iso) return "N/A";
        return new Date(iso).toLocaleDateString() + " " + new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      };

      // Calculate shift duration
      const durationStr = () => {
        const start = new Date(s.openedAt).getTime();
        const end = s.closedAt ? new Date(s.closedAt).getTime() : Date.now();
        const diffMs = end - start;
        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours}h ${mins}m`;
      };

      return (
        <div className="space-y-6 animate-fade-in text-slate-800" id="shift-detail-report">
          {/* Header Actions */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <button
              onClick={() => setSelectedShiftId(null)}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white px-3.5 py-2 rounded-xl border border-slate-200 transition-colors shadow-xxs cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to Audit Desk
            </button>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-400">Layout Format:</span>
              <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button
                  onClick={() => setPrintLayout("screen")}
                  className={`px-3 py-1.5 text-xxs font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer ${printLayout === "screen" ? "bg-white text-slate-800 shadow-xxs" : "text-slate-500 hover:text-slate-800"}`}
                >
                  <FileText className="w-3 h-3" />
                  Full Report (A4)
                </button>
                <button
                  onClick={() => setPrintLayout("thermal")}
                  className={`px-3 py-1.5 text-xxs font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer ${printLayout === "thermal" ? "bg-white text-slate-800 shadow-xxs" : "text-slate-500 hover:text-slate-800"}`}
                >
                  <Receipt className="w-3 h-3" />
                  ESC/POS Thermal
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Main view area (Col 8) */}
            <div className="lg:col-span-8">
              {printLayout === "screen" ? (
                /* SCREEN REPORT VIEW */
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden" id="screen-report-card">
                  {/* Banner */}
                  <div className="bg-indigo-650 p-6 text-white flex justify-between items-center">
                    <div>
                      <span className="text-xxs font-bold bg-indigo-500 text-white px-2.5 py-1 rounded-full uppercase tracking-wider">Audit Report Z-Record</span>
                      <h3 className="text-xl font-extrabold mt-2 font-display">Shift Session #{s.shiftNumber}</h3>
                      <p className="text-xs text-indigo-200 mt-1 uppercase font-semibold tracking-wider font-mono">{s.registerName} · {s.branchName}</p>
                    </div>
                    <div className="text-right">
                      <div className={`px-3 py-1.5 rounded-xl text-xxs font-bold uppercase ${
                        s.status === "open" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 animate-pulse" :
                        s.status === "closed" ? "bg-indigo-500/30 text-indigo-200 border border-indigo-400/30" :
                        s.status === "force_closed" ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" :
                        "bg-red-500/20 text-red-300 border border-red-500/30"
                      }`}>
                        {s.status.replace("_", " ")}
                      </div>
                      <p className="text-[10px] text-indigo-300 mt-1.5 font-bold uppercase tracking-wider">Duration: {durationStr()}</p>
                    </div>
                  </div>

                  {/* Header statistics */}
                  <div className="border-b border-slate-100 p-6 bg-slate-50/50 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <span className="text-xxs text-slate-400 uppercase font-bold tracking-wider">Cashier / Staff</span>
                      <p className="text-sm font-bold text-slate-800 mt-0.5">{s.cashierName}</p>
                    </div>
                    <div>
                      <span className="text-xxs text-slate-400 uppercase font-bold tracking-wider">Session Opened</span>
                      <p className="text-xs font-semibold text-slate-600 mt-0.5">{formatTime(s.openedAt)}</p>
                    </div>
                    <div>
                      <span className="text-xxs text-slate-400 uppercase font-bold tracking-wider">Session Closed</span>
                      <p className="text-xs font-semibold text-slate-600 mt-0.5">{s.closedAt ? formatTime(s.closedAt) : "Active Now"}</p>
                    </div>
                    <div>
                      <span className="text-xxs text-slate-400 uppercase font-bold tracking-wider">Total Sales (Paid)</span>
                      <p className="text-sm font-black text-slate-900 mt-0.5">${stats.totalSales.toFixed(2)}</p>
                    </div>
                  </div>

                  {/* Drawer Cash Reconciliation */}
                  <div className="p-6 border-b border-slate-100">
                    <h4 className="text-xs font-bold uppercase text-indigo-650 tracking-wider mb-4">1. Drawer Cash Reconciliation (Ledger Auditing)</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <span className="text-xxs text-slate-400 font-bold uppercase tracking-wider">Expected Cash in Till</span>
                        <p className="text-xl font-black text-slate-800 mt-1">${stats.cashSummary.expectedInDrawer.toFixed(2)}</p>
                        <p className="text-[10px] text-slate-400 font-semibold mt-1">Calculated via mathematical session formulas.</p>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <span className="text-xxs text-slate-400 font-bold uppercase tracking-wider">Declared Counted Cash</span>
                        <p className="text-xl font-black text-slate-800 mt-1">
                          {s.declaredCash !== null ? `$${s.declaredCash.toFixed(2)}` : "Active Open Till"}
                        </p>
                        <p className="text-[10px] text-slate-400 font-semibold mt-1">Counted physically by the cashier at closing.</p>
                      </div>
                      <div className={`p-4 rounded-2xl border ${
                        s.variance === null ? "bg-slate-50 border-slate-100 text-slate-800" :
                        s.variance === 0 ? "bg-emerald-50 border-emerald-100 text-emerald-800" :
                        Math.abs(s.variance) > 5.00 ? "bg-red-50 border-red-100 text-red-800" :
                        "bg-amber-50 border-amber-100 text-amber-800"
                      }`}>
                        <span className="text-xxs font-bold uppercase tracking-wider opacity-70">Drawer Variance</span>
                        <p className="text-xl font-black mt-1">
                          {s.variance !== null ? (s.variance >= 0 ? `+$${s.variance.toFixed(2)}` : `-$${Math.abs(s.variance).toFixed(2)}`) : "N/A"}
                        </p>
                        <p className="text-[10px] font-semibold mt-1">
                          {s.variance === null ? "Awaiting physical cash counting." :
                           s.variance === 0 ? "Pristine shift! Till matches expected totals perfectly." :
                           Math.abs(s.variance) > 5.00 ? "CRITICAL: High audit discrepancy! Manager override authorized." :
                           "Acceptable micro-discrepancy."}
                        </p>
                      </div>
                    </div>

                    {/* Table formula */}
                    <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4 space-y-2.5 text-xs text-slate-700">
                      <div className="flex justify-between font-semibold border-b border-slate-100 pb-1.5 text-slate-800">
                        <span>Reconciliation Breakdown Formula</span>
                        <span>Amount</span>
                      </div>
                      <div className="flex justify-between text-slate-500">
                        <span>(+) Starting Float (Change Fund)</span>
                        <span className="font-mono text-slate-700">${s.openingFloat.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-slate-500">
                        <span>(+) Cash Sales portion</span>
                        <span className="font-mono text-slate-700">${stats.cashSummary.cashSales.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-slate-500">
                        <span>(-) Cash Refunds (Voided Paid Cash)</span>
                        <span className="font-mono text-slate-700">-${stats.cashSummary.cashRefunds.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-slate-500">
                        <span>(+) Cash Paid-Ins</span>
                        <span className="font-mono text-emerald-600">+${stats.cashSummary.paidIn.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-slate-500">
                        <span>(-) Cash Paid-Outs (Till Withdrawals)</span>
                        <span className="font-mono text-red-600">-${stats.cashSummary.paidOut.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-slate-500">
                        <span>(-) Shift Expenses (Petty Cash Spent)</span>
                        <span className="font-mono text-red-600">-${stats.cashSummary.expenses.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-slate-500">
                        <span>(-) Cash Transferred to Safe (Safe Drops)</span>
                        <span className="font-mono text-amber-600">-${stats.cashSummary.safeDrops.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-slate-800 border-t border-slate-100 pt-2 text-sm">
                        <span>(=) Expected Cash In Drawer</span>
                        <span className="font-mono text-indigo-650">${stats.cashSummary.expectedInDrawer.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Payments received */}
                  <div className="p-6 border-b border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <h4 className="text-xs font-bold uppercase text-indigo-650 tracking-wider mb-4">2. Payments Breakdown (By Channel)</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center text-xs p-3 bg-slate-50 rounded-xl border border-slate-100">
                          <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                            Physical Drawer Cash
                          </span>
                          <span className="font-bold text-slate-900 font-mono">${stats.paymentsBreakdown.cash.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs p-3 bg-slate-50 rounded-xl border border-slate-100">
                          <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                            Credit / Debit Cards
                          </span>
                          <span className="font-bold text-slate-900 font-mono">${stats.paymentsBreakdown.card.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs p-3 bg-slate-50 rounded-xl border border-slate-100">
                          <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                            Loyalty Wallet / SaaS Points
                          </span>
                          <span className="font-bold text-slate-900 font-mono">${stats.paymentsBreakdown.loyalty.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold uppercase text-indigo-650 tracking-wider mb-4">3. SLA & Void Analysis</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center text-xs p-3 bg-slate-50 rounded-xl border border-slate-100">
                          <span className="font-semibold text-slate-700">Orders Dispatched/Completed</span>
                          <span className="font-bold text-slate-900 font-mono">{stats.orderCount}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs p-3 bg-slate-50 rounded-xl border border-slate-100">
                          <span className="font-semibold text-slate-700">Manager Voids Processed</span>
                          <span className="font-bold text-red-600 font-mono">{stats.ordersByStatus.voided.count} (${stats.ordersByStatus.voided.value.toFixed(2)})</span>
                        </div>
                        <div className="flex justify-between items-center text-xs p-3 bg-slate-50 rounded-xl border border-slate-100">
                          <span className="font-semibold text-slate-700">Cash Refunds Recorded</span>
                          <span className="font-bold text-amber-600 font-mono">{stats.ordersByStatus.refunded.count} (${stats.ordersByStatus.refunded.value.toFixed(2)})</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Delivery outstanding COD liabilities */}
                  <div className="p-6 border-b border-slate-100">
                    <h4 className="text-xs font-bold uppercase text-indigo-650 tracking-wider mb-4">4. Delivery Rider Cash Settlements (COD Liabilities)</h4>
                    {stats.deliverySummary.riderBreakdown.length === 0 ? (
                      <p className="text-slate-400 text-xs text-center py-4 italic">No delivery dispatches occurred during this shift.</p>
                    ) : (
                      <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-slate-50 font-bold text-slate-600 border-b border-slate-100">
                              <th className="p-3">Rider Name</th>
                              <th className="p-3 text-center">Deliveries</th>
                              <th className="p-3 text-right">Total COD Value</th>
                              <th className="p-3 text-right">Settled Cash</th>
                              <th className="p-3 text-right">Outstanding (Due)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {stats.deliverySummary.riderBreakdown.map((r: any, i: number) => (
                              <tr key={i} className="hover:bg-slate-50/50">
                                <td className="p-3 font-semibold text-slate-800">{r.riderName}</td>
                                <td className="p-3 text-center text-slate-500 font-medium">{r.deliveryCount}</td>
                                <td className="p-3 text-right font-mono text-slate-700">${r.cashLiability.toFixed(2)}</td>
                                <td className="p-3 text-right font-mono text-emerald-600">${r.settledCash.toFixed(2)}</td>
                                <td className="p-3 text-right font-mono font-bold text-slate-900">
                                  {r.outstandingCash > 0 ? (
                                    <span className="text-red-600 bg-red-50 px-2 py-0.5 rounded-md">${r.outstandingCash.toFixed(2)}</span>
                                  ) : (
                                    <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">$0.00</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                            <tr className="bg-slate-50/50 font-bold border-t border-slate-200">
                              <td className="p-3 text-slate-750">Aggregate Total COD</td>
                              <td className="p-3 text-center text-slate-600">{stats.deliverySummary.aggregate.totalDeliveries}</td>
                              <td className="p-3 text-right font-mono text-slate-900">${stats.deliverySummary.riderBreakdown.reduce((sum: number, r: any) => sum + r.cashLiability, 0).toFixed(2)}</td>
                              <td className="p-3 text-right font-mono text-emerald-600">${stats.deliverySummary.aggregate.totalSettled.toFixed(2)}</td>
                              <td className="p-3 text-right font-mono text-red-600">${stats.deliverySummary.aggregate.totalOutstanding.toFixed(2)}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Cash movements ledger & petty cash expenses */}
                  <div className="p-6 border-b border-slate-100">
                    <h4 className="text-xs font-bold uppercase text-indigo-650 tracking-wider mb-4">5. Petty Cash Expenditures & Till Movements</h4>
                    {s.cashMovements.length === 0 ? (
                      <p className="text-slate-400 text-xs text-center py-4 italic">No cash movements (paid-ins, paid-outs, safe drops, expenses) logged.</p>
                    ) : (
                      <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-slate-50 font-bold text-slate-600 border-b border-slate-100">
                              <th className="p-3">Time</th>
                              <th className="p-3">Action Type</th>
                              <th className="p-3">Category</th>
                              <th className="p-3">Justification / Reason</th>
                              <th className="p-3 text-right">Amount</th>
                              <th className="p-3 text-center">Auditor Approval</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {s.cashMovements.map((m: any, i: number) => (
                              <tr key={i} className="hover:bg-slate-50/50">
                                <td className="p-3 font-mono text-slate-400 text-[10px]">{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                                <td className="p-3">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                    m.type === "paid_in" ? "bg-emerald-50 text-emerald-700" :
                                    m.type === "paid_out" ? "bg-red-50 text-red-700" :
                                    m.type === "safe_drop" ? "bg-amber-50 text-amber-700" :
                                    "bg-indigo-50 text-indigo-700"
                                  }`}>
                                    {m.type.replace("_", " ")}
                                  </span>
                                </td>
                                <td className="p-3 font-medium text-slate-700">{m.category}</td>
                                <td className="p-3 text-slate-500">{m.reason}</td>
                                <td className={`p-3 text-right font-mono font-bold ${
                                  m.type === "paid_in" ? "text-emerald-600" : "text-red-600"
                                }`}>
                                  {m.type === "paid_in" ? `+$${m.amount.toFixed(2)}` : `-$${m.amount.toFixed(2)}`}
                                </td>
                                <td className="p-3 text-center">
                                  {m.managerApproved ? (
                                    <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-bold uppercase">Approved ({m.managerName || "Admin"})</span>
                                  ) : (
                                    <span className="text-[10px] text-slate-400 font-semibold">Standard Cashier</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Top Dish Velocity */}
                  <div className="p-6">
                    <h4 className="text-xs font-bold uppercase text-indigo-650 tracking-wider mb-4">6. Product Velocities (Top Selling Items)</h4>
                    {stats.itemSummary.length === 0 ? (
                      <p className="text-slate-400 text-xs text-center py-4 italic">No dish sales recorded during this shift session.</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {stats.itemSummary.map((item: any, i: number) => (
                          <div key={i} className="flex justify-between items-center text-xs p-3 bg-slate-50 rounded-xl border border-slate-100">
                            <div className="min-w-0">
                              <p className="font-bold text-slate-800 truncate">{item.name}</p>
                              <p className="text-[10px] text-slate-400 mt-0.5">Quantity Sold: {item.quantity}</p>
                            </div>
                            <span className="font-bold text-slate-900 font-mono">${item.revenue.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Shift Audit Log (Chronological Event History) */}
                  <div className="p-6 border-t border-slate-100 bg-slate-50/20">
                    <h4 className="text-xs font-bold uppercase text-indigo-650 tracking-wider mb-4 flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-indigo-500" />
                      7. Shift Chronological Event History (Audit Trail)
                    </h4>
                    {loadingShiftAuditLog ? (
                      <div className="flex justify-center items-center py-6 gap-2">
                        <div className="w-4 h-4 border-2 border-slate-200 border-t-indigo-600 rounded-full animate-spin"></div>
                        <p className="text-xxs text-slate-400">Loading chronologies...</p>
                      </div>
                    ) : shiftAuditLog.length === 0 ? (
                      <p className="text-slate-400 text-xs text-center py-4 italic">No secure audit actions registered during this shift window.</p>
                    ) : (
                      <div className="relative border-l-2 border-slate-200 pl-4 ml-2 space-y-4 py-2">
                        {shiftAuditLog.map((aud: any, idx: number) => {
                          const eventDate = new Date(aud.timestamp);
                          const isSuccess = aud.status === "success" || !aud.status;
                          return (
                            <div key={idx} className="relative text-xs">
                              {/* Dot pointer */}
                              <div className={`absolute -left-[23px] top-1 w-2.5 h-2.5 rounded-full border-2 border-white ${
                                aud.action === "VOID_ORDER" ? "bg-red-500" :
                                aud.action === "SHIFT_OPENED" ? "bg-emerald-500" :
                                aud.action === "SHIFT_CLOSED" ? "bg-indigo-500" :
                                "bg-slate-400"
                              }`} />
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-bold text-slate-800 flex items-center gap-1.5">
                                    {aud.action.replace(/_/g, " ")}
                                    {!isSuccess && <span className="bg-red-50 text-red-650 text-[9px] px-1 py-0.2 rounded-sm border border-red-100 font-bold">FAILED</span>}
                                  </p>
                                  <p className="text-slate-500 text-xxs mt-0.5">{aud.details}</p>
                                  {aud.userId && (
                                    <p className="text-[10px] text-slate-400 mt-1">
                                      Operator: <span className="font-semibold text-slate-600">{aud.userName || aud.userId}</span> (Role: {aud.userRole})
                                    </p>
                                  )}
                                </div>
                                <span className="text-[10px] font-mono text-slate-400 text-right shrink-0">
                                  {eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* THERMAL RECEIPT SIMULATOR */
                <div className="flex justify-center bg-slate-100 p-8 rounded-3xl border border-slate-200">
                  <div className="bg-[#FAF8F5] border border-slate-300 w-80 shadow-md p-6 font-mono text-xs text-slate-800 relative" style={{ backgroundImage: "linear-gradient(#f4f2ee 1px, transparent 1px)", backgroundColor: "#fbfaf7" }}>
                    {/* Jagged top */}
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-slate-200" style={{ clipPath: "polygon(0% 100%, 5% 0%, 10% 100%, 15% 0%, 20% 100%, 25% 0%, 30% 100%, 35% 0%, 40% 100%, 45% 0%, 50% 100%, 55% 0%, 60% 100%, 65% 0%, 70% 100%, 75% 0%, 80% 100%, 85% 0%, 90% 100%, 95% 0%, 100% 100%)" }}></div>
                    
                    <div className="text-center pt-3 pb-4">
                      <h5 className="font-black tracking-tight text-md uppercase">ONYX SAAS POS</h5>
                      <p className="text-[10px] text-slate-500 uppercase mt-0.5">{s.branchName}</p>
                      <p className="text-xs font-bold uppercase tracking-wider mt-2">*** Z-REPORT ***</p>
                      <p className="text-[10px] text-slate-400 font-mono uppercase mt-1">Cash Drawer Reconciliation</p>
                    </div>

                    <div className="space-y-1 text-[10.5px]">
                      <div className="flex justify-between"><span>Shift Number:</span><span className="font-bold">#{s.shiftNumber}</span></div>
                      <div className="flex justify-between"><span>Till Status:</span><span className="font-bold uppercase">{s.status.replace("_", " ")}</span></div>
                      <div className="flex justify-between"><span>Cashier:</span><span className="font-bold">{s.cashierName}</span></div>
                      <div className="flex justify-between"><span>POS Station:</span><span className="font-bold">{s.registerName}</span></div>
                      <div className="flex justify-between"><span>Opened:</span><span>{formatTime(s.openedAt)}</span></div>
                      {s.closedAt && <div className="flex justify-between"><span>Closed:</span><span>{formatTime(s.closedAt)}</span></div>}
                      <div className="flex justify-between"><span>Session Duration:</span><span>{durationStr()}</span></div>
                    </div>

                    <div className="border-t border-dashed border-slate-300 my-4"></div>

                    <div className="space-y-1 text-[11px]">
                      <p className="font-black uppercase mb-1">DRAWER AUDIT TRAIL</p>
                      <div className="flex justify-between"><span>(+) Starting Float</span><span>${s.openingFloat.toFixed(2)}</span></div>
                      <div className="flex justify-between"><span>(+) Cash Sales portion</span><span>${stats.cashSummary.cashSales.toFixed(2)}</span></div>
                      <div className="flex justify-between text-red-600"><span>(-) Cash Voids/Refunds</span><span>-${stats.cashSummary.cashRefunds.toFixed(2)}</span></div>
                      <div className="flex justify-between text-emerald-600"><span>(+) Paid-Ins</span><span>+${stats.cashSummary.paidIn.toFixed(2)}</span></div>
                      <div className="flex justify-between text-red-600"><span>(-) Paid-Outs</span><span>-${stats.cashSummary.paidOut.toFixed(2)}</span></div>
                      <div className="flex justify-between text-red-600"><span>(-) Petty Cash Expenses</span><span>-${stats.cashSummary.expenses.toFixed(2)}</span></div>
                      <div className="flex justify-between text-amber-600"><span>(-) Safe Drops Transfer</span><span>-${stats.cashSummary.safeDrops.toFixed(2)}</span></div>
                      <div className="border-t border-slate-200 my-2"></div>
                      <div className="flex justify-between font-bold"><span>(=) Expected Cash In Till</span><span>${stats.cashSummary.expectedInDrawer.toFixed(2)}</span></div>
                      <div className="flex justify-between font-bold"><span>Declared Drawer Cash</span><span>{s.declaredCash !== null ? `$${s.declaredCash.toFixed(2)}` : "AWAITING CLOSED"}</span></div>
                      <div className="flex justify-between font-bold text-red-600">
                        <span>Drawer Variance</span>
                        <span>{s.variance !== null ? (s.variance >= 0 ? `+$${s.variance.toFixed(2)}` : `-$${Math.abs(s.variance).toFixed(2)}`) : "N/A"}</span>
                      </div>
                    </div>

                    <div className="border-t border-dashed border-slate-300 my-4"></div>

                    <div className="space-y-1 text-[11px]">
                      <p className="font-black uppercase mb-1">PAYMENT RECAP</p>
                      <div className="flex justify-between"><span>Cash portion</span><span>${stats.paymentsBreakdown.cash.toFixed(2)}</span></div>
                      <div className="flex justify-between"><span>Credit Cards</span><span>${stats.paymentsBreakdown.card.toFixed(2)}</span></div>
                      <div className="flex justify-between"><span>Loyalty wallets</span><span>${stats.paymentsBreakdown.loyalty.toFixed(2)}</span></div>
                      <div className="flex justify-between font-bold border-t border-slate-200 mt-1 pt-1"><span>Total Sales (Paid)</span><span>${stats.totalSales.toFixed(2)}</span></div>
                    </div>

                    <div className="border-t border-dashed border-slate-300 my-4"></div>

                    <div className="space-y-1 text-[11px]">
                      <p className="font-black uppercase mb-1">TOP VELOCITIES</p>
                      {stats.itemSummary.slice(0, 3).map((it: any, idx: number) => (
                        <div key={idx} className="flex justify-between">
                          <span className="truncate max-w-[180px]">{it.name}</span>
                          <span>x{it.quantity}  ${it.revenue.toFixed(0)}</span>
                        </div>
                      ))}
                    </div>

                    {s.voidApprovedBy && (
                      <>
                        <div className="border-t border-dashed border-slate-300 my-4"></div>
                        <div className="text-[10px] text-slate-500 italic text-center">
                          Manager Override: {s.voidApprovedBy}
                          {s.voidReason && <p className="mt-1">Reason: {s.voidReason}</p>}
                        </div>
                      </>
                    )}

                    <div className="border-t border-slate-300 my-4"></div>
                    <p className="text-[9px] text-slate-400 text-center font-mono uppercase">Gapless Ledger · Signature Required</p>
                    <p className="text-[9px] text-slate-400 text-center font-mono uppercase mt-1">Printed: {new Date().toLocaleString()}</p>
                    
                    {/* Jagged bottom */}
                    <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-slate-200" style={{ clipPath: "polygon(0% 0%, 5% 100%, 10% 0%, 15% 100%, 20% 0%, 25% 100%, 30% 0%, 35% 100%, 40% 0%, 45% 100%, 50% 0%, 55% 100%, 60% 0%, 65% 100%, 70% 0%, 75% 100%, 80% 0%, 85% 100%, 90% 0%, 95% 100%, 100% 0%)" }}></div>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar actions (Col 4) */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Auditor Operations</h4>
                
                {s.status === "open" ? (
                  <div className="space-y-3">
                    <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-blue-700 text-xs leading-relaxed flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                      <div>
                        <span className="font-bold">Active Till Session</span>
                        <p className="text-[11px] mt-0.5">This register till is active. Cashiers can process sales, add paid-ins, safe drops, and rider settlements live.</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowForceCloseModal(true)}
                      className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs transition-colors shadow-xs flex items-center justify-center gap-1.5 cursor-pointer font-sans"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      Force Close Till (Manager Override)
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-500 text-xs leading-relaxed">
                      This cashier shift session is completely <span className="font-bold text-slate-800">Closed & Locked</span>. All financial ledgers are written permanently in the gapless sequence store.
                    </div>
                    {s.status !== "voided" && (
                      <button
                        onClick={() => setShowVoidModal(true)}
                        className="w-full py-2.5 bg-red-650 hover:bg-red-600 text-white font-bold rounded-xl text-xs transition-colors shadow-xs flex items-center justify-center gap-1.5 cursor-pointer font-sans"
                      >
                        <ShieldAlert className="w-3.5 h-3.5" />
                        Void Shift Session (Full Rollback)
                      </button>
                    )}
                  </div>
                )}

                <button
                  onClick={() => window.print()}
                  className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition-colors shadow-xs flex items-center justify-center gap-1.5 cursor-pointer font-sans"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print Z-Report
                </button>
              </div>

              {/* Ledger Metadata */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-150 space-y-3 text-xs text-slate-600">
                <p className="font-bold text-slate-800 border-b border-slate-200 pb-1.5">SaaS Ledger Auditing Info</p>
                <p><b>Sequence ID:</b> <span className="font-mono">{s.id}</span></p>
                <p><b>Register Reference:</b> {s.registerName} ({s.registerId})</p>
                <p><b>Cashier Reference:</b> {s.cashierName} ({s.cashierId})</p>
                {s.voidReason && (
                  <div className="p-2 bg-red-50 text-red-700 rounded-lg border border-red-100 text-xxs mt-2">
                    <b>Void Reason:</b> {s.voidReason}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Void Shift justification Modal */}
          {showVoidModal && (
            <div className="fixed inset-0 z-[1000] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl p-6 w-full max-w-md border border-slate-100 shadow-xl space-y-4">
                <div className="flex items-center gap-2 text-red-650">
                  <ShieldAlert className="w-6 h-6 shrink-0" />
                  <h3 className="text-md font-extrabold font-display text-red-650">Void Cashier Shift Session</h3>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Voiding a cashier shift isolates its metrics from branch statistics, but preserves the session in the gapless ledger for mandatory audits. A detailed justification and Manager PIN are required.
                </p>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xxs font-bold text-slate-400 uppercase tracking-wider mb-1">Manager Justification Reason</label>
                    <textarea
                      value={voidReason}
                      onChange={(e) => setVoidReason(e.target.value)}
                      placeholder="e.g., Cashier accidentally opened twice, test session, system diagnostic till..."
                      className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-red-500 min-h-[80px]"
                    />
                  </div>
                  <div>
                    <label className="block text-xxs font-bold text-slate-400 uppercase tracking-wider mb-1">Manager Authorization PIN</label>
                    <input
                      type="password"
                      value={voidPin}
                      onChange={(e) => setVoidPin(e.target.value)}
                      placeholder="Enter Manager PIN to authorize"
                      className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-red-500 font-mono"
                    />
                  </div>
                </div>
                <div className="flex gap-2.5 pt-2">
                  <button
                    onClick={() => { setShowVoidModal(false); setVoidReason(""); setVoidPin(""); }}
                    className="flex-1 py-2 border border-slate-200 text-slate-600 rounded-xl font-bold text-xs hover:bg-slate-50 cursor-pointer font-sans"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleVoidShift(s.id, voidPin)}
                    className="flex-1 py-2 bg-red-650 hover:bg-red-600 text-white rounded-xl font-bold text-xs cursor-pointer font-sans"
                  >
                    Confirm Void
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Force Close Shift Override Modal */}
          {showForceCloseModal && (
            <div className="fixed inset-0 z-[1000] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl p-6 w-full max-w-md border border-slate-100 shadow-xl space-y-4">
                <div className="flex items-center gap-2 text-amber-600">
                  <Lock className="w-6 h-6 shrink-0" />
                  <h3 className="text-md font-extrabold font-display text-amber-600 font-sans">Force Close Till Session</h3>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed font-sans">
                  Are you sure you want to FORCE CLOSE and lock this cashier shift till? As the Platform Owner/Auditor, this action will immediately reconcile the till and lock it.
                </p>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xxs font-bold text-slate-400 uppercase tracking-wider mb-1 font-sans">Manager Authorization PIN (Optional)</label>
                    <input
                      type="password"
                      value={forceClosePin}
                      onChange={(e) => setForceClosePin(e.target.value)}
                      placeholder="Enter PIN (Leave blank to authorize as Platform Owner)"
                      className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-amber-500 font-mono"
                    />
                  </div>
                </div>
                <div className="flex gap-2.5 pt-2">
                  <button
                    onClick={() => { setShowForceCloseModal(false); setForceClosePin(""); }}
                    className="flex-1 py-2 border border-slate-200 text-slate-600 rounded-xl font-bold text-xs hover:bg-slate-50 cursor-pointer font-sans"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleForceCloseShift(s.id, forceClosePin)}
                    className="flex-1 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold text-xs cursor-pointer font-sans"
                  >
                    Confirm Force Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-6 animate-fade-in text-slate-800" id="shift-ledger-panel">
        <div className="flex justify-between items-center bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900 tracking-tight font-display">Cashier Shift Ledger</h3>
            <p className="text-xs text-slate-500 font-sans">Physical till cashier drawers auditing history. Gapless sequentials per branch.</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-xl flex items-center gap-1.5 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Secure Sequence Store
            </span>
          </div>
        </div>

        {shifts.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-50 pb-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 font-sans">
                <Sliders className="w-4 h-4 text-indigo-600 animate-pulse" />
                <span>Filters & Arrangements · تصفية وترتيب الورديات</span>
              </h4>
              {(ledgerCashierQuery || ledgerShiftNumberQuery || ledgerDateQuery || ledgerSortBy !== "newest") && (
                <button
                  onClick={() => {
                    setLedgerCashierQuery("");
                    setLedgerShiftNumberQuery("");
                    setLedgerDateQuery("");
                    setLedgerSortBy("newest");
                  }}
                  className="text-xxs font-bold text-indigo-650 hover:text-indigo-850 hover:underline cursor-pointer"
                >
                  Clear Filters / مسح التصفية
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {/* Cashier Search */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-sans">Cashier Name / اسم الكاشير</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
                    <Search className="w-3.5 h-3.5" />
                  </span>
                  <input
                    type="text"
                    value={ledgerCashierQuery}
                    onChange={(e) => setLedgerCashierQuery(e.target.value)}
                    placeholder="Search cashier name..."
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-indigo-500 text-slate-800"
                  />
                </div>
              </div>

              {/* Shift Number */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-sans">Shift Number / رقم الوردية</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
                    <Tag className="w-3.5 h-3.5" />
                  </span>
                  <input
                    type="number"
                    value={ledgerShiftNumberQuery}
                    onChange={(e) => setLedgerShiftNumberQuery(e.target.value)}
                    placeholder="e.g. 1"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-indigo-500 font-mono text-slate-800"
                  />
                </div>
              </div>

              {/* Day / Date Picker */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-sans">Day / تاريخ الوردية</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
                    <Calendar className="w-3.5 h-3.5" />
                  </span>
                  <input
                    type="date"
                    value={ledgerDateQuery}
                    onChange={(e) => setLedgerDateQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-indigo-500 font-mono text-slate-800"
                  />
                </div>
              </div>

              {/* Arrangement / Sort */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-sans">Arrangement / ترتيب حسب</label>
                <select
                  value={ledgerSortBy}
                  onChange={(e) => setLedgerSortBy(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-indigo-500 text-slate-800 font-bold cursor-pointer"
                >
                  <option value="newest">Newest Opened / الأحدث فتحاً</option>
                  <option value="oldest">Oldest Opened / الأقدم فتحاً</option>
                  <option value="shift_num_desc">Shift # (High-Low) / رقم الوردية تنازلي</option>
                  <option value="shift_num_asc">Shift # (Low-High) / رقم الوردية تصاعدي</option>
                  <option value="sales_desc">Highest Sales / المبيعات الأعلى</option>
                  <option value="variance_desc">Highest Variance / العجز الأكبر</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {shifts.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center max-w-lg mx-auto shadow-xxs">
            <Clock className="w-10 h-10 text-indigo-400 mx-auto animate-bounce mb-3" />
            <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-sans">Awaiting Shift Initialization</h4>
            <p className="text-xs text-slate-400 leading-relaxed mt-2 font-sans">
              No cashier shifts have been initialized on this environment yet. Direct cashiers to open their drawer float inside the <b>Waiter Terminal</b> to populate the sequence ledger!
            </p>
          </div>
        ) : (() => {
          const filtered = shifts.filter((s: any) => {
            if (ledgerCashierQuery.trim()) {
              const q = ledgerCashierQuery.toLowerCase().trim();
              if (!(s.cashierName || "").toLowerCase().includes(q)) return false;
            }
            if (ledgerShiftNumberQuery.trim()) {
              const q = ledgerShiftNumberQuery.trim();
              if (!String(s.shiftNumber || "").includes(q)) return false;
            }
            if (ledgerDateQuery) {
              const openedDateStr = new Date(s.openedAt).toISOString().split("T")[0];
              if (openedDateStr !== ledgerDateQuery) return false;
            }
            return true;
          });

          const sorted = [...filtered].sort((a: any, b: any) => {
            if (ledgerSortBy === "newest") {
              return new Date(b.openedAt).getTime() - new Date(a.openedAt).getTime();
            }
            if (ledgerSortBy === "oldest") {
              return new Date(a.openedAt).getTime() - new Date(b.openedAt).getTime();
            }
            if (ledgerSortBy === "shift_num_desc") {
              return (b.shiftNumber || 0) - (a.shiftNumber || 0);
            }
            if (ledgerSortBy === "shift_num_asc") {
              return (a.shiftNumber || 0) - (b.shiftNumber || 0);
            }
            if (ledgerSortBy === "sales_desc") {
              return (b.liveStats?.totalSales || 0) - (a.liveStats?.totalSales || 0);
            }
            if (ledgerSortBy === "variance_desc") {
              return Math.abs(b.variance || 0) - Math.abs(a.variance || 0);
            }
            return 0;
          });

          if (sorted.length === 0) {
            return (
              <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center max-w-lg mx-auto shadow-xxs">
                <Search className="w-10 h-10 text-indigo-400 mx-auto animate-pulse mb-3" />
                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-sans">No matching shifts found</h4>
                <p className="text-xs text-slate-400 leading-relaxed mt-2 font-sans">
                  No cashier shifts match the selected filters. Try clearing or modifying your filter criteria!
                </p>
                <button
                  onClick={() => {
                    setLedgerCashierQuery("");
                    setLedgerShiftNumberQuery("");
                    setLedgerDateQuery("");
                    setLedgerSortBy("newest");
                  }}
                  className="mt-4 px-4 py-2 bg-indigo-650 hover:bg-indigo-600 text-white rounded-xl text-xxs font-bold transition-all shadow-xxs cursor-pointer"
                >
                  Reset Filters / إعادة تعيين
                </button>
              </div>
            );
          }

          return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sorted.map((s: any, idx: number) => {
                const liveStats = s.liveStats || { totalSales: 0 };
                const varianceStr = s.variance !== null ? (s.variance >= 0 ? `+$${s.variance.toFixed(2)}` : `-$${Math.abs(s.variance).toFixed(2)}`) : "N/A";
                
                return (
                  <div key={idx} className="bg-white rounded-2xl border border-slate-100 shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden">
                    <div className="p-5 space-y-4">
                      {/* Header */}
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[10px] text-indigo-650 font-bold uppercase font-mono">Shift Ledger #{s.shiftNumber}</span>
                          <h4 className="font-bold text-slate-800 text-sm mt-0.5">{s.registerName}</h4>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                          s.status === "open" ? "bg-blue-50 text-blue-700 border border-blue-100" :
                          s.status === "closed" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" :
                          s.status === "force_closed" ? "bg-amber-50 text-amber-700 border border-amber-100" :
                          "bg-red-50 text-red-700 border border-red-100"
                        }`}>
                          {s.status.replace("_", " ")}
                        </span>
                      </div>

                      {/* Metadata lines */}
                      <div className="space-y-1.5 text-xs text-slate-500 font-sans">
                        <p><b>Cashier:</b> {s.cashierName}</p>
                        <p><b>Opened:</b> {new Date(s.openedAt).toLocaleDateString()} {new Date(s.openedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                        {s.closedAt && <p><b>Closed:</b> {new Date(s.closedAt).toLocaleDateString()} {new Date(s.closedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>}
                        <p><b>Float:</b> ${s.openingFloat.toFixed(2)}</p>
                      </div>

                      {/* Variance warning if any */}
                      {s.status !== "open" && s.variance !== null && s.variance !== 0 && (
                        <div className={`p-2 rounded-lg text-[11px] leading-relaxed flex items-center gap-1.5 ${
                          Math.abs(s.variance) > 5.00 ? "bg-red-50 text-red-700 font-semibold" : "bg-amber-50 text-amber-700"
                        }`}>
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          Discrepancy: {varianceStr}
                        </div>
                      )}
                    </div>

                    <div className="bg-slate-50 px-5 py-3 border-t border-slate-100 flex justify-between items-center text-xs">
                      <span className="font-extrabold text-slate-700 font-sans">Sales: ${liveStats.totalSales.toFixed(2)}</span>
                      <button
                        onClick={() => setSelectedShiftId(s.id)}
                        className="text-[11px] font-black text-indigo-650 hover:text-indigo-850 bg-white border border-slate-200 hover:border-slate-350 px-3 py-1.5 rounded-lg transition-all cursor-pointer font-sans"
                      >
                        Audit Report
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>
    );
  };

  const filteredMenu = selectedFilterCategory === "All" 
    ? menu 
    : menu.filter(m => m.category === selectedFilterCategory);

  const renderIngredientsTab = () => {
    const filtered = ingredients.filter(ing => {
      const matchCat = ingredientFilterCategory === "All" || ing.category === ingredientFilterCategory;
      const matchSearch = ing.name.toLowerCase().includes(ingredientSearchQuery.toLowerCase()) || ing.category.toLowerCase().includes(ingredientSearchQuery.toLowerCase());
      return matchCat && matchSearch;
    });

    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
        {/* Left column: Add/Edit form */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs h-fit space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
              <Database className="w-4 h-4 text-amber-500" />
              {editingIngredient ? "Edit Raw Material" : "Register Raw Material"}
            </h4>
            {editingIngredient && (
              <button 
                onClick={() => {
                  setEditingIngredient(null);
                  setNewIngredient({
                    name: "", category: "Produce", baseUom: "kg", costPerBaseUnit: "",
                    yieldPercent: "100", allergens: [], supplierReference: "", shelfLifeDays: "7", spoilageClass: "Medium"
                  });
                }}
                className="text-[10px] text-slate-500 hover:underline"
              >
                Cancel Edit
              </button>
            )}
          </div>

          <form onSubmit={handleSaveIngredient} className="space-y-3.5 text-xs">
            <div>
              <label className="block text-slate-600 font-semibold mb-1">Ingredient Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Fresh Atlantic Salmon"
                value={newIngredient.name}
                onChange={(e) => setNewIngredient({ ...newIngredient, name: e.target.value })}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Category *</label>
                <select
                  value={newIngredient.category}
                  onChange={(e) => setNewIngredient({ ...newIngredient, category: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                >
                  <option value="Protein">Protein</option>
                  <option value="Produce">Produce</option>
                  <option value="Dairy">Dairy</option>
                  <option value="Pantry">Pantry</option>
                  <option value="Herbs">Herbs</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Base UoM *</label>
                <select
                  value={newIngredient.baseUom}
                  onChange={(e) => setNewIngredient({ ...newIngredient, baseUom: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                >
                  <option value="kg">Kilogram (kg)</option>
                  <option value="g">Gram (g)</option>
                  <option value="l">Liter (l)</option>
                  <option value="ml">Milliliter (ml)</option>
                  <option value="unit">Unit (ea)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Cost per Base Unit ($) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="24.50"
                  value={newIngredient.costPerBaseUnit}
                  onChange={(e) => setNewIngredient({ ...newIngredient, costPerBaseUnit: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Yield Coefficient (%)</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  placeholder="100"
                  value={newIngredient.yieldPercent}
                  onChange={(e) => setNewIngredient({ ...newIngredient, yieldPercent: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Shelf Life (Days)</label>
                <input
                  type="number"
                  placeholder="7"
                  value={newIngredient.shelfLifeDays}
                  onChange={(e) => setNewIngredient({ ...newIngredient, shelfLifeDays: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Spoilage Risk</label>
                <select
                  value={newIngredient.spoilageClass}
                  onChange={(e) => setNewIngredient({ ...newIngredient, spoilageClass: e.target.value as any })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                >
                  <option value="High">High (Perishable)</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low (Shelf-stable)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">Supplier ID or Reference</label>
              <input
                type="text"
                placeholder="e.g. Sysco Seafood #449"
                value={newIngredient.supplierReference}
                onChange={(e) => setNewIngredient({ ...newIngredient, supplierReference: e.target.value })}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1.5">Allergens</label>
              <div className="grid grid-cols-3 gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-lg max-h-[100px] overflow-y-auto">
                {allergenOptions.map(allergen => {
                  const hasAllergen = newIngredient.allergens.includes(allergen);
                  return (
                    <label key={allergen} className="flex items-center gap-1.5 text-xxs font-semibold text-slate-655 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={hasAllergen}
                        onChange={() => {
                          const updated = hasAllergen 
                            ? newIngredient.allergens.filter(a => a !== allergen)
                            : [...newIngredient.allergens, allergen];
                          setNewIngredient({ ...newIngredient, allergens: updated });
                        }}
                        className="rounded-sm accent-slate-900"
                      />
                      {allergen}
                    </label>
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold transition-all flex items-center justify-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              {editingIngredient ? "Apply Modification" : "Register Raw Material"}
            </button>
          </form>
        </div>

        {/* Right column: Raw materials table list */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Master Ingredients Catalog</h3>
              <p className="text-[11px] text-slate-500">A central registry of your active recipes' theoretical cost determinants.</p>
            </div>
            
            <div className="flex gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Search materials..."
                  value={ingredientSearchQuery}
                  onChange={(e) => setIngredientSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden w-40"
                />
              </div>

              <select
                value={ingredientFilterCategory}
                onChange={(e) => setIngredientFilterCategory(e.target.value)}
                className="p-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
              >
                <option value="All">All Categories</option>
                <option value="Protein">Proteins</option>
                <option value="Produce">Produce</option>
                <option value="Dairy">Dairy</option>
                <option value="Pantry">Pantry</option>
                <option value="Herbs">Herbs</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto animate-fade-in">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                  <th className="py-2.5">Name</th>
                  <th className="py-2.5">Category</th>
                  <th className="py-2.5">Base Cost / Unit</th>
                  <th className="py-2.5">Yield Coeff</th>
                  <th className="py-2.5">Spoilage</th>
                  <th className="py-2.5">Allergens</th>
                  <th className="py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((ing) => {
                  const spoilageColors = {
                    High: "bg-red-50 text-red-700 border-red-100",
                    Medium: "bg-amber-50 text-amber-700 border-amber-100",
                    Low: "bg-emerald-50 text-emerald-700 border-emerald-100"
                  };

                  return (
                    <tr key={ing.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 font-semibold text-slate-800">
                        {ing.name}
                        {ing.supplierReference && (
                          <span className="block text-[10px] text-slate-400 font-mono font-medium">{ing.supplierReference}</span>
                        )}
                      </td>
                      <td className="py-3 text-slate-500">{ing.category}</td>
                      <td className="py-3 font-mono font-bold text-slate-700">
                        ${ing.costPerBaseUnit.toFixed(2)} / <span className="font-semibold">{ing.baseUom}</span>
                      </td>
                      <td className="py-3 font-medium text-slate-600">{ing.yieldPercent}%</td>
                      <td className="py-3">
                        <span className={`px-1.5 py-0.5 border text-[10px] font-bold rounded-md ${spoilageColors[ing.spoilageClass as keyof typeof spoilageColors] || ""}`}>
                          {ing.spoilageClass}
                        </span>
                      </td>
                      <td className="py-3">
                        {ing.allergens && ing.allergens.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {ing.allergens.map((a: string) => (
                              <span key={a} className="px-1 py-0.2 bg-purple-50 text-purple-700 border border-purple-100 text-[9px] font-bold rounded-sm uppercase">
                                {a}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-300 italic text-[10px]">None</span>
                        )}
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setEditingIngredient(ing);
                              setNewIngredient({
                                name: ing.name,
                                category: ing.category,
                                baseUom: ing.baseUom,
                                costPerBaseUnit: ing.costPerBaseUnit.toString(),
                                yieldPercent: ing.yieldPercent.toString(),
                                allergens: ing.allergens || [],
                                supplierReference: ing.supplierReference || "",
                                shelfLifeDays: ing.shelfLifeDays.toString(),
                                spoilageClass: ing.spoilageClass
                              });
                            }}
                            className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 rounded-md transition-all"
                            title="Edit"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteIngredient(ing.id)}
                            className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 border border-slate-200 rounded-md transition-all"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-400">
                      No materials match the search filter. Create one on the left.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderRecipesTab = () => {
    // Separate recipe entities
    const subRecipes = recipes.filter(r => r.isSubRecipe);

    // Get active recipe details
    const activeRecipeId = selectedRecipeDishId 
      ? recipes.find(r => r.menuItemId === selectedRecipeDishId && r.isActive)?.id
      : selectedSubRecipeId;

    const activeRecipe = recipes.find(r => r.id === activeRecipeId);
    const associatedMenuItem = selectedRecipeDishId 
      ? menu.find(m => m.id === selectedRecipeDishId)
      : null;

    // Recursive helper to get cost on frontend for quick display
    const getCostFrontend = (recipe: any): number => {
      if (!recipe || !recipe.ingredients) return 0;
      let total = 0;
      recipe.ingredients.forEach((link: any) => {
        if (link.isSubRecipeLink) {
          const sub = recipes.find(r => r.id === link.ingredientId);
          if (sub) {
            const subCost = getCostFrontend(sub);
            const subUnit = sub.yieldQuantity > 0 ? subCost / sub.yieldQuantity : 0;
            total += subUnit * link.quantity;
          }
        } else {
          const ing = ingredients.find(i => i.id === link.ingredientId);
          if (ing) {
            const yCoeff = ing.yieldPercent / 100;
            const realUnitCost = yCoeff > 0 ? ing.costPerBaseUnit / yCoeff : ing.costPerBaseUnit;
            total += realUnitCost * link.quantity;
          }
        }
      });
      return total;
    };

    const activeRecipeCost = activeRecipe ? getCostFrontend(activeRecipe) : 0;
    const foodCostPct = associatedMenuItem && associatedMenuItem.price > 0 
      ? (activeRecipeCost / associatedMenuItem.price) * 100 
      : 0;

    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
        
        {/* Left pane: Recipe index (Col span 5) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Sub-recipes prep items */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                  <Layers className="w-4.5 h-4.5 text-amber-550" />
                  Standalone Prep Sub-Recipes
                </h3>
                <p className="text-[10px] text-slate-500">Prep items (sauces, fillings, brines) nested in other dishes.</p>
              </div>

              <button
                onClick={() => setCreatingSubRecipe(!creatingSubRecipe)}
                className="px-2 py-1 text-xxs font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 rounded-md border border-amber-200 transition-colors flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                Prep Item
              </button>
            </div>

            {creatingSubRecipe && (
              <form onSubmit={handleCreateSubRecipe} className="p-3 bg-amber-50/60 border border-amber-150 rounded-xl space-y-3 text-xs">
                <p className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">New Prep Sub-Recipe</p>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Sub-Recipe Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Garlic Aioli Base"
                    value={newSubRecipe.name}
                    onChange={(e) => setNewSubRecipe({ ...newSubRecipe, name: e.target.value })}
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Yield Quantity</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={newSubRecipe.yieldQuantity}
                      onChange={(e) => setNewSubRecipe({ ...newSubRecipe, yieldQuantity: e.target.value })}
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Yield UoM</label>
                    <select
                      value={newSubRecipe.baseUom}
                      onChange={(e) => setNewSubRecipe({ ...newSubRecipe, baseUom: e.target.value })}
                      className="w-full p-2 bg-white border border-slate-200 text-xs rounded-lg"
                    >
                      <option value="kg">kg</option>
                      <option value="g">g</option>
                      <option value="l">l</option>
                      <option value="ml">ml</option>
                    </select>
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full py-1.5 bg-amber-700 text-white rounded-lg hover:bg-amber-800 font-bold text-xxs tracking-wide uppercase transition-colors"
                >
                  Create Prep Sub-Recipe
                </button>
              </form>
            )}

            <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
              {subRecipes.map(sub => {
                const isSelected = selectedSubRecipeId === sub.id && !selectedRecipeDishId;
                const cost = getCostFrontend(sub);
                return (
                  <div
                    key={sub.id}
                    onClick={() => { setSelectedRecipeDishId(null); setSelectedSubRecipeId(sub.id); }}
                    className={`p-2.5 rounded-xl border cursor-pointer transition-all flex justify-between items-center ${
                      isSelected 
                        ? "bg-slate-900 text-white border-slate-900 animate-pulse" 
                        : "bg-slate-50 border-slate-150 hover:border-slate-300"
                    }`}
                  >
                    <div>
                      <h4 className="text-xs font-bold truncate max-w-[150px]">{sub.name}</h4>
                      <p className={`text-[10px] ${isSelected ? "text-slate-300" : "text-slate-400"}`}>
                        Yields: {sub.yieldQuantity} {sub.baseUom} • {sub.ingredients.length} ingredients
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xxs font-mono font-bold">
                        Cost: ${cost.toFixed(2)}
                      </span>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteSubRecipe(sub.id); }}
                        className={`p-1 rounded-md transition-colors ${
                          isSelected ? "text-slate-400 hover:text-white hover:bg-slate-800" : "text-slate-400 hover:text-red-500 hover:bg-red-50"
                        }`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}

              {subRecipes.length === 0 && (
                <p className="text-center py-4 text-xs text-slate-400">No standalone prep sub-recipes.</p>
              )}
            </div>
          </div>

          {/* Core Dishes list */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                <BookOpen className="w-4.5 h-4.5 text-amber-550" />
                Active Dishes BOM Mapping
              </h3>
              <p className="text-[10px] text-slate-500">Link raw ingredients to active dishes to trace theoretical cost.</p>
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {menu.map(item => {
                const mappedRecipe = recipes.find(r => r.menuItemId === item.id && r.isActive);
                const isSelected = selectedRecipeDishId === item.id;
                const cost = mappedRecipe ? getCostFrontend(mappedRecipe) : 0;
                const costPct = item.price > 0 ? (cost / item.price) * 100 : 0;

                return (
                  <div
                    key={item.id}
                    onClick={() => { setSelectedSubRecipeId(null); setSelectedRecipeDishId(item.id); }}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex justify-between items-center ${
                      isSelected 
                        ? "bg-slate-900 text-white border-slate-900" 
                        : "bg-slate-50 border-slate-150 hover:border-slate-300"
                    }`}
                  >
                    <div>
                      <h4 className="text-xs font-bold truncate max-w-[160px]">{item.name}</h4>
                      <p className={`text-[10px] ${isSelected ? "text-slate-300" : "text-slate-400"}`}>
                        Menu Price: ${item.price.toFixed(2)} • {item.category}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      {mappedRecipe ? (
                        <>
                          <div className="text-xs font-mono font-bold">${cost.toFixed(2)} Cost</div>
                          <div className={`text-[10px] font-semibold ${costPct > 30 ? "text-red-500" : isSelected ? "text-slate-350" : "text-emerald-650"}`}>
                            {costPct.toFixed(1)}% Food Cost
                          </div>
                        </>
                      ) : (
                        <span className="text-[10px] text-amber-600 font-semibold uppercase tracking-wider bg-amber-50 px-1.5 py-0.5 rounded-sm animate-pulse">
                          Unmapped BOM
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Right pane: Recipe details and Ingredient linking (Col span 7) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-100 shadow-xs">
          {activeRecipe ? (
            <div className="space-y-6 animate-fade-in">
              
              {/* Recipe Summary Bar */}
              <div className="flex justify-between items-start gap-4 pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-md font-bold text-slate-900 tracking-tight">{activeRecipe.name}</h3>
                  <p className="text-[11px] text-slate-500">
                    {associatedMenuItem 
                      ? `Yields: 1 plate • MenuItem: ${associatedMenuItem.name}` 
                      : `Yields: ${activeRecipe.yieldQuantity} ${activeRecipe.baseUom} • Standalone Prep Item`
                    }
                  </p>
                </div>

                <div className="text-right">
                  <div className="text-lg font-mono font-bold text-slate-855">${activeRecipeCost.toFixed(2)}</div>
                  <p className="text-xxs text-slate-500 uppercase tracking-wider font-semibold">Total Cost Value</p>
                </div>
              </div>

              {/* Toast Cost Control Metrics Cards */}
              {associatedMenuItem && (
                <div className="grid grid-cols-3 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-150">
                  <div className="text-center">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Menu Price</span>
                    <p className="text-sm font-bold text-slate-800 mt-0.5">${associatedMenuItem.price.toFixed(2)}</p>
                  </div>
                  <div className="text-center border-x border-slate-200">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Gross Margin</span>
                    <p className="text-sm font-bold text-slate-800 mt-0.5">${(associatedMenuItem.price - activeRecipeCost).toFixed(2)}</p>
                  </div>
                  <div className="text-center">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Food Cost %</span>
                    <p className={`text-sm font-bold mt-0.5 ${foodCostPct > 30 ? "text-red-650" : "text-emerald-650"}`}>
                      {foodCostPct.toFixed(1)}%
                    </p>
                  </div>
                </div>
              )}

              {/* Linked Ingredients Bill of Materials */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Ingredients Bill of Materials (BOM)</h4>
                
                <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden bg-slate-50/40">
                  {activeRecipe.ingredients.map((link: any, idx: number) => {
                    let name = "";
                    let baseUom = "";
                    let linkCost = 0;

                    if (link.isSubRecipeLink) {
                      const sub = recipes.find(r => r.id === link.ingredientId);
                      if (sub) {
                        name = `[Prep] ${sub.name}`;
                        baseUom = sub.baseUom;
                        const subCost = getCostFrontend(sub);
                        const subUnitCost = sub.yieldQuantity > 0 ? subCost / sub.yieldQuantity : 0;
                        linkCost = subUnitCost * link.quantity;
                      }
                    } else {
                      const ing = ingredients.find(i => i.id === link.ingredientId);
                      if (ing) {
                        name = ing.name;
                        baseUom = ing.baseUom;
                        const yCoeff = ing.yieldPercent / 100;
                        const realUnitCost = yCoeff > 0 ? ing.costPerBaseUnit / yCoeff : ing.costPerBaseUnit;
                        linkCost = realUnitCost * link.quantity;
                      }
                    }

                    return (
                      <div key={idx} className="p-3 flex justify-between items-center text-xs hover:bg-slate-50 transition-colors">
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-800 truncate">{name}</p>
                          <p className="text-[10px] text-slate-500">
                            Quantity: {link.quantity} {baseUom}
                          </p>
                        </div>

                        <div className="flex items-center gap-4">
                          <span className="font-mono font-bold text-slate-705">
                            +${linkCost.toFixed(2)}
                          </span>
                          <button
                            onClick={() => handleRemoveRecipeIngredient(activeRecipe.id, link.ingredientId, link.isSubRecipeLink)}
                            className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 border border-slate-150 rounded-md transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {activeRecipe.ingredients.length === 0 && (
                    <p className="text-center py-8 text-slate-400 text-xs italic">
                      BOM is empty. Link ingredients below to start cost calculations.
                    </p>
                  )}
                </div>
              </div>

              {/* Add / Link Ingredient Form */}
              <div className="p-4 bg-slate-50 border border-slate-155 rounded-xl space-y-4">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                  <PlusCircle className="w-4 h-4 text-indigo-600" />
                  Link Material or Sub-Recipe to BOM
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end text-xs">
                  <div className="sm:col-span-6">
                    <label className="block text-slate-600 font-semibold mb-1">Target Item</label>
                    <select
                      value={selectedLinkIngredientId}
                      onChange={(e) => setSelectedLinkIngredientId(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-hidden"
                    >
                      <option value="">-- Choose item --</option>
                      
                      <optgroup label="Raw Materials">
                        {ingredients.map(ing => (
                          <option key={ing.id} value={`ing:${ing.id}`}>
                            {ing.name} (${ing.costPerBaseUnit.toFixed(2)} / {ing.baseUom})
                          </option>
                        ))}
                      </optgroup>

                      <optgroup label="Standalone Sub-Recipes">
                        {recipes.filter(r => r.isSubRecipe && r.id !== activeRecipe.id).map(sub => (
                          <option key={sub.id} value={`sub:${sub.id}`}>
                            [Prep] {sub.name} (Yield: {sub.yieldQuantity} {sub.baseUom})
                          </option>
                        ))}
                      </optgroup>
                    </select>
                  </div>

                  <div className="sm:col-span-4">
                    <label className="block text-slate-600 font-semibold mb-1">
                      Required Qty ({
                        selectedLinkIngredientId 
                          ? (selectedLinkIngredientId.startsWith("ing:") 
                              ? ingredients.find(i => i.id === selectedLinkIngredientId.slice(4))?.baseUom 
                              : recipes.find(r => r.id === selectedLinkIngredientId.slice(4))?.baseUom)
                          : "unit"
                      })
                    </label>
                    <input
                      type="number"
                      step="0.0001"
                      required
                      placeholder="e.g. 0.15"
                      value={linkQuantity}
                      onChange={(e) => setLinkQuantity(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-hidden"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <button
                      onClick={() => {
                        if (!selectedLinkIngredientId || !linkQuantity) return;
                        const isSub = selectedLinkIngredientId.startsWith("sub:");
                        const id = selectedLinkIngredientId.slice(4);
                        handleAddRecipeIngredient(activeRecipe.id, id, isSub, parseFloat(linkQuantity));
                        setSelectedLinkIngredientId("");
                        setLinkQuantity("");
                      }}
                      className="w-full py-2 bg-indigo-650 hover:bg-indigo-600 text-white rounded-lg text-xs font-semibold tracking-wide transition-all"
                    >
                      Link
                    </button>
                  </div>
                </div>
              </div>

            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 text-center text-slate-400">
              <Scale className="w-12 h-12 stroke-1 text-slate-300 mb-2" />
              <p className="text-sm font-semibold">BOM Mapping Dashboard</p>
              <p className="text-xxs max-w-[320px] mt-1.5 leading-relaxed">
                Click on any Prep Sub-Recipe or Menu Item on the left to review its recipe bill of materials, calculate margins, and control portion costs.
              </p>

              {selectedRecipeDishId && !recipes.some(r => r.menuItemId === selectedRecipeDishId) && (
                <div className="mt-6">
                  <p className="text-xs text-amber-600 font-semibold bg-amber-50 p-3 rounded-lg border border-amber-200 mb-3 max-w-[280px]">
                    This dish has no mapped recipe.
                  </p>
                  <button
                    onClick={() => {
                      const item = menu.find(m => m.id === selectedRecipeDishId);
                      if (item) handleInitializeRecipe(item.id, item.name);
                    }}
                    className="px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-lg hover:bg-slate-800 shadow-xs transition-colors"
                  >
                    Initialize Recipe BOM
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderVarianceTab = () => {
    if (loadingVariance) {
      return (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-8 h-8 border-4 border-slate-350 border-t-slate-900 rounded-full animate-spin"></div>
          <p className="text-xs font-semibold text-slate-500 mt-2 animate-pulse">Calculating theoretical raw material yields and variance...</p>
        </div>
      );
    }

    // Calculations
    const totalItems = varianceData.length;
    const reconciledItems = varianceData.filter(v => v.isReconciled).length;
    const totalVarianceCost = varianceData.reduce((sum, v) => sum + v.varianceCost, 0);
    const totalWasteCost = varianceData.reduce((sum, v) => sum + v.wasteCost, 0);

    return (
      <div className="space-y-6 animate-fade-in" id="inventory-variance-tab">
        
        {/* Summary Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xxs">
            <p className="text-xxs font-bold text-slate-400 uppercase tracking-wider mb-1">Monitored Materials</p>
            <p className="text-xl font-black text-slate-900">{totalItems} Raw Items</p>
            <p className="text-[10px] text-slate-400">Yield mapped in active recipes</p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xxs">
            <p className="text-xxs font-bold text-slate-400 uppercase tracking-wider mb-1">Reconciled (Stocktake)</p>
            <div className="flex items-baseline gap-1.5">
              <p className="text-xl font-black text-slate-900">{reconciledItems} / {totalItems}</p>
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${reconciledItems === totalItems ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                {reconciledItems === totalItems ? "Complete" : "Pending Counts"}
              </span>
            </div>
            <p className="text-[10px] text-slate-400">Physical audits completed this period</p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xxs">
            <p className="text-xxs font-bold text-slate-400 uppercase tracking-wider mb-1">Net Cost Variance</p>
            <p className={`text-xl font-black ${totalVarianceCost < 0 ? "text-red-600" : "text-emerald-600"}`}>
              {totalVarianceCost < 0 ? "-" : ""}${Math.abs(totalVarianceCost).toFixed(2)}
            </p>
            <p className="text-[10px] text-slate-400">
              {totalVarianceCost < 0 ? "Material loss/shortage leakage" : "Surplus yield vs theoretical recipe"}
            </p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xxs">
            <p className="text-xxs font-bold text-slate-400 uppercase tracking-wider mb-1">Logged Food Waste Cost</p>
            <p className="text-xl font-black text-slate-900">${totalWasteCost.toFixed(2)}</p>
            <p className="text-[10px] text-slate-400">Recorded spoilage & prep errors</p>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
          <div className="space-y-0.5">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">Theoretical vs Physical Stock Variance</h3>
            <p className="text-[10px] text-slate-400">Calculates sales-driven ingredients targets vs physical counts.</p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={() => {
                if (varianceData.length > 0) {
                  setWasteIngredientId(varianceData[0].ingredientId);
                }
                setShowWasteModal(true);
              }}
              className="flex-1 sm:flex-none px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xxs font-bold transition-all flex items-center justify-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Log Waste / Spoilage
            </button>
            <button
              onClick={() => setShowRolloverModal(true)}
              className="flex-1 sm:flex-none px-3.5 py-2 bg-indigo-650 hover:bg-indigo-600 text-white rounded-xl text-xxs font-bold transition-all flex items-center justify-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Rollover Period
            </button>
          </div>
        </div>

        {/* Core Stocktake Reconciliation Sheet */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xxs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold text-xxs tracking-wider uppercase">
                  <th className="p-4">Raw Ingredient / Category</th>
                  <th className="p-4 text-center">Cost Rate</th>
                  <th className="p-4 text-center">Opening Stock</th>
                  <th className="p-4 text-center">Received</th>
                  <th className="p-4 text-center">Theoretical Sold</th>
                  <th className="p-4 text-center bg-indigo-50/10">Expected Closing</th>
                  <th className="p-4 text-center bg-indigo-50/35 text-indigo-950 font-black">Actual Closing</th>
                  <th className="p-4 text-center">Variance (Qty / Cost)</th>
                  <th className="p-4 text-center">Logged Waste</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150">
                {varianceData.map((item: any) => {
                  const isEditing = editingStocktakeIngId === item.ingredientId;

                  return (
                    <tr key={item.ingredientId} className="hover:bg-slate-50/40 transition-colors">
                      <td className="p-4">
                        <p className="font-bold text-slate-800">{item.name}</p>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide bg-slate-100 px-1.5 py-0.5 rounded">{item.category}</span>
                      </td>
                      <td className="p-4 text-center font-mono text-slate-500">
                        ${item.costPerBaseUnit.toFixed(2)} <span className="text-[10px]">/ {item.baseUom}</span>
                      </td>

                      {/* Opening Stock */}
                      <td className="p-4 text-center font-mono">
                        {isEditing ? (
                          <input
                            type="number"
                            value={stocktakeOpening}
                            onChange={(e) => setStocktakeOpening(e.target.value)}
                            className="w-16 p-1 border border-slate-300 rounded text-center text-xs"
                          />
                        ) : (
                          <span className="text-slate-700">{item.openingStock} {item.baseUom}</span>
                        )}
                      </td>

                      {/* Received Stock */}
                      <td className="p-4 text-center font-mono">
                        {isEditing ? (
                          <input
                            type="number"
                            value={stocktakeReceived}
                            onChange={(e) => setStocktakeReceived(e.target.value)}
                            className="w-16 p-1 border border-slate-300 rounded text-center text-xs"
                          />
                        ) : (
                          <span className="text-emerald-600 font-semibold">+{item.receivedStock} {item.baseUom}</span>
                        )}
                      </td>

                      {/* Theoretical Usage (Qty Sold via orders recipe link) */}
                      <td className="p-4 text-center font-mono text-slate-500">
                        -{item.theoreticalUsage.toFixed(2)} {item.baseUom}
                      </td>

                      {/* Expected Closing Stock */}
                      <td className="p-4 text-center font-mono bg-indigo-50/10 text-slate-650">
                        {item.expectedClosingStock.toFixed(2)} {item.baseUom}
                      </td>

                      {/* Actual Closing Stock (Stocktake Input) */}
                      <td className="p-4 text-center font-mono bg-indigo-50/25">
                        {isEditing ? (
                          <div className="flex items-center justify-center gap-1">
                            <input
                              type="number"
                              value={stocktakeClosing}
                              onChange={(e) => setStocktakeClosing(e.target.value)}
                              placeholder={item.expectedClosingStock.toFixed(2)}
                              className="w-20 p-1 border border-indigo-300 rounded text-center text-xs font-black bg-white"
                            />
                            <button
                              onClick={() => setStocktakeClosing("null")}
                              className="p-1 text-slate-400 hover:text-red-500 text-[10px]"
                              title="Clear Count"
                            >
                              Clear
                            </button>
                          </div>
                        ) : item.closingStock !== null ? (
                          <span className="font-bold text-indigo-950">{item.closingStock} {item.baseUom}</span>
                        ) : (
                          <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-100 font-semibold px-2 py-0.5 rounded-full inline-block">
                            Pending Audit
                          </span>
                        )}
                      </td>

                      {/* Variance */}
                      <td className="p-4 text-center">
                        {item.closingStock !== null ? (
                          <div className="space-y-0.5">
                            <span className={`font-mono text-xs font-bold ${item.varianceQty < 0 ? "text-red-600" : item.varianceQty > 0 ? "text-emerald-600" : "text-slate-500"}`}>
                              {item.varianceQty > 0 ? "+" : ""}{item.varianceQty.toFixed(2)} {item.baseUom}
                            </span>
                            <p className={`text-[10px] font-bold ${item.varianceCost < 0 ? "text-red-600" : item.varianceCost > 0 ? "text-emerald-600" : "text-slate-400"}`}>
                              {item.varianceCost > 0 ? "+" : ""}${item.varianceCost.toFixed(2)}
                            </p>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">No Physical Count</span>
                        )}
                      </td>

                      {/* Logged Waste */}
                      <td className="p-4 text-center font-mono text-slate-600">
                        {item.totalWasted > 0 ? (
                          <div className="space-y-0.5">
                            <p className="text-red-500 font-semibold">{item.totalWasted} {item.baseUom}</p>
                            <p className="text-[10px] text-slate-400">Cost: ${item.wasteCost.toFixed(2)}</p>
                          </div>
                        ) : (
                          <span className="text-slate-350">—</span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="p-4 text-right">
                        {isEditing ? (
                          <div className="flex justify-end gap-1">
                            <button
                              onClick={() => {
                                const o = parseFloat(stocktakeOpening) || 0;
                                const r = parseFloat(stocktakeReceived) || 0;
                                const c = stocktakeClosing === "null" || stocktakeClosing === "" ? null : parseFloat(stocktakeClosing);
                                handleUpdateStocktake(item.ingredientId, o, r, c);
                              }}
                              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xxs rounded transition-colors"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingStocktakeIngId(null)}
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-xxs rounded transition-colors"
                            >
                              Esc
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setEditingStocktakeIngId(item.ingredientId);
                              setStocktakeOpening(item.openingStock.toString());
                              setStocktakeReceived(item.receivedStock.toString());
                              setStocktakeClosing(item.closingStock !== null ? item.closingStock.toString() : "");
                            }}
                            className="px-2.5 py-1 border border-slate-200 hover:border-indigo-600 text-slate-600 hover:text-indigo-600 font-semibold text-xxs rounded-lg transition-all"
                          >
                            Enter Count
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Waste / Spoilage Incident Logs */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xxs space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Recorded Spoilage & Food Waste Audit Logs</h3>
              <p className="text-[11px] text-slate-500">Real-time waste logging reduces variance and isolates operational prep errors.</p>
            </div>
            <span className="text-xxs font-bold text-indigo-650 bg-indigo-50 px-2 py-0.5 rounded-full">
              {wasteLogs.length} Records Total
            </span>
          </div>

          <div className="overflow-x-auto">
            {wasteLogs.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-slate-200 rounded-2xl text-slate-400 text-xs">
                No food waste incidents registered in this audit period.
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-bold text-xxs uppercase tracking-wider">
                    <th className="py-2">Timestamp</th>
                    <th className="py-2">Ingredient</th>
                    <th className="py-2 text-center">Quantity</th>
                    <th className="py-2 text-center">Cost Impact</th>
                    <th className="py-2">Reason Code</th>
                    <th className="py-2 text-right">Recorded By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {[...wasteLogs].reverse().map((w: any) => (
                    <tr key={w.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 font-mono text-slate-400 text-[10px]">
                        {new Date(w.timestamp).toLocaleString()}
                      </td>
                      <td className="py-3 font-semibold text-slate-800">
                        {w.ingredientName}
                      </td>
                      <td className="py-3 text-center font-mono font-semibold text-red-600">
                        {w.quantity} {w.baseUom}
                      </td>
                      <td className="py-3 text-center font-mono font-bold text-slate-900">
                        ${w.cost.toFixed(2)}
                      </td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full uppercase ${
                          w.reason === "Spoilage" ? "bg-amber-50 text-amber-700 border border-amber-100" :
                          w.reason === "Burnt / Overcooked" ? "bg-orange-50 text-orange-700 border border-orange-100" :
                          w.reason === "Spillage / Dropped" ? "bg-rose-50 text-rose-700 border border-rose-100" :
                          "bg-slate-100 text-slate-600"
                        }`}>
                          {w.reason}
                        </span>
                      </td>
                      <td className="py-3 text-right text-slate-500 font-semibold">
                        {w.recordedBy}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* 1. Log Food Waste / Spoilage Modal */}
        {showWasteModal && (
          <div className="fixed inset-0 z-[1000] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
            <form onSubmit={handleAddWasteLog} className="bg-white rounded-3xl p-6 w-full max-w-md border border-slate-100 shadow-xl space-y-4">
              <div className="flex items-center gap-2 text-slate-900">
                <Trash2 className="w-5 h-5 shrink-0 text-red-500" />
                <h3 className="text-md font-extrabold font-display">Log Spoilage & Food Waste</h3>
              </div>
              <p className="text-xxs text-slate-400">Record kitchen preparation errors, expired shelf stock, or accidental spills to sync with theoretical stock calculations.</p>
              
              <div className="space-y-3 text-xs text-slate-700">
                <div>
                  <label className="block text-xxs font-bold text-slate-400 uppercase tracking-wider mb-1">Select Raw Ingredient</label>
                  <select
                    value={wasteIngredientId}
                    onChange={(e) => setWasteIngredientId(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
                  >
                    {varianceData.map((v: any) => (
                      <option key={v.ingredientId} value={v.ingredientId}>
                        {v.name} ({v.baseUom}) — ${v.costPerBaseUnit.toFixed(2)} / unit
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xxs font-bold text-slate-400 uppercase tracking-wider mb-1">Wasted Quantity (Units)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={wasteQuantity}
                    onChange={(e) => setWasteQuantity(e.target.value)}
                    placeholder="e.g., 2.50"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xxs font-bold text-slate-400 uppercase tracking-wider mb-1">Reason Code / Action Taken</label>
                  <select
                    value={wasteReason}
                    onChange={(e) => setWasteReason(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
                  >
                    <option value="">-- Choose Reason --</option>
                    <option value="Spoilage">Spoilage / Expired Shelf Life</option>
                    <option value="Burnt / Overcooked">Burnt / Overcooked / Prep Error</option>
                    <option value="Spillage / Dropped">Spillage / Dropped / Waste</option>
                    <option value="Customer Return">Customer Complaint Return</option>
                    <option value="Supplier Defect">Supplier Delivery Defect</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowWasteModal(false); setWasteIngredientId(""); setWasteQuantity(""); setWasteReason(""); }}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl font-bold text-xs hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs cursor-pointer"
                >
                  Log Waste Event
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 2. Rollover Period Modal */}
        {showRolloverModal && (
          <div className="fixed inset-0 z-[1000] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
            <form onSubmit={handleRolloverPeriod} className="bg-white rounded-3xl p-6 w-full max-w-sm border border-slate-100 shadow-xl space-y-4">
              <div className="flex items-center gap-2 text-indigo-650">
                <Lock className="w-5 h-5 shrink-0 text-indigo-650" />
                <h3 className="text-md font-extrabold font-display">Rollover Inventory Period</h3>
              </div>
              <p className="text-xxs text-slate-400 leading-relaxed">
                This shifts current <span className="font-bold">Actual Closing Stocks</span> to be the <span className="font-bold">Opening Stocks</span> of the new audit cycle. Received volumes reset to 0, and closing stock is reset to pending.
              </p>
              
              <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-[10px] text-amber-800 leading-normal">
                ⚠️ <span className="font-black">Critical:</span> For items where no physical stocktake was entered, the system will fallback and rollover using the calculated <span className="font-bold">Expected Closing Stock</span>.
              </div>

              <div className="space-y-2 text-xs">
                <label className="block text-xxs font-bold text-slate-400 uppercase tracking-wider mb-1">Enter Manager Authority PIN</label>
                <input
                  type="password"
                  required
                  value={rolloverPin}
                  onChange={(e) => setRolloverPin(e.target.value)}
                  placeholder="••••"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-center tracking-widest font-bold font-mono text-lg"
                />
                <span className="block text-[9px] text-slate-400 text-center">Standard Authority passcode is: <span className="font-bold">9999</span></span>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowRolloverModal(false); setRolloverPin(""); }}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl font-bold text-xs hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-indigo-650 hover:bg-indigo-600 text-white rounded-xl font-bold text-xs cursor-pointer"
                >
                  Execute Rollover
                </button>
              </div>
            </form>
          </div>
        )}

      </div>
    );
  };

  const renderBcgTab = () => {
    if (loadingBcg || !bcgData) {
      return (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-8 h-8 border-4 border-slate-350 border-t-slate-900 rounded-full animate-spin"></div>
          <p className="text-xs font-semibold text-slate-500 mt-2 animate-pulse">Computing menu engineering matrix...</p>
        </div>
      );
    }

    const { matrix, avgPopularity, avgMargin } = bcgData;

    // Filter items into quadrants
    const stars = matrix.filter((item: any) => item.classification === "Star");
    const plowhorses = matrix.filter((item: any) => item.classification === "Plowhorse");
    const puzzles = matrix.filter((item: any) => item.classification === "Puzzle");
    const dogs = matrix.filter((item: any) => item.classification === "Dog");

    return (
      <div className="space-y-6 animate-fade-in">
        
        {/* Quick Matrix Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Stars */}
          <div className="bg-emerald-50/40 border border-emerald-100 p-5 rounded-2xl shadow-xxs">
            <div className="flex justify-between items-start">
              <span className="text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">
                Stars
              </span>
              <span className="text-xs font-mono font-bold text-emerald-700">{stars.length} Items</span>
            </div>
            <h4 className="text-xs font-bold text-slate-800 mt-3">High Popularity & Profit</h4>
            <p className="text-[10px] text-slate-500 leading-relaxed mt-1">
              Mainstays of your operation. Do not change portion size or alter quality. Highlight prominently.
            </p>
            <div className="mt-3.5 space-y-1">
              {stars.map((s: any) => (
                <div key={s.menuItemId} className="flex justify-between items-center text-xxs bg-white/70 p-1 rounded-sm border border-emerald-100">
                  <span className="font-semibold text-slate-750 truncate max-w-[120px]">{s.name}</span>
                  <span className="font-mono text-slate-500">{s.popularity} ords</span>
                </div>
              ))}
            </div>
          </div>

          {/* Plowhorses */}
          <div className="bg-amber-50/40 border border-amber-100 p-5 rounded-2xl shadow-xxs">
            <div className="flex justify-between items-start">
              <span className="text-[10px] bg-amber-100 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">
                Plowhorses
              </span>
              <span className="text-xs font-mono font-bold text-amber-700">{plowhorses.length} Items</span>
            </div>
            <h4 className="text-xs font-bold text-slate-800 mt-3">High Popularity, Low Profit</h4>
            <p className="text-[10px] text-slate-500 leading-relaxed mt-1">
              Customers love them, but margins are weak. Re-engineer ingredients, reduce portion sizes, or incrementally raise prices.
            </p>
            <div className="mt-3.5 space-y-1">
              {plowhorses.map((s: any) => (
                <div key={s.menuItemId} className="flex justify-between items-center text-xxs bg-white/70 p-1 rounded-sm border border-amber-100">
                  <span className="font-semibold text-slate-750 truncate max-w-[120px]">{s.name}</span>
                  <span className="font-mono text-slate-500">{s.popularity} ords</span>
                </div>
              ))}
            </div>
          </div>

          {/* Puzzles */}
          <div className="bg-indigo-50/40 border border-indigo-100 p-5 rounded-2xl shadow-xxs">
            <div className="flex justify-between items-start">
              <span className="text-[10px] bg-indigo-100 text-indigo-800 border border-indigo-200 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">
                Puzzles
              </span>
              <span className="text-xs font-mono font-bold text-indigo-700">{puzzles.length} Items</span>
            </div>
            <h4 className="text-xs font-bold text-slate-800 mt-3">Low Popularity, High Profit</h4>
            <p className="text-[10px] text-slate-500 leading-relaxed mt-1">
              Highly profitable but hard to sell. Launch focused campaigns using AI Marketing Copilot or rename items to stimulate interest.
            </p>
            <div className="mt-3.5 space-y-1">
              {puzzles.map((s: any) => (
                <div key={s.menuItemId} className="flex justify-between items-center text-xxs bg-white/70 p-1 rounded-sm border border-indigo-100">
                  <span className="font-semibold text-slate-750 truncate max-w-[120px]">{s.name}</span>
                  <span className="font-mono text-slate-500">{s.popularity} ords</span>
                </div>
              ))}
            </div>
          </div>

          {/* Dogs */}
          <div className="bg-slate-50/60 border border-slate-200 p-5 rounded-2xl shadow-xxs">
            <div className="flex justify-between items-start">
              <span className="text-[10px] bg-slate-200 text-slate-700 border border-slate-300 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">
                Dogs
              </span>
              <span className="text-xs font-mono font-bold text-slate-600">{dogs.length} Items</span>
            </div>
            <h4 className="text-xs font-bold text-slate-800 mt-3">Low Popularity & Profit</h4>
            <p className="text-[10px] text-slate-500 leading-relaxed mt-1">
              Unpopular and low margin. Redesign completely, replace with something on-trend, or remove from your registry entirely.
            </p>
            <div className="mt-3.5 space-y-1">
              {dogs.map((s: any) => (
                <div key={s.menuItemId} className="flex justify-between items-center text-xxs bg-white/70 p-1 rounded-sm border border-slate-200">
                  <span className="font-semibold text-slate-750 truncate max-w-[120px]">{s.name}</span>
                  <span className="font-mono text-slate-500">{s.popularity} ords</span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Deep Matrix Analysis Table */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Calculated BCG Menu Engineering Report</h3>
            <p className="text-[11px] text-slate-500">
              Analysis based on average popularity of <span className="font-bold text-slate-700">{avgPopularity.toFixed(1)} orders</span> and average margin of <span className="font-bold text-slate-700">${avgMargin.toFixed(2)}</span> per plate.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                  <th className="py-2.5">Menu Item</th>
                  <th className="py-2.5">Menu Price</th>
                  <th className="py-2.5">Theoretical Cost</th>
                  <th className="py-2.5">Gross Margin</th>
                  <th className="py-2.5">Food Cost %</th>
                  <th className="py-2.5">Units Sold</th>
                  <th className="py-2.5 text-right">BCG Classification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {matrix.map((item: any) => {
                  const classBadges = {
                    Star: "bg-emerald-50 text-emerald-750 border-emerald-100",
                    Plowhorse: "bg-amber-50 text-amber-750 border-amber-100",
                    Puzzle: "bg-indigo-50 text-indigo-750 border-indigo-100",
                    Dog: "bg-slate-100 text-slate-700 border-slate-200"
                  };

                  return (
                    <tr key={item.menuItemId} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 font-semibold text-slate-800">{item.name}</td>
                      <td className="py-3 font-mono text-slate-650">${item.price.toFixed(2)}</td>
                      <td className="py-3 font-mono text-slate-650">
                        {item.theoreticalCost > 0 ? `$${item.theoreticalCost.toFixed(2)}` : <span className="text-slate-300 font-sans italic text-[10px]">No BOM</span>}
                      </td>
                      <td className="py-3 font-mono font-bold text-slate-750">
                        {item.theoreticalCost > 0 ? `$${item.margin.toFixed(2)}` : "--"}
                      </td>
                      <td className="py-3 font-semibold">
                        {item.theoreticalCost > 0 ? (
                          <span className={item.foodCostPercent > 30 ? "text-red-500" : "text-emerald-650"}>
                            {item.foodCostPercent.toFixed(1)}%
                          </span>
                        ) : "--"}
                      </td>
                      <td className="py-3 font-mono text-slate-650">{item.popularity} ea</td>
                      <td className="py-3 text-right">
                        <span className={`px-2 py-0.5 border text-[10px] font-bold rounded-md uppercase tracking-wider ${classBadges[item.classification as keyof typeof classBadges] || ""}`}>
                          {item.classification}
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
    );
  };

  const getActiveDepartment = (): DepartmentType => {
    if (ownerSubTab === "dashboard") return "owner-dashboard";
    if (ownerSubTab === "reports") return "owner-dashboard";
    if (ownerSubTab === "shifts") return "owner-shifts";
    if (ownerSubTab === "aggregators") return "owner-aggregators";
    if (ownerSubTab === "team") return "owner-employees";
    if (ownerSubTab === "costing") {
      if (costSubTab === "ingredients") return "owner-ingredients";
      if (costSubTab === "recipes") return "owner-recipes";
      if (costSubTab === "bcg") return "owner-bcg";
      if (costSubTab === "variance") return "owner-variance";
    }
    if (ownerSubTab === "hr") {
      if (hrSubTab === "attendance") return "owner-attendance";
      if (hrSubTab === "employees") return "owner-employees";
      if (hrSubTab === "schedules") return "owner-schedules";
      if (hrSubTab === "leaves") return "owner-leaves";
      if (hrSubTab === "payroll") return "owner-payroll";
      if (hrSubTab === "devices") return "owner-devices";
    }
    return "owner-dashboard";
  };

  return (
    <div className="space-y-8 animate-fade-in" id="owner-portal-shell">
      
      {/* 1. Header Overview */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-surface-base p-6 rounded-2xl shadow-xs border border-border-primary">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-2xl font-bold text-content-primary tracking-tight">SaaS Command Dashboard</h2>
            <DepartmentGuide department={getActiveDepartment()} buttonSize="sm" buttonVariant="solid" />
          </div>
          <p className="text-sm text-content-secondary font-medium mt-1">Live operational oversight, financial tracking, and Gemini AI menu advisors.</p>
        </div>
        <button 
          onClick={fetchStats}
          className="px-4 py-2 text-xs font-bold text-content-primary bg-surface-base hover:bg-slate-50 border border-border-primary rounded-lg transition-colors"
        >
          Force Sync Analytics
        </button>
      </div>

      {/* Sub-navigation Tabs */}
      <div className="flex border-b border-border-primary gap-6">
        <button
          onClick={() => setOwnerSubTab("dashboard")}
          className={`pb-3.5 text-sm font-bold border-b-2 px-1 transition-all cursor-pointer ${
            ownerSubTab === "dashboard"
              ? "border-slate-900 text-content-primary"
              : "border-transparent text-content-secondary hover:text-content-primary"
          }`}
        >
          Dashboard & Marketing
        </button>
        <button
          onClick={() => setOwnerSubTab("costing")}
          className={`pb-3.5 text-sm font-bold border-b-2 px-1 transition-all flex items-center gap-1.5 cursor-pointer ${
            ownerSubTab === "costing"
              ? "border-slate-900 text-content-primary"
              : "border-transparent text-content-secondary hover:text-content-primary"
          }`}
        >
          <Scale className="w-4 h-4 text-amber-500" />
          Recipe & Theoretical Costing Engine
        </button>
        <button
          onClick={() => setOwnerSubTab("shifts")}
          className={`pb-3.5 text-sm font-bold border-b-2 px-1 transition-all flex items-center gap-1.5 cursor-pointer ${
            ownerSubTab === "shifts"
              ? "border-slate-900 text-content-primary"
              : "border-transparent text-content-secondary hover:text-content-primary"
          }`}
        >
          <Clock className="w-4 h-4 text-indigo-500" />
          Cashier Shifts & Audit Hub
        </button>
        <button
          onClick={() => setOwnerSubTab("aggregators")}
          className={`pb-3.5 text-sm font-bold border-b-2 px-1 transition-all flex items-center gap-1.5 cursor-pointer ${
            ownerSubTab === "aggregators"
              ? "border-slate-900 text-content-primary"
              : "border-transparent text-content-secondary hover:text-content-primary"
          }`}
        >
          <Share2 className="w-4 h-4 text-emerald-500" />
          Aggregator Control Center
        </button>
        <button
          onClick={() => setOwnerSubTab("hr")}
          className={`pb-3.5 text-sm font-bold border-b-2 px-1 transition-all flex items-center gap-1.5 cursor-pointer ${
            ownerSubTab === "hr"
              ? "border-slate-900 text-content-primary"
              : "border-transparent text-content-secondary hover:text-content-primary"
          }`}
        >
          <Users className="w-4 h-4 text-rose-500" />
          HR & Payroll Suite
        </button>
        <button
          onClick={() => setOwnerSubTab("team")}
          className={`pb-3.5 text-sm font-bold border-b-2 px-1 transition-all flex items-center gap-1.5 cursor-pointer ${
            ownerSubTab === "team"
              ? "border-slate-900 text-content-primary"
              : "border-transparent text-content-secondary hover:text-content-primary"
          }`}
        >
          <Lock className="w-4 h-4 text-indigo-650" />
          Team Management
        </button>
        <button
          onClick={() => setOwnerSubTab("outlets")}
          className={`pb-3.5 text-sm font-bold border-b-2 px-1 transition-all flex items-center gap-1.5 cursor-pointer ${
            ownerSubTab === "outlets"
              ? "border-slate-900 text-content-primary"
              : "border-transparent text-content-secondary hover:text-content-primary"
          }`}
        >
          <MapPin className="w-4 h-4 text-sky-500" />
          Outlets & Registers (إدارة الفروع)
        </button>
        <button
          onClick={() => setOwnerSubTab("reports")}
          className={`pb-3.5 text-sm font-bold border-b-2 px-1 transition-all flex items-center gap-1.5 cursor-pointer ${
            ownerSubTab === "reports"
              ? "border-slate-900 text-content-primary"
              : "border-transparent text-content-secondary hover:text-content-primary"
          }`}
        >
          <TrendingUp className="w-4 h-4 text-emerald-600" />
          التقارير المالية (Financial Reports)
        </button>
      </div>

      {ownerSubTab === "dashboard" ? (
        <>
          {/* 2. Statistical Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4" id="stats-grid">
        {/* Metric 1 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600 shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xxs text-slate-500 font-medium uppercase tracking-wider">Gross Revenue</p>
            <h3 className="text-lg font-bold text-slate-800">${stats.totalRevenue.toFixed(2)}</h3>
            <p className="text-[10px] text-emerald-600 font-medium truncate">From receipts</p>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600 shrink-0">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xxs text-slate-500 font-medium uppercase tracking-wider">Total Sales</p>
            <h3 className="text-lg font-bold text-slate-800">{stats.ordersCount}</h3>
            <p className="text-[10px] text-slate-500 truncate">{stats.activeOrdersCount} in pipeline</p>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-3">
          <div className="p-2.5 bg-cyan-50 rounded-xl text-cyan-600 shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xxs text-slate-500 font-medium uppercase tracking-wider">Occupancy</p>
            <h3 className="text-lg font-bold text-slate-800">{stats.occupancyRate}%</h3>
            <p className="text-[10px] text-slate-500 truncate">Live tables map</p>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-3">
          <div className="p-2.5 bg-amber-50 rounded-xl text-amber-600 shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          {stats.popularDishes && stats.popularDishes.length > 0 ? (
            <div className="min-w-0 flex-1">
              <p className="text-xxs text-slate-500 font-medium uppercase tracking-wider">Top-Seller</p>
              <h4 className="text-xs font-semibold text-slate-800 truncate">{stats.popularDishes[0].name}</h4>
              <p className="text-[10px] text-amber-600 font-medium truncate">{stats.popularDishes[0].count} orders</p>
            </div>
          ) : (
            <div className="min-w-0">
              <p className="text-xxs text-slate-500 font-medium uppercase tracking-wider">Top Dish</p>
              <h4 className="text-xs font-semibold text-slate-400 truncate">Waiting</h4>
              <p className="text-[10px] text-slate-400 truncate">No orders yet</p>
            </div>
          )}
        </div>

        {/* Metric 5 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 rounded-xl text-blue-600 shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xxs text-slate-500 font-medium uppercase tracking-wider">Avg Prep SLA</p>
            <h3 className="text-lg font-bold text-slate-800">{stats.averageSlaMinutes ? stats.averageSlaMinutes.toFixed(1) : "0.0"}m</h3>
            <p className="text-[10px] text-slate-500 truncate">Kitchen delay SLA</p>
          </div>
        </div>

        {/* Metric 6 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-3">
          <div className="p-2.5 bg-rose-50 rounded-xl text-rose-600 shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xxs text-slate-500 font-medium uppercase tracking-wider">Audit Flags</p>
            <h3 className={`text-lg font-bold ${stats.discrepanciesCount > 0 ? "text-rose-600" : "text-slate-800"}`}>
              {stats.discrepanciesCount || 0}
            </h3>
            <p className="text-[10px] text-slate-500 truncate">Payout discrepancies</p>
          </div>
        </div>
      </div>

      {/* 3. bento-grid: AI generator + Popular items list */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column (8 units): Gemini AI Menu Planner */}
        <div className="lg:col-span-8 bg-gradient-to-br from-slate-900 to-indigo-950 text-white p-6 md:p-8 rounded-2xl shadow-md border border-indigo-900/40 relative overflow-hidden flex flex-col justify-between min-h-[460px]">
          {!isModuleUnlocked(3, ["cost_control", "advanced_reports"]) ? (
            <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center z-20 space-y-4">
              <div className="w-12 h-12 bg-indigo-500/10 border border-indigo-400/20 rounded-full flex items-center justify-center text-indigo-400 shadow-sm">
                <Lock className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-md font-bold text-white">Gemini AI Menu Planner Locked</h4>
                <p className="text-xxs text-slate-400 max-w-sm">
                  The automated luxury menu generator, cost modeler, and AI recipe draftsman require a <b>Tier 3 (Professional) SaaS Subscription</b>.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSaasTier(3)}
                className="px-4 py-2 bg-indigo-650 hover:bg-indigo-600 text-white border border-indigo-700 rounded-lg text-xxs font-bold cursor-pointer transition-all"
              >
                Upgrade to Tier 3 (Professional)
              </button>
            </div>
          ) : null}
          
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <Sparkles className="w-48 h-48 text-indigo-400" />
          </div>

          <div className="space-y-4 relative z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-500/10 border border-indigo-400/20 text-indigo-300 text-xs font-semibold rounded-full">
              <Sparkles className="w-3.5 h-3.5" />
              Gemini-3.5 Fine-Dining Co-Owner
            </div>
            <h3 className="text-2xl font-bold tracking-tight">AI Culinary Concept Developer</h3>
            <p className="text-sm text-indigo-200/90 max-w-xl">
              Instantly draft original menu additions with rich sensory descriptions, exact plating suggestions, and balanced luxury market cost structures.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 text-slate-900">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-indigo-200">Gourmet Cuisines Theme / Tone</label>
                <input 
                  type="text"
                  value={cuisineTheme}
                  onChange={(e) => setCuisineTheme(e.target.value)}
                  placeholder="e.g. Japanese-Nordic Fusion"
                  className="px-3 py-2 bg-white rounded-lg text-sm font-medium border border-indigo-900/20 focus:outline-hidden"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-indigo-200">Chef Mandate Style</label>
                <input 
                  type="text"
                  value={chefProfile}
                  onChange={(e) => setChefProfile(e.target.value)}
                  placeholder="e.g. Molecular Avant-garde"
                  className="px-3 py-2 bg-white rounded-lg text-sm font-medium border border-indigo-900/20 focus:outline-hidden"
                />
              </div>

              <div className="flex flex-col gap-1 text-slate-800">
                <label className="text-xs font-semibold text-indigo-200">Target Category</label>
                <select 
                  value={itemType}
                  onChange={(e) => setItemType(e.target.value)}
                  className="px-3 py-2 bg-white rounded-lg text-sm font-medium border border-indigo-900/20 focus:outline-hidden"
                >
                  <option value="Appetizers">Appetizers</option>
                  <option value="Mains">Mains</option>
                  <option value="Desserts">Desserts</option>
                  <option value="Drinks">Drinks</option>
                </select>
              </div>
            </div>

            {aiError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-300 rounded-lg text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{aiError}</span>
              </div>
            )}
          </div>

          <div className="pt-6 relative z-10 flex flex-col gap-4">
            <button
              onClick={handleGenerateAiMenu}
              disabled={generatingMenu}
              className="px-6 py-3 w-full md:w-auto self-start bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-900 disabled:opacity-50 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 transition-all font-mono"
            >
              {generatingMenu ? (
                <>
                  <div className="w-4 h-4 border-2 border-indigo-300 border-t-white rounded-full animate-spin"></div>
                  Generating Exquisite Recipes...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  GENERATE 3 LUXURY EXPERIMENTS
                </>
              )}
            </button>

            {/* Generated results cards */}
            {aiGeneratedItems.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 animate-fade-in">
                {aiGeneratedItems.map((dish, idx) => (
                  <div key={idx} className="bg-white/10 backdrop-blur-xs p-4 rounded-xl border border-white/10 flex flex-col justify-between gap-3 text-slate-100">
                    <div>
                      <div className="flex justify-between items-start gap-1">
                        <h4 className="text-sm font-bold tracking-tight">{dish.name}</h4>
                        <span className="text-xs bg-indigo-500/20 px-2 py-0.5 rounded-full font-semibold text-indigo-300">${dish.price.toFixed(2)}</span>
                      </div>
                      <p className="text-xs text-indigo-100/70 mt-1 lines-clamp-3">{dish.description}</p>
                    </div>
                    <button
                      onClick={() => handleAddAiDishToMenu(dish)}
                      className="px-3 py-1.5 bg-indigo-500/20 hover:bg-indigo-500 border border-indigo-400/30 text-white font-semibold text-xxs tracking-wider uppercase rounded-lg transition-all flex items-center gap-1 justify-center"
                    >
                      <Plus className="w-3 h-3" /> Insert to Live Menu
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right Column (4 units): Sales details breakdown */}
        <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between min-h-[460px]">
          <div>
            <h3 className="text-md font-bold text-slate-800 tracking-tight flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              Dynamic Item Popularity
            </h3>
            <p className="text-xs text-slate-500">Live ranking of dishes based on receipt logs.</p>

            <div className="space-y-4 mt-6">
              {stats.popularDishes && stats.popularDishes.length > 0 ? (
                stats.popularDishes.map((dish, idx) => {
                  const maxCount = stats.popularDishes[0]?.count || 1;
                  const pct = Math.round((dish.count / maxCount) * 100);
                  return (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-700 truncate max-w-[200px]">{dish.name}</span>
                        <span className="text-slate-500 shrink-0">{dish.count} orders</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-amber-500 h-2 rounded-full transition-all duration-500" 
                          style={{ width: `${pct}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <UtensilsCrossed className="w-8 h-8 text-slate-300 stroke-1 mb-2" />
                  <p className="text-xs font-semibold text-slate-400">No orders logged.</p>
                  <p className="text-xxs text-slate-400 mt-1 max-w-[180px]">Simulate a customer order to test statistics.</p>
                </div>
              )}
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/60 space-y-3 text-xs shadow-xxs">
            <div className="flex justify-between items-center">
              <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[10px] flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5 text-indigo-600" />
                SaaS Subscription Tier Control
              </h4>
              <span className="text-[9px] bg-indigo-100 text-indigo-800 border border-indigo-200 px-1.5 py-0.2 rounded font-black uppercase">
                Active: Tier {saasTier}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-1">
              {[1, 2, 3, 4].map((tier) => (
                <button
                  key={tier}
                  type="button"
                  onClick={() => setSaasTier(tier as 1 | 2 | 3 | 4)}
                  className={`py-1.5 rounded-lg text-xxs font-extrabold border transition-all cursor-pointer text-center ${
                    saasTier === tier
                      ? "bg-indigo-650 text-white border-indigo-700 shadow-sm"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  T{tier}
                </button>
              ))}
            </div>

            <div className="text-[10px] text-slate-500 leading-normal space-y-1 bg-white/60 p-2.5 rounded-lg border border-slate-150">
              {saasTier === 1 && (
                <>
                  <p className="font-bold text-slate-700">Tier 1: Starter Plan ($29/mo)</p>
                  <p className="text-[9px]">Gated to core Seating & Boards dispatcher. POS inputs, financial costing, AI planners, and Careem/Talabat integrations are restricted.</p>
                </>
              )}
              {saasTier === 2 && (
                <>
                  <p className="font-bold text-slate-700">Tier 2: Growth Plan ($79/mo)</p>
                  <p className="text-[9px]">Unlocks Floor Management and POS Order Intake. AI menu planners, ingredient costing matrices, and aggregators are locked.</p>
                </>
              )}
              {saasTier === 3 && (
                <>
                  <p className="font-bold text-slate-700">Tier 3: Professional Plan ($149/mo)</p>
                  <p className="text-[9px]">Unlocks AI Menu Planner, AI Marketing Copilot, and Recipe/BOM Profitability costing tabs. Direct delivery aggregator syncs are locked.</p>
                </>
              )}
              {saasTier === 4 && (
                <>
                  <p className="font-bold text-slate-700 font-mono text-emerald-700">Tier 4: Enterprise Suite ($299/mo) ★</p>
                  <p className="text-[9px]">Ultimate tier! Unlocks full aggregator direct sync, Careem/Talabat live webhook simulations, gapless cashier shift audits, SLA monitors, and split bills.</p>
                </>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* 4. AI Copywriter & Marketing Campaign Draft */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs grid grid-cols-1 md:grid-cols-12 gap-6 relative overflow-hidden" id="ai-copy-tool">
        {!isModuleUnlocked(3, ["crm_loyalty", "cost_control", "advanced_reports"]) ? (
          <div className="absolute inset-0 bg-white/95 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center z-20 space-y-4 animate-fade-in">
            <div className="w-12 h-12 bg-indigo-50 border border-slate-200 rounded-full flex items-center justify-center text-indigo-600 shadow-xxs">
              <Lock className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-slate-850">AI Marketing Copilot Locked</h4>
              <p className="text-xxs text-slate-500 max-w-sm">
                Automatic newsletter generation and social media copywriting require a <b>Tier 3 (Professional) SaaS Subscription</b>.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSaasTier(3)}
              className="px-4 py-2 bg-indigo-650 hover:bg-indigo-600 text-white border border-indigo-700 rounded-lg text-xxs font-bold cursor-pointer transition-all"
            >
              Upgrade to Tier 3 (Professional)
            </button>
          </div>
        ) : null}
        <div className="md:col-span-5 space-y-4">
          <div className="flex items-center gap-2 text-indigo-900">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            <h3 className="text-md font-bold text-slate-800 tracking-tight">AI Marketing Copilot</h3>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Choose an item from your real-time registry. Let Gemini generate dynamic newsletter copy or Instagram captions designed to drive reservations.
          </p>

          <div className="space-y-3 pt-2 text-xs">
            <div>
              <label className="block text-slate-600 font-semibold mb-1">Target Dish</label>
              <select
                value={selectedCampaignDish}
                onChange={(e) => setSelectedCampaignDish(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              >
                <option value="">-- Choose registered dish --</option>
                {menu.map(item => (
                  <option key={item.id} value={item.name}>{item.name} (${item.price.toFixed(2)})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">Campaign Premise</label>
              <select
                value={promotionType}
                onChange={(e) => setPromotionType(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              >
                <option value="Weekend Special Discount">Weekend Special Discount</option>
                <option value="Storytelling (Chef's Inspiration)">Chef Insider/Storytelling</option>
                <option value="Exclusive Seasonal Launch">Exclusive Seasonal Launch</option>
                <option value="Limited Table Reservation Drive">Limited Reservations Drive</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">Instructions (Optional)</label>
              <input 
                type="text"
                value={customCampaignPrompt}
                onChange={(e) => setCustomCampaignPrompt(e.target.value)}
                placeholder="e.g. Mention local organic mushroom farms..."
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              />
            </div>

            {campaignError && (
              <p className="text-xxs text-red-500 font-medium">{campaignError}</p>
            )}

            <button
              onClick={handleGenerateCampaign}
              disabled={generatingCampaign}
              className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 text-xs font-semibold w-full transition-colors flex items-center justify-center gap-2"
            >
              {generatingCampaign ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-slate-600 border-t-white rounded-full animate-spin"></div>
                  Drafting Social Campaign...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4" />
                  Compose Copy with Gemini
                </>
              )}
            </button>
          </div>
        </div>

        <div className="md:col-span-7 bg-slate-50 p-6 rounded-xl border border-slate-200 flex flex-col justify-between min-h-[220px]">
          {generatedCampaignCopy ? (
            <div className="flex flex-col justify-between h-full gap-4">
              <div className="space-y-2">
                <p className="text-xxs font-semibold uppercase tracking-wider text-indigo-600 font-mono">Gemini Marketing Output</p>
                <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed italic">
                  "{generatedCampaignCopy}"
                </p>
              </div>

              <button
                onClick={copyCampaignToClipboard}
                className="self-end px-3 py-1.5 text-xs bg-white text-slate-700 font-semibold rounded-lg border border-slate-200 shadow-xxs hover:bg-slate-50 transition-colors flex items-center gap-1.5"
              >
                {campaignCopied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Copy Copywriting
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full py-12 text-center text-slate-400">
              <FileText className="w-8 h-8 stroke-1 mb-2" />
              <p className="text-xs font-medium">Draft Campaign Preview Pane</p>
              <p className="text-xxs max-w-[280px] mt-1">Configure options on the left and trigger the advisor, copy will display instantly.</p>
            </div>
          )}
        </div>
      </div>

      {/* 5. Menu Builder Register & manual input */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="text-md font-bold text-slate-900 tracking-tight">Active Menu Registry</h3>
            <p className="text-xs text-slate-500">Live operational menu mapping. Toggle availability or delete items.</p>
          </div>

          <div className="flex gap-2 text-xs">
            {["All", "Appetizers", "Mains", "Desserts", "Drinks"].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedFilterCategory(cat)}
                className={`px-3 py-1.5 rounded-lg transition-colors font-medium ${selectedFilterCategory === cat ? "bg-slate-900 text-white" : "bg-slate-50 text-slate-600 hover:bg-slate-150 border border-slate-150"}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Menu Table/Cards */}
          <div className="lg:col-span-2 space-y-3 overflow-y-auto max-h-[500px] pr-2">
            {filteredMenu.map((item) => (
              <div key={item.id} className="p-4 bg-slate-50 rounded-xl border border-slate-150 flex justify-between items-center gap-4 hover:border-slate-300 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-50 text-indigo-700 flex items-center justify-center rounded-lg font-bold text-xs uppercase shrink-0">
                    {item.image.slice(0, 3)}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">{item.name}</h4>
                    <p className="text-xxs text-slate-500 lines-clamp-2">{item.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xxs bg-slate-200/60 px-1.5 py-0.2 rounded-sm text-slate-600 font-mono font-bold">${item.price.toFixed(2)}</span>
                      <span className="text-xxs text-slate-400 font-medium">{item.category}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <div className="flex items-center gap-1">
                    <label className="text-xxs text-slate-500 font-semibold cursor-pointer select-none" htmlFor={`avail-${item.id}`}>Avail</label>
                    <input 
                      type="checkbox"
                      id={`avail-${item.id}`}
                      checked={!!item.isAvailable}
                      onChange={() => handleToggleAvailability(item)}
                      className="w-3.5 h-3.5 accent-indigo-600 cursor-pointer"
                    />
                  </div>

                  {confirmDeleteId === item.id ? (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleDeleteDish(item.id)}
                        className="px-2 py-1 bg-red-600 text-white rounded-md text-[10px] font-bold hover:bg-red-700 transition-colors"
                      >
                        Sure?
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="px-1.5 py-1 bg-slate-200 text-slate-650 rounded-md text-[10px] font-semibold hover:bg-slate-300 transition-colors"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDeleteId(item.id)}
                      className="p-1.5 bg-white text-slate-400 hover:text-red-500 hover:bg-red-50 border border-slate-150 rounded-lg transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}

            {filteredMenu.length === 0 && (
              <p className="text-center py-12 text-xs text-slate-400">No items available under category "{selectedFilterCategory}"</p>
            )}
          </div>

          {/* Manual Add Form */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-slate-700" />
              Add Handmade Dish
            </h4>

            <form onSubmit={handleAddDish} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Dish Name</label>
                <input 
                  type="text"
                  required
                  value={newDish.name}
                  onChange={(e) => setNewDish({ ...newDish, name: e.target.value })}
                  placeholder="e.g. Roasted Thyme Potatoes"
                  className="w-full p-2 bg-white border border-slate-200 rounded-lg focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Description</label>
                <textarea 
                  value={newDish.description}
                  onChange={(e) => setNewDish({ ...newDish, description: e.target.value })}
                  placeholder="Sensory ingredient writeup..."
                  className="w-full p-2 bg-white border border-slate-200 rounded-lg focus:outline-hidden min-h-[60px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Price ($)</label>
                  <input 
                    type="number"
                    step="0.01"
                    required
                    value={newDish.price}
                    onChange={(e) => setNewDish({ ...newDish, price: e.target.value })}
                    placeholder="12.50"
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Category</label>
                  <select 
                    value={newDish.category}
                    onChange={(e) => setNewDish({ ...newDish, category: e.target.value })}
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg focus:outline-hidden"
                  >
                    <option value="Appetizers">Appetizers</option>
                    <option value="Mains">Mains</option>
                    <option value="Desserts">Desserts</option>
                    <option value="Drinks">Drinks</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Visual Backdrop Style</label>
                <select 
                  value={newDish.image}
                  onChange={(e) => setNewDish({ ...newDish, image: e.target.value })}
                  className="w-full p-2 bg-white border border-slate-200 rounded-lg focus:outline-hidden"
                >
                  <option value="Steak">Steak</option>
                  <option value="Pasta">Pasta</option>
                  <option value="Salad">Salad</option>
                  <option value="Dessert">Dessert</option>
                  <option value="Seafood">Seafood</option>
                  <option value="Burger">Burger</option>
                  <option value="Pizza">Pizza</option>
                  <option value="Chicken">Chicken</option>
                  <option value="Cocktail">Cocktail</option>
                  <option value="Coffee">Coffee</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={addingDish}
                className="w-full py-2 bg-indigo-650 hover:bg-indigo-600 text-white rounded-lg font-semibold transition-all flex items-center justify-center"
              >
                {addingDish ? "Creating..." : "Register Dish"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
      ) : ownerSubTab === "costing" ? (
        <div className="space-y-6">
          {/* Costing Sub-tab header navigation */}
          <div className="flex border-b border-slate-150 gap-6 text-xs font-semibold">
            <button
              onClick={() => setCostSubTab("ingredients")}
              className={`pb-2.5 px-1 border-b-2 transition-all ${
                costSubTab === "ingredients"
                  ? "border-amber-500 text-slate-900"
                  : "border-transparent text-slate-400 hover:text-slate-600"
              }`}
            >
              Raw Ingredients Master
            </button>
            <button
              onClick={() => setCostSubTab("recipes")}
              className={`pb-2.5 px-1 border-b-2 transition-all ${
                costSubTab === "recipes"
                  ? "border-amber-500 text-slate-900"
                  : "border-transparent text-slate-400 hover:text-slate-600"
              }`}
            >
              Recipe BOM & Cost Mapping
            </button>
            <button
              onClick={() => setCostSubTab("bcg")}
              className={`pb-2.5 px-1 border-b-2 transition-all ${
                costSubTab === "bcg"
                  ? "border-amber-500 text-slate-900"
                  : "border-transparent text-slate-400 hover:text-slate-600"
              }`}
            >
              BCG Menu Profitability Matrix
            </button>
            <button
              onClick={() => setCostSubTab("variance")}
              className={`pb-2.5 px-1 border-b-2 transition-all ${
                costSubTab === "variance"
                  ? "border-amber-500 text-slate-900"
                  : "border-transparent text-slate-400 hover:text-slate-600"
              }`}
            >
              Variance & Food Waste
            </button>
          </div>

          {costSubTab === "ingredients" && (
            !isModuleUnlocked(2, ["inventory"]) ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/60 shadow-xs max-w-md mx-auto space-y-6 my-12 animate-fade-in" id="ingredients-lock">
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-500 border border-slate-200 shadow-xxs">
                  <Lock className="w-6 h-6 text-indigo-650" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-slate-900 tracking-tight">Raw Materials Register Locked</h3>
                  <p className="text-xxs text-slate-500 leading-relaxed">
                    Accessing raw food materials, recipe bills of materials, and dynamic cost monitoring requires a <b>Tier 2 (Growth) Subscription</b>.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSaasTier(2)}
                  className="px-4 py-2 bg-indigo-650 hover:bg-indigo-600 text-white rounded-lg text-xxs font-bold cursor-pointer mx-auto flex items-center gap-1.5"
                >
                  Upgrade to Tier 2
                </button>
              </div>
            ) : renderIngredientsTab()
          )}
          {costSubTab === "recipes" && (
            !isModuleUnlocked(3, ["cost_control", "inventory"]) ? renderCostingTier3LockOverlay("Recipe BOM & Cost Mapping") : renderRecipesTab()
          )}
          {costSubTab === "bcg" && (
            !isModuleUnlocked(3, ["cost_control"]) ? renderCostingTier3LockOverlay("BCG Menu Profitability Matrix") : renderBcgTab()
          )}
          {costSubTab === "variance" && (
            !isModuleUnlocked(3, ["cost_control", "inventory"]) ? renderCostingTier3LockOverlay("Variance & Food Waste Audit") : renderVarianceTab()
          )}
        </div>
      ) : ownerSubTab === "shifts" ? (
        renderShiftsTab()
      ) : ownerSubTab === "hr" ? (
        renderHrTab()
      ) : ownerSubTab === "team" ? (
        <TeamManagement />
      ) : ownerSubTab === "outlets" ? (
        <OutletsManager orgId={org?.id} />
      ) : ownerSubTab === "aggregators" ? (
        !isModuleUnlocked(4, ["aggregator_integration"]) ? renderAggregatorsLockOverlay() : renderAggregatorsTab()
      ) : (
        <FinancialReportsCenter saasTier={effectiveSaasTier} />
      )}
    </div>
  );
}
