import React, { useState, useEffect } from "react";
import { 
  Briefcase, 
  Users, 
  ChefHat, 
  LineChart, 
  Sparkles, 
  RefreshCw, 
  UtensilsCrossed, 
  Info,
  Layers,
  CheckCircle,
  HelpCircle,
  Clock,
  AlertCircle,
  ShieldAlert,
  LogOut
} from "lucide-react";
import { MenuItem, Table, Order } from "./types";
import CustomerPortal from "./components/CustomerPortal";
import StaffPortal from "./components/StaffPortal";
import OwnerPortal from "./components/OwnerPortal";
import TenantLogin from "./components/TenantLogin";
import SuperAdminPortal from "./components/SuperAdminPortal";
import LanguageSwitcher from "./components/LanguageSwitcher";

async function fetchWithRetry(url: string, options?: RequestInit, retries = 6, delay = 500): Promise<Response> {
  try {
    const res = await fetch(url, options);
    if (!res.ok && [502, 503, 504].includes(res.status) && retries > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchWithRetry(url, options, retries - 1, delay * 1.5);
    }
    return res;
  } catch (error) {
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchWithRetry(url, options, retries - 1, delay * 1.5);
    }
    throw error;
  }
}

export default function App() {
  // Shared Perspective switch
  const [activePortal, setActivePortal] = useState<"customer" | "staff" | "owner" | "platform">("owner");

  // Authentication State
  const [user, setUser] = useState<any>(null); // { role: "super_admin" | "org_admin" | "waiter"..., organizationId, branchId, features: [] }
  const [org, setOrg] = useState<any>(null); // organization details
  const [authChecked, setAuthChecked] = useState<boolean>(false);

  // Core synchronized server states
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isServerHealthy, setIsServerHealthy] = useState<boolean>(true);

  // Data fetchers from actual server routes
  const fetchMenu = async () => {
    try {
      const res = await fetchWithRetry("/api/menu");
      const contentType = res.headers.get("content-type");
      if (res.ok && contentType && contentType.includes("application/json")) {
        const data = await res.json();
        setMenu(data);
        setIsServerHealthy(true);
      } else {
        throw new Error(`Expected JSON response, but got content-type: ${contentType}`);
      }
    } catch (err) {
      console.error("Unable to connect to server backend API:", err);
      setIsServerHealthy(false);
    }
  };

  const fetchTables = async () => {
    try {
      const res = await fetchWithRetry("/api/tables");
      const contentType = res.headers.get("content-type");
      if (res.ok && contentType && contentType.includes("application/json")) {
        const data = await res.json();
        setTables(data);
      } else {
        throw new Error(`Expected JSON response, but got content-type: ${contentType}`);
      }
    } catch (err) {
      console.error("Failed to query tables:", err);
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await fetchWithRetry("/api/orders");
      const contentType = res.headers.get("content-type");
      if (res.ok && contentType && contentType.includes("application/json")) {
        const data = await res.json();
        setOrders(data);
      } else {
        throw new Error(`Expected JSON response, but got content-type: ${contentType}`);
      }
    } catch (err) {
      console.error("Failed to fetch order history:", err);
    }
  };

  const fetchAllData = async () => {
    setLoading(true);
    await Promise.all([fetchMenu(), fetchTables(), fetchOrders()]);
    setLoading(false);
  };

  // Check auth session
  // Check auth session
  const checkAuth = async () => {
    try {
      const res = await fetchWithRetry("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setUser(data.user);
          setOrg(data.org);
          const isMenuRoute = window.location.pathname.startsWith("/menu");
          if (isMenuRoute) {
            setActivePortal("customer");
          } else if (data.user.role === "super_admin") {
            setActivePortal("platform");
          } else if (["org_admin", "owner"].includes(data.user.role)) {
            setActivePortal("owner");
          } else {
            setActivePortal("staff");
          }
        }
      }
    } catch (err) {
      console.error("Auth check failed:", err);
    } finally {
      setAuthChecked(true);
    }
  };

  // Synchronized initial poll
  useEffect(() => {
    const init = async () => {
      await checkAuth();
    };
    init();
  }, []);

  useEffect(() => {
    if (user) {
      fetchAllData();
      
      // Setup periodic sync every 15s to capture active table/order changes instantly
      const timer = setInterval(() => {
        fetchTables();
        fetchOrders();
      }, 15000);

      return () => clearInterval(timer);
    }
  }, [user]);

  const handleLoginSuccess = (loggedInUser: any, organization?: any) => {
    setUser(loggedInUser);
    setOrg(organization || null);
    const isMenuRoute = window.location.pathname.startsWith("/menu");
    if (isMenuRoute) {
      setActivePortal("customer");
    } else if (loggedInUser.role === "super_admin") {
      setActivePortal("platform");
    } else if (["org_admin", "owner"].includes(loggedInUser.role)) {
      setActivePortal("owner");
    } else {
      setActivePortal("staff");
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      setOrg(null);
      setMenu([]);
      setTables([]);
      setOrders([]);
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white" id="applet-viewport">
        <div className="w-10 h-10 border-4 border-slate-700 border-t-indigo-500 rounded-full animate-spin mb-4"></div>
        <p className="text-xs font-bold text-slate-400">جاري فحص المصادقة وبنية خادم SaaS...</p>
      </div>
    );
  }

  const isPublicMenuRoute = window.location.pathname.startsWith("/menu");

  if (isPublicMenuRoute && !user) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans" id="applet-viewport">
        <CustomerPortal 
          menu={menu}
          tables={tables}
          onRefreshTables={fetchTables}
          isPublicGuestMode={true}
        />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans" id="applet-viewport">
        <TenantLogin onLoginSuccess={handleLoginSuccess} />
      </div>
    );
  }

  if (user.role === "super_admin") {
    return <SuperAdminPortal onLogout={handleLogout} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans" id="applet-viewport">
      
      {/* 1. Global Navigation Bar */}
      <header className="bg-surface-base border-b border-border-primary sticky top-0 z-50 shadow-xxs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-12 flex justify-between items-center gap-4">
          
          {/* Logo Brand section */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-650 flex items-center justify-center text-white shadow-xs" style={{ backgroundColor: org?.primaryColor || "#4f46e5" }}>
              <Layers className="w-4.5 h-4.5 rotate-12" />
            </div>
            <div>
              <h1 className="text-sm font-black text-content-primary tracking-tight leading-none uppercase font-display">
                {org?.name || "eplfood.com"}
              </h1>
              <p className="text-[10px] text-content-secondary font-bold mt-0.5 leading-none">
                {org ? `${org.legalName} · ${org.plan.toUpperCase()}` : "Restaurant Suite"}
              </p>
            </div>
          </div>

          {/* Perspective/Portal switcher */}
          <div className="flex bg-slate-100 p-1 rounded-lg border border-border-primary" id="portal-perspective-tabs">
            <button
              onClick={() => setActivePortal("customer")}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                activePortal === "customer" 
                  ? "bg-surface-base text-content-primary shadow-xxs" 
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <UtensilsCrossed className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Guest Portal</span>
            </button>

            <button
              onClick={() => setActivePortal("staff")}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                activePortal === "staff" 
                  ? "bg-surface-base text-content-primary shadow-xxs" 
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <ChefHat className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Waiter Terminal</span>
            </button>

            {["org_admin", "owner"].includes(user.role) && (
              <button
                onClick={() => setActivePortal("owner")}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  activePortal === "owner" 
                    ? "bg-surface-base text-content-primary shadow-xxs" 
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <LineChart className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Owner HUD</span>
              </button>
            )}
          </div>

          {/* Right quick update indicator */}
          <div className="flex items-center gap-3">
            <LanguageSwitcher />

            <button
              onClick={fetchAllData}
              title="Refresh database records"
              className="p-1 hover:bg-slate-100 rounded-md transition-all text-slate-400 hover:text-slate-700"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <button
              onClick={handleLogout}
              title="تسجيل الخروج"
              className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-md transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>

            <div className="hidden sm:flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100 text-xxs font-semibold text-emerald-700">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
              Tenant Active
            </div>
          </div>

        </div>
      </header>

      {/* 2. Unified Developer Playground Advisory */}
      <div className="bg-indigo-50 border-b border-indigo-150 py-2.5 px-4">
        <div className="max-w-7xl mx-auto flex items-start sm:items-center gap-2 text-xxs text-indigo-850 leading-relaxed">
          <Info className="w-4 h-4 text-indigo-650 shrink-0 mt-0.5 sm:mt-0" />
          <span>
            <strong className="font-bold text-indigo-900">Isolated Tenant Mode ({org?.name || "Nile"}):</strong> You are logged in under a secure multi-tenant environment. Placing a bill under Guest Portal records revenue directly under your own organization ID (<b className="text-indigo-650">{user.organizationId}</b>), with commissions automatically calculated at <b className="text-emerald-700">{org?.revenueSharePercent}%</b>.
          </span>
        </div>
      </div>

      {/* 3. Main Content Portal display wrap */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Error warning if backend port check fails */}
        {!isServerHealthy && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-slate-700 rounded-2xl flex items-start gap-3 text-xs leading-relaxed">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-red-900 block mb-0.5">SaaS Backend Connection Fail</span>
              The Vite container is trying to mount backend listeners but is currently unresponsive. Ensure the dev proxy is loaded and try reloading the browser if persistent.
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 text-center gap-3">
            <div className="w-10 h-10 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin"></div>
            <p className="text-xs font-semibold text-slate-500">Connecting to SaaS Database and registering states...</p>
          </div>
        ) : (
          <React.Fragment>
            {activePortal === "customer" && (
              <CustomerPortal 
                menu={menu}
                tables={tables}
                onRefreshTables={fetchTables}
              />
            )}

            {activePortal === "staff" && (
              <StaffPortal 
                tables={tables}
                orders={orders}
                onRefreshOrders={fetchOrders}
                onRefreshTables={fetchTables}
                user={user}
                org={org}
              />
            )}

            {activePortal === "owner" && (
              <OwnerPortal 
                menu={menu}
                onRefreshMenu={fetchMenu}
                user={user}
                org={org}
                onRefreshAuth={checkAuth}
              />
            )}
          </React.Fragment>
        )}

      </main>

      {/* Footer Branding */}
      <footer className="bg-surface-base border-t border-border-primary py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xxs font-semibold text-content-secondary">
          <p>© 2026 OnyxSaaS Corporation · Crafted for AI Studio Premium Build Environment</p>
          <div className="flex gap-4">
            <span>Enterprise Firestore Database Connected</span>
            <span>Gemini-3.5-Flash Active</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
