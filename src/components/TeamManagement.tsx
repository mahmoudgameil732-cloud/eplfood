import React, { useState, useEffect } from "react";
import {
  Users,
  Search,
  UserPlus,
  Filter,
  RefreshCw,
  X,
  Mail,
  Shield,
  Clock,
  MapPin,
  CheckCircle,
  AlertTriangle,
  Lock,
  Plus,
  Trash2,
  FileText,
  Activity,
  DollarSign,
  Smartphone,
  Globe,
  Monitor,
  Check,
  ChevronRight,
  Info
} from "lucide-react";

export type UserRole =
  | "tenant_owner"
  | "tenant_admin"
  | "branch_manager"
  | "cashier"
  | "kitchen"
  | "rider"
  | "hr_manager"
  | "accountant";

export type OnboardingStatus =
  | "invitation_sent"
  | "invitation_accepted"
  | "pin_set"
  | "active"
  | "deactivated";

export interface ScopeHistoryEntry {
  changeId: string;
  changedAt: string; // ISO UTC
  changedBy: string;
  changedByRole: string;
  previousRole: string;
  newRole: string;
  previousBranchIds: string[];
  newBranchIds: string[];
  reason: string;
}

export interface ActiveSession {
  sessionId: string;
  deviceInfo: {
    platform: "web" | "ios" | "android" | "pos_terminal";
    userAgent: string;
    appVersion: string;
  };
  ipAddress: string;
  loginAt: string; // ISO UTC
  lastSeenAt: string; // ISO UTC
  isActive: boolean;
}

export interface ProvisionedStaffUser {
  userId: string;
  firstName: string;
  lastName: string;
  displayName: string;
  email: string;
  phone: string;
  role: UserRole;
  branchIds: string[];
  branchNames: string[];
  isActive: boolean;
  onboardingStatus: OnboardingStatus;
  lastLoginAt: string | null;
  invitationStatus: "pending" | "accepted" | "expired" | "revoked" | null;
  invitationExpiresAt: string | null;
  resendCount: number;
  createdAt: string;
  provisionedBy: string;
  provisionedByName: string;
  provisionedByRole: string;
  hourlyRate: number | null;
  weeklyHourTarget: number | null;
  notes: string | null;
  mustChangePasswordOnNextLogin: boolean;
  scopeHistory: ScopeHistoryEntry[];
  sessions: ActiveSession[];
}

const AVAILABLE_BRANCHES = [
  { id: "branch-a", name: "الفرع الرئيسي (Main Cairo)" },
  { id: "branch-b", name: "Maadi Branch" },
  { id: "branch-c", name: "Heliopolis Branch" },
  { id: "branch-d", name: "Alexandria Coastal Branch" },
];

const ROLE_DISPLAY: Record<UserRole, { label: string; color: string; desc: string }> = {
  tenant_owner: { label: "Tenant Owner", color: "bg-red-50 text-red-700 border-red-200", desc: "Full access to tenant-wide operations, billing, and all branches." },
  tenant_admin: { label: "Tenant Admin", color: "bg-indigo-50 text-indigo-700 border-indigo-200", desc: "Delegated administrative access across all tenant branches." },
  branch_manager: { label: "Branch Manager", color: "bg-amber-50 text-amber-700 border-amber-200", desc: "Manages staff, inventory, shifts and reports for assigned branches." },
  cashier: { label: "Cashier", color: "bg-emerald-50 text-emerald-700 border-emerald-200", desc: "FOH order taking, checkout, till control, and cash movements." },
  kitchen: { label: "Kitchen Crew", color: "bg-cyan-50 text-cyan-700 border-cyan-200", desc: "KDS status updates, recipe guide access, and item preparation." },
  rider: { label: "Delivery Rider", color: "bg-pink-50 text-pink-700 border-pink-200", desc: "Assigned delivery route handling and dropoff state triggers." },
  hr_manager: { label: "HR Manager", color: "bg-purple-50 text-purple-700 border-purple-200", desc: "Access to schedules, attendance trackers, payroll, and rates." },
  accountant: { label: "Accountant", color: "bg-slate-50 text-slate-700 border-slate-200", desc: "Read-only access to profit reports, cost margins, and void logs." },
};

const INITIAL_MOCK_USERS: ProvisionedStaffUser[] = [
  {
    userId: "u-owner-001",
    firstName: "Mahmoud",
    lastName: "Gameil",
    displayName: "Mahmoud Gameil",
    email: "mahmoudgameil732@gmail.com",
    phone: "+201012345678",
    role: "tenant_owner",
    branchIds: ["*"],
    branchNames: ["All Branches (tenant-wide)"],
    isActive: true,
    onboardingStatus: "active",
    lastLoginAt: "2026-06-27T00:10:00Z",
    invitationStatus: null,
    invitationExpiresAt: null,
    resendCount: 0,
    createdAt: "2026-01-15T08:00:00Z",
    provisionedBy: "platform-admin-system",
    provisionedByName: "Platform Administrator",
    provisionedByRole: "platform_admin",
    hourlyRate: 150,
    weeklyHourTarget: 48,
    notes: "Primary account holder and platform system owner.",
    mustChangePasswordOnNextLogin: false,
    scopeHistory: [
      {
        changeId: "sh-001",
        changedAt: "2026-01-15T08:00:00Z",
        changedBy: "platform-admin-system",
        changedByRole: "platform_admin",
        previousRole: "none",
        newRole: "tenant_owner",
        previousBranchIds: [],
        newBranchIds: ["*"],
        reason: "Initial platform onboarding and subscription provisioning."
      }
    ],
    sessions: [
      {
        sessionId: "sess-01",
        deviceInfo: { platform: "web", userAgent: "Chrome 124.0.0 (macOS)", appVersion: "v2.4.1" },
        ipAddress: "197.34.200.12",
        loginAt: "2026-06-27T00:10:00Z",
        lastSeenAt: "2026-06-27T00:22:48-07:00",
        isActive: true
      }
    ]
  },
  {
    userId: "u-admin-002",
    firstName: "Omar",
    lastName: "Al-Fayed",
    displayName: "Omar Al-Fayed",
    email: "o.fayed@gourmet-group.com",
    phone: "+201287654321",
    role: "tenant_admin",
    branchIds: ["*"],
    branchNames: ["All Branches (tenant-wide)"],
    isActive: true,
    onboardingStatus: "active",
    lastLoginAt: "2026-06-26T18:45:00Z",
    invitationStatus: "accepted",
    invitationExpiresAt: null,
    resendCount: 1,
    createdAt: "2026-02-10T11:30:00Z",
    provisionedBy: "u-owner-001",
    provisionedByName: "Mahmoud Gameil",
    provisionedByRole: "tenant_owner",
    hourlyRate: 85,
    weeklyHourTarget: 40,
    notes: "Chief Operations Director. Handles overall team rosters.",
    mustChangePasswordOnNextLogin: false,
    scopeHistory: [
      {
        changeId: "sh-002",
        changedAt: "2026-02-10T11:30:00Z",
        changedBy: "u-owner-001",
        changedByRole: "tenant_owner",
        previousRole: "none",
        newRole: "tenant_admin",
        previousBranchIds: [],
        newBranchIds: ["*"],
        reason: "Onboarded as Senior Operations Director to manage all Cairo locations."
      }
    ],
    sessions: [
      {
        sessionId: "sess-02",
        deviceInfo: { platform: "web", userAgent: "Firefox 125.0 (Windows)", appVersion: "v2.4.1" },
        ipAddress: "196.42.15.54",
        loginAt: "2026-06-26T18:45:00Z",
        lastSeenAt: "2026-06-26T21:00:00Z",
        isActive: false
      }
    ]
  },
  {
    userId: "u-mgr-003",
    firstName: "Youssef",
    lastName: "Mansour",
    displayName: "Youssef Mansour",
    email: "y.mansour@gourmet-group.com",
    phone: "+201199887766",
    role: "branch_manager",
    branchIds: ["branch-a", "branch-b"],
    branchNames: ["الفرع الرئيسي (Main Cairo)", "Maadi Branch"],
    isActive: true,
    onboardingStatus: "active",
    lastLoginAt: "2026-06-26T23:30:00Z",
    invitationStatus: "accepted",
    invitationExpiresAt: null,
    resendCount: 0,
    createdAt: "2026-03-01T09:15:00Z",
    provisionedBy: "u-admin-002",
    provisionedByName: "Omar Al-Fayed",
    provisionedByRole: "tenant_admin",
    hourlyRate: 55,
    weeklyHourTarget: 48,
    notes: "Manages both Main Cairo and Maadi hubs.",
    mustChangePasswordOnNextLogin: false,
    scopeHistory: [
      {
        changeId: "sh-003",
        changedAt: "2026-03-01T09:15:00Z",
        changedBy: "u-admin-002",
        changedByRole: "tenant_admin",
        previousRole: "none",
        newRole: "branch_manager",
        previousBranchIds: [],
        newBranchIds: ["branch-a"],
        reason: "Initial hire as General Manager of Cairo Main."
      },
      {
        changeId: "sh-004",
        changedAt: "2026-05-15T14:00:00Z",
        changedBy: "u-owner-001",
        changedByRole: "tenant_owner",
        previousRole: "branch_manager",
        newRole: "branch_manager",
        previousBranchIds: ["branch-a"],
        newBranchIds: ["branch-a", "branch-b"],
        reason: "Granted multi-branch scope extension to support Maadi opening."
      }
    ],
    sessions: [
      {
        sessionId: "sess-03",
        deviceInfo: { platform: "android", userAgent: "Gourmet POS Terminal App", appVersion: "v1.9.0" },
        ipAddress: "197.45.10.22",
        loginAt: "2026-06-26T23:30:00Z",
        lastSeenAt: "2026-06-27T00:20:00Z",
        isActive: true
      }
    ]
  },
  {
    userId: "u-cash-004",
    firstName: "Nour",
    lastName: "El-Din",
    displayName: "Nour El-Din",
    email: "nour.cashier@gourmet-group.com",
    phone: "+201024681357",
    role: "cashier",
    branchIds: ["branch-a"],
    branchNames: ["الفرع الرئيسي (Main Cairo)"],
    isActive: true,
    onboardingStatus: "active",
    lastLoginAt: "2026-06-26T12:00:00Z",
    invitationStatus: "accepted",
    invitationExpiresAt: null,
    resendCount: 0,
    createdAt: "2026-04-20T14:00:00Z",
    provisionedBy: "u-mgr-003",
    provisionedByName: "Youssef Mansour",
    provisionedByRole: "branch_manager",
    hourlyRate: 35,
    weeklyHourTarget: 40,
    notes: "Main cashier. Holds shift drawer keys.",
    mustChangePasswordOnNextLogin: false,
    scopeHistory: [
      {
        changeId: "sh-005",
        changedAt: "2026-04-20T14:00:00Z",
        changedBy: "u-mgr-003",
        changedByRole: "branch_manager",
        previousRole: "none",
        newRole: "cashier",
        previousBranchIds: [],
        newBranchIds: ["branch-a"],
        reason: "Assigned as primary cashier for Main branch."
      }
    ],
    sessions: []
  },
  {
    userId: "u-inv-005",
    firstName: "Mariam",
    lastName: "Ghaly",
    displayName: "Mariam Ghaly",
    email: "m.ghaly@gourmet-group.com",
    phone: "+201533557799",
    role: "kitchen",
    branchIds: ["branch-b"],
    branchNames: ["Maadi Branch"],
    isActive: true,
    onboardingStatus: "invitation_sent",
    lastLoginAt: null,
    invitationStatus: "pending",
    invitationExpiresAt: "2026-06-30T00:30:00Z",
    resendCount: 0,
    createdAt: "2026-06-27T00:30:00Z",
    provisionedBy: "u-owner-001",
    provisionedByName: "Mahmoud Gameil",
    provisionedByRole: "tenant_owner",
    hourlyRate: 38,
    weeklyHourTarget: 45,
    notes: "Incoming Chef de Partie for Maadi branch.",
    mustChangePasswordOnNextLogin: true,
    scopeHistory: [
      {
        changeId: "sh-006",
        changedAt: "2026-06-27T00:30:00Z",
        changedBy: "u-owner-001",
        changedByRole: "tenant_owner",
        previousRole: "none",
        newRole: "kitchen",
        previousBranchIds: [],
        newBranchIds: ["branch-b"],
        reason: "Hired to lead hot prep kitchen in Maadi branch."
      }
    ],
    sessions: []
  },
  {
    userId: "u-inv-006",
    firstName: "Tarek",
    lastName: "Hegazi",
    displayName: "Tarek Hegazi",
    email: "t.hegazi@gourmet-group.com",
    phone: "+201211223344",
    role: "rider",
    branchIds: ["branch-d"],
    branchNames: ["Alexandria Coastal Branch"],
    isActive: true,
    onboardingStatus: "invitation_sent",
    lastLoginAt: null,
    invitationStatus: "expired",
    invitationExpiresAt: "2026-06-25T11:00:00Z",
    resendCount: 3,
    createdAt: "2026-06-22T11:00:00Z",
    provisionedBy: "u-admin-002",
    provisionedByName: "Omar Al-Fayed",
    provisionedByRole: "tenant_admin",
    hourlyRate: 25,
    weeklyHourTarget: 35,
    notes: "Delivery pilot. Invitation expired before login completed.",
    mustChangePasswordOnNextLogin: true,
    scopeHistory: [],
    sessions: []
  }
];

export function TeamManagement() {
  const [users, setUsers] = useState<ProvisionedStaffUser[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [branchFilter, setBranchFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Selection states
  const [selectedUser, setSelectedUser] = useState<ProvisionedStaffUser | null>(null);
  const [detailTab, setDetailTab] = useState<"profile" | "history" | "security">("profile");

  // Modal / Panel states
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showEditScopeModal, setShowEditScopeModal] = useState(false);

  // Notifications
  const [alert, setAlert] = useState<{ type: "success" | "error" | "info"; msg: string } | null>(null);

  // Invite Form fields
  const [inviteForm, setInviteForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    role: "cashier" as UserRole,
    selectedBranches: [] as string[],
    hourlyRate: "",
    weeklyHourTarget: "40",
    notes: ""
  });

  // Edit Scope form fields
  const [scopeForm, setScopeForm] = useState({
    role: "cashier" as UserRole,
    selectedBranches: [] as string[],
    reason: ""
  });

  // Load staff initially from local storage or mock data
  useEffect(() => {
    const stored = localStorage.getItem("gourmet_provisioned_staff");
    if (stored) {
      try {
        setUsers(JSON.parse(stored));
      } catch (e) {
        setUsers(INITIAL_MOCK_USERS);
      }
    } else {
      setUsers(INITIAL_MOCK_USERS);
      localStorage.setItem("gourmet_provisioned_staff", JSON.stringify(INITIAL_MOCK_USERS));
    }
  }, []);

  const saveUsers = (updated: ProvisionedStaffUser[]) => {
    setUsers(updated);
    localStorage.setItem("gourmet_provisioned_staff", JSON.stringify(updated));
  };

  const triggerAlert = (type: "success" | "error" | "info", msg: string) => {
    setAlert({ type, msg });
    setTimeout(() => setAlert(null), 4500);
  };

  // Resend invitation
  const handleResendInvitation = (userId: string) => {
    const target = users.find(u => u.userId === userId);
    if (!target) return;

    if (target.resendCount >= 3) {
      triggerAlert("error", `Maximum resend limit (3) exceeded for ${target.email}.`);
      return;
    }

    const updated = users.map(u => {
      if (u.userId === userId) {
        const count = u.resendCount + 1;
        // Extend expiry by 72 hours
        const newExpiry = new Date();
        newExpiry.setHours(newExpiry.getHours() + 72);
        return {
          ...u,
          resendCount: count,
          invitationStatus: "pending" as const,
          invitationExpiresAt: newExpiry.toISOString(),
          onboardingStatus: "invitation_sent" as const
        };
      }
      return u;
    });

    saveUsers(updated);
    triggerAlert("success", `Onboarding invitation re-sent to ${target.email} (Attempt ${target.resendCount + 1}/3)`);

    // Audit logs simulation
    const logStr = `USER_INVITATION_RESENT: Invitation re-sent to ${target.email} by Mahmoud Gameil (tenant_owner). Attempt count: ${target.resendCount + 1}`;
    console.log("[Audit Server Log]", logStr);
  };

  // Reset password
  const handleResetPassword = (userId: string) => {
    const target = users.find(u => u.userId === userId);
    if (!target) return;

    const updated = users.map(u => {
      if (u.userId === userId) {
        return {
          ...u,
          mustChangePasswordOnNextLogin: true
        };
      }
      return u;
    });

    saveUsers(updated);
    triggerAlert("success", `Secure password reset link generated for ${target.email}. Token sent to inbox.`);
    
    // Audit logs simulation
    console.log("[Audit Server Log]", `PASSWORD_RESET_INITIATED: Reset triggered for ${target.email} by Mahmoud Gameil.`);
  };

  // Revoke all sessions
  const handleRevokeAllSessions = (userId: string) => {
    const updated = users.map(u => {
      if (u.userId === userId) {
        const resetSessions = u.sessions.map(s => ({ ...s, isActive: false }));
        return {
          ...u,
          sessions: resetSessions
        };
      }
      return u;
    });

    saveUsers(updated);
    if (selectedUser?.userId === userId) {
      setSelectedUser(prev => prev ? { ...prev, sessions: prev.sessions.map(s => ({ ...s, isActive: false })) } : null);
    }
    triggerAlert("success", `Revoked all active sessions and refresh tokens for this user. Force logouts completed.`);
    console.log("[Audit Server Log]", `USER_SESSIONS_REVOKED: Refresh tokens revoked for UID ${userId}`);
  };

  // Toggle soft deactivation (active/deactive)
  const handleToggleDeactivate = (userId: string) => {
    const target = users.find(u => u.userId === userId);
    if (!target) return;

    if (target.role === "tenant_owner") {
      triggerAlert("error", "The primary Tenant Owner account cannot be deactivated. Platform Admin authorization is required.");
      return;
    }

    const updated = users.map(u => {
      if (u.userId === userId) {
        const nextActive = !u.isActive;
        const nextStatus = nextActive ? "active" : "deactivated";
        
        // Append history log
        const historyEntry: ScopeHistoryEntry = {
          changeId: `sh-change-${Date.now()}`,
          changedAt: new Date().toISOString(),
          changedBy: "u-owner-001",
          changedByRole: "tenant_owner",
          previousRole: u.role,
          newRole: u.role,
          previousBranchIds: u.branchIds,
          newBranchIds: u.branchIds,
          reason: nextActive ? "User account reactivated by system administrator." : "User deactivated. Terminated status set, revoked token access."
        };

        return {
          ...u,
          isActive: nextActive,
          onboardingStatus: nextStatus as OnboardingStatus,
          invitationStatus: nextActive ? u.invitationStatus : null,
          sessions: nextActive ? u.sessions : u.sessions.map(s => ({ ...s, isActive: false })),
          scopeHistory: [historyEntry, ...u.scopeHistory]
        };
      }
      return u;
    });

    saveUsers(updated);
    
    const wasActive = target.isActive;
    triggerAlert(wasActive ? "error" : "success", wasActive ? `Deactivated user ${target.displayName} and disabled credentials.` : `Reactivated user ${target.displayName}.`);
    
    if (selectedUser?.userId === userId) {
      const updatedUser = updated.find(u => u.userId === userId) || null;
      setSelectedUser(updatedUser);
    }

    console.log("[Audit Server Log]", wasActive ? `USER_DEACTIVATED: Deactivated UID ${userId} by Mahmoud Gameil` : `USER_REACTIVATED: Reactivated UID ${userId}`);
  };

  // Save new role/branches scope edit
  const handleSaveScopeEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    if (scopeForm.reason.trim().length < 10) {
      triggerAlert("error", "Please provide a descriptive reason for this scope modification (minimum 10 characters).");
      return;
    }

    // Role-specific branch checking
    const finalBranches = [...scopeForm.selectedBranches];
    if (scopeForm.role === "tenant_admin" && finalBranches.length === 0) {
      finalBranches.push("*");
    }

    if (scopeForm.role !== "tenant_admin" && finalBranches.includes("*")) {
      triggerAlert("error", "Only Tenant Admins can hold a wildcard ('*') branch scope.");
      return;
    }

    // Validate Branch Assignment UI Rules:
    // Operational roles (cashier, kitchen, rider) MUST have exactly 1 branch
    const isOperational = ["cashier", "kitchen", "rider"].includes(scopeForm.role);
    if (isOperational && finalBranches.length !== 1) {
      triggerAlert("error", `${ROLE_DISPLAY[scopeForm.role].label} must be assigned to exactly ONE branch.`);
      return;
    }

    // Managers, HR, Accountant must have at least 1 branch
    const isMultiScoped = ["branch_manager", "hr_manager", "accountant"].includes(scopeForm.role);
    if (isMultiScoped && finalBranches.length === 0) {
      triggerAlert("error", `${ROLE_DISPLAY[scopeForm.role].label} requires at least one assigned branch.`);
      return;
    }

    // Map branchNames
    const branchNames = finalBranches.includes("*")
      ? ["All Branches (tenant-wide)"]
      : AVAILABLE_BRANCHES.filter(b => finalBranches.includes(b.id)).map(b => b.name);

    const historyEntry: ScopeHistoryEntry = {
      changeId: `sh-change-${Date.now()}`,
      changedAt: new Date().toISOString(),
      changedBy: "u-owner-001",
      changedByRole: "tenant_owner",
      previousRole: selectedUser.role,
      newRole: scopeForm.role,
      previousBranchIds: selectedUser.branchIds,
      newBranchIds: finalBranches,
      reason: scopeForm.reason
    };

    const updated = users.map(u => {
      if (u.userId === selectedUser.userId) {
        return {
          ...u,
          role: scopeForm.role,
          branchIds: finalBranches,
          branchNames,
          scopeHistory: [historyEntry, ...u.scopeHistory],
          // Revoke active sessions to enforce fresh token claims immediately
          sessions: u.sessions.map(s => ({ ...s, isActive: false }))
        };
      }
      return u;
    });

    saveUsers(updated);
    const updatedUser = updated.find(u => u.userId === selectedUser.userId) || null;
    setSelectedUser(updatedUser);
    setShowEditScopeModal(false);
    triggerAlert("success", `Successfully updated user scope to ${ROLE_DISPLAY[scopeForm.role].label} and refreshed JWT token claims.`);
    console.log("[Audit Server Log]", `USER_ROLE_CHANGED: Scope modified for UID ${selectedUser.userId}. Snapshot saved.`);
  };

  // Handle invitation invite submissions
  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!inviteForm.firstName || !inviteForm.lastName || !inviteForm.email || !inviteForm.phone) {
      triggerAlert("error", "Please populate all required fields.");
      return;
    }

    // Check duplicate email
    if (users.some(u => u.email.toLowerCase() === inviteForm.email.toLowerCase())) {
      triggerAlert("error", "Email address already exists in credentials registry.");
      return;
    }

    // Validate branches
    const selected = [...inviteForm.selectedBranches];
    if (inviteForm.role === "tenant_admin") {
      selected.push("*");
    }

    const isOperational = ["cashier", "kitchen", "rider"].includes(inviteForm.role);
    if (isOperational && selected.length !== 1) {
      triggerAlert("error", `${ROLE_DISPLAY[inviteForm.role].label} must be assigned to exactly ONE branch.`);
      return;
    }

    const isMultiScoped = ["branch_manager", "hr_manager", "accountant"].includes(inviteForm.role);
    if (isMultiScoped && selected.length === 0) {
      triggerAlert("error", `${ROLE_DISPLAY[inviteForm.role].label} requires at least one assigned branch.`);
      return;
    }

    const branchNames = selected.includes("*")
      ? ["All Branches (tenant-wide)"]
      : AVAILABLE_BRANCHES.filter(b => selected.includes(b.id)).map(b => b.name);

    const newId = `u-prov-${Date.now()}`;
    const expires = new Date();
    expires.setHours(expires.getHours() + 72); // 72 hour staff expiration

    const newStaff: ProvisionedStaffUser = {
      userId: newId,
      firstName: inviteForm.firstName,
      lastName: inviteForm.lastName,
      displayName: `${inviteForm.firstName} ${inviteForm.lastName}`,
      email: inviteForm.email,
      phone: inviteForm.phone,
      role: inviteForm.role,
      branchIds: selected,
      branchNames,
      isActive: true,
      onboardingStatus: "invitation_sent",
      lastLoginAt: null,
      invitationStatus: "pending",
      invitationExpiresAt: expires.toISOString(),
      resendCount: 0,
      createdAt: new Date().toISOString(),
      provisionedBy: "u-owner-001",
      provisionedByName: "Mahmoud Gameil",
      provisionedByRole: "tenant_owner",
      hourlyRate: inviteForm.hourlyRate ? parseFloat(inviteForm.hourlyRate) : null,
      weeklyHourTarget: inviteForm.weeklyHourTarget ? parseInt(inviteForm.weeklyHourTarget) : null,
      notes: inviteForm.notes || null,
      mustChangePasswordOnNextLogin: true,
      scopeHistory: [
        {
          changeId: `sh-init-${Date.now()}`,
          changedAt: new Date().toISOString(),
          changedBy: "u-owner-001",
          changedByRole: "tenant_owner",
          previousRole: "none",
          newRole: inviteForm.role,
          previousBranchIds: [],
          newBranchIds: selected,
          reason: "Newly hired staff team member onboarded to system settings."
        }
      ],
      sessions: []
    };

    saveUsers([newStaff, ...users]);
    setShowInviteModal(false);
    triggerAlert("success", `Security invitation successfully dispatched to ${inviteForm.email}. Valid for 72 hours.`);

    // Reset Form
    setInviteForm({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      role: "cashier",
      selectedBranches: [],
      hourlyRate: "",
      weeklyHourTarget: "40",
      notes: ""
    });

    console.log("[Audit Server Log]", `USER_PROVISIONED: New staff invitation dispatched for ${inviteForm.email} with role ${inviteForm.role}`);
  };

  // Filter logic
  const filteredUsers = users.filter(user => {
    // Search
    const searchString = `${user.displayName} ${user.email} ${user.phone}`.toLowerCase();
    const matchesSearch = searchString.includes(searchTerm.toLowerCase());

    // Role
    const matchesRole = roleFilter === "all" || user.role === roleFilter;

    // Branch
    const matchesBranch =
      branchFilter === "all" ||
      user.branchIds.includes("*") ||
      user.branchIds.includes(branchFilter);

    // Status
    let matchesStatus = true;
    if (statusFilter !== "all") {
      if (statusFilter === "active") {
        matchesStatus = user.isActive && user.onboardingStatus === "active";
      } else if (statusFilter === "pending") {
        matchesStatus = user.onboardingStatus === "invitation_sent" && user.invitationStatus === "pending";
      } else if (statusFilter === "expired") {
        matchesStatus = user.onboardingStatus === "invitation_sent" && user.invitationStatus === "expired";
      } else if (statusFilter === "deactivated") {
        matchesStatus = !user.isActive || user.onboardingStatus === "deactivated";
      }
    }

    return matchesSearch && matchesRole && matchesBranch && matchesStatus;
  });

  const getStatusBadge = (user: ProvisionedStaffUser) => {
    if (!user.isActive || user.onboardingStatus === "deactivated") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xxs font-bold bg-rose-50 text-rose-700 border border-rose-200 shadow-xxs">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse"></span>
          Deactivated
        </span>
      );
    }
    if (user.onboardingStatus === "invitation_sent") {
      if (user.invitationStatus === "expired") {
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xxs font-bold bg-amber-50 text-amber-700 border border-amber-200 shadow-xxs">
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            Invite Expired
          </span>
        );
      }
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xxs font-bold bg-blue-50 text-blue-700 border border-blue-200 shadow-xxs">
          <Clock className="w-3 h-3 text-blue-600 animate-pulse" />
          Invite Pending
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xxs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xxs">
        <CheckCircle className="w-3 h-3 text-emerald-600" />
        Active Staff
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Alert System */}
      {alert && (
        <div
          className={`fixed top-4 right-4 z-50 p-4 rounded-xl shadow-xl border flex items-center gap-3 max-w-md animate-fade-in ${
            alert.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : alert.type === "error"
              ? "bg-rose-50 border-rose-200 text-rose-800"
              : "bg-blue-50 border-blue-200 text-blue-800"
          }`}
        >
          {alert.type === "success" ? (
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : alert.type === "error" ? (
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          ) : (
            <Info className="w-5 h-5 text-blue-600 shrink-0" />
          )}
          <p className="text-xxs font-bold leading-relaxed">{alert.msg}</p>
          <button onClick={() => setAlert(null)} className="ml-auto text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Core Security Disclaimer Banners */}
      <div className="bg-slate-900 border border-slate-850 rounded-2xl p-5 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Shield className="w-40 h-40" />
        </div>
        <div className="flex items-start gap-4 max-w-3xl">
          <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 text-rose-400 shadow-inner shrink-0">
            <Lock className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold tracking-tight text-white">Privileged Tenant Provisioning Gate</h3>
            <p className="text-xxs text-slate-300 leading-relaxed">
              Every staff user is provisioned server-side with zero credentials shared. All role definitions, limits, and branch-scoped clearances are securely embedded in cryptographically signed Firebase ID JWT Custom Claims.
            </p>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Active Personnel</p>
            <h3 className="text-lg font-black text-slate-800">
              {users.filter(u => u.isActive && u.onboardingStatus === "active").length}
            </h3>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Invites Sent</p>
            <h3 className="text-lg font-black text-slate-800">
              {users.filter(u => u.onboardingStatus === "invitation_sent" && u.invitationStatus === "pending").length}
            </h3>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Expired Invites</p>
            <h3 className="text-lg font-black text-slate-800">
              {users.filter(u => u.onboardingStatus === "invitation_sent" && u.invitationStatus === "expired").length}
            </h3>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Total System Sessions</p>
            <h3 className="text-lg font-black text-slate-800">
              {users.reduce((sum, u) => sum + u.sessions.filter(s => s.isActive).length, 0)}
            </h3>
          </div>
        </div>
      </div>

      {/* Primary Actions & Filtering Bar */}
      <div className="bg-white rounded-2xl border border-slate-150 p-5 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by staff name, email or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-slate-900"
            />
          </div>

          <button
            onClick={() => setShowInviteModal(true)}
            className="w-full md:w-auto px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            Invite New Team Member
          </button>
        </div>

        {/* Dynamic Filters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Filter by Role</label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full p-2 border border-slate-200 rounded-lg text-xxs text-slate-600 focus:outline-none focus:border-slate-900"
            >
              <option value="all">All Roles</option>
              {Object.keys(ROLE_DISPLAY).map((key) => (
                <option key={key} value={key}>
                  {ROLE_DISPLAY[key as UserRole].label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Filter by Branch Assignment</label>
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="w-full p-2 border border-slate-200 rounded-lg text-xxs text-slate-600 focus:outline-none focus:border-slate-900"
            >
              <option value="all">All Branches</option>
              {AVAILABLE_BRANCHES.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Filter by Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full p-2 border border-slate-200 rounded-lg text-xxs text-slate-600 focus:outline-none focus:border-slate-900"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Staff Only</option>
              <option value="pending">Invitation Pending Only</option>
              <option value="expired">Invite Expired Only</option>
              <option value="deactivated">Deactivated / Offboarded</option>
            </select>
          </div>
        </div>
      </div>

      {/* Staff Table / Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Table Container */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-150 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Personnel Roster ({filteredUsers.length} matches)</h4>
            <span className="text-[10px] text-slate-400 font-mono">Tenant Level Chain B</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/50 text-slate-400 font-bold border-b border-slate-100">
                  <th className="p-4">Name & Contact</th>
                  <th className="p-4">Assigned Role</th>
                  <th className="p-4">Branch Clearances</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-12 text-center text-slate-400">
                      <Users className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                      <p className="text-xxs font-bold text-slate-500">No personnel matches found</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Refine your search keywords or clear current filters</p>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => {
                    const isSel = selectedUser?.userId === user.userId;
                    const rMeta = ROLE_DISPLAY[user.role];
                    return (
                      <tr
                        key={user.userId}
                        onClick={() => {
                          setSelectedUser(user);
                          setDetailTab("profile");
                        }}
                        className={`hover:bg-slate-50/60 transition cursor-pointer ${
                          isSel ? "bg-slate-50 border-l-4 border-slate-900" : ""
                        }`}
                      >
                        <td className="p-4">
                          <div className="font-bold text-slate-800 leading-snug">{user.displayName}</div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">{user.email}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{user.phone}</div>
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border ${rMeta.color}`}>
                            {rMeta.label}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex flex-col gap-1 max-w-[160px]">
                            {user.branchIds.includes("*") ? (
                              <span className="text-[10px] font-bold text-indigo-600 flex items-center gap-1">
                                <Globe className="w-3 h-3 shrink-0" />
                                All Branches
                              </span>
                            ) : (
                              user.branchNames.map((name, i) => (
                                <span key={i} className="text-[10px] text-slate-600 font-medium truncate flex items-center gap-1">
                                  <MapPin className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                                  {name.split("(")[0].trim()}
                                </span>
                              ))
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          {getStatusBadge(user)}
                        </td>
                        <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex justify-end gap-1.5">
                            {user.onboardingStatus === "invitation_sent" && (
                              <button
                                onClick={() => handleResendInvitation(user.userId)}
                                disabled={user.resendCount >= 3}
                                className={`p-1.5 rounded-lg border border-slate-150 hover:bg-slate-50 transition cursor-pointer ${
                                  user.resendCount >= 3 ? "opacity-40 cursor-not-allowed" : ""
                                }`}
                                title="Resend Security Invitation Email (Max 3)"
                              >
                                <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                              </button>
                            )}
                            
                            {user.onboardingStatus === "active" && (
                              <button
                                onClick={() => handleResetPassword(user.userId)}
                                className="p-1.5 rounded-lg border border-slate-150 hover:bg-slate-50 transition cursor-pointer"
                                title="Send Security Password Reset Link"
                              >
                                <Lock className="w-3.5 h-3.5 text-slate-500" />
                              </button>
                            )}

                            <button
                              onClick={() => handleToggleDeactivate(user.userId)}
                              disabled={user.role === "tenant_owner"}
                              className={`p-1.5 rounded-lg border transition cursor-pointer ${
                                user.role === "tenant_owner"
                                  ? "opacity-30 cursor-not-allowed border-slate-100"
                                  : !user.isActive || user.onboardingStatus === "deactivated"
                                  ? "border-emerald-200 hover:bg-emerald-50 text-emerald-600"
                                  : "border-rose-200 hover:bg-rose-50 text-rose-600"
                              }`}
                              title={user.isActive ? "Deactivate / Suspend User Access" : "Re-activate and unlock user account"}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detail Panel Container */}
        <div className="bg-white rounded-2xl border border-slate-150 shadow-xs p-5 space-y-5">
          {!selectedUser ? (
            <div className="h-full flex flex-col justify-center items-center p-8 text-center text-slate-400">
              <Users className="w-12 h-12 text-slate-200 mb-3" />
              <p className="text-xxs font-bold text-slate-500">No Employee Inspected</p>
              <p className="text-[10px] text-slate-400 max-w-[200px] mt-0.5">Click any employee row in the roster table to view security clearances, history logs and payroll details.</p>
            </div>
          ) : (
            <div className="space-y-5 animate-fade-in">
              {/* Header profile */}
              <div className="pb-4 border-b border-slate-100 flex justify-between items-start">
                <div>
                  <h3 className="text-sm font-black text-slate-800 tracking-tight">{selectedUser.displayName}</h3>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">{selectedUser.email}</p>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-bold border mt-1.5 ${ROLE_DISPLAY[selectedUser.role].color}`}>
                    {ROLE_DISPLAY[selectedUser.role].label}
                  </span>
                </div>
                <button
                  onClick={() => {
                    setScopeForm({
                      role: selectedUser.role,
                      selectedBranches: selectedUser.branchIds.filter(id => id !== "*"),
                      reason: ""
                    });
                    setShowEditScopeModal(true);
                  }}
                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-[10px] font-bold text-slate-700 rounded-lg flex items-center gap-1 transition"
                >
                  <Shield className="w-3 h-3 text-indigo-650" />
                  Edit Scope
                </button>
              </div>

              {/* Subtabs */}
              <div className="flex border-b border-slate-100 gap-4 text-[10px] font-bold text-slate-400">
                <button
                  onClick={() => setDetailTab("profile")}
                  className={`pb-2 border-b-2 transition-colors cursor-pointer ${
                    detailTab === "profile" ? "border-slate-900 text-slate-800" : "hover:text-slate-600"
                  }`}
                >
                  Profile & Payroll
                </button>
                <button
                  onClick={() => setDetailTab("history")}
                  className={`pb-2 border-b-2 transition-colors cursor-pointer ${
                    detailTab === "history" ? "border-slate-900 text-slate-800" : "hover:text-slate-600"
                  }`}
                >
                  Scope History
                </button>
                <button
                  onClick={() => setDetailTab("security")}
                  className={`pb-2 border-b-2 transition-colors cursor-pointer ${
                    detailTab === "security" ? "border-slate-900 text-slate-800" : "hover:text-slate-600"
                  }`}
                >
                  Sessions ({selectedUser.sessions.filter(s => s.isActive).length})
                </button>
              </div>

              {/* Content Panel */}
              <div className="space-y-4">
                {detailTab === "profile" && (
                  <div className="space-y-4 animate-fade-in">
                    <div className="grid grid-cols-2 gap-3 bg-slate-50/70 p-3.5 rounded-xl border border-slate-100">
                      <div>
                        <p className="text-[9px] font-bold uppercase text-slate-400">Phone Contact</p>
                        <p className="text-[11px] font-bold text-slate-700 mt-0.5">{selectedUser.phone}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-bold uppercase text-slate-400">Hire Date</p>
                        <p className="text-[11px] font-bold text-slate-700 mt-0.5">
                          {new Date(selectedUser.createdAt).toLocaleDateString([], { dateStyle: "medium" })}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2.5">
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Payroll & HR Allocations</h4>
                      <div className="divide-y divide-slate-100">
                        <div className="py-2 flex justify-between text-xxs">
                          <span className="text-slate-500 font-medium">Hourly Base Rate:</span>
                          <span className="text-slate-800 font-bold">
                            {selectedUser.hourlyRate ? `$${selectedUser.hourlyRate}.00 / hr` : "Not Configured"}
                          </span>
                        </div>
                        <div className="py-2 flex justify-between text-xxs">
                          <span className="text-slate-500 font-medium">Weekly Hour Target:</span>
                          <span className="text-slate-800 font-bold">
                            {selectedUser.weeklyHourTarget ? `${selectedUser.weeklyHourTarget} hours` : "Not Configured"}
                          </span>
                        </div>
                        <div className="py-2 flex justify-between text-xxs">
                          <span className="text-slate-500 font-medium">Provisioned By:</span>
                          <span className="text-slate-800 font-bold">
                            {selectedUser.provisionedByName} ({selectedUser.provisionedByRole === "tenant_owner" ? "Owner" : "Admin"})
                          </span>
                        </div>
                      </div>
                    </div>

                    {selectedUser.notes && (
                      <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-3 text-xxs text-slate-600 leading-relaxed">
                        <div className="font-bold text-amber-800 flex items-center gap-1 mb-1">
                          <FileText className="w-3.5 h-3.5" />
                          HR Internal Placement Notes
                        </div>
                        {selectedUser.notes}
                      </div>
                    )}
                  </div>
                )}

                {detailTab === "history" && (
                  <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1 animate-fade-in">
                    {selectedUser.scopeHistory.length === 0 ? (
                      <div className="p-6 text-center text-slate-400 text-xxs">
                        No previous scope changes on record.
                      </div>
                    ) : (
                      selectedUser.scopeHistory.map((sh) => (
                        <div key={sh.changeId} className="border-l-2 border-slate-200 pl-3.5 py-1 relative">
                          <div className="absolute w-2 h-2 rounded-full bg-slate-300 -left-[5px] top-1.5"></div>
                          <p className="text-[10px] font-bold text-slate-700">
                            Scope Changed to <span className="text-indigo-600">{sh.newRole}</span>
                          </p>
                          <p className="text-[9px] text-slate-400 mt-0.5">
                            By {sh.changedBy === "u-owner-001" ? "Mahmoud Gameil" : sh.changedBy} ({sh.changedByRole})
                          </p>
                          <div className="text-[9px] bg-slate-50 p-2 rounded-lg text-slate-600 border border-slate-100 mt-1.5 leading-normal italic">
                            &ldquo;{sh.reason}&rdquo;
                          </div>
                          <span className="block text-[8px] text-slate-400 font-mono mt-1">
                            {new Date(sh.changedAt).toLocaleString()}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {detailTab === "security" && (
                  <div className="space-y-4 animate-fade-in">
                    <div className="flex justify-between items-center">
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Device Sessions</h4>
                      {selectedUser.sessions.some(s => s.isActive) && (
                        <button
                          onClick={() => handleRevokeAllSessions(selectedUser.userId)}
                          className="text-[9px] font-bold text-rose-600 hover:text-rose-700 hover:underline flex items-center gap-1"
                        >
                          Revoke All
                        </button>
                      )}
                    </div>

                    <div className="space-y-2.5 max-h-[250px] overflow-y-auto">
                      {selectedUser.sessions.length === 0 ? (
                        <div className="p-8 text-center text-slate-400 text-xxs">
                          No active logins or session logs available for this staff member.
                        </div>
                      ) : (
                        selectedUser.sessions.map((s) => (
                          <div key={s.sessionId} className="p-3 border border-slate-100 rounded-xl flex items-start gap-3 text-xxs">
                            <div className="p-1.5 bg-slate-50 text-slate-500 rounded-lg">
                              {s.deviceInfo.platform === "web" ? (
                                <Globe className="w-4 h-4 text-indigo-600" />
                              ) : s.deviceInfo.platform === "android" ? (
                                <Smartphone className="w-4 h-4 text-emerald-600" />
                              ) : (
                                <Monitor className="w-4 h-4" />
                              )}
                            </div>
                            <div className="space-y-0.5 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-slate-700 truncate">{s.deviceInfo.userAgent}</span>
                                {s.isActive ? (
                                  <span className="px-1 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded text-[8px] font-extrabold animate-pulse">
                                    LIVE
                                  </span>
                                ) : (
                                  <span className="px-1 py-0.5 bg-slate-50 text-slate-400 border border-slate-100 rounded text-[8px] font-extrabold">
                                    OFFLINE
                                  </span>
                                )}
                              </div>
                              <p className="text-[9px] text-slate-400 font-mono">IP: {s.ipAddress} • {s.deviceInfo.appVersion}</p>
                              <p className="text-[8px] text-slate-400">Logged in: {new Date(s.loginAt).toLocaleString()}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL 1: Invite New Staff Panel */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full border border-slate-200 p-6 space-y-6 shadow-2xl animate-scale-up">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-650" />
                <h3 className="text-sm font-black text-slate-800 tracking-tight">Onboard & Invite New Team Member</h3>
              </div>
              <button onClick={() => setShowInviteModal(false)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-50 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleInviteSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">First Name <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={inviteForm.firstName}
                    onChange={(e) => setInviteForm({ ...inviteForm, firstName: e.target.value })}
                    placeholder="e.g. Mahmoud"
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Last Name <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={inviteForm.lastName}
                    onChange={(e) => setInviteForm({ ...inviteForm, lastName: e.target.value })}
                    placeholder="e.g. Gameil"
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Email <span className="text-rose-500">*</span></label>
                  <input
                    type="email"
                    required
                    value={inviteForm.email}
                    onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                    placeholder="e.g. employee@gourmet.com"
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Mobile Phone <span className="text-rose-500">*</span></label>
                  <input
                    type="tel"
                    required
                    value={inviteForm.phone}
                    onChange={(e) => setInviteForm({ ...inviteForm, phone: e.target.value })}
                    placeholder="e.g. +201012345678"
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3.5 pt-1.5">
                <div className="col-span-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Assign Role</label>
                  <select
                    value={inviteForm.role}
                    onChange={(e) => {
                      const r = e.target.value as UserRole;
                      setInviteForm({ ...inviteForm, role: r, selectedBranches: [] });
                    }}
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-slate-900"
                  >
                    <option value="tenant_admin">Tenant Admin</option>
                    <option value="branch_manager">Branch Manager</option>
                    <option value="cashier">Cashier</option>
                    <option value="kitchen">Kitchen Crew</option>
                    <option value="rider">Delivery Rider</option>
                    <option value="hr_manager">HR Manager</option>
                    <option value="accountant">Accountant</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                    Branch Assignment Clearance 
                    {inviteForm.role === "tenant_admin" ? (
                      <span className="text-indigo-600 font-extrabold ml-1">(WILDCARD ENABLED)</span>
                    ) : ["cashier", "kitchen", "rider"].includes(inviteForm.role) ? (
                      <span className="text-amber-600 font-extrabold ml-1">(SELECT EXACTLY 1)</span>
                    ) : (
                      <span className="text-slate-500 ml-1">(MULTI-SELECT)</span>
                    )}
                  </label>
                  
                  {inviteForm.role === "tenant_admin" ? (
                    <div className="p-2.5 bg-indigo-50/50 border border-indigo-100 rounded-xl text-xxs text-indigo-800 font-semibold flex items-center gap-1.5">
                      <Globe className="w-4 h-4 text-indigo-650" />
                      Tenant Admins automatically bypass specific scopes and hold access to all tenant branches.
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {AVAILABLE_BRANCHES.map((b) => {
                        const isChecked = inviteForm.selectedBranches.includes(b.id);
                        return (
                          <label
                            key={b.id}
                            className={`flex items-center gap-2 p-2 rounded-xl border text-xxs font-bold transition-all cursor-pointer ${
                              isChecked ? "bg-slate-900 text-white border-slate-900" : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                let next: string[];
                                if (["cashier", "kitchen", "rider"].includes(inviteForm.role)) {
                                  // Operational: exact single branch
                                  next = [b.id];
                                } else {
                                  // Multi-select for managers
                                  next = isChecked
                                    ? inviteForm.selectedBranches.filter(id => id !== b.id)
                                    : [...inviteForm.selectedBranches, b.id];
                                }
                                setInviteForm({ ...inviteForm, selectedBranches: next });
                              }}
                              className="sr-only"
                            />
                            <MapPin className={`w-3.5 h-3.5 shrink-0 ${isChecked ? "text-amber-400" : "text-slate-400"}`} />
                            <span className="truncate">{b.name}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5 pt-1.5 border-t border-slate-100">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Hourly Compensation ($)</label>
                  <input
                    type="number"
                    value={inviteForm.hourlyRate}
                    onChange={(e) => setInviteForm({ ...inviteForm, hourlyRate: e.target.value })}
                    placeholder="e.g. 45"
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Weekly Contract Hour Target</label>
                  <input
                    type="number"
                    value={inviteForm.weeklyHourTarget}
                    onChange={(e) => setInviteForm({ ...inviteForm, weeklyHourTarget: e.target.value })}
                    placeholder="e.g. 40"
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Onboarding Placement Notes</label>
                <textarea
                  value={inviteForm.notes}
                  onChange={(e) => setInviteForm({ ...inviteForm, notes: e.target.value })}
                  placeholder="Internal roles placement summary, schedules preferences, uniform allocation codes..."
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-slate-900 h-16 resize-none"
                />
              </div>

              <div className="flex gap-2 justify-end pt-3">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-650 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-md transition cursor-pointer"
                >
                  Send Security Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Edit Scope Panel */}
      {showEditScopeModal && selectedUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full border border-slate-200 p-6 space-y-6 shadow-2xl animate-scale-up">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-indigo-650" />
                <h3 className="text-sm font-black text-slate-800 tracking-tight">Modify Security Scope & Clearance</h3>
              </div>
              <button onClick={() => setShowEditScopeModal(false)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-50 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl flex items-start gap-3 text-xxs leading-relaxed">
              <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">CRITICAL DELEGATION REQUIREMENT:</span> Changing an employee&rsquo;s scope instantly updates their JWT Custom Claims. To prevent session hijack, saving will immediately invalidate all active login sessions for <b>{selectedUser.displayName}</b>, forcing them to re-verify on next request.
              </div>
            </div>

            <form onSubmit={handleSaveScopeEdit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Target Role Clearance</label>
                <select
                  value={scopeForm.role}
                  onChange={(e) => {
                    const r = e.target.value as UserRole;
                    setScopeForm({ ...scopeForm, role: r, selectedBranches: [] });
                  }}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-slate-900"
                >
                  <option value="tenant_admin">Tenant Admin</option>
                  <option value="branch_manager">Branch Manager</option>
                  <option value="cashier">Cashier</option>
                  <option value="kitchen">Kitchen Crew</option>
                  <option value="rider">Delivery Rider</option>
                  <option value="hr_manager">HR Manager</option>
                  <option value="accountant">Accountant</option>
                </select>
                <p className="text-[10px] text-slate-400 mt-1">{ROLE_DISPLAY[scopeForm.role].desc}</p>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                  Assigned Branches Scope
                  {scopeForm.role === "tenant_admin" ? (
                    <span className="text-indigo-600 font-extrabold ml-1">(WILDCARD CLEARANCE)</span>
                  ) : ["cashier", "kitchen", "rider"].includes(scopeForm.role) ? (
                    <span className="text-amber-600 font-extrabold ml-1">(SELECT EXACTLY 1)</span>
                  ) : (
                    <span className="text-slate-500 ml-1">(MULTI-SELECT)</span>
                  )}
                </label>

                {scopeForm.role === "tenant_admin" ? (
                  <div className="p-3 bg-indigo-50 text-indigo-800 rounded-xl text-xxs font-bold">
                    Tenant Admin bypasses specific branch boundaries. Implicit wildcard (&ldquo;*&rdquo;) claims applied.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {AVAILABLE_BRANCHES.map((b) => {
                      const isChecked = scopeForm.selectedBranches.includes(b.id);
                      return (
                        <label
                          key={b.id}
                          className={`flex items-center gap-2 p-2.5 rounded-xl border text-xxs font-bold transition-all cursor-pointer ${
                            isChecked ? "bg-slate-900 text-white border-slate-900" : "bg-slate-55 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              let next: string[];
                              if (["cashier", "kitchen", "rider"].includes(scopeForm.role)) {
                                next = [b.id];
                              } else {
                                next = isChecked
                                  ? scopeForm.selectedBranches.filter(id => id !== b.id)
                                  : [...scopeForm.selectedBranches, b.id];
                              }
                              setScopeForm({ ...scopeForm, selectedBranches: next });
                            }}
                            className="sr-only"
                          />
                          <MapPin className={`w-3.5 h-3.5 ${isChecked ? "text-amber-400" : "text-slate-400"}`} />
                          <span className="truncate">{b.name}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Reason for Modification <span className="text-rose-500">*</span></label>
                <textarea
                  required
                  value={scopeForm.reason}
                  onChange={(e) => setScopeForm({ ...scopeForm, reason: e.target.value })}
                  placeholder="Provide precise administrative reason (minimum 10 characters)..."
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-slate-900 h-20 resize-none animate-pulse-once"
                />
              </div>

              <div className="flex gap-2 justify-end pt-3">
                <button
                  type="button"
                  onClick={() => setShowEditScopeModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-650 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-md transition cursor-pointer"
                >
                  Save & Apply Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
