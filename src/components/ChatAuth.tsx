import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, Mail, Lock, User, Phone, Briefcase } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export function ChatAuth() {
  const [step, setStep] = useState<'auth' | 'verify'>('auth');
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [userType, setUserType] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { user, signIn, signUp, signInWithGoogle, verifyEmail } = useAuth();
  const { toast } = useToast();

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) throw error;
      } else {
        const { error } = await signUp(email, password, displayName, phone, userType);
        if (error) {
          throw error;
        } else {
          setStep('verify');
          toast({
            title: "Verification Code Sent",
            description: "Please check your email for the verification code.",
          });
        }
      }
    } catch (error: any) {
      toast({
        title: isLogin ? "Sign In Error" : "Sign Up Error",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await verifyEmail(email, verificationCode);
      if (error) {
        throw error;
      } else {
        toast({
          title: "Success!",
          description: "Your email has been verified. You can now sign in.",
        });
        setStep('auth');
        setIsLogin(true);
      }
    } catch (error: any) {
      toast({
        title: "Verification Error",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) throw error;
    } catch (error: any) {
      toast({
        title: "Google Sign In Error",
        description: error.message || "An unexpected error occurred with Google sign in.",
        variant: "destructive",
      });
    } finally {
      setGoogleLoading(false);
    }
  };

  // --- VERIFICATION STEP UI ---
  if (step === 'verify') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f9fafb] px-4 font-sans">
        <div className="w-full max-w-[400px] bg-white p-8 rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-gray-100">
          
          <div className="flex flex-col items-center mb-8">
            <div className="w-12 h-12 mb-4">
              <img 
                src="https://asmostaidymrcesixebq.supabase.co/storage/v1/object/public/asset/juristlogo.png" 
                alt="Jurist Mind" 
                className="w-full h-full object-contain" 
              />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Check your inbox</h1>
            <p className="text-gray-500 mt-2 text-sm text-center">
              Enter the 6-digit code sent to <strong>{email}</strong>
            </p>
          </div>
          
          <form onSubmit={handleVerification} className="space-y-6">
            <Input
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              placeholder="000000"
              className="text-center text-3xl tracking-[1em] h-16 font-mono bg-gray-50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-[#10a37f]/20 rounded-xl"
              maxLength={6}
              required
            />
            
            <Button 
              type="submit" 
              className="w-full h-12 bg-[#10a37f] hover:bg-[#0d8a6a] text-white font-medium rounded-xl text-base transition-all" 
              disabled={loading || verificationCode.length !== 6}
            >
              {loading ? <Loader2 className="animate-spin" /> : 'Verify Email'}
            </Button>
            
            <Button
              type="button"
              variant="ghost"
              onClick={() => setStep('auth')}
              className="w-full text-gray-500 hover:text-gray-900"
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Sign Up
            </Button>
          </form>
        </div>
      </div>
    );
  }

  // --- MAIN AUTH UI (Login / Sign Up) ---
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f9fafb] px-4 font-sans">
      <div className="w-full max-w-[400px] bg-white p-8 md:p-10 rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-gray-100">
        
        {/* Logo & Header */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 mb-4">
            <img 
              src="https://asmostaidymrcesixebq.supabase.co/storage/v1/object/public/asset/juristlogo.png" 
              alt="Jurist Mind" 
              className="w-full h-full object-contain" 
            />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            {isLogin ? 'Welcome back' : 'Create your account'}
          </h1>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          
          {/* Sign Up Specific Fields */}
          {!isLogin && (
            <>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Full Name"
                  className="pl-10 h-12 bg-gray-50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-black/5 rounded-xl"
                  required={!isLogin}
                />
              </div>
              
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+234..."
                  className="pl-10 h-12 bg-gray-50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-black/5 rounded-xl"
                  maxLength={14}
                  required={!isLogin}
                />
              </div>

              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
                <Select value={userType} onValueChange={setUserType} required={!isLogin}>
                  <SelectTrigger className="pl-10 h-12 bg-gray-50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-black/5 rounded-xl">
                    <SelectValue placeholder="I am a..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lawyer">Lawyer</SelectItem>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="researcher">Researcher</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
          
          {/* Email & Password (Always Visible) */}
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              className="pl-10 h-12 bg-gray-50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-black/5 rounded-xl"
              required
            />
          </div>
          
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="pl-10 h-12 bg-gray-50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-black/5 rounded-xl"
              required
            />
          </div>
          
          <Button 
            type="submit" 
            className="w-full h-12 bg-[#10a37f] hover:bg-[#0d8a6a] text-white font-medium rounded-xl text-base transition-all shadow-sm" 
            disabled={loading || (!isLogin && (!userType || !phone))}
          >
            {loading ? (
              <Loader2 className="animate-spin" />
            ) : (
              isLogin ? 'Continue' : 'Create Account'
            )}
          </Button>

          {/* Divider */}
          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-400 font-medium">Or</span>
            </div>
          </div>
          
          {/* Google Button */}
          <Button
            type="button"
            variant="outline"
            onClick={handleGoogleSignIn}
            disabled={googleLoading || loading}
            className="w-full h-12 border-gray-200 hover:bg-gray-50 rounded-xl font-normal text-gray-700"
          >
            {googleLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
            )}
            Continue with Google
          </Button>
        </form>
        
        {/* Footer Toggle */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            {isLogin ? "Don't have an account?" : "Already have an account?"}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="ml-1.5 font-semibold text-[#10a37f] hover:underline focus:outline-none transition-colors"
            >
              {isLogin ? "Sign up" : "Log in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
