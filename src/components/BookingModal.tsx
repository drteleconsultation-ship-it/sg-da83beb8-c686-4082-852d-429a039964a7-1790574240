import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Calendar as CalendarIcon, Clock, CheckCircle, CreditCard, ArrowLeft, ExternalLink, CheckCircle2, Upload, FileText } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';
import confetti from 'canvas-confetti';
import { Progress } from '@/components/ui/progress';

// Validation schema
const bookingSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  age: z.string().regex(/^\d+$/, "Age must be a number").refine(val => {
    const num = parseInt(val);
    return num >= 1 && num <= 120;
  }, "Age must be between 1 and 120"),
  gender: z.enum(['male', 'female', 'other'], { required_error: "Gender is required" }),
  whatsapp: z.string().trim().regex(/^\+?[1-9]\d{9,14}$/, "Invalid phone number format"),
  email: z.string().trim().email("Invalid email address").max(255, "Email too long").optional().or(z.literal('')),
  reason: z.string().trim().min(1, "Reason is required").max(1000, "Reason must be less than 1000 characters"),
  serviceType: z.string().min(1, "Service type is required"),
  date: z.date({ required_error: "Appointment date is required" }),
  timeSlot: z.string().min(1, "Time slot is required"),
  attachments: z.array(z.instanceof(File)).max(5, "Maximum 5 files allowed").optional(),
});

// Import background images
import psychiatricBg from '@/assets/psychiatric-counselling-bg.jpg';
import medicalCertificateBg from '@/assets/medical-certificate-bg.jpg';
import generalPhysicianBg from '@/assets/general-physician-bg.jpg';
import gynecologyBg from '@/assets/gynecology-bg.jpg';
import dermatologyBg from '@/assets/dermatology-bg.jpg';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface BookingData {
  name: string;
  age: string;
  gender: string;
  whatsapp: string;
  email: string;
  reason: string;
  consultationType: 'online' | 'clinic';
  consultationMode: 'chat' | 'audio';
  serviceType: string;
  date: Date | undefined;
  timeSlot: string;
  medicalDocuments: File[];
  paymentScreenshot: File | null;
  paymentMethod: 'upi' | 'pay-later';
  suggestions: string;
}

interface ServiceType {
  id: string;
  name: string;
  price: number;
  description: string;
  backgroundImage?: string;
}

const services: ServiceType[] = [
  { id: 'general', name: 'General Physician', price: 150, description: 'Comprehensive general medical consultation', backgroundImage: generalPhysicianBg },
  { id: 'gynecology', name: 'Gynecology (Women\'s issues)', price: 200, description: 'Specialized women\'s health consultation', backgroundImage: gynecologyBg },
  { id: 'dr_priyanka_gynecology', name: 'Consult Dr Priyanka (Gynecology)', price: 200, description: 'Personalized gynecology consultation with Dr. Priyanka', backgroundImage: gynecologyBg },
  { id: 'dermatology', name: 'Dermatology (Skin & Hair)', price: 200, description: 'Expert skin and hair care consultation', backgroundImage: dermatologyBg },
  { id: 'psychiatric', name: 'Psychiatric Counselling', price: 300, description: 'Professional mental health counseling', backgroundImage: psychiatricBg },
  { id: 'certificate', name: 'Medical / Fitness Certificate', price: 200, description: 'Official medical certificates', backgroundImage: medicalCertificateBg },
  { id: 'certificate_prescription', name: 'Medical Certificate + Prescription', price: 250, description: 'Complete medical assessment with prescription', backgroundImage: medicalCertificateBg },
  { id: 'followup', name: 'Free follow up for same issue', price: 0, description: 'Complimentary follow-up consultation for the same medical issue' }
];

// Generate time slots based on consultation type and filter for same-day bookings
const generateTimeSlots = (consultationType: 'online' | 'clinic', selectedDate?: Date) => {
  const slots = [];
  let startHour, endHour;
  
  if (consultationType === 'clinic') {
    // In-clinic: 6 PM to 9 PM
    startHour = 18;
    endHour = 21;
  } else {
    // Online: 9 AM to 10 PM
    startHour = 9;
    endHour = 22;
  }
  
  const now = new Date();
  const isToday = selectedDate && 
    selectedDate.getDate() === now.getDate() &&
    selectedDate.getMonth() === now.getMonth() &&
    selectedDate.getFullYear() === now.getFullYear();
  
  for (let hour = startHour; hour < endHour; hour++) {
    for (let minute = 0; minute < 60; minute += 10) {
      // For same-day bookings, filter out past time slots
      if (isToday) {
        const slotTime = hour * 60 + minute;
        const currentTime = now.getHours() * 60 + now.getMinutes();
        if (slotTime <= currentTime) {
          continue; // Skip past time slots
        }
      }
      
      const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      slots.push(time);
    }
  }
  return slots;
};

const BookingModal: React.FC<BookingModalProps> = ({ isOpen, onClose }) => {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState<'form' | 'payment' | 'confirmation'>('form');
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [slotBookingCounts, setSlotBookingCounts] = useState<{ [key: string]: number }>({});
  const [uploadingFile, setUploadingFile] = useState(false);
  const [booking, setBooking] = useState<BookingData>({
    name: '',
    age: '',
    gender: '',
    whatsapp: '',
    email: '',
    reason: '',
    consultationType: 'clinic',
    consultationMode: 'chat',
    serviceType: '',
    date: undefined,
    timeSlot: '',
    medicalDocuments: [],
    paymentScreenshot: null,
    paymentMethod: 'upi',
    suggestions: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [datePopoverOpen, setDatePopoverOpen] = useState(false);
  const [timePopoverOpen, setTimePopoverOpen] = useState(false);
  
  // Fetch booked slots count when date changes
  useEffect(() => {
    const fetchBookedSlots = async () => {
      if (!booking.date) return;
      
      const { data, error } = await supabase
        .from('appointments')
        .select('time_slot')
        .eq('appointment_date', format(booking.date, 'yyyy-MM-dd'))
        .eq('status', 'confirmed');
      
      if (!error && data) {
        // Count bookings per slot
        const slotCounts: { [key: string]: number } = {};
        data.forEach((appointment) => {
          const slot = appointment.time_slot;
          slotCounts[slot] = (slotCounts[slot] || 0) + 1;
        });
        
        setSlotBookingCounts(slotCounts);
        
        // Slots with 2 or more bookings are fully booked
        const fullyBookedSlots = Object.keys(slotCounts).filter(slot => slotCounts[slot] >= 2);
        setBookedSlots(fullyBookedSlots);
      } else {
        setSlotBookingCounts({});
        setBookedSlots([]);
      }
    };
    
    fetchBookedSlots();
  }, [booking.date]);

  const triggerConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#1e88e5', '#4db8ff', '#00c853', '#ffd700'],
    });
  };

  const getStepNumber = () => {
    switch (currentStep) {
      case 'form': return 1;
      case 'payment': return 2;
      case 'confirmation': return 3;
      default: return 1;
    }
  };

  const getProgressPercentage = () => {
    return (getStepNumber() / 3) * 100;
  };

  const timeSlots = generateTimeSlots(booking.consultationType, booking.date);
  const availableSlots = timeSlots.filter(slot => !bookedSlots.includes(slot));
  const selectedService = services.find(s => s.id === booking.serviceType);
  const amount = selectedService?.price || 0;

  const generateUPILink = (app?: string) => {
    const upiId = '7415379845@okbizaxis';
    const payeeName = 'Dr Deogade Clinic';
    const transactionNote = `${selectedService?.name} - ${booking.name}`;
    const transactionId = `CLINIC${Date.now()}`;
    
    // Standard UPI URL format - more compatible with all apps
    const params = new URLSearchParams({
      pa: upiId,
      pn: payeeName,
      tn: transactionNote,
      am: amount.toString(),
      cu: 'INR',
      tr: transactionId
    }).toString();
    
    // Different apps use different URL schemes
    switch(app) {
      case 'gpay':
        // Google Pay uses gpay:// or tez:// scheme
        return `gpay://upi/pay?${params}`;
      case 'phonepe':
        // PhonePe scheme
        return `phonepe://pay?${params}`;
      case 'paytm':
        // Paytm scheme
        return `paytmmp://pay?${params}`;
      default:
        // Generic UPI intent that works with most apps
        return `upi://pay?${params}`;
    }
  };

  const copyUPIId = () => {
    navigator.clipboard.writeText('7415379845@okbizaxis');
    toast({
      title: "Copied!",
      description: "UPI ID copied to clipboard",
    });
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check CAPTCHA verification
    if (!captchaVerified) {
      toast({
        title: "Verification Required",
        description: "Please confirm you are not a robot before proceeding.",
        variant: "destructive",
      });
      return;
    }
    
    // Validate form data
    try {
      bookingSchema.parse({
        name: booking.name,
        age: booking.age,
        gender: booking.gender,
        whatsapp: booking.whatsapp,
        email: booking.email || '',
        reason: booking.reason,
        serviceType: booking.serviceType,
        date: booking.date,
        timeSlot: booking.timeSlot,
      });
      
      setCurrentStep('payment');
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: error.errors[0].message,
          variant: "destructive",
        });
      }
    }
  };

  const handlePaymentConfirmation = async () => {
    console.log('=== BOOKING CONFIRMATION STARTED ===');
    console.log('Payment method:', booking.paymentMethod);
    console.log('Payment screenshot:', booking.paymentScreenshot?.name);
    
    // Validate payment screenshot for UPI payments
    if (booking.paymentMethod === 'upi' && !booking.paymentScreenshot) {
      console.error('UPI payment selected but no screenshot provided');
      toast({
        title: "Payment Screenshot Required",
        description: "Please upload a screenshot of your UPI payment before confirming.",
        variant: "destructive",
      });
      return;
    }

    console.log('Validation passed, setting payment confirmed...');
    setPaymentConfirmed(true);
    setIsSubmitting(true);

    // Add timeout protection - force completion after 30 seconds
    const timeoutId = setTimeout(() => {
      console.error('⏱️ BOOKING TIMEOUT - Force completing after 30 seconds');
      setIsSubmitting(false);
      toast({
        title: "Booking Timeout",
        description: "The booking is taking too long. Please try again or contact us via WhatsApp.",
        variant: "destructive",
      });
    }, 30000);

    try {
      // Determine appointment status based on payment method
      const appointmentStatus = booking.paymentMethod === 'upi' && booking.paymentScreenshot
        ? 'confirmed'  // Auto-confirm if UPI payment screenshot is provided
        : 'pending';   // Pending if pay-later or no screenshot

      console.log('Appointment status will be:', appointmentStatus);

      // Save appointment to database (without file uploads for now to test)
      const appointmentData = {
        patient_name: booking.name,
        age: booking.age,
        gender: booking.gender,
        whatsapp: booking.whatsapp,
        email: booking.email || null,
        reason: booking.reason,
        consultation_type: booking.consultationType,
        service_type: selectedService?.name || '',
        appointment_date: booking.date!.toISOString().split('T')[0],
        time_slot: booking.timeSlot,
        status: appointmentStatus,
        payment_method: booking.paymentMethod,
        attachment_urls: [] // Empty for now - will add file upload back once basic booking works
      };

      console.log('Saving appointment to database:', appointmentData);

      const { data: savedAppointment, error: dbError } = await supabase
        .from('appointments')
        .insert([appointmentData])
        .select()
        .single();

      if (dbError) {
        console.error('❌ DATABASE ERROR:', dbError);
        console.error('Error code:', dbError.code);
        console.error('Error message:', dbError.message);
        console.error('Error details:', dbError.details);
        throw new Error(`Failed to save appointment: ${dbError.message}`);
      }

      console.log('✅ Appointment saved successfully:', savedAppointment);

      // Clear timeout since booking succeeded
      clearTimeout(timeoutId);

      // Send confirmation emails
      try {
        console.log('📧 Sending confirmation emails...');
        const emailPayload = {
          name: booking.name,
          age: booking.age,
          gender: booking.gender,
          whatsapp: booking.whatsapp,
          email: booking.email,
          reason: booking.reason,
          consultationType: booking.consultationType,
          consultationMode: booking.consultationType === 'online' ? booking.consultationMode : undefined,
          serviceName: selectedService?.name || '',
          serviceCharge: selectedService?.price || 0,
          date: format(booking.date!, 'PPP'),
          timeSlot: booking.timeSlot,
          paymentMethod: booking.paymentMethod,
          suggestions: booking.suggestions || undefined,
        };
        
        console.log('Email payload:', emailPayload);

        const emailResponse = await supabase.functions.invoke('send-booking-confirmation', {
          body: emailPayload,
        });

        if (emailResponse.error) {
          console.error('⚠️ Email sending error:', emailResponse.error);
          toast({
            title: "Appointment Confirmed!",
            description: "Your appointment is booked, but email confirmation may be delayed.",
          });
        } else {
          console.log('✅ Email confirmation sent successfully');
          toast({
            title: "Appointment Confirmed! 🎉",
            description: "You will receive a confirmation email shortly.",
          });
        }
      } catch (emailError) {
        console.error('⚠️ Email function error:', emailError);
        toast({
          title: "Appointment Confirmed!",
          description: "Your appointment is booked. You'll be contacted via WhatsApp.",
        });
      }
      
      console.log('🎉 Triggering confetti animation...');
      triggerConfetti();
      
      // Move to confirmation step
      console.log('📱 Moving to confirmation step...');
      setCurrentStep('confirmation');

      // Reset form after delay
      setTimeout(() => {
        console.log('🔄 Resetting form and closing modal...');
        setBooking({
          name: '',
          age: '',
          gender: '',
          whatsapp: '',
          email: '',
          reason: '',
          consultationType: 'clinic',
          consultationMode: 'chat',
          serviceType: '',
          date: undefined,
          timeSlot: '',
          medicalDocuments: [],
          paymentScreenshot: null,
          paymentMethod: 'upi',
          suggestions: '',
        });
        setCurrentStep('form');
        setPaymentConfirmed(false);
        setCaptchaVerified(false);
        
        onClose();
      }, 3000);
    } catch (error) {
      // Clear timeout on error
      clearTimeout(timeoutId);
      
      console.error('=== ❌ BOOKING ERROR ===');
      console.error('Error type:', typeof error);
      console.error('Error details:', error);
      console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      
      // Check if it's a Supabase error
      if (error && typeof error === 'object' && 'code' in error) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        console.error('Supabase error code:', (error as any).code);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        console.error('Supabase error details:', (error as any).details);
      }
      
      toast({
        title: "Booking Failed",
        description: error instanceof Error ? error.message : "There was an error processing your appointment. Please try again or contact us directly via WhatsApp.",
        variant: "destructive",
      });
      setPaymentConfirmed(false);
    } finally {
      console.log('=== BOOKING PROCESS COMPLETED ===');
      setIsSubmitting(false);
      clearTimeout(timeoutId);
    }
  };

  const handleFinalSubmit = async () => {
    if (!paymentConfirmed) {
      toast({
        title: "Payment Required",
        description: "Please complete the payment before confirming your appointment.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Call the Supabase Edge Function to send confirmation emails
      const response = await fetch('https://dgnwrghklgpnocyynqem.supabase.co/functions/v1/send-booking-confirmation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: booking.name,
          age: booking.age,
          gender: booking.gender,
          whatsapp: booking.whatsapp,
          email: booking.email,
          reason: booking.reason,
          consultationType: booking.consultationType,
          serviceType: selectedService?.name || '',
          amount: amount,
          date: format(booking.date!, 'PPP'),
          timeSlot: booking.timeSlot,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send confirmation emails');
      }

      console.log('Email confirmation sent successfully');
      
      triggerConfetti();
      toast({
        title: "Appointment Confirmed!",
        description: "You will receive a confirmation email shortly. You can pay at the clinic.",
      });

      // Reset form
      setTimeout(() => {
        setBooking({
          name: '',
          age: '',
          gender: '',
          whatsapp: '',
          email: '',
          reason: '',
          consultationType: 'clinic',
          consultationMode: 'chat',
          serviceType: '',
          date: undefined,
          timeSlot: '',
          medicalDocuments: [],
          paymentScreenshot: null,
          paymentMethod: 'upi',
          suggestions: '',
        });
        setCurrentStep('form');
        setPaymentConfirmed(false);
        setCaptchaVerified(false);
        
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Booking error');
      toast({
        title: "Booking Failed",
        description: "There was an error processing your appointment. Please try again or contact us directly via WhatsApp.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderFormStep = () => (
    <form onSubmit={handleFormSubmit} className="space-y-6">
      {/* Progress Indicator */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-muted-foreground">Step {getStepNumber()} of 3</span>
          <span className="text-sm font-medium text-primary">{Math.round(getProgressPercentage())}%</span>
        </div>
        <Progress value={getProgressPercentage()} className="h-2" />
      </div>

      {/* Service Type Selection */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">Service Type *</Label>
        <Select onValueChange={(value) => setBooking({ ...booking, serviceType: value })}>
          <SelectTrigger>
            <SelectValue placeholder="Select consultation service" />
          </SelectTrigger>
          <SelectContent>
            {services.map((service) => (
              <SelectItem key={service.id} value={service.id}>
                <div className="flex justify-between items-center w-full">
                  <span>{service.name}</span>
                  <span className="font-semibold text-primary ml-4">₹{service.price}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedService && selectedService.backgroundImage && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">{selectedService.description}</p>
            <div 
              className="h-20 w-full bg-cover bg-center rounded-lg opacity-30 border"
              style={{
                backgroundImage: `url(${selectedService.backgroundImage})`
              }}
            />
          </div>
        )}
        {selectedService && !selectedService.backgroundImage && (
          <p className="text-sm text-muted-foreground">{selectedService.description}</p>
        )}
      </div>

      {/* Consultation Type */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">Consultation Type</Label>
        <RadioGroup
          value={booking.consultationType}
          onValueChange={(value: 'online' | 'clinic') => 
            setBooking({ ...booking, consultationType: value, timeSlot: '' })
          }
          className="flex gap-6"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="clinic" id="clinic" />
            <Label htmlFor="clinic">In-Clinic Visit</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="online" id="online" />
            <Label htmlFor="online">Online Consultation</Label>
          </div>
        </RadioGroup>
      </div>

      {/* Mode of Consultation - Only show for online consultations */}
      {booking.consultationType === 'online' && (
        <div className="space-y-2">
          <Label className="text-base font-semibold">Mode of Consultation *</Label>
          <Select
            value={booking.consultationMode}
            onValueChange={(value: 'chat' | 'audio') => 
              setBooking({ ...booking, consultationMode: value })
            }
          >
            <SelectTrigger className="bg-background">
              <SelectValue placeholder="Select consultation mode" />
            </SelectTrigger>
            <SelectContent className="bg-background z-50">
              <SelectItem value="chat">Chat</SelectItem>
              <SelectItem value="audio">Audio Call</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Choose how you'd like to connect with the doctor
          </p>
        </div>
      )}

      {/* Personal Information */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Full Name *</Label>
          <Input
            id="name"
            value={booking.name}
            onChange={(e) => setBooking({ ...booking, name: e.target.value })}
            required
            placeholder="Enter your full name"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="age">Age *</Label>
          <Input
            id="age"
            type="number"
            value={booking.age}
            onChange={(e) => setBooking({ ...booking, age: e.target.value })}
            required
            placeholder="Enter your age"
            min="1"
            max="120"
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="gender">Gender *</Label>
          <Select onValueChange={(value) => setBooking({ ...booking, gender: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="whatsapp">WhatsApp Number *</Label>
          <Input
            id="whatsapp"
            type="tel"
            value={booking.whatsapp}
            onChange={(e) => setBooking({ ...booking, whatsapp: e.target.value })}
            required
            placeholder="+91 9876543210"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email (Optional)</Label>
        <Input
          id="email"
          type="email"
          value={booking.email}
          onChange={(e) => setBooking({ ...booking, email: e.target.value })}
          placeholder="your.email@example.com"
        />
      </div>

      {/* Date Selection Section */}
      <div className="space-y-4 p-4 border-2 border-primary/20 rounded-lg bg-primary/5">
        <div className="flex items-center gap-2 mb-2">
          <CalendarIcon className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-lg">Select Appointment Date</h3>
        </div>
        <Popover open={datePopoverOpen} onOpenChange={setDatePopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal h-12",
                !booking.date && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {booking.date ? format(booking.date, 'PPP') : <span>Pick your preferred date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={booking.date}
              onSelect={(date) => {
                setBooking({ ...booking, date, timeSlot: '' });
                setDatePopoverOpen(false);
              }}
              disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
              initialFocus
            />
          </PopoverContent>
        </Popover>
        <p className="text-xs text-muted-foreground">
          Select your preferred consultation date
        </p>
      </div>

      {/* Time Slot Selection Section */}
      <div className="space-y-4 p-4 border-2 border-primary/20 rounded-lg bg-primary/5">
        <div className="flex items-center gap-2 mb-2">
          <Clock className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-lg">Select a time</h3>
        </div>
        {booking.date ? (
          <Popover open={timePopoverOpen} onOpenChange={setTimePopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal h-12",
                  !booking.timeSlot && "text-muted-foreground"
                )}
              >
                <Clock className="mr-2 h-4 w-4" />
                {booking.timeSlot ? (
                  <span>{booking.timeSlot}</span>
                ) : (
                  <span>Pick your preferred time</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start">
              <div className="p-4">
                <RadioGroup value={booking.timeSlot} onValueChange={(value) => {
                  setBooking({...booking, timeSlot: value});
                  setTimePopoverOpen(false);
                }}>
                  <div className="space-y-1 max-h-[400px] overflow-y-auto">
                    {timeSlots.map((slot) => {
                      const maxCapacity = 2;
                      const bookedCount = slotBookingCounts[slot] || 0;
                      const availableCount = maxCapacity - bookedCount;
                      const isFull = availableCount <= 0;
                      
                      return (
                        <div key={slot} className="flex items-center">
                          <RadioGroupItem 
                            value={slot} 
                            id={slot} 
                            disabled={isFull}
                            className="peer sr-only" 
                          />
                          <Label
                            htmlFor={slot}
                            className={`flex items-center justify-between w-full rounded-md border bg-background p-4 hover:bg-accent transition-colors cursor-pointer peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 ${
                              isFull ? 'opacity-50 cursor-not-allowed text-muted-foreground' : ''
                            }`}
                          >
                            <span className="text-base">
                              {slot} {isFull ? '(Full)' : `(${availableCount} available)`}
                            </span>
                            <div className={`w-5 h-5 rounded-full border-2 ${
                              booking.timeSlot === slot 
                                ? 'border-primary bg-primary' 
                                : 'border-muted-foreground'
                            } flex items-center justify-center`}>
                              {booking.timeSlot === slot && (
                                <div className="w-2.5 h-2.5 rounded-full bg-primary-foreground" />
                              )}
                            </div>
                          </Label>
                        </div>
                      );
                    })}
                  </div>
                </RadioGroup>
                <p className="text-xs text-muted-foreground mt-2">
                  {availableSlots.length > 0 
                    ? `${availableSlots.length} slots available`
                    : "No slots available for this date. Please select another date."}
                </p>
              </div>
            </PopoverContent>
          </Popover>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            Please select a date first to view available time slots
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          Select your preferred consultation time
        </p>
      </div>

      {/* File Upload Section */}
      <div className="space-y-4 p-4 border-2 border-primary/20 rounded-lg bg-primary/5">
        <div className="flex items-center gap-2 mb-2">
          <Upload className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-lg">Medical Documents (Optional)</h3>
        </div>
        <div className="space-y-2">
          <Input
            id="attachments"
            type="file"
            accept="image/jpeg,image/png,image/jpg,image/webp,application/pdf"
            multiple
            onChange={(e) => {
              const files = Array.from(e.target.files || []);
              
              if (booking.medicalDocuments.length + files.length > 5) {
                toast({
                  title: "Too Many Files",
                  description: "Maximum 5 files allowed",
                  variant: "destructive",
                });
                e.target.value = '';
                return;
              }
              
              const validFiles: File[] = [];
              for (const file of files) {
                if (file.size > 5242880) {
                  toast({
                    title: "File Too Large",
                    description: `${file.name} exceeds 5MB limit`,
                    variant: "destructive",
                  });
                  continue;
                }
                validFiles.push(file);
              }
              
              if (validFiles.length > 0) {
                setBooking({ ...booking, medicalDocuments: [...booking.medicalDocuments, ...validFiles] });
              }
              e.target.value = '';
            }}
            className="cursor-pointer h-12"
          />
          <p className="text-xs text-muted-foreground">
            Optional: Upload up to 5 medical reports, prescriptions, or relevant images (Max 5MB each, JPG/PNG/PDF)
          </p>
          {booking.medicalDocuments.length > 0 && (
            <div className="mt-2 space-y-2">
              {booking.medicalDocuments.map((file, index) => (
                <div key={index} className="flex items-center gap-2 text-sm text-primary bg-background p-2 rounded border">
                  <FileText className="h-4 w-4 flex-shrink-0" />
                  <span className="flex-1 truncate">{file.name}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const newDocuments = booking.medicalDocuments.filter((_, i) => i !== index);
                      setBooking({ ...booking, medicalDocuments: newDocuments });
                    }}
                    className="h-6 px-2"
                  >
                    Remove
                  </Button>
                </div>
              ))}
              <p className="text-xs text-muted-foreground">
                {booking.medicalDocuments.length} / 5 files selected
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Reason for Visit */}
      <div className="space-y-2">
        <Label htmlFor="reason">Reason for Consultation *</Label>
        <Textarea
          id="reason"
          value={booking.reason}
          onChange={(e) => setBooking({ ...booking, reason: e.target.value })}
          required
          placeholder="Please describe your symptoms or reason for visit"
          rows={3}
        />
      </div>

      {/* Human Verification */}
      <div className="flex items-center space-x-2 p-4 border-2 border-primary/20 rounded-lg bg-primary/5">
        <Checkbox 
          id="captcha" 
          checked={captchaVerified}
          onCheckedChange={(checked) => setCaptchaVerified(checked === true)}
        />
        <label
          htmlFor="captcha"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
        >
          I'm not a robot
        </label>
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="submit" className="flex-1" variant="medical">
          Continue to Payment
        </Button>
      </div>
    </form>
  );

  const renderPaymentStep = () => {
    return (
      <div className="space-y-6">
        {/* Progress Indicator */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-muted-foreground">Step {getStepNumber()} of 3</span>
            <span className="text-sm font-medium text-primary">{Math.round(getProgressPercentage())}%</span>
          </div>
          <Progress value={getProgressPercentage()} className="h-2" />
        </div>

        {/* Appointment Summary */}
        <div className="bg-muted/50 p-4 rounded-lg space-y-3">
          <h3 className="font-semibold text-lg">Appointment Summary</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Service:</span>
              <span className="font-medium">{selectedService?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Type:</span>
              <span className="font-medium capitalize">{booking.consultationType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Date:</span>
              <span className="font-medium">{booking.date && format(booking.date, 'PPP')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Time:</span>
              <span className="font-medium">{booking.timeSlot}</span>
            </div>
            <div className="flex justify-between pt-2 border-t">
              <span className="font-semibold">Amount:</span>
              <span className="font-bold text-primary text-lg">₹{amount}</span>
            </div>
          </div>
        </div>

        {/* Payment Options */}
        <div className="space-y-4">
          <Label className="text-base font-semibold">Payment Method</Label>
          
          <RadioGroup
            value={booking.paymentMethod}
            onValueChange={(value: 'upi' | 'pay-later') => setBooking({ ...booking, paymentMethod: value })}
            className="space-y-3"
          >
            {/* UPI Payment Option */}
            <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-accent/50 transition-colors">
              <RadioGroupItem value="upi" id="upi" className="mt-1" />
              <div className="flex-1">
                <Label htmlFor="upi" className="font-semibold cursor-pointer">
                  Pay Now via UPI
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Quick and secure payment using UPI apps
                </p>
                {booking.paymentMethod === 'upi' && (
                  <div className="mt-3 space-y-4">
                    {/* UPI App Buttons */}
                    <div className="space-y-3">
                      <p className="text-sm font-medium">Pay with UPI App:</p>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          className="h-auto py-3 flex flex-col items-center gap-2"
                          onClick={() => {
                            const upiLink = generateUPILink('gpay');
                            window.location.href = upiLink;
                            toast({
                              title: "Opening Google Pay",
                              description: "Complete payment and return to upload screenshot",
                            });
                          }}
                        >
                          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
                            <span className="text-xl font-bold text-blue-600">G</span>
                          </div>
                          <span className="text-xs">Google Pay</span>
                        </Button>
                        
                        <Button
                          type="button"
                          variant="outline"
                          className="h-auto py-3 flex flex-col items-center gap-2"
                          onClick={() => {
                            const upiLink = generateUPILink('phonepe');
                            window.location.href = upiLink;
                            toast({
                              title: "Opening PhonePe",
                              description: "Complete payment and return to upload screenshot",
                            });
                          }}
                        >
                          <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center">
                            <span className="text-xl font-bold text-white">₹</span>
                          </div>
                          <span className="text-xs">PhonePe</span>
                        </Button>
                        
                        <Button
                          type="button"
                          variant="outline"
                          className="h-auto py-3 flex flex-col items-center gap-2"
                          onClick={() => {
                            const upiLink = generateUPILink('paytm');
                            window.location.href = upiLink;
                            toast({
                              title: "Opening Paytm",
                              description: "Complete payment and return to upload screenshot",
                            });
                          }}
                        >
                          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                            <span className="text-xl font-bold text-white">₹</span>
                          </div>
                          <span className="text-xs">Paytm</span>
                        </Button>
                        
                        <Button
                          type="button"
                          variant="outline"
                          className="h-auto py-3 flex flex-col items-center gap-2"
                          onClick={() => {
                            const upiLink = generateUPILink();
                            window.location.href = upiLink;
                            toast({
                              title: "Opening UPI Apps",
                              description: "Choose your app and complete payment",
                            });
                          }}
                        >
                          <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center">
                            <span className="text-xl font-bold text-white">₹</span>
                          </div>
                          <span className="text-xs">Other UPI</span>
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground text-center">
                        Tap any button above to open the app and complete payment
                      </p>
                      <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-lg p-3 mt-2">
                        <p className="text-xs text-amber-800 dark:text-amber-200">
                          💡 <strong>Tip:</strong> If the app doesn't open, use the UPI ID below to pay manually
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <div className="flex-1 h-px bg-border"></div>
                      <span>OR</span>
                      <div className="flex-1 h-px bg-border"></div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">UPI ID: 7415379845@okbizaxis</p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={copyUPIId}
                        className="h-8 text-xs"
                      >
                        Copy
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      After successful payment, upload a screenshot below to confirm booking.
                    </p>

                    {/* Payment Screenshot Upload - Required for UPI */}
                    <div className="mt-4 p-3 border-2 border-primary/30 rounded-lg bg-primary/5 space-y-3">
                      <div className="flex items-center gap-2">
                        <Upload className="h-4 w-4 text-primary" />
                        <h4 className="font-semibold text-sm">Upload Payment Screenshot *</h4>
                      </div>
                      
                      {!booking.paymentScreenshot ? (
                        <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-primary/40 rounded-lg cursor-pointer bg-background hover:bg-accent/50 transition-colors">
                          <div className="flex flex-col items-center justify-center pt-2 pb-2">
                            <Upload className="w-6 h-6 mb-2 text-primary" />
                            <p className="text-sm text-muted-foreground">
                              <span className="font-semibold text-primary">Tap to upload</span>
                            </p>
                            <p className="text-xs text-muted-foreground">from gallery or camera</p>
                          </div>
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/jpg,image/gif,image/webp,image/heic,image/heif"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              
                              console.log('Payment screenshot selected:', file.name, file.size, file.type);
                              
                              if (file.size > 5242880) {
                                toast({
                                  title: "File Too Large",
                                  description: `${file.name} exceeds 5MB limit`,
                                  variant: "destructive",
                                });
                                e.target.value = '';
                                return;
                              }
                              
                              setBooking(prev => ({ ...prev, paymentScreenshot: file }));
                              toast({
                                title: "Screenshot Added",
                                description: "Payment screenshot uploaded successfully",
                              });
                              e.target.value = '';
                            }}
                          />
                        </label>
                      ) : (
                        <div className="flex items-center gap-2 text-sm text-primary bg-background p-3 rounded-lg border border-primary/30">
                          <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-green-600" />
                          <span className="flex-1 truncate font-medium">{booking.paymentScreenshot.name}</span>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setBooking(prev => ({ ...prev, paymentScreenshot: null }));
                            }}
                            className="h-7 px-2 text-xs"
                          >
                            Change
                          </Button>
                        </div>
                      )}
                      
                      <p className="text-xs text-muted-foreground">
                        Required: Screenshot of successful UPI payment (Max 5MB)
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Pay Later Option */}
            <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-accent/50 transition-colors">
              <RadioGroupItem value="pay-later" id="pay-later" className="mt-1" />
              <div className="flex-1">
                <Label htmlFor="pay-later" className="font-semibold cursor-pointer">
                  Pay at Clinic
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Pay in cash at the time of your visit
                </p>
              </div>
            </div>
          </RadioGroup>
        </div>

        {/* Suggestions/Notes Section */}
        <div className="space-y-3">
          <Label htmlFor="suggestions" className="text-base font-semibold">Any Suggestions or Notes (Optional)</Label>
          <Textarea
            id="suggestions"
            value={booking.suggestions}
            onChange={(e) => setBooking({ ...booking, suggestions: e.target.value })}
            placeholder="Any special requests, preferences, or additional information you'd like to share..."
            rows={3}
            maxLength={500}
          />
          <p className="text-xs text-muted-foreground">
            {booking.suggestions.length}/500 characters
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => setCurrentStep('form')}
            className="flex-1"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button
            type="button"
            variant="medical"
            onClick={() => {
              console.log('=== CONFIRM BUTTON CLICKED ===');
              console.log('Current state:', {
                isSubmitting,
                paymentMethod: booking.paymentMethod,
                hasPaymentScreenshot: !!booking.paymentScreenshot,
                bookingData: booking
              });
              handlePaymentConfirmation();
            }}
            disabled={isSubmitting}
            className="flex-1"
          >
            {isSubmitting ? "Processing..." : booking.paymentMethod === 'upi' ? "Confirm & Book Appointment" : "Confirm Appointment"}
          </Button>
        </div>
      </div>
    );
  };

  const renderConfirmationStep = () => {
    return (
      <div className="space-y-6">
        {/* Progress Indicator */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-muted-foreground">Step {getStepNumber()} of 3</span>
            <span className="text-sm font-medium text-primary">{Math.round(getProgressPercentage())}%</span>
          </div>
          <Progress value={getProgressPercentage()} className="h-2" />
        </div>
        
        {/* Success Animation */}
        <div className="flex justify-center py-6">
          <div className="relative">
            <CheckCircle2 className="h-20 w-20 text-success animate-checkmark" />
          </div>
        </div>

        <div className="text-center space-y-4">
          <h3 className="text-2xl font-bold">Appointment Confirmed!</h3>
          <p className="text-muted-foreground">
            Your consultation has been successfully booked.
          </p>
        </div>

        {/* Appointment Details */}
        <div className="bg-muted/50 p-6 rounded-lg space-y-3">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Patient Name:</span>
              <span className="font-medium">{booking.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Service:</span>
              <span className="font-medium">{selectedService?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Date:</span>
              <span className="font-medium">{booking.date && format(booking.date, 'PPP')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Time:</span>
              <span className="font-medium">{booking.timeSlot}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Type:</span>
              <span className="font-medium capitalize">{booking.consultationType}</span>
            </div>
            <div className="flex justify-between pt-2 border-t">
              <span className="font-semibold">Amount:</span>
              <span className="font-bold text-primary text-lg">₹{amount}</span>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-primary/10 p-4 rounded-lg space-y-2">
          <p className="font-semibold text-sm">📧 Next Steps:</p>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li>Check your email for confirmation details</li>
            <li>You'll receive a WhatsApp reminder before your appointment</li>
            <li>Please arrive 10 minutes early for clinic visits</li>
          </ul>
        </div>

        <Button
          type="button"
          onClick={handleModalClose}
          className="w-full"
          variant="medical"
        >
          Done
        </Button>
      </div>
    );
  };

  const handleModalClose = () => {
    setCurrentStep('form');
    setBooking({
      name: '',
      age: '',
      gender: '',
      whatsapp: '',
      email: '',
      reason: '',
      consultationType: 'clinic',
      consultationMode: 'chat',
      serviceType: '',
      date: undefined,
      timeSlot: '',
      medicalDocuments: [],
      paymentScreenshot: null,
      paymentMethod: 'upi',
      suggestions: '',
    });
    setPaymentConfirmed(false);
    setCaptchaVerified(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleModalClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {currentStep === 'form' && 'Book Your Appointment'}
            {currentStep === 'payment' && 'Payment Details'}
            {currentStep === 'confirmation' && 'Booking Confirmed'}
          </DialogTitle>
        </DialogHeader>
        
        {currentStep === 'form' && renderFormStep()}
        {currentStep === 'payment' && renderPaymentStep()}
        {currentStep === 'confirmation' && renderConfirmationStep()}
      </DialogContent>
    </Dialog>
  );
};

export default BookingModal;