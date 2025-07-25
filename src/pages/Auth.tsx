import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { 
  Eye, 
  EyeOff, 
  Mail, 
  Lock, 
  ArrowRight,
  Check,
  AlertCircle,
  Heart,
  Stars,
  Zap,
  ArrowLeft,
  Send,
  Timer,
  Shield,
  User,
  CheckCircle2
} from "lucide-react";

const Auth: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup' | 'email-verified' | 'oauth-success'>('signin');
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isEmailValid, setIsEmailValid] = useState(false);
  const [isPasswordValid, setIsPasswordValid] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [showHelpTips, setShowHelpTips] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, session } = useAuth();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const tab = searchParams.get("tab");
    const mode = searchParams.get("mode");

    if (mode === "email-verified") {
      setAuthMode("email-verified");
    } else if (mode === "oauth-success") {
      setAuthMode("oauth-success");
    } else if (tab === "signup") {
      setAuthMode("signup");
    }
  }, [searchParams]);

  useEffect(() => {
    if (user && session) {
      // If user just verified email or completed OAuth, navigate to proper flow
      if (authMode === 'email-verified' || authMode === 'oauth-success') {
        // For new users, they should go through onboarding
        navigate("/onboarding");
      } else {
        // For returning users, go to dashboard
        navigate("/dashboard");
      }
    }
  }, [user, session, navigate, authMode]);

  // Email validation
  useEffect(() => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email) {
      if (emailRegex.test(email)) {
        setIsEmailValid(true);
        setEmailError("");
      } else {
        setIsEmailValid(false);
        setEmailError("Please enter a valid email address");
      }
    } else {
      setIsEmailValid(false);
      setEmailError("");
    }
  }, [email]);

  // Password validation
  useEffect(() => {
    if (password) {
      const hasMinLength = password.length >= 6;
      const hasUpperCase = /[A-Z]/.test(password);
      const hasLowerCase = /[a-z]/.test(password);
      const hasNumber = /\d/.test(password);

      if (authMode === 'signup') {
        if (hasMinLength && hasUpperCase && hasLowerCase && hasNumber) {
          setIsPasswordValid(true);
          setPasswordError("");
        } else {
          setIsPasswordValid(false);
          setPasswordError("Password must be 6+ chars with upper, lower & number");
        }
      } else {
        if (hasMinLength) {
          setIsPasswordValid(true);
          setPasswordError("");
        } else {
          setIsPasswordValid(false);
          setPasswordError("Password must be at least 6 characters");
        }
      }
    } else {
      setIsPasswordValid(false);
      setPasswordError("");
    }
  }, [password, authMode]);

  // Show help tips after failed attempts
  useEffect(() => {
    if (loginAttempts >= 2) {
      setShowHelpTips(true);
    }
  }, [loginAttempts]);

  // Typing indicator
  useEffect(() => {
    if (email || password) {
      setIsTyping(true);
      const timer = setTimeout(() => setIsTyping(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [email, password]);



  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEmailValid || !isPasswordValid) return;
    
    setIsLoading(true);
    try {
      // Use the current domain from window.location, not just origin
      const currentDomain = window.location.href.includes('fly.dev')
        ? window.location.origin
        : window.location.origin.replace(':3000', ':8080');

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${currentDomain}/auth?mode=email-verified`,
        },
      });
      
      if (error) {
        if (error.message.toLowerCase().includes("user already registered")) {
          toast({
            title: "Account exists",
            description: "This email is already registered. Try signing in instead.",
            variant: "destructive",
          });
          setAuthMode('signin');
        } else {
          toast({
            title: "Sign up failed",
            description: error.message,
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Welcome to DripMuse! ✨",
          description: "Check your email to verify your account.",
        });
      }
    } catch (error) {
      toast({
        title: "Something went wrong",
        description: "Please try again or contact support if the issue persists.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEmailValid || !isPasswordValid) return;

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setLoginAttempts(prev => prev + 1);
        
        if (error.message.toLowerCase().includes("invalid login credentials")) {
          toast({
            title: "Invalid credentials",
            description: "Please check your email and password and try again.",
            variant: "destructive",
          });
        } else if (error.message.toLowerCase().includes("email not confirmed")) {
          toast({
            title: "Email not verified",
            description: "Please check your email and click the verification link.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Sign in failed",
            description: error.message,
            variant: "destructive",
          });
        }
      } else {
        setLoginAttempts(0);
        toast({
          title: "Welcome back! 👋",
          description: "You've successfully signed in.",
        });
      }
    } catch (error) {
      setLoginAttempts(prev => prev + 1);
      toast({
        title: "Something went wrong",
        description: "Please try again or contact support if the issue persists.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      // Use the current domain from window.location, not just origin
      const currentDomain = window.location.href.includes('fly.dev')
        ? window.location.origin
        : window.location.origin.replace(':3000', ':8080');

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${currentDomain}/auth?mode=oauth-success`,
        },
      });

      if (error) {
        toast({
          title: "OAuth error",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Something went wrong",
        description: "Please try signing in with email instead.",
        variant: "destructive",
      });
    }
  };

  const canSubmit = isEmailValid && (authMode === 'reset' || (isPasswordValid && (authMode !== 'password-reset' || password === confirmPassword))) && !isLoading;

  const getHelpMessage = () => {
    if (loginAttempts >= 3) {
      return {
        icon: Shield,
        title: "Account Security",
        message: "Multiple failed attempts detected. Consider resetting your password for security.",
        action: () => setAuthMode('reset')
      };
    } else if (loginAttempts >= 2) {
      return {
        icon: Timer,
        title: "Having trouble?",
        message: "Double-check your email and password. Make sure Caps Lock is off.",
      };
    }
    return null;
  };

  const helpMessage = getHelpMessage();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-20 left-20 w-72 h-72 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-72 h-72 bg-gradient-to-r from-yellow-400 to-pink-400 rounded-full mix-blend-multiply filter blur-xl animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute -bottom-8 left-40 w-72 h-72 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full mix-blend-multiply filter blur-xl animate-pulse" style={{animationDelay: '4s'}}></div>
      </div>

      <div className="relative z-10 min-h-screen flex">
        {/* Left side - Hero/Branding */}
        <div className="hidden lg:flex lg:w-1/2 flex-col justify-center items-center p-12 text-center">
          <div className="max-w-md space-y-8">
            <div className="flex items-center justify-center mb-8">
              <img
                src="https://i.ibb.co/cSpbSRn7/logo.png"
                alt="DripMuse Logo"
                className="w-24 h-24 object-contain drop-shadow-lg"
              />
            </div>
            
            <div className="space-y-4">
              <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                DripMuse
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed">
                Your personal AI fashion stylist that understands your unique style
              </p>
            </div>

            <div className="space-y-6 pt-8">
              <div className="flex items-center gap-4 p-4 bg-white/60 backdrop-blur-sm rounded-2xl shadow-lg">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-gray-800">AI-Powered Recommendations</h3>
                  <p className="text-sm text-gray-600">Get outfit suggestions tailored to you</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-white/60 backdrop-blur-sm rounded-2xl shadow-lg">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                  <Heart className="h-6 w-6 text-white" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-gray-800">Color Analysis</h3>
                  <p className="text-sm text-gray-600">Discover your perfect color palette</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-white/60 backdrop-blur-sm rounded-2xl shadow-lg">
                <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-orange-500 rounded-full flex items-center justify-center">
                  <Stars className="h-6 w-6 text-white" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-gray-800">Style Evolution</h3>
                  <p className="text-sm text-gray-600">Track and refine your fashion journey</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Auth Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6">
          <div className="w-full max-w-md space-y-6">
            <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-lg">
              <CardHeader className="text-center space-y-4 pb-8">
                <div className="lg:hidden flex items-center justify-center mb-4">
                  <img
                    src="https://i.ibb.co/cSpbSRn7/logo.png"
                    alt="DripMuse Logo"
                    className="w-20 h-20 object-contain drop-shadow-lg"
                  />
                </div>
                
                <div>
                  <CardTitle className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    {authMode === 'signin' ? 'Welcome Back'
                     : authMode === 'signup' ? 'Join DripMuse'
                     : authMode === 'reset' ? 'Reset Password'
                     : authMode === 'password-reset' ? 'Set New Password'
                     : authMode === 'email-verified' ? 'Email Verified! 🎉'
                     : authMode === 'oauth-success' ? 'Welcome to DripMuse! 🎉'
                     : 'Welcome Back'}
                  </CardTitle>
                  <CardDescription className="text-gray-600 mt-2">
                    {authMode === 'signin'
                      ? 'Sign in to continue your style journey'
                      : authMode === 'signup'
                      ? 'Start your personalized fashion experience'
                      : authMode === 'reset'
                      ? 'Enter your email to reset your password'
                      : authMode === 'password-reset'
                      ? 'Please enter your new password'
                      : authMode === 'email-verified'
                      ? 'Your email has been verified! Let\'s set up your profile.'
                      : authMode === 'oauth-success'
                      ? 'Welcome! Let\'s personalize your fashion experience.'
                      : 'Sign in to continue your style journey'
                    }
                  </CardDescription>
                </div>

                {/* Mode Toggle - only show for signin/signup */}
                {(authMode === 'signin' || authMode === 'signup') && (
                  <div className="flex bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => setAuthMode('signin')}
                      className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
                        authMode === 'signin'
                          ? 'bg-white text-purple-600 shadow-sm'
                          : 'text-gray-600 hover:text-gray-800'
                      }`}
                    >
                      Sign In
                    </button>
                    <button
                      onClick={() => setAuthMode('signup')}
                      className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
                        authMode === 'signup'
                          ? 'bg-white text-purple-600 shadow-sm'
                          : 'text-gray-600 hover:text-gray-800'
                      }`}
                    >
                      Get Started
                    </button>
                  </div>
                )}

                {/* Back button for reset and password-reset modes */}
                {(authMode === 'reset' || authMode === 'password-reset') && (
                  <Button
                    variant="ghost"
                    onClick={() => setAuthMode('signin')}
                    className="self-start"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Sign In
                  </Button>
                )}
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Email Verified Success */}
                {(authMode === 'email-verified' || authMode === 'oauth-success') && (
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                      <CheckCircle2 className="h-8 w-8 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {authMode === 'email-verified' ? 'Email verified successfully!' : 'Welcome to DripMuse!'}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {authMode === 'email-verified'
                          ? 'Your account is now active. Let\'s set up your style profile.'
                          : 'Your account is ready. Let\'s personalize your fashion experience.'
                        }
                      </p>
                    </div>
                    <Button
                      onClick={() => navigate("/onboarding")}
                      className="w-full h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                    >
                      <div className="flex items-center gap-2">
                        Start Your Style Journey
                        <ArrowRight className="h-4 w-4" />
                      </div>
                    </Button>
                  </div>
                )}

                {/* New Password Form (after reset link click) */}
                {authMode === 'password-reset' && (
                  <form onSubmit={handleNewPasswordSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="new-password" className="text-sm font-medium text-gray-700">
                        New Password
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="new-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Create a strong new password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className={`pl-10 pr-12 h-12 transition-all duration-200 ${
                            password && isPasswordValid
                              ? 'border-green-300 bg-green-50'
                              : password && !isPasswordValid
                              ? 'border-red-300 bg-red-50'
                              : 'border-gray-200 focus:border-purple-300'
                          }`}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {passwordError && (
                        <p className="text-xs text-red-500 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {passwordError}
                        </p>
                      )}
                      {password && (
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-xs">
                            <div className={`w-2 h-2 rounded-full ${password.length >= 6 ? 'bg-green-500' : 'bg-gray-300'}`} />
                            <span className={password.length >= 6 ? 'text-green-600' : 'text-gray-500'}>
                              At least 6 characters
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <div className={`w-2 h-2 rounded-full ${/[A-Z]/.test(password) && /[a-z]/.test(password) ? 'bg-green-500' : 'bg-gray-300'}`} />
                            <span className={/[A-Z]/.test(password) && /[a-z]/.test(password) ? 'text-green-600' : 'text-gray-500'}>
                              Upper & lowercase letters
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <div className={`w-2 h-2 rounded-full ${/\d/.test(password) ? 'bg-green-500' : 'bg-gray-300'}`} />
                            <span className={/\d/.test(password) ? 'text-green-600' : 'text-gray-500'}>
                              At least one number
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirm-password" className="text-sm font-medium text-gray-700">
                        Confirm New Password
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="confirm-password"
                          type="password"
                          placeholder="Confirm your new password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className={`pl-10 h-12 transition-all duration-200 ${
                            confirmPassword && password === confirmPassword
                              ? 'border-green-300 bg-green-50'
                              : confirmPassword && password !== confirmPassword
                              ? 'border-red-300 bg-red-50'
                              : 'border-gray-200 focus:border-purple-300'
                          }`}
                          required
                        />
                        {confirmPassword && password === confirmPassword && (
                          <Check className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-500" />
                        )}
                        {confirmPassword && password !== confirmPassword && (
                          <AlertCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-red-500" />
                        )}
                      </div>
                      {confirmPassword && password !== confirmPassword && (
                        <p className="text-xs text-red-500 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          Passwords do not match
                        </p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      disabled={!canSubmit}
                      className="w-full h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:opacity-50 disabled:transform-none disabled:shadow-none"
                    >
                      {isLoading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Updating password...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          Update Password
                        </div>
                      )}
                    </Button>
                  </form>
                )}

                {/* Password Reset Form */}
                {authMode === 'reset' && (
                  <>
                    {resetEmailSent ? (
                      <div className="text-center space-y-4">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                          <CheckCircle2 className="h-8 w-8 text-green-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">Check your email</h3>
                          <p className="text-sm text-gray-600 mt-1">
                            We've sent password reset instructions to <strong>{email}</strong>
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setResetEmailSent(false);
                            setAuthMode('signin');
                          }}
                          className="w-full"
                        >
                          Back to Sign In
                        </Button>
                      </div>
                    ) : (
                      <form onSubmit={handlePasswordReset} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="reset-email" className="text-sm font-medium text-gray-700">
                            Email Address
                          </Label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                              id="reset-email"
                              type="email"
                              placeholder="you@example.com"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              className={`pl-10 h-12 transition-all duration-200 ${
                                email && isEmailValid 
                                  ? 'border-green-300 bg-green-50' 
                                  : email && !isEmailValid 
                                  ? 'border-red-300 bg-red-50'
                                  : 'border-gray-200 focus:border-purple-300'
                              }`}
                              required
                            />
                            {email && isEmailValid && (
                              <Check className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-500" />
                            )}
                          </div>
                          {emailError && (
                            <p className="text-xs text-red-500 flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              {emailError}
                            </p>
                          )}
                        </div>

                        <Button
                          type="submit"
                          disabled={!canSubmit}
                          className="w-full h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:opacity-50 disabled:transform-none disabled:shadow-none"
                        >
                          {isLoading ? (
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              Sending reset email...
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Send className="h-4 w-4" />
                              Send Reset Email
                            </div>
                          )}
                        </Button>
                      </form>
                    )}
                  </>
                )}

                {/* Sign In/Sign Up Forms */}
                {authMode !== 'reset' && (
                  <form onSubmit={authMode === 'signin' ? handleSignIn : handleSignUp} className="space-y-4">
                    {/* Email Field */}
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                        Email Address
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="you@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className={`pl-10 h-12 transition-all duration-200 ${
                            email && isEmailValid 
                              ? 'border-green-300 bg-green-50' 
                              : email && !isEmailValid 
                              ? 'border-red-300 bg-red-50'
                              : 'border-gray-200 focus:border-purple-300'
                          }`}
                          required
                        />
                        {email && isEmailValid && (
                          <Check className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-500" />
                        )}
                        {email && !isEmailValid && (
                          <AlertCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-red-500" />
                        )}
                      </div>
                      {emailError && (
                        <p className="text-xs text-red-500 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {emailError}
                        </p>
                      )}
                    </div>

                    {/* Password Field */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                          Password
                        </Label>
                        {authMode === 'signin' && (
                          <button
                            type="button"
                            onClick={() => setAuthMode('reset')}
                            className="text-xs text-purple-600 hover:text-purple-700 underline"
                          >
                            Forgot password?
                          </button>
                        )}
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder={authMode === 'signup' ? "Create a strong password" : "Enter your password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className={`pl-10 pr-12 h-12 transition-all duration-200 ${
                            password && isPasswordValid 
                              ? 'border-green-300 bg-green-50' 
                              : password && !isPasswordValid 
                              ? 'border-red-300 bg-red-50'
                              : 'border-gray-200 focus:border-purple-300'
                          }`}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {passwordError && (
                        <p className="text-xs text-red-500 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {passwordError}
                        </p>
                      )}
                      {authMode === 'signup' && password && (
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-xs">
                            <div className={`w-2 h-2 rounded-full ${password.length >= 6 ? 'bg-green-500' : 'bg-gray-300'}`} />
                            <span className={password.length >= 6 ? 'text-green-600' : 'text-gray-500'}>
                              At least 6 characters
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <div className={`w-2 h-2 rounded-full ${/[A-Z]/.test(password) && /[a-z]/.test(password) ? 'bg-green-500' : 'bg-gray-300'}`} />
                            <span className={/[A-Z]/.test(password) && /[a-z]/.test(password) ? 'text-green-600' : 'text-gray-500'}>
                              Upper & lowercase letters
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <div className={`w-2 h-2 rounded-full ${/\d/.test(password) ? 'bg-green-500' : 'bg-gray-300'}`} />
                            <span className={/\d/.test(password) ? 'text-green-600' : 'text-gray-500'}>
                              At least one number
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    <Button
                      type="submit"
                      disabled={!canSubmit}
                      className={`w-full h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:opacity-50 disabled:transform-none disabled:shadow-none`}
                    >
                      {isLoading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          {authMode === 'signin' ? 'Signing in...' : 'Creating account...'}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          {authMode === 'signin' ? 'Sign In' : 'Get Started'}
                          <ArrowRight className="h-4 w-4" />
                        </div>
                      )}
                    </Button>
                  </form>
                )}

                {/* OAuth Section - only for signin/signup */}
                {(authMode === 'signin' || authMode === 'signup') && (
                  <>
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <Separator className="w-full" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-white px-2 text-gray-500">Or continue with</span>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      onClick={handleGoogleSignIn}
                      disabled={isLoading}
                      className="w-full h-12 border-gray-200 hover:bg-gray-50 transition-all duration-200"
                    >
                      <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                      Continue with Google
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Help Tips */}
            {showHelpTips && helpMessage && authMode === 'signin' && (
              <Alert className="border-amber-200 bg-amber-50">
                <div className="flex items-start gap-3">
                  <helpMessage.icon className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-medium text-amber-800">{helpMessage.title}</h4>
                    <AlertDescription className="text-amber-700 mt-1">
                      {helpMessage.message}
                    </AlertDescription>
                    {helpMessage.action && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={helpMessage.action}
                        className="mt-2 border-amber-300 text-amber-800 hover:bg-amber-100"
                      >
                        Reset Password
                      </Button>
                    )}
                  </div>
                </div>
              </Alert>
            )}

            {/* Typing Indicator */}
            {isTyping && (authMode === 'signin' || authMode === 'signup') && (
              <div className="flex items-center gap-2 text-xs text-gray-500 justify-center">
                <User className="h-3 w-3 animate-pulse" />
                <span>AI is analyzing your input...</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export { Auth };
export default Auth;
