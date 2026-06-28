import React, { useState, useEffect } from "react";
import { 
  Users, 
  Clock, 
  UtensilsCrossed, 
  ChefHat, 
  Bell, 
  DollarSign, 
  ChevronRight, 
  TrendingUp, 
  AlertCircle,
  AlertTriangle,
  Truck,
  ShoppingBag,
  MapPin,
  Flame,
  CheckCircle2,
  Trash2,
  Lock,
  PlusCircle,
  Briefcase,
  Receipt,
  Sliders,
  Sparkles,
  Printer,
  X,
  Volume2,
  VolumeX,
  Search,
  User,
  Phone
} from "lucide-react";
import { MenuItem, Table, Order, OrderStatus, TableStatus } from "../types";
import DepartmentGuide from "./DepartmentGuide";

interface StaffPortalProps {
  tables: Table[];
  orders: Order[];
  onRefreshOrders: () => void;
  onRefreshTables: () => void;
  user?: any;
  org?: any;
}

export default function StaffPortal({ tables, orders, onRefreshOrders, onRefreshTables, user, org }: StaffPortalProps) {
  // Role selector
  const [staffRole, setStaffRole] = useState<"kitchen" | "waiter">("waiter");
  const [voidingOrderId, setVoidingOrderId] = useState<string | null>(null);
  const [voidReason, setVoidReason] = useState<string>("");
  const [voidPin, setVoidPin] = useState<string>("");

  // Comprehensive live order filtering states
  const [filterFulfillmentSource, setFilterFulfillmentSource] = useState<string>("all");
  const [filterPaymentMethod, setFilterPaymentMethod] = useState<string>("all");
  const [filterOrderStatus, setFilterOrderStatus] = useState<string>("all");

  // Cashier Shifts state
  const [shifts, setShifts] = useState<any[]>([]);
  const [loadingShifts, setLoadingShifts] = useState(false);
  const [activeShift, setActiveShift] = useState<any | null>(null);
  const [availableBranches, setAvailableBranches] = useState<any[]>([]);

  // POS Touch-First Redesign States
  const [waiterSubTab, setWaiterSubTab] = useState<"dispatcher" | "pos">("dispatcher");

  // SaaS Subscription Billing Tier State derived dynamically from tenant organization context
  const saasTier = !org ? 4 : (
    org.plan === "starter" ? 1 : (
      org.plan === "growth" ? 2 : (
        org.plan === "professional" ? 3 : 4
      )
    )
  );
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [modifierGroups, setModifierGroups] = useState<any[]>([]);
  const [loadingMenu, setLoadingMenu] = useState(false);
  const [posCart, setPosCart] = useState<any[]>([]);
  const [posSelectedCategory, setPosSelectedCategory] = useState("All");
  const [posFulfillmentType, setPosFulfillmentType] = useState<"dine_in" | "takeaway" | "delivery">("dine_in");
  const [posSelectedTableId, setPosSelectedTableId] = useState<string>("");

  // POS Customer/Delivery Required Info States
  const [posCustomerName, setPosCustomerName] = useState("");
  const [posCustomerPhone, setPosCustomerPhone] = useState("");
  const [posDeliveryRegion, setPosDeliveryRegion] = useState("");
  const [posDeliveryStreet, setPosDeliveryStreet] = useState("");
  const [posDeliveryBldgLandmark, setPosDeliveryBldgLandmark] = useState("");
  const [posDeliveryAptSuite, setPosDeliveryAptSuite] = useState("");
  const [posDeliveryFloor, setPosDeliveryFloor] = useState("");
  const [posDeliveryCharge, setPosDeliveryCharge] = useState("5.00");

  // Custom modifier modal states
  const [showModifierModal, setShowModifierModal] = useState(false);
  const [modifierModalItem, setModifierModalItem] = useState<MenuItem | null>(null);
  const [modifierModalSelections, setModifierModalSelections] = useState<{ [groupId: string]: string[] }>({});
  const [modifierModalNotes, setModifierModalNotes] = useState("");

  // Payment tender checkout states
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "loyalty" | "split">("cash");
  const [splitCashAmount, setSplitCashAmount] = useState("");
  const [splitCardAmount, setSplitCardAmount] = useState("");
  const [checkoutSucceeded, setCheckoutSucceeded] = useState(false);
  const [createdReceipt, setCreatedReceipt] = useState<any | null>(null);

  // === Waiter Terminal Operational States ===
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem("sound_enabled");
      return stored !== null ? stored === "true" : true;
    } catch { return true; }
  });
  const [soundVolume, setSoundVolume] = useState<number>(() => {
    try {
      const stored = localStorage.getItem("sound_volume");
      return stored !== null ? parseFloat(stored) : 0.5;
    } catch { return 0.5; }
  });
  const [lastSoundPlayedAt, setLastSoundPlayedAt] = useState<number>(0);
  const [activeWaiterBoard, setActiveWaiterBoard] = useState<"plated" | "delivery" | "takeaway" | "all">("all");
  const [layoutMode, setLayoutMode] = useState<"tabbed" | "split">("tabbed");
  const [orderSearchQuery, setOrderSearchQuery] = useState("");
  const [selectedOrderForDetail, setSelectedOrderForDetail] = useState<any | null>(null);
  const [selectedOrderForRiderAssign, setSelectedOrderForRiderAssign] = useState<any | null>(null);
  const [printOrder, setPrintOrder] = useState<any | null>(null);
  const [riders, setRiders] = useState<any[]>([]);
  const [prevOrdersCount, setPrevOrdersCount] = useState<number>(orders.length);
  const [prevOrdersList, setPrevOrdersList] = useState<any[]>(orders);

  // Sync sound settings to localStorage
  useEffect(() => {
    localStorage.setItem("sound_enabled", String(soundEnabled));
  }, [soundEnabled]);

  useEffect(() => {
    localStorage.setItem("sound_volume", String(soundVolume));
  }, [soundVolume]);

  // Load staff database for riders list
  useEffect(() => {
    const fetchRiders = async () => {
      try {
        const res = await fetch("/api/staff");
        if (res.ok) {
          const data = await res.json();
          // Filter by role === "rider"
          const riderList = data.filter((s: any) => s.role === "rider");
          setRiders(riderList);
        }
      } catch (err) {
        console.error("Failed to load riders list:", err);
      }
    };
    fetchRiders();
  }, [activeShift]);

  // Synthesize chimes using Web Audio API Oscillator
  const playSynthesizedChime = (notes: number[], duration = 0.15, spacing = 0.15) => {
    if (!soundEnabled) return;
    
    // Cooldown check: max one sound alert per 3 seconds as specified
    const now = Date.now();
    if (now - lastSoundPlayedAt < 3000) return;
    setLastSoundPlayedAt(now);

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      
      const ctx = new AudioCtx();
      let startTime = ctx.currentTime;
      
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, startTime + idx * spacing);
        
        gain.gain.setValueAtTime(soundVolume, startTime + idx * spacing);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + idx * spacing + duration);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(startTime + idx * spacing);
        osc.stop(startTime + idx * spacing + duration);
      });
    } catch (err) {
      console.warn("AudioContext blocked or failed to initialize:", err);
    }
  };

  const playNewOrderChime = () => {
    // 3-tone ascending chime: C5 (523.25Hz), E5 (659.25Hz), G5 (783.99Hz)
    playSynthesizedChime([523.25, 659.25, 783.99], 0.2, 0.18);
  };

  const playReadyReminder = () => {
    // 2-tone attention chime: A5 (880Hz) then D5 (587.33Hz)
    playSynthesizedChime([880, 587.33], 0.25, 0.22);
  };

  // Live order detection hook for audio alerts
  useEffect(() => {
    if (orders.length > prevOrdersCount) {
      const newOrders = orders.filter(o => !prevOrdersList.some(po => po.id === o.id));
      if (newOrders.length > 0) {
        playNewOrderChime();
      }
    }
    
    orders.forEach(o => {
      const prevO = prevOrdersList.find(po => po.id === o.id);
      if (prevO && prevO.status !== o.status && (o.status === "ready_for_rider" || o.status === "ready_for_pickup")) {
        playReadyReminder();
      }
    });

    setPrevOrdersCount(orders.length);
    setPrevOrdersList(orders);
  }, [orders]);

  // Fetch Menu and Modifiers for POS Order Intake
  useEffect(() => {
    const loadMenuAndModifiers = async () => {
      setLoadingMenu(true);
      try {
        const menuRes = await fetch("/api/menu");
        if (menuRes.ok) {
          const menuData = await menuRes.json();
          setMenuItems(menuData);
        }
        const modRes = await fetch("/api/modifiers");
        if (modRes.ok) {
          const modData = await modRes.json();
          setModifierGroups(modData);
        }
      } catch (err) {
        console.error("Failed to load POS catalog data:", err);
      } finally {
        setLoadingMenu(false);
      }
    };
    if (staffRole === "waiter") {
      loadMenuAndModifiers();
    }
  }, [staffRole]);

  // Handler functions for POS cart operations
  const handleAddItemToCart = (item: MenuItem) => {
    if (item.modifierGroupIds && item.modifierGroupIds.length > 0) {
      setModifierModalItem(item);
      const initial: { [key: string]: string[] } = {};
      item.modifierGroupIds.forEach(id => {
        initial[id] = [];
      });
      setModifierModalSelections(initial);
      setModifierModalNotes("");
      setShowModifierModal(true);
    } else {
      const tempId = `cart-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
      const newCartItem = {
        id: tempId,
        menuItemId: item.id,
        name: item.name,
        price: item.price,
        quantity: 1,
        course: "main" as const,
        fired: true,
        modifiers: [],
        notes: ""
      };
      setPosCart([...posCart, newCartItem]);
    }
  };

  const handleConfirmModifiers = () => {
    if (!modifierModalItem) return;

    let isValid = true;
    const itemModGroups = modifierGroups.filter(g => modifierModalItem.modifierGroupIds?.includes(g.id));
    
    for (const group of itemModGroups) {
      const selections = modifierModalSelections[group.id] || [];
      if (group.required && selections.length < group.minSelections) {
        alert(`Required: Please select at least ${group.minSelections} option(s) for "${group.name}".`);
        isValid = false;
        return;
      }
      if (selections.length > group.maxSelections) {
        alert(`Maximum selections exceeded: Please select at most ${group.maxSelections} option(s) for "${group.name}".`);
        isValid = false;
        return;
      }
    }

    if (!isValid) return;

    const mappedModifiers: any[] = [];
    Object.entries(modifierModalSelections).forEach(([groupId, optIds]) => {
      const group = modifierGroups.find(g => g.id === groupId);
      if (!group) return;
      (optIds as string[]).forEach(optId => {
        const option = group.options.find((o: any) => o.id === optId);
        if (!option) return;
        mappedModifiers.push({
          groupId: group.id,
          groupName: group.name,
          optionId: option.id,
          optionName: option.name,
          price: option.price
        });
      });
    });

    const tempId = `cart-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const newCartItem = {
      id: tempId,
      menuItemId: modifierModalItem.id,
      name: modifierModalItem.name,
      price: modifierModalItem.price,
      quantity: 1,
      course: "main" as const,
      fired: true,
      modifiers: mappedModifiers,
      notes: modifierModalNotes
    };

    setPosCart([...posCart, newCartItem]);
    setShowModifierModal(false);
    setModifierModalItem(null);
  };

  const handleUpdateCartItemQty = (id: string, newQty: number) => {
    if (newQty <= 0) {
      setPosCart(posCart.filter(it => it.id !== id));
    } else {
      setPosCart(posCart.map(it => it.id === id ? { ...it, quantity: newQty } : it));
    }
  };

  const getCartTotals = () => {
    let subtotal = 0;
    posCart.forEach(it => {
      let modifiersPrice = 0;
      it.modifiers.forEach((m: any) => {
        modifiersPrice += m.price;
      });
      subtotal += (it.price + modifiersPrice) * it.quantity;
    });

    const surcharge = posFulfillmentType === "dine_in" ? 1.50 : 0;
    const deliveryFee = posFulfillmentType === "delivery" ? (parseFloat(posDeliveryCharge) || 0) : 0;
    const taxRate = posFulfillmentType === "dine_in" ? 0.10 : 0.05;
    const taxAmount = Number((subtotal * taxRate).toFixed(2));
    const totalAmount = subtotal + surcharge + deliveryFee + taxAmount;

    return {
      subtotal,
      surcharge,
      deliveryFee,
      taxAmount,
      totalAmount
    };
  };

  const handleCheckoutSubmit = async () => {
    if (posCart.length === 0) {
      alert("Cart is empty.");
      return;
    }

    if (posFulfillmentType === "dine_in" && !posSelectedTableId) {
      alert("Please select a table for Dine-In orders.");
      return;
    }

    if (posFulfillmentType === "takeaway" && (!posCustomerName.trim() || !posCustomerPhone.trim())) {
      alert("Please enter customer name and phone number for Takeaway orders.");
      return;
    }

    if (posFulfillmentType === "delivery" && (!posCustomerName.trim() || !posCustomerPhone.trim() || !posDeliveryRegion.trim() || !posDeliveryStreet.trim() || !posDeliveryBldgLandmark.trim() || !posDeliveryAptSuite.trim() || !posDeliveryFloor.trim() || !posDeliveryCharge.trim())) {
      alert("Please enter all required customer name, phone, region, street, building, apartment, floor, and delivery charge details for Delivery orders.");
      return;
    }

    const { subtotal, surcharge, deliveryFee, taxAmount, totalAmount } = getCartTotals();

    if (paymentMethod === "split") {
      const cashVal = parseFloat(splitCashAmount) || 0;
      const cardVal = parseFloat(splitCardAmount) || 0;
      if (Math.abs((cashVal + cardVal) - totalAmount) > 0.05) {
        alert(`Split Tender mismatch: Total tender ($${(cashVal + cardVal).toFixed(2)}) must equal order total ($${totalAmount.toFixed(2)}).`);
        return;
      }
    }

    const payload = {
      tableId: posFulfillmentType === "dine_in" ? posSelectedTableId : null,
      fulfillmentType: posFulfillmentType,
      orderSource: "pos" as const,
      shiftId: activeShift?.id,
      customerName: posFulfillmentType !== "dine_in" ? posCustomerName.trim() : null,
      customerPhone: posFulfillmentType !== "dine_in" ? posCustomerPhone.trim() : null,
      ...(posFulfillmentType === "delivery" && {
        delivery: {
          address: `${posDeliveryRegion}, ${posDeliveryStreet}, Bldg: ${posDeliveryBldgLandmark}, Apt: ${posDeliveryAptSuite}, Floor: ${posDeliveryFloor}`,
          deliveryFee: deliveryFee,
          region: posDeliveryRegion,
          street: posDeliveryStreet,
          lid: posDeliveryBldgLandmark,
          app: posDeliveryAptSuite,
          floor: posDeliveryFloor
        }
      }),
      items: posCart.map(it => ({
        id: it.menuItemId,
        name: it.name,
        price: it.price,
        quantity: it.quantity,
        course: it.course,
        fired: it.fired,
        modifiers: it.modifiers,
        notes: it.notes
      })),
      payment: {
        method: paymentMethod,
        subtotal,
        taxAmount,
        surcharge,
        discountAmount: 0,
        totalPaid: totalAmount,
        tipAmount: 0,
        ...(paymentMethod === "split" && {
          splits: [
            { method: "cash", amount: parseFloat(splitCashAmount) || 0 },
            { method: "card", amount: parseFloat(splitCardAmount) || 0 }
          ]
        })
      }
    };

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const orderData = await res.json();
        setCreatedReceipt(orderData);
        setCheckoutSucceeded(true);
        onRefreshOrders();
        onRefreshTables();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to complete POS order checkout.");
      }
    } catch (e) {
      console.error(e);
      alert("Checkout error occurred.");
    }
  };

  const handleResetPOS = () => {
    setPosCart([]);
    setPosSelectedTableId("");
    setPosFulfillmentType("dine_in");
    setPaymentMethod("cash");
    setSplitCashAmount("");
    setSplitCardAmount("");
    setCheckoutSucceeded(false);
    setCreatedReceipt(null);
    setShowPaymentModal(false);
    setWaiterSubTab("dispatcher");
    setPosCustomerName("");
    setPosCustomerPhone("");
    setPosDeliveryRegion("");
    setPosDeliveryStreet("");
    setPosDeliveryBldgLandmark("");
    setPosDeliveryAptSuite("");
    setPosDeliveryFloor("");
    setPosDeliveryCharge("5.00");
  };

  // Modal open states
  const [showOpenShiftModal, setShowOpenShiftModal] = useState(false);
  const [showCashMovementModal, setShowCashMovementModal] = useState(false);
  const [showRiderSettlementModal, setShowRiderSettlementModal] = useState(false);
  const [showCloseShiftModal, setShowCloseShiftModal] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  // Form states
  const [openCashierName, setOpenCashierName] = useState("");
  const [openFloat, setOpenFloat] = useState("150.00");
  const [openBranchId, setOpenBranchId] = useState(user?.branchId || "branch-a");
  const [openRegisterId, setOpenRegisterId] = useState("register_1");

  // Cashier list and PIN password states
  const [cashiersList, setCashiersList] = useState<any[]>([]);
  const [selectedCashierId, setSelectedCashierId] = useState("");
  const [cashierPinInput, setCashierPinInput] = useState("");

  const [movementType, setMovementType] = useState<"paid_in" | "paid_out" | "safe_drop" | "expense">("paid_in");
  const [movementCategory, setMovementCategory] = useState("Change");
  const [movementAmount, setMovementAmount] = useState("");
  const [movementReason, setMovementReason] = useState("");
  const [movementManagerPin, setMovementManagerPin] = useState("");

  const [riderNameSelect, setRiderNameSelect] = useState("");
  const [riderSettleAmount, setRiderSettleAmount] = useState("");

  const [declaredCountedCash, setDeclaredCountedCash] = useState("");
  const [closeManagerPin, setCloseManagerPin] = useState("");

  const fetchShifts = async () => {
    setLoadingShifts(true);
    try {
      const res = await fetch("/api/shifts");
      if (res.ok) {
        const data = await res.json();
        setShifts(data);
        // Find if there is an active open shift for the selected register/branch
        const active = data.find((s: any) => s.status === "open" && s.branchId === openBranchId && s.registerId === openRegisterId);
        setActiveShift(active || null);
      }
    } catch (err) {
      console.error("Failed to load shifts:", err);
    } finally {
      setLoadingShifts(false);
    }
  };

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const res = await fetch("/api/branches");
        if (res.ok) {
          const data = await res.json();
          setAvailableBranches(data);
        }
      } catch (err) {
        console.error("Failed to fetch branches:", err);
      }
    };
    fetchBranches();
  }, []);

  useEffect(() => {
    if (user?.branchId) {
      setOpenBranchId(user.branchId);
    }
  }, [user]);

  useEffect(() => {
    const currentBranch = availableBranches.find((b: any) => b.id === openBranchId);
    const regs = currentBranch?.registers || [];
    if (regs.length > 0) {
      if (!regs.some((r: any) => r.id === openRegisterId)) {
        setOpenRegisterId(regs[0].id);
      }
    }
  }, [openBranchId, availableBranches, openRegisterId]);

  useEffect(() => {
    fetchShifts();
  }, [openBranchId, openRegisterId]);

  useEffect(() => {
    const fetchCashiers = async () => {
      try {
        const res = await fetch("/api/staff");
        if (res.ok) {
          const data = await res.json();
          const branchCashiers = data.filter((s: any) => 
            s.branchId === openBranchId && 
            s.role === "cashier" && 
            s.status !== "terminated"
          );
          setCashiersList(branchCashiers);
          if (branchCashiers.length > 0) {
            setSelectedCashierId(branchCashiers[0].id);
            setOpenCashierName(branchCashiers[0].name);
          } else {
            setSelectedCashierId("");
            setOpenCashierName("");
          }
        }
      } catch (err) {
        console.error("Failed to load cashiers list:", err);
      }
    };
    fetchCashiers();
  }, [openBranchId]);

  // Handle open shift
  const handleOpenShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!openCashierName.trim()) {
      alert("Please select or enter Cashier Name.");
      return;
    }
    const floatNum = parseFloat(openFloat);
    if (isNaN(floatNum) || floatNum < 0) {
      alert("Please enter a valid starting float.");
      return;
    }

    try {
      const res = await fetch("/api/shifts/open", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          branchId: openBranchId,
          registerId: openRegisterId,
          cashierId: selectedCashierId,
          cashierName: openCashierName,
          pin: cashierPinInput,
          openingFloat: floatNum,
        }),
      });

      if (res.ok) {
        alert("Shift Session opened and POS unlocked!");
        setShowOpenShiftModal(false);
        setCashierPinInput("");
        fetchShifts();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to open shift.");
      }
    } catch (err) {
      console.error(err);
      alert("Network error opening shift.");
    }
  };

  // Handle cash movement
  const handleRecordMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeShift) return;

    const amountNum = parseFloat(movementAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      alert("Please enter a valid amount.");
      return;
    }

    // Require manager approval for paid-outs or expenses > $50
    if ((movementType === "paid_out" || movementType === "expense") && amountNum > 50) {
      if (!movementManagerPin) {
        alert("Manager approval required for petty cash expenditures exceeding $50.00.");
        return;
      }
    }

    try {
      const res = await fetch(`/api/shifts/${activeShift.id}/movements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: movementType,
          category: movementCategory,
          amount: amountNum,
          reason: movementReason,
          managerPin: movementManagerPin,
        }),
      });

      if (res.ok) {
        alert("Cash movement recorded successfully!");
        setShowCashMovementModal(false);
        setMovementAmount("");
        setMovementReason("");
        setMovementManagerPin("");
        fetchShifts();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to record cash movement.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handle rider settlement
  const handleRecordRiderSettlement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeShift) return;

    if (!riderNameSelect.trim()) {
      alert("Please enter or select a rider name.");
      return;
    }

    const amountNum = parseFloat(riderSettleAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      alert("Please enter a valid amount.");
      return;
    }

    try {
      const res = await fetch(`/api/shifts/${activeShift.id}/rider-settlements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          riderName: riderNameSelect,
          settledAmount: amountNum,
        }),
      });

      if (res.ok) {
        alert("Rider cash settlement recorded successfully!");
        setShowRiderSettlementModal(false);
        setRiderNameSelect("");
        setRiderSettleAmount("");
        fetchShifts();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to record rider settlement.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handle close shift
  const handleCloseShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeShift) return;

    const declaredNum = parseFloat(declaredCountedCash);
    if (isNaN(declaredNum) || declaredNum < 0) {
      alert("Please enter a valid physically counted cash amount.");
      return;
    }

    // Check expected cash to calculate variance
    const stats = activeShift.liveStats || { cashSummary: { expectedInDrawer: activeShift.openingFloat } };
    const expected = stats.cashSummary.expectedInDrawer;
    const variance = declaredNum - expected;

    // Variance threshold rule: if variance > $5, require manager pin
    if (Math.abs(variance) > 5.00) {
      if (!closeManagerPin) {
        alert(`Discrepancy variance ($${variance.toFixed(2)}) exceeds standard allowable threshold of $5.00. Manager PIN verification is required.`);
        return;
      }
    }

    try {
      const res = await fetch(`/api/shifts/${activeShift.id}/close`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          declaredCash: declaredNum,
          managerPin: closeManagerPin,
        }),
      });

      if (res.ok) {
        alert("Shift closed successfully! Till is locked.");
        setShowCloseShiftModal(false);
        setDeclaredCountedCash("");
        setCloseManagerPin("");
        fetchShifts();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to close shift.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Move order step-wise
  const handleUpdateOrderStatus = async (orderId: string, nextStatus: OrderStatus) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          status: nextStatus,
          branchId: openBranchId,
          registerId: openRegisterId
        }),
      });

      if (res.ok) {
        onRefreshOrders();
        onRefreshTables();
        fetchShifts(); // refresh live shift stats
      }
    } catch (err) {
      console.error("Failed to transition order status:", err);
    }
  };

  // Modify manual table status
  const handleUpdateTableStatus = async (tableId: string, status: TableStatus) => {
    try {
      const res = await fetch(`/api/tables/${tableId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        onRefreshTables();
      }
    } catch (err) {
      console.error("Failed to update table status:", err);
    }
  };

  // Fire specific course
  const handleFireCourse = async (orderId: string, course: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/fire-course`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ course }),
      });
      if (res.ok) {
        onRefreshOrders();
      }
    } catch (err) {
      console.error("Failed to fire course:", err);
    }
  };

  // Manager Void Trigger
  const handleVoidOrder = async (orderId: string, reason: string, pin: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/void`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason, managerPin: pin, managerApproved: true }),
      });
      if (res.ok) {
        onRefreshOrders();
        onRefreshTables();
      } else {
        let errMsg = "Failed to void order.";
        try {
          const errData = await res.json();
          errMsg = errData.error || errMsg;
        } catch {
          errMsg = `Server error (Status ${res.status}): Failed to void order.`;
        }
        alert(errMsg);
      }
    } catch (err) {
      console.error("Failed to void order:", err);
      alert("A network error occurred. Failed to void order.");
    }
  };

  // Comprehensive live filtering computation
  const filteredOrders = orders.filter((o) => {
    // Force branch / shift isolation
    if (activeShift) {
      if (o.shiftId !== activeShift.id) {
        // If it belongs to a different shift, or is not of the current branch, filter it out
        if (o.shiftId || o.branchId !== openBranchId) return false;
      }
    } else {
      if (o.branchId !== openBranchId) return false;
      // Exclude pre-seeded mock/simulation orders from standard queues if no shift
      if (o.id.startsWith("ord-initial-")) return false;
    }

    // 1. Fulfillment Type or Channel Source Filter
    if (filterFulfillmentSource !== "all") {
      if (filterFulfillmentSource === "dine_in") {
        if (o.fulfillmentType !== "dine_in") return false;
      } else if (filterFulfillmentSource === "takeaway") {
        if (o.fulfillmentType !== "takeaway") return false;
      } else if (filterFulfillmentSource === "delivery") {
        if (o.fulfillmentType !== "delivery") return false;
      } else if (filterFulfillmentSource === "talabat") {
        if (o.orderSource !== "aggregator:talabat") return false;
      } else if (filterFulfillmentSource === "pos") {
        if (o.orderSource !== "pos") return false;
      } else if (filterFulfillmentSource === "web") {
        if (o.orderSource !== "web") return false;
      } else if (filterFulfillmentSource === "app") {
        if (o.orderSource !== "app") return false;
      } else if (filterFulfillmentSource === "kiosk") {
        if (o.orderSource !== "kiosk") return false;
      }
    }

    // 2. Payment Method Filter
    if (filterPaymentMethod !== "all") {
      if (!o.payment || o.payment.method !== filterPaymentMethod) return false;
    }

    // 3. Order Status Filter
    if (filterOrderStatus !== "all") {
      if (o.status !== filterOrderStatus) return false;
    }

    return true;
  });

  const isAnyFilterActive = 
    filterFulfillmentSource !== "all" || 
    filterPaymentMethod !== "all" || 
    filterOrderStatus !== "all";

  // Filters for active orders mapping to new schema
  const activeOrders = orders.filter((o) => {
    if (o.status === "paid" || o.status === "completed" || o.status === "voided") return false;
    if (activeShift) {
      return o.shiftId === activeShift.id || (!o.shiftId && o.branchId === openBranchId);
    }
    return o.branchId === openBranchId && !o.id.startsWith("ord-initial-");
  });

  const kitchenOrders = orders.filter((o) => {
    if (o.status !== "placed" && o.status !== "confirmed" && o.status !== "preparing") return false;
    if (activeShift) {
      return o.shiftId === activeShift.id || (!o.shiftId && o.branchId === openBranchId);
    }
    return o.branchId === openBranchId && !o.id.startsWith("ord-initial-");
  });

  const waiterServiceOrders = orders.filter((o) => {
    const isWaiterServiceStatus = 
      o.status === "ready_for_rider" || 
      o.status === "rider_assigned" || 
      o.status === "picked_up" || 
      o.status === "delivered";
    if (!isWaiterServiceStatus) return false;
    if (activeShift) {
      return o.shiftId === activeShift.id || (!o.shiftId && o.branchId === openBranchId);
    }
    return o.branchId === openBranchId && !o.id.startsWith("ord-initial-");
  });

  return (
    <div className="space-y-8 animate-fade-in text-slate-800" id="staff-portal-shell">
      
      {/* Role switch header panel */}
      <div className="bg-surface-base p-5 rounded-2xl border border-border-primary shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="text-xl font-bold text-content-primary tracking-tight">Staff Service Terminal</h2>
            <DepartmentGuide department={staffRole === "waiter" ? "staff-waiter" : "staff-kitchen"} buttonSize="xs" buttonVariant="pill" />
          </div>
          <p className="text-xs text-content-secondary font-medium">Live POS dispatcher mapping. Toggle perspectives to direct restaurant floor operations.</p>
        </div>

        <div className="flex bg-slate-100 p-1.5 rounded-xl border border-border-primary">
          <button
            onClick={() => setStaffRole("waiter")}
            className={`px-4 py-2 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${staffRole === "waiter" ? "bg-surface-base text-content-primary shadow-xs" : "text-slate-500 hover:text-slate-800"}`}
          >
            <Users className="w-3.5 h-3.5" />
            Host / Floor Waiter
          </button>
          <button
            onClick={() => setStaffRole("kitchen")}
            className={`px-4 py-2 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${staffRole === "kitchen" ? "bg-surface-base text-content-primary shadow-xs" : "text-slate-500 hover:text-slate-800"}`}
          >
            <ChefHat className="w-3.5 h-3.5" />
            Kitchen Chef
          </button>
        </div>
      </div>

      {/* Active Shift Session Control Bar (only for waiter role) */}
      {staffRole === "waiter" && activeShift && (
        <div className="bg-slate-900 text-white rounded-2xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border border-slate-800 shadow-lg animate-fade-in" id="active-shift-bar">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl shrink-0">
              <Clock className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xxs font-black bg-emerald-500 text-white px-2 py-0.5 rounded-md uppercase tracking-wider">ACTIVE SHIFT SESSION #{activeShift.shiftNumber}</span>
                <span className="text-xs text-slate-400 font-mono">ID: {activeShift.id}</span>
              </div>
              <p className="text-sm font-bold mt-1">
                Cashier: <span className="text-emerald-300 font-extrabold">{activeShift.cashierName}</span> · Station: {activeShift.registerName}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            <button
              onClick={() => {
                setMovementType("paid_in");
                setMovementCategory("Change Float");
                setShowCashMovementModal(true);
              }}
              className="flex-1 md:flex-initial px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white border border-slate-750 font-bold rounded-xl text-xxs transition-all flex items-center justify-center gap-1 cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5 text-indigo-400" />
              Cash In/Out
            </button>
            <button
              onClick={() => {
                setShowRiderSettlementModal(true);
              }}
              className="flex-1 md:flex-initial px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white border border-slate-750 font-bold rounded-xl text-xxs transition-all flex items-center justify-center gap-1 cursor-pointer"
            >
              <Truck className="w-3.5 h-3.5 text-blue-400" />
              Rider Settle
            </button>
            <button
              onClick={() => {
                setShowCloseShiftModal(true);
              }}
              className="flex-1 md:flex-initial px-3.5 py-2 bg-emerald-600 hover:bg-emerald-505 text-white font-bold rounded-xl text-xxs transition-all flex items-center justify-center gap-1 cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              Lock & Close Till
            </button>
          </div>
        </div>
      )}

      {staffRole === "waiter" && !activeShift ? (
        <div className="bg-white rounded-3xl border border-slate-100 p-8 md:p-12 text-center max-w-xl mx-auto shadow-sm space-y-6 animate-fade-in" id="waiter-lockout-panel">
          <div className="w-16 h-16 bg-red-50 text-red-600 border border-red-100 rounded-full flex items-center justify-center mx-auto animate-bounce">
            <Lock className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-slate-900 tracking-tight font-display">Waiter Terminal Locked</h3>
            <p className="text-xs text-slate-400 max-w-[360px] mx-auto mt-1.5 leading-relaxed font-sans">
              A gapless cashier shift session must be opened and initialized before you can view guest tables or place orders.
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl grid grid-cols-2 gap-4 text-xs text-slate-600 max-w-sm mx-auto text-left">
            <div>
              <span className="text-[10px] text-slate-400 font-bold block mb-1 uppercase">CURRENT OUTLET</span>
              <select
                value={openBranchId}
                onChange={(e) => setOpenBranchId(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl p-2 font-bold text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 cursor-pointer"
              >
                {availableBranches.length > 0 ? (
                  availableBranches.map((b: any) => (
                    <option key={b.id} value={b.id}>{b.nameAr || b.name}</option>
                  ))
                ) : (
                  <>
                    <option value="branch-a">Maadi Branch (فرع المعادي)</option>
                    <option value="branch-b">Heliopolis Branch (فرع مصر الجديدة)</option>
                    <option value="main">Main Branch (الفرع الرئيسي)</option>
                  </>
                )}
              </select>
            </div>
            <div className="border-l border-slate-200 pl-4">
              <span className="text-[10px] text-slate-400 font-bold block mb-1 uppercase">REGISTER ID</span>
              <select
                value={openRegisterId}
                onChange={(e) => setOpenRegisterId(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl p-2 font-bold text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 cursor-pointer animate-fade-in"
              >
                {(() => {
                  const currentBranch = availableBranches.find((b: any) => b.id === openBranchId);
                  const regs = currentBranch?.registers || [
                    { id: "register_1", name: "Register 1 (POS)", nameAr: "جهاز كاشير 1" },
                    { id: "register_2", name: "Register 2 (POS)", nameAr: "جهاز كاشير 2" },
                    { id: "register_3", name: "Register 3 (POS)", nameAr: "جهاز كاشير 3" }
                  ];
                  return regs.map((r: any) => (
                    <option key={r.id} value={r.id}>{r.nameAr || r.name}</option>
                  ));
                })()}
              </select>
            </div>
          </div>

          <form onSubmit={handleOpenShift} className="max-w-sm mx-auto space-y-4 text-left">
            <div>
              <label className="block text-xxs font-bold text-slate-400 uppercase tracking-wider mb-1">Select Cashier (اختر موظف الكاشير)</label>
              {cashiersList.length > 0 ? (
                <select
                  required
                  value={selectedCashierId}
                  onChange={(e) => {
                    const cId = e.target.value;
                    setSelectedCashierId(cId);
                    const matched = cashiersList.find((x: any) => x.id === cId);
                    if (matched) {
                      setOpenCashierName(matched.name);
                    }
                  }}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-indigo-500 text-slate-800 font-bold cursor-pointer"
                >
                  {cashiersList.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              ) : (
                <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-[11px] text-red-600 font-medium">
                  ⚠️ لا يوجد موظفي كاشير مسجلين لهذا الفرع حالياً. برجاء من مدير المنصة إنشاء حسابات كاشير أولاً من لوحة تحكم الفروع.
                </div>
              )}
            </div>

            {cashiersList.length > 0 && (
              <div>
                <label className="block text-xxs font-bold text-slate-400 uppercase tracking-wider mb-1">Cashier Password / PIN (كلمة المرور)</label>
                <input
                  type="password"
                  required
                  value={cashierPinInput}
                  onChange={(e) => setCashierPinInput(e.target.value)}
                  placeholder="Enter PIN (e.g., 1234)"
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-indigo-500 font-mono text-slate-800"
                />
              </div>
            )}

            <div>
              <label className="block text-xxs font-bold text-slate-400 uppercase tracking-wider mb-1">Starting Drawer Float ($)</label>
              <input
                type="number"
                step="0.01"
                required
                value={openFloat}
                onChange={(e) => setOpenFloat(e.target.value)}
                placeholder="150.00"
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-indigo-500 font-mono text-slate-800"
              />
            </div>
            <button
              type="submit"
              disabled={cashiersList.length === 0}
              className={`w-full py-2.5 text-white font-bold rounded-xl text-xs transition-all shadow-xs flex items-center justify-center gap-1.5 font-sans cursor-pointer ${cashiersList.length === 0 ? "bg-slate-300 cursor-not-allowed" : "bg-indigo-650 hover:bg-indigo-600"}`}
            >
              <Lock className="w-3.5 h-3.5" />
              Open Session & Unlock POS
            </button>
          </form>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Sub-tab selection for Floor Waiter */}
          {staffRole === "waiter" && activeShift && (
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/60 max-w-sm animate-fade-in gap-1 shadow-xxs">
              <button
                type="button"
                onClick={() => setWaiterSubTab("dispatcher")}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${waiterSubTab === "dispatcher" ? "bg-white text-indigo-700 shadow-xs border border-slate-100" : "text-slate-500 hover:text-slate-800"}`}
              >
                <Bell className="w-3.5 h-3.5" />
                Seating & Boards
              </button>
              <button
                type="button"
                onClick={() => setWaiterSubTab("pos")}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${waiterSubTab === "pos" ? "bg-white text-indigo-700 shadow-xs border border-slate-100" : "text-slate-500 hover:text-slate-800"}`}
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                POS Order Intake {saasTier < 2 && <Lock className="w-3 h-3 text-slate-450 shrink-0" />}
              </button>
            </div>
          )}

          {(staffRole === "kitchen" || waiterSubTab === "dispatcher") ? (
            /* Grid divisions */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column (Main dispatcher queue based on role) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Comprehensive Order Filter Console */}
          <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-md space-y-4 animate-fade-in" id="order-filters-panel">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-400" />
                <h3 className="text-xs font-bold tracking-tight uppercase tracking-wider">Comprehensive Order Filter Console</h3>
              </div>
              {isAnyFilterActive && (
                <button
                  type="button"
                  onClick={() => {
                    setFilterFulfillmentSource("all");
                    setFilterPaymentMethod("all");
                    setFilterOrderStatus("all");
                  }}
                  className="text-xxs font-bold text-red-400 hover:text-red-300 underline cursor-pointer"
                >
                  Clear Filters
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Filter 1: Fulfillment / Source */}
              <div className="space-y-1">
                <label className="block text-[9px] uppercase text-slate-400 font-bold tracking-wider">Fulfillment & Source</label>
                <select
                  value={filterFulfillmentSource}
                  onChange={(e) => setFilterFulfillmentSource(e.target.value)}
                  className="bg-slate-800 border border-slate-700 text-slate-100 text-xxs px-2.5 py-2 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-500 w-full font-bold cursor-pointer"
                >
                  <option value="all">All Fulfillment & Sources</option>
                  <option value="dine_in">🍽️ Dine-In</option>
                  <option value="takeaway">🛍️ Takeaway</option>
                  <option value="delivery">📦 Delivery</option>
                  <option value="talabat">🛵 talabat API (Talaat)</option>
                  <option value="pos">🖥️ POS Order Intake</option>
                  <option value="web">🌐 Web Channel</option>
                  <option value="app">📱 Mobile App</option>
                  <option value="kiosk">📟 Kiosk Terminal</option>
                </select>
              </div>

              {/* Filter 2: Payment Method */}
              <div className="space-y-1">
                <label className="block text-[9px] uppercase text-slate-400 font-bold tracking-wider">Payment Method</label>
                <select
                  value={filterPaymentMethod}
                  onChange={(e) => setFilterPaymentMethod(e.target.value)}
                  className="bg-slate-800 border border-slate-700 text-slate-100 text-xxs px-2.5 py-2 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-500 w-full font-bold cursor-pointer"
                >
                  <option value="all">All Payment Methods</option>
                  <option value="cash">💵 Cash Tender</option>
                  <option value="card">💳 Credit/Debit Card</option>
                  <option value="split">🥞 Split Tender</option>
                  <option value="loyalty">🎁 Loyalty Points</option>
                </select>
              </div>

              {/* Filter 3: Order Status */}
              <div className="space-y-1">
                <label className="block text-[9px] uppercase text-slate-400 font-bold tracking-wider">Order Status</label>
                <select
                  value={filterOrderStatus}
                  onChange={(e) => setFilterOrderStatus(e.target.value)}
                  className="bg-slate-800 border border-slate-700 text-slate-100 text-xxs px-2.5 py-2 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-500 w-full font-bold cursor-pointer"
                >
                  <option value="all">All Statuses</option>
                  <option value="placed">Placed (New)</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="preparing">Preparing</option>
                  <option value="ready_for_rider">Ready for Rider</option>
                  <option value="rider_assigned">Rider Assigned</option>
                  <option value="picked_up">Picked Up</option>
                  <option value="delivered">Delivered</option>
                  <option value="paid">Paid</option>
                  <option value="completed">Completed</option>
                  <option value="voided">Voided</option>
                </select>
              </div>
            </div>

            {isAnyFilterActive && (
              <div className="text-[10px] bg-indigo-950/45 text-indigo-300 px-3 py-1.5 rounded-lg font-semibold flex justify-between items-center">
                <span>Active filters matched <span className="font-bold text-white bg-indigo-600 px-1.5 py-0.5 rounded">{filteredOrders.length}</span> order(s)</span>
                <span className="text-[8px] bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-sm font-black uppercase">Filter Mode Active</span>
              </div>
            )}
          </div>

          {/* Conditional Orders Listing */}
          {isAnyFilterActive ? (
            /* FILTERED RESULTS QUEUE */
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-indigo-50/50 p-2.5 rounded-xl border border-indigo-100">
                <h3 className="text-xs font-bold text-indigo-900 tracking-tight flex items-center gap-2 uppercase">
                  <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                  Filtered Search Matches ({filteredOrders.length})
                </h3>
                <button
                  onClick={() => { onRefreshOrders(); onRefreshTables(); }}
                  className="px-3 py-1 bg-white hover:bg-slate-50 text-indigo-700 rounded-lg border border-indigo-150 text-xxs font-bold cursor-pointer"
                >
                  Refresh Queue
                </button>
              </div>

              {filteredOrders.length === 0 ? (
                <div className="bg-white p-16 text-center border border-dashed border-slate-200 rounded-2xl">
                  <Sliders className="w-12 h-12 text-slate-300 stroke-1 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-400">No matching orders found.</p>
                  <p className="text-xxs text-slate-400 max-w-[240px] mx-auto mt-1">Try expanding or resetting your filter console selections.</p>
                </div>
              ) : (
                filteredOrders.map((ord) => {
                  const isKitchenOrd = ord.status === "placed" || ord.status === "confirmed" || ord.status === "preparing";
                  const isServiceOrd = ord.status === "ready_for_rider" || ord.status === "rider_assigned" || ord.status === "picked_up" || ord.status === "delivered";
                  const isTerminalOrd = ord.status === "paid" || ord.status === "completed" || ord.status === "voided";

                  let cardBorderColor = "border-slate-150";
                  let cardStripColor = "bg-slate-400";
                  if (isKitchenOrd) {
                    cardBorderColor = "border-orange-150";
                    cardStripColor = "bg-orange-400";
                  } else if (isServiceOrd) {
                    cardBorderColor = "border-indigo-150";
                    cardStripColor = "bg-indigo-500";
                  } else if (ord.status === "paid" || ord.status === "completed") {
                    cardBorderColor = "border-emerald-150";
                    cardStripColor = "bg-emerald-500";
                  } else if (ord.status === "voided") {
                    cardBorderColor = "border-rose-150";
                    cardStripColor = "bg-rose-500";
                  }

                  return (
                    <div key={ord.id} className={`bg-white border ${cardBorderColor} rounded-2xl hover:border-slate-300 transition-all shadow-xs p-6 flex flex-col justify-between gap-5 relative overflow-hidden`}>
                      <div className={`absolute top-0 left-0 bottom-0 w-1.5 ${cardStripColor}`}></div>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className={`text-xxs font-mono font-bold px-2 py-0.5 rounded-sm uppercase ${
                                isKitchenOrd ? "bg-orange-50 text-orange-600" :
                                isServiceOrd ? "bg-indigo-50 text-indigo-700" :
                                ord.status === "voided" ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"
                              }`}>
                                {ord.status.replace(/_/g, " ")}
                              </span>
                              <span className="text-xxs font-mono font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-sm uppercase flex items-center gap-1">
                                {ord.fulfillmentType === "dine_in" && <UtensilsCrossed className="w-2.5 h-2.5" />}
                                {ord.fulfillmentType === "takeaway" && <ShoppingBag className="w-2.5 h-2.5" />}
                                {ord.fulfillmentType === "delivery" && <Truck className="w-2.5 h-2.5" />}
                                {ord.fulfillmentType}
                              </span>
                              <span className="text-xxs font-mono font-bold bg-indigo-50 text-indigo-650 px-1.5 py-0.2 rounded-sm uppercase">
                                Source: {ord.orderSource}
                              </span>
                              {ord.payment?.method && (
                                <span className="text-xxs font-mono font-bold bg-emerald-50 text-emerald-700 px-1.5 py-0.2 rounded-sm uppercase">
                                  Pay: {ord.payment.method}
                                </span>
                              )}
                            </div>
                            
                            <h4 className="text-md font-bold text-slate-900 mt-1.5">
                              Receipt ID: #{ord.id.slice(-6)} · {ord.tableName || "Dispatch Portal"}
                            </h4>
                            
                            {(ord.customerName || ord.customerPhone) && (
                              <p className="text-xxs font-semibold text-slate-700 bg-slate-50 px-2 py-1 rounded-md inline-block mt-1 border border-slate-150">
                                Cust: <span className="font-bold">{ord.customerName || "N/A"}</span> · Tel: <span className="font-mono">{ord.customerPhone || "N/A"}</span>
                              </p>
                            )}
                            
                            <p className="text-xxs text-slate-400 mt-1">
                              Ordered {Math.round((Date.now() - new Date(ord.placedAt).getTime()) / 60000)} minutes ago
                            </p>
                          </div>

                          <div className="text-right">
                            <span className="text-xs font-mono font-bold text-slate-700 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100 block">${ord.totalAmount.toFixed(2)}</span>
                          </div>
                        </div>

                        {/* Delivery Info */}
                        {ord.fulfillmentType === "delivery" && ord.delivery && (
                          <div className="p-3 bg-slate-50 rounded-xl border border-slate-150 text-xxs space-y-1">
                            <p className="font-bold text-slate-800 flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-indigo-600" /> Destination Address
                            </p>
                            <p className="text-slate-600 italic">"{ord.delivery.address}"</p>
                            {ord.delivery.region && (
                              <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500 font-semibold bg-white p-2 rounded-lg border border-slate-100 mt-1.5">
                                <div>Region: <span className="text-slate-800 font-bold">{ord.delivery.region}</span></div>
                                <div>Street: <span className="text-slate-800 font-bold">{ord.delivery.street}</span></div>
                                <div>Bldg/Lid: <span className="text-slate-800 font-bold">{ord.delivery.lid}</span></div>
                                <div>Apt/App: <span className="text-slate-800 font-bold">{ord.delivery.app}</span></div>
                                <div className="col-span-2">Floor: <span className="text-slate-800 font-bold">{ord.delivery.floor}</span></div>
                              </div>
                            )}
                            <p className="text-slate-400 font-mono font-bold pt-1">
                              Distance: {ord.delivery.distanceKm} km · Delivery Surcharge: ${ord.delivery.deliveryFee.toFixed(2)}
                            </p>
                            {ord.delivery.riderName && (
                              <p className="text-indigo-600 font-semibold mt-1">
                                Assigned Rider: {ord.delivery.riderName} ({ord.delivery.riderPhone || "App Link"})
                              </p>
                            )}
                          </div>
                        )}

                        {/* Voided Details */}
                        {ord.status === "voided" && ord.voidReason && (
                          <div className="p-2.5 bg-red-50 border border-red-100 rounded-lg text-xxs text-red-700 font-semibold">
                            ⚠️ Void Reason: <span className="italic">"{ord.voidReason}"</span>
                          </div>
                        )}

                        {/* SLA Warning */}
                        {isKitchenOrd && Math.round((Date.now() - new Date(ord.placedAt).getTime()) / 60000) > 15 && ord.status !== "preparing" && (
                          <div className="p-2 bg-rose-50 border border-rose-100 rounded-lg text-xxs text-rose-700 flex items-center gap-1.5 font-semibold">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            Order exceeding SLA target of 15 minutes! Flagged for priority prep.
                          </div>
                        )}

                        {/* Items details */}
                        <div className="space-y-1.5 pt-2">
                          {ord.items.map((it, idx) => (
                            <div key={idx} className="flex flex-col text-xs border-b border-dashed border-slate-100 pb-2">
                              <div className="flex justify-between items-center font-semibold text-slate-700">
                                <span>{it.name} <span className="text-slate-400">x{it.quantity}</span></span>
                                <span className="text-slate-500 font-mono">${(it.price * it.quantity).toFixed(2)}</span>
                              </div>
                              {it.modifiers && it.modifiers.length > 0 && (
                                <div className="pl-3 mt-1 space-y-0.5 text-xxs text-slate-400">
                                  {it.modifiers.map((m, mIdx) => (
                                    <p key={mIdx}>+ {m.groupName}: {m.optionName}</p>
                                  ))}
                                </div>
                              )}
                              {isKitchenOrd && !it.fired && (
                                <button
                                  onClick={() => handleFireCourse(ord.id, it.course)}
                                  className="w-fit mt-1.5 px-3 py-1 bg-yellow-500 hover:bg-yellow-600 text-white rounded text-[9px] font-bold flex items-center gap-1 uppercase transition-all"
                                >
                                  <Flame className="w-2.5 h-2.5" /> Fire {it.course} Now
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Card Actions Footer */}
                      <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                        <div className="flex items-center gap-1.5 text-xxs text-slate-400 font-mono">
                          <Clock className="w-3.5 h-3.5" /> Placed {Math.round((Date.now() - new Date(ord.placedAt).getTime()) / 60000)}m ago
                        </div>

                        <div className="flex gap-2">
                          {isKitchenOrd && (
                            <>
                              {voidingOrderId === ord.id ? (
                                <div className="flex flex-col gap-1.5 bg-red-50/50 p-2 border border-red-200 rounded-lg text-left">
                                  <input
                                    type="text"
                                    placeholder="Reason for voiding..."
                                    value={voidReason}
                                    onChange={(e) => setVoidReason(e.target.value)}
                                    className="px-2 py-1 bg-white border border-red-350 rounded text-xxs font-semibold text-slate-800 focus:outline-hidden"
                                    style={{ minWidth: "150px" }}
                                  />
                                  <input
                                    type="password"
                                    placeholder="Manager PIN..."
                                    value={voidPin}
                                    onChange={(e) => setVoidPin(e.target.value)}
                                    className="px-2 py-1 bg-white border border-red-350 rounded text-xxs font-semibold text-slate-800 focus:outline-hidden"
                                    style={{ minWidth: "150px" }}
                                  />
                                  <div className="flex gap-1.5">
                                    <button
                                      onClick={() => {
                                        if (voidReason.trim() && voidPin.trim()) {
                                          handleVoidOrder(ord.id, voidReason, voidPin);
                                          setVoidingOrderId(null);
                                          setVoidReason("");
                                          setVoidPin("");
                                        } else {
                                          alert("Both reason and manager PIN are required to void an order.");
                                        }
                                      }}
                                      className="px-2 py-0.5 bg-red-600 text-white rounded text-[9px] font-bold hover:bg-red-700 cursor-pointer"
                                    >
                                      Void
                                    </button>
                                    <button
                                      onClick={() => {
                                        setVoidingOrderId(null);
                                        setVoidReason("");
                                        setVoidPin("");
                                      }}
                                      className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded text-[9px] font-semibold hover:bg-slate-300 cursor-pointer"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <button
                                  onClick={() => {
                                    setVoidingOrderId(ord.id);
                                    setVoidReason("");
                                  }}
                                  className="p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 border border-slate-150 transition-colors flex items-center gap-1 text-xxs font-semibold font-bold"
                                >
                                  <Trash2 className="w-3.5 h-3.5" /> Void Order
                                </button>
                              )}

                              {ord.status === "placed" && (
                                <button
                                  onClick={() => handleUpdateOrderStatus(ord.id, "confirmed")}
                                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs transition-colors shadow-xs"
                                >
                                  Confirm / Accept Order
                                </button>
                              )}
                              {(ord.status === "placed" || ord.status === "confirmed") && (
                                <button
                                  onClick={() => handleUpdateOrderStatus(ord.id, "preparing")}
                                  className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg text-xs transition-colors shadow-xs"
                                >
                                  Start Cooking
                                </button>
                              )}
                              {ord.status === "preparing" && (
                                <button
                                  onClick={() => handleUpdateOrderStatus(ord.id, "ready_for_rider")}
                                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs transition-colors shadow-xs"
                                >
                                  Mark Cooked & Pack
                                </button>
                              )}
                            </>
                          )}

                          {isServiceOrd && (
                            <>
                              {ord.fulfillmentType === "delivery" && ord.status === "ready_for_rider" && (
                                <button
                                  onClick={() => handleUpdateOrderStatus(ord.id, "rider_assigned")}
                                  className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg text-xs transition-all flex items-center gap-1.5"
                                >
                                  Assign Rider SLA
                                </button>
                              )}
                              {ord.fulfillmentType === "delivery" && ord.status === "rider_assigned" && (
                                <button
                                  onClick={() => handleUpdateOrderStatus(ord.id, "picked_up")}
                                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs transition-all flex items-center gap-1.5"
                                >
                                  Handoff to Rider
                                </button>
                              )}
                              {ord.fulfillmentType === "delivery" && ord.status === "picked_up" && (
                                <button
                                  onClick={() => handleUpdateOrderStatus(ord.id, "delivered")}
                                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition-all flex items-center gap-1.5"
                                >
                                  Mark Delivered
                                </button>
                              )}
                              {ord.status === "ready_for_rider" && ord.fulfillmentType !== "delivery" && (
                                <button
                                  onClick={() => handleUpdateOrderStatus(ord.id, "delivered")}
                                  className="px-5 py-2 bg-indigo-650 hover:bg-indigo-600 text-white font-bold rounded-lg text-xs transition-colors shadow-xs flex items-center gap-1.5"
                                >
                                  Handoff to Guest / Table
                                  <ChevronRight className="w-4 h-4" />
                                </button>
                              )}
                              {ord.status === "delivered" && (
                                <button
                                  onClick={() => handleUpdateOrderStatus(ord.id, "paid")}
                                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs transition-colors shadow-xs flex items-center gap-1.5"
                                >
                                  <DollarSign className="w-3.5 h-3.5" />
                                  Close Bill / Free Table
                                </button>
                              )}
                            </>
                          )}

                          {isTerminalOrd && (
                            <div className="text-[10px] bg-slate-100 text-slate-500 font-bold px-2.5 py-1.5 rounded-lg border border-slate-200 font-mono">
                              Archived Receipt Record
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            /* STANDARD ROLE-BASED ACTIVE QUEUE SCREENS */
            <>
              <div className="flex justify-between items-center bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
                <h3 className="text-md font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  {staffRole === "kitchen" ? (
                    <>
                      <ChefHat className="w-4.5 h-4.5 text-orange-500 animate-pulse" />
                      Active Cooking Prep Queue ({kitchenOrders.length})
                    </>
                  ) : (
                    <>
                      <Bell className="w-4.5 h-4.5 text-indigo-650 animate-bounce" />
                      Plated Service Delivery Board ({waiterServiceOrders.length})
                    </>
                  )}
                </h3>

                <div className="flex gap-2">
                  <button 
                    onClick={() => { onRefreshOrders(); onRefreshTables(); }}
                    className="px-3 py-1 bg-white hover:bg-slate-50 text-slate-600 rounded-lg border border-slate-150 text-xxs font-semibold cursor-pointer"
                  >
                    Refresh Queue
                  </button>
                </div>
              </div>

              {/* Orders timeline Cards */}
              <div className="space-y-4">
                {staffRole === "kitchen" ? (
                  // Kitchen Orders Queue
                  kitchenOrders.length === 0 ? (
                    <div className="bg-white p-16 text-center border border-dashed border-slate-200 rounded-2xl">
                      <ChefHat className="w-12 h-12 text-slate-300 stroke-1 mx-auto mb-2" />
                      <p className="text-xs font-bold text-slate-400">Plates are Clean! No orders in prep.</p>
                      <p className="text-xxs text-slate-400 max-w-[240px] mx-auto mt-1">New guest purchases or delivery aggregators will show up instantly.</p>
                    </div>
                  ) : (
                    kitchenOrders.map((ord) => (
                      <div key={ord.id} className="bg-white border border-slate-150 rounded-2xl hover:border-slate-300 transition-all shadow-xs p-6 flex flex-col justify-between gap-5 relative overflow-hidden">
                        <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-orange-400"></div>
                        <div className="space-y-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-xxs font-mono font-bold bg-orange-50 text-orange-600 px-2 py-0.5 rounded-sm uppercase">{ord.status}</span>
                                <span className="text-xxs font-mono font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-sm uppercase flex items-center gap-1">
                                  {ord.fulfillmentType === "dine_in" && <UtensilsCrossed className="w-2.5 h-2.5" />}
                                  {ord.fulfillmentType === "takeaway" && <ShoppingBag className="w-2.5 h-2.5" />}
                                  {ord.fulfillmentType === "delivery" && <Truck className="w-2.5 h-2.5" />}
                                  {ord.fulfillmentType}
                                </span>
                                <span className="text-xxs font-mono font-bold bg-indigo-50 text-indigo-600 px-1.5 py-0.2 rounded-sm uppercase">
                                  Source: {ord.orderSource}
                                </span>
                              </div>
                              <h4 className="text-md font-bold text-slate-900 mt-1.5">
                                Receipt ID: #{ord.id.slice(-6)} · {ord.tableName || "Dispatch Portal"}
                              </h4>
                              {(ord.customerName || ord.customerPhone) && (
                                <p className="text-xxs font-semibold text-slate-700 bg-slate-50 px-2 py-1 rounded-md inline-block mt-1 border border-slate-150">
                                  Cust: <span className="font-bold">{ord.customerName || "N/A"}</span> · Tel: <span className="font-mono">{ord.customerPhone || "N/A"}</span>
                                </p>
                              )}
                              <p className="text-xxs text-slate-400 mt-1">
                                Ordered {Math.round((Date.now() - new Date(ord.placedAt).getTime()) / 60000)} minutes ago
                              </p>
                            </div>

                            <span className="text-xs font-mono font-bold text-slate-700 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100">${ord.totalAmount.toFixed(2)}</span>
                          </div>

                          {/* SLA Warning */}
                          {Math.round((Date.now() - new Date(ord.placedAt).getTime()) / 60000) > 15 && ord.status !== "preparing" && (
                            <div className="p-2 bg-rose-50 border border-rose-100 rounded-lg text-xxs text-rose-700 flex items-center gap-1.5 font-semibold">
                              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                              Order exceeding SLA target of 15 minutes! Flagged for priority prep.
                            </div>
                          )}

                          {/* Items lists */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                            {ord.items.map((it, idx) => (
                              <div key={idx} className="p-3 bg-slate-50 border border-slate-100 rounded-lg space-y-1.5">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <p className="text-xs font-bold text-slate-800">{it.name} <span className="text-indigo-600">x{it.quantity}</span></p>
                                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wide">Course: {it.course}</span>
                                  </div>
                                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold uppercase ${it.fired ? "bg-emerald-50 text-emerald-600" : "bg-yellow-50 text-yellow-600"}`}>
                                    {it.fired ? "Fired" : "On Hold"}
                                  </span>
                                </div>

                                {/* Modifiers List */}
                                {it.modifiers && it.modifiers.length > 0 && (
                                  <div className="border-t border-dashed border-slate-200 pt-1.5 space-y-0.5">
                                    {it.modifiers.map((m, mIdx) => (
                                      <p key={mIdx} className="text-xxs text-slate-500 font-semibold">
                                        • {m.groupName}: <span className="text-slate-700 font-bold">{m.optionName}</span> (+${m.price.toFixed(2)})
                                      </p>
                                    ))}
                                  </div>
                                )}

                                {it.notes && <p className="text-xxs text-rose-500 font-semibold italic">"Notes: {it.notes}"</p>}

                                {/* Course Fire CTA */}
                                {!it.fired && (
                                  <button
                                    onClick={() => handleFireCourse(ord.id, it.course)}
                                    className="w-full mt-1.5 py-1 bg-yellow-500 hover:bg-yellow-600 text-white rounded text-[10px] font-bold flex items-center justify-center gap-1 uppercase transition-all"
                                  >
                                    <Flame className="w-3 h-3" /> Fire {it.course} Now
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                          {voidingOrderId === ord.id ? (
                            <div className="flex flex-col gap-1.5 bg-red-50/50 p-2 border border-red-200 rounded-lg text-left">
                              <input
                                type="text"
                                placeholder="Reason for voiding..."
                                value={voidReason}
                                onChange={(e) => setVoidReason(e.target.value)}
                                className="px-2 py-1 bg-white border border-red-350 rounded text-xxs font-semibold text-slate-800 focus:outline-hidden"
                                style={{ minWidth: "150px" }}
                              />
                              <input
                                type="password"
                                placeholder="Manager PIN..."
                                value={voidPin}
                                onChange={(e) => setVoidPin(e.target.value)}
                                className="px-2 py-1 bg-white border border-red-350 rounded text-xxs font-semibold text-slate-800 focus:outline-hidden"
                                style={{ minWidth: "150px" }}
                              />
                              <div className="flex gap-1.5">
                                <button
                                  onClick={() => {
                                    if (voidReason.trim() && voidPin.trim()) {
                                      handleVoidOrder(ord.id, voidReason, voidPin);
                                      setVoidingOrderId(null);
                                      setVoidReason("");
                                      setVoidPin("");
                                    } else {
                                      alert("Both reason and manager PIN are required to void an order.");
                                    }
                                  }}
                                  className="px-2 py-0.5 bg-red-600 text-white rounded text-[9px] font-bold hover:bg-red-700 cursor-pointer"
                                >
                                  Void
                                </button>
                                <button
                                  onClick={() => {
                                    setVoidingOrderId(null);
                                    setVoidReason("");
                                    setVoidPin("");
                                  }}
                                  className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded text-[9px] font-semibold hover:bg-slate-300 cursor-pointer"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setVoidingOrderId(ord.id);
                                setVoidReason("");
                              }}
                              className="p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 border border-slate-150 transition-colors flex items-center gap-1 text-xxs font-semibold font-bold"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Void Order
                            </button>
                          )}

                          <div className="flex gap-2">
                            {ord.status === "placed" && (
                              <button
                                onClick={() => handleUpdateOrderStatus(ord.id, "confirmed")}
                                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs transition-colors shadow-xs"
                              >
                                Confirm / Accept Order
                              </button>
                            )}
                            {(ord.status === "placed" || ord.status === "confirmed") && (
                              <button
                                onClick={() => handleUpdateOrderStatus(ord.id, "preparing")}
                                className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg text-xs transition-colors shadow-xs"
                              >
                                Start Cooking
                              </button>
                            )}
                            {ord.status === "preparing" && (
                              <button
                                onClick={() => handleUpdateOrderStatus(ord.id, "ready_for_rider")}
                                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs transition-colors shadow-xs"
                              >
                                Mark Cooked & Pack
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )
                ) : (
                  /* ==================== WAITER TERMINAL: 3 SERVICES BOARDS (PHASES 0-14) ==================== */
                  <div className="space-y-6" id="waiter-terminal-root">
                    {/* Style rules for SLA pulses & isolated printing */}
                    <style>{`
                      @keyframes pulseBorder {
                        0%, 100% { border-color: #fca5a5; box-shadow: 0 0 0 0px rgba(239, 68, 68, 0); }
                        50% { border-color: #f43f5e; box-shadow: 0 0 14px 3px rgba(244, 63, 94, 0.35); }
                      }
                      @keyframes pulseBorderEmerald {
                        0%, 100% { border-color: #a7f3d0; box-shadow: 0 0 0 0px rgba(16, 185, 129, 0); }
                        50% { border-color: #10b981; box-shadow: 0 0 14px 3px rgba(16, 185, 129, 0.35); }
                      }
                      .animate-pulse-border {
                        animation: pulseBorder 1.5s infinite ease-in-out;
                      }
                      .animate-pulse-border-emerald {
                        animation: pulseBorderEmerald 1.5s infinite ease-in-out;
                      }
                      @media print {
                        body * {
                          visibility: hidden !important;
                        }
                        #thermal-receipt-print-container, #thermal-receipt-print-container * {
                          visibility: visible !important;
                        }
                        #thermal-receipt-print-container {
                          position: absolute !important;
                          left: 0 !important;
                          top: 0 !important;
                          width: 80mm !important;
                          margin: 0 !important;
                          padding: 4mm !important;
                          font-family: monospace !important;
                          font-size: 11px !important;
                          line-height: 1.4 !important;
                          background: white !important;
                          color: black !important;
                          box-shadow: none !important;
                        }
                      }
                    `}</style>

                    {/* Compact Control Console & Sound Manager (Phase 3 & 10) */}
                    <div className="bg-slate-900 text-white p-5 rounded-3xl border border-slate-800 shadow-xl space-y-4">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                          <h3 className="text-sm font-extrabold tracking-tight uppercase tracking-wider text-indigo-400 flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-amber-450" />
                            Waiter Operations Center
                          </h3>
                          <p className="text-xxs text-slate-400 mt-0.5">Control live streams, layouts, audio alarms, and print settings.</p>
                        </div>
                        
                        {/* Audio Controller (Phase 3) */}
                        <div className="flex items-center gap-3 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-750 text-xxs w-full md:w-auto justify-between">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setSoundEnabled(!soundEnabled)}
                              className="p-1 hover:bg-slate-700 rounded-md transition-colors text-slate-300 hover:text-white"
                              title={soundEnabled ? "Disable Alarms" : "Enable Alarms"}
                            >
                              {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-450" /> : <VolumeX className="w-4 h-4 text-rose-400" />}
                            </button>
                            <span className="font-bold text-slate-300">Sound: {soundEnabled ? "ON" : "OFF"}</span>
                          </div>
                          <div className="flex items-center gap-2 flex-1 md:flex-none">
                            <input
                              type="range"
                              min="0"
                              max="1"
                              step="0.1"
                              value={soundVolume}
                              onChange={(e) => setSoundVolume(parseFloat(e.target.value))}
                              disabled={!soundEnabled}
                              className="w-16 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500 disabled:opacity-30"
                            />
                            <button
                              type="button"
                              onClick={playNewOrderChime}
                              disabled={!soundEnabled}
                              className="px-2 py-0.5 bg-slate-750 hover:bg-slate-700 text-slate-300 hover:text-white rounded-md font-semibold transition-colors disabled:opacity-30"
                            >
                              Test
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Connection state & Layout selector */}
                      <div className="flex flex-wrap justify-between items-center pt-2.5 border-t border-slate-800 gap-3">
                        <div className="flex items-center gap-4">
                          {/* Connection State Indicator (Phase 11) */}
                          <span className="flex items-center gap-1.5 text-xxs font-bold text-emerald-450">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            Online & Synced
                          </span>
                          
                          {/* Layout switcher */}
                          <div className="flex bg-slate-800 p-0.5 rounded-lg border border-slate-750 text-xxs">
                            <button
                              type="button"
                              onClick={() => setLayoutMode("tabbed")}
                              className={`px-2.5 py-1 rounded-md font-bold transition-all ${layoutMode === "tabbed" ? "bg-slate-900 text-white shadow-xs" : "text-slate-400 hover:text-white"}`}
                            >
                              Tabbed View
                            </button>
                            <button
                              type="button"
                              onClick={() => setLayoutMode("split")}
                              className={`px-2.5 py-1 rounded-md font-bold transition-all ${layoutMode === "split" ? "bg-slate-900 text-white shadow-xs" : "text-slate-400 hover:text-white"}`}
                            >
                              Split Panels (>=1440px)
                            </button>
                          </div>
                        </div>

                        {/* Search Input Filter (Phase 12) */}
                        <div className="relative w-full md:w-64">
                          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-500" />
                          <input
                            type="text"
                            placeholder="Search Customer / Table / ID..."
                            value={orderSearchQuery}
                            onChange={(e) => setOrderSearchQuery(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-750 rounded-xl pl-9 pr-4 py-1.5 text-xxs text-white placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                          />
                          {orderSearchQuery && (
                            <button
                              type="button"
                              onClick={() => setOrderSearchQuery("")}
                              className="absolute right-3 top-2.5 text-slate-500 hover:text-white text-xxs font-bold"
                            >
                              Clear
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Board Selector Tabs - Active Stream toggles (Phase 1) */}
                    {layoutMode === "tabbed" && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 bg-slate-100 p-1.5 rounded-2xl border border-slate-200/60 gap-1.5" id="waiter-terminal-tabs">
                        <button
                          type="button"
                          onClick={() => setActiveWaiterBoard("all")}
                          className={`py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${activeWaiterBoard === "all" ? "bg-slate-900 text-white shadow-sm" : "text-slate-600 hover:text-slate-800 hover:bg-white/40"}`}
                        >
                          <span>📋 All Boards</span>
                          <span className={`px-1.5 py-0.2 text-[9px] rounded-full font-bold ${activeWaiterBoard === "all" ? "bg-slate-800 text-slate-300" : "bg-slate-200 text-slate-700"}`}>
                            {orders.filter(o => o.status !== "completed" && o.status !== "voided" && o.status !== "paid").length}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveWaiterBoard("plated")}
                          className={`py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${activeWaiterBoard === "plated" ? "bg-indigo-650 text-white shadow-sm" : "text-slate-600 hover:text-slate-800 hover:bg-white/40"}`}
                        >
                          <span>🍽 Plated Service</span>
                          <span className={`px-1.5 py-0.2 text-[9px] rounded-full font-bold ${activeWaiterBoard === "plated" ? "bg-indigo-100 text-indigo-800" : "bg-slate-200 text-slate-700"}`}>
                            {orders.filter(o => o.fulfillmentType === "dine_in" && o.status !== "completed" && o.status !== "voided" && o.status !== "paid").length}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveWaiterBoard("delivery")}
                          className={`py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${activeWaiterBoard === "delivery" ? "bg-violet-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-800 hover:bg-white/40"}`}
                        >
                          <span>🛵 Delivery Board</span>
                          <span className={`px-1.5 py-0.2 text-[9px] rounded-full font-bold ${activeWaiterBoard === "delivery" ? "bg-violet-100 text-violet-800" : "bg-slate-200 text-slate-700"}`}>
                            {orders.filter(o => o.fulfillmentType === "delivery" && o.status !== "completed" && o.status !== "voided" && o.status !== "paid").length}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveWaiterBoard("takeaway")}
                          className={`py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${activeWaiterBoard === "takeaway" ? "bg-emerald-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-800 hover:bg-white/40"}`}
                        >
                          <span>🥡 Takeaway Board</span>
                          <span className={`px-1.5 py-0.2 text-[9px] rounded-full font-bold ${activeWaiterBoard === "takeaway" ? "bg-emerald-100 text-emerald-850" : "bg-slate-200 text-slate-700"}`}>
                            {orders.filter(o => o.fulfillmentType === "takeaway" && o.status !== "completed" && o.status !== "voided" && o.status !== "paid").length}
                          </span>
                        </button>
                      </div>
                    )}

                    {/* RENDERING SECTIONS BASED ON LAYOUT & FILTERS */}
                    {(() => {
                      // 1. Apply global search query filter
                      const filteredByQuery = orders.filter(o => {
                        if (o.status === "completed" || o.status === "voided" || o.status === "paid") return false;
                        if (!orderSearchQuery) return true;
                        
                        const query = orderSearchQuery.toLowerCase();
                        const idMatch = o.id.toLowerCase().includes(query);
                        const custMatch = o.customerName?.toLowerCase().includes(query) || false;
                        const phoneMatch = o.customerPhone?.includes(query) || false;
                        const tblMatch = o.tableName?.toLowerCase().includes(query) || false;
                        
                        return idMatch || custMatch || phoneMatch || tblMatch;
                      });

                      // Render Order Card Helper to keep code modular and readable
                      const renderOrderCard = (ord: any, listLabel?: string) => {
                        const sColors = getCardColorClass(ord);
                        const elapsedMs = Date.now() - new Date(ord.placedAt || ord.createdAt || Date.now()).getTime();
                        const elapsedMinutes = Math.floor(elapsedMs / 60000);
                        
                        return (
                          <div 
                            key={ord.id} 
                            className={`p-5 rounded-2xl border transition-all relative overflow-hidden flex flex-col justify-between gap-4 ${sColors.bg} ${sColors.border}`}
                          >
                            {/* SLA Overriding Accent bar on top */}
                            <div className={`absolute top-0 left-0 right-0 h-1.5 ${
                              elapsedMinutes >= 20 ? "bg-rose-500 animate-pulse" : elapsedMinutes >= 10 ? "bg-amber-500" : "bg-indigo-500"
                            }`}></div>

                            {/* Ticket Headers */}
                            <div className="space-y-2">
                              <div className="flex justify-between items-start">
                                <div>
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="text-[10px] font-mono font-black tracking-tight uppercase px-1.5 py-0.5 rounded-sm bg-slate-900 text-white">
                                      #{ord.id.slice(-6)}
                                    </span>
                                    <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-sm uppercase ${
                                      ord.fulfillmentType === "dine_in" ? "bg-indigo-100 text-indigo-700" : ord.fulfillmentType === "takeaway" ? "bg-emerald-100 text-emerald-800" : "bg-violet-100 text-violet-700"
                                    }`}>
                                      {ord.fulfillmentType === "dine_in" ? "DINE IN" : ord.fulfillmentType?.toUpperCase()}
                                    </span>
                                    <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-sm uppercase">
                                      {ord.status.replace(/_/g, " ")}
                                    </span>
                                  </div>
                                  <h4 className="text-sm font-bold text-slate-900 mt-2 font-display">
                                    {ord.tableName ? `Table: ${ord.tableName}` : "Fulfillment Dispatch"}
                                  </h4>
                                </div>
                                <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100/60 border border-slate-150 px-2 py-0.5 rounded-md">
                                  ${ord.totalAmount.toFixed(2)}
                                </span>
                              </div>

                              {/* Elapsed Time Warn Label (Phase 4) */}
                              <div className="flex items-center justify-between text-[10px] border-b border-dashed border-slate-200/80 pb-2">
                                <span className={`font-bold flex items-center gap-1 ${
                                  elapsedMinutes >= 20 ? "text-rose-600 animate-bounce" : elapsedMinutes >= 10 ? "text-amber-600" : "text-slate-500"
                                }`}>
                                  <Clock className="w-3.5 h-3.5" />
                                  {elapsedMinutes}m elapsed
                                </span>
                                {elapsedMinutes >= 20 && (
                                  <span className="bg-rose-100 text-rose-800 text-[9px] font-extrabold px-1.5 py-0.2 rounded-full animate-pulse">LATE SLA CRITICAL</span>
                                )}
                                {elapsedMinutes >= 10 && elapsedMinutes < 20 && (
                                  <span className="bg-amber-100 text-amber-800 text-[9px] font-extrabold px-1.5 py-0.2 rounded-full">SLA WARNING</span>
                                )}
                              </div>

                              {/* Customer Information (if present) */}
                              {(ord.customerName || ord.customerPhone) && (
                                <div className="p-2 bg-slate-50 rounded-xl border border-slate-150 text-[10px] space-y-0.5">
                                  <p className="font-bold text-slate-700 flex items-center gap-1">
                                    <User className="w-3 h-3 text-slate-400" />
                                    Guest: {ord.customerName || "Walk-in Guest"}
                                  </p>
                                  {ord.customerPhone && (
                                    <p className="text-slate-500 font-mono flex items-center gap-1">
                                      <Phone className="w-3 h-3 text-slate-400" />
                                      {ord.customerPhone}
                                    </p>
                                  )}
                                  {ord.fulfillmentType === "delivery" && ord.delivery?.address && (
                                    <p className="text-slate-500 italic mt-1 font-sans text-[9px] bg-white p-1.5 border border-slate-100 rounded-md">
                                      "{ord.delivery.address}"
                                    </p>
                                  )}
                                </div>
                              )}

                              {/* Delivery Details (Distance, Rider Info) */}
                              {ord.fulfillmentType === "delivery" && ord.delivery && (
                                <div className="p-2 bg-slate-50 rounded-xl border border-slate-150 text-[10px] space-y-1">
                                  <p className="font-mono text-slate-500">
                                    Dist: {ord.delivery.distanceKm}km · Fee: ${ord.delivery.deliveryFee.toFixed(2)}
                                  </p>
                                  {ord.delivery.riderName ? (
                                    <div className="bg-indigo-50 border border-indigo-150 p-1.5 rounded-lg flex items-center justify-between text-indigo-900 font-bold">
                                      <span>Rider: {ord.delivery.riderName}</span>
                                      <span className="text-[9px] opacity-80">{ord.delivery.riderPhone}</span>
                                    </div>
                                  ) : (
                                    <div className="bg-slate-200 text-slate-600 p-1 rounded text-[9px] font-bold text-center">
                                      Pending Rider Assign
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Item quantity short summary list */}
                              <div className="space-y-1 pt-1">
                                {ord.items.map((it: any, index: number) => (
                                  <div key={index} className="flex justify-between text-xxs text-slate-600">
                                    <span className="font-medium truncate max-w-[150px]">{it.name} <span className="font-bold text-slate-400">x{it.quantity}</span></span>
                                    <span className="font-mono text-slate-400">${((it.price || 0) * (it.quantity || 1)).toFixed(2)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Quick Operational Action Controls */}
                            <div className="pt-3 border-t border-slate-100 flex flex-wrap gap-1.5 justify-between items-center mt-auto">
                              <div className="flex gap-1">
                                <button
                                  type="button"
                                  onClick={() => setSelectedOrderForDetail(ord)}
                                  className="p-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded-xl border border-slate-150 transition-colors text-[10px] font-bold"
                                  title="View Full Details"
                                >
                                  Details
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handlePrintReceipt(ord)}
                                  className="p-1.5 bg-white hover:bg-indigo-50 text-indigo-700 hover:text-indigo-800 rounded-xl border border-indigo-150 transition-colors text-[10px] font-bold flex items-center gap-1"
                                  title="Print 80mm Receipt"
                                >
                                  <Printer className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              <div className="flex gap-1.5">
                                {/* Fire to kitchen trigger */}
                                {ord.status === "placed" && (
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateOrderStatus(ord.id, "confirmed")}
                                    className="px-3 py-1.5 bg-indigo-650 hover:bg-indigo-600 text-white text-[10px] font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                                  >
                                    Accept
                                  </button>
                                )}
                                {ord.status === "confirmed" && (
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateOrderStatus(ord.id, "preparing")}
                                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                                  >
                                    Fire Cooking
                                  </button>
                                )}

                                {/* Deliver/Rider Actions */}
                                {ord.fulfillmentType === "delivery" && ord.status === "preparing" && (
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateOrderStatus(ord.id, "ready_for_rider")}
                                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                                  >
                                    Pack & Done
                                  </button>
                                )}
                                {ord.fulfillmentType === "delivery" && ord.status === "ready_for_rider" && (
                                  <button
                                    type="button"
                                    onClick={() => setSelectedOrderForRiderAssign(ord)}
                                    className="px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white text-[10px] font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
                                  >
                                    <Truck className="w-3 h-3" />
                                    Assign Rider
                                  </button>
                                )}
                                {ord.fulfillmentType === "delivery" && ord.status === "rider_assigned" && (
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateOrderStatus(ord.id, "picked_up")}
                                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-750 text-white text-[10px] font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                                  >
                                    Rider Departed
                                  </button>
                                )}
                                {ord.fulfillmentType === "delivery" && ord.status === "picked_up" && (
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateOrderStatus(ord.id, "delivered")}
                                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                                  >
                                    Delivered
                                  </button>
                                )}

                                {/* Takeaway specific actions */}
                                {ord.fulfillmentType === "takeaway" && ord.status === "preparing" && (
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateOrderStatus(ord.id, "ready_for_pickup")}
                                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded-xl shadow-xs transition-colors cursor-pointer animate-pulse-border-emerald"
                                  >
                                    Ready for Pickup
                                  </button>
                                )}
                                {ord.fulfillmentType === "takeaway" && ord.status === "ready_for_pickup" && (
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateOrderStatus(ord.id, "delivered")}
                                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                                  >
                                    Handoff
                                  </button>
                                )}

                                {/* Dine-in Plated handoff / completion */}
                                {ord.fulfillmentType === "dine_in" && ord.status === "preparing" && (
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateOrderStatus(ord.id, "ready_for_pickup")}
                                    className="px-3 py-1.5 bg-indigo-650 hover:bg-indigo-600 text-white text-[10px] font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                                  >
                                    Plates Ready
                                  </button>
                                )}
                                {ord.fulfillmentType === "dine_in" && ord.status === "ready_for_pickup" && (
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateOrderStatus(ord.id, "delivered")}
                                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-750 text-white text-[10px] font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                                  >
                                    Serve Table
                                  </button>
                                )}
                                {ord.status === "delivered" && (
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateOrderStatus(ord.id, "paid")}
                                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-750 text-white text-[10px] font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                                  >
                                    Close Bill
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      };

                      // Helper to compute card classes based on status and SLA elapsed time
                      const getCardColorClass = (order: any) => {
                        const elapsedMs = Date.now() - new Date(order.placedAt || order.createdAt || Date.now()).getTime();
                        const elapsedMinutes = Math.floor(elapsedMs / 60000);

                        if (elapsedMinutes >= 20) {
                          return {
                            bg: "bg-rose-50/60",
                            border: "border-rose-400 animate-pulse-border",
                            text: "text-rose-900",
                          };
                        }
                        if (elapsedMinutes >= 10) {
                          return {
                            bg: "bg-amber-50/60",
                            border: "border-amber-400",
                            text: "text-amber-900",
                          };
                        }

                        switch (order.status) {
                          case "placed":
                            return { bg: "bg-sky-50/20", border: "border-sky-300" };
                          case "confirmed":
                            return { bg: "bg-indigo-50/20", border: "border-indigo-300" };
                          case "preparing":
                            return { bg: "bg-amber-50/10", border: "border-amber-300" };
                          case "ready_for_rider":
                          case "ready_for_pickup":
                            return { bg: "bg-emerald-50/20", border: "border-emerald-400 animate-pulse-border-emerald" };
                          default:
                            return { bg: "bg-white", border: "border-slate-200" };
                        }
                      };

                      // A. SPLIT PANELS VIEW (Phases 0 & 2)
                      if (layoutMode === "split") {
                        const platedOrders = filteredByQuery.filter(o => o.fulfillmentType === "dine_in");
                        const deliveryOrders = filteredByQuery.filter(o => o.fulfillmentType === "delivery");
                        const takeawayOrders = filteredByQuery.filter(o => o.fulfillmentType === "takeaway");

                        return (
                          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6" id="waiter-terminal-split">
                            {/* 1. Plated Service Panel */}
                            <div className="space-y-4">
                              <div className="flex justify-between items-center bg-indigo-50 border border-indigo-100 p-3 rounded-2xl">
                                <h4 className="text-xs font-black text-indigo-900 flex items-center gap-1.5 uppercase">
                                  <UtensilsCrossed className="w-4 h-4 text-indigo-600" />
                                  Plated Service ({platedOrders.length})
                                </h4>
                              </div>
                              <div className="space-y-4 max-h-[700px] overflow-y-auto pr-1">
                                {platedOrders.length === 0 ? (
                                  <p className="text-xxs text-slate-400 text-center py-8">No active dine-in orders</p>
                                ) : (
                                  platedOrders.map(ord => renderOrderCard(ord, "plated"))
                                )}
                              </div>
                            </div>

                            {/* 2. Delivery Board Panel (In Kitchen / Out for Delivery) */}
                            <div className="space-y-4 border-l border-r border-slate-100 px-2">
                              <div className="flex justify-between items-center bg-violet-50 border border-violet-100 p-3 rounded-2xl">
                                <h4 className="text-xs font-black text-violet-900 flex items-center gap-1.5 uppercase">
                                  <Truck className="w-4 h-4 text-violet-600" />
                                  Delivery Board ({deliveryOrders.length})
                                </h4>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-3">
                                {/* Left column: In Kitchen */}
                                <div className="space-y-3">
                                  <h5 className="text-[10px] font-bold text-slate-500 uppercase px-1">Kitchen Prep</h5>
                                  <div className="space-y-3 max-h-[600px] overflow-y-auto">
                                    {(() => {
                                      const kitchenSub = deliveryOrders.filter(o => ["placed", "confirmed", "preparing", "ready_for_rider"].includes(o.status));
                                      return kitchenSub.length === 0 ? (
                                        <p className="text-[9px] text-slate-400 text-center py-4 italic">No prep</p>
                                      ) : kitchenSub.map(o => renderOrderCard(o));
                                    })()}
                                  </div>
                                </div>
                                {/* Right column: Out for delivery */}
                                <div className="space-y-3 border-l border-slate-100 pl-2">
                                  <h5 className="text-[10px] font-bold text-slate-500 uppercase px-1">In Transit</h5>
                                  <div className="space-y-3 max-h-[600px] overflow-y-auto">
                                    {(() => {
                                      const transitSub = deliveryOrders.filter(o => ["rider_assigned", "picked_up", "delivered"].includes(o.status));
                                      return transitSub.length === 0 ? (
                                        <p className="text-[9px] text-slate-400 text-center py-4 italic">No transit</p>
                                      ) : transitSub.map(o => renderOrderCard(o));
                                    })()}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* 3. Takeaway Board Panel (In Kitchen / Ready for Pickup) */}
                            <div className="space-y-4">
                              <div className="flex justify-between items-center bg-emerald-50 border border-emerald-100 p-3 rounded-2xl">
                                <h4 className="text-xs font-black text-emerald-950 flex items-center gap-1.5 uppercase">
                                  <ShoppingBag className="w-4 h-4 text-emerald-600" />
                                  Takeaway Board ({takeawayOrders.length})
                                </h4>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-3">
                                {/* Left column: In Kitchen */}
                                <div className="space-y-3">
                                  <h5 className="text-[10px] font-bold text-slate-500 uppercase px-1">Kitchen Prep</h5>
                                  <div className="space-y-3 max-h-[600px] overflow-y-auto">
                                    {(() => {
                                      const kitchenSub = takeawayOrders.filter(o => ["placed", "confirmed", "preparing"].includes(o.status));
                                      return kitchenSub.length === 0 ? (
                                        <p className="text-[9px] text-slate-400 text-center py-4 italic">No prep</p>
                                      ) : kitchenSub.map(o => renderOrderCard(o));
                                    })()}
                                  </div>
                                </div>
                                {/* Right column: Ready for Pickup */}
                                <div className="space-y-3 border-l border-slate-100 pl-2">
                                  <h5 className="text-[10px] font-bold text-slate-500 uppercase px-1">Ready Pickup</h5>
                                  <div className="space-y-3 max-h-[600px] overflow-y-auto">
                                    {(() => {
                                      const readySub = takeawayOrders.filter(o => o.status === "ready_for_pickup");
                                      return readySub.length === 0 ? (
                                        <p className="text-[9px] text-slate-400 text-center py-4 italic">None ready</p>
                                      ) : readySub.map(o => renderOrderCard(o));
                                    })()}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      }

                      // B. TABBED BOARD VIEW (Default / tablet-touch design)
                      if (activeWaiterBoard === "plated") {
                        const platedOrders = filteredByQuery.filter(o => o.fulfillmentType === "dine_in");
                        return (
                          <div className="space-y-4 animate-fade-in" id="waiter-plated-stream">
                            <h4 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider px-1">🍽 Plated Service (Table Streams)</h4>
                            {platedOrders.length === 0 ? (
                              <div className="bg-white p-12 text-center border border-dashed border-slate-200 rounded-2xl">
                                <UtensilsCrossed className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                                <p className="text-xs font-bold text-slate-400">No active plated dine-in orders</p>
                              </div>
                            ) : (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {platedOrders.map(o => renderOrderCard(o))}
                              </div>
                            )}
                          </div>
                        );
                      }

                      if (activeWaiterBoard === "delivery") {
                        const deliveryOrders = filteredByQuery.filter(o => o.fulfillmentType === "delivery");
                        const kitchenSub = deliveryOrders.filter(o => ["placed", "confirmed", "preparing", "ready_for_rider"].includes(o.status));
                        const transitSub = deliveryOrders.filter(o => ["rider_assigned", "picked_up", "delivered"].includes(o.status));

                        return (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in" id="waiter-delivery-stream">
                            {/* Column 1: In Kitchen */}
                            <div className="space-y-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-150">
                              <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex justify-between px-1">
                                <span>🍳 Cooking & Packing</span>
                                <span className="text-slate-500">({kitchenSub.length})</span>
                              </h4>
                              {kitchenSub.length === 0 ? (
                                <p className="text-xxs text-slate-400 italic py-6 text-center">No delivery prep running</p>
                              ) : (
                                <div className="space-y-4">
                                  {kitchenSub.map(o => renderOrderCard(o))}
                                </div>
                              )}
                            </div>

                            {/* Column 2: In Transit */}
                            <div className="space-y-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-150">
                              <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex justify-between px-1">
                                <span>🛵 Rider Dispatch & Transit</span>
                                <span className="text-slate-500">({transitSub.length})</span>
                              </h4>
                              {transitSub.length === 0 ? (
                                <p className="text-xxs text-slate-400 italic py-6 text-center">No orders currently on delivery route</p>
                              ) : (
                                <div className="space-y-4">
                                  {transitSub.map(o => renderOrderCard(o))}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      }

                      if (activeWaiterBoard === "takeaway") {
                        const takeawayOrders = filteredByQuery.filter(o => o.fulfillmentType === "takeaway");
                        const kitchenSub = takeawayOrders.filter(o => ["placed", "confirmed", "preparing"].includes(o.status));
                        const readySub = takeawayOrders.filter(o => o.status === "ready_for_pickup");

                        return (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in" id="waiter-takeaway-stream">
                            {/* Column 1: In Kitchen */}
                            <div className="space-y-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-150">
                              <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex justify-between px-1">
                                <span>🍳 In Cooking Queue</span>
                                <span className="text-slate-500">({kitchenSub.length})</span>
                              </h4>
                              {kitchenSub.length === 0 ? (
                                <p className="text-xxs text-slate-400 italic py-6 text-center">No takeaway prep running</p>
                              ) : (
                                <div className="space-y-4">
                                  {kitchenSub.map(o => renderOrderCard(o))}
                                </div>
                              )}
                            </div>

                            {/* Column 2: Ready for Pickup */}
                            <div className="space-y-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-150">
                              <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex justify-between px-1">
                                <span>🥡 Ready at pickup Counter</span>
                                <span className="text-slate-500">({readySub.length})</span>
                              </h4>
                              {readySub.length === 0 ? (
                                <p className="text-xxs text-slate-400 italic py-6 text-center">No pickup packages waiting</p>
                              ) : (
                                <div className="space-y-4">
                                  {readySub.map(o => renderOrderCard(o))}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      }

                      // Default unified list (All Boards)
                      return (
                        <div className="space-y-4 animate-fade-in">
                          <h4 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider px-1">📋 All Active Outlet Orders</h4>
                          {filteredByQuery.length === 0 ? (
                            <div className="bg-white p-16 text-center border border-dashed border-slate-200 rounded-2xl">
                              <UtensilsCrossed className="w-12 h-12 text-slate-300 stroke-1 mx-auto mb-2 animate-pulse" />
                              <p className="text-xs font-bold text-slate-400">All clients are satisfied!</p>
                              <p className="text-xxs text-slate-400 max-w-[240px] mx-auto mt-1">New active orders will show up here instantly.</p>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {filteredByQuery.map(o => renderOrderCard(o))}
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    {/* DETAIL POPUP OVERLAY MODAL (Phase 7) */}
                    {selectedOrderForDetail && (
                      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
                        <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] overflow-hidden">
                          {/* Header */}
                          <div className="p-5 bg-slate-900 text-white flex justify-between items-center">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-mono font-black tracking-tight bg-slate-800 px-2 py-0.5 rounded-sm">
                                  #{selectedOrderForDetail.id.slice(-6)}
                                </span>
                                <span className="text-xs font-bold text-indigo-400">{selectedOrderForDetail.fulfillmentType?.toUpperCase()}</span>
                              </div>
                              <h3 className="text-md font-extrabold tracking-tight mt-1 font-display">
                                {selectedOrderForDetail.tableName ? `Table: ${selectedOrderForDetail.tableName}` : "Fulfillment Order"}
                              </h3>
                            </div>
                            <button
                              type="button"
                              onClick={() => setSelectedOrderForDetail(null)}
                              className="p-1.5 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>

                          {/* Body Content */}
                          <div className="p-6 overflow-y-auto space-y-6 text-slate-800 text-xs">
                            {/* Meta block */}
                            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-2xl border border-slate-150">
                              <div>
                                <span className="text-[10px] text-slate-400 font-bold block">PLACED AT</span>
                                <span className="font-semibold text-slate-700">
                                  {new Date(selectedOrderForDetail.placedAt || selectedOrderForDetail.createdAt).toLocaleString()}
                                </span>
                              </div>
                              <div>
                                <span className="text-[10px] text-slate-400 font-bold block">SOURCE</span>
                                <span className="font-semibold text-slate-700 uppercase">
                                  {selectedOrderForDetail.orderSource || "POS INTAKE"}
                                </span>
                              </div>
                              <div className="col-span-2 border-t border-slate-200/60 pt-2">
                                <span className="text-[10px] text-slate-400 font-bold block">CUSTOMER</span>
                                <span className="font-bold text-slate-800">{selectedOrderForDetail.customerName || "Walk-In Guest"}</span>
                                {selectedOrderForDetail.customerPhone && (
                                  <span className="text-slate-500 font-mono ml-2">({selectedOrderForDetail.customerPhone})</span>
                                )}
                              </div>
                            </div>

                            {/* Address details if delivery */}
                            {selectedOrderForDetail.fulfillmentType === "delivery" && selectedOrderForDetail.delivery && (
                              <div className="bg-indigo-50/50 border border-indigo-100 p-3 rounded-2xl space-y-1.5">
                                <span className="text-[10px] text-indigo-800 font-black block uppercase tracking-wider">Delivery Logistics</span>
                                <p className="text-slate-700 italic">"{selectedOrderForDetail.delivery.address}"</p>
                                <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500 font-semibold">
                                  <div>Region: <span className="text-slate-800 font-bold">{selectedOrderForDetail.delivery.region || "N/A"}</span></div>
                                  <div>Fee: <span className="text-slate-800 font-bold">${selectedOrderForDetail.delivery.deliveryFee?.toFixed(2) || "0.00"}</span></div>
                                </div>
                              </div>
                            )}

                            {/* Items list detail (Phase 7.b) */}
                            <div className="space-y-3">
                              <h4 className="text-xs font-black text-slate-900 border-b border-dashed border-slate-200 pb-1.5 uppercase tracking-wider">Ticket Items</h4>
                              <div className="space-y-3">
                                {selectedOrderForDetail.items?.map((it: any, index: number) => (
                                  <div key={index} className="flex flex-col border-b border-slate-100 pb-2.5 last:border-0 last:pb-0">
                                    <div className="flex justify-between font-bold text-slate-800">
                                      <span>{it.name} <span className="text-indigo-600 font-black">x{it.quantity}</span></span>
                                      <span className="font-mono">${((it.price || 0) * (it.quantity || 1)).toFixed(2)}</span>
                                    </div>
                                    {it.modifiers?.map((m: any, mIdx: number) => (
                                      <div key={mIdx} className="text-[10px] text-slate-400 pl-3.5 mt-0.5">
                                        + {m.groupName}: {m.optionName}
                                      </div>
                                    ))}
                                    {it.notes && (
                                      <p className="text-[10px] italic text-red-500 pl-3.5 mt-1 font-semibold">
                                        Note: "{it.notes}"
                                      </p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Financial Summary */}
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150 space-y-1.5 font-mono text-right text-slate-600">
                              <div className="flex justify-between">
                                <span>Subtotal:</span>
                                <span>${(selectedOrderForDetail.totalAmount * 0.9).toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>VAT (10%):</span>
                                <span>${(selectedOrderForDetail.totalAmount * 0.1).toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between border-t border-slate-200 pt-1.5 font-bold text-slate-900 text-sm">
                                <span>TOTAL VALUE:</span>
                                <span>${selectedOrderForDetail.totalAmount?.toFixed(2)}</span>
                              </div>
                            </div>

                            {/* Timeline status history (Phase 7.d) */}
                            <div className="space-y-3.5 pt-2">
                              <h4 className="text-xs font-black text-slate-900 border-b border-dashed border-slate-200 pb-1.5 uppercase tracking-wider">Status History Log</h4>
                              <div className="relative pl-5 border-l border-slate-200 space-y-4">
                                {selectedOrderForDetail.placedAt && (
                                  <div className="relative">
                                    <span className="absolute -left-[25px] top-1 w-2.5 h-2.5 rounded-full bg-indigo-500 ring-4 ring-white"></span>
                                    <div className="font-bold text-slate-800">Order Logged</div>
                                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                                      {new Date(selectedOrderForDetail.placedAt).toLocaleString()} · Issuer: Guest/API Sync
                                    </div>
                                  </div>
                                )}
                                {selectedOrderForDetail.confirmedAt && (
                                  <div className="relative">
                                    <span className="absolute -left-[25px] top-1 w-2.5 h-2.5 rounded-full bg-amber-500 ring-4 ring-white"></span>
                                    <div className="font-bold text-slate-800">Confirmed (Accepted)</div>
                                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                                      {new Date(selectedOrderForDetail.confirmedAt).toLocaleString()} · Issuer: Terminal Staff
                                    </div>
                                  </div>
                                )}
                                {selectedOrderForDetail.preparedAt && (
                                  <div className="relative">
                                    <span className="absolute -left-[25px] top-1 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-white"></span>
                                    <div className="font-bold text-slate-800">Food Prepared</div>
                                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                                      {new Date(selectedOrderForDetail.preparedAt).toLocaleString()} · Issuer: Kitchen Chef
                                    </div>
                                  </div>
                                )}
                                {selectedOrderForDetail.dispatchedAt && (
                                  <div className="relative">
                                    <span className="absolute -left-[25px] top-1 w-2.5 h-2.5 rounded-full bg-violet-500 ring-4 ring-white"></span>
                                    <div className="font-bold text-slate-800">Dispatched (Picked Up)</div>
                                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                                      {new Date(selectedOrderForDetail.dispatchedAt).toLocaleString()} · Issuer: Delivery Rider
                                    </div>
                                  </div>
                                )}
                                {selectedOrderForDetail.deliveredAt && (
                                  <div className="relative">
                                    <span className="absolute -left-[25px] top-1 w-2.5 h-2.5 rounded-full bg-blue-500 ring-4 ring-white"></span>
                                    <div className="font-bold text-slate-800">Handoff / Delivered</div>
                                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                                      {new Date(selectedOrderForDetail.deliveredAt).toLocaleString()} · Issuer: Dispatcher
                                    </div>
                                  </div>
                                )}
                                {selectedOrderForDetail.completedAt && (
                                  <div className="relative">
                                    <span className="absolute -left-[25px] top-1 w-2.5 h-2.5 rounded-full bg-emerald-600 ring-4 ring-white"></span>
                                    <div className="font-bold text-slate-800">Order Closed (Completed)</div>
                                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                                      {new Date(selectedOrderForDetail.completedAt).toLocaleString()} · Issuer: Cashier Settle
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Footer */}
                          <div className="p-4 bg-slate-50 border-t border-slate-150 flex justify-end gap-2.5">
                            <button
                              type="button"
                              onClick={() => {
                                handlePrintReceipt(selectedOrderForDetail);
                                setSelectedOrderForDetail(null);
                              }}
                              className="px-4 py-2 bg-indigo-650 hover:bg-indigo-600 text-white font-bold rounded-xl shadow-xs text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              Print Receipt
                            </button>
                            <button
                              type="button"
                              onClick={() => setSelectedOrderForDetail(null)}
                              className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-xl border border-slate-200 text-xs transition-colors cursor-pointer"
                            >
                              Close
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* RIDER ASSIGNMENT DIALOG POPUP MODAL (Phase 6) */}
                    {selectedOrderForRiderAssign && (
                      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
                        <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-100 flex flex-col overflow-hidden animate-scale-in">
                          <div className="p-5 bg-slate-900 text-white flex justify-between items-center">
                            <div>
                              <h3 className="text-md font-extrabold tracking-tight font-display flex items-center gap-1.5">
                                <Truck className="w-5 h-5 text-indigo-400" />
                                Assign Delivery Rider
                              </h3>
                              <p className="text-xxs text-slate-400 mt-0.5">Select a rider to dispatch Order #{selectedOrderForRiderAssign.id.slice(-6)}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => setSelectedOrderForRiderAssign(null)}
                              className="p-1.5 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>

                          <div className="p-6 space-y-4 max-h-[420px] overflow-y-auto text-xs text-slate-800">
                            {/* Available active riders list (with dummy fallbacks to ensure clickability) */}
                            {(() => {
                              const activeRiderList = riders.length > 0 ? riders : [
                                { id: "rider-fallback-1", name: "Captain Ahmed Reda", phone: "+20 102 345 6789", description: "Motorcycle (Zamalek region Specialist)" },
                                { id: "rider-fallback-2", name: "Captain Mahmoud Gameil", phone: "+20 115 889 2233", description: "E-Bike (Rapid 3km radius specialist)" },
                                { id: "rider-fallback-3", name: "Captain Youssef Ali", phone: "+20 128 776 6554", description: "Scooter (Heliopolis Special routes)" }
                              ];

                              return (
                                <div className="space-y-3.5">
                                  {activeRiderList.map((rider, idx) => (
                                    <div 
                                      key={rider.id || idx}
                                      className="p-3 bg-slate-50 border border-slate-150 rounded-2xl flex justify-between items-center hover:border-indigo-455 hover:bg-indigo-50/20 transition-all"
                                    >
                                      <div>
                                        <h4 className="font-extrabold text-slate-800 text-xs flex items-center gap-1.5">
                                          <span className="w-6 h-6 rounded-full bg-indigo-550/10 text-indigo-650 flex items-center justify-center text-[10px] font-bold">
                                            {rider.name.charAt(rider.name.indexOf(" ") + 1 || 0).toUpperCase()}
                                          </span>
                                          {rider.name}
                                        </h4>
                                        <p className="text-[10px] text-slate-400 font-mono mt-1 pl-7">{rider.phone || "No Phone Registered"}</p>
                                        <p className="text-[10px] text-slate-500 italic mt-0.5 pl-7">{rider.description || "Active Duty Rider"}</p>
                                      </div>

                                      <button
                                        type="button"
                                        onClick={async () => {
                                          try {
                                            // Assign rider and advance status to rider_assigned
                                            const rName = rider.name;
                                            const rPhone = rider.phone || "";
                                            const res = await fetch(`/api/orders/${selectedOrderForRiderAssign.id}/status`, {
                                              method: "PUT",
                                              headers: { "Content-Type": "application/json" },
                                              body: JSON.stringify({
                                                status: "rider_assigned",
                                                riderName: rName,
                                                riderPhone: rPhone,
                                                branchId: openBranchId,
                                                registerId: openRegisterId
                                              })
                                            });

                                            if (res.ok) {
                                              onRefreshOrders();
                                              onRefreshTables();
                                              fetchShifts();
                                              setSelectedOrderForRiderAssign(null);
                                              // Succesfully alert sound!
                                              playReadyReminder();
                                            }
                                          } catch (err) {
                                            console.error("Failed to assign rider:", err);
                                          }
                                        }}
                                        className="px-3 py-2 bg-indigo-650 hover:bg-indigo-600 text-white text-[10px] font-extrabold rounded-xl transition-colors shadow-xs flex items-center gap-1 cursor-pointer"
                                      >
                                        Assign & Done
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              );
                            })()}
                          </div>

                          <div className="p-4 bg-slate-50 border-t border-slate-150 flex justify-end">
                            <button
                              type="button"
                              onClick={() => setSelectedOrderForRiderAssign(null)}
                              className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-xl border border-slate-200 text-xs transition-colors cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* HIDDEN PRINT TICKET RECEIPT TEMPLATE (Phase 8) */}
                    {printOrder && (
                      <div id="thermal-receipt-print-container" className="hidden print:block">
                        <div className="text-center font-bold text-base mb-1 uppercase tracking-wider">
                          {org?.name?.toUpperCase() || "EPL FOOD BURGERS"}
                        </div>
                        <div className="text-center text-[10px] text-slate-700 leading-tight mb-3">
                          {openBranchId === "branch-a" ? "Zamalek Premium Branch" : "Maadi Nile Branch"}<br />
                          Greater Cairo, Egypt<br />
                          Contact: 01024567891 / 19999<br />
                          Tax Reg No: 442-890-551
                        </div>
                        <div className="border-t border-dashed border-black my-1.5"></div>
                        <div className="text-[10px] space-y-0.5">
                          <div><b>TICKET REF:</b> #{printOrder.id.slice(-6).toUpperCase()}</div>
                          <div><b>FULFILLMENT:</b> {printOrder.fulfillmentType?.toUpperCase() === "DINE_IN" ? "DINE IN (PLATES)" : printOrder.fulfillmentType?.toUpperCase()}</div>
                          {printOrder.tableName && <div><b>TABLE REF:</b> {printOrder.tableName}</div>}
                          {printOrder.customerName && <div><b>CUSTOMER:</b> {printOrder.customerName}</div>}
                          {printOrder.customerPhone && <div><b>TELEPHONE:</b> {printOrder.customerPhone}</div>}
                          <div><b>DATE & TIME:</b> {new Date(printOrder.placedAt || printOrder.createdAt || Date.now()).toLocaleString()}</div>
                          <div><b>ORDER ORIGIN:</b> {printOrder.orderSource?.toUpperCase() || "POS WAITER TERMINAL"}</div>
                        </div>
                        <div className="border-t border-dashed border-black my-1.5"></div>
                        <table className="w-full text-[10px] text-left">
                          <thead>
                            <tr className="font-bold border-b border-dashed border-black">
                              <th className="pb-1">ITEM DESCRIPTION</th>
                              <th className="pb-1 text-center">QTY</th>
                              <th className="pb-1 text-right">TOTAL</th>
                            </tr>
                          </thead>
                          <tbody>
                            {printOrder.items?.map((it: any, index: number) => (
                              <React.Fragment key={index}>
                                <tr className="align-top">
                                  <td className="py-1 font-bold">{it.name}</td>
                                  <td className="py-1 text-center font-bold">x{it.quantity}</td>
                                  <td className="py-1 text-right font-mono">${((it.price || 0) * (it.quantity || 1)).toFixed(2)}</td>
                                </tr>
                                {it.modifiers?.map((m: any, mIdx: number) => (
                                  <tr key={mIdx}>
                                    <td colSpan={3} className="text-[9px] text-slate-600 pl-3 py-0">
                                      + {m.groupName}: {m.optionName}
                                    </td>
                                  </tr>
                                ))}
                                {it.notes && (
                                  <tr>
                                    <td colSpan={3} className="text-[9px] italic text-red-650 pl-3 py-0.5">
                                      * Note: "{it.notes}"
                                    </td>
                                  </tr>
                                )}
                              </React.Fragment>
                            ))}
                          </tbody>
                        </table>
                        <div className="border-t border-dashed border-black my-1.5"></div>
                        <div className="text-[10px] space-y-1 text-right font-mono">
                          <div className="flex justify-between">
                            <span>Subtotal:</span>
                            <span>${(printOrder.totalAmount * 0.9).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>VAT Taxes (10%):</span>
                            <span>${(printOrder.totalAmount * 0.1).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between font-bold text-xs border-t border-dashed border-black pt-1">
                            <span>NET AMOUNT:</span>
                            <span>${printOrder.totalAmount?.toFixed(2)}</span>
                          </div>
                        </div>
                        <div className="border-t border-dashed border-black my-2"></div>
                        <div className="text-center text-[10px] mt-2">
                          Thank you for dining with us!<br />
                          eplfood.com POS Terminal Cloud
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Right Column (Floor Map seating layouts) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
            <div>
              <h3 className="text-md font-bold text-slate-900 tracking-tight">Floor Map Seating</h3>
              <p className="text-xs text-slate-500">Real-time table occupancy, click dropdown to set status.</p>
            </div>

            <div className="grid grid-cols-2 gap-3" id="floor-map-grid">
              {tables.map((tbl) => (
                <div 
                  key={tbl.id} 
                  className={`p-4 rounded-xl border flex flex-col justify-between gap-4 transition-all ${
                    tbl.status === "empty" 
                      ? "border-slate-150 bg-slate-50/50 hover:border-slate-350" 
                      : tbl.status === "occupied" 
                      ? "border-indigo-200 bg-indigo-50/30 hover:border-indigo-455" 
                      : tbl.status === "ordering"
                      ? "border-amber-200 bg-amber-50/30 hover:border-amber-455 animate-pulse"
                      : tbl.status === "bill_requested"
                      ? "border-emerald-300 bg-emerald-50/40 hover:border-emerald-455"
                      : tbl.status === "reserved"
                      ? "border-violet-200 bg-violet-50/30"
                      : "border-red-200 bg-red-50/20" // dirty
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-bold text-slate-800">{tbl.name}</h4>
                      <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold uppercase ${
                        tbl.status === "empty" 
                          ? "bg-slate-200 text-slate-600" 
                          : tbl.status === "occupied" 
                          ? "bg-indigo-100 text-indigo-700" 
                          : tbl.status === "ordering"
                          ? "bg-amber-100 text-amber-750"
                          : tbl.status === "bill_requested"
                          ? "bg-emerald-100 text-emerald-850"
                          : tbl.status === "reserved"
                          ? "bg-violet-100 text-violet-750"
                          : "bg-red-100 text-red-750" // dirty
                      }`}>{tbl.status.replace(/_/g, " ")}</span>
                    </div>

                    <p className="text-xxs text-slate-400 font-semibold">{tbl.seats} Seating capacity</p>
                  </div>

                  <div className="space-y-2">
                    {/* Active Order Details display */}
                    {tbl.currentOrderId ? (
                      <span className="text-xxs block bg-indigo-100/40 text-indigo-750 font-bold px-1.5 py-0.5 rounded-sm truncate">
                        Ref: #{tbl.currentOrderId.slice(-6)} Details
                      </span>
                    ) : (
                      <span className="text-xxs text-slate-400 italic block">No active bill</span>
                    )}

                    {/* Quick status changing select */}
                    <select
                      value={tbl.status}
                      onChange={(e) => handleUpdateTableStatus(tbl.id, e.target.value as TableStatus)}
                      className="w-full text-xxs bg-white border border-slate-200 rounded-sm p-1.5 font-bold text-slate-600 focus:outline-hidden cursor-pointer"
                    >
                      <option value="empty">Mark Empty</option>
                      <option value="occupied">Mark Occupied</option>
                      <option value="ordering">Mark Help / Order</option>
                      <option value="bill_requested">Bill Requested</option>
                      <option value="dirty">Mark Dirty</option>
                      <option value="reserved">Mark Reserved</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3.5 bg-yellow-50/60 border border-yellow-100 rounded-xl flex items-start gap-2 text-xxs">
              <AlertCircle className="w-4 h-4 text-yellow-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5 text-slate-650 leading-normal">
                <span className="font-bold text-yellow-800 block">SLA Alert Thresholds</span>
                Active orders automatically turn Red inside dispatcher if kitchen delay is past 15 minutes of live execution.
              </div>
            </div>

          </div>
        </div>

      </div>
      ) : (
        /* TOUCH-FIRST POS WORKSPACE */
        saasTier < 2 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/60 shadow-xs max-w-2xl mx-auto space-y-6 my-12 animate-fade-in" id="pos-lock-panel">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-500 border border-slate-200 shadow-xxs">
              <Lock className="w-8 h-8 text-indigo-650" />
            </div>
            <div className="space-y-2">
              <span className="text-[10px] font-black bg-indigo-100 text-indigo-800 border border-indigo-200 px-3 py-1 rounded-full uppercase tracking-wider">
                Growth Plan Feature
              </span>
              <h3 className="text-xl font-bold text-slate-900 tracking-tight">POS Order Intake Locked</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                The Touch-First Point of Sale (POS) Order Intake and local cashier ticketing system requires a <b>Tier 2 (Growth) Subscription</b>.
              </p>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  alert("لتفعيل نظام الـ POS، يرجى طلب ترقية باقة الاشتراك من مالك المنصة (Super Admin) في لوحة الإدارة.");
                }}
                className="px-6 py-3 bg-indigo-650 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-650/10 hover:shadow-lg cursor-pointer flex items-center gap-2 mx-auto"
              >
                <Sparkles className="w-4 h-4" />
                Upgrade to Tier 2 Now
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in" id="pos-terminal-layout">
          
          {/* POS Left: Menu Grid and Categories */}
          <div className="lg:col-span-8 bg-white border border-slate-100 rounded-3xl p-6 shadow-xs flex flex-col gap-5">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-md font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-indigo-600" />
                  POS Menu Catalog
                </h3>
                <p className="text-xxs text-slate-500">Tap items to trigger modifier selection panels and queue tickets.</p>
              </div>
              
              {/* Fulfillment type toggle */}
              <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0">
                <button
                  type="button"
                  onClick={() => { setPosFulfillmentType("dine_in"); }}
                  className={`px-3 py-1.5 text-xxs font-bold rounded-lg transition-all cursor-pointer ${posFulfillmentType === "dine_in" ? "bg-white text-indigo-700 shadow-xs" : "text-slate-500 hover:text-slate-800"}`}
                >
                  Dine In
                </button>
                <button
                  type="button"
                  onClick={() => { setPosFulfillmentType("takeaway"); setPosSelectedTableId(""); }}
                  className={`px-3 py-1.5 text-xxs font-bold rounded-lg transition-all cursor-pointer ${posFulfillmentType === "takeaway" ? "bg-white text-indigo-700 shadow-xs" : "text-slate-500 hover:text-slate-800"}`}
                >
                  Takeaway
                </button>
                <button
                  type="button"
                  onClick={() => { setPosFulfillmentType("delivery"); setPosSelectedTableId(""); }}
                  className={`px-3 py-1.5 text-xxs font-bold rounded-lg transition-all cursor-pointer ${posFulfillmentType === "delivery" ? "bg-white text-indigo-700 shadow-xs" : "text-slate-500 hover:text-slate-800"}`}
                >
                  Delivery
                </button>
              </div>
            </div>

            {/* Table selector for Dine-In */}
            {posFulfillmentType === "dine_in" && (
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-150 animate-fade-in flex flex-col gap-2.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Link to Active Guest Table Seating:</span>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {tables.map(tbl => (
                    <button
                      key={tbl.id}
                      type="button"
                      onClick={() => setPosSelectedTableId(tbl.id)}
                      className={`px-3 py-2 text-xxs font-bold rounded-xl border transition-all cursor-pointer flex flex-col items-center justify-center text-center gap-1 min-h-[48px] ${posSelectedTableId === tbl.id ? "bg-indigo-600 text-white border-indigo-650 shadow-sm" : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"}`}
                    >
                      <span className="truncate max-w-full">{tbl.name}</span>
                      <span className={`text-[8px] px-1 py-0.2 rounded font-black uppercase ${posSelectedTableId === tbl.id ? "bg-indigo-500 text-white" : tbl.status === "empty" ? "bg-slate-100 text-slate-500" : "bg-amber-150 text-amber-800"}`}>
                        {tbl.status}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Category selection bar */}
            <div className="flex flex-wrap gap-1.5 pb-2">
              <button
                type="button"
                onClick={() => setPosSelectedCategory("All")}
                className={`px-3.5 py-1.5 text-xxs font-bold rounded-lg transition-all border cursor-pointer ${posSelectedCategory === "All" ? "bg-slate-900 text-white border-slate-950 shadow-xs" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}`}
              >
                All Categories
              </button>
              {Array.from(new Set(menuItems.map(it => it.category))).map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setPosSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 text-xxs font-bold rounded-lg transition-all border cursor-pointer ${posSelectedCategory === cat ? "bg-slate-900 text-white border-slate-950 shadow-xs" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Menu item grid container */}
            {loadingMenu ? (
              <div className="text-center py-12">
                <p className="text-xs text-slate-400 animate-pulse font-bold">Populating touch menu...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 overflow-y-auto max-h-[460px] pr-1" id="pos-items-scroller">
                {menuItems
                  .filter(it => posSelectedCategory === "All" || it.category === posSelectedCategory)
                  .map(it => (
                    <div
                      key={it.id}
                      onClick={() => it.isAvailable && handleAddItemToCart(it)}
                      className={`group border rounded-2xl p-4 transition-all flex flex-col justify-between gap-4 cursor-pointer relative overflow-hidden h-[135px] select-none min-h-[120px] ${it.isAvailable ? "bg-slate-55/40 border-slate-150 hover:bg-white hover:border-indigo-400 hover:shadow-xs" : "bg-slate-100 border-slate-200/80 opacity-60 cursor-not-allowed"}`}
                    >
                      <div className="space-y-1">
                        <div className="flex justify-between items-start gap-2">
                          <h4 className="text-xs font-bold text-slate-900 group-hover:text-indigo-650 transition-colors line-clamp-1">{it.name}</h4>
                          <span className="text-xs font-bold text-slate-800 font-mono shrink-0">${it.price.toFixed(2)}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">{it.description}</p>
                      </div>

                      <div className="flex justify-between items-center mt-auto pt-1.5 border-t border-slate-100/60">
                        <span className="text-[9px] text-slate-400 font-mono uppercase font-black">{it.category}</span>
                        {it.isAvailable ? (
                          <div className="h-7 w-7 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-md group-hover:bg-indigo-600 transition-all shadow-xs shrink-0">
                            +
                          </div>
                        ) : (
                          <span className="text-[8px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">OUT OF STOCK</span>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* POS Right Column: Active Cart sidebar panel */}
          <div className="lg:col-span-4 bg-slate-900 text-white rounded-3xl p-5 shadow-lg flex flex-col justify-between min-h-[480px]" id="pos-cart-panel">
            <div className="space-y-4 flex-1 flex flex-col">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3 shrink-0">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-4.5 h-4.5 text-indigo-400" />
                  <h3 className="text-xs font-bold tracking-tight">Active POS Ticket ({posCart.reduce((sum, c) => sum + c.quantity, 0)})</h3>
                </div>
                {posCart.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setPosCart([])}
                    className="text-[10px] font-bold text-red-400 hover:text-red-350 transition-colors cursor-pointer"
                  >
                    Clear Cart
                  </button>
                )}
              </div>

              {/* Cart entries */}
              {posCart.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-3">
                  <div className="p-3 bg-slate-800 text-slate-500 rounded-full">
                    <ShoppingBag className="w-7 h-7" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400">POS Ticket Empty</p>
                    <p className="text-[10px] text-slate-500 max-w-[180px] mx-auto mt-1 leading-relaxed">Tap items from the left menu grid to populate local guest tickets.</p>
                  </div>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto max-h-[300px] space-y-2.5 pr-1" id="pos-cart-list">
                  {posCart.map(it => {
                    const mPrice = it.modifiers.reduce((sum: number, m: any) => sum + m.price, 0);
                    const singleItemTotal = it.price + mPrice;
                    return (
                      <div key={it.id} className="bg-slate-850 p-2.5 rounded-xl border border-slate-800/85 flex flex-col gap-2">
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <p className="text-xs font-bold text-slate-200 leading-tight">{it.name}</p>
                            <p className="text-[9px] text-slate-400 font-mono mt-0.5">${singleItemTotal.toFixed(2)} each</p>
                          </div>
                          <span className="text-xs font-bold text-indigo-300 font-mono">${(singleItemTotal * it.quantity).toFixed(2)}</span>
                        </div>

                        {/* Modifiers List */}
                        {it.modifiers.length > 0 && (
                          <div className="pl-2 border-l border-slate-750 space-y-0.5">
                            {it.modifiers.map((m: any, mIdx: number) => (
                              <p key={mIdx} className="text-[9px] text-slate-455">
                                • {m.groupName}: {m.optionName} <span className="font-mono text-[8px] text-slate-500">(+${m.price.toFixed(2)})</span>
                              </p>
                            ))}
                          </div>
                        )}

                        {it.notes && (
                          <p className="text-[9px] text-rose-350 font-semibold italic">"Note: {it.notes}"</p>
                        )}

                        <div className="flex justify-between items-center pt-2 border-t border-slate-800/45">
                          <button
                            type="button"
                            onClick={() => handleUpdateCartItemQty(it.id, 0)}
                            className="text-[9px] text-red-455 hover:text-red-300 font-bold flex items-center gap-0.5 cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" /> Remove
                          </button>
                          
                          <div className="flex items-center bg-slate-800 rounded-md p-0.5">
                            <button
                              type="button"
                              onClick={() => handleUpdateCartItemQty(it.id, it.quantity - 1)}
                              className="h-5 w-5 hover:bg-slate-700 text-slate-400 flex items-center justify-center font-bold text-xs rounded"
                            >
                              -
                            </button>
                            <span className="text-xs font-mono font-black text-slate-200 px-2">{it.quantity}</span>
                            <button
                              type="button"
                              onClick={() => handleUpdateCartItemQty(it.id, it.quantity + 1)}
                              className="h-5 w-5 hover:bg-slate-700 text-slate-400 flex items-center justify-center font-bold text-xs rounded"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Takeaway required fields */}
              {posFulfillmentType === "takeaway" && posCart.length > 0 && (
                <div className="bg-slate-850 p-3 rounded-2xl border border-slate-800 space-y-2 shrink-0 animate-fade-in">
                  <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Takeaway Customer Info (Required)</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1 font-sans">
                      <label className="block text-[8px] uppercase text-slate-400 font-bold">Cust. Name *</label>
                      <input
                        type="text"
                        placeholder="John Doe"
                        value={posCustomerName}
                        onChange={(e) => setPosCustomerName(e.target.value)}
                        className="bg-slate-800 border border-slate-700 text-slate-100 text-[10px] px-2.5 py-1.5 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-500 w-full placeholder-slate-500 font-semibold"
                      />
                    </div>
                    <div className="space-y-1 font-sans">
                      <label className="block text-[8px] uppercase text-slate-400 font-bold">Cust. Phone *</label>
                      <input
                        type="text"
                        placeholder="+1 555-0199"
                        value={posCustomerPhone}
                        onChange={(e) => setPosCustomerPhone(e.target.value)}
                        className="bg-slate-800 border border-slate-700 text-slate-100 text-[10px] px-2.5 py-1.5 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-500 w-full placeholder-slate-500 font-semibold"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Delivery required fields */}
              {posFulfillmentType === "delivery" && posCart.length > 0 && (
                <div className="bg-slate-850 p-3 rounded-2xl border border-slate-800 space-y-2.5 shrink-0 overflow-y-auto max-h-[180px] custom-scrollbar animate-fade-in">
                  <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Delivery Customer Info (Required)</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1 font-sans">
                      <label className="block text-[8px] uppercase text-slate-400 font-bold">Cust. Name *</label>
                      <input
                        type="text"
                        placeholder="John Doe"
                        value={posCustomerName}
                        onChange={(e) => setPosCustomerName(e.target.value)}
                        className="bg-slate-800 border border-slate-700 text-slate-100 text-[10px] px-2.5 py-1.5 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-500 w-full placeholder-slate-500 font-semibold"
                      />
                    </div>
                    <div className="space-y-1 font-sans">
                      <label className="block text-[8px] uppercase text-slate-400 font-bold">Cust. Phone *</label>
                      <input
                        type="text"
                        placeholder="+1 555-0199"
                        value={posCustomerPhone}
                        onChange={(e) => setPosCustomerPhone(e.target.value)}
                        className="bg-slate-800 border border-slate-700 text-slate-100 text-[10px] px-2.5 py-1.5 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-500 w-full placeholder-slate-500 font-semibold"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-1 font-sans">
                    <label className="block text-[8px] uppercase text-slate-400 font-bold">Region *</label>
                    <input
                      type="text"
                      placeholder="Downtown"
                      value={posDeliveryRegion}
                      onChange={(e) => setPosDeliveryRegion(e.target.value)}
                      className="bg-slate-800 border border-slate-700 text-slate-100 text-[10px] px-2.5 py-1.5 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-500 w-full placeholder-slate-500 font-semibold"
                    />
                  </div>

                  <div className="space-y-1 font-sans">
                    <label className="block text-[8px] uppercase text-slate-400 font-bold">Street *</label>
                    <input
                      type="text"
                      placeholder="Main Street"
                      value={posDeliveryStreet}
                      onChange={(e) => setPosDeliveryStreet(e.target.value)}
                      className="bg-slate-800 border border-slate-700 text-slate-100 text-[10px] px-2.5 py-1.5 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-500 w-full placeholder-slate-500 font-semibold"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1 font-sans">
                      <label className="block text-[8px] uppercase text-slate-400 font-bold">Bldg (Lid) *</label>
                      <input
                        type="text"
                        placeholder="Tower A"
                        value={posDeliveryBldgLandmark}
                        onChange={(e) => setPosDeliveryBldgLandmark(e.target.value)}
                        className="bg-slate-800 border border-slate-700 text-slate-100 text-[10px] px-2.5 py-1.5 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-500 w-full placeholder-slate-500 font-semibold"
                      />
                    </div>
                    <div className="space-y-1 font-sans">
                      <label className="block text-[8px] uppercase text-slate-400 font-bold font-semibold">Apt (App) *</label>
                      <input
                        type="text"
                        placeholder="Suite 5B"
                        value={posDeliveryAptSuite}
                        onChange={(e) => setPosDeliveryAptSuite(e.target.value)}
                        className="bg-slate-800 border border-slate-700 text-slate-100 text-[10px] px-2.5 py-1.5 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-500 w-full placeholder-slate-500 font-semibold"
                      />
                    </div>
                    <div className="space-y-1 font-sans">
                      <label className="block text-[8px] uppercase text-slate-400 font-bold">Floor *</label>
                      <input
                        type="text"
                        placeholder="14th"
                        value={posDeliveryFloor}
                        onChange={(e) => setPosDeliveryFloor(e.target.value)}
                        className="bg-slate-800 border border-slate-700 text-slate-100 text-[10px] px-2.5 py-1.5 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-500 w-full placeholder-slate-500 font-semibold"
                      />
                    </div>
                  </div>

                  <div className="space-y-1 font-sans">
                    <label className="block text-[8px] uppercase text-slate-400 font-bold font-black">Delivery Charge ($) *</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="5.00"
                      value={posDeliveryCharge}
                      onChange={(e) => setPosDeliveryCharge(e.target.value)}
                      className="bg-slate-800 border border-slate-700 text-slate-100 text-[10px] px-2.5 py-1.5 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-500 w-full placeholder-slate-500 font-semibold font-mono"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Totals & checkout CTA */}
            {posCart.length > 0 && (() => {
              const isTakeawayValid = posCustomerName.trim() !== "" && posCustomerPhone.trim() !== "";
              const isDeliveryValid = 
                posCustomerName.trim() !== "" && 
                posCustomerPhone.trim() !== "" && 
                posDeliveryRegion.trim() !== "" && 
                posDeliveryStreet.trim() !== "" && 
                posDeliveryBldgLandmark.trim() !== "" && 
                posDeliveryAptSuite.trim() !== "" && 
                posDeliveryFloor.trim() !== "" && 
                posDeliveryCharge.trim() !== "" &&
                !isNaN(parseFloat(posDeliveryCharge));

              const isCheckoutAllowed = 
                posFulfillmentType === "dine_in" 
                  ? (posSelectedTableId !== "") 
                  : posFulfillmentType === "takeaway" 
                    ? isTakeawayValid 
                    : isDeliveryValid;

              return (
                <div className="border-t border-slate-800 pt-3 space-y-3">
                  <div className="space-y-1 text-xxs text-slate-400 font-semibold">
                    <div className="flex justify-between">
                      <span>Menu Subtotal</span>
                      <span className="font-mono">${getCartTotals().subtotal.toFixed(2)}</span>
                    </div>
                    {posFulfillmentType === "dine_in" && (
                      <div className="flex justify-between">
                        <span>Table Surcharge</span>
                        <span className="font-mono">${getCartTotals().surcharge.toFixed(2)}</span>
                      </div>
                    )}
                    {posFulfillmentType === "delivery" && (
                      <div className="flex justify-between">
                        <span>Delivery Charge</span>
                        <span className="font-mono">${getCartTotals().deliveryFee.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Tax Surcharge ({posFulfillmentType === "dine_in" ? "10%" : "5%"})</span>
                      <span className="font-mono">${getCartTotals().taxAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-md font-black text-white pt-2 border-t border-dashed border-slate-800">
                      <span>Total Bill Amount</span>
                      <span className="font-mono text-emerald-400">${getCartTotals().totalAmount.toFixed(2)}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={!isCheckoutAllowed}
                    onClick={() => {
                      setPaymentMethod("cash");
                      setSplitCashAmount("");
                      setSplitCardAmount("");
                      setCheckoutSucceeded(false);
                      setCreatedReceipt(null);
                      setShowPaymentModal(true);
                    }}
                    className={`w-full py-2.5 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer font-sans text-white ${
                      isCheckoutAllowed
                        ? "bg-indigo-650 hover:bg-indigo-600"
                        : "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-750"
                    }`}
                  >
                    <DollarSign className="w-3.5 h-3.5" />
                    {!isCheckoutAllowed
                      ? (posFulfillmentType === "dine_in"
                          ? "Select Guest Table"
                          : "Fill Customer Info")
                      : "Settle Cash/Card Payment"}
                  </button>
                </div>
              );
            })()}
          </div>
        </div>
        )
      )}

    </div>
  )}

      {/* MODALS overlays for Cash movements, Rider settlements, Close till */}
      {showCashMovementModal && (
        <div className="fixed inset-0 z-[1000] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleRecordMovement} className="bg-white rounded-3xl p-6 w-full max-w-md border border-slate-100 shadow-xl space-y-4">
            <div className="flex items-center gap-2 text-indigo-650">
              <PlusCircle className="w-6 h-6 shrink-0 text-indigo-650" />
              <h3 className="text-md font-extrabold font-display text-indigo-650">Record Cash Movement (Till Audit)</h3>
            </div>
            
            <div className="space-y-3 text-xs text-slate-700">
              <div>
                <label className="block text-xxs font-bold text-slate-400 uppercase tracking-wider mb-1">Movement Type</label>
                <select
                  value={movementType}
                  onChange={(e) => setMovementType(e.target.value as any)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="paid_in">Paid In (Add cash float / coin rolls)</option>
                  <option value="paid_out">Paid Out (Drawer cash removal)</option>
                  <option value="safe_drop">Safe Drop (Transfer cash to secure safe)</option>
                  <option value="expense">Petty Cash Expense (Ingredient buy out / utilities)</option>
                </select>
              </div>

              <div>
                <label className="block text-xxs font-bold text-slate-400 uppercase tracking-wider mb-1">Category Label</label>
                <input
                  type="text"
                  required
                  value={movementCategory}
                  onChange={(e) => setMovementCategory(e.target.value)}
                  placeholder="e.g., Change float, Ice purchase, Supplier invoice..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xxs font-bold text-slate-400 uppercase tracking-wider mb-1">Cash Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={movementAmount}
                  onChange={(e) => setMovementAmount(e.target.value)}
                  placeholder="25.00"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-mono"
                />
              </div>

              <div>
                <label className="block text-xxs font-bold text-slate-400 uppercase tracking-wider mb-1">Justification Reason</label>
                <input
                  type="text"
                  required
                  value={movementReason}
                  onChange={(e) => setMovementReason(e.target.value)}
                  placeholder="Write clear reason for the audit trail..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
                />
              </div>

              {/* Only ask for manager pin for paid out/expense > 50 */}
              {(movementType === "paid_out" || movementType === "expense") && parseFloat(movementAmount) > 50 && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-xl space-y-2">
                  <span className="text-xxs font-bold text-red-700 block">MANAGER PIN OVERRIDE REQUIRED (Expenditures &gt; $50)</span>
                  <input
                    type="password"
                    required
                    value={movementManagerPin}
                    onChange={(e) => setMovementManagerPin(e.target.value)}
                    placeholder="Enter Manager PIN"
                    className="w-full p-2 bg-white border border-red-200 rounded-lg text-center font-mono tracking-widest text-slate-800"
                  />
                </div>
              )}
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => { setShowCashMovementModal(false); setMovementAmount(""); setMovementReason(""); setMovementManagerPin(""); }}
                className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl font-bold text-xs hover:bg-slate-50 cursor-pointer font-sans"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 bg-indigo-650 hover:bg-indigo-600 text-white rounded-xl font-bold text-xs cursor-pointer font-sans"
              >
                Submit Movement
              </button>
            </div>
          </form>
        </div>
      )}

      {showRiderSettlementModal && (
        <div className="fixed inset-0 z-[1000] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-2xl border border-slate-100 shadow-xl flex flex-col md:flex-row gap-6">
            
            {/* Left Column: Active Rider Outstanding Balances */}
            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-2 text-indigo-650">
                <Truck className="w-5 h-5 shrink-0 text-indigo-650" />
                <h4 className="text-xs font-black uppercase tracking-wider">Active Courier Balances</h4>
              </div>
              <p className="text-[10px] text-slate-400">COD Cash collections outstanding for delivery couriers in this active shift.</p>
              
              <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                {(() => {
                  const riders = activeShift?.liveStats?.deliverySummary?.riderBreakdown || [];
                  if (riders.length === 0) {
                    return (
                      <div className="text-center py-8 border border-dashed border-slate-200 rounded-2xl text-slate-400 text-xxs">
                        No delivery couriers dispatched yet.
                      </div>
                    );
                  }
                  return riders.map((r: any, idx: number) => (
                    <div 
                      key={idx}
                      onClick={() => {
                        setRiderNameSelect(r.riderName);
                        setRiderSettleAmount(r.outstandingCash.toString());
                      }}
                      className="p-3 bg-slate-50 hover:bg-indigo-50/50 border border-slate-200/60 rounded-2xl flex justify-between items-center cursor-pointer transition-all"
                    >
                      <div>
                        <p className="text-xs font-bold text-slate-800">{r.riderName}</p>
                        <p className="text-[10px] text-slate-400">{r.deliveryCount} dispatch{r.deliveryCount !== 1 ? 'es' : ''} · COD: ${r.cashLiability.toFixed(2)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-mono font-bold text-slate-950">${r.outstandingCash.toFixed(2)}</p>
                        <p className="text-[9px] font-semibold text-emerald-600">Settled: ${r.settledCash.toFixed(2)}</p>
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </div>

            {/* Right Column: Record Settlement Form */}
            <form onSubmit={handleRecordRiderSettlement} className="flex-1 space-y-4 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
              <div className="flex items-center gap-2 text-emerald-600">
                <DollarSign className="w-5 h-5 shrink-0 text-emerald-600" />
                <h3 className="text-sm font-extrabold font-display text-slate-800">Record Settlement</h3>
              </div>
              <p className="text-xxs text-slate-400">Record cash handed in by courier to reconcile and reduce their outstanding liability.</p>
              
              <div className="space-y-3 text-xs text-slate-700">
                <div>
                  <label className="block text-xxs font-bold text-slate-400 uppercase tracking-wider mb-1">Rider / Courier Name</label>
                  <input
                    type="text"
                    required
                    value={riderNameSelect}
                    onChange={(e) => setRiderNameSelect(e.target.value)}
                    placeholder="e.g., Rider Alex"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xxs font-bold text-slate-400 uppercase tracking-wider mb-1">Settled Amount Handed In ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={riderSettleAmount}
                    onChange={(e) => setRiderSettleAmount(e.target.value)}
                    placeholder="45.00"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-mono"
                  />
                </div>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowRiderSettlementModal(false); setRiderNameSelect(""); setRiderSettleAmount(""); }}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl font-bold text-xs hover:bg-slate-50 cursor-pointer font-sans"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-indigo-650 hover:bg-indigo-600 text-white rounded-xl font-bold text-xs cursor-pointer font-sans"
                >
                  Submit
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* Lock & Close Till Modal */}
      {showCloseShiftModal && activeShift && (
        <div className="fixed inset-0 z-[1000] bg-slate-900/70 backdrop-blur-xs flex items-start sm:items-center justify-center overflow-y-auto p-4 py-8 sm:p-6">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md border border-slate-100 shadow-2xl space-y-5 animate-scale-up my-auto">
            <div className="flex items-center gap-2.5 text-emerald-600 border-b border-slate-100 pb-3">
              <Lock className="w-5 h-5 shrink-0" />
              <div>
                <h3 className="text-md font-extrabold font-display text-slate-900">Lock & Close Till</h3>
                <p className="text-xxs text-slate-400">Shift Session #{activeShift.shiftNumber} · Terminal Reconciliation</p>
              </div>
            </div>

            {/* High-fidelity ESC/POS Thermal Receipt Paper */}
            <div id="escpos-thermal-receipt" className="relative bg-[#FAF9F5] text-slate-900 border border-slate-200/80 shadow-inner p-5 font-mono text-[11px] select-none rounded-md overflow-hidden ring-1 ring-slate-200">
              {/* Receipt Top Serrated Edge */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-repeat-x" style={{ backgroundImage: "linear-gradient(135deg, #e2dfd5 25%, transparent 25%), linear-gradient(225deg, #e2dfd5 25%, transparent 25%)", backgroundSize: "6px 6px" }}></div>
              
              <div className="pt-2 text-center space-y-0.5">
                <p className="font-bold text-xs tracking-widest text-slate-950">*** ESC/POS THERMAL REPORT ***</p>
                <p className="text-[9px] text-slate-500 uppercase tracking-tight">Shift Z-Closing Statement</p>
                <p className="text-[10px] text-slate-800 border-y border-dashed border-slate-300 py-1 my-1">
                  BRANCH: {(activeShift.branchName || "MAIN BRANCH").toUpperCase()}
                </p>
              </div>

              <div className="space-y-1 mt-3">
                <div className="flex justify-between">
                  <span>SHIFT ID:</span>
                  <span className="font-bold">{activeShift.id}</span>
                </div>
                <div className="flex justify-between">
                  <span>SHIFT NUMBER:</span>
                  <span className="font-bold">#{activeShift.shiftNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span>CASHIER NAME:</span>
                  <span className="font-bold">{activeShift.cashierName?.toUpperCase() || "STANDARD STAFF"}</span>
                </div>
                <div className="flex justify-between">
                  <span>STATION/REG:</span>
                  <span className="font-bold">{activeShift.registerName?.toUpperCase() || "REGISTER 1"}</span>
                </div>
                <div className="flex justify-between">
                  <span>OPENED TIME:</span>
                  <span className="font-bold">{activeShift.openedAt ? new Date(activeShift.openedAt).toLocaleString() : "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span>PRINTED AT:</span>
                  <span className="font-bold">{new Date().toLocaleString()}</span>
                </div>
              </div>

              {/* Monospace Divider */}
              <p className="text-slate-400 text-center my-2 select-none font-sans font-light tracking-widest">---------------------------------------</p>

              {/* SECTION: sales breakdown */}
              <div className="font-bold text-center text-[10px] uppercase text-slate-850 tracking-wider mb-2 bg-slate-200/50 py-0.5 rounded">
                [ SALES REVENUE BY METHOD ]
              </div>
              <div className="space-y-1 mb-2">
                <div className="flex justify-between">
                  <span>CASH SALES:</span>
                  <span className="font-bold">${(activeShift.liveStats?.paymentsBreakdown?.cash ?? 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>CARD/CREDIT SALES:</span>
                  <span className="font-bold">${(activeShift.liveStats?.paymentsBreakdown?.card ?? 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>LOYALTY SALES:</span>
                  <span className="font-bold">${(activeShift.liveStats?.paymentsBreakdown?.loyalty ?? 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t border-dotted border-slate-300 pt-1 text-slate-950 font-bold">
                  <span>TOTAL SALES REVENUE:</span>
                  <span className="font-bold">${(activeShift.liveStats?.totalSales ?? 0).toFixed(2)}</span>
                </div>
              </div>

              <p className="text-slate-400 text-center my-2 select-none font-sans font-light tracking-widest">---------------------------------------</p>

              {/* SECTION: drawer cash reconciliation flow */}
              <div className="font-bold text-center text-[10px] uppercase text-slate-850 tracking-wider mb-2 bg-slate-200/50 py-0.5 rounded">
                [ CASH DRAWER FLOW ]
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span>OPENING FLOAT CASH:</span>
                  <span className="font-bold text-slate-950">${activeShift.openingFloat?.toFixed(2) || "0.00"}</span>
                </div>
                <div className="flex justify-between text-emerald-700">
                  <span>(+) CASH SALES INFLOW:</span>
                  <span className="font-bold">
                    +${(activeShift.liveStats?.cashSummary?.cashSales ?? 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-rose-700">
                  <span>(-) CASH REFUNDS OUTFLOW:</span>
                  <span className="font-bold">
                    -${(activeShift.liveStats?.cashSummary?.cashRefunds ?? 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-emerald-700">
                  <span>(+) PAID INS / DROPS:</span>
                  <span className="font-bold">
                    +${(activeShift.liveStats?.cashSummary?.paidIn ?? 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-rose-700">
                  <span>(-) PAID OUTS (TILL):</span>
                  <span className="font-bold">
                    -${(activeShift.liveStats?.cashSummary?.paidOut ?? 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-rose-700">
                  <span>(-) SAFE DROPS:</span>
                  <span className="font-bold">
                    -${(activeShift.liveStats?.cashSummary?.safeDrops ?? 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-rose-700">
                  <span>(-) PETTY CASH EXPENSES:</span>
                  <span className="font-bold">
                    -${(activeShift.liveStats?.cashSummary?.expenses ?? 0).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Double-dashed Border representation */}
              <p className="text-slate-400 text-center my-2 select-none font-sans font-semibold tracking-widest">=======================================</p>

              <div className="flex justify-between text-[13px] font-black text-slate-950">
                <span>EXPECTED IN TILL:</span>
                <span>
                  ${(activeShift.liveStats?.cashSummary?.expectedInDrawer ?? activeShift.openingFloat).toFixed(2)}
                </span>
              </div>

              <p className="text-slate-400 text-center my-2 select-none font-sans font-light tracking-widest">---------------------------------------</p>
              
              <div className="text-center text-[9px] text-slate-500 space-y-0.5">
                <p>* MANDATORY SYSTEM AUDIT CHECK *</p>
                <p className="font-mono text-[8px] tracking-tight truncate select-all">{activeShift.id}</p>
              </div>

              {/* Receipt Bottom Serrated Edge */}
              <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-repeat-x" style={{ backgroundImage: "linear-gradient(45deg, #e2dfd5 25%, transparent 25%), linear-gradient(-45deg, #e2dfd5 25%, transparent 25%)", backgroundSize: "6px 6px" }}></div>
            </div>

            {/* Reconciliation inputs */}
            <form onSubmit={handleCloseShift} className="space-y-4">
              <div>
                <label className="block text-xxs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Physically Counted Cash in Drawer ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={declaredCountedCash}
                  onChange={(e) => setDeclaredCountedCash(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-mono text-center text-lg font-black focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Dynamic Variance Output */}
              {declaredCountedCash !== "" && (() => {
                const expected = activeShift.liveStats?.cashSummary?.expectedInDrawer ?? activeShift.openingFloat;
                const declaredNum = parseFloat(declaredCountedCash) || 0;
                const varianceVal = declaredNum - expected;
                const absoluteVariance = Math.abs(varianceVal);

                return (
                  <div className="space-y-3.5">
                    <div className={`p-3 rounded-xl border flex items-center justify-between text-xs font-bold ${
                      varianceVal === 0 
                        ? "bg-emerald-50 border-emerald-100 text-emerald-800" 
                        : absoluteVariance <= 5.00
                        ? "bg-amber-50 border-amber-100 text-amber-800"
                        : "bg-rose-50 border-rose-100 text-rose-800"
                    }`}>
                      <span>Calculated Till Discrepancy:</span>
                      <span className="font-mono">
                        {varianceVal === 0 
                          ? "$0.00 (Pristine Match)" 
                          : varianceVal > 0 
                          ? `+$${varianceVal.toFixed(2)} (Surplus)` 
                          : `-$${absoluteVariance.toFixed(2)} (Shortage)`
                        }
                      </span>
                    </div>

                    {/* Manager PIN authorization field if variance exceeds $5 */}
                    {absoluteVariance > 5.00 && (
                      <div className="space-y-1.5 p-3.5 bg-rose-50/50 border border-rose-150 rounded-2xl animate-fade-in">
                        <div className="flex items-center gap-1.5 text-rose-800 text-xxs font-black uppercase tracking-wider">
                          <AlertTriangle size={14} className="text-rose-600 shrink-0" />
                          Manager PIN Required
                        </div>
                        <p className="text-[10px] text-rose-700 leading-relaxed">
                          Discrepancy exceeds the allowed standard $5.00 threshold. An authorized Manager or Admin must input their PIN to approve this override.
                        </p>
                        <input
                          type="password"
                          required
                          maxLength={4}
                          placeholder="Enter 4-digit Manager PIN (e.g., 9999)"
                          value={closeManagerPin}
                          onChange={(e) => setCloseManagerPin(e.target.value)}
                          className="w-full mt-2 p-2.5 bg-white border border-rose-200 rounded-xl text-center font-mono text-xs focus:ring-1 focus:ring-rose-500 focus:outline-none"
                        />
                      </div>
                    )}
                  </div>
                );
              })()}

              <div className="flex gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCloseShiftModal(false);
                    setDeclaredCountedCash("");
                    setCloseManagerPin("");
                  }}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl font-bold text-xs hover:bg-slate-50 cursor-pointer font-sans"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isPrinting}
                  onClick={() => {
                    setIsPrinting(true);
                    setTimeout(() => {
                      setIsPrinting(false);
                      const printContent = document.getElementById("escpos-thermal-receipt");
                      if (printContent) {
                        const win = window.open("", "_blank");
                        if (win) {
                          win.document.write(`
                            <html>
                            <head>
                              <title>ESC/POS Shift Report #${activeShift.shiftNumber}</title>
                              <style>
                                body { font-family: monospace; padding: 20px; width: 300px; color: #000; background: #fff; }
                                p { margin: 4px 0; font-size: 11px; }
                                .text-center { text-align: center; }
                                .flex { display: flex; justify-content: space-between; }
                                .border-y { border-top: 1px dashed #000; border-bottom: 1px dashed #000; padding: 4px 0; }
                                .bold { font-weight: bold; }
                                .my-2 { margin: 8px 0; }
                                .text-emerald-700 { color: #00875a; }
                                .text-rose-700 { color: #de350b; }
                                .text-slate-950 { color: #000; font-weight: bold; }
                                .font-bold { font-weight: bold; }
                                .bg-slate-200\\/50 { background-color: #f1f5f9; padding: 2px; text-align: center; }
                                .truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
                              </style>
                            </head>
                            <body>
                              ${printContent.innerHTML}
                              <script>
                                window.onload = function() {
                                  window.print();
                                  setTimeout(function() { window.close(); }, 500);
                                };
                              </script>
                            </body>
                            </html>
                          `);
                          win.document.close();
                        }
                      }
                    }, 800);
                  }}
                  className="flex-1 py-2.5 border border-indigo-200 bg-indigo-55/40 hover:bg-indigo-100 text-indigo-700 rounded-xl font-bold text-xs cursor-pointer font-sans flex items-center justify-center gap-1.5"
                >
                  <Printer size={13} className={isPrinting ? "animate-spin" : ""} />
                  {isPrinting ? "Printing..." : "Print Receipt"}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-550 text-white rounded-xl font-bold text-xs cursor-pointer font-sans"
                >
                  Verify & Lock Till
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POS MODALS: Modifier Customizer Panel */}
      {showModifierModal && modifierModalItem && (
        <div className="fixed inset-0 z-[1100] bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-lg border border-slate-100 shadow-2xl space-y-5 animate-scale-up">
            <div className="border-b border-slate-100 pb-3">
              <span className="text-[9px] bg-indigo-100 text-indigo-700 px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider">Customize Item</span>
              <h3 className="text-base font-black text-slate-900 mt-1">{modifierModalItem.name}</h3>
              <p className="text-xxs text-slate-400 mt-0.5">{modifierModalItem.description}</p>
            </div>

            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1" id="modifier-groups-list">
              {modifierGroups
                .filter(group => modifierModalItem.modifierGroupIds?.includes(group.id))
                .map(group => {
                  const selections = modifierModalSelections[group.id] || [];
                  const remainingMax = group.maxSelections - selections.length;
                  return (
                    <div key={group.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-150 space-y-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                            {group.name}
                            {group.required && (
                              <span className="text-[9px] bg-red-100 text-red-600 px-1.5 py-0.2 rounded font-black uppercase">Required</span>
                            )}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            Select {group.minSelections === group.maxSelections ? group.minSelections : `${group.minSelections} to ${group.maxSelections}`} options
                          </span>
                        </div>
                        <span className="text-xxs text-slate-400 font-bold font-mono">
                          {selections.length}/{group.maxSelections}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {group.options.map((opt: any) => {
                          const isSelected = selections.includes(opt.id);
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => {
                                let updated = [...selections];
                                if (isSelected) {
                                  updated = updated.filter(id => id !== opt.id);
                                } else {
                                  if (group.maxSelections === 1) {
                                    updated = [opt.id];
                                  } else if (selections.length < group.maxSelections) {
                                    updated.push(opt.id);
                                  } else {
                                    alert(`Max selection limit of ${group.maxSelections} reached for ${group.name}.`);
                                    return;
                                  }
                                }
                                setModifierModalSelections({
                                  ...modifierModalSelections,
                                  [group.id]: updated
                                });
                              }}
                              className={`p-2.5 rounded-xl border text-left text-xxs font-bold transition-all flex justify-between items-center cursor-pointer ${isSelected ? "bg-indigo-50 border-indigo-300 text-indigo-750 shadow-xxs" : "bg-white border-slate-200 text-slate-650 hover:bg-slate-50"}`}
                            >
                              <span>{opt.name}</span>
                              <span className="font-mono text-slate-400">
                                {opt.price > 0 ? `+$${opt.price.toFixed(2)}` : "Free"}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

              {/* Kitchen notes textbox */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kitchen prep notes:</label>
                <input
                  type="text"
                  value={modifierModalNotes}
                  onChange={(e) => setModifierModalNotes(e.target.value)}
                  placeholder="e.g. Well done, no onions, sauce on the side..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xxs text-slate-850"
                />
              </div>
            </div>

            <div className="flex gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setShowModifierModal(false);
                  setModifierModalItem(null);
                }}
                className="flex-1 py-2.5 border border-slate-200 text-slate-650 rounded-xl font-bold text-xs hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmModifiers}
                className="flex-1 py-2.5 bg-indigo-650 hover:bg-indigo-600 text-white rounded-xl font-bold text-xs cursor-pointer"
              >
                Apply & Add to Cart
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POS MODALS: Payment Tender & Thermal Receipt Screen */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-[1150] bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-2xl border border-slate-100 shadow-2xl grid grid-cols-1 md:grid-cols-12 gap-6 animate-scale-up">
            
            {/* Left side: Settlement Tender Selection */}
            <div className="md:col-span-7 space-y-4">
              <div className="border-b border-slate-100 pb-2">
                <h3 className="text-base font-black text-slate-900 flex items-center gap-1.5">
                  <DollarSign className="w-5 h-5 text-indigo-600" />
                  Settle Cashier Ticket
                </h3>
                <p className="text-xxs text-slate-400">Select payment method and split tenders before finalizing order.</p>
              </div>

              {!checkoutSucceeded ? (
                <div className="space-y-4">
                  {/* Tender buttons */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("cash")}
                      className={`p-3 rounded-xl border font-bold text-xs flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${paymentMethod === "cash" ? "bg-emerald-50 border-emerald-300 text-emerald-800 shadow-xxs" : "bg-white border-slate-200 text-slate-650 hover:bg-slate-50"}`}
                    >
                      <DollarSign className="w-5 h-5" />
                      Cash Payment
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("card")}
                      className={`p-3 rounded-xl border font-bold text-xs flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${paymentMethod === "card" ? "bg-indigo-50 border-indigo-300 text-indigo-800 shadow-xxs" : "bg-white border-slate-200 text-slate-650 hover:bg-slate-50"}`}
                    >
                      <Receipt className="w-5 h-5" />
                      Card Terminal
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("split")}
                      className={`p-3 rounded-xl border font-bold text-xs flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${paymentMethod === "split" ? "bg-amber-50 border-amber-300 text-amber-800 shadow-xxs" : "bg-white border-slate-200 text-slate-650 hover:bg-slate-50"}`}
                    >
                      <Sliders className="w-5 h-5" />
                      Split Tender
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("loyalty")}
                      className={`p-3 rounded-xl border font-bold text-xs flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${paymentMethod === "loyalty" ? "bg-indigo-55/10 border-indigo-300 text-indigo-850 shadow-xxs" : "bg-white border-slate-200 text-slate-650 hover:bg-slate-50"}`}
                    >
                      <Sparkles className="w-5 h-5 text-indigo-500" />
                      Loyalty Redeem
                    </button>
                  </div>

                  {/* Split payment inputs */}
                  {paymentMethod === "split" && (
                    <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-100 space-y-3 animate-fade-in">
                      <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">Split cash & card ratios:</span>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="block text-[10px] font-bold text-slate-400 uppercase">Cash Portion ($)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={splitCashAmount}
                            onChange={(e) => setSplitCashAmount(e.target.value)}
                            placeholder="0.00"
                            className="w-full p-2 bg-white border border-slate-200 rounded-lg text-slate-800 font-mono text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-[10px] font-bold text-slate-400 uppercase">Card Portion ($)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={splitCardAmount}
                            onChange={(e) => setSplitCardAmount(e.target.value)}
                            placeholder="0.00"
                            className="w-full p-2 bg-white border border-slate-200 rounded-lg text-slate-800 font-mono text-xs"
                          />
                        </div>
                      </div>

                      {/* Split validation message */}
                      {(() => {
                        const totalPaidSum = (parseFloat(splitCashAmount) || 0) + (parseFloat(splitCardAmount) || 0);
                        const expected = getCartTotals().totalAmount;
                        const diff = totalPaidSum - expected;
                        return (
                          <div className="text-[10px] font-bold flex justify-between pt-1 border-t border-amber-100">
                            <span>Settle Target: ${expected.toFixed(2)}</span>
                            {Math.abs(diff) < 0.05 ? (
                              <span className="text-emerald-700">✓ Tender amounts match perfectly!</span>
                            ) : (
                              <span className="text-rose-600">
                                Mismatch: {diff > 0 ? "+" : ""}${diff.toFixed(2)} remaining
                              </span>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {/* Settle summary */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-150 text-xs text-slate-700 space-y-2 font-semibold">
                    <div className="flex justify-between">
                      <span>POS Shift Terminal ID</span>
                      <span className="font-mono text-slate-450">{activeShift?.registerId || "register_1"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Cashier Attendant</span>
                      <span className="font-sans text-slate-800">{activeShift?.cashierName || "Standard waiter"}</span>
                    </div>
                    <div className="flex justify-between text-base font-black text-slate-900 pt-2 border-t border-slate-200">
                      <span>Total Tender Required</span>
                      <span className="font-mono text-indigo-650">${getCartTotals().totalAmount.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="flex gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowPaymentModal(false)}
                      className="flex-1 py-3 border border-slate-200 text-slate-650 rounded-xl font-bold text-xs hover:bg-slate-50 cursor-pointer"
                    >
                      Go Back
                    </button>
                    <button
                      type="button"
                      onClick={handleCheckoutSubmit}
                      className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-555 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Finalize & Print
                    </button>
                  </div>
                </div>
              ) : (
                /* Post payment feedback view */
                <div className="text-center py-8 space-y-4 animate-scale-up">
                  <div className="h-12 w-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900">Payment Succeeded!</h4>
                    <p className="text-xxs text-slate-400 mt-1 max-w-[240px] mx-auto">Ticket settled successfully. The order has been fired to the Chef kitchen queue.</p>
                  </div>

                  <button
                    type="button"
                    onClick={handleResetPOS}
                    className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs cursor-pointer"
                  >
                    Close & Finish Session
                  </button>
                </div>
              )}
            </div>

            {/* Right side: Virtual Thermal Receipt preview */}
            <div className="md:col-span-5 bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col gap-3 min-h-[360px]">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block border-b border-slate-200 pb-1">Virtual Thermal Receipt</span>
              
              <div className="bg-white border border-slate-200/80 p-5 rounded-lg shadow-xxs font-mono text-[9px] text-slate-700 space-y-3 relative overflow-hidden flex-1 flex flex-col justify-between" id="thermal-receipt-view">
                
                {/* Simulated thermal receipt paper texture and design style */}
                <div className="space-y-3">
                  <div className="text-center space-y-0.5 border-b border-dashed border-slate-300 pb-3">
                    <h5 className="font-extrabold text-slate-900 uppercase tracking-widest text-[10px]">SAAS RESTAURANT</h5>
                    <p className="text-xxs text-slate-400 font-semibold">123 Culinary Boulevard</p>
                    <p className="text-xxs text-slate-400 font-semibold">Terminal Ref: #{activeShift?.registerId || "REGISTER_1"}</p>
                    <p className="text-xxs text-slate-400 font-semibold mt-1">
                      {createdReceipt ? new Date(createdReceipt.createdAt || Date.now()).toLocaleTimeString() : new Date().toLocaleTimeString()}
                    </p>
                  </div>

                  {/* Customer details on receipt */}
                  {posFulfillmentType !== "dine_in" && (posCustomerName || posCustomerPhone) && (
                    <div className="border-b border-dashed border-slate-300 pb-2 text-[8px] text-slate-500 space-y-0.5">
                      <p className="font-bold text-slate-800">CUSTOMER DETAILS:</p>
                      {posCustomerName && <p>Name: {posCustomerName}</p>}
                      {posCustomerPhone && <p>Phone: {posCustomerPhone}</p>}
                      {posFulfillmentType === "delivery" && (
                        <>
                          <p className="font-bold text-slate-800 mt-1">DELIVERY ADDRESS:</p>
                          <p>Region: {posDeliveryRegion}</p>
                          <p>Street: {posDeliveryStreet}</p>
                          <p>Bldg/Lid: {posDeliveryBldgLandmark}</p>
                          <p>Apt/App: {posDeliveryAptSuite}</p>
                          <p>Floor: {posDeliveryFloor}</p>
                        </>
                      )}
                    </div>
                  )}

                  {/* Receipt ticket items */}
                  <div className="space-y-1.5">
                    {posCart.map((it, idx) => {
                      const mPrice = it.modifiers.reduce((sum: number, m: any) => sum + m.price, 0);
                      const totalItemVal = it.price + mPrice;
                      return (
                        <div key={idx} className="space-y-0.5">
                          <div className="flex justify-between items-start">
                            <span className="font-semibold line-clamp-1 max-w-[120px]">
                              {it.quantity}x {it.name}
                            </span>
                            <span className="shrink-0 font-bold text-slate-800">${(totalItemVal * it.quantity).toFixed(2)}</span>
                          </div>
                          {it.modifiers.length > 0 && (
                            <div className="pl-2 space-y-0.2">
                              {it.modifiers.map((m: any, mIdx: number) => (
                                <p key={mIdx} className="text-[8px] text-slate-400 font-medium">
                                  + {m.optionName}
                                </p>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Calculations breakdown */}
                  <div className="border-t border-dashed border-slate-300 pt-2.5 space-y-1">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>${getCartTotals().subtotal.toFixed(2)}</span>
                    </div>
                    {posFulfillmentType === "dine_in" && (
                      <div className="flex justify-between">
                        <span>Service Surcharge</span>
                        <span>${getCartTotals().surcharge.toFixed(2)}</span>
                      </div>
                    )}
                    {posFulfillmentType === "delivery" && (
                      <div className="flex justify-between">
                        <span>Delivery Charge</span>
                        <span>${getCartTotals().deliveryFee.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>TAX / VAT ({posFulfillmentType === "dine_in" ? "10%" : "5%"})</span>
                      <span>${getCartTotals().taxAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-black text-slate-900 pt-1.5 border-t border-dashed border-slate-300">
                      <span>GRAND TOTAL</span>
                      <span>${getCartTotals().totalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-dashed border-slate-300 pt-3 text-center text-xxs font-black text-slate-400 space-y-1 uppercase">
                  <p>Tender Settle Method: {checkoutSucceeded ? paymentMethod : "UNPAID"}</p>
                  <p className="tracking-widest">--- THANK YOU ---</p>
                </div>
              </div>
            </div>
            
          </div>
        </div>
      )}

    </div>
  );
}
