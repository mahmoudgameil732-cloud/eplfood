import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "./LanguageSwitcher";
import { 
  Layers, 
  Lock, 
  Mail, 
  ArrowRight, 
  Sparkles, 
  Shield, 
  Coffee, 
  UtensilsCrossed,
  AlertCircle,
  Clock,
  KeyRound,
  Eye,
  EyeOff
} from "lucide-react";

interface TenantLoginProps {
  onLoginSuccess: (user: any, org?: any) => void;
}

export default function TenantLogin({ onLoginSuccess }: TenantLoginProps) {
  const { t, i18n } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pin, setPin] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState<"owner" | "staff" | "super">("owner");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (payload: any) => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "حدث خطأ أثناء تسجيل الدخول");
      }
      onLoginSuccess(data.user, data.org);
    } catch (err: any) {
      setError(err.message || "فشل الاتصال بالخادم");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === "staff") {
      if (!pin) {
        setError("برجاء إدخال رمز الـ PIN الخاص بك");
        return;
      }
      handleLogin({ pin });
    } else if (activeTab === "super") {
      handleLogin({ email, password });
    } else {
      if (!email || !password) {
        setError("يرجى ملء جميع الحقول المطلوبة");
        return;
      }
      handleLogin({ email, password });
    }
  };

  const triggerQuickDemo = (type: "super" | "growth" | "starter" | "staff_cashier" | "staff_manager") => {
    if (type === "super") {
      setEmail("superadmin@eplfood.com");
      setPassword("admin");
      setActiveTab("super");
      handleLogin({ email: "superadmin@eplfood.com", password: "admin" });
    } else if (type === "growth") {
      setEmail("owner@eplfood.com");
      setPassword("owner");
      setActiveTab("owner");
      handleLogin({ email: "owner@eplfood.com", password: "owner" });
    } else if (type === "starter") {
      setEmail("starter@eplfood.com");
      setPassword("owner");
      setActiveTab("owner");
      handleLogin({ email: "starter@eplfood.com", password: "owner" });
    } else if (type === "staff_cashier") {
      setPin("1111");
      setActiveTab("staff");
      handleLogin({ pin: "1111" });
    } else if (type === "staff_manager") {
      setPin("4444");
      setActiveTab("staff");
      handleLogin({ pin: "4444" });
    }
  };

  const isRtl = i18n.language === "ar";

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 relative w-full" id="login-container" dir={isRtl ? "rtl" : "ltr"}>
      <div className="absolute top-4 left-4 z-50">
        <LanguageSwitcher />
      </div>

      <div className="w-full max-w-5xl bg-surface-base rounded-3xl shadow-xl border border-border-primary overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        
        {/* Right side - Form */}
        <div className="p-8 sm:p-12 lg:col-span-7 flex flex-col justify-between">
          <div>
            {/* Logo Brand */}
            <div className="flex items-center gap-2 mb-8">
              <div className="w-10 h-10 rounded-xl bg-indigo-650 flex items-center justify-center text-white shadow-md">
                <Layers className="w-5.5 h-5.5 rotate-12" />
              </div>
              <div className="text-start">
                <h1 className="text-lg font-black text-content-primary tracking-tight leading-none uppercase font-display">
                  eplfood<span className="text-indigo-600">.com</span>
                </h1>
                <p className="text-[10px] text-content-secondary font-bold uppercase tracking-wider mt-0.5 leading-none">{t("login.tagline")}</p>
              </div>
            </div>

            <div className="space-y-2 mb-8 text-start">
              <h2 className="text-2xl font-bold text-content-primary tracking-tight">{t("login.title")}</h2>
              <p className="text-sm text-content-secondary font-medium">{t("login.sub")}</p>
            </div>

            {/* Tab switchers */}
            <div className="grid grid-cols-3 gap-2 p-1.5 bg-slate-100 rounded-xl mb-6 border border-border-primary">
              <button
                type="button"
                onClick={() => { setActiveTab("owner"); setError(null); }}
                className={`py-2 rounded-lg text-xs font-bold transition-all ${
                  activeTab === "owner" 
                    ? "bg-surface-base text-indigo-650 shadow-sm" 
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {t("login.ownerTab")}
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab("staff"); setError(null); }}
                className={`py-2 rounded-lg text-xs font-bold transition-all ${
                  activeTab === "staff" 
                    ? "bg-surface-base text-indigo-650 shadow-sm" 
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {t("login.staffTab")}
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab("super"); setError(null); }}
                className={`py-2 rounded-lg text-xs font-bold transition-all ${
                  activeTab === "super" 
                    ? "bg-surface-base text-indigo-650 shadow-sm" 
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {t("login.superTab")}
              </button>
            </div>

            {/* Alerts */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 text-slate-700 rounded-xl flex items-start gap-3 text-xs leading-relaxed text-start">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-red-900 block mb-0.5">{t("common.error")}</span>
                  {error}
                </div>
              </div>
            )}

            {/* Login form */}
            <form onSubmit={handleSubmit} className="space-y-5 text-start">
              {activeTab === "staff" ? (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">{t("login.pin")}</label>
                  <div className="relative">
                    <input
                      type="password"
                      placeholder="1111"
                      value={pin}
                      onChange={(e) => setPin(e.target.value)}
                      className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-border-primary rounded-xl text-center font-mono text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-surface-base transition-all text-content-primary"
                    />
                    <KeyRound className="w-5 h-5 text-slate-400 absolute right-3 top-3.5" />
                  </div>
                  <p className="text-xxs text-content-secondary mt-2 font-medium">
                    {isRtl ? "يرجى كتابة رمز المرور المكون من 4 أرقام الخاص بك والمقترن بورديتك الحالية." : "Please enter your 4-digit PIN associated with your shift."}
                  </p>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">{t("login.email")}</label>
                    <div className="relative">
                      <input
                        type="email"
                        placeholder="yourname@eplfood.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-border-primary rounded-xl text-left font-sans focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-surface-base transition-all text-content-primary"
                      />
                      <Mail className="w-5 h-5 text-slate-400 absolute right-3 top-3.5" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">{t("login.password")}</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-12 pr-10 py-3 bg-slate-50 border border-border-primary rounded-xl text-left font-sans focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-surface-base transition-all text-content-primary"
                      />
                      <Lock className="w-5 h-5 text-slate-400 absolute right-3 top-3.5" />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute left-3 top-3.5 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-indigo-650 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer mt-6"
              >
                {loading ? t("login.submitting") : t("login.submit")}
                <ArrowRight className={`w-4 h-4 ${isRtl ? "rotate-180" : ""}`} />
              </button>
            </form>
          </div>

          <div className="mt-8 pt-6 border-t border-border-primary text-center text-xs text-content-secondary font-medium">
            {isRtl 
              ? `حقوق الطبع محفوظة © ${new Date().getFullYear()} eplfood.com. منصة مرخصة سحابياً.`
              : `All rights reserved © ${new Date().getFullYear()} eplfood.com. Licensed SaaS Platform.`
            }
          </div>
        </div>

        {/* Left side - Dynamic Demo Selector Card */}
        <div className="bg-slate-950 p-8 sm:p-12 lg:col-span-5 flex flex-col justify-between text-white relative overflow-hidden">
          {/* Abstract glowing patterns */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 rounded-full filter blur-3xl opacity-10 -mr-20 -mt-20"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-pink-500 rounded-full filter blur-3xl opacity-10 -ml-20 -mb-20"></div>

          <div className="relative z-10 space-y-6">
            <div className="inline-flex items-center gap-1.5 bg-indigo-500/15 border border-indigo-400/20 px-3 py-1 rounded-full text-xs font-semibold text-indigo-300">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              {isRtl ? "أدوات محاكاة بنية الـ Multi-Tenant" : "Multi-Tenant Sandbox Tools"}
            </div>

            <div className="space-y-2 text-start">
              <h3 className="text-xl font-bold tracking-tight">{t("login.demoAccounts")}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {t("login.demoSub")}
              </p>
            </div>

            {/* Quick Login Buttons */}
            <div className="space-y-3.5 pt-4 text-start">
              {/* Super Admin option */}
              <button
                onClick={() => triggerQuickDemo("super")}
                className="w-full p-4 bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-indigo-500 rounded-2xl transition-all flex items-center justify-between text-start group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-all">
                    <Shield className="w-4.5 h-4.5" />
                  </div>
                  <div className="text-start">
                    <h4 className="text-xs font-bold text-white group-hover:text-indigo-400 transition-all">
                      {isRtl ? "مالك المنصة (Super Admin)" : "Platform Owner (Super Admin)"}
                    </h4>
                    <p className="text-[10px] text-slate-400">
                      {isRtl ? "إدارة المطاعم، الفواتير، ونسب العمولات" : "Manage tenants, billing, and commissions"}
                    </p>
                  </div>
                </div>
                <ArrowRight className={`w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition-all ${isRtl ? "group-hover:translate-x-[-4px]" : "group-hover:translate-x-[4px] rotate-180"}`} />
              </button>

              {/* Growth Plan Tenant option */}
              <button
                onClick={() => triggerQuickDemo("growth")}
                className="w-full p-4 bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-indigo-500 rounded-2xl transition-all flex items-center justify-between text-start group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-all">
                    <UtensilsCrossed className="w-4.5 h-4.5" />
                  </div>
                  <div className="text-start">
                    <h4 className="text-xs font-bold text-white group-hover:text-indigo-400 transition-all">
                      {isRtl ? "مطاعم النيل (Growth Tenant)" : "Nile Restaurants (Growth Tenant)"}
                    </h4>
                    <p className="text-[10px] text-slate-400">
                      {isRtl ? "3 فروع سقف، عمولة 1.5%، كامل المزايا" : "Up to 3 branches, 1.5% commission, full features"}
                    </p>
                  </div>
                </div>
                <ArrowRight className={`w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition-all ${isRtl ? "group-hover:translate-x-[-4px]" : "group-hover:translate-x-[4px] rotate-180"}`} />
              </button>

              {/* Starter Plan Tenant option */}
              <button
                onClick={() => triggerQuickDemo("starter")}
                className="w-full p-4 bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-pink-500 rounded-2xl transition-all flex items-center justify-between text-start group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-pink-500/20 flex items-center justify-center text-pink-400 group-hover:bg-pink-500 group-hover:text-white transition-all">
                    <Coffee className="w-4.5 h-4.5" />
                  </div>
                  <div className="text-start">
                    <h4 className="text-xs font-bold text-white group-hover:text-pink-400 transition-all">
                      {isRtl ? "كافيه الأميرة (Starter Tenant)" : "Princess Cafe (Starter Tenant)"}
                    </h4>
                    <p className="text-[10px] text-slate-400">
                      {isRtl ? "فرع واحد، عمولة 1.0%، ميزات أساسية فقط" : "1 branch, 1.0% commission, basic features only"}
                    </p>
                  </div>
                </div>
                <ArrowRight className={`w-4 h-4 text-slate-500 group-hover:text-pink-400 transition-all ${isRtl ? "group-hover:translate-x-[-4px]" : "group-hover:translate-x-[4px] rotate-180"}`} />
              </button>

              {/* Staff Waiter PIN option */}
              <button
                onClick={() => triggerQuickDemo("staff_cashier")}
                className="w-full p-4 bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-teal-500 rounded-2xl transition-all flex items-center justify-between text-start group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-teal-500/20 flex items-center justify-center text-teal-400 group-hover:bg-teal-500 group-hover:text-white transition-all">
                    <Clock className="w-4.5 h-4.5" />
                  </div>
                  <div className="text-start">
                    <h4 className="text-xs font-bold text-white group-hover:text-teal-400 transition-all">
                      {isRtl ? "كاشير مطعم النيل (Staff Cashier)" : "Nile Restaurant Cashier (Staff Cashier)"}
                    </h4>
                    <p className="text-[10px] text-slate-400">
                      {isRtl ? "PIN: 1111 - عزل للبيانات مقتصر على فرع أ" : "PIN: 1111 - Data isolated strictly to Branch A"}
                    </p>
                  </div>
                </div>
                <ArrowRight className={`w-4 h-4 text-slate-500 group-hover:text-teal-400 transition-all ${isRtl ? "group-hover:translate-x-[-4px]" : "group-hover:translate-x-[4px] rotate-180"}`} />
              </button>
            </div>
          </div>

          <div className="text-center text-xxs text-slate-500 pt-8">
            {isRtl 
              ? "بنية عزل المستأجرين مبنية بالكامل في الواجهة الخلفية والخادم."
              : "Multi-tenant isolation structure is fully implemented on the authoritative backend server."
            }
          </div>
        </div>

      </div>
    </div>
  );
}
