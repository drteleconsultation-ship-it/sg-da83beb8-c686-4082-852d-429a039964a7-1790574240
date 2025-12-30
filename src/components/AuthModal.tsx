import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Phone, Lock } from 'lucide-react';
import { z } from 'zod';
import { User } from '@supabase/supabase-js';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: User) => void;
}

const phoneSchema = z.string().regex(/^[6-9]\d{9}$/, "Invalid Indian mobile number");
const passwordSchema = z.string().min(6, "Password must be at least 6 characters");

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onAuthSuccess }) => {
  const { toast } = useToast();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  const handlePasswordAuth = async () => {
    try {
      phoneSchema.parse(phoneNumber);
      passwordSchema.parse(password);
      setIsLoading(true);

      const email = `${phoneNumber}@patient.drrikkideogade.in`;
      const fullPhone = `+91${phoneNumber}`;

      if (isSignUp) {
        // Sign up new user
        const { data, error } = await supabase.auth.signUp({
          email: email,
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
          const { error: profileError } = await supabase
            .from('patient_profiles')
            .insert([{
              user_id: data.user.id,
              phone_number: fullPhone,
            }]);

          if (profileError) {
            console.error('Profile creation error:', profileError);
          }

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
          email: email,
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
        const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
        toast({
          title: "Authentication Failed",
          description: errorMessage,
          variant: "destructive",
        });
        console.error('Auth error:', error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setPhoneNumber('');
    setPassword('');
    setIsSignUp(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Lock className="h-6 w-6 text-primary" />
            Patient Login
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="phone-password">Mobile Number</Label>
            <div className="flex gap-2">
              <div className="flex items-center px-3 border rounded-md bg-muted">
                <Phone className="h-4 w-4 mr-1" />
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
              ? 'Create a secure account with your mobile number'
              : 'Login using your registered mobile number and password'}
          </p>
        </div>

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