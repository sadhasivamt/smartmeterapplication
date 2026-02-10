import { useState, useEffect } from "react";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Eye, EyeOff, Mail, Lock, User } from "lucide-react";
import { toast } from "sonner";
import { API_ENDPOINTS, getApiUrl } from "../../config/api";

interface AuthPageProps {
  onLoginSuccess: (userName: string, isDemoMode?: boolean, userEmail?: string, userRole?: string) => void;
}

export function AuthPage({ onLoginSuccess }: AuthPageProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginData, setLoginData] = useState({ email: "", password: "", remember: false });
  const [signupData, setSignupData] = useState({ 
    name: "", 
    email: "", 
    password: "", 
    confirmPassword: "" 
  });
  
  /**
   * Authenticate user with the backend API
   * Makes an HTTPS call to verify username and password
   * Returns JWT token on successful authentication
   */
  const authenticateUser = async (email: string, password: string) => {
    try {
      const authEndpoint = getApiUrl(API_ENDPOINTS.LOGIN);
      
      console.log("🚀 API Call - LOGIN:", {
        url: authEndpoint,
        method: "POST",
        body: { user_id: email, password: "***" },
        timestamp: new Date().toISOString(),
      });

      const authResponse = await fetch(authEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: email,
          password: password,
        }),
      }).catch((error) => {
        // Network error - likely CORS or endpoint not reachable
        console.error("❌ API Error - LOGIN (Network):", {
          url: authEndpoint,
          error: error.message,
          timestamp: new Date().toISOString(),
        });
        return {
          success: false,
          error: "API_CONFIG_ERROR",
          isConfigError: true,
        };
      });

      // If fetch failed, return early
      if (!authResponse || 'isConfigError' in authResponse) {
        return authResponse as { success: false; error: string; isConfigError: true };
      }

      console.log("✅ API Response - LOGIN:", {
        url: authEndpoint,
        status: authResponse.status,
        statusText: authResponse.statusText,
        timestamp: new Date().toISOString(),
      });

      // Check if response is JSON by checking content-type header
      const contentType = authResponse.headers.get("content-type");
      const isJson = contentType && contentType.includes("application/json");

      // Handle specific error codes
      if (authResponse.status === 401) {
        if (isJson) {
          const errorData = await authResponse.json();
          throw new Error(errorData.message || errorData.detail || "Invalid credentials");
        }
        throw new Error("The supplied parameters are incorrect");
      }

      if (authResponse.status === 422) {
        if (isJson) {
          const errorData = await authResponse.json();
          throw new Error(errorData.message || errorData.detail || "Bad request");
        }
        throw new Error("Bad request - missing required fields");
      }

      if (authResponse.status === 404) {
        // Config error - will trigger demo mode
        return {
          success: false,
          error: "API_CONFIG_ERROR",
          isConfigError: true,
        };
      }

      if (authResponse.status >= 500) {
        if (isJson) {
          const errorData = await authResponse.json();
          throw new Error(errorData.message || errorData.detail || "Server error occurred");
        }
        throw new Error("Server error occurred. Please try again later.");
      }

      if (!authResponse.ok) {
        if (isJson) {
          const errorData = await authResponse.json();
          throw new Error(errorData.message || errorData.detail || "Authentication failed");
        }
        throw new Error(`Authentication failed (Status: ${authResponse.status})`);
      }

      // Only try to parse JSON if content-type is JSON
      if (!isJson) {
        // Config error - API returned HTML instead of JSON
        return {
          success: false,
          error: "API_CONFIG_ERROR",
          isConfigError: true,
        };
      }

      const authData = await authResponse.json();

      // Validate that we received a token
      if (!authData.token) {
        throw new Error("No authentication token received from server");
      }

      // Store JWT token, email, and role
      if (loginData.remember) {
        localStorage.setItem("authToken", authData.token);
        localStorage.setItem("userName", email.split('@')[0]);
        localStorage.setItem("userEmail", email);
        localStorage.setItem("userRole", authData.role || "user");
      } else {
        sessionStorage.setItem("authToken", authData.token);
        sessionStorage.setItem("userName", email.split('@')[0]);
        sessionStorage.setItem("userEmail", email);
        sessionStorage.setItem("userRole", authData.role || "user");
      }

      return {
        success: true,
        userName: email.split('@')[0],
        token: authData.token,
        userEmail: email,
        userRole: authData.role || "user",
      };
    } catch (error) {
      // Only log non-config errors
      if (error instanceof Error && error.message !== "API_CONFIG_ERROR") {
        console.error("Authentication error:", error);
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : "Authentication failed",
        isConfigError: false,
      };
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!loginData.email || !loginData.password) {
      toast.error("Please fill in all fields");
      return;
    }
    
    setIsLoading(true);

    // REAL API AUTHENTICATION
    try {
      const result = await authenticateUser(loginData.email, loginData.password);
      
      if (result.success) {
        toast.success("Login successful!");
        onLoginSuccess(result.userName, false, result.userEmail, result.userRole);
      } else {
        // Check if it's a configuration error (HTML response, 404, endpoint not found)
        const isConfigError = result.isConfigError;

        if (isConfigError) {
          // Show user-friendly toast for API connection issues
          toast.error("API Connection Failed", {
            description: "Cannot connect to the backend server. Please check your network connection or try again later."
          });
        } else {
          // Show regular error toast for auth failures
          toast.error(result.error || "Login failed. Please check your credentials.");
        }
      }
    } catch (error) {
      toast.error("An error occurred during login. Please try again.");
      console.error("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!signupData.name || !signupData.email || !signupData.password || !signupData.confirmPassword) {
      toast.error("Please fill in all fields");
      return;
    }
    
    if (signupData.password !== signupData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    
    if (signupData.password.length < 8) {
      toast.error("Password must be at least 8 characters long");
      return;
    }
    
    // Mock signup - in a real app, this would make an API call
    toast.success("Account created successfully!");
    onLoginSuccess(signupData.name);
  };

  return (
    <div className="w-full min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      {/* Common Header */}
      <div className="fixed top-0 left-0 right-0 bg-white shadow-md z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="font-semibold text-center">Automated Logging Solution</h1>
          <p className="text-sm text-gray-600 text-center">Login page</p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center">
        <Card className="w-full max-w-md shadow-lg mt-20">
          <CardHeader className="space-y-1">
            <CardTitle className="text-center">Welcome</CardTitle>
            <CardDescription className="text-center">
              Sign in to your account or create a new one
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
              
              {/* Login Tab */}
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-500" />
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="you@example.com"
                        className="pl-10"
                        value={loginData.email}
                        onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-500" />
                      <Input
                        id="login-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className="pl-10 pr-10"
                        value={loginData.password}
                        onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="remember"
                        checked={loginData.remember}
                        onCheckedChange={(checked) => 
                          setLoginData({ ...loginData, remember: checked as boolean })
                        }
                      />
                      <Label 
                        htmlFor="remember" 
                        className="cursor-pointer"
                      >
                        Remember me
                      </Label>
                    </div>
                    <button
                      type="button"
                      className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                      onClick={() => toast.info("Password reset link would be sent to your email")}
                    >
                      Forgot password?
                    </button>
                  </div>
                  
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Signing In..." : "Sign In"}
                  </Button>
                </form>
              </TabsContent>
              
              {/* Sign Up Tab */}
              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-500" />
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="John Doe"
                        className="pl-10"
                        value={signupData.name}
                        onChange={(e) => setSignupData({ ...signupData, name: e.target.value })}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-500" />
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="you@example.com"
                        className="pl-10"
                        value={signupData.email}
                        onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-500" />
                      <Input
                        id="signup-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className="pl-10 pr-10"
                        value={signupData.password}
                        onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-confirm-password">Confirm Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-500" />
                      <Input
                        id="signup-confirm-password"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className="pl-10 pr-10"
                        value={signupData.confirmPassword}
                        onChange={(e) => setSignupData({ ...signupData, confirmPassword: e.target.value })}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                  </div>
                  
                  <p className="text-xs text-gray-500">
                    By signing up, you agree to our Terms of Service and Privacy Policy
                  </p>
                  
                  <Button type="submit" className="w-full">
                    Create Account
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <div className="w-full max-w-7xl mx-auto mt-6 mb-4">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-center md:text-left">
              <p className="text-sm text-gray-600">
                Copyright © 2025. All rights reserved.
              </p>
            </div>
            <div className="text-center md:text-right">
              <p className="text-sm text-gray-600">
                Contact us: <a href="mailto:support@gmail.com" className="text-blue-600 hover:underline">support@gmail.com</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}