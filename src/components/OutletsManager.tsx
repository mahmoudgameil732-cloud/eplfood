import React, { useState, useEffect } from "react";
import { 
  MapPin, 
  Plus, 
  Trash2, 
  Edit, 
  Save, 
  X, 
  Tv, 
  Phone, 
  Clock, 
  DollarSign, 
  CheckCircle2, 
  AlertCircle,
  User,
  Key
} from "lucide-react";

interface Register {
  id: string;
  name: string;
  nameAr?: string;
}

interface Branch {
  id: string;
  slug: string;
  name: string;
  nameAr: string;
  logo: string;
  primaryColor: string;
  phone: string;
  address: string;
  isOpen: boolean;
  estimatedWaitMinutes: number;
  deliveryZones: any[];
  minOrderDelivery: number;
  deliveryFeeBase: number;
  registers?: Register[];
}

interface OutletsManagerProps {
  orgId?: string;
}

export default function OutletsManager({ orgId }: OutletsManagerProps) {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Modals state
  const [showAddBranch, setShowAddBranch] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  
  // New branch form state
  const [newBranch, setNewBranch] = useState({
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

  // Register form state
  const [addingRegisterToBranchId, setAddingRegisterToBranchId] = useState<string | null>(null);
  const [newRegister, setNewRegister] = useState({
    name: "",
    nameAr: ""
  });

  // Cashier management state
  const [staff, setStaff] = useState<any[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [newCashierName, setNewCashierName] = useState<{ [branchId: string]: string }>({});
  const [newCashierPin, setNewCashierPin] = useState<{ [branchId: string]: string }>({});

  const fetchBranches = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/branches" + (orgId ? `?orgId=${orgId}` : ""));
      if (res.ok) {
        const data = await res.json();
        setBranches(data);
      } else {
        setError("Failed to fetch outlets list.");
      }
    } catch (err) {
      setError("Error connecting to server.");
    } finally {
      setLoading(false);
    }
  };

  const fetchStaff = async () => {
    setLoadingStaff(true);
    try {
      const res = await fetch("/api/staff");
      if (res.ok) {
        const data = await res.json();
        setStaff(data);
      }
    } catch (err) {
      console.error("Error fetching staff:", err);
    } finally {
      setLoadingStaff(false);
    }
  };

  useEffect(() => {
    fetchBranches();
    fetchStaff();
  }, [orgId]);

  const handleAddCashier = async (branchId: string) => {
    const name = newCashierName[branchId] || "";
    const pin = newCashierPin[branchId] || "";

    if (!name.trim()) {
      alert("Please enter a cashier name.");
      return;
    }
    if (!pin.trim()) {
      alert("Please enter a password / PIN.");
      return;
    }

    try {
      const res = await fetch("/api/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          role: "cashier",
          pin: pin.trim(),
          branchId,
          status: "active",
          jobTitle: "Cashier",
          department: "FOH",
          createdBy: "owner"
        })
      });

      if (res.ok) {
        setNewCashierName(prev => ({ ...prev, [branchId]: "" }));
        setNewCashierPin(prev => ({ ...prev, [branchId]: "" }));
        setSuccess("Cashier account created successfully!");
        fetchStaff();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to create cashier.");
      }
    } catch (err) {
      console.error(err);
      alert("Network error creating cashier.");
    }
  };

  const handleDeleteCashier = async (staffId: string) => {
    if (!confirm("Are you sure you want to remove this cashier's shift permission?")) return;

    try {
      const res = await fetch(`/api/staff/${staffId}`, {
        method: "DELETE"
      });

      if (res.ok) {
        setSuccess("Cashier removed successfully.");
        fetchStaff();
      } else {
        alert("Failed to remove cashier.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!newBranch.name.trim() || !newBranch.nameAr.trim()) {
      setError("Please fill in both English and Arabic names.");
      return;
    }

    try {
      const res = await fetch("/api/branches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newBranch,
          orgId: orgId || "org-default"
        })
      });

      if (res.ok) {
        setSuccess("Outlet created successfully!");
        setShowAddBranch(false);
        setNewBranch({
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
        fetchBranches();
      } else {
        const errData = await res.json();
        setError(errData.error || "Failed to create outlet.");
      }
    } catch (err) {
      setError("Failed to create outlet due to a network issue.");
    }
  };

  const handleUpdateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBranch) return;
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/branches/${editingBranch.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingBranch)
      });

      if (res.ok) {
        setSuccess("Outlet updated successfully!");
        setEditingBranch(null);
        fetchBranches();
      } else {
        const errData = await res.json();
        setError(errData.error || "Failed to update outlet.");
      }
    } catch (err) {
      setError("Failed to update outlet.");
    }
  };

  const handleDeleteBranch = async (id: string) => {
    if (!confirm("Are you sure you want to delete this outlet? All of its configurations and registers will be removed from the portal.")) return;
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/branches/${id}`, {
        method: "DELETE"
      });

      if (res.ok) {
        setSuccess("Outlet deleted successfully.");
        fetchBranches();
      } else {
        setError("Failed to delete outlet.");
      }
    } catch (err) {
      setError("Network error deleting outlet.");
    }
  };

  const handleAddRegister = async (branchId: string) => {
    if (!newRegister.name.trim() || !newRegister.nameAr.trim()) {
      alert("Please provide both English and Arabic names for the register device.");
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
        setSuccess("Register terminal added successfully!");
        fetchBranches();
      } else {
        alert("Failed to add register.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteRegister = async (branchId: string, regId: string) => {
    if (!confirm("Are you sure you want to remove this cashier register terminal?")) return;

    try {
      const res = await fetch(`/api/branches/${branchId}/registers/${regId}`, {
        method: "DELETE"
      });

      if (res.ok) {
        setSuccess("Register terminal removed successfully.");
        fetchBranches();
      } else {
        alert("Failed to remove register.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in" id="outlets-manager-root">
      {/* Top action header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-xxs">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 tracking-tight font-display flex items-center gap-2">
            <MapPin className="w-5 h-5 text-indigo-600" />
            Outlets & Registers Management (إدارة الفروع وأجهزة الكاشير)
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-sans">
            Configure multiple restaurant branches, delivery attributes, and dynamic cashier register devices.
          </p>
        </div>
        <button
          onClick={() => {
            setError(null);
            setSuccess(null);
            setShowAddBranch(true);
          }}
          className="px-4 py-2 bg-indigo-650 hover:bg-indigo-600 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xxs"
        >
          <Plus className="w-4 h-4" />
          Add New Branch (إضافة فرع جديد)
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600 flex items-center gap-2 font-medium">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-xs text-emerald-600 flex items-center gap-2 font-medium">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Branches List Cards */}
      {loading && branches.length === 0 ? (
        <div className="p-12 text-center text-slate-400 text-xs">Loading outlets and register terminals...</div>
      ) : branches.length === 0 ? (
        <div className="p-16 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50 space-y-3">
          <MapPin className="w-8 h-8 text-slate-300 mx-auto" />
          <h4 className="text-sm font-bold text-slate-700">No Custom Branches Configured</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            You are currently using default statically defined branches. Click the button above to create your first customizable outlet.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {branches.map((branch) => (
            <div 
              key={branch.id} 
              className="bg-white border border-slate-100 rounded-2xl shadow-xxs overflow-hidden hover:shadow-xs transition-all flex flex-col justify-between"
            >
              {/* Card Header with cover/primary color accent */}
              <div className="p-5 border-b border-slate-50 flex justify-between items-start gap-4">
                <div className="flex gap-4 items-center">
                  <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 overflow-hidden flex items-center justify-center shrink-0">
                    <img 
                      src={branch.logo || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=200"} 
                      alt={branch.name} 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-extrabold text-slate-800">{branch.name}</h3>
                      <span className="text-xs font-semibold text-slate-400">|</span>
                      <h3 className="text-xs font-bold text-indigo-600 font-sans" dir="rtl">{branch.nameAr}</h3>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-slate-400 mt-1 font-mono text-[10px]">
                      <span className="flex items-center gap-0.5">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        ID: {branch.id}
                      </span>
                      {branch.phone && (
                        <span className="flex items-center gap-0.5">
                          <Phone className="w-3 h-3" />
                          {branch.phone}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-1.5 shrink-0">
                  <button
                    onClick={() => {
                      setError(null);
                      setSuccess(null);
                      setEditingBranch(branch);
                    }}
                    className="p-1.5 hover:bg-indigo-50 text-indigo-600 rounded-lg transition-colors border border-transparent hover:border-indigo-100"
                    title="Edit Branch"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteBranch(branch.id)}
                    className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg transition-colors border border-transparent hover:border-rose-100"
                    title="Delete Branch"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Branch Attributes info bar */}
              <div className="px-5 py-3 bg-slate-50/60 border-b border-slate-100 grid grid-cols-3 gap-2 text-center text-[10px] text-slate-500 font-mono">
                <div>
                  <span className="block text-slate-400 font-bold">WAIT TIME</span>
                  <span className="font-bold text-slate-700 flex items-center justify-center gap-0.5 mt-0.5">
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                    {branch.estimatedWaitMinutes || 15} Min
                  </span>
                </div>
                <div className="border-x border-slate-200">
                  <span className="block text-slate-400 font-bold">BASE DELIV.</span>
                  <span className="font-bold text-slate-700 flex items-center justify-center gap-0.5 mt-0.5">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                    {branch.deliveryFeeBase || 10} L.E.
                  </span>
                </div>
                <div>
                  <span className="block text-slate-400 font-bold">MIN DELIVERY</span>
                  <span className="font-bold text-slate-700 flex items-center justify-center gap-0.5 mt-0.5">
                    <DollarSign className="w-3.5 h-3.5 text-blue-500" />
                    {branch.minOrderDelivery || 40} L.E.
                  </span>
                </div>
              </div>

              {/* Registers Management Segment */}
              <div className="p-5 flex-1 space-y-3.5 bg-white">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Tv className="w-3.5 h-3.5 text-slate-400" />
                    Cashier Registers Terminals (أجهزة كاشير هذا الفرع)
                  </span>
                  {addingRegisterToBranchId !== branch.id ? (
                    <button
                      onClick={() => {
                        setNewRegister({ name: "", nameAr: "" });
                        setAddingRegisterToBranchId(branch.id);
                      }}
                      className="text-xxs font-extrabold text-indigo-600 hover:text-indigo-700 flex items-center gap-0.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Terminal (إضافة كاشير)
                    </button>
                  ) : (
                    <button
                      onClick={() => setAddingRegisterToBranchId(null)}
                      className="text-xxs font-extrabold text-slate-400 hover:text-slate-500 flex items-center gap-0.5 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                      Cancel
                    </button>
                  )}
                </div>

                {/* Inline Add Register Panel */}
                {addingRegisterToBranchId === branch.id && (
                  <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl space-y-2 animate-fade-in">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="block text-[10px] text-indigo-600 font-bold uppercase mb-0.5">English Name</label>
                        <input
                          type="text"
                          value={newRegister.name}
                          onChange={(e) => setNewRegister({ ...newRegister, name: e.target.value })}
                          placeholder="e.g. Register 1"
                          className="w-full bg-white border border-indigo-200 rounded-lg p-1.5 focus:outline-hidden text-slate-800"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-indigo-600 font-bold uppercase mb-0.5">Arabic Name</label>
                        <input
                          type="text"
                          value={newRegister.nameAr}
                          onChange={(e) => setNewRegister({ ...newRegister, nameAr: e.target.value })}
                          placeholder="مثال: كاشير 1"
                          className="w-full bg-white border border-indigo-200 rounded-lg p-1.5 focus:outline-hidden text-slate-800"
                          dir="rtl"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-1.5">
                      <button
                        onClick={() => setAddingRegisterToBranchId(null)}
                        className="px-2.5 py-1 text-[10px] font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-lg transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleAddRegister(branch.id)}
                        className="px-2.5 py-1 text-[10px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-all"
                      >
                        Add Register Terminal
                      </button>
                    </div>
                  </div>
                )}

                {/* Terminals list */}
                <div className="space-y-1.5">
                  {!branch.registers || branch.registers.length === 0 ? (
                    <p className="text-[10px] text-slate-400 italic">No cashier terminals configured for this branch. Active POS will fallback to default list.</p>
                  ) : (
                    branch.registers.map((reg) => (
                      <div 
                        key={reg.id} 
                        className="flex justify-between items-center p-2.5 bg-slate-50 rounded-xl hover:bg-slate-100/85 transition-all"
                      >
                        <div className="flex items-center gap-2">
                          <Tv className="w-3.5 h-3.5 text-slate-400" />
                          <span className="text-xs font-bold text-slate-700">{reg.name}</span>
                          <span className="text-xs text-slate-400">/</span>
                          <span className="text-xs font-medium text-slate-600" dir="rtl">{reg.nameAr || reg.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[9px] bg-slate-200/65 px-1.5 py-0.5 rounded text-slate-500 uppercase">{reg.id}</span>
                          <button
                            onClick={() => handleDeleteRegister(branch.id, reg.id)}
                            className="p-1 hover:bg-rose-100 hover:text-rose-600 rounded text-slate-400 transition-all cursor-pointer"
                            title="Delete Register"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="h-px bg-slate-100 my-4" />

                {/* Cashiers Management Block */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Key className="w-3.5 h-3.5 text-indigo-500" />
                      Authorized Cashiers & PINs (أفراد الكاشير وكلمات المرور)
                    </span>
                  </div>

                  {/* Add Cashier Inline Form */}
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-2.5 text-right" dir="rtl">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="block text-[10px] text-slate-500 font-bold mb-1">اسم الكاشير بالعربية/إنجليزية</label>
                        <input
                          type="text"
                          value={newCashierName[branch.id] || ""}
                          onChange={(e) => setNewCashierName(prev => ({ ...prev, [branch.id]: e.target.value }))}
                          placeholder="مثال: أحمد علي / Ahmad"
                          className="w-full bg-white border border-slate-200 rounded-lg p-1.5 focus:outline-hidden text-slate-800 text-right text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-500 font-bold mb-1">كلمة المرور / PIN</label>
                        <input
                          type="text"
                          value={newCashierPin[branch.id] || ""}
                          onChange={(e) => setNewCashierPin(prev => ({ ...prev, [branch.id]: e.target.value }))}
                          placeholder="مثال: 1234"
                          className="w-full bg-white border border-slate-200 rounded-lg p-1.5 focus:outline-hidden text-slate-800 font-mono text-right text-xs"
                        />
                      </div>
                    </div>
                    <div className="flex justify-start">
                      <button
                        onClick={() => handleAddCashier(branch.id)}
                        className="px-3 py-1.5 text-[10px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        إنشاء حساب كاشير جديد
                      </button>
                    </div>
                  </div>

                  {/* Cashiers List */}
                  <div className="space-y-1.5">
                    {(() => {
                      const branchCashiers = staff.filter((s: any) => 
                        s.branchId === branch.id && 
                        s.role === "cashier" && 
                        s.status !== "terminated"
                      );
                      if (branchCashiers.length === 0) {
                        return <p className="text-[10px] text-slate-400 italic">لا يوجد موظفي كاشير مسجلين حالياً لهذا الفرع. يرجى تهيئة حساب كاشير واحد على الأقل لفتح الشفت.</p>;
                      }
                      return branchCashiers.map((c: any) => (
                        <div 
                          key={c.id} 
                          className="flex justify-between items-center p-2.5 bg-slate-50 border border-slate-100 rounded-xl hover:bg-slate-100/85 transition-all"
                        >
                          <div className="flex items-center gap-2">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            <span className="text-xs font-bold text-slate-700">{c.name}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1 bg-indigo-50 text-indigo-700 text-[10px] font-mono px-2 py-0.5 rounded-md">
                              <Key className="w-3 h-3 text-indigo-500" />
                              <span>PIN: {c.pin}</span>
                            </div>
                            <button
                              onClick={() => handleDeleteCashier(c.id)}
                              className="p-1 hover:bg-rose-100 hover:text-rose-600 rounded text-slate-400 transition-all cursor-pointer"
                              title="Delete Cashier"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              </div>

              {/* Branch Address & Info footer */}
              {branch.address && (
                <div className="px-5 py-3 border-t border-slate-50 bg-slate-50/25 text-[10px] text-slate-400 flex items-center gap-1 font-sans">
                  <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                  <span className="line-clamp-1">{branch.address}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Branch Modal */}
      {showAddBranch && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-100 p-6 md:p-8 w-full max-w-lg shadow-xl space-y-5 animate-scale-up max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900 tracking-tight font-display">
                Create New Outlet (إضافة فرع جديد)
              </h3>
              <button 
                onClick={() => setShowAddBranch(false)}
                className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBranch} className="space-y-4 text-xs text-left">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Branch Name (English)</label>
                  <input
                    type="text"
                    required
                    value={newBranch.name}
                    onChange={(e) => setNewBranch({ ...newBranch, name: e.target.value })}
                    placeholder="e.g. Maadi Branch"
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-indigo-500 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1" dir="rtl">اسم الفرع (بالعربية)</label>
                  <input
                    type="text"
                    required
                    value={newBranch.nameAr}
                    onChange={(e) => setNewBranch({ ...newBranch, nameAr: e.target.value })}
                    placeholder="مثال: فرع المعادي"
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-indigo-500 text-slate-800 font-sans"
                    dir="rtl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Slug URL Identifier</label>
                <input
                  type="text"
                  value={newBranch.slug}
                  onChange={(e) => setNewBranch({ ...newBranch, slug: e.target.value })}
                  placeholder="e.g. maadi-branch (Leave empty for auto)"
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-indigo-500 font-mono text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={newBranch.phone}
                    onChange={(e) => setNewBranch({ ...newBranch, phone: e.target.value })}
                    placeholder="e.g. +201001234567"
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-indigo-500 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Estimated Wait / Prep (Mins)</label>
                  <input
                    type="number"
                    value={newBranch.estimatedWaitMinutes}
                    onChange={(e) => setNewBranch({ ...newBranch, estimatedWaitMinutes: parseInt(e.target.value) || 15 })}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-indigo-500 text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Base Delivery Fee (L.E.)</label>
                  <input
                    type="number"
                    value={newBranch.deliveryFeeBase}
                    onChange={(e) => setNewBranch({ ...newBranch, deliveryFeeBase: parseFloat(e.target.value) || 10 })}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-indigo-500 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Minimum Order Delivery (L.E.)</label>
                  <input
                    type="number"
                    value={newBranch.minOrderDelivery}
                    onChange={(e) => setNewBranch({ ...newBranch, minOrderDelivery: parseFloat(e.target.value) || 40 })}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-indigo-500 text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Physical Address</label>
                <input
                  type="text"
                  value={newBranch.address}
                  onChange={(e) => setNewBranch({ ...newBranch, address: e.target.value })}
                  placeholder="e.g. 9 Road 151, Maadi, Cairo"
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-indigo-500 text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 items-center">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Brand Logo URL</label>
                  <input
                    type="text"
                    value={newBranch.logo}
                    onChange={(e) => setNewBranch({ ...newBranch, logo: e.target.value })}
                    placeholder="https://unsplash.com/..."
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-indigo-500 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Primary Brand Color</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      value={newBranch.primaryColor}
                      onChange={(e) => setNewBranch({ ...newBranch, primaryColor: e.target.value })}
                      className="w-8 h-8 rounded-lg cursor-pointer border border-slate-200 shrink-0"
                    />
                    <input
                      type="text"
                      value={newBranch.primaryColor}
                      onChange={(e) => setNewBranch({ ...newBranch, primaryColor: e.target.value })}
                      className="w-full px-2 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddBranch(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-650 hover:bg-indigo-600 text-white font-bold rounded-xl transition-all"
                >
                  Create Branch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Branch Modal */}
      {editingBranch && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-100 p-6 md:p-8 w-full max-w-lg shadow-xl space-y-5 animate-scale-up max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900 tracking-tight font-display">
                Edit Outlet Configuration (تعديل بيانات الفرع)
              </h3>
              <button 
                onClick={() => setEditingBranch(null)}
                className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateBranch} className="space-y-4 text-xs text-left">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Branch Name (English)</label>
                  <input
                    type="text"
                    required
                    value={editingBranch.name}
                    onChange={(e) => setEditingBranch({ ...editingBranch, name: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-indigo-500 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1" dir="rtl">اسم الفرع (بالعربية)</label>
                  <input
                    type="text"
                    required
                    value={editingBranch.nameAr}
                    onChange={(e) => setEditingBranch({ ...editingBranch, nameAr: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-indigo-500 text-slate-800 font-sans"
                    dir="rtl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Slug URL Identifier</label>
                <input
                  type="text"
                  required
                  value={editingBranch.slug}
                  onChange={(e) => setEditingBranch({ ...editingBranch, slug: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-indigo-500 font-mono text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={editingBranch.phone}
                    onChange={(e) => setEditingBranch({ ...editingBranch, phone: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-indigo-500 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Estimated Wait / Prep (Mins)</label>
                  <input
                    type="number"
                    value={editingBranch.estimatedWaitMinutes}
                    onChange={(e) => setEditingBranch({ ...editingBranch, estimatedWaitMinutes: parseInt(e.target.value) || 15 })}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-indigo-500 text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Base Delivery Fee (L.E.)</label>
                  <input
                    type="number"
                    value={editingBranch.deliveryFeeBase}
                    onChange={(e) => setEditingBranch({ ...editingBranch, deliveryFeeBase: parseFloat(e.target.value) || 10 })}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-indigo-500 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Minimum Order Delivery (L.E.)</label>
                  <input
                    type="number"
                    value={editingBranch.minOrderDelivery}
                    onChange={(e) => setEditingBranch({ ...editingBranch, minOrderDelivery: parseFloat(e.target.value) || 40 })}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-indigo-500 text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Physical Address</label>
                <input
                  type="text"
                  value={editingBranch.address}
                  onChange={(e) => setEditingBranch({ ...editingBranch, address: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-indigo-500 text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 items-center">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Brand Logo URL</label>
                  <input
                    type="text"
                    value={editingBranch.logo}
                    onChange={(e) => setEditingBranch({ ...editingBranch, logo: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-indigo-500 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Primary Brand Color</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      value={editingBranch.primaryColor}
                      onChange={(e) => setEditingBranch({ ...editingBranch, primaryColor: e.target.value })}
                      className="w-8 h-8 rounded-lg cursor-pointer border border-slate-200 shrink-0"
                    />
                    <input
                      type="text"
                      value={editingBranch.primaryColor}
                      onChange={(e) => setEditingBranch({ ...editingBranch, primaryColor: e.target.value })}
                      className="w-full px-2 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingBranch(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-650 hover:bg-indigo-600 text-white font-bold rounded-xl transition-all"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
