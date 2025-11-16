import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Mail, Globe, LockKeyhole, UserPlus, Facebook } from 'lucide-react';
import { loginUser, registerUser, signInWithGoogle, signInWithFacebook } from '@/services/firebaseService';
import ForgotPassword from './auth/ForgotPassword';

interface AuthScreenProps {
  onAuthComplete: (usernameSetupNeeded: boolean) => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthComplete }) => {
  const [loading, setLoading] = useState(false);
  
  // Email auth states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [username, setUsername] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  
  const handleGoogleSignIn = async () => {
    setLoading(true);
    
    try {
      const user = await signInWithGoogle();
      if (user && user.displayName) {
        toast.success(`Welcome, ${user.displayName}!`);
      } else {
        toast.success("Google authentication successful");
      }
      onAuthComplete(false);
    } catch (error: any) {
      // Check if the error might be related to ad blockers
      if (error.message.includes("network") || 
          error.message.includes("permission") || 
          error.message.includes("blocked")) {
        toast.error("Authentication failed. This may be due to an ad blocker or privacy extension. Please disable them temporarily and try again.");
      } else {
        toast.error(error.message || "Google authentication failed");
      }
    } finally {
      setLoading(false);
    }
  };
  
  const handleFacebookSignIn = async () => {
    setLoading(true);
    
    try {
      const user = await signInWithFacebook();
      if (user && user.displayName) {
        toast.success(`Welcome, ${user.displayName}!`);
      } else {
        toast.success("Facebook authentication successful");
      }
      onAuthComplete(false);
    } catch (error: any) {
      // Check if the error might be related to ad blockers
      if (error.message.includes("network") || 
          error.message.includes("permission") || 
          error.message.includes("blocked")) {
        toast.error("Authentication failed. This may be due to an ad blocker or privacy extension. Please disable them temporarily and try again.");
      } else {
        toast.error(error.message || "Facebook authentication failed");
      }
    } finally {
      setLoading(false);
    }
  };
  
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error("Please enter your email");
      return;
    }
    
    if (!password) {
      toast.error("Please enter your password");
      return;
    }
    
    if (isSignUp) {
      if (password !== confirmPassword) {
        toast.error("Passwords do not match");
        return;
      }
      
      if (!username) {
        toast.error("Please enter a username");
        return;
      }
      
      setLoading(true);
      try {
        await registerUser(email, password, username);
        toast.success("Account created successfully");
        onAuthComplete(false);
      } catch (error: any) {
        toast.error(error.message || "Failed to create account");
      } finally {
        setLoading(false);
      }
    } else {
      setLoading(true);
      try {
        const user = await loginUser(email, password);
        
        // Check if username needs to be displayed
        if (user && user.displayName) {
          toast.success(`Welcome back, ${user.displayName}!`);
        } else {
          toast.success("Login successful");
        }
        
        onAuthComplete(false);
      } catch (error: any) {
        // Check if the error might be related to ad blockers
        if (error.message.includes("network") || 
            error.message.includes("permission") || 
            error.message.includes("blocked")) {
          toast.error("Login failed. This may be due to an ad blocker or privacy extension. Please disable them temporarily and try again.");
        } else {
          toast.error(error.message || "Login failed");
        }
      } finally {
        setLoading(false);
      }
    }
  };
  
  if (showForgotPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background/80 to-muted p-4">
        <ForgotPassword 
          onCancel={() => setShowForgotPassword(false)} 
          onSuccess={() => {
            setShowForgotPassword(false);
            setEmail('');
          }}
        />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background/80 to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            Welcome to Zoophi
          </CardTitle>
          <CardDescription>
            Sign in to continue to the app
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="email" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="email">Email</TabsTrigger>
              <TabsTrigger value="google">Google</TabsTrigger>
              <TabsTrigger value="facebook">Facebook</TabsTrigger>
            </TabsList>
            
            <TabsContent value="email" className="space-y-4">
              <form onSubmit={handleEmailSubmit}>
                <div className="space-y-4">
                  {isSignUp && (
                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <div className="flex">
                        <span className="inline-flex items-center px-3 border border-r-0 border-input rounded-l-md bg-muted">
                          <UserPlus className="h-4 w-4 text-muted-foreground" />
                        </span>
                        <Input
                          id="username"
                          type="text"
                          placeholder="Enter your username"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          disabled={loading}
                          className="rounded-l-none"
                        />
                      </div>
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="flex">
                      <span className="inline-flex items-center px-3 border border-r-0 border-input rounded-l-md bg-muted">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                      </span>
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={loading}
                        className="rounded-l-none"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="password">Password</Label>
                      {!isSignUp && (
                        <Button
                          type="button"
                          variant="link"
                          size="sm"
                          className="p-0 h-auto text-xs"
                          onClick={() => setShowForgotPassword(true)}
                        >
                          Forgot password?
                        </Button>
                      )}
                    </div>
                    <div className="flex">
                      <span className="inline-flex items-center px-3 border border-r-0 border-input rounded-l-md bg-muted">
                        <LockKeyhole className="h-4 w-4 text-muted-foreground" />
                      </span>
                      <Input
                        id="password"
                        type="password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading}
                        className="rounded-l-none"
                      />
                    </div>
                  </div>
                  
                  {isSignUp && (
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm Password</Label>
                      <div className="flex">
                        <span className="inline-flex items-center px-3 border border-r-0 border-input rounded-l-md bg-muted">
                          <LockKeyhole className="h-4 w-4 text-muted-foreground" />
                        </span>
                        <Input
                          id="confirmPassword"
                          type="password"
                          placeholder="Confirm your password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          disabled={loading}
                          className="rounded-l-none"
                        />
                      </div>
                    </div>
                  )}
                  
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Processing..." : isSignUp ? "Sign Up" : "Sign In"}
                  </Button>
                  
                  <div className="text-center">
                    <Button
                      type="button"
                      variant="link"
                      onClick={() => setIsSignUp(!isSignUp)}
                      disabled={loading}
                    >
                      {isSignUp ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}
                    </Button>
                  </div>
                </div>
              </form>
            </TabsContent>
            
            <TabsContent value="google" className="space-y-4">
              <div className="flex justify-center">
                <Button
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-white hover:bg-gray-100 text-slate-900 border border-gray-300"
                >
                  <Globe className="h-5 w-5" />
                  {loading ? "Signing in..." : "Sign in with Google"}
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="facebook" className="space-y-4">
              <div className="flex justify-center">
                <Button
                  onClick={handleFacebookSignIn}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-[#1877F2] hover:bg-[#166FE5] text-white"
                >
                  <Facebook className="h-5 w-5" />
                  {loading ? "Signing in..." : "Sign in with Facebook"}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-center border-t pt-4">
          <p className="text-xs text-muted-foreground">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default AuthScreen;