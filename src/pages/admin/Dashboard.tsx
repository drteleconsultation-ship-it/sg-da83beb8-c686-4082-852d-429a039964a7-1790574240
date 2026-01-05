import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { adminLogout, isAdminAuthenticated, getAppointments, updateAppointmentStatus, deleteAppointment } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { 
  Calendar, 
  Clock, 
  DollarSign, 
  Users, 
  LogOut, 
  CheckCircle, 
  XCircle, 
  Eye,
  Trash2,
  FileText,
  Download,
  Search,
  Filter
} from "lucide-react";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Appointment {
  id: string;
  patient_name: string;
  age: string;
  gender: string;
  whatsapp: string;
  email: string | null;
  reason: string;
  consultation_type: string;
  service_type: string;
  appointment_date: string;
  time_slot: string;
  status: string;
  payment_method: string;
  attachment_urls: string[];
  created_at: string;
}

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [appointmentToDelete, setAppointmentToDelete] = useState<string | null>(null);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    confirmed: 0,
    completed: 0,
    revenue: 0,
  });

  useEffect(() => {
    if (!isAdminAuthenticated()) {
      navigate("/admin/login");
      return;
    }
    fetchAppointments();
  }, [navigate]);

  useEffect(() => {
    filterAppointments();
  }, [appointments, statusFilter, searchTerm, dateFilter]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const data = await getAppointments();
      setAppointments(data || []);
      calculateStats(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch appointments",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data: Appointment[]) => {
    const serviceCharges: { [key: string]: number } = {
      "General Physician": 150,
      "Gynecology (Women's issues)": 200,
      "Consult Dr Priyanka (Gynecology)": 200,
      "Dermatology (Skin & Hair)": 200,
      "Psychiatric Counselling": 300,
      "Medical / Fitness Certificate": 200,
      "Medical Certificate + Prescription": 250,
      "Free follow up for same issue": 0,
    };

    const revenue = data
      .filter(apt => apt.status === "confirmed" || apt.status === "completed")
      .reduce((sum, apt) => sum + (serviceCharges[apt.service_type] || 0), 0);

    setStats({
      total: data.length,
      pending: data.filter(apt => apt.status === "pending").length,
      confirmed: data.filter(apt => apt.status === "confirmed").length,
      completed: data.filter(apt => apt.status === "completed").length,
      revenue,
    });
  };

  const filterAppointments = () => {
    let filtered = [...appointments];

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(apt => apt.status === statusFilter);
    }

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(apt =>
        apt.patient_name.toLowerCase().includes(search) ||
        apt.whatsapp.includes(search) ||
        apt.email?.toLowerCase().includes(search) ||
        apt.service_type.toLowerCase().includes(search)
      );
    }

    // Date filter
    if (dateFilter) {
      filtered = filtered.filter(apt => apt.appointment_date === dateFilter);
    }

    setFilteredAppointments(filtered);
  };

  const handleStatusUpdate = async (appointmentId: string, newStatus: string) => {
    try {
      await updateAppointmentStatus(appointmentId, newStatus);
      toast({
        title: "Success",
        description: `Appointment ${newStatus} successfully`,
      });
      fetchAppointments();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update appointment status",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!appointmentToDelete) return;

    try {
      await deleteAppointment(appointmentToDelete);
      toast({
        title: "Success",
        description: "Appointment deleted successfully",
      });
      fetchAppointments();
      setDeleteDialogOpen(false);
      setAppointmentToDelete(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete appointment",
        variant: "destructive",
      });
    }
  };

  const handleLogout = () => {
    adminLogout();
    navigate("/admin/login");
    toast({
      title: "Logged Out",
      description: "You have been logged out successfully",
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: { [key: string]: "default" | "secondary" | "destructive" | "outline" } = {
      pending: "secondary",
      confirmed: "default",
      completed: "outline",
      cancelled: "destructive",
    };
    return (
      <Badge variant={variants[status] || "default"} className="capitalize">
        {status}
      </Badge>
    );
  };

  const downloadAttachment = async (filePath: string) => {
    try {
      const { data, error } = await supabase.storage
        .from("medical-documents")
        .download(filePath);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = filePath.split("/").pop() || "document";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download file",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground">Dr. Deogade Clinic Management</p>
          </div>
          <Button onClick={handleLogout} variant="outline">
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Appointments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                <span className="text-2xl font-bold">{stats.total}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-yellow-500" />
                <span className="text-2xl font-bold">{stats.pending}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Confirmed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-blue-500" />
                <span className="text-2xl font-bold">{stats.confirmed}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Completed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-2xl font-bold">{stats.completed}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-green-500" />
                <span className="text-2xl font-bold">₹{stats.revenue}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, phone, email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Date</label>
                <Input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Appointments Table */}
        <Card>
          <CardHeader>
            <CardTitle>Appointments</CardTitle>
            <CardDescription>
              Showing {filteredAppointments.length} of {appointments.length} appointments
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : filteredAppointments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No appointments found</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Patient</TableHead>
                      <TableHead>Service</TableHead>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAppointments.map((appointment) => (
                      <TableRow key={appointment.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{appointment.patient_name}</div>
                            <div className="text-sm text-muted-foreground">
                              {appointment.age}y, {appointment.gender}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {appointment.whatsapp}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{appointment.service_type}</div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span className="text-sm">
                              {format(new Date(appointment.appointment_date), "MMM dd, yyyy")}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            <span className="text-sm">{appointment.time_slot}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {appointment.consultation_type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {appointment.payment_method === "upi" ? "UPI" : "Pay Later"}
                          </Badge>
                        </TableCell>
                        <TableCell>{getStatusBadge(appointment.status)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setSelectedAppointment(appointment);
                                setViewDialogOpen(true);
                              }}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            {appointment.status === "pending" && (
                              <>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleStatusUpdate(appointment.id, "confirmed")}
                                  className="text-green-600 hover:text-green-700"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleStatusUpdate(appointment.id, "cancelled")}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <XCircle className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                            {appointment.status === "confirmed" && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleStatusUpdate(appointment.id, "completed")}
                                className="text-blue-600 hover:text-blue-700"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setAppointmentToDelete(appointment.id);
                                setDeleteDialogOpen(true);
                              }}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* View Appointment Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Appointment Details</DialogTitle>
            <DialogDescription>Complete information about the appointment</DialogDescription>
          </DialogHeader>
          {selectedAppointment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Patient Name</label>
                  <p className="text-base font-medium">{selectedAppointment.patient_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Age & Gender</label>
                  <p className="text-base">{selectedAppointment.age} years, {selectedAppointment.gender}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">WhatsApp</label>
                  <p className="text-base">{selectedAppointment.whatsapp}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <p className="text-base">{selectedAppointment.email || "N/A"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Service Type</label>
                  <p className="text-base">{selectedAppointment.service_type}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Consultation Type</label>
                  <p className="text-base capitalize">{selectedAppointment.consultation_type}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Appointment Date</label>
                  <p className="text-base">
                    {format(new Date(selectedAppointment.appointment_date), "PPP")}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Time Slot</label>
                  <p className="text-base">{selectedAppointment.time_slot}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Payment Method</label>
                  <p className="text-base capitalize">{selectedAppointment.payment_method === "upi" ? "UPI" : "Pay Later"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <div className="mt-1">{getStatusBadge(selectedAppointment.status)}</div>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">Reason for Visit</label>
                <p className="text-base mt-1 p-3 bg-muted rounded-md">{selectedAppointment.reason}</p>
              </div>

              {selectedAppointment.attachment_urls && selectedAppointment.attachment_urls.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Medical Documents</label>
                  <div className="space-y-2 mt-2">
                    {selectedAppointment.attachment_urls.map((url, index) => (
                      <div key={index} className="flex items-center justify-between p-2 border rounded-md">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-primary" />
                          <span className="text-sm">{url.split("/").pop()}</span>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => downloadAttachment(url)}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                {selectedAppointment.status === "pending" && (
                  <>
                    <Button
                      onClick={() => {
                        handleStatusUpdate(selectedAppointment.id, "confirmed");
                        setViewDialogOpen(false);
                      }}
                      className="flex-1"
                      variant="medical"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Confirm Appointment
                    </Button>
                    <Button
                      onClick={() => {
                        handleStatusUpdate(selectedAppointment.id, "cancelled");
                        setViewDialogOpen(false);
                      }}
                      variant="destructive"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject
                    </Button>
                  </>
                )}
                {selectedAppointment.status === "confirmed" && (
                  <Button
                    onClick={() => {
                      handleStatusUpdate(selectedAppointment.id, "completed");
                      setViewDialogOpen(false);
                    }}
                    className="flex-1"
                    variant="medical"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Mark as Completed
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the appointment.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminDashboard;