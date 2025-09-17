"use client";
import { useAuthStore } from "@/lib/auth-store";
import { useEffect, useState } from "react";
import {
  getDoctors,
  approveUser,
  getDoctorAdminThread,
  listChatMessages,
  sendChatMessage,
} from "@/lib/api";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { motion } from "framer-motion";
import { useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Check,
  X,
  User,
  Users,
  Calendar,
  BarChart3,
  Settings,
  TrendingUp,
  DollarSign,
  UserPlus,
  Activity,
  Shield,
  Clock,
  Bell,
  MessageSquare,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  listUsers,
  createUserAdmin,
  updateUserAdmin,
  deleteUserAdmin,
} from "@/lib/api";
import {
  getAllAppointments,
  createAppointment,
  updateAppointment,
  updateAppointmentStatus,
  deleteAppointment,
  getTherapies,
} from "@/lib/api";
import { toast } from "sonner";

const SUPER_ADMIN_EMAIL = "ranvijaykr.in@gmail.com";
const SUPER_ADMIN_NAME = "Ranvijay Kumar";

// Mock data for demonstration
const mockData = {
  staff: [
    {
      id: 1,
      name: "Dr. Sarah Johnson",
      role: "Therapist",
      status: "active",
      patients: 12,
      lastActive: "2 hours ago",
    },
    {
      id: 2,
      name: "Dr. Michael Chen",
      role: "Therapist",
      status: "active",
      patients: 8,
      lastActive: "1 hour ago",
    },
    {
      id: 3,
      name: "Dr. Emily Davis",
      role: "Therapist",
      status: "inactive",
      patients: 5,
      lastActive: "1 day ago",
    },
  ],
  revenue: [
    { month: "Jan", amount: 45000 },
    { month: "Feb", amount: 52000 },
    { month: "Mar", amount: 48000 },
    { month: "Apr", amount: 61000 },
  ],
  recentActivities: [
    {
      id: 1,
      action: "New staff member added",
      user: "Dr. John Smith",
      time: "2 hours ago",
      type: "staff",
    },
    {
      id: 2,
      action: "Monthly report generated",
      user: "System",
      time: "1 day ago",
      type: "report",
    },
    {
      id: 3,
      action: "Schedule updated",
      user: "Dr. Sarah Johnson",
      time: "2 days ago",
      type: "schedule",
    },
  ],
  systemStats: {
    totalPatients: 156,
    activeTherapists: 8,
    monthlyRevenue: 61000,
    utilizationRate: 85,
  },
};

export default function AdminDashboard() {
  const { uid, role, displayName, email } = useAuthStore();
  const token = useAuthStore((s) => s.token) as any;
  const [activeTab, setActiveTab] = useState("home");
  const [pendingDoctors, setPendingDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [approvedDoctors, setApprovedDoctors] = useState<any[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>("");
  const [adminChatId, setAdminChatId] = useState<string | null>(null);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<any[] | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [notifOpen, setNotifOpen] = useState(false);
  const searchParams = useSearchParams();
  const [sseConnected, setSseConnected] = useState(false);
  const [recentFeed, setRecentFeed] = useState<
    Array<{
      id: string;
      type: "approval" | "message" | "appointment";
      title: string;
      subtitle?: string;
      at: number;
    }>
  >([]);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  // Patients tab state
  const [patients, setPatients] = useState<any[]>([]);
  const [patientsLoading, setPatientsLoading] = useState(false);
  const [patientQuery, setPatientQuery] = useState("");
  const [editingPatientId, setEditingPatientId] = useState<string | null>(null);
  const [patientForm, setPatientForm] = useState({
    name: "",
    email: "",
    role: "patient",
  });
  const [roleFilter, setRoleFilter] = useState<
    "all" | "patient" | "doctor" | "admin"
  >("all");
  const [memberModalOpen, setMemberModalOpen] = useState(false);
  const [memberSaving, setMemberSaving] = useState(false);
  // Sessions tab state
  const [sessions, setSessions] = useState<any[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [sessionFormOpen, setSessionFormOpen] = useState(false);
  const [sessionSaving, setSessionSaving] = useState(false);
  const [sessionForm, setSessionForm] = useState({
    patient: "",
    doctor: "",
    therapy: "",
    startTime: "",
    endTime: "",
    notes: "",
  });
  const [doctorsList, setDoctorsList] = useState<any[]>([]);
  const [therapiesList, setTherapiesList] = useState<any[]>([]);

  // Session action confirm modal (complete/delay)
  const [sessionActionOpen, setSessionActionOpen] = useState(false);
  const [sessionActionType, setSessionActionType] = useState<
    "complete" | "delay" | null
  >(null);
  const [sessionActionNotes, setSessionActionNotes] = useState("");
  const [sessionActionTargetId, setSessionActionTargetId] =
    useState<string>("");
  const [sessionActionSubmitting, setSessionActionSubmitting] = useState(false);

  async function submitSessionAction() {
    if (!token || !sessionActionType || !sessionActionTargetId) return;
    try {
      setSessionActionSubmitting(true);
      // 1) update notes if provided
      if (sessionActionNotes.trim()) {
        await updateAppointment(
          String(sessionActionTargetId),
          { notes: sessionActionNotes.trim() },
          token
        );
      }
      // 2) update status (completed or in_progress)
      const status =
        sessionActionType === "complete" ? "completed" : "in_progress";
      await updateAppointmentStatus(
        String(sessionActionTargetId),
        status,
        token
      );
      toast.success(
        sessionActionType === "complete"
          ? "Session marked as completed"
          : "Session marked as delayed (in progress)"
      );
      setSessionActionOpen(false);
      setSessionActionNotes("");
      setSessionActionType(null);
      setSessionActionTargetId("");
      await loadSessions();
    } catch (e) {
      toast.error("Failed to update session");
    } finally {
      setSessionActionSubmitting(false);
    }
  }

  async function loadPending() {
    if (!token) return;
    setLoading(true);
    try {
      const docs = await getDoctors(token);
      const pending = (docs || []).filter(
        (d: any) => d.role === "doctor" && d.isApproved === false
      );
      setPendingDoctors(pending);
      const approved = (docs || []).filter(
        (d: any) => d.role === "doctor" && d.isApproved !== false
      );
      setApprovedDoctors(approved);
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPending();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Open notifications drawer when ?notifications=1 is present
  useEffect(() => {
    const q = searchParams?.get("notifications");
    if (q) setNotifOpen(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  async function loadPatients() {
    if (!token) return;
    setPatientsLoading(true);
    try {
      const list = await listUsers(
        token,
        roleFilter === "all" ? undefined : roleFilter,
        patientQuery || undefined
      );
      const arr = Array.isArray(list) ? list : [];
      // Deduplicate by uid/_id and normalize fields for display
      const seen = new Map<string, any>();
      for (const u of arr) {
        const key = String(u.uid || u._id || u.id || u.email || Math.random());
        if (seen.has(key)) continue;
        const normalized = {
          ...u,
          name:
            u.name ||
            u.displayName ||
            (u.role === "admin" && u.email === SUPER_ADMIN_EMAIL
              ? SUPER_ADMIN_NAME
              : "") ||
            "",
          email: u.email || "",
          role: u.role || "patient",
          uid: u.uid || u.id || u._id || "",
        };
        seen.set(key, normalized);
      }
      setPatients(Array.from(seen.values()));
    } catch (e) {
      setPatients([]);
    } finally {
      setPatientsLoading(false);
    }
  }

  useEffect(() => {
    loadPatients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, roleFilter]);

  // Debounced query search
  useEffect(() => {
    if (!token) return;
    const handle = setTimeout(() => {
      loadPatients();
    }, 300);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientQuery]);

  async function loadSessions() {
    if (!token) return;
    setSessionsLoading(true);
    try {
      const [apps, docs, ths] = await Promise.all([
        getAllAppointments(token),
        getDoctors(token),
        getTherapies(token),
      ]);
      setSessions(Array.isArray(apps) ? apps : []);
      setDoctorsList(Array.isArray(docs) ? docs : []);
      setTherapiesList(Array.isArray(ths) ? ths : []);
    } catch {
      setSessions([]);
    } finally {
      setSessionsLoading(false);
    }
  }

  useEffect(() => {
    loadSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  function formatEntityForDisplay(entity: any): string {
    if (!entity) return "Unknown";
    if (typeof entity === "string") return entity;
    if (typeof entity === "number") return String(entity);
    return (
      entity.name ||
      entity.displayName ||
      entity.email ||
      entity.uid ||
      entity._id ||
      entity.id ||
      "Unknown"
    );
  }

  // Realtime: subscribe to SSE events for approvals, messages, appointments
  useEffect(() => {
    if (!token) return;
    const apiBase =
      process.env.NEXT_PUBLIC_API_BASE ||
      "https://ayursutra-panchakarma-api.vercel.app";
    const es = new EventSource(`${apiBase}/api/events`);
    es.onopen = () => setSseConnected(true);
    es.onerror = () => setSseConnected(false);

    es.addEventListener("user.approved", async () => {
      toast.info("New doctor approved!");
      await loadPending();
      await loadPatients();
      setRecentFeed((prev) =>
        [
          {
            id: `${Date.now()}-approval`,
            type: "approval" as const,
            title: "Doctor approved",
            subtitle: "Access granted",
            at: Date.now(),
          },
          ...prev,
        ].slice(0, 20)
      );
      await computeReports();
    });

    es.addEventListener("message.created", async (ev: MessageEvent) => {
      try {
        const data = JSON.parse((ev as any).data);
        const evChatId = data?.payload?.chatId;
        if (data?.payload?.chatId && data?.payload?.message) {
          // Potentially show a toast for new message
          toast.info(`New message in chat ${data.payload.chatId}`);
          setRecentFeed((prev) =>
            [
              {
                id: `${data.payload.chatId}-${
                  data.payload.message.createdAt || Date.now()
                }`,
                type: "message" as const,
                title: data.payload.message.sender?.name || "New message",
                subtitle: String(data.payload.message.text || "Message"),
                at: Date.now(),
              },
              ...prev,
            ].slice(0, 20)
          );
          // Increment unread if not viewing Messages tab
          if (activeTab !== "messages") {
            setUnreadMessagesCount((c) => c + 1);
          }
        }
      } catch {}
    });

    es.addEventListener("appointment.created", async () => {
      toast.info("New appointment created!");
      await loadSessions();
      setRecentFeed((prev) =>
        [
          {
            id: `${Date.now()}-apt-created`,
            type: "appointment" as const,
            title: "Appointment created",
            subtitle: "Schedule updated",
            at: Date.now(),
          },
          ...prev,
        ].slice(0, 20)
      );
      await computeReports();
    });

    es.addEventListener("appointment.updated", async () => {
      toast.info("Appointment updated!");
      await loadSessions();
      setRecentFeed((prev) =>
        [
          {
            id: `${Date.now()}-apt-updated`,
            type: "appointment" as const,
            title: "Appointment updated",
            subtitle: "Status or notes changed",
            at: Date.now(),
          },
          ...prev,
        ].slice(0, 20)
      );
      await computeReports();
    });

    return () => {
      es.close();
    };
  }, [token, activeTab]);

  // Reset unread when switching to Messages tab
  useEffect(() => {
    if (activeTab === "messages") setUnreadMessagesCount(0);
  }, [activeTab]);

  // Roles & Authorization State
  const [admins, setAdmins] = useState<any[]>([]);
  const [nonAdmins, setNonAdmins] = useState<any[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [promoteUserId, setPromoteUserId] = useState<string>("");
  const [promoteSaving, setPromoteSaving] = useState(false);
  const [adminLabels, setAdminLabels] = useState<
    Record<string, "super" | "manager" | "support">
  >({});
  const [permissionsConfig, setPermissionsConfig] = useState<
    Record<
      "super" | "manager" | "support",
      Record<
        | "members"
        | "approvals"
        | "sessions"
        | "messages"
        | "reports"
        | "therapies",
        { view: boolean; manage: boolean }
      >
    >
  >({
    super: {
      members: { view: true, manage: true },
      approvals: { view: true, manage: true },
      sessions: { view: true, manage: true },
      messages: { view: true, manage: true },
      reports: { view: true, manage: true },
      therapies: { view: true, manage: true },
    },
    manager: {
      members: { view: true, manage: true },
      approvals: { view: true, manage: true },
      sessions: { view: true, manage: true },
      messages: { view: true, manage: true },
      reports: { view: true, manage: false },
      therapies: { view: true, manage: true },
    },
    support: {
      members: { view: true, manage: false },
      approvals: { view: true, manage: false },
      sessions: { view: true, manage: false },
      messages: { view: true, manage: true },
      reports: { view: false, manage: false },
      therapies: { view: true, manage: false },
    },
  });

  function loadRolesLocal() {
    try {
      const labelsRaw = localStorage.getItem("adminRoleLabels");
      if (labelsRaw) setAdminLabels(JSON.parse(labelsRaw));
      const permRaw = localStorage.getItem("rbacPermissions");
      if (permRaw) setPermissionsConfig(JSON.parse(permRaw));
    } catch {}
  }

  async function loadRolesData() {
    if (!token) return;
    setRolesLoading(true);
    try {
      const [adminUsers, allUsers] = await Promise.all([
        listUsers(token, "admin"),
        listUsers(token),
      ]);
      setAdmins(adminUsers || []);
      setNonAdmins((allUsers || []).filter((u: any) => u.role !== "admin"));
    } catch (e) {
      toast.error("Failed to load role data");
    } finally {
      setRolesLoading(false);
    }
  }

  function saveAdminLabels(
    next: Record<string, "super" | "manager" | "support">
  ) {
    setAdminLabels(next);
    try {
      localStorage.setItem("adminRoleLabels", JSON.stringify(next));
      toast.success("Admin roles updated");
    } catch {}
  }

  function savePermissionsConfig(next: typeof permissionsConfig) {
    setPermissionsConfig(next);
    try {
      localStorage.setItem("rbacPermissions", JSON.stringify(next));
      toast.success("Permissions saved");
    } catch {}
  }

  async function handlePromoteToAdmin() {
    if (!token || !promoteUserId) return;
    try {
      setPromoteSaving(true);
      await updateUserAdmin(
        promoteUserId,
        { role: "admin", isApproved: true },
        token
      );
      setPromoteUserId("");
      await loadRolesData();
      toast.success("User promoted to admin");
    } catch {
      toast.error("Failed to promote user");
    } finally {
      setPromoteSaving(false);
    }
  }

  async function handleDemoteFromAdmin(userId: string) {
    if (!token) return;
    try {
      await updateUserAdmin(userId, { role: "patient" }, token);
      await loadRolesData();
      toast.success("Admin demoted");
    } catch {
      toast.error("Failed to demote admin");
    }
  }

  useEffect(() => {
    loadRolesLocal();
  }, []);

  useEffect(() => {
    loadRolesData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Reports & Analytics State
  const [reportFrom, setReportFrom] = useState<string>("");
  const [reportTo, setReportTo] = useState<string>("");
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportSummary, setReportSummary] = useState({
    revenueINR: 0,
    totalSessions: 0,
    completedSessions: 0,
    utilizationPct: 0,
    avgRating: 0,
  });
  const [topTherapies, setTopTherapies] = useState<
    Array<{ name: string; count: number }>
  >([]);

  const formatINR = (value: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(Math.max(0, Math.round(value)));

  function withinRange(dateISO: string) {
    const d = new Date(dateISO).getTime();
    const fromOk = reportFrom ? d >= new Date(reportFrom).getTime() : true;
    const toOk = reportTo ? d <= new Date(reportTo).getTime() : true;
    return fromOk && toOk;
  }

  async function computeReports() {
    if (!token) return;
    try {
      setReportsLoading(true);
      // Reuse already-loaded sessions if present, else load
      let data = sessions;
      if (!data || data.length === 0) {
        data = await getAllAppointments(token);
        setSessions(data);
      }

      const filtered = (data || []).filter((s) =>
        withinRange(String(s.startTime))
      );
      const totalSessions = filtered.length;
      const completedSessions = filtered.filter(
        (s) => s.status === "completed"
      ).length;
      const utilizationPct = totalSessions
        ? Math.round((completedSessions / totalSessions) * 100)
        : 0;

      // Revenue model: per completed session fee from therapy.durationMinutes (fallback flat 800 INR)
      const revenueINR = filtered.reduce((sum, s) => {
        if (s.status !== "completed") return sum;
        const duration = (s.therapy as any)?.durationMinutes || 60;
        const fee = Math.round((duration / 60) * 800); // 800 INR per hour baseline
        return sum + fee;
      }, 0);

      // Ratings from appointment.rating
      const ratings = filtered
        .filter((s) => !!s.rating)
        .map((s) => Number(s.rating));
      const avgRating = ratings.length
        ? Math.round(
            (ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10
          ) / 10
        : 0;

      // Top therapies
      const therapyMap: Record<string, number> = {};
      filtered.forEach((s) => {
        const name = (s.therapy as any)?.name || "Unknown";
        therapyMap[name] = (therapyMap[name] || 0) + 1;
      });
      const sortedTherapies = Object.entries(therapyMap)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 6);

      setReportSummary({
        revenueINR,
        totalSessions,
        completedSessions,
        utilizationPct,
        avgRating,
      });
      setTopTherapies(sortedTherapies);
    } catch {
      toast.error("Failed to compute reports");
    } finally {
      setReportsLoading(false);
    }
  }

  function exportCsv() {
    const headers = [
      "Revenue(INR)",
      "Total Sessions",
      "Completed Sessions",
      "Utilization(%)",
      "Avg Rating",
    ];
    const row = [
      String(reportSummary.revenueINR),
      String(reportSummary.totalSessions),
      String(reportSummary.completedSessions),
      String(reportSummary.utilizationPct),
      String(reportSummary.avgRating),
    ];
    const csv = [headers.join(","), row.join(",")].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reports_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Simple cross-tab navigation helpers
  const goToMembers = () => setActiveTab("members");

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Admin Toolbar removed (header bell retained near profile) */}
          {/* Welcome Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg p-6 text-white"
          >
            <h1 className="text-3xl font-bold mb-2">
              Welcome, {displayName || "Admin"}!
            </h1>
            <p className="text-purple-100">
              Manage your clinic operations and monitor performance.
            </p>
          </motion.div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-7 gap-2 w-full">
              <TabsTrigger value="home">Home</TabsTrigger>
              <TabsTrigger value="approvals">Approvals</TabsTrigger>
              <TabsTrigger value="members">Members</TabsTrigger>
              <TabsTrigger value="sessions">Sessions</TabsTrigger>
              <TabsTrigger value="messages">
                Messages{unreadMessagesCount ? ` (${unreadMessagesCount})` : ""}
              </TabsTrigger>
              <TabsTrigger value="roles">Roles</TabsTrigger>
              <TabsTrigger value="reports">Reports</TabsTrigger>
            </TabsList>

            <TabsContent value="home" className="space-y-6 pt-4">
              {/* System Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* existing stat cards */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center">
                        <Users className="h-8 w-8 text-blue-600" />
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">
                            Total Patients
                          </p>
                          <p className="text-2xl font-bold">
                            {mockData.systemStats.totalPatients}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center">
                        <Shield className="h-8 w-8 text-green-600" />
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">
                            Active Therapists
                          </p>
                          <p className="text-2xl font-bold">
                            {mockData.systemStats.activeTherapists}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center">
                        <DollarSign className="h-8 w-8 text-purple-600" />
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">
                            Monthly Revenue
                          </p>
                          <p className="text-2xl font-bold">
                            {formatINR(mockData.systemStats.monthlyRevenue)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center">
                        <TrendingUp className="h-8 w-8 text-orange-600" />
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">
                            Utilization Rate
                          </p>
                          <p className="text-2xl font-bold">
                            {mockData.systemStats.utilizationRate}%
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>

              {/* Main Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Staff Management (existing) */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Users className="h-5 w-5 mr-2" /> Staff Management
                      </CardTitle>
                      <CardDescription>
                        Manage your therapy staff and their assignments
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {mockData.staff.map((member) => (
                          <div
                            key={member.id}
                            className="flex items-center justify-between p-4 border rounded-lg"
                          >
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                                <Shield className="h-5 w-5 text-white" />
                              </div>
                              <div className="flex-1">
                                <p className="font-medium">{member.name}</p>
                                <p className="text-sm text-gray-500">
                                  {member.role} • {member.patients} patients
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge
                                variant={
                                  member.status === "active"
                                    ? "default"
                                    : "secondary"
                                }
                              >
                                {member.status}
                              </Badge>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={goToMembers}
                              >
                                Manage
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                      <Button
                        className="w-full mt-4"
                        variant="outline"
                        onClick={goToMembers}
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Add New Staff
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Revenue Overview (existing) */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <BarChart3 className="h-5 w-5 mr-2" /> Revenue Overview
                      </CardTitle>
                      <CardDescription>
                        Monthly revenue trends and analytics
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {mockData.revenue.map((item, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between"
                          >
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-teal-600 rounded-full flex items-center justify-center">
                                <DollarSign className="h-4 w-4 text-white" />
                              </div>
                              <span className="font-medium">{item.month}</span>
                            </div>
                            <div className="text-right">
                              <p className="font-bold">
                                {formatINR(item.amount)}
                              </p>
                              <div className="w-24 bg-gray-200 rounded-full h-2 mt-1">
                                <div
                                  className="bg-gradient-to-r from-green-500 to-teal-600 h-2 rounded-full"
                                  style={{
                                    width: `${(item.amount / 70000) * 100}%`,
                                  }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <Button
                        className="w-full mt-4"
                        variant="outline"
                        onClick={() => {
                          setActiveTab("reports");
                          computeReports();
                        }}
                      >
                        View Detailed Reports
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>

              {/* Live Activity Feed */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Activity className="h-5 w-5 mr-2" /> Live Activity
                    </CardTitle>
                    <CardDescription>
                      Approvals, messages, and schedule updates in real time
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {recentFeed.length === 0 ? (
                      <div className="text-sm text-gray-500">
                        No activity yet.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {recentFeed
                          .filter((ev) =>
                            ["approval", "message", "appointment"].includes(
                              ev.type
                            )
                          )
                          .map((ev) => (
                            <div
                              key={ev.id}
                              className="flex items-start gap-3 p-3 border rounded-md"
                            >
                              <div className="mt-0.5">
                                {ev.type === "approval" ? (
                                  <Shield className="h-4 w-4 text-green-600" />
                                ) : ev.type === "message" ? (
                                  <MessageSquare className="h-4 w-4 text-blue-600" />
                                ) : (
                                  <Calendar className="h-4 w-4 text-purple-600" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium">
                                  {ev.title}
                                </div>
                                {!!ev.subtitle && (
                                  <div className="text-xs text-gray-500 truncate">
                                    {ev.subtitle}
                                  </div>
                                )}
                                <div className="text-[10px] text-gray-400 mt-0.5">
                                  {new Date(ev.at).toLocaleTimeString()}
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            <TabsContent value="approvals" className="pt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Pending Doctor Approvals</CardTitle>
                  <CardDescription>
                    Approve or reject new doctor registrations.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-sm text-gray-500">Loading…</div>
                  ) : pendingDoctors.length === 0 ? (
                    <div className="text-sm text-gray-500">
                      No pending requests.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {pendingDoctors.map((doc: any) => (
                        <div
                          key={doc._id || doc.uid || doc.email}
                          className="flex items-center justify-between p-4 border rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center">
                              <User className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <div className="font-medium">
                                {doc.name || doc.displayName || "Doctor"}
                              </div>
                              <div className="text-sm text-gray-500">
                                {doc.email}
                              </div>
                              <div className="mt-1">
                                <Badge variant="secondary">Unapproved</Badge>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={async () => {
                                try {
                                  if (!token) return;
                                  await approveUser(
                                    String(doc._id || doc.id || doc.uid),
                                    token
                                  );
                                  await loadPending();
                                } catch {}
                              }}
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={async () => {
                                if (!token) return;
                                const ok = window.confirm(
                                  "Reject this request? This will remove the user."
                                );
                                if (!ok) return;
                                try {
                                  await deleteUserAdmin(
                                    String(doc._id || doc.id || doc.uid),
                                    token
                                  );
                                  await loadPending();
                                } catch {}
                              }}
                            >
                              Reject
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="members" className="pt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Members</CardTitle>
                  <CardDescription>
                    Manage all users (patients, doctors, admins).
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-4 flex flex-col md:flex-row gap-2">
                    <Input
                      placeholder="Search by name/email"
                      value={patientQuery}
                      onChange={(e) => setPatientQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          loadPatients();
                        }
                      }}
                    />
                    <select
                      className="border rounded-md h-10 px-3"
                      value={roleFilter}
                      onChange={(e) => setRoleFilter(e.target.value as any)}
                    >
                      <option value="all">All roles</option>
                      <option value="patient">Patients</option>
                      <option value="doctor">Doctors</option>
                      <option value="admin">Admins</option>
                    </select>
                    <Button variant="outline" onClick={loadPatients}>
                      Search
                    </Button>
                    <Button
                      onClick={() => {
                        setEditingPatientId(null);
                        setPatientForm({
                          name: "",
                          email: "",
                          role: "patient",
                        });
                        setMemberModalOpen(true);
                      }}
                    >
                      New Member
                    </Button>
                  </div>

                  {/* Create/Edit Member Modal */}
                  <Dialog
                    open={memberModalOpen}
                    onOpenChange={setMemberModalOpen}
                  >
                    <DialogContent className="max-w-xl">
                      <DialogHeader>
                        <DialogTitle>
                          {editingPatientId ? "Edit Member" : "New Member"}
                        </DialogTitle>
                      </DialogHeader>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Input
                          placeholder="Full name"
                          value={patientForm.name}
                          onChange={(e) =>
                            setPatientForm((f) => ({
                              ...f,
                              name: e.target.value,
                            }))
                          }
                        />
                        <Input
                          placeholder="Email"
                          value={patientForm.email}
                          onChange={(e) =>
                            setPatientForm((f) => ({
                              ...f,
                              email: e.target.value,
                            }))
                          }
                        />
                        <select
                          className="border rounded-md h-10 px-3"
                          value={patientForm.role}
                          onChange={(e) =>
                            setPatientForm((f) => ({
                              ...f,
                              role: e.target.value,
                            }))
                          }
                        >
                          <option value="patient">Patient</option>
                          <option value="doctor">Doctor</option>
                          <option value="admin">Admin</option>
                        </select>
                        <label className="inline-flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={(patientForm as any).isApproved || false}
                            onChange={(e) =>
                              setPatientForm((f: any) => ({
                                ...f,
                                isApproved: e.target.checked,
                              }))
                            }
                          />
                          Approved
                        </label>
                      </div>
                      <div className="mt-4 flex justify-end gap-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setMemberModalOpen(false);
                            setEditingPatientId(null);
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          disabled={memberSaving || !patientForm.email.trim()}
                          onClick={async () => {
                            if (!token || !patientForm.email.trim()) return;
                            setMemberSaving(true);
                            try {
                              if (editingPatientId) {
                                await updateUserAdmin(
                                  editingPatientId,
                                  patientForm as any,
                                  token
                                );
                              } else {
                                await createUserAdmin(
                                  patientForm as any,
                                  token
                                );
                              }
                              await loadPatients();
                              setMemberModalOpen(false);
                              setEditingPatientId(null);
                              setPatientForm({
                                name: "",
                                email: "",
                                role: "patient",
                              });
                            } finally {
                              setMemberSaving(false);
                            }
                          }}
                        >
                          {memberSaving
                            ? "Saving…"
                            : editingPatientId
                            ? "Save"
                            : "Create"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>

                  {/* Members List */}
                  {patientsLoading ? (
                    <div className="text-sm text-gray-500">Loading…</div>
                  ) : patients.length === 0 ? (
                    <div className="text-sm text-gray-500">
                      No members found.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {patients.map((p: any) => {
                        const isSuper =
                          (p.email || "").toLowerCase() ===
                          SUPER_ADMIN_EMAIL.toLowerCase();
                        return (
                          <div
                            key={p._id || p.uid || p.email}
                            className="flex items-center justify-between p-3 border rounded"
                          >
                            <div>
                              <div className="font-medium">
                                {p.name ||
                                  p.displayName ||
                                  (isSuper
                                    ? SUPER_ADMIN_NAME
                                    : p.email || p.uid)}
                              </div>
                              <div className="text-xs text-gray-500">
                                {(p.email || "").toString()}
                                {p.uid ? ` • UID: ${p.uid}` : ""}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary">
                                {isSuper ? "super admin" : p.role || "unknown"}
                              </Badge>
                              {p.role !== "patient" && !isSuper && (
                                <Badge
                                  variant={
                                    p.isApproved ? "default" : "secondary"
                                  }
                                >
                                  {p.isApproved ? "Approved" : "Pending"}
                                </Badge>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={isSuper && p.uid !== uid}
                                onClick={() => {
                                  setEditingPatientId(
                                    String(p._id || p.id || p.uid)
                                  );
                                  setPatientForm({
                                    name: isSuper
                                      ? SUPER_ADMIN_NAME
                                      : p.name || p.displayName || "",
                                    email: p.email || "",
                                    role: p.role || "patient",
                                    ...(p.role !== "patient"
                                      ? { isApproved: !!p.isApproved }
                                      : {}),
                                  } as any);
                                  setMemberModalOpen(true);
                                }}
                              >
                                Edit
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={isSuper && p.uid !== uid}
                                onClick={async () => {
                                  if (!token) return;
                                  await deleteUserAdmin(
                                    String(p._id || p.id || p.uid),
                                    token
                                  );
                                  await loadPatients();
                                }}
                              >
                                Delete
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="sessions" className="pt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Therapy Sessions</CardTitle>
                  <CardDescription>
                    Manage schedules and venues across the organization.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-4 flex gap-2">
                    <Button onClick={() => setSessionFormOpen(true)}>
                      New Session
                    </Button>
                    <Button variant="outline" onClick={loadSessions}>
                      Refresh
                    </Button>
                  </div>

                  <Dialog
                    open={sessionFormOpen}
                    onOpenChange={setSessionFormOpen}
                  >
                    <DialogContent className="max-w-xl">
                      <DialogHeader>
                        <DialogTitle>New Therapy Session</DialogTitle>
                      </DialogHeader>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <select
                          className="border rounded-md h-10 px-3"
                          value={sessionForm.patient}
                          onChange={(e) =>
                            setSessionForm((f) => ({
                              ...f,
                              patient: e.target.value,
                            }))
                          }
                        >
                          <option value="">Select patient (UID or ID)</option>
                          {patients
                            .filter((p: any) => p.role === "patient")
                            .map((p: any) => (
                              <option
                                key={p._id || p.uid}
                                value={p.uid || p._id}
                              >
                                {p.name || p.email}
                              </option>
                            ))}
                        </select>
                        <select
                          className="border rounded-md h-10 px-3"
                          value={sessionForm.doctor}
                          onChange={(e) =>
                            setSessionForm((f) => ({
                              ...f,
                              doctor: e.target.value,
                            }))
                          }
                        >
                          <option value="">Select doctor</option>
                          {doctorsList.map((d: any) => (
                            <option key={d._id || d.uid} value={d.uid || d._id}>
                              {d.name || d.email}
                            </option>
                          ))}
                        </select>
                        <select
                          className="border rounded-md h-10 px-3"
                          value={sessionForm.therapy}
                          onChange={(e) =>
                            setSessionForm((f) => ({
                              ...f,
                              therapy: e.target.value,
                            }))
                          }
                        >
                          <option value="">Select therapy</option>
                          {therapiesList.map((t: any) => (
                            <option key={t._id} value={t._id}>
                              {t.name}
                            </option>
                          ))}
                        </select>
                        <Input
                          type="datetime-local"
                          value={sessionForm.startTime}
                          onChange={(e) =>
                            setSessionForm((f) => ({
                              ...f,
                              startTime: e.target.value,
                            }))
                          }
                        />
                        <Input
                          type="datetime-local"
                          value={sessionForm.endTime}
                          onChange={(e) =>
                            setSessionForm((f) => ({
                              ...f,
                              endTime: e.target.value,
                            }))
                          }
                        />
                        <Input
                          placeholder="Notes (optional)"
                          value={sessionForm.notes}
                          onChange={(e) =>
                            setSessionForm((f) => ({
                              ...f,
                              notes: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div className="mt-4 flex justify-end gap-2">
                        <Button
                          variant="outline"
                          onClick={() => setSessionFormOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          disabled={
                            sessionSaving ||
                            !sessionForm.patient ||
                            !sessionForm.doctor ||
                            !sessionForm.therapy ||
                            !sessionForm.startTime ||
                            !sessionForm.endTime
                          }
                          onClick={async () => {
                            if (!token) return;
                            setSessionSaving(true);
                            try {
                              await createAppointment(
                                {
                                  patient: sessionForm.patient,
                                  doctor: sessionForm.doctor,
                                  therapy: sessionForm.therapy,
                                  startTime: new Date(
                                    sessionForm.startTime
                                  ).toISOString(),
                                  endTime: new Date(
                                    sessionForm.endTime
                                  ).toISOString(),
                                  notes: sessionForm.notes || undefined,
                                },
                                token
                              );
                              await loadSessions();
                              setSessionFormOpen(false);
                              setSessionForm({
                                patient: "",
                                doctor: "",
                                therapy: "",
                                startTime: "",
                                endTime: "",
                                notes: "",
                              });
                            } finally {
                              setSessionSaving(false);
                            }
                          }}
                        >
                          {sessionSaving ? "Saving…" : "Create"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>

                  {sessionsLoading ? (
                    <div className="text-sm text-gray-500">Loading…</div>
                  ) : sessions.length === 0 ? (
                    <div className="text-sm text-gray-500">
                      No sessions found.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {sessions.map((s: any) => (
                        <div
                          key={s._id || s.id}
                          className="p-3 border rounded flex flex-col md:flex-row md:items-center md:justify-between gap-3"
                        >
                          <div>
                            <div className="font-medium">
                              {formatEntityForDisplay(s.therapy) || "Therapy"} •{" "}
                              {new Date(s.startTime).toLocaleString()} →{" "}
                              {new Date(s.endTime).toLocaleString()}
                            </div>
                            <div className="text-xs text-gray-500">
                              Patient: {formatEntityForDisplay(s.patient)} •
                              Doctor: {formatEntityForDisplay(s.doctor)}
                            </div>
                            <div className="text-xs text-gray-500">
                              Status: {s.status || "scheduled"}
                            </div>
                            {s.therapy?.venueAddress && (
                              <div className="text-xs text-gray-500">
                                Venue: {s.therapy.venueAddress}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={
                                s.status === "completed"
                                  ? "default"
                                  : "secondary"
                              }
                            >
                              {s.status || "scheduled"}
                            </Badge>
                            <Button
                              size="sm"
                              disabled={s.status === "cancelled"}
                              onClick={() => {
                                if (s.status === "cancelled") {
                                  toast.info(
                                    "Cancelled sessions cannot be completed."
                                  );
                                  return;
                                }
                                setSessionActionType("complete");
                                setSessionActionTargetId(String(s._id || s.id));
                                setSessionActionNotes(s.notes || "");
                                setSessionActionOpen(true);
                              }}
                            >
                              Mark Complete
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={s.status === "cancelled"}
                              onClick={() => {
                                if (s.status === "cancelled") {
                                  toast.info(
                                    "Cancelled sessions cannot be delayed."
                                  );
                                  return;
                                }
                                setSessionActionType("delay");
                                setSessionActionTargetId(String(s._id || s.id));
                                setSessionActionNotes(s.notes || "");
                                setSessionActionOpen(true);
                              }}
                            >
                              Mark Delayed
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={async () => {
                                if (!token) return;
                                await deleteAppointment(
                                  String(s._id || s.id),
                                  token
                                );
                                await loadSessions();
                              }}
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="messages" className="pt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Messages</CardTitle>
                  <CardDescription>
                    WhatsApp-like chat with doctors and patients.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <a href="/dashboard/admin/messages">
                    <Button variant="outline">Open Messages</Button>
                  </a>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="roles" className="pt-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Admins</CardTitle>
                    <CardDescription>
                      Assign sub-roles and manage admin users
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {rolesLoading ? (
                      <div className="text-sm text-gray-500">Loading…</div>
                    ) : (
                      <div className="space-y-3">
                        {(admins || []).length === 0 ? (
                          <div className="text-sm text-gray-500">
                            No admins yet.
                          </div>
                        ) : (
                          (admins || []).map((a) => {
                            const id = String(a._id || a.id);
                            const label =
                              adminLabels[id] ||
                              (a.email === SUPER_ADMIN_EMAIL
                                ? "super"
                                : "manager");
                            const isSuperLocked =
                              a.email === SUPER_ADMIN_EMAIL ||
                              a.name === SUPER_ADMIN_NAME;
                            return (
                              <div
                                key={id}
                                className="flex items-center justify-between p-3 border rounded-md"
                              >
                                <div>
                                  <div className="font-medium">
                                    {a.name || a.displayName || a.email}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {a.email}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <select
                                    className="border rounded-md h-9 px-2"
                                    disabled={isSuperLocked}
                                    value={label}
                                    onChange={(e) => {
                                      const next = {
                                        ...adminLabels,
                                        [id]: e.target.value as any,
                                      };
                                      saveAdminLabels(next);
                                    }}
                                  >
                                    <option value="super">Super Admin</option>
                                    <option value="manager">Manager</option>
                                    <option value="support">Support</option>
                                  </select>
                                  {!isSuperLocked &&
                                    String(a._id || a.id) !== String(uid) && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                          handleDemoteFromAdmin(id)
                                        }
                                      >
                                        Demote
                                      </Button>
                                    )}
                                </div>
                              </div>
                            );
                          })
                        )}

                        <div className="pt-3 border-t mt-3">
                          <div className="text-sm font-medium mb-2">
                            Promote user to admin
                          </div>
                          <div className="flex items-center gap-2">
                            <select
                              className="border rounded-md h-9 px-2 flex-1"
                              value={promoteUserId}
                              onChange={(e) => setPromoteUserId(e.target.value)}
                            >
                              <option value="">Select a user…</option>
                              {(nonAdmins || []).map((u) => (
                                <option
                                  key={String(u._id || u.id)}
                                  value={String(u._id || u.id)}
                                >
                                  {(u.name || u.displayName || u.email) +
                                    " • " +
                                    u.role}
                                </option>
                              ))}
                            </select>
                            <Button
                              onClick={handlePromoteToAdmin}
                              disabled={!promoteUserId || promoteSaving}
                            >
                              Promote
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Permissions Matrix</CardTitle>
                    <CardDescription>
                      Define what each admin sub-role can do
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-auto">
                      <table className="w-full text-sm border">
                        <thead>
                          <tr className="bg-accent/30">
                            <th className="text-left p-2 border">Module</th>
                            <th className="text-center p-2 border">
                              Super: View
                            </th>
                            <th className="text-center p-2 border">
                              Super: Manage
                            </th>
                            <th className="text-center p-2 border">
                              Manager: View
                            </th>
                            <th className="text-center p-2 border">
                              Manager: Manage
                            </th>
                            <th className="text-center p-2 border">
                              Support: View
                            </th>
                            <th className="text-center p-2 border">
                              Support: Manage
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {(
                            [
                              "members",
                              "approvals",
                              "sessions",
                              "messages",
                              "reports",
                              "therapies",
                            ] as const
                          ).map((mod) => (
                            <tr key={mod}>
                              <td className="p-2 border font-medium capitalize">
                                {mod}
                              </td>
                              {(
                                ["super", "manager", "support"] as const
                              ).flatMap((r) =>
                                ["view", "manage"].map((cap) => (
                                  <td
                                    key={r + mod + cap}
                                    className="p-2 text-center border"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={
                                        permissionsConfig[r][mod][
                                          cap as "view" | "manage"
                                        ]
                                      }
                                      onChange={(e) => {
                                        const next = { ...permissionsConfig };
                                        next[r] = {
                                          ...next[r],
                                          [mod]: {
                                            ...next[r][mod],
                                            [cap]: e.target.checked,
                                          },
                                        } as any;
                                        savePermissionsConfig(next);
                                      }}
                                    />
                                  </td>
                                ))
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="text-xs text-gray-500 mt-3">
                      Note: Sub-roles are advisory UI permissions saved locally
                      for now. Core access is enforced by backend role checks.
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="reports" className="pt-4">
              <div className="space-y-4">
                <div className="flex flex-col md:flex-row md:items-end gap-3">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">From</div>
                    <Input
                      type="date"
                      value={reportFrom}
                      onChange={(e) => setReportFrom(e.target.value)}
                    />
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">To</div>
                    <Input
                      type="date"
                      value={reportTo}
                      onChange={(e) => setReportTo(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={computeReports}
                      disabled={reportsLoading}
                    >
                      Refresh
                    </Button>
                    <Button onClick={exportCsv} disabled={reportsLoading}>
                      Export CSV
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-xs text-gray-500">Revenue</div>
                      <div className="text-2xl font-semibold mt-1">
                        {formatINR(reportSummary.revenueINR)}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-xs text-gray-500">Utilization</div>
                      <div className="text-2xl font-semibold mt-1">
                        {reportSummary.utilizationPct}%
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-xs text-gray-500">Completed</div>
                      <div className="text-2xl font-semibold mt-1">
                        {reportSummary.completedSessions}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-xs text-gray-500">Avg Rating</div>
                      <div className="text-2xl font-semibold mt-1">
                        {reportSummary.avgRating}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Top Therapies</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {topTherapies.length === 0 ? (
                      <div className="text-sm text-gray-500">
                        No data in selected range.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {topTherapies.map((t) => (
                          <div
                            key={t.name}
                            className="flex items-center justify-between p-2 border rounded-md"
                          >
                            <span>{t.name}</span>
                            <span className="text-sm text-gray-600">
                              {t.count} sessions
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>

          {/* System Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Users className="h-8 w-8 text-blue-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">
                        Total Patients
                      </p>
                      <p className="text-2xl font-bold">
                        {mockData.systemStats.totalPatients}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Shield className="h-8 w-8 text-green-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">
                        Active Therapists
                      </p>
                      <p className="text-2xl font-bold">
                        {mockData.systemStats.activeTherapists}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <DollarSign className="h-8 w-8 text-purple-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">
                        Monthly Revenue
                      </p>
                      <p className="text-2xl font-bold">
                        {formatINR(mockData.systemStats.monthlyRevenue)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <TrendingUp className="h-8 w-8 text-orange-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">
                        Utilization Rate
                      </p>
                      <p className="text-2xl font-bold">
                        {mockData.systemStats.utilizationRate}%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Staff Management */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="h-5 w-5 mr-2" />
                    Staff Management
                  </CardTitle>
                  <CardDescription>
                    Manage your therapy staff and their assignments
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockData.staff.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                            <Shield className="h-5 w-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">{member.name}</p>
                            <p className="text-sm text-gray-500">
                              {member.role} • {member.patients} patients
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge
                            variant={
                              member.status === "active"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {member.status}
                          </Badge>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={goToMembers}
                          >
                            Manage
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button
                    className="w-full mt-4"
                    variant="outline"
                    onClick={goToMembers}
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add New Staff
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Revenue Overview */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="h-5 w-5 mr-2" />
                    Revenue Overview
                  </CardTitle>
                  <CardDescription>
                    Monthly revenue trends and analytics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockData.revenue.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-teal-600 rounded-full flex items-center justify-center">
                            <DollarSign className="h-4 w-4 text-white" />
                          </div>
                          <span className="font-medium">{item.month}</span>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{formatINR(item.amount)}</p>
                          <div className="w-24 bg-gray-200 rounded-full h-2 mt-1">
                            <div
                              className="bg-gradient-to-r from-green-500 to-teal-600 h-2 rounded-full"
                              style={{
                                width: `${(item.amount / 70000) * 100}%`,
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button className="w-full mt-4" variant="outline">
                    View Detailed Reports
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Recent Activities */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="h-5 w-5 mr-2" />
                  Recent Activities
                </CardTitle>
                <CardDescription>System activities and updates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockData.recentActivities.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-start space-x-3 p-4 border rounded-lg"
                    >
                      <div className="flex-shrink-0">
                        {activity.type === "staff" ? (
                          <UserPlus className="h-5 w-5 text-blue-500" />
                        ) : activity.type === "report" ? (
                          <BarChart3 className="h-5 w-5 text-green-500" />
                        ) : (
                          <Calendar className="h-5 w-5 text-purple-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {activity.action}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          {activity.user}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {activity.time}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <Button className="w-full mt-4" variant="outline">
                  View All Activities
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Notification Bar */}
          <div className="flex flex-wrap gap-3 items-center rounded-md border p-3 bg-background/50">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-green-600" />
              <span className="text-sm">Pending approvals:</span>
              <Badge variant="secondary">{pendingDoctors.length}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-blue-600" />
              <span className="text-sm">Unread messages:</span>
              <Badge variant="secondary">{unreadMessagesCount}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-purple-600" />
              <span className="text-sm">Delayed sessions:</span>
              <Badge variant="secondary">
                {
                  (sessions || []).filter(
                    (s: any) =>
                      s.status === "delayed" || s.status === "in_progress"
                  ).length
                }
              </Badge>
            </div>
          </div>
        </div>
      </DashboardLayout>
      {/* Notifications Drawer */}
      <Dialog open={notifOpen} onOpenChange={setNotifOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Notifications & Requests</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <div className="text-sm font-semibold mb-2">
                Pending Approvals
              </div>
              {pendingDoctors.length === 0 ? (
                <div className="text-sm text-gray-500">
                  No pending doctor requests.
                </div>
              ) : (
                <div className="space-y-2">
                  {pendingDoctors.map((doc: any) => (
                    <div
                      key={doc._id || doc.uid || doc.email}
                      className="flex items-center justify-between p-2 border rounded"
                    >
                      <div>
                        <div className="text-sm font-medium">
                          {doc.name || doc.displayName || "Doctor"}
                        </div>
                        <div className="text-xs text-gray-500">{doc.email}</div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={async () => {
                            try {
                              if (!token) return;
                              await approveUser(
                                String(doc._id || doc.id || doc.uid),
                                token
                              );
                              await loadPending();
                            } catch {}
                          }}
                        >
                          Approve
                        </Button>
                        <Button size="sm" variant="outline" disabled>
                          Reject
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <div className="text-sm font-semibold mb-2">Recent Activity</div>
              <div className="space-y-1">
                {mockData.recentActivities.slice(0, 5).map((a) => (
                  <div key={a.id} className="text-sm text-gray-700">
                    • {a.action} —{" "}
                    <span className="text-gray-500">{a.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Session action dialog */}
      <Dialog open={sessionActionOpen} onOpenChange={setSessionActionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {sessionActionType === "complete"
                ? "Mark Session Complete"
                : "Mark Session Delayed"}
            </DialogTitle>
            <DialogDescription>
              Add optional notes before confirming the action. Press Enter to
              save quickly.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Add optional notes or recommendations to attach to this session.
            </p>
            <Textarea
              placeholder="Notes / recommendations (optional)"
              value={sessionActionNotes}
              onChange={(e) => setSessionActionNotes(e.target.value)}
              rows={5}
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setSessionActionOpen(false)}
                disabled={sessionActionSubmitting}
              >
                Cancel
              </Button>
              <Button
                onClick={submitSessionAction}
                disabled={sessionActionSubmitting}
              >
                {sessionActionType === "complete"
                  ? "Confirm Complete"
                  : "Confirm Delayed"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </ProtectedRoute>
  );
}
