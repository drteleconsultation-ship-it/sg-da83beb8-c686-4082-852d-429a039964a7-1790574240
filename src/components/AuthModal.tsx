import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Phone, Lock, KeyRound } from 'lucide-react';
import { z } from 'zod';
import { User } from '@supabase/supabase-js';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: User) => void;
}

const phoneSchema = z.string().regex(/^[6-9]\d{9}$/, "Invalid Indian mobile number");
const otpSchema = z.string().length(6, "OTP must be 6 digits");
const passwordSchema = z.string().min(6, "Password must be at least 6 characters");

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onAuthSuccess }) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'otp' | 'password'>('otp');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  const handleSendOTP = async () => {
    try {
      phoneSchema.parse(phoneNumber);
      setIsLoading(true);

      const fullPhone = `+91${phoneNumber}`;
      
      const { error } = await supabase.auth.signInWithOtp({
        phone: fullPhone,
        options: {
          shouldCreateUser: true,
        }
      });

      if (error) throw error;

      setOtpSent(true);
      toast({
        title: "OTP Sent!",
        description: `A 6-digit code has been sent to ${fullPhone}`,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Invalid Phone Number",
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to send OTP. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    try {
      otpSchema.parse(otp);
      setIsLoading(true);

      const fullPhone = `+91${phoneNumber}`;
      
      const { data, error } = await supabase.auth.verifyOtp({
        phone: fullPhone,
        token: otp,
        type: 'sms'
      });

      if (error) throw error;

      if (data.user) {
        // Check if user profile exists
        const { data: profile } = await supabase
          .from('patient_profiles')
          .select('*')
          .eq('user_id', data.user.id)
          .single();

        if (!profile) {
          // Create profile for new user
          await supabase
            .from('patient_profiles')
            .insert([{
              user_id: data.user.id,
              phone_number: fullPhone,
            }]);
        }

        toast({
          title: "Login Successful!",
          description: "Welcome back!",
        });
        onAuthSuccess(data.user);
        handleClose();
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Invalid OTP",
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Verification Failed",
          description: "Invalid OTP. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordAuth = async () => {
    try {
      phoneSchema.parse(phoneNumber);
      passwordSchema.parse(password);
      setIsLoading(true);

      const fullPhone = `+91${phoneNumber}`;
      const email = `${phoneNumber}@patient.drrikkideogade.in`;

      if (isSignUp) {
        // Sign up new user
        const { data, error } = await supabase.auth.signUp({
          phone: fullPhone,
          password: password,
          options: {
            data: {
              phone_number: fullPhone,
            }
          }
        });

        if (error) throw error;

        if (data.user) {
          // Create patient profile
          await supabase
            .from('patient_profiles')
            .insert([{
              user_id: data.user.id,
              phone_number: fullPhone,
            }]);

          toast({
            title: "Account Created!",
            description: "Your account has been created successfully.",
          });
          onAuthSuccess(data.user);
          handleClose();
        }
      } else {
        // Sign in existing user
        const { data, error } = await supabase.auth.signInWithPassword({
          phone: fullPhone,
          password: password,
        });

        if (error) {
          // If user doesn't exist, prompt to sign up
          if (error.message.includes('Invalid login credentials')) {
            toast({
              title: "Account Not Found",
              description: "Would you like to create a new account?",
              variant: "destructive",
            });
            setIsSignUp(true);
            return;
          }
          throw error;
        }

        if (data.user) {
          toast({
            title: "Login Successful!",
            description: "Welcome back!",
          });
          onAuthSuccess(data.user);
          handleClose();
        }
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Authentication Failed",
          description: "Please check your credentials and try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setPhoneNumber('');
    setOtp('');
    setPassword('');
    setOtpSent(false);
    setIsSignUp(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Patient Login</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'otp' | 'password')} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="otp">
              <Phone className="mr-2 h-4 w-4" />
              OTP Login
            </TabsTrigger>
            <TabsTrigger value="password">
              <Lock className="mr-2 h-4 w-4" />
              Password
            </TabsTrigger>
          </TabsList>

          <TabsContent value="otp" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="phone-otp">Mobile Number</Label>
              <div className="flex gap-2">
                <div className="flex items-center px-3 border rounded-md bg-muted">
                  <span className="text-sm">+91</span>
                </div>
                <Input
                  id="phone-otp"
                  type="tel"
                  placeholder="9876543210"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  maxLength={10}
                  disabled={otpSent}
                />
              </div>
            </div>

            {!otpSent ? (
              <Button
                onClick={handleSendOTP}
                disabled={isLoading || phoneNumber.length !== 10}
                className="w-full"
                variant="medical"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending OTP...
                  </>
                ) : (
                  <>
                    <KeyRound className="mr-2 h-4 w-4" />
                    Send OTP
                  </>
                )}
              </Button>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="otp">Enter 6-Digit OTP</Label>
                  <Input
                    id="otp"
                    type="text"
                    placeholder="123456"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    maxLength={6}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleVerifyOTP}
                    disabled={isLoading || otp.length !== 6}
                    className="flex-1"
                    variant="medical"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      'Verify & Login'
                    )}
                  </Button>
                </div>

                <Button
                  variant="ghost"
                  onClick={() => setOtpSent(false)}
                  className="w-full text-sm"
                  disabled={isLoading}
                >
                  Change Phone Number
                </Button>
              </>
            )}

            <p className="text-xs text-muted-foreground text-center">
              You'll receive a 6-digit verification code via SMS
            </p>
          </TabsContent>

          <TabsContent value="password" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="phone-password">Mobile Number</Label>
              <div className="flex gap-2">
                <div className="flex items-center px-3 border rounded-md bg-muted">
                  <span className="text-sm">+91</span>
                </div>
                <Input
                  id="phone-password"
                  type="tel"
                  placeholder="9876543210"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  maxLength={10}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <Button
              onClick={handlePasswordAuth}
              disabled={isLoading || phoneNumber.length !== 10 || password.length < 6}
              className="w-full"
              variant="medical"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isSignUp ? 'Creating Account...' : 'Logging in...'}
                </>
              ) : (
                <>{isSignUp ? 'Create Account' : 'Login'}</>
              )}
            </Button>

            {!isSignUp && (
              <Button
                variant="ghost"
                onClick={() => setIsSignUp(true)}
                className="w-full text-sm"
                disabled={isLoading}
              >
                Don't have an account? Sign Up
              </Button>
            )}

            {isSignUp && (
              <Button
                variant="ghost"
                onClick={() => setIsSignUp(false)}
                className="w-full text-sm"
                disabled={isLoading}
              >
                Already have an account? Login
              </Button>
            )}

            <p className="text-xs text-muted-foreground text-center">
              {isSignUp 
                ? 'Create a secure account with password'
                : 'Login using your registered mobile number and password'}
            </p>
          </TabsContent>
        </Tabs>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or
            </span>
          </div>
        </div>

        <Button
          variant="outline"
          onClick={handleClose}
          className="w-full"
        >
          Continue as Guest
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;