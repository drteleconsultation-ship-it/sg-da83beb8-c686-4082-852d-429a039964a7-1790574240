import { supabase } from "@/integrations/supabase/client";

// Admin credentials - In production, store these in environment variables
const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || "admin@drrikkideogade.in";
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || "Admin@2024";

export interface AdminUser {
  email: string;
  role: string;
}

export const adminLogin = async (email: string, password: string): Promise<{ success: boolean; message: string; user?: AdminUser }> => {
  // Simple credential check - In production, use proper authentication
  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    const user = { email, role: "admin" };
    localStorage.setItem("admin_user", JSON.stringify(user));
    localStorage.setItem("admin_session", Date.now().toString());
    return { success: true, message: "Login successful", user };
  }
  return { success: false, message: "Invalid credentials" };
};

export const adminLogout = () => {
  localStorage.removeItem("admin_user");
  localStorage.removeItem("admin_session");
};

export const getAdminUser = (): AdminUser | null => {
  const userStr = localStorage.getItem("admin_user");
  const sessionTime = localStorage.getItem("admin_session");
  
  if (!userStr || !sessionTime) return null;
  
  // Check session timeout (24 hours)
  const sessionAge = Date.now() - parseInt(sessionTime);
  if (sessionAge > 24 * 60 * 60 * 1000) {
    adminLogout();
    return null;
  }
  
  return JSON.parse(userStr);
};

export const isAdminAuthenticated = (): boolean => {
  return getAdminUser() !== null;
};

export const updateAppointmentStatus = async (appointmentId: string, status: string) => {
  const { data, error } = await supabase
    .from("appointments")
    .update({ status })
    .eq("id", appointmentId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteAppointment = async (appointmentId: string) => {
  const { error } = await supabase
    .from("appointments")
    .delete()
    .eq("id", appointmentId);

  if (error) throw error;
};

export const getAppointments = async (filters?: {
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  serviceType?: string;
}) => {
  let query = supabase
    .from("appointments")
    .select("*")
    .order("created_at", { ascending: false });

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }
  
  if (filters?.dateFrom) {
    query = query.gte("appointment_date", filters.dateFrom);
  }
  
  if (filters?.dateTo) {
    query = query.lte("appointment_date", filters.dateTo);
  }
  
  if (filters?.serviceType) {
    query = query.eq("service_type", filters.serviceType);
  }

  const { data, error } = await query;
  
  if (error) throw error;
  return data;
};