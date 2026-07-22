"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context";
import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";
import { 
  Users, 
  FileText, 
  CreditCard, 
  TrendingUp, 
  Clock, 
  AlertTriangle, 
  Plus, 
  Search,
  Filter,
  ArrowRight,
  ArrowLeft,
  FileCheck2,
  Briefcase,
  UserPlus,
  Shield,
  Check,
  Power,
  KeyRound,
  User as UserIcon,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Globe,
  Edit,
  Workflow,
  History,
  GripVertical,
  CheckSquare
} from "lucide-react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { STAGE_ORDER, STAGE_LABELS, getAllowedNextStages } from "@/lib/workflow";

function PipelineCard({ app, draggable, onOpen }: { app: any; draggable: boolean; onOpen: () => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `app-${app.id}`,
    data: { app },
    disabled: !draggable,
  });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-card border border-border rounded-xl p-3 shadow-sm text-xs transition-colors ${
        isDragging ? "opacity-40" : "hover:border-primary/50"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <button onClick={onOpen} className="text-left font-bold text-foreground hover:text-primary hover:underline cursor-pointer">
          {app.client?.firstName} {app.client?.lastName}
        </button>
        {draggable && (
          <span {...attributes} {...listeners} className="cursor-grab text-muted-foreground hover:text-foreground touch-none">
            <GripVertical className="h-3.5 w-3.5" />
          </span>
        )}
      </div>
      <p className="text-[10px] text-muted-foreground mt-1">{app.serviceType}</p>
      <p className="text-[10px] text-muted-foreground font-mono mt-0.5">{app.client?.fileNumber}</p>
      {app.assignedStaff?.name && (
        <p className="text-[10px] text-muted-foreground mt-1">{app.assignedStaff.name}</p>
      )}
    </div>
  );
}

function PipelineColumn({ stage, apps, dropState, children }: { stage: string; apps: any[]; dropState: "neutral" | "valid" | "invalid"; children: React.ReactNode }) {
  const { setNodeRef } = useDroppable({ id: stage });
  return (
    <div
      ref={setNodeRef}
      className={`bg-muted/10 border rounded-2xl p-3 flex flex-col min-w-64 w-64 flex-shrink-0 min-h-96 transition-colors ${
        dropState === "valid" ? "border-primary bg-primary/5" : dropState === "invalid" ? "border-destructive/50 bg-destructive/5" : "border-border"
      }`}
    >
      <div className="flex justify-between items-center mb-3 pb-2 border-b border-border">
        <span className="font-bold text-[11px] text-foreground uppercase tracking-wide">{STAGE_LABELS[stage as keyof typeof STAGE_LABELS]}</span>
        <span className="text-[10px] font-bold bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{apps.length}</span>
      </div>
      <div className="space-y-2 flex-1 overflow-y-auto">
        {apps.length === 0 ? (
          <p className="text-[10px] text-muted-foreground text-center py-6">No applications</p>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

export default function Home() {
  const { user, login, logout, isAuthenticated, loginError } = useAuth();
  const [currentTab, setCurrentTab] = useState("dashboard");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Staff Management State
  const [staffUsers, setStaffUsers] = useState<any[]>([]);
  const [staffLoading, setStaffLoading] = useState(false);
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const [newStaffName, setNewStaffName] = useState("");
  const [newStaffEmail, setNewStaffEmail] = useState("");
  const [newStaffPhone, setNewStaffPhone] = useState("");
  const [newStaffRole, setNewStaffRole] = useState<"ADMIN" | "STAFF">("STAFF");
  const [addStaffError, setAddStaffError] = useState<string | null>(null);
  const [addStaffSuccess, setAddStaffSuccess] = useState<string | null>(null);
  const [addStaffLoading, setAddStaffLoading] = useState(false);

  // User Profile Settings State
  const [profileName, setProfileName] = useState("");
  const [profilePhone, setProfilePhone] = useState("");
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  // Password Settings State
  const [newPassword, setNewPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Client Registration State
  const [clients, setClients] = useState<any[]>([]);
  const [clientsLoading, setClientsLoading] = useState(false);
  const [isAddClientOpen, setIsAddClientOpen] = useState(false);
  const [newClientFirstName, setNewClientFirstName] = useState("");
  const [newClientLastName, setNewClientLastName] = useState("");
  const [newClientEmail, setNewClientEmail] = useState("");
  const [newClientPhone, setNewClientPhone] = useState("");
  const [newClientAddress, setNewClientAddress] = useState("");
  const [newClientPassport, setNewClientPassport] = useState("");
  const [newClientDob, setNewClientDob] = useState("");
  const [newClientSource, setNewClientSource] = useState("walk-in");
  const [newClientAssignedStaffId, setNewClientAssignedStaffId] = useState("");
  const [addClientError, setAddClientError] = useState<string | null>(null);
  const [addClientSuccess, setAddClientSuccess] = useState<string | null>(null);
  const [addClientLoading, setAddClientLoading] = useState(false);

  // Client Search & Filter State
  const [clientSearch, setClientSearch] = useState("");
  const [clientFilterSource, setClientFilterSource] = useState("all");
  const [clientFilterStaff, setClientFilterStaff] = useState("all");

  // Client Profile State
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [clientProfileLoading, setClientProfileLoading] = useState(false);
  const [isEditingClient, setIsEditingClient] = useState(false);
  const [editClientFirstName, setEditClientFirstName] = useState("");
  const [editClientLastName, setEditClientLastName] = useState("");
  const [editClientEmail, setEditClientEmail] = useState("");
  const [editClientPhone, setEditClientPhone] = useState("");
  const [editClientAddress, setEditClientAddress] = useState("");
  const [editClientPassport, setEditClientPassport] = useState("");
  const [editClientDob, setEditClientDob] = useState("");
  const [editClientSource, setEditClientSource] = useState("");
  const [editClientAssignedStaffId, setEditClientAssignedStaffId] = useState("");
  const [editClientError, setEditClientError] = useState<string | null>(null);
  const [editClientLoading, setEditClientLoading] = useState(false);

  // Application State
  const [applications, setApplications] = useState<any[]>([]);
  const [applicationsLoading, setApplicationsLoading] = useState(false);
  const [isAddAppOpen, setIsAddAppOpen] = useState(false);
  const [newAppClientId, setNewAppClientId] = useState("");
  const [newAppServiceType, setNewAppServiceType] = useState("UK Tourist Visa");
  const [newAppDestination, setNewAppDestination] = useState("");
  const [newAppPurpose, setNewAppPurpose] = useState("");
  const [newAppTravelDate, setNewAppTravelDate] = useState("");
  const [newAppStaffId, setNewAppStaffId] = useState("");
  const [addAppError, setAddAppError] = useState<string | null>(null);
  const [addAppSuccess, setAddAppSuccess] = useState<string | null>(null);
  const [addAppLoading, setAddAppLoading] = useState(false);

  // Application Detail State
  const [selectedApplication, setSelectedApplication] = useState<any>(null);
  const [applicationDetailLoading, setApplicationDetailLoading] = useState(false);
  const [stageHistory, setStageHistory] = useState<any[]>([]);
  const [stageHistoryLoading, setStageHistoryLoading] = useState(false);
  const [stageActionLoading, setStageActionLoading] = useState(false);
  const [stageActionError, setStageActionError] = useState<string | null>(null);

  // Pipeline Board State
  const [pipelineError, setPipelineError] = useState<string | null>(null);
  const [activeDragApp, setActiveDragApp] = useState<any>(null);

  // Task Management State
  const [tasks, setTasks] = useState<any[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [newTaskClientId, setNewTaskClientId] = useState("");
  const [newTaskApplicationId, setNewTaskApplicationId] = useState("");
  const [newTaskStage, setNewTaskStage] = useState("");
  const [newTaskAssigneeId, setNewTaskAssigneeId] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState("MEDIUM");
  const [newTaskDueDate, setNewTaskDueDate] = useState("");
  const [addTaskError, setAddTaskError] = useState<string | null>(null);
  const [addTaskSuccess, setAddTaskSuccess] = useState<string | null>(null);
  const [addTaskLoading, setAddTaskLoading] = useState(false);

  // Sync profile fields when user is loaded
  useEffect(() => {
    if (user) {
      setProfileName(user.name);
      setProfilePhone(user.phone || "");
    }
  }, [user]);

  // Load staff list if Admin selects the Staff Management tab
  const fetchStaff = async () => {
    if (user?.role.toUpperCase() !== "ADMIN") return;
    setStaffLoading(true);
    try {
      const res = await fetch("/api/staff");
      const data = await res.json();
      if (res.ok) {
        setStaffUsers(data.users);
      }
    } catch (err) {
      console.error("Failed to load staff list:", err);
    } finally {
      setStaffLoading(false);
    }
  };

  useEffect(() => {
    if (currentTab === "staff" && user?.role.toUpperCase() === "ADMIN") {
      fetchStaff();
    }
  }, [currentTab, user]);

  // Load clients when Clients tab is selected
  const fetchClients = async () => {
    setClientsLoading(true);
    try {
      const res = await fetch("/api/clients");
      const data = await res.json();
      if (res.ok) {
        setClients(data.clients);
      }
    } catch (err) {
      console.error("Failed to load clients:", err);
    } finally {
      setClientsLoading(false);
    }
  };

  useEffect(() => {
    if (currentTab === "clients") {
      fetchClients();
    }
  }, [currentTab]);

  // Fetch single client for profile view
  const viewClientProfile = async (clientId: number) => {
    setClientProfileLoading(true);
    try {
      const res = await fetch(`/api/clients`);
      const data = await res.json();
      if (res.ok) {
        const client = data.clients.find((c: any) => c.id === clientId);
        setSelectedClient(client || null);
      }
    } catch (err) {
      console.error("Failed to load client profile:", err);
    } finally {
      setClientProfileLoading(false);
    }
  };

  // Load applications when Applications tab is selected
  const fetchApplications = async () => {
    setApplicationsLoading(true);
    try {
      const res = await fetch("/api/applications");
      const data = await res.json();
      if (res.ok) {
        setApplications(data.applications);
      }
    } catch (err) {
      console.error("Failed to load applications:", err);
    } finally {
      setApplicationsLoading(false);
    }
  };

  useEffect(() => {
    if (currentTab === "applications" || currentTab === "pipeline") {
      fetchApplications();
      if (clients.length === 0) fetchClients();
    }
  }, [currentTab]);

  // Load tasks when Tasks tab is selected
  const fetchTasks = async () => {
    setTasksLoading(true);
    try {
      const res = await fetch("/api/tasks");
      const data = await res.json();
      if (res.ok) {
        setTasks(data.tasks);
      }
    } catch (err) {
      console.error("Failed to load tasks:", err);
    } finally {
      setTasksLoading(false);
    }
  };

  useEffect(() => {
    if (currentTab === "tasks") {
      fetchTasks();
      if (staffUsers.length === 0) fetchStaff();
    }
  }, [currentTab]);

  // Load dashboard stats
  useEffect(() => {
    if (currentTab === "dashboard") {
      fetchTasks();
      if (clients.length === 0) fetchClients();
      if (applications.length === 0) fetchApplications();
    }
  }, [currentTab]);

  // Fetch a single application for the detail view
  const viewApplication = async (applicationId: number) => {
    setApplicationDetailLoading(true);
    setStageActionError(null);
    try {
      const res = await fetch(`/api/applications/${applicationId}`);
      const data = await res.json();
      if (res.ok) {
        setSelectedApplication(data.application);
        fetchStageHistory(applicationId);
      }
    } catch (err) {
      console.error("Failed to load application:", err);
    } finally {
      setApplicationDetailLoading(false);
    }
  };

  const fetchStageHistory = async (applicationId: number) => {
    setStageHistoryLoading(true);
    try {
      const res = await fetch(`/api/applications/${applicationId}/stage`);
      const data = await res.json();
      if (res.ok) setStageHistory(data.history);
    } catch (err) {
      console.error("Failed to load stage history:", err);
    } finally {
      setStageHistoryLoading(false);
    }
  };

  // Move an application to a new stage (used by both the detail page buttons and the pipeline board drag/drop)
  const moveApplicationStage = async (applicationId: number, toStage: string, decisionStatus?: string | null) => {
    setStageActionLoading(true);
    setStageActionError(null);
    setPipelineError(null);
    try {
      const res = await fetch(`/api/applications/${applicationId}/stage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toStage, decisionStatus }),
      });
      const data = await res.json();

      if (!res.ok) {
        setStageActionError(data.error || "Failed to move application");
        setPipelineError(data.error || "Failed to move application");
        return false;
      }

      setApplications((prev) => prev.map((a) => (a.id === applicationId ? data.application : a)));
      if (selectedApplication?.id === applicationId) {
        setSelectedApplication(data.application);
        setStageHistory((prev) => [...prev, data.history]);
      }
      return true;
    } catch (err) {
      console.error("Failed to move application stage:", err);
      setStageActionError("Failed to move application");
      setPipelineError("Failed to move application");
      return false;
    } finally {
      setStageActionLoading(false);
    }
  };

  const canTransitionApplication = (app: any) => {
    if (!user) return false;
    if (user.role.toUpperCase() === "ADMIN") return true;
    return app.client?.assignedStaffId === user.id;
  };

  // Pipeline board drag-and-drop
  const pipelineSensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handlePipelineDragStart = (event: DragStartEvent) => {
    setActiveDragApp(event.active.data.current?.app || null);
  };

  const handlePipelineDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragApp(null);
    if (!over) return;

    const app = active.data.current?.app;
    const toStage = String(over.id);
    if (!app || app.currentStage === toStage) return;

    if (!(getAllowedNextStages(app.currentStage) as string[]).includes(toStage)) {
      setPipelineError(`Cannot move from ${STAGE_LABELS[app.currentStage as keyof typeof STAGE_LABELS]} to ${STAGE_LABELS[toStage as keyof typeof STAGE_LABELS]}`);
      return;
    }

    // Reverting from a terminal path back to Decision clears the stale decision outcome
    const decisionStatus = toStage === "DECISION" && app.currentStage !== "DECISION" ? null : undefined;

    // Move the card instantly; only snap it back if the server rejects the move
    const previousStage = app.currentStage;
    setApplications((prev) => prev.map((a) => (a.id === app.id ? { ...a, currentStage: toStage } : a)));

    const success = await moveApplicationStage(app.id, toStage, decisionStatus);
    if (!success) {
      setApplications((prev) => prev.map((a) => (a.id === app.id ? { ...a, currentStage: previousStage } : a)));
    }
  };

  const handleCreateApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddAppLoading(true);
    setAddAppError(null);
    setAddAppSuccess(null);

    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: Number(newAppClientId),
          serviceType: newAppServiceType,
          destinationCountry: newAppDestination,
          travelPurpose: newAppPurpose,
          expectedTravelDate: newAppTravelDate || undefined,
          assignedStaffId: newAppStaffId ? Number(newAppStaffId) : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setAddAppError(data.error || "Failed to create application");
      } else {
        setAddAppSuccess("Application created successfully!");
        setNewAppClientId("");
        setNewAppServiceType("UK Tourist Visa");
        setNewAppDestination("");
        setNewAppPurpose("");
        setNewAppTravelDate("");
        setNewAppStaffId("");
        fetchApplications();
      }
    } catch (err) {
      setAddAppError("Connection error. Please try again.");
    } finally {
      setAddAppLoading(false);
    }
  };

  // Enforce role-based access control inside client
  useEffect(() => {
    const adminOnlyTabs = ["payments", "reviews", "reports", "staff"];
    if (user && user.role.toUpperCase() !== "ADMIN" && adminOnlyTabs.includes(currentTab)) {
      setCurrentTab("dashboard");
    }
  }, [currentTab, user]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await login(email, password);
    setLoading(false);
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddStaffLoading(true);
    setAddStaffError(null);
    setAddStaffSuccess(null);

    try {
      const res = await fetch("/api/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newStaffName,
          email: newStaffEmail,
          phone: newStaffPhone || undefined,
          role: newStaffRole,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setAddStaffError(data.error || "Failed to create staff member");
      } else {
        setAddStaffSuccess("Staff member added successfully! Default password is 'password123'.");
        setNewStaffName("");
        setNewStaffEmail("");
        setNewStaffPhone("");
        setNewStaffRole("STAFF");
        fetchStaff();
      }
    } catch (err) {
      setAddStaffError("Connection error. Please try again.");
    } finally {
      setAddStaffLoading(false);
    }
  };

  const handleToggleStatus = async (userId: number, currentStatus: string) => {
    const nextStatus = currentStatus === "active" ? "inactive" : "active";
    try {
      const res = await fetch("/api/staff", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, status: nextStatus }),
      });
      if (res.ok) {
        fetchStaff();
      }
    } catch (err) {
      console.error("Failed to toggle status:", err);
    }
  };

  const handleToggleRole = async (userId: number, currentRole: string) => {
    const nextRole = currentRole.toUpperCase() === "ADMIN" ? "STAFF" : "ADMIN";
    try {
      const res = await fetch("/api/staff", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: nextRole }),
      });
      if (res.ok) {
        fetchStaff();
      }
    } catch (err) {
      console.error("Failed to toggle role:", err);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setProfileLoading(true);
    setProfileError(null);
    setProfileSuccess(null);

    try {
      const res = await fetch("/api/staff", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          name: profileName,
          phone: profilePhone,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setProfileError(data.error || "Failed to update profile");
      } else {
        setProfileSuccess("Profile updated successfully!");
        // Update local storage session cache
        const updatedCache = { ...user, name: profileName, phone: profilePhone };
        localStorage.setItem("waypoint_user", JSON.stringify(updatedCache));
      }
    } catch (err) {
      setProfileError("Connection error. Please try again.");
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setPasswordLoading(true);
    setPasswordError(null);
    setPasswordSuccess(null);

    if (newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters long.");
      setPasswordLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/staff", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          password: newPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setPasswordError(data.error || "Failed to update password");
      } else {
        setPasswordSuccess("Password updated successfully! Log in next time with your new password.");
        setNewPassword("");
      }
    } catch (err) {
      setPasswordError("Connection error. Please try again.");
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddClientLoading(true);
    setAddClientError(null);
    setAddClientSuccess(null);

    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: newClientFirstName,
          lastName: newClientLastName,
          email: newClientEmail,
          phone: newClientPhone,
          address: newClientAddress || undefined,
          passportNumber: newClientPassport || undefined,
          dateOfBirth: newClientDob || undefined,
          source: newClientSource,
          createdById: user?.id,
          assignedStaffId: newClientAssignedStaffId ? Number(newClientAssignedStaffId) : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setAddClientError(data.error || "Failed to create client");
      } else {
        setAddClientSuccess(`Client registered successfully! File number: ${data.client.fileNumber}`);
        setNewClientFirstName("");
        setNewClientLastName("");
        setNewClientEmail("");
        setNewClientPhone("");
        setNewClientAddress("");
        setNewClientPassport("");
        setNewClientDob("");
        setNewClientSource("walk-in");
        setNewClientAssignedStaffId("");
        fetchClients();
      }
    } catch (err) {
      setAddClientError("Connection error. Please try again.");
    } finally {
      setAddClientLoading(false);
    }
  };

  const handleUpdateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditClientLoading(true);
    setEditClientError(null);

    try {
      const res = await fetch("/api/clients", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedClient.id,
          firstName: editClientFirstName,
          lastName: editClientLastName,
          email: editClientEmail,
          phone: editClientPhone,
          address: editClientAddress || undefined,
          passportNumber: editClientPassport || undefined,
          dateOfBirth: editClientDob || undefined,
          source: editClientSource,
          assignedStaffId: editClientAssignedStaffId ? Number(editClientAssignedStaffId) : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setEditClientError(data.error || "Failed to update client");
      } else {
        setSelectedClient(data.client);
        setIsEditingClient(false);
        fetchClients();
      }
    } catch (err) {
      setEditClientError("Connection error. Please try again.");
    } finally {
      setEditClientLoading(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddTaskLoading(true);
    setAddTaskError(null);
    setAddTaskSuccess(null);

    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTaskTitle,
          description: newTaskDescription || undefined,
          clientId: Number(newTaskClientId),
          applicationId: newTaskApplicationId ? Number(newTaskApplicationId) : undefined,
          stage: newTaskStage || undefined,
          assigneeId: newTaskAssigneeId ? Number(newTaskAssigneeId) : undefined,
          priority: newTaskPriority,
          dueDate: newTaskDueDate || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setAddTaskError(data.error || "Failed to create task");
      } else {
        setAddTaskSuccess("Task created successfully!");
        setNewTaskTitle("");
        setNewTaskDescription("");
        setNewTaskClientId("");
        setNewTaskApplicationId("");
        setNewTaskStage("");
        setNewTaskAssigneeId("");
        setNewTaskPriority("MEDIUM");
        setNewTaskDueDate("");
        fetchTasks();
      }
    } catch (err) {
      setAddTaskError("Connection error. Please try again.");
    } finally {
      setAddTaskLoading(false);
    }
  };

  const handleUpdateTaskStatus = async (taskId: number, newStatus: string) => {
    try {
      const res = await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: taskId, status: newStatus }),
      });

      if (res.ok) {
        const data = await res.json();
        setTasks((prev) => prev.map((t) => (t.id === taskId ? data.task : t)));
      }
    } catch (err) {
      console.error("Failed to update task status:", err);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col md:flex-row bg-background font-sans relative overflow-hidden">
        {/* Decorative background grid/mesh */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,var(--color-primary)_0%,transparent_60%)] opacity-10 pointer-events-none"></div>
        <div className="absolute -left-48 -bottom-48 w-96 h-96 rounded-full bg-primary/10 blur-3xl pointer-events-none"></div>

        {/* Brand Left Panel */}
        <div className="flex-1 flex flex-col justify-between p-10 md:p-16 bg-gradient-to-br from-card to-background border-r border-border relative">
          <div className="flex items-center gap-3">
            <div className="bg-primary p-2.5 rounded-xl text-primary-foreground">
              <Plus className="h-6 w-6 transform rotate-45" />
            </div>
            <div>
              <h1 className="font-extrabold text-lg leading-none tracking-tight text-foreground">WAY POINT</h1>
              <span className="text-[10px] text-muted-foreground font-semibold tracking-widest uppercase">Travel Ltd</span>
            </div>
          </div>

          <div className="my-auto py-12 max-w-lg">
            <h2 className="text-4xl md:text-5xl font-extrabold leading-tight text-foreground tracking-tight">
              Smarter Travel & <br />
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Visa Workflows</span>
            </h2>
            <p className="mt-4 text-muted-foreground text-sm leading-relaxed">
              Experience the premium internal operating platform built for Way Point Travel Limited. 
              Manage clients, automate checklists, track payments, and optimize staff delivery from inquiry to travel.
            </p>
            <div className="mt-8 flex gap-6">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span className="text-xs font-semibold text-muted-foreground">Secure Core</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary"></div>
                <span className="text-xs font-semibold text-muted-foreground">Next.js & Tailwind 4</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                <span className="text-xs font-semibold text-muted-foreground">TypeScript Ready</span>
              </div>
            </div>
          </div>

          <p className="text-xs text-muted-foreground font-medium">
            © {new Date().getFullYear()} Way Point Travel Limited. All rights reserved.
          </p>
        </div>

        {/* Login Right Panel */}
        <div className="flex-1 flex items-center justify-center p-8 md:p-16">
          <div className="w-full max-w-md bg-card/60 backdrop-blur-md border border-border/80 rounded-3xl p-8 md:p-10 shadow-xl shadow-foreground/5 transition-all">
            <div className="text-center md:text-left mb-8">
              <h3 className="text-2xl font-bold text-foreground">Staff Portal</h3>
              <p className="text-sm text-muted-foreground mt-1">Sign in with your assigned credentials to start working.</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              {loginError && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold px-4 py-2.5 rounded-xl">
                  {loginError}
                </div>
              )}

              {/* Demo Accounts helper */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Demo Accounts</label>
                <div className="grid grid-cols-2 gap-2 bg-muted/40 p-1.5 rounded-xl border border-border">
                  <button
                    type="button"
                    onClick={() => {
                      setEmail("admin@waypoint.com");
                      setPassword("password123");
                    }}
                    className={`py-2 rounded-lg text-xs font-bold transition-all ${
                      email === "admin@waypoint.com" 
                        ? "bg-card text-foreground shadow-sm" 
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Admin Profile
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEmail("staff@waypoint.com");
                      setPassword("password123");
                    }}
                    className={`py-2 rounded-lg text-xs font-bold transition-all ${
                      email === "staff@waypoint.com" 
                        ? "bg-card text-foreground shadow-sm" 
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Staff Profile
                  </button>
                </div>
              </div>

              {/* Email Input */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground" htmlFor="email">Email Address</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="name@waypoint.com"
                  className="w-full bg-muted/20 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground"
                />
              </div>

              {/* Password Input */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold text-muted-foreground" htmlFor="password">Password</label>
                  <a href="#" className="text-xs text-primary hover:underline font-semibold">Forgot?</a>
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-muted/20 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-primary-foreground font-semibold rounded-xl py-3 text-sm hover:opacity-95 shadow-md shadow-primary/10 transition-all flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <div className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    Sign In 
                    <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Logged-in System Layout Shell Mockups
  return (
    <div className="min-h-screen flex bg-background font-sans text-foreground">
      {/* Shared Sidebar */}
      <Sidebar currentTab={currentTab} setCurrentTab={setCurrentTab} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen bg-muted/10">
        <Topbar currentTab={currentTab} />

        {/* Scrollable container for tab contents */}
        <main className="flex-1 p-8 overflow-y-auto">
          {currentTab === "dashboard" && (
            <div className="space-y-8 animate-in fade-in duration-200">
              {/* Header Greeting */}
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-extrabold text-foreground">Welcome back, {user?.name}!</h3>
                  <p className="text-xs text-muted-foreground">Here is the status of your travel applications and workflows today.</p>
                </div>
                <button onClick={() => setCurrentTab("clients")} className="bg-primary text-primary-foreground text-xs font-bold px-4 py-2.5 rounded-xl shadow-md shadow-primary/10 flex items-center gap-2 hover:opacity-90 transition-all cursor-pointer">
                  <Plus className="h-4 w-4" /> New Client inquiry
                </button>
              </div>

              {/* Status Metric Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
                  <div className="flex justify-between items-start">
                    <div className="bg-blue-500/10 p-2.5 rounded-xl text-blue-500">
                      <Users className="h-5 w-5" />
                    </div>
                  </div>
                  <h4 className="text-2xl font-black mt-4 text-foreground">{clients.length}</h4>
                  <p className="text-xs text-muted-foreground font-medium mt-1">Active Client Profiles</p>
                </div>

                <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
                  <div className="flex justify-between items-start">
                    <div className="bg-primary/10 p-2.5 rounded-xl text-primary">
                      <TrendingUp className="h-5 w-5" />
                    </div>
                  </div>
                  <h4 className="text-2xl font-black mt-4 text-foreground">{applications.length}</h4>
                  <p className="text-xs text-muted-foreground font-medium mt-1">Visa Processing Pipeline</p>
                </div>

                <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
                  <div className="flex justify-between items-start">
                    <div className="bg-yellow-500/10 p-2.5 rounded-xl text-yellow-600">
                      <Clock className="h-5 w-5" />
                    </div>
                  </div>
                  <h4 className="text-2xl font-black mt-4 text-foreground">{tasks.filter((t: any) => t.status === "TODO" || t.status === "IN_PROGRESS").length}</h4>
                  <p className="text-xs text-muted-foreground font-medium mt-1">Active Tasks</p>
                </div>

                <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
                  <div className="flex justify-between items-start">
                    <div className="bg-red-500/10 p-2.5 rounded-xl text-red-500">
                      <AlertTriangle className="h-5 w-5" />
                    </div>
                  </div>
                  <h4 className="text-2xl font-black mt-4 text-foreground">
                    {tasks.filter((t: any) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "DONE" && t.status !== "CANCELLED").length}
                  </h4>
                  <p className="text-xs text-muted-foreground font-medium mt-1">Overdue Staff Tasks</p>
                </div>
              </div>

              {/* Core Layout Panels */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Pipeline Overview Section */}
                <div className="xl:col-span-2 bg-card border border-border rounded-2xl p-6 shadow-sm">
                  <h4 className="font-bold text-sm text-foreground mb-4">Pipeline Overview</h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {STAGE_ORDER.slice(0, 10).map((stage) => {
                      const count = applications.filter((a: any) => a.currentStage === stage).length;
                      return (
                        <div key={stage} className="flex items-center justify-between p-2.5 rounded-xl hover:bg-muted/20 transition-colors">
                          <span className="text-xs font-semibold text-foreground">{STAGE_LABELS[stage]}</span>
                          <span className="text-[10px] font-bold bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Task Checklist Panel */}
                <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col">
                  <h4 className="font-bold text-sm text-foreground mb-4">My High-Priority Tasks</h4>
                  <div className="space-y-3 flex-1 max-h-64 overflow-y-auto">
                    {tasks.filter((t: any) => t.status !== "DONE" && t.status !== "CANCELLED").slice(0, 6).length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-8">No active tasks</p>
                    ) : (
                      tasks.filter((t: any) => t.status !== "DONE" && t.status !== "CANCELLED").slice(0, 6).map((t: any) => (
                        <div key={t.id} className="p-3 border border-border/80 rounded-xl hover:border-primary/50 transition-colors flex justify-between items-center group bg-muted/20">
                          <div>
                            <p className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">{t.title}</p>
                            <span className="text-[10px] text-muted-foreground">{t.client?.firstName} {t.client?.lastName}</span>
                          </div>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-lg ${
                            t.priority === "URGENT" ? "bg-red-500/10 text-red-600" :
                            t.priority === "HIGH" ? "bg-orange-500/10 text-orange-600" :
                            "bg-primary/10 text-primary"
                          }`}>
                            {t.priority}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Recent Tasks Table */}
              <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-bold text-sm text-foreground">Recent Tasks</h4>
                  <button onClick={() => setCurrentTab("tasks")} className="text-xs text-primary font-semibold hover:underline cursor-pointer">View All</button>
                </div>
                {tasks.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-8">No tasks yet</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left p-3 font-bold text-muted-foreground uppercase text-[10px]">Task</th>
                          <th className="text-left p-3 font-bold text-muted-foreground uppercase text-[10px]">Client</th>
                          <th className="text-left p-3 font-bold text-muted-foreground uppercase text-[10px]">Assignee</th>
                          <th className="text-left p-3 font-bold text-muted-foreground uppercase text-[10px]">Priority</th>
                          <th className="text-left p-3 font-bold text-muted-foreground uppercase text-[10px]">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tasks.slice(0, 5).map((t: any) => (
                          <tr key={t.id} className="border-b border-border/60 hover:bg-muted/10 transition-colors">
                            <td className="p-3">
                              <p className="font-bold text-foreground">{t.title}</p>
                            </td>
                            <td className="p-3">
                              <span className="font-semibold text-foreground">{t.client?.firstName} {t.client?.lastName}</span>
                            </td>
                            <td className="p-3">
                              <span className="text-[10px]">{t.assignee?.name || "Unassigned"}</span>
                            </td>
                            <td className="p-3">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                t.priority === "URGENT" ? "bg-red-500/10 text-red-600" :
                                t.priority === "HIGH" ? "bg-orange-500/10 text-orange-600" :
                                "bg-blue-500/10 text-blue-600"
                              }`}>{t.priority}</span>
                            </td>
                            <td className="p-3">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                t.status === "DONE" ? "bg-green-500/10 text-green-600" :
                                t.status === "IN_PROGRESS" ? "bg-blue-500/10 text-blue-600" :
                                "bg-muted text-muted-foreground"
                              }`}>{t.status.replace(/_/g, " ")}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {currentTab === "clients" && !selectedClient && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex justify-between items-center flex-wrap gap-4">
                <div>
                  <h3 className="text-lg font-bold text-foreground">Client Records</h3>
                  <p className="text-xs text-muted-foreground">Manage and filter client files and travel history.</p>
                </div>
                <div className="flex items-center gap-3">
                  {user?.role === "ADMIN" && (
                  <button
                    onClick={() => {
                      setIsAddClientOpen(true);
                      setAddClientError(null);
                      setAddClientSuccess(null);
                    }}
                    className="bg-primary text-primary-foreground text-xs font-bold px-4 py-2.5 rounded-xl shadow-md shadow-primary/10 flex items-center gap-2 hover:opacity-90 transition-all cursor-pointer"
                  >
                    <UserPlus className="h-4 w-4" /> Register Client
                  </button>
                  )}
                </div>
              </div>

              {/* Search & Filter Bar */}
              <div className="flex items-center gap-3 flex-wrap">
                <div className="relative flex-1 min-w-[200px] max-w-md">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search by name, email, file number, or passport..."
                    value={clientSearch}
                    onChange={(e) => setClientSearch(e.target.value)}
                    className="w-full bg-card border border-border rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all text-foreground"
                  />
                </div>
                <select
                  value={clientFilterSource}
                  onChange={(e) => setClientFilterSource(e.target.value)}
                  className="bg-card border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-foreground"
                >
                  <option value="all">All Sources</option>
                  <option value="walk-in">Walk-in</option>
                  <option value="phone">Phone</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="referral">Referral</option>
                  <option value="website">Website</option>
                  <option value="social-media">Social Media</option>
                </select>
                <select
                  value={clientFilterStaff}
                  onChange={(e) => setClientFilterStaff(e.target.value)}
                  className="bg-card border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-foreground"
                >
                  <option value="all">All Staff</option>
                  <option value="unassigned">Unassigned</option>
                  {staffUsers.map((s) => (
                    <option key={s.id} value={String(s.id)}>
                      {s.name}
                    </option>
                  ))}
                </select>
                {(clientSearch || clientFilterSource !== "all" || clientFilterStaff !== "all") && (
                  <button
                    onClick={() => {
                      setClientSearch("");
                      setClientFilterSource("all");
                      setClientFilterStaff("all");
                    }}
                    className="text-[10px] text-muted-foreground hover:text-foreground font-semibold underline cursor-pointer"
                  >
                    Clear filters
                  </button>
                )}
              </div>

              {/* Add Client Modal */}
              {isAddClientOpen && (
                <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
                  <div className="bg-card border border-border w-full max-w-lg rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
                    <div className="p-6 border-b border-border flex justify-between items-center bg-muted/20">
                      <h4 className="font-bold text-foreground text-sm flex items-center gap-2">
                        <UserPlus className="h-4 w-4 text-primary" /> Register New Client
                      </h4>
                      <button
                        onClick={() => setIsAddClientOpen(false)}
                        className="text-muted-foreground hover:text-foreground font-semibold text-xs border border-border rounded-lg px-2 py-1 bg-card hover:bg-secondary cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>

                    <form onSubmit={handleCreateClient} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                      {addClientError && (
                        <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-3 text-xs font-semibold text-destructive">
                          {addClientError}
                        </div>
                      )}
                      {addClientSuccess && (
                        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3 text-xs font-semibold text-green-600">
                          {addClientSuccess}
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-muted-foreground uppercase">First Name *</label>
                          <input
                            type="text"
                            required
                            value={newClientFirstName}
                            onChange={(e) => setNewClientFirstName(e.target.value)}
                            placeholder="John"
                            className="w-full bg-muted/20 border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-foreground"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-muted-foreground uppercase">Last Name *</label>
                          <input
                            type="text"
                            required
                            value={newClientLastName}
                            onChange={(e) => setNewClientLastName(e.target.value)}
                            placeholder="Doe"
                            className="w-full bg-muted/20 border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-foreground"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-muted-foreground uppercase">Email *</label>
                          <input
                            type="email"
                            required
                            value={newClientEmail}
                            onChange={(e) => setNewClientEmail(e.target.value)}
                            placeholder="client@email.com"
                            className="w-full bg-muted/20 border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-foreground"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-muted-foreground uppercase">Phone *</label>
                          <input
                            type="text"
                            required
                            value={newClientPhone}
                            onChange={(e) => setNewClientPhone(e.target.value)}
                            placeholder="+1234567890"
                            className="w-full bg-muted/20 border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-foreground"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-muted-foreground uppercase">Address</label>
                        <input
                          type="text"
                          value={newClientAddress}
                          onChange={(e) => setNewClientAddress(e.target.value)}
                          placeholder="123 Main Street, City"
                          className="w-full bg-muted/20 border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-foreground"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-muted-foreground uppercase">Passport Number</label>
                          <input
                            type="text"
                            value={newClientPassport}
                            onChange={(e) => setNewClientPassport(e.target.value)}
                            placeholder="A12345678"
                            className="w-full bg-muted/20 border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-foreground"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-muted-foreground uppercase">Date of Birth</label>
                          <input
                            type="date"
                            value={newClientDob}
                            onChange={(e) => setNewClientDob(e.target.value)}
                            className="w-full bg-muted/20 border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-foreground"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-muted-foreground uppercase">Source *</label>
                          <select
                            value={newClientSource}
                            onChange={(e) => setNewClientSource(e.target.value)}
                            className="w-full bg-muted/20 border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-foreground"
                          >
                            <option value="walk-in">Walk-in</option>
                            <option value="phone">Phone</option>
                            <option value="whatsapp">WhatsApp</option>
                            <option value="referral">Referral</option>
                            <option value="website">Website</option>
                            <option value="social-media">Social Media</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-muted-foreground uppercase">Assign Staff</label>
                          <select
                            value={newClientAssignedStaffId}
                            onChange={(e) => setNewClientAssignedStaffId(e.target.value)}
                            className="w-full bg-muted/20 border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-foreground"
                          >
                            <option value="">Unassigned</option>
                            {staffUsers.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.name} ({s.role})
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={addClientLoading}
                        className="w-full bg-primary text-primary-foreground font-semibold rounded-xl py-2.5 text-xs hover:opacity-95 shadow-md shadow-primary/10 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        {addClientLoading ? (
                          <div className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          "Register Client"
                        )}
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {/* Client List Table */}
              <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                {clientsLoading ? (
                  <div className="py-12 flex justify-center items-center">
                    <div className="h-8 w-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : clients.length === 0 ? (
                  <div className="py-12 flex flex-col items-center justify-center text-muted-foreground">
                    <Users className="h-10 w-10 mb-3 opacity-40" />
                    <p className="text-sm font-semibold">No clients registered yet</p>
                    <p className="text-xs mt-1">Click "Register Client" to add the first client.</p>
                  </div>
                ) : (() => {
                  const filteredClients = clients.filter((c: any) => {
                    const search = clientSearch.toLowerCase();
                    if (search) {
                      const fullName = `${c.firstName} ${c.lastName}`.toLowerCase();
                      const matchesSearch =
                        fullName.includes(search) ||
                        c.email.toLowerCase().includes(search) ||
                        c.fileNumber.toLowerCase().includes(search) ||
                        (c.passportNumber && c.passportNumber.toLowerCase().includes(search));
                      if (!matchesSearch) return false;
                    }
                    if (clientFilterSource !== "all" && c.source !== clientFilterSource) return false;
                    if (clientFilterStaff === "unassigned" && c.assignedStaff) return false;
                    if (
                      clientFilterStaff !== "all" &&
                      clientFilterStaff !== "unassigned" &&
                      (!c.assignedStaff || String(c.assignedStaff.id) !== clientFilterStaff)
                    )
                      return false;
                    return true;
                  });

                  if (filteredClients.length === 0) {
                    return (
                      <div className="py-12 flex flex-col items-center justify-center text-muted-foreground">
                        <Search className="h-10 w-10 mb-3 opacity-40" />
                        <p className="text-sm font-semibold">No clients match your filters</p>
                        <p className="text-xs mt-1">Try adjusting your search or filter criteria.</p>
                      </div>
                    );
                  }

                  return (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-border bg-muted/25 text-muted-foreground text-[10px] font-bold uppercase tracking-wider">
                        <th className="py-3.5 px-6">File Number</th>
                        <th className="py-3.5 px-6">Client Name</th>
                        <th className="py-3.5 px-6">Phone</th>
                        <th className="py-3.5 px-6">Source</th>
                        <th className="py-3.5 px-6">Assigned Staff</th>
                        <th className="py-3.5 px-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60 text-xs">
                      {filteredClients.map((c: any) => (
                        <tr key={c.id} className="hover:bg-muted/10 transition-colors">
                          <td className="py-3.5 px-6 font-mono font-bold text-foreground">{c.fileNumber}</td>
                          <td className="py-3.5 px-6">
                            <div className="flex items-center gap-2">
                              <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-[10px] uppercase">
                                {c.firstName.slice(0, 1)}{c.lastName.slice(0, 1)}
                              </div>
                              <div>
                                <p className="font-semibold text-foreground">{c.firstName} {c.lastName}</p>
                                <p className="text-[10px] text-muted-foreground">{c.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-6 text-muted-foreground font-medium">{c.phone}</td>
                          <td className="py-3.5 px-6">
                            <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary capitalize">
                              {c.source.replace("-", " ")}
                            </span>
                          </td>
                          <td className="py-3.5 px-6">
                            {c.assignedStaff ? (
                              <span className="text-[10px] font-semibold text-foreground">{c.assignedStaff.name}</span>
                            ) : (
                              <span className="text-[10px] text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="py-3.5 px-6 text-right">
                            <button onClick={() => viewClientProfile(c.id)} className="text-primary hover:underline font-semibold text-xs cursor-pointer">View File</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  );
                })()}
              </div>
            </div>
          )}

          {currentTab === "clients" && selectedClient && clientProfileLoading ? (
            <div className="py-20 flex justify-center items-center">
              <div className="h-10 w-10 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : currentTab === "clients" && selectedClient ? (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Back Button */}
              <button
                onClick={() => setSelectedClient(null)}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-xs font-semibold transition-colors cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" /> Back to Client List
              </button>

              {/* Profile Header */}
              <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                <div className="flex items-start justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center font-bold text-primary text-2xl uppercase">
                      {selectedClient.firstName.slice(0, 1)}{selectedClient.lastName.slice(0, 1)}
                    </div>
                    <div>
                      <h3 className="text-xl font-extrabold text-foreground">{selectedClient.firstName} {selectedClient.lastName}</h3>
                      <p className="text-sm font-mono text-primary font-bold mt-0.5">{selectedClient.fileNumber}</p>
                      <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary capitalize">
                        {selectedClient.source.replace("-", " ")}
                      </span>
                    </div>
                  </div>
                  {user?.role === "ADMIN" && (
                  <button
                    onClick={() => {
                      setEditClientFirstName(selectedClient.firstName || "");
                      setEditClientLastName(selectedClient.lastName || "");
                      setEditClientEmail(selectedClient.email || "");
                      setEditClientPhone(selectedClient.phone || "");
                      setEditClientAddress(selectedClient.address || "");
                      setEditClientPassport(selectedClient.passportNumber || "");
                      setEditClientDob(selectedClient.dateOfBirth ? new Date(selectedClient.dateOfBirth).toISOString().split("T")[0] : "");
                      setEditClientSource(selectedClient.source || "");
                      setEditClientAssignedStaffId(selectedClient.assignedStaffId ? String(selectedClient.assignedStaffId) : "");
                      setEditClientError(null);
                      setIsEditingClient(true);
                    }}
                    className="bg-card border border-border text-xs font-semibold px-4 py-2 rounded-xl flex items-center gap-2 text-foreground hover:bg-secondary transition-all cursor-pointer"
                  >
                    <Edit className="h-3.5 w-3.5" /> Edit Profile
                  </button>
                  )}
                </div>
              </div>

              {/* Edit Client Modal */}
              {isEditingClient && (
                <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
                  <div className="bg-card border border-border w-full max-w-lg rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
                    <div className="p-6 border-b border-border flex justify-between items-center bg-muted/20">
                      <h4 className="font-bold text-foreground text-sm flex items-center gap-2">
                        <Edit className="h-4 w-4 text-primary" /> Edit Client Profile
                      </h4>
                      <button
                        onClick={() => setIsEditingClient(false)}
                        className="text-muted-foreground hover:text-foreground font-semibold text-xs border border-border rounded-lg px-2 py-1 bg-card hover:bg-secondary cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>

                    <form onSubmit={handleUpdateClient} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                      {editClientError && (
                        <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-3 text-xs font-semibold text-destructive">
                          {editClientError}
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-muted-foreground uppercase">First Name *</label>
                          <input
                            type="text"
                            required
                            value={editClientFirstName}
                            onChange={(e) => setEditClientFirstName(e.target.value)}
                            className="w-full bg-muted/20 border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-foreground"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-muted-foreground uppercase">Last Name *</label>
                          <input
                            type="text"
                            required
                            value={editClientLastName}
                            onChange={(e) => setEditClientLastName(e.target.value)}
                            className="w-full bg-muted/20 border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-foreground"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-muted-foreground uppercase">Email *</label>
                          <input
                            type="email"
                            required
                            value={editClientEmail}
                            onChange={(e) => setEditClientEmail(e.target.value)}
                            className="w-full bg-muted/20 border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-foreground"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-muted-foreground uppercase">Phone *</label>
                          <input
                            type="text"
                            required
                            value={editClientPhone}
                            onChange={(e) => setEditClientPhone(e.target.value)}
                            className="w-full bg-muted/20 border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-foreground"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-muted-foreground uppercase">Address</label>
                        <input
                          type="text"
                          value={editClientAddress}
                          onChange={(e) => setEditClientAddress(e.target.value)}
                          className="w-full bg-muted/20 border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-foreground"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-muted-foreground uppercase">Passport Number</label>
                          <input
                            type="text"
                            value={editClientPassport}
                            onChange={(e) => setEditClientPassport(e.target.value)}
                            className="w-full bg-muted/20 border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-foreground"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-muted-foreground uppercase">Date of Birth</label>
                          <input
                            type="date"
                            value={editClientDob}
                            onChange={(e) => setEditClientDob(e.target.value)}
                            className="w-full bg-muted/20 border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-foreground"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-muted-foreground uppercase">Source *</label>
                          <select
                            value={editClientSource}
                            onChange={(e) => setEditClientSource(e.target.value)}
                            className="w-full bg-muted/20 border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-foreground"
                          >
                            <option value="walk-in">Walk-in</option>
                            <option value="phone">Phone</option>
                            <option value="whatsapp">WhatsApp</option>
                            <option value="referral">Referral</option>
                            <option value="website">Website</option>
                            <option value="social-media">Social Media</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-muted-foreground uppercase">Assign Staff</label>
                          <select
                            value={editClientAssignedStaffId}
                            onChange={(e) => setEditClientAssignedStaffId(e.target.value)}
                            className="w-full bg-muted/20 border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-foreground"
                          >
                            <option value="">Unassigned</option>
                            {staffUsers.map((s: any) => (
                              <option key={s.id} value={s.id}>
                                {s.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="pt-2">
                        <button
                          type="submit"
                          disabled={editClientLoading}
                          className="w-full bg-primary text-primary-foreground text-xs font-bold px-4 py-2.5 rounded-xl shadow-md shadow-primary/10 flex items-center justify-center gap-2 hover:opacity-90 transition-all cursor-pointer disabled:opacity-50"
                        >
                          {editClientLoading ? (
                            <span className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                          ) : (
                            <>Save Changes</>
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* Profile Details Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Contact Information */}
                <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                  <h4 className="font-bold text-sm text-foreground mb-4 flex items-center gap-2">
                    <Mail className="h-4 w-4 text-primary" /> Contact Information
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-muted/20 rounded-xl">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold">Email</p>
                        <p className="text-xs font-semibold text-foreground">{selectedClient.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-muted/20 rounded-xl">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold">Phone</p>
                        <p className="text-xs font-semibold text-foreground">{selectedClient.phone}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-muted/20 rounded-xl">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold">Address</p>
                        <p className="text-xs font-semibold text-foreground">{selectedClient.address || "—"}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Personal Details */}
                <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                  <h4 className="font-bold text-sm text-foreground mb-4 flex items-center gap-2">
                    <UserIcon className="h-4 w-4 text-primary" /> Personal Details
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-muted/20 rounded-xl">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold">Passport Number</p>
                        <p className="text-xs font-semibold text-foreground">{selectedClient.passportNumber || "—"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-muted/20 rounded-xl">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold">Date of Birth</p>
                        <p className="text-xs font-semibold text-foreground">
                          {selectedClient.dateOfBirth
                            ? new Date(selectedClient.dateOfBirth).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
                            : "—"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-muted/20 rounded-xl">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold">Assigned Staff</p>
                        <p className="text-xs font-semibold text-foreground">{selectedClient.assignedStaff?.name || "Unassigned"}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Metadata Footer */}
              <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                <h4 className="font-bold text-sm text-foreground mb-4">Record Details</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold">Created By</p>
                    <p className="font-semibold text-foreground">{selectedClient.createdBy?.name || "—"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold">Created At</p>
                    <p className="font-semibold text-foreground">
                      {new Date(selectedClient.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold">Last Updated</p>
                    <p className="font-semibold text-foreground">
                      {new Date(selectedClient.updatedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold">Client ID</p>
                    <p className="font-semibold text-foreground font-mono">#{selectedClient.id}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {currentTab === "applications" && !selectedApplication && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex justify-between items-center flex-wrap gap-4">
                <div>
                  <h3 className="text-lg font-bold text-foreground">Applications</h3>
                  <p className="text-xs text-muted-foreground">Track visa and travel service applications linked to client files.</p>
                </div>
                {user?.role === "ADMIN" && (
                <button
                  onClick={() => {
                    setIsAddAppOpen(true);
                    setAddAppError(null);
                    setAddAppSuccess(null);
                  }}
                  className="bg-primary text-primary-foreground text-xs font-bold px-4 py-2.5 rounded-xl shadow-md shadow-primary/10 flex items-center gap-2 hover:opacity-90 transition-all cursor-pointer"
                >
                  <Plus className="h-4 w-4" /> New Application
                </button>
                )}
              </div>

              {/* New Application Modal */}
              {isAddAppOpen && (
                <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
                  <div className="bg-card border border-border w-full max-w-lg rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
                    <div className="p-6 border-b border-border flex justify-between items-center bg-muted/20">
                      <h4 className="font-bold text-foreground text-sm flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary" /> New Application
                      </h4>
                      <button
                        onClick={() => setIsAddAppOpen(false)}
                        className="text-muted-foreground hover:text-foreground font-semibold text-xs border border-border rounded-lg px-2 py-1 bg-card hover:bg-secondary cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>

                    <form onSubmit={handleCreateApplication} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                      {addAppError && (
                        <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-3 text-xs font-semibold text-destructive">
                          {addAppError}
                        </div>
                      )}
                      {addAppSuccess && (
                        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3 text-xs font-semibold text-green-600">
                          {addAppSuccess}
                        </div>
                      )}

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-muted-foreground uppercase">Client *</label>
                        <select
                          required
                          value={newAppClientId}
                          onChange={(e) => setNewAppClientId(e.target.value)}
                          className="w-full bg-muted/20 border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-foreground"
                        >
                          <option value="">Select a client...</option>
                          {clients.map((c: any) => (
                            <option key={c.id} value={c.id}>
                              {c.fileNumber} — {c.firstName} {c.lastName}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-muted-foreground uppercase">Service Type *</label>
                        <select
                          required
                          value={newAppServiceType}
                          onChange={(e) => setNewAppServiceType(e.target.value)}
                          className="w-full bg-muted/20 border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-foreground"
                        >
                          <option value="UK Tourist Visa">UK Tourist Visa</option>
                          <option value="Canada Study Permit">Canada Study Permit</option>
                          <option value="Schengen Tourist Visa">Schengen Tourist Visa</option>
                          <option value="USA B1/B2 Visa">USA B1/B2 Visa</option>
                          <option value="Australia Visitor Visa">Australia Visitor Visa</option>
                          <option value="UK Student Visa">UK Student Visa</option>
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-muted-foreground uppercase">Destination Country *</label>
                          <input
                            type="text"
                            required
                            value={newAppDestination}
                            onChange={(e) => setNewAppDestination(e.target.value)}
                            placeholder="United Kingdom"
                            className="w-full bg-muted/20 border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-foreground"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-muted-foreground uppercase">Travel Purpose *</label>
                          <select
                            required
                            value={newAppPurpose}
                            onChange={(e) => setNewAppPurpose(e.target.value)}
                            className="w-full bg-muted/20 border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-foreground"
                          >
                            <option value="">Select purpose...</option>
                            <option value="Tourism">Tourism</option>
                            <option value="Business">Business</option>
                            <option value="Study">Study</option>
                            <option value="Work">Work</option>
                            <option value="Family Visit">Family Visit</option>
                            <option value="Medical">Medical</option>
                            <option value="Transit">Transit</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-muted-foreground uppercase">Expected Travel Date</label>
                          <input
                            type="date"
                            value={newAppTravelDate}
                            onChange={(e) => setNewAppTravelDate(e.target.value)}
                            className="w-full bg-muted/20 border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-foreground"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-muted-foreground uppercase">Assign Staff</label>
                          <select
                            value={newAppStaffId}
                            onChange={(e) => setNewAppStaffId(e.target.value)}
                            className="w-full bg-muted/20 border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-foreground"
                          >
                            <option value="">Unassigned</option>
                            {staffUsers.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.name} ({s.role})
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={addAppLoading}
                        className="w-full bg-primary text-primary-foreground font-semibold rounded-xl py-2.5 text-xs hover:opacity-95 shadow-md shadow-primary/10 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        {addAppLoading ? (
                          <div className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          "Create Application"
                        )}
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {/* Applications Table */}
              <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                {applicationsLoading ? (
                  <div className="py-12 flex justify-center items-center">
                    <div className="h-8 w-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : applications.length === 0 ? (
                  <div className="py-12 flex flex-col items-center justify-center text-muted-foreground">
                    <FileText className="h-10 w-10 mb-3 opacity-40" />
                    <p className="text-sm font-semibold">No applications yet</p>
                    <p className="text-xs mt-1">Click "New Application" to create the first application.</p>
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-border bg-muted/25 text-muted-foreground text-[10px] font-bold uppercase tracking-wider">
                        <th className="py-3.5 px-6">Client</th>
                        <th className="py-3.5 px-6">Service Type</th>
                        <th className="py-3.5 px-6">Destination</th>
                        <th className="py-3.5 px-6">Stage</th>
                        <th className="py-3.5 px-6">Status</th>
                        <th className="py-3.5 px-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60 text-xs">
                      {applications.map((app: any) => (
                        <tr key={app.id} className="hover:bg-muted/10 transition-colors">
                          <td className="py-3.5 px-6">
                            <div>
                              <p className="font-semibold text-foreground">{app.client?.firstName} {app.client?.lastName}</p>
                              <p className="text-[10px] text-muted-foreground font-mono">{app.client?.fileNumber}</p>
                            </div>
                          </td>
                          <td className="py-3.5 px-6 font-semibold text-foreground">{app.serviceType}</td>
                          <td className="py-3.5 px-6 text-muted-foreground">{app.destinationCountry}</td>
                          <td className="py-3.5 px-6">
                            <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary">
                              {app.currentStage.replace(/_/g, " ")}
                            </span>
                          </td>
                          <td className="py-3.5 px-6">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              app.status === "COMPLETED" ? "bg-green-500/10 text-green-600" :
                              app.status === "IN_PROGRESS" ? "bg-blue-500/10 text-blue-600" :
                              app.status === "BLOCKED" ? "bg-red-500/10 text-red-600" :
                              "bg-muted text-muted-foreground"
                            }`}>
                              {app.status.replace(/_/g, " ")}
                            </span>
                          </td>
                          <td className="py-3.5 px-6 text-right">
                            <button onClick={() => viewApplication(app.id)} className="text-primary hover:underline font-semibold text-xs cursor-pointer">View</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {currentTab === "applications" && selectedApplication && applicationDetailLoading ? (
            <div className="py-20 flex justify-center items-center">
              <div className="h-10 w-10 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : currentTab === "applications" && selectedApplication ? (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Back Button */}
              <button
                onClick={() => { setSelectedApplication(null); setStageHistory([]); setStageActionError(null); }}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-xs font-semibold transition-colors cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" /> Back to Applications
              </button>

              {/* Header */}
              <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                <div className="flex items-start justify-between flex-wrap gap-4">
                  <div>
                    <h3 className="text-xl font-extrabold text-foreground">
                      {selectedApplication.client?.firstName} {selectedApplication.client?.lastName}
                    </h3>
                    <p className="text-sm font-mono text-primary font-bold mt-0.5">{selectedApplication.client?.fileNumber}</p>
                    <p className="text-xs text-muted-foreground mt-1">{selectedApplication.serviceType} · {selectedApplication.destinationCountry}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary">
                      {STAGE_LABELS[selectedApplication.currentStage as keyof typeof STAGE_LABELS] || selectedApplication.currentStage.replace(/_/g, " ")}
                    </span>
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      selectedApplication.status === "COMPLETED" ? "bg-green-500/10 text-green-600" :
                      selectedApplication.status === "IN_PROGRESS" ? "bg-blue-500/10 text-blue-600" :
                      selectedApplication.status === "BLOCKED" ? "bg-red-500/10 text-red-600" :
                      "bg-muted text-muted-foreground"
                    }`}>
                      {selectedApplication.status.replace(/_/g, " ")}
                    </span>
                    {selectedApplication.decisionStatus && (
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        selectedApplication.decisionStatus === "APPROVED" ? "bg-green-500/10 text-green-600" :
                        selectedApplication.decisionStatus === "REFUSED" ? "bg-red-500/10 text-red-600" :
                        "bg-muted text-muted-foreground"
                      }`}>
                        {selectedApplication.decisionStatus.replace(/_/g, " ")}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {stageActionError && (
                <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-3 text-xs font-semibold text-destructive">
                  {stageActionError}
                </div>
              )}

              {/* Application Details Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                  <h4 className="font-bold text-sm text-foreground mb-4 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" /> Application Details
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-muted/20 rounded-xl">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold">Travel Purpose</p>
                        <p className="text-xs font-semibold text-foreground">{selectedApplication.travelPurpose}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-muted/20 rounded-xl">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold">Expected Travel Date</p>
                        <p className="text-xs font-semibold text-foreground">
                          {selectedApplication.expectedTravelDate
                            ? new Date(selectedApplication.expectedTravelDate).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
                            : "—"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-muted/20 rounded-xl">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold">Assigned Staff</p>
                        <p className="text-xs font-semibold text-foreground">{selectedApplication.assignedStaff?.name || "Unassigned"}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stage Movement / Decision Actions */}
                <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                  <h4 className="font-bold text-sm text-foreground mb-4 flex items-center gap-2">
                    <Workflow className="h-4 w-4 text-primary" /> Move Stage
                  </h4>
                  {!canTransitionApplication(selectedApplication) ? (
                    <p className="text-xs text-muted-foreground">You do not have permission to move this application.</p>
                  ) : selectedApplication.currentStage === "DECISION" ? (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        disabled={stageActionLoading}
                        onClick={() => moveApplicationStage(selectedApplication.id, "VISA_APPROVED_PATH", "APPROVED")}
                        className="bg-green-500/10 text-green-600 text-xs font-bold px-3 py-2.5 rounded-xl hover:bg-green-500/20 transition-all cursor-pointer disabled:opacity-50"
                      >
                        Approve
                      </button>
                      <button
                        disabled={stageActionLoading}
                        onClick={() => moveApplicationStage(selectedApplication.id, "VISA_REFUSED_PATH", "REFUSED")}
                        className="bg-red-500/10 text-red-600 text-xs font-bold px-3 py-2.5 rounded-xl hover:bg-red-500/20 transition-all cursor-pointer disabled:opacity-50"
                      >
                        Refuse
                      </button>
                      <button
                        disabled={stageActionLoading}
                        onClick={() => moveApplicationStage(selectedApplication.id, "DECISION", "WITHDRAWN")}
                        className="bg-muted text-muted-foreground text-xs font-bold px-3 py-2.5 rounded-xl hover:bg-secondary transition-all cursor-pointer disabled:opacity-50"
                      >
                        Mark Withdrawn
                      </button>
                      <button
                        disabled={stageActionLoading}
                        onClick={() => moveApplicationStage(selectedApplication.id, "DECISION", "PENDING_ACTION")}
                        className="bg-blue-500/10 text-blue-600 text-xs font-bold px-3 py-2.5 rounded-xl hover:bg-blue-500/20 transition-all cursor-pointer disabled:opacity-50"
                      >
                        Pending Action
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {getAllowedNextStages(selectedApplication.currentStage).map((stage) => (
                        <button
                          key={stage}
                          disabled={stageActionLoading}
                          onClick={() => moveApplicationStage(selectedApplication.id, stage)}
                          className="bg-primary text-primary-foreground text-xs font-bold px-3 py-2.5 rounded-xl shadow-md shadow-primary/10 hover:opacity-90 transition-all cursor-pointer disabled:opacity-50"
                        >
                          Move to {STAGE_LABELS[stage as keyof typeof STAGE_LABELS]}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Stage History Timeline */}
              <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                <h4 className="font-bold text-sm text-foreground mb-4 flex items-center gap-2">
                  <History className="h-4 w-4 text-primary" /> Stage History
                </h4>
                {stageHistoryLoading ? (
                  <div className="py-8 flex justify-center items-center">
                    <div className="h-6 w-6 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : stageHistory.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No stage changes recorded yet.</p>
                ) : (
                  <div className="space-y-3">
                    {stageHistory.map((h: any) => (
                      <div key={h.id} className="flex items-start gap-3 p-3 bg-muted/20 rounded-xl">
                        <div className="h-2 w-2 rounded-full bg-primary mt-1.5 flex-shrink-0"></div>
                        <div>
                          <p className="text-xs font-semibold text-foreground">
                            {h.fromStage ? `${STAGE_LABELS[h.fromStage as keyof typeof STAGE_LABELS] || h.fromStage} → ` : ""}
                            {STAGE_LABELS[h.toStage as keyof typeof STAGE_LABELS] || h.toStage}
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {h.changedBy?.name || "Unknown"} · {new Date(h.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : null}

          {currentTab === "pipeline" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div>
                <h3 className="text-lg font-bold text-foreground">Pipeline Board</h3>
                <p className="text-xs text-muted-foreground">Drag a card into a column to move it to that stage, or click a card to open its detail page.</p>
              </div>

              {pipelineError && (
                <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-3 text-xs font-semibold text-destructive flex items-center justify-between gap-4">
                  <span>{pipelineError}</span>
                  <button onClick={() => setPipelineError(null)} className="font-bold cursor-pointer">✕</button>
                </div>
              )}

              {applicationsLoading ? (
                <div className="py-20 flex justify-center items-center">
                  <div className="h-10 w-10 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : (
                <DndContext sensors={pipelineSensors} onDragStart={handlePipelineDragStart} onDragEnd={handlePipelineDragEnd}>
                  <div className="flex gap-4 overflow-x-auto pb-4">
                    {STAGE_ORDER.map((stage) => {
                      const stageApps = applications.filter((a: any) => a.currentStage === stage);
                      const allowedForActive = activeDragApp ? getAllowedNextStages(activeDragApp.currentStage) : [];
                      const dropState: "neutral" | "valid" | "invalid" = !activeDragApp
                        ? "neutral"
                        : allowedForActive.includes(stage)
                        ? "valid"
                        : "invalid";
                      return (
                        <PipelineColumn key={stage} stage={stage} apps={stageApps} dropState={dropState}>
                          {stageApps.map((app: any) => (
                            <PipelineCard
                              key={app.id}
                              app={app}
                              draggable={canTransitionApplication(app) && app.currentStage !== "DECISION"}
                              onOpen={() => { setCurrentTab("applications"); viewApplication(app.id); }}
                            />
                          ))}
                        </PipelineColumn>
                      );
                    })}
                  </div>
                  <DragOverlay>
                    {activeDragApp ? <PipelineCard app={activeDragApp} draggable={false} onOpen={() => {}} /> : null}
                  </DragOverlay>
                </DndContext>
              )}
            </div>
          )}

          {currentTab === "tasks" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold text-foreground">Task Manager</h3>
                  <p className="text-xs text-muted-foreground">Assign, update, and track workload deliverables.</p>
                </div>
                {user?.role === "ADMIN" && (
                <button
                  onClick={() => {
                    setIsAddTaskOpen(true);
                    setAddTaskError(null);
                    setAddTaskSuccess(null);
                  }}
                  className="bg-primary text-primary-foreground text-xs font-bold px-4 py-2.5 rounded-xl shadow-md shadow-primary/10 flex items-center gap-2 hover:opacity-90 transition-all cursor-pointer"
                >
                  <Plus className="h-4 w-4" /> Create Task
                </button>
                )}
              </div>

              {/* Create Task Modal */}
              {isAddTaskOpen && (
                <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
                  <div className="bg-card border border-border w-full max-w-lg rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
                    <div className="p-6 border-b border-border flex justify-between items-center bg-muted/20">
                      <h4 className="font-bold text-foreground text-sm flex items-center gap-2">
                        <CheckSquare className="h-4 w-4 text-primary" /> Create New Task
                      </h4>
                      <button
                        onClick={() => setIsAddTaskOpen(false)}
                        className="text-muted-foreground hover:text-foreground font-semibold text-xs border border-border rounded-lg px-2 py-1 bg-card hover:bg-secondary cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>

                    <form onSubmit={handleCreateTask} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                      {addTaskError && (
                        <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-3 text-xs font-semibold text-destructive">
                          {addTaskError}
                        </div>
                      )}
                      {addTaskSuccess && (
                        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3 text-xs font-semibold text-green-600">
                          {addTaskSuccess}
                        </div>
                      )}

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-muted-foreground uppercase">Title *</label>
                        <input
                          type="text"
                          required
                          value={newTaskTitle}
                          onChange={(e) => setNewTaskTitle(e.target.value)}
                          placeholder="e.g. Review passport documents"
                          className="w-full bg-muted/20 border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-foreground"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-muted-foreground uppercase">Description</label>
                        <textarea
                          value={newTaskDescription}
                          onChange={(e) => setNewTaskDescription(e.target.value)}
                          placeholder="Task details and instructions..."
                          rows={2}
                          className="w-full bg-muted/20 border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-foreground resize-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-muted-foreground uppercase">Client *</label>
                        <select
                          required
                          value={newTaskClientId}
                          onChange={(e) => setNewTaskClientId(e.target.value)}
                          className="w-full bg-muted/20 border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-foreground"
                        >
                          <option value="">Select a client...</option>
                          {clients.map((c: any) => (
                            <option key={c.id} value={c.id}>
                              {c.fileNumber} — {c.firstName} {c.lastName}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-muted-foreground uppercase">Application</label>
                          <select
                            value={newTaskApplicationId}
                            onChange={(e) => setNewTaskApplicationId(e.target.value)}
                            className="w-full bg-muted/20 border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-foreground"
                          >
                            <option value="">None</option>
                            {applications
                              .filter((a: any) => newTaskClientId && a.clientId === Number(newTaskClientId))
                              .map((a: any) => (
                                <option key={a.id} value={a.id}>
                                  {a.serviceType} — {a.client?.fileNumber}
                                </option>
                              ))}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-muted-foreground uppercase">Workflow Stage</label>
                          <select
                            value={newTaskStage}
                            onChange={(e) => setNewTaskStage(e.target.value)}
                            className="w-full bg-muted/20 border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-foreground"
                          >
                            <option value="">None</option>
                            {STAGE_ORDER.map((stage) => (
                              <option key={stage} value={stage}>
                                {STAGE_LABELS[stage]}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-muted-foreground uppercase">Assignee</label>
                          <select
                            value={newTaskAssigneeId}
                            onChange={(e) => setNewTaskAssigneeId(e.target.value)}
                            className="w-full bg-muted/20 border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-foreground"
                          >
                            <option value="">Unassigned</option>
                            {staffUsers.map((s: any) => (
                              <option key={s.id} value={s.id}>
                                {s.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-muted-foreground uppercase">Priority</label>
                          <select
                            value={newTaskPriority}
                            onChange={(e) => setNewTaskPriority(e.target.value)}
                            className="w-full bg-muted/20 border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-foreground"
                          >
                            <option value="LOW">Low</option>
                            <option value="MEDIUM">Medium</option>
                            <option value="HIGH">High</option>
                            <option value="URGENT">Urgent</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-muted-foreground uppercase">Due Date</label>
                          <input
                            type="date"
                            value={newTaskDueDate}
                            onChange={(e) => setNewTaskDueDate(e.target.value)}
                            className="w-full bg-muted/20 border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-foreground"
                          />
                        </div>
                      </div>

                      <div className="pt-2">
                        <button
                          type="submit"
                          disabled={addTaskLoading}
                          className="w-full bg-primary text-primary-foreground text-xs font-bold px-4 py-2.5 rounded-xl shadow-md shadow-primary/10 flex items-center justify-center gap-2 hover:opacity-90 transition-all cursor-pointer disabled:opacity-50"
                        >
                          {addTaskLoading ? (
                            <span className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                          ) : (
                            <>Create Task</>
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* Tasks Table */}
              {tasksLoading ? (
                <div className="py-20 flex justify-center items-center">
                  <div className="h-10 w-10 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : tasks.length === 0 ? (
                <div className="bg-card border border-dashed border-border rounded-2xl py-20 flex flex-col items-center justify-center text-center">
                  <CheckSquare className="h-12 w-12 text-muted-foreground/30 mb-3" />
                  <p className="text-sm font-bold text-muted-foreground">No tasks yet</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">Create a task to get started</p>
                </div>
              ) : (
                <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-border bg-muted/20">
                          <th className="text-left p-4 font-bold text-muted-foreground uppercase text-[10px]">Task</th>
                          <th className="text-left p-4 font-bold text-muted-foreground uppercase text-[10px]">Client</th>
                          <th className="text-left p-4 font-bold text-muted-foreground uppercase text-[10px]">Stage</th>
                          <th className="text-left p-4 font-bold text-muted-foreground uppercase text-[10px]">Assignee</th>
                          <th className="text-left p-4 font-bold text-muted-foreground uppercase text-[10px]">Priority</th>
                          <th className="text-left p-4 font-bold text-muted-foreground uppercase text-[10px]">Due</th>
                          <th className="text-left p-4 font-bold text-muted-foreground uppercase text-[10px]">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tasks.map((t: any) => (
                          <tr key={t.id} className="border-b border-border/60 hover:bg-muted/10 transition-colors">
                            <td className="p-4">
                              <p className="font-bold text-foreground">{t.title}</p>
                              {t.description && (
                                <p className="text-[10px] text-muted-foreground mt-0.5 truncate max-w-xs">{t.description}</p>
                              )}
                            </td>
                            <td className="p-4">
                              <p className="font-semibold text-foreground">{t.client?.firstName} {t.client?.lastName}</p>
                              <p className="text-[10px] text-muted-foreground font-mono">{t.client?.fileNumber}</p>
                            </td>
                            <td className="p-4">
                              {t.stage ? (
                                <span className="text-[10px] font-semibold text-foreground">{STAGE_LABELS[t.stage as keyof typeof STAGE_LABELS] || t.stage}</span>
                              ) : (
                                <span className="text-[10px] text-muted-foreground">—</span>
                              )}
                            </td>
                            <td className="p-4">
                              {t.assignee ? (
                                <span className="text-[10px] font-semibold text-foreground">{t.assignee.name}</span>
                              ) : (
                                <span className="text-[10px] text-muted-foreground">Unassigned</span>
                              )}
                            </td>
                            <td className="p-4">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                t.priority === "URGENT" ? "bg-red-500/10 text-red-600" :
                                t.priority === "HIGH" ? "bg-orange-500/10 text-orange-600" :
                                t.priority === "MEDIUM" ? "bg-blue-500/10 text-blue-600" :
                                "bg-muted text-muted-foreground"
                              }`}>
                                {t.priority}
                              </span>
                            </td>
                            <td className="p-4">
                              <span className="text-[10px] font-semibold text-foreground">
                                {t.dueDate
                                  ? new Date(t.dueDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" })
                                  : "—"}
                              </span>
                            </td>
                            <td className="p-4">
                              <select
                                value={t.status}
                                onChange={(e) => handleUpdateTaskStatus(t.id, e.target.value)}
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border-none cursor-pointer ${
                                  t.status === "DONE" ? "bg-green-500/10 text-green-600" :
                                  t.status === "IN_PROGRESS" ? "bg-blue-500/10 text-blue-600" :
                                  t.status === "WAITING" ? "bg-yellow-500/10 text-yellow-600" :
                                  t.status === "CANCELLED" ? "bg-red-500/10 text-red-600" :
                                  "bg-muted text-muted-foreground"
                                }`}
                              >
                                <option value="TODO">To Do</option>
                                <option value="IN_PROGRESS">In Progress</option>
                                <option value="WAITING">Waiting</option>
                                <option value="DONE">Done</option>
                                <option value="CANCELLED">Cancelled</option>
                              </select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {currentTab === "documents" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div>
                <h3 className="text-lg font-bold text-foreground">Document Management</h3>
                <p className="text-xs text-muted-foreground">Manage checklists and inspect uploaded client files.</p>
              </div>

              {/* Document Layout Skeleton */}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Checklists template panel */}
                <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
                  <h4 className="font-bold text-xs text-foreground mb-3 uppercase tracking-wider">Checklist Templates</h4>
                  <div className="space-y-2">
                    {["UK Tourist Visa", "Canada Study Permit", "Schengen Business Visa", "USA Tourism B1/B2"].map((temp, i) => (
                      <button key={i} className="w-full text-left p-2.5 text-xs rounded-lg hover:bg-secondary font-medium transition-colors">
                        {temp}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Queue list */}
                <div className="lg:col-span-3 bg-card border border-border rounded-2xl p-6 shadow-sm">
                  <div className="flex justify-between items-center mb-4">
                    <span className="font-bold text-xs text-foreground">Uploaded Documents Queue</span>
                    <span className="text-[10px] text-muted-foreground">Showing 3 files</span>
                  </div>
                  <div className="space-y-4">
                    {[
                      { file: "passport_main_page.pdf", size: "2.4 MB", client: "David Miller", status: "VERIFIED" },
                      { file: "bank_statement_6m.pdf", size: "8.1 MB", client: "Samantha Cooper", status: "PENDING" },
                      { file: "travel_insurance_certificate.pdf", size: "1.2 MB", client: "Alice Green", status: "REJECTED" }
                    ].map((d, i) => (
                      <div key={i} className="flex justify-between items-center border border-border/60 p-3 rounded-xl hover:border-primary/40 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="bg-muted p-2 rounded-lg text-muted-foreground">
                            <FileText className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-foreground">{d.file}</p>
                            <p className="text-[10px] text-muted-foreground">{d.client} • {d.size}</p>
                          </div>
                        </div>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                          d.status === "VERIFIED" ? "bg-green-500/10 text-green-600" :
                          d.status === "PENDING" ? "bg-yellow-500/10 text-yellow-600" : "bg-red-500/10 text-red-500"
                        }`}>
                          {d.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Admin Protected: Payments */}
          {currentTab === "payments" && user?.role.toUpperCase() === "ADMIN" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold text-foreground">Invoicing & Payments</h3>
                  <p className="text-xs text-muted-foreground">Track transaction history, outstanding balances, and receipt validations.</p>
                </div>
                <button className="bg-primary text-primary-foreground text-xs font-semibold px-4 py-2 rounded-xl shadow-md cursor-pointer">
                  New Invoice
                </button>
              </div>

              {/* Grid of payments */}
              <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                <div className="h-64 flex flex-col items-center justify-center border border-dashed border-border rounded-xl bg-muted/10">
                  <CreditCard className="h-8 w-8 text-muted-foreground/60 mb-2" />
                  <p className="text-xs font-bold text-foreground">Invoice Tracking Panel</p>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Manage service fee invoicing and balances. Accessible to Administrators.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Admin Protected: Quality Review */}
          {currentTab === "reviews" && user?.role.toUpperCase() === "ADMIN" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div>
                <h3 className="text-lg font-bold text-foreground">Quality Review Queue</h3>
                <p className="text-xs text-muted-foreground">Final assessment of files before embassy/portal submission.</p>
              </div>

              <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                <div className="h-64 flex flex-col items-center justify-center border border-dashed border-border rounded-xl bg-muted/10">
                  <FileCheck2 className="h-8 w-8 text-muted-foreground/60 mb-2" />
                  <p className="text-xs font-bold text-foreground">Quality Check & Approvals Queue</p>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Files cannot be submitted to VFS/embassy until reviewed and approved.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Admin Protected: Reports */}
          {currentTab === "reports" && user?.role.toUpperCase() === "ADMIN" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div>
                <h3 className="text-lg font-bold text-foreground">Business Analytics Reports</h3>
                <p className="text-xs text-muted-foreground">Observe staff workload metrics, stage bottlenecks, and approvals success.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                  <h4 className="font-bold text-xs text-foreground mb-4">Visa Approval Rates By Destination</h4>
                  <div className="h-48 border border-border rounded-xl bg-muted/20 flex items-end justify-between p-4 gap-2">
                    {[
                      { country: "UK", rate: 88, h: "h-[88%]" },
                      { country: "Canada", rate: 72, h: "h-[72%]" },
                      { country: "Schengen", rate: 94, h: "h-[94%]" },
                      { country: "USA", rate: 64, h: "h-[64%]" }
                    ].map((item, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-2">
                        <div className={`w-full bg-primary/80 hover:bg-primary rounded-t-lg transition-all ${item.h}`}></div>
                        <span className="text-[10px] font-bold text-foreground">{item.country}</span>
                        <span className="text-[9px] text-muted-foreground">{item.rate}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                  <h4 className="font-bold text-xs text-foreground mb-4">Pipeline Distribution by Stage</h4>
                  <div className="space-y-3">
                    {[
                      { stage: "Consultation Eligibility Check", count: 24, percent: "w-[40%]" },
                      { stage: "Document Collection", count: 32, percent: "w-[54%]" },
                      { stage: "Quality Reviews", count: 12, percent: "w-[20%]" },
                      { stage: "Embassy Submissions", count: 18, percent: "w-[30%]" }
                    ].map((item, i) => (
                      <div key={i} className="space-y-1">
                        <div className="flex justify-between text-[10px] font-bold">
                          <span className="text-foreground">{item.stage}</span>
                          <span className="text-muted-foreground">{item.count} files</span>
                        </div>
                        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                          <div className={`h-full bg-primary rounded-full ${item.percent}`}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Admin Protected: Staff Management */}
          {currentTab === "staff" && user?.role.toUpperCase() === "ADMIN" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex justify-between items-center flex-wrap gap-4">
                <div>
                  <h3 className="text-lg font-bold text-foreground">Staff Management</h3>
                  <p className="text-xs text-muted-foreground">Manage internal users, update roles, and switch access states.</p>
                </div>
                <button 
                  onClick={() => {
                    setIsAddStaffOpen(true);
                    setAddStaffError(null);
                    setAddStaffSuccess(null);
                  }}
                  className="bg-primary text-primary-foreground text-xs font-bold px-4 py-2.5 rounded-xl shadow-md shadow-primary/10 flex items-center gap-2 hover:opacity-90 transition-all cursor-pointer"
                >
                  <UserPlus className="h-4 w-4" /> Add Staff Member
                </button>
              </div>

              {/* Add Staff Modal */}
              {isAddStaffOpen && (
                <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
                  <div className="bg-card border border-border w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200 animate-[zoom-in_0.2s_ease-out]">
                    <div className="p-6 border-b border-border flex justify-between items-center bg-muted/20">
                      <h4 className="font-bold text-foreground text-sm flex items-center gap-2">
                        <UserPlus className="h-4 w-4 text-primary" /> Add New Staff Member
                      </h4>
                      <button 
                        onClick={() => setIsAddStaffOpen(false)}
                        className="text-muted-foreground hover:text-foreground font-semibold text-xs border border-border rounded-lg px-2 py-1 bg-card hover:bg-secondary cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>

                    <form onSubmit={handleAddStaff} className="p-6 space-y-4">
                      {addStaffError && (
                        <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-3 text-xs font-semibold text-destructive">
                          {addStaffError}
                        </div>
                      )}
                      {addStaffSuccess && (
                        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3 text-xs font-semibold text-green-600">
                          {addStaffSuccess}
                        </div>
                      )}

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-muted-foreground uppercase">Full Name</label>
                        <input
                          type="text"
                          required
                          value={newStaffName}
                          onChange={(e) => setNewStaffName(e.target.value)}
                          placeholder="e.g. John Doe"
                          className="w-full bg-muted/20 border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-foreground"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-muted-foreground uppercase">Email Address</label>
                        <input
                          type="email"
                          required
                          value={newStaffEmail}
                          onChange={(e) => setNewStaffEmail(e.target.value)}
                          placeholder="e.g. john@waypoint.com"
                          className="w-full bg-muted/20 border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-foreground"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-muted-foreground uppercase">Phone Number</label>
                        <input
                          type="text"
                          value={newStaffPhone}
                          onChange={(e) => setNewStaffPhone(e.target.value)}
                          placeholder="e.g. +12345678"
                          className="w-full bg-muted/20 border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-foreground"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-muted-foreground uppercase">Access Role</label>
                        <select
                          value={newStaffRole}
                          onChange={(e) => setNewStaffRole(e.target.value as any)}
                          className="w-full bg-muted/20 border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-foreground"
                        >
                          <option value="STAFF">Staff (Standard Access)</option>
                          <option value="ADMIN">Admin (Full System Access)</option>
                        </select>
                      </div>

                      <button
                        type="submit"
                        disabled={addStaffLoading}
                        className="w-full bg-primary text-primary-foreground font-semibold rounded-xl py-2.5 text-xs hover:opacity-95 shadow-md shadow-primary/10 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        {addStaffLoading ? (
                          <div className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          "Create Account"
                        )}
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {/* Staff List Table */}
              <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                {staffLoading ? (
                  <div className="py-12 flex justify-center items-center">
                    <div className="h-8 w-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-border bg-muted/25 text-muted-foreground text-[10px] font-bold uppercase tracking-wider">
                        <th className="py-3.5 px-6">Staff Member</th>
                        <th className="py-3.5 px-6">Access Role</th>
                        <th className="py-3.5 px-6">Phone</th>
                        <th className="py-3.5 px-6">Status</th>
                        <th className="py-3.5 px-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60 text-xs">
                      {staffUsers.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-muted-foreground">
                            No staff accounts found in the database.
                          </td>
                        </tr>
                      ) : (
                        staffUsers.map((member) => (
                          <tr key={member.id} className="hover:bg-muted/10 transition-colors">
                            <td className="py-3.5 px-6">
                              <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-xs uppercase">
                                  {member.name.slice(0, 2)}
                                </div>
                                <div>
                                  <p className="font-semibold text-foreground">{member.name}</p>
                                  <p className="text-[10px] text-muted-foreground">{member.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-6">
                              <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider ${
                                member.role.toLowerCase() === "admin" 
                                  ? "bg-purple-500/10 text-purple-600 border border-purple-500/20" 
                                  : "bg-blue-500/10 text-blue-600 border border-blue-500/20"
                              }`}>
                                {member.role}
                              </span>
                            </td>
                            <td className="py-3.5 px-6 text-muted-foreground font-medium">{member.phone || "—"}</td>
                            <td className="py-3.5 px-6">
                              <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                member.status === "active" 
                                  ? "bg-green-500/10 text-green-600" 
                                  : "bg-muted text-muted-foreground"
                              }`}>
                                {member.status}
                              </span>
                            </td>
                            <td className="py-3.5 px-6 text-right space-x-2">
                              <button 
                                onClick={() => handleToggleRole(member.id, member.role)}
                                className="text-[10px] bg-muted hover:bg-secondary font-bold px-2 py-1 rounded-lg border border-border text-foreground transition-all cursor-pointer"
                              >
                                Toggle Role
                              </button>
                              <button 
                                onClick={() => handleToggleStatus(member.id, member.status)}
                                className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition-all cursor-pointer ${
                                  member.status === "active"
                                    ? "bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20"
                                    : "bg-green-500/10 text-green-600 border-green-500/20 hover:bg-green-500/20"
                                }`}
                              >
                                {member.status === "active" ? "Deactivate" : "Activate"}
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {currentTab === "settings" && (
            <div className="space-y-8 animate-in fade-in duration-200 max-w-4xl">
              <div>
                <h3 className="text-lg font-bold text-foreground">Account & Platform Settings</h3>
                <p className="text-xs text-muted-foreground">Manage your credentials, update your personal profile, and toggle workspace alerts.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* 1. Edit Profile Form */}
                <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-foreground mb-1 flex items-center gap-2">
                      <UserIcon className="h-4 w-4 text-primary" /> Profile Details
                    </h4>
                    <p className="text-xs text-muted-foreground mb-4">Update your name and primary contact number.</p>

                    {profileError && (
                      <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-3 text-xs font-semibold text-destructive mb-4 animate-in fade-in">
                        {profileError}
                      </div>
                    )}
                    {profileSuccess && (
                      <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3 text-xs font-semibold text-green-600 mb-4 animate-in fade-in">
                        {profileSuccess}
                      </div>
                    )}

                    <form onSubmit={handleUpdateProfile} className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-muted-foreground uppercase">Email (Read-only)</label>
                        <input
                          type="email"
                          disabled
                          value={user?.email || ""}
                          className="w-full bg-muted border border-border rounded-xl px-3 py-2 text-xs text-muted-foreground cursor-not-allowed"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-muted-foreground uppercase" htmlFor="profName">Display Name</label>
                        <input
                          id="profName"
                          type="text"
                          required
                          value={profileName}
                          onChange={(e) => setProfileName(e.target.value)}
                          className="w-full bg-muted/20 border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-foreground"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-muted-foreground uppercase" htmlFor="profPhone">Contact Number</label>
                        <input
                          id="profPhone"
                          type="text"
                          value={profilePhone}
                          onChange={(e) => setProfilePhone(e.target.value)}
                          className="w-full bg-muted/20 border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-foreground"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={profileLoading}
                        className="w-full bg-primary text-primary-foreground font-semibold rounded-xl py-2 text-xs hover:opacity-95 shadow-md shadow-primary/10 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        {profileLoading ? (
                          <div className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          "Save Changes"
                        )}
                      </button>
                    </form>
                  </div>
                </div>

                {/* 2. Change Password Form */}
                <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-foreground mb-1 flex items-center gap-2">
                      <KeyRound className="h-4 w-4 text-primary" /> Update Password
                    </h4>
                    <p className="text-xs text-muted-foreground mb-4">Ensure your account stays protected by updating credentials regularly.</p>

                    {passwordError && (
                      <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-3 text-xs font-semibold text-destructive mb-4 animate-in fade-in">
                        {passwordError}
                      </div>
                    )}
                    {passwordSuccess && (
                      <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3 text-xs font-semibold text-green-600 mb-4 animate-in fade-in">
                        {passwordSuccess}
                      </div>
                    )}

                    <form onSubmit={handleChangePassword} className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-muted-foreground uppercase" htmlFor="newPass">New Password</label>
                        <input
                          id="newPass"
                          type="password"
                          required
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Min. 6 characters"
                          className="w-full bg-muted/20 border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-foreground"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={passwordLoading}
                        className="w-full bg-primary text-primary-foreground font-semibold rounded-xl py-2 text-xs hover:opacity-95 shadow-md shadow-primary/10 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        {passwordLoading ? (
                          <div className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          "Change Password"
                        )}
                      </button>
                    </form>
                  </div>
                </div>
              </div>

              {/* 3. General Platform Preferences */}
              <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                <h4 className="font-bold text-sm text-foreground mb-4">General Platform Preferences</h4>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-3 border-b border-border/80">
                    <div>
                      <p className="text-xs font-bold text-foreground">Enable in-app notifications</p>
                      <p className="text-[10px] text-muted-foreground">Show reminders on top navbar for task actions.</p>
                    </div>
                    <div className="w-9 h-5 bg-primary rounded-full relative cursor-pointer"><span className="absolute right-0.5 top-0.5 bg-card w-4 h-4 rounded-full"></span></div>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-border/80">
                    <div>
                      <p className="text-xs font-bold text-foreground">Restrict document visibility</p>
                      <p className="text-[10px] text-muted-foreground">Only show document files to assigned staff members.</p>
                    </div>
                    <div className="w-9 h-5 bg-muted rounded-full relative cursor-pointer"><span className="absolute left-0.5 top-0.5 bg-card w-4 h-4 rounded-full"></span></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
