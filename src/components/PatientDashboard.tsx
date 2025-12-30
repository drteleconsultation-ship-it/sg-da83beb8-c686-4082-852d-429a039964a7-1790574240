import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, Clock, User as UserIcon, Phone, Mail, LogOut, FileText, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { User } from '@supabase/supabase-js';

interface PatientDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onLogout: () => void;
}

interface Appointment {
  id: string;
  patient_name: string;
  age: string;
  gender: string;
  whatsapp: string;
  email: string | null;
  service_type: string;
  consultation_type: string;
  appointment_date: string;
  time_slot: string;
  status: string;
  reason: string;
  created_at: string;
}

interface PatientProfile {
  full_name: string | null;
  email: string | null;
  date_of_birth: string | null;
  gender: string | null;
  blood_group: string | null;
}

const PatientDashboard: React.FC<PatientDashboardProps> = ({ 
  isOpen, 
  onClose, 
  user,
  onLogout 
}) => {
  const { toast } = useToast();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen && user) {
      fetchUserData();
    }
  }, [isOpen, user]);

  const fetchUserData = async () => {
    setIsLoading(true);
    try {
      // Fetch patient profile
      const { data: profileData } = await supabase
        .from('patient_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileData) {
        setProfile(profileData);
      }

      // Fetch appointments using phone number
      const phoneNumber = user.phone || user.user_metadata?.phone_number;
      
      if (phoneNumber) {
        const { data: appointmentsData, error } = await supabase
          .from('appointments')
          .select('*')
          .eq('whatsapp', phoneNumber)
          .order('appointment_date', { ascending: false })
          .order('time_slot', { ascending: false });

        if (error) throw error;

        if (appointmentsData) {
          setAppointments(appointmentsData);
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      toast({
        title: "Error",
        description: "Failed to load your data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      });
      onLogout();
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to logout. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return 'bg-green-500';
      case 'pending':
        return 'bg-yellow-500';
      case 'cancelled':
        return 'bg-red-500';
      case 'completed':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center justify-between">
            <span>My Dashboard</span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="gap-2"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* User Profile Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserIcon className="h-5 w-5" />
                  Profile Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Phone:</span>
                  <span>{user.phone || 'Not available'}</span>
                </div>
                {profile?.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Email:</span>
                    <span>{profile.email}</span>
                  </div>
                )}
                {profile?.full_name && (
                  <div className="flex items-center gap-2 text-sm">
                    <UserIcon className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Name:</span>
                    <span>{profile.full_name}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Separator />

            {/* Appointments Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  My Appointments
                </h3>
                <Badge variant="secondary">{appointments.length} Total</Badge>
              </div>

              {appointments.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No appointments found</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Book your first appointment to see it here
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {appointments.map((appointment) => (
                    <Card key={appointment.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-semibold text-lg">{appointment.service_type}</h4>
                            <p className="text-sm text-muted-foreground capitalize">
                              {appointment.consultation_type} Consultation
                            </p>
                          </div>
                          <Badge className={getStatusColor(appointment.status)}>
                            {appointment.status}
                          </Badge>
                        </div>

                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>{format(new Date(appointment.appointment_date), 'PPP')}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span>{appointment.time_slot}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <UserIcon className="h-4 w-4 text-muted-foreground" />
                            <span>{appointment.patient_name}, {appointment.age} years</span>
                          </div>
                        </div>

                        {appointment.reason && (
                          <div className="mt-3 pt-3 border-t">
                            <p className="text-sm text-muted-foreground">
                              <span className="font-medium">Reason:</span> {appointment.reason}
                            </p>
                          </div>
                        )}

                        <div className="mt-2 text-xs text-muted-foreground">
                          Booked on {format(new Date(appointment.created_at), 'PPP')}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PatientDashboard;