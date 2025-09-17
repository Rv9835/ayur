"use client";
import { useAuthStore } from "@/lib/auth-store";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { motion } from "framer-motion";
import {
  getPatientAppointments,
  createAppointment,
  updateAppointmentStatus,
  getDoctors,
  getTherapies,
} from "@/lib/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Clock,
  Plus,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight,
  MapPin,
  User,
  Phone,
  Video,
  MessageSquare,
  AlertCircle,
  CheckCircle,
  XCircle,
  MoreVertical,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import {
  listMessageThreads,
  listChatMessages,
  sendChatMessage,
} from "@/lib/api";

// Types
interface Appointment {
  id: string;
  date: string;
  time: string;
  endTime: string;
  therapist: {
    id: string;
    name: string;
    specialization: string;
    avatar?: string;
  };
  therapy: {
    id: string;
    name: string;
    description: string;
    duration: number;
  };
  status: "scheduled" | "in_progress" | "completed" | "cancelled";
  location: string;
  notes?: string;
  type: "in_person" | "video_call";
}

interface Therapy {
  id: string;
  name: string;
  description: string;
  duration: number;
}

interface Doctor {
  id: string;
  name: string;
  specialization: string;
  avatar?: string;
}

// No mock data - using real backend data only

export default function PatientSchedulePage() {
  const { uid, role, displayName, token } = useAuthStore();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<
    Appointment[]
  >([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [therapies, setTherapies] = useState<Therapy[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isNewAppointmentOpen, setIsNewAppointmentOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newAppointment, setNewAppointment] = useState({
    date: "",
    time: "",
    therapist: "",
    therapy: "",
    type: "in_person" as "in_person" | "video_call",
    notes: "",
  });

  // Chat dialog state
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [activeDoctor, setActiveDoctor] = useState<{
    id: string;
    name: string;
    avatar?: string;
  } | null>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [chatText, setChatText] = useState("");
  const [chatAttachmentUrl, setChatAttachmentUrl] = useState("");
  const chatEndRef = useState<HTMLDivElement | null>(null)[0];

  // Mock payment state
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"upi" | "card">("upi");
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [upiId, setUpiId] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");

  const scrollChatToBottom = () => {
    try {
      const el = document.getElementById("chat-end");
      if (el) el.scrollIntoView({ behavior: "smooth" });
    } catch {}
  };

  async function openChatForDoctor(
    doctorId: string,
    doctorName: string,
    doctorAvatar?: string
  ) {
    if (!uid || !token) return;
    setChatError(null);
    setChatLoading(true);
    setActiveDoctor({ id: doctorId, name: doctorName, avatar: doctorAvatar });
    try {
      const threads = await listMessageThreads(uid, token);
      const thread = threads.find(
        (t) => String(t.doctor?.id) === String(doctorId)
      );
      if (!thread) {
        // Fallback: pick first thread; backend usually ensures per doctor
        if (threads[0]) {
          setActiveChatId(threads[0].chatId);
        } else {
          setChatError("No chat thread found for this therapist.");
          setIsChatOpen(true);
          setChatLoading(false);
          return;
        }
      } else {
        setActiveChatId(thread.chatId);
      }
      const chatId =
        (thread && thread.chatId) || (threads[0] && threads[0].chatId);
      if (chatId) {
        const res = await listChatMessages(chatId, token, uid);
        setChatMessages(res.messages || []);
      }
      setIsChatOpen(true);
      setTimeout(scrollChatToBottom, 0);
    } catch (err: any) {
      setChatError(err?.message || "Failed to open chat");
      setIsChatOpen(true);
    } finally {
      setChatLoading(false);
    }
  }

  async function handleSendChat() {
    if (!activeChatId || !uid || !token) return;
    if (!chatText.trim() && !chatAttachmentUrl.trim()) return;
    try {
      const res = await sendChatMessage(
        activeChatId,
        {
          senderId: uid,
          text: chatText.trim() || undefined,
          attachmentUrl: chatAttachmentUrl.trim() || undefined,
        },
        token
      );
      setChatMessages(res.messages || []);
      setChatText("");
      setChatAttachmentUrl("");
      setTimeout(scrollChatToBottom, 0);
    } catch (err: any) {
      setChatError(err?.message || "Failed to send message");
    }
  }

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      if (!uid || !token) return;

      setIsLoading(true);
      setError(null);

      try {
        const [appointmentsData, doctorsData, therapiesData] =
          await Promise.all([
            getPatientAppointments(uid, token),
            getDoctors(token),
            getTherapies(token),
          ]);

        // Transform API data to match our interface
        const transformedAppointments = (appointmentsData || []).map(
          (apt: any) => {
            const doctor = apt?.doctor || {};
            const therapy = apt?.therapy || {};
            return {
              id: apt?._id || apt?.id || String(Math.random()),
              date: apt?.startTime
                ? new Date(apt.startTime).toISOString().split("T")[0]
                : "",
              time: apt?.startTime
                ? new Date(apt.startTime).toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                  })
                : "",
              endTime: apt?.endTime
                ? new Date(apt.endTime).toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                  })
                : "",
              therapist: {
                id: doctor?._id || doctor?.id || "",
                name: doctor?.name || "Doctor",
                specialty: doctor?.specialty || "Ayurvedic Specialist",
                avatar: doctor?.avatar || undefined,
              },
              therapy: {
                id: therapy?._id || therapy?.id || "",
                name: therapy?.name || "Therapy",
                description: therapy?.description || "",
                duration: therapy?.durationMinutes || therapy?.duration || 0,
              },
              status: apt?.status || "scheduled",
              location:
                apt?.type === "video_call" ? "Video Call" : "Wellness Center",
              notes: apt?.notes || "",
              type: apt?.type || "in_person",
            };
          }
        );

        const transformedDoctors = (doctorsData || []).map((doc: any) => ({
          id: doc?._id || doc?.id,
          name: doc?.name || doc?.displayName || doc?.email || "Doctor",
          specialty: doc?.specialty || "Ayurvedic Specialist",
          avatar: doc?.avatar || undefined,
        }));

        const transformedTherapies = therapiesData.map((therapy: any) => ({
          id: therapy._id,
          name: therapy.name,
          description: therapy.description || "",
          duration: therapy.durationMinutes,
        }));

        setAppointments(transformedAppointments);
        setDoctors(transformedDoctors);
        setTherapies(transformedTherapies);
      } catch (err: any) {
        console.error("Error loading data:", err);
        setError("Failed to load schedule data. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [uid, token]);

  // Filter appointments based on search and status
  useEffect(() => {
    let filtered = appointments;

    if (searchTerm) {
      filtered = filtered.filter(
        (apt) =>
          apt.therapist.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          apt.therapy.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((apt) => apt.status === statusFilter);
    }

    setFilteredAppointments(filtered);
  }, [appointments, searchTerm, statusFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "bg-blue-100 text-blue-800";
      case "in_progress":
        return "bg-yellow-100 text-yellow-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "scheduled":
        return <Clock className="h-4 w-4" />;
      case "in_progress":
        return <AlertCircle className="h-4 w-4" />;
      case "completed":
        return <CheckCircle className="h-4 w-4" />;
      case "cancelled":
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const handleBookAppointment = async () => {
    if (!uid || !token) return;

    try {
      const selectedTherapy = therapies.find(
        (t) => t.id === newAppointment.therapy
      );
      if (!selectedTherapy) {
        setError("Please select a therapy");
        return;
      }

      // Open mock payment dialog instead of immediate booking
      const mins = selectedTherapy.duration || 60;
      const amount = Math.max(300, Math.round((mins / 60) * 800));
      setPaymentAmount(amount);
      setIsPaymentOpen(true);
    } catch (err: any) {
      console.error("Error booking appointment:", err);
      setError(err.message || "Failed to book appointment");
    }
  };

  async function confirmPaymentAndCreate() {
    if (!uid || !token) return;
    const selectedTherapy = therapies.find(
      (t) => t.id === newAppointment.therapy
    );
    if (!selectedTherapy) return;
    setProcessingPayment(true);
    try {
      await new Promise((res) => setTimeout(res, 1200));
      if (paymentMethod === "upi" && (!upiId || !/[@]/.test(upiId))) {
        toast.error("Enter a valid UPI ID (e.g., name@bank)");
        setProcessingPayment(false);
        return;
      }
      if (
        paymentMethod === "card" &&
        (cardNumber.replace(/\s+/g, "").length < 12 ||
          !cardExpiry ||
          cardCvv.length < 3)
      ) {
        toast.error("Enter valid card details");
        setProcessingPayment(false);
        return;
      }

      const startTime = new Date(
        `${newAppointment.date}T${newAppointment.time}:00`
      );
      const endTime = new Date(
        startTime.getTime() + (selectedTherapy.duration || 60) * 60000
      );
      const appointmentData = {
        patient: uid,
        doctor: newAppointment.therapist,
        therapy: newAppointment.therapy,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        notes: `${
          newAppointment.notes || ""
        }\n[Paid: INR ${paymentAmount} via ${paymentMethod.toUpperCase()}]`,
        type: newAppointment.type,
      };
      const created = await createAppointment(appointmentData, token);
      const newApt: Appointment = {
        id: created._id,
        date: newAppointment.date,
        time: newAppointment.time,
        endTime: endTime.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }),
        therapist: doctors.find((d) => d.id === newAppointment.therapist)!,
        therapy: selectedTherapy,
        status: "scheduled",
        location:
          newAppointment.type === "in_person"
            ? "Wellness Center"
            : "Video Call",
        notes: newAppointment.notes,
        type: newAppointment.type,
      };
      setAppointments([...appointments, newApt]);
      setIsPaymentOpen(false);
      setIsNewAppointmentOpen(false);
      setNewAppointment({
        date: "",
        time: "",
        therapist: "",
        therapy: "",
        type: "in_person",
        notes: "",
      });
      toast.success("Payment successful. Appointment booked.");
    } catch (e: any) {
      toast.error(e?.message || "Payment failed");
    } finally {
      setProcessingPayment(false);
    }
  }

  const handleCancelAppointment = async (appointmentId: string) => {
    if (!token) return;

    try {
      await updateAppointmentStatus(appointmentId, "cancelled", token);
      setAppointments(
        appointments.map((apt) =>
          apt.id === appointmentId
            ? { ...apt, status: "cancelled" as const }
            : apt
        )
      );
      setError(null);
    } catch (err: any) {
      console.error("Error cancelling appointment:", err);
      setError(err.message || "Failed to cancel appointment");
    }
  };

  const handleRescheduleAppointment = (appointmentId: string) => {
    // In a real app, this would open a reschedule dialog
    console.log("Reschedule appointment:", appointmentId);
  };

  if (isLoading) {
    return (
      <ProtectedRoute allowedRoles={["patient"]}>
        <DashboardLayout>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading your schedule...</p>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["patient"]}>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 border border-red-200 rounded-lg p-4"
            >
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                <p className="text-red-700">{error}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setError(null)}
                  className="ml-auto text-red-500 hover:text-red-700"
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
          >
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Schedule</h1>
              <p className="text-gray-600 mt-1">
                Manage your therapy appointments and sessions
              </p>
            </div>
            <Dialog
              open={isNewAppointmentOpen}
              onOpenChange={setIsNewAppointmentOpen}
              modal={false}
            >
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Book Appointment
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Book New Appointment</DialogTitle>
                  <DialogDescription>
                    Schedule a new therapy session with your preferred doctor
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="date">Date</Label>
                      <Input
                        id="date"
                        type="date"
                        value={newAppointment.date}
                        onChange={(e) =>
                          setNewAppointment({
                            ...newAppointment,
                            date: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="time">Time</Label>
                      <Input
                        id="time"
                        type="time"
                        value={newAppointment.time}
                        onChange={(e) =>
                          setNewAppointment({
                            ...newAppointment,
                            time: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="therapist">Doctor</Label>
                    <Select
                      value={newAppointment.therapist}
                      onValueChange={(value) =>
                        setNewAppointment({
                          ...newAppointment,
                          therapist: value,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a doctor" />
                      </SelectTrigger>
                      <SelectContent position="popper" className="z-[1000]">
                        {doctors.length === 0 ? (
                          <SelectItem disabled value="__none">
                            No doctors found
                          </SelectItem>
                        ) : (
                          doctors.map((doctor) => (
                            <SelectItem key={doctor.id} value={doctor.id}>
                              {doctor.name} - {doctor.specialization}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="therapy">Therapy</Label>
                    <Select
                      value={newAppointment.therapy}
                      onValueChange={(value) =>
                        setNewAppointment({ ...newAppointment, therapy: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a therapy" />
                      </SelectTrigger>
                      <SelectContent position="popper" className="z-[1000]">
                        {therapies.length === 0 ? (
                          <SelectItem disabled value="__none">
                            No therapies found
                          </SelectItem>
                        ) : (
                          therapies.map((therapy) => (
                            <SelectItem key={therapy.id} value={therapy.id}>
                              {therapy.name} ({therapy.duration} min)
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="type">Session Type</Label>
                    <Select
                      value={newAppointment.type}
                      onValueChange={(value: "in_person" | "video_call") =>
                        setNewAppointment({ ...newAppointment, type: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent position="popper" className="z-[1000]">
                        <SelectItem value="in_person">In-Person</SelectItem>
                        <SelectItem value="video_call">Video Call</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="notes">Notes (Optional)</Label>
                    <Textarea
                      id="notes"
                      placeholder="Any special requests or notes..."
                      value={newAppointment.notes}
                      onChange={(e) =>
                        setNewAppointment({
                          ...newAppointment,
                          notes: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setIsNewAppointmentOpen(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleBookAppointment}
                      className="flex-1"
                      disabled={
                        !newAppointment.date ||
                        !newAppointment.time ||
                        !newAppointment.therapist ||
                        !newAppointment.therapy
                      }
                    >
                      Book Appointment
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </motion.div>

          {/* Filters and Search */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search appointments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </motion.div>

          {/* Appointments List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            {filteredAppointments.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No appointments found
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {searchTerm || statusFilter !== "all"
                      ? "Try adjusting your search or filters"
                      : "You don't have any appointments scheduled yet"}
                  </p>
                  {!searchTerm && statusFilter === "all" && (
                    <Button onClick={() => setIsNewAppointmentOpen(true)}>
                      Book Your First Appointment
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              filteredAppointments.map((appointment, index) => (
                <motion.div
                  key={appointment.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                        {/* Date and Time */}
                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            {(() => {
                              const d = appointment.date
                                ? new Date(appointment.date)
                                : null;
                              const valid = d && !isNaN(d.getTime());
                              const day = valid ? d!.getDate() : "--";
                              const month = valid
                                ? d!.toLocaleDateString("en-US", {
                                    month: "short",
                                  })
                                : "";
                              return (
                                <>
                                  <div className="text-2xl font-bold text-indigo-600">
                                    {day}
                                  </div>
                                  <div className="text-sm text-gray-600">
                                    {month}
                                  </div>
                                </>
                              );
                            })()}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Clock className="h-4 w-4 text-gray-500" />
                              <span className="font-medium">
                                {appointment.time} - {appointment.endTime}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              {appointment.type === "video_call" ? (
                                <Video className="h-4 w-4 text-blue-500" />
                              ) : (
                                <MapPin className="h-4 w-4 text-gray-500" />
                              )}
                              <span className="text-sm text-gray-600">
                                {appointment.location}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Therapy and Doctor Info */}
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-1">
                            {appointment.therapy.name}
                          </h3>
                          <p className="text-sm text-gray-600 mb-2">
                            {appointment.therapy.description}
                          </p>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-500" />
                            <span className="text-sm font-medium">
                              {appointment.therapist.name}
                            </span>
                            <span className="text-sm text-gray-500">
                              - {appointment.therapist.specialization}
                            </span>
                          </div>
                        </div>

                        {/* Status and Actions */}
                        <div className="flex items-center gap-3">
                          <Badge
                            className={`${getStatusColor(
                              appointment.status
                            )} flex items-center gap-1`}
                          >
                            {getStatusIcon(appointment.status)}
                            {appointment.status.replace("_", " ")}
                          </Badge>
                          {appointment.status === "scheduled" && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleRescheduleAppointment(appointment.id)
                                  }
                                >
                                  <Calendar className="h-4 w-4 mr-2" />
                                  Reschedule
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleCancelAppointment(appointment.id)
                                  }
                                  className="text-red-600"
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Cancel
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                          {appointment.status === "scheduled" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                openChatForDoctor(
                                  appointment.therapist.id,
                                  appointment.therapist.name,
                                  appointment.therapist.avatar
                                )
                              }
                            >
                              <MessageSquare className="h-4 w-4 mr-2" />
                              Chat
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Notes */}
                      {appointment.notes && (
                        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-700">
                            <strong>Notes:</strong> {appointment.notes}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </motion.div>

          {/* Quick Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {
                    appointments.filter((apt) => apt.status === "scheduled")
                      .length
                  }
                </div>
                <div className="text-sm text-gray-600">Upcoming</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {
                    appointments.filter((apt) => apt.status === "completed")
                      .length
                  }
                </div>
                <div className="text-sm text-gray-600">Completed</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {
                    appointments.filter((apt) => apt.type === "video_call")
                      .length
                  }
                </div>
                <div className="text-sm text-gray-600">Video Calls</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {
                    appointments.filter((apt) => apt.type === "in_person")
                      .length
                  }
                </div>
                <div className="text-sm text-gray-600">In-Person</div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Chat Dialog */}
          <Dialog open={isChatOpen} onOpenChange={setIsChatOpen}>
            <DialogContent
              className="max-w-2xl p-0 overflow-hidden"
              aria-describedby="chat-desc"
            >
              <DialogHeader className="p-4 border-b">
                <DialogTitle>
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={activeDoctor?.avatar || ""} />
                      <AvatarFallback>
                        {(activeDoctor?.name || "D").slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-semibold">
                        {activeDoctor?.name || "Therapist"}
                      </div>
                      <div className="text-xs text-gray-500">Secure chat</div>
                    </div>
                    <div className="ml-auto">
                      <Button asChild variant="ghost" size="sm">
                        <a href="/dashboard/patient/messages">Open Messages</a>
                      </Button>
                    </div>
                  </div>
                </DialogTitle>
              </DialogHeader>
              <p id="chat-desc" className="sr-only">
                Send messages and attachments to your therapist.
              </p>
              <div className="h-[50vh] flex flex-col">
                <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                  {chatLoading && (
                    <p className="text-sm text-gray-500">
                      Loading conversation...
                    </p>
                  )}
                  {chatError && (
                    <p className="text-sm text-red-600">{chatError}</p>
                  )}
                  {chatMessages.map((m, idx) => {
                    const isMe = m.sender?.uid === uid || m.sender === uid;
                    return (
                      <div
                        key={idx}
                        className={`flex ${
                          isMe ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${
                            isMe ? "bg-indigo-600 text-white" : "bg-gray-100"
                          }`}
                        >
                          {m.text}
                        </div>
                      </div>
                    );
                  })}
                  <div id="chat-end" />
                </div>
                <div className="border-t p-3 flex items-center gap-2">
                  <Input
                    placeholder="Type a message"
                    value={chatText}
                    onChange={(e) => setChatText(e.target.value)}
                  />
                  <Input
                    placeholder="Attachment URL (optional)"
                    value={chatAttachmentUrl}
                    onChange={(e) => setChatAttachmentUrl(e.target.value)}
                  />
                  <Button
                    onClick={handleSendChat}
                    disabled={
                      !activeChatId ||
                      (!chatText.trim() && !chatAttachmentUrl.trim())
                    }
                  >
                    <MessageSquare className="h-4 w-4 mr-1" /> Send
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Mock Payment Dialog */}
          <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Secure Payment</DialogTitle>
                <DialogDescription>
                  Pay INR {paymentAmount} to confirm your appointment.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div className="text-sm text-gray-600">Choose Method</div>
                <div className="flex gap-2">
                  <Button
                    variant={paymentMethod === "upi" ? "default" : "outline"}
                    onClick={() => setPaymentMethod("upi")}
                  >
                    UPI
                  </Button>
                  <Button
                    variant={paymentMethod === "card" ? "default" : "outline"}
                    onClick={() => setPaymentMethod("card")}
                  >
                    Card
                  </Button>
                </div>
                {paymentMethod === "upi" ? (
                  <div>
                    <Label htmlFor="upi">UPI ID</Label>
                    <Input
                      id="upi"
                      placeholder="name@bank"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div>
                      <Label htmlFor="card">Card Number</Label>
                      <Input
                        id="card"
                        placeholder="4111 1111 1111 1111"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label htmlFor="exp">Expiry (MM/YY)</Label>
                        <Input
                          id="exp"
                          placeholder="12/27"
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="cvv">CVV</Label>
                        <Input
                          id="cvv"
                          placeholder="123"
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsPaymentOpen(false)}
                    disabled={processingPayment}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={confirmPaymentAndCreate}
                    disabled={processingPayment}
                    className="flex-1"
                  >
                    {processingPayment
                      ? "Processing…"
                      : `Pay INR ${paymentAmount}`}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
