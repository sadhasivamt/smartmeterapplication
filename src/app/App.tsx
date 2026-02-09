import { useState } from "react";
import { useEffect } from "react";
import { AuthPage } from "./components/auth-page";
import { DashboardPage } from "./components/dashboard-page";
import { LabsPage } from "./components/labs-page";
import { SetDetailsPage } from "./components/set-details-page";
import { UsersPage } from "./components/users-page";
import { DemoModeBanner } from "./components/demo-mode-banner";
import { ApiConfigDialog } from "./components/api-config-dialog";
import { Toaster } from "./components/ui/sonner";
import { toast } from "sonner";
import { API_ENDPOINTS, getApiUrl, getAuthHeaders } from "../config/api";

type Page = "auth" | "dashboard" | "labs" | "setDetails" | "admin";

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>("auth");
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userRole, setUserRole] = useState("");
  const [selectedLab, setSelectedLab] = useState<number>(0);
  const [selectedLabId, setSelectedLabId] = useState<string>("");
  const [selectedSet, setSelectedSet] = useState<number>(0);
  const [selectedManufacture, setSelectedManufacture] = useState("");
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Set page title
  document.title = "Automated Logging Solution";

  /**
   * Check for existing authentication on app load
   */
  useEffect(() => {
    const restoreAuthState = () => {
      // Check for auth token in storage
      const token = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
      const storedUserName = localStorage.getItem("userName") || sessionStorage.getItem("userName");
      const storedUserEmail = localStorage.getItem("userEmail") || sessionStorage.getItem("userEmail");
      const storedUserRole = localStorage.getItem("userRole") || sessionStorage.getItem("userRole");
      const storedDemoMode = localStorage.getItem("demoMode") === "true";
      const storedPage = (localStorage.getItem("currentPage") || sessionStorage.getItem("currentPage")) as Page;

      if (token && storedUserName) {
        // Restore user state
        setUserName(storedUserName);
        setUserEmail(storedUserEmail || "");
        setUserRole(storedUserRole || "");
        setIsDemoMode(storedDemoMode);
        
        // Restore the page user was on, default to dashboard
        if (storedPage && storedPage !== "auth") {
          setCurrentPage(storedPage);
        } else {
          setCurrentPage("dashboard");
        }
      } else {
        // No valid session, stay on auth page
        setCurrentPage("auth");
      }

      setIsCheckingAuth(false);
    };

    restoreAuthState();
  }, []);

  /**
   * Save current page to storage whenever it changes
   */
  useEffect(() => {
    if (!isCheckingAuth && currentPage !== "auth") {
      // Save to both localStorage and sessionStorage for redundancy
      const token = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
      if (token) {
        if (localStorage.getItem("authToken")) {
          localStorage.setItem("currentPage", currentPage);
        }
        if (sessionStorage.getItem("authToken")) {
          sessionStorage.setItem("currentPage", currentPage);
        }
      }
    }
  }, [currentPage, isCheckingAuth]);

  const handleLoginSuccess = (name: string, demoMode: boolean = false) => {
    setUserName(name);
    setIsDemoMode(demoMode);
    setCurrentPage("dashboard");
    
    // Persist user data to storage
    const storage = localStorage.getItem("authToken") ? localStorage : sessionStorage;
    storage.setItem("userName", name);
    storage.setItem("currentPage", "dashboard");
    if (demoMode) {
      storage.setItem("demoMode", "true");
    }
  };

  const handleLogout = async () => {
    // Get the current demo mode status before clearing
    const currentDemoMode = isDemoMode;
    
    // If in demo mode, skip API call and just clear session
    if (currentDemoMode) {
      setCurrentPage("auth");
      setUserName("");
      setUserEmail("");
      setSelectedLab(0);
      setSelectedLabId("");
      setSelectedSet(0);
      setSelectedManufacture("");
      setIsDemoMode(false);
      localStorage.removeItem("authToken");
      sessionStorage.removeItem("authToken");
      localStorage.removeItem("demoMode");
      localStorage.removeItem("userEmail");
      localStorage.removeItem("userName");
      sessionStorage.removeItem("userName");
      localStorage.removeItem("currentPage");
      sessionStorage.removeItem("currentPage");
      toast.success("Logged out successfully (Demo Mode)");
      return;
    }

    // Get the token before clearing
    const token = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");

    // Call the logout API if token exists
    if (token) {
      try {
        const response = await fetch(getApiUrl(API_ENDPOINTS.LOGOUT), {
          method: "GET",
          headers: getAuthHeaders(token),
        });

        // Check if response is JSON
        const contentType = response.headers.get("content-type");
        const isJson = contentType && contentType.includes("application/json");

        // Handle successful logout (200)
        if (response.status === 200) {
          if (isJson) {
            const data = await response.json();
            toast.success(data.message || "Logout successful");
          } else {
            toast.success("Logout successful");
          }
        } else if (response.status === 401) {
          // Token might be expired, still logout locally
          if (isJson) {
            const errorData = await response.json();
            console.warn("Logout API returned 401:", errorData.message || errorData.detail);
          }
          toast.info("Session expired. Logged out locally.");
        } else if (response.status === 404) {
          // Endpoint not found, still logout locally
          console.warn("Logout endpoint not found, logging out locally");
          toast.info("Logged out locally");
        } else if (response.status === 422) {
          // Invalid parameters, still logout locally
          if (isJson) {
            const errorData = await response.json();
            console.warn("Logout API returned 422:", errorData.detail);
          }
          toast.info("Logged out locally");
        } else if (response.status >= 500 || response.status === 400) {
          // Server error, still logout locally
          if (isJson) {
            const errorData = await response.json();
            console.warn("Logout API error:", errorData.detail || errorData.message);
          }
          toast.info("Logged out locally (server error)");
        } else {
          // Any other error, still logout locally
          console.warn(`Logout API returned status ${response.status}`);
          toast.info("Logged out locally");
        }
      } catch (error) {
        // Network error or other exception, still logout locally
        console.error("Error calling logout API:", error);
        toast.info("Logged out locally (network error)");
      }
    }

    // Always clear the session regardless of API response
    setCurrentPage("auth");
    setUserName("");
    setUserEmail("");
    setSelectedLab(0);
    setSelectedLabId("");
    setSelectedSet(0);
    setSelectedManufacture("");
    setIsDemoMode(false);
    localStorage.removeItem("authToken");
    sessionStorage.removeItem("authToken");
    localStorage.removeItem("demoMode");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userName");
    sessionStorage.removeItem("userName");
    localStorage.removeItem("currentPage");
    sessionStorage.removeItem("currentPage");
  };

  const handleNavigateToLabs = () => {
    setCurrentPage("labs");
  };

  const handleNavigateToAdmin = () => {
    setCurrentPage("admin");
  };

  const handleNavigate = (page: "dashboard" | "labs" | "admin") => {
    setCurrentPage(page);
  };

  const handleSelectSet = (labId: string, labNumber: number, setNumber: number, manufacture: string) => {
    setSelectedLabId(labId);
    setSelectedLab(labNumber);
    setSelectedSet(setNumber);
    setSelectedManufacture(manufacture);
    setCurrentPage("setDetails");
  };

  const handleBackToLabs = () => {
    setCurrentPage("labs");
  };

  const handleBackToDashboard = () => {
    setCurrentPage("dashboard");
  };

  const handleExitDemoMode = () => {
    setShowConfigDialog(true);
  };

  const handleCloseConfigDialog = () => {
    setShowConfigDialog(false);
  };

  return (
    <>
      {/* Demo Mode Banner - Hidden per user request */}
      {/* {isDemoMode && currentPage !== "auth" && (
        <DemoModeBanner onExitDemo={handleExitDemoMode} />
      )} */}

      {currentPage === "auth" && (
        <AuthPage onLoginSuccess={handleLoginSuccess} />
      )}

      {currentPage === "dashboard" && (
        <DashboardPage
          onLogout={handleLogout}
          userName={userName}
          onNavigateToLabs={handleNavigateToLabs}
          onNavigate={handleNavigate}
          isDemoMode={isDemoMode}
        />
      )}
      
      {currentPage === "labs" && (
        <LabsPage
          onLogout={handleLogout}
          userName={userName}
          onSelectSet={handleSelectSet}
          onNavigateToDashboard={handleBackToDashboard}
          onNavigate={handleNavigate}
          isDemoMode={isDemoMode}
        />
      )}
      
      {currentPage === "setDetails" && (
        <SetDetailsPage
          labId={selectedLabId}
          labNumber={selectedLab}
          setNumber={selectedSet}
          manufacture={selectedManufacture}
          onBack={handleBackToLabs}
          onBackToDashboard={handleBackToDashboard}
          userName={userName}
          onLogout={handleLogout}
          onNavigateToLabs={handleNavigateToLabs}
          onNavigate={handleNavigate}
          isDemoMode={isDemoMode}
        />
      )}

      {currentPage === "admin" && (
        <UsersPage
          userName={userName}
          userEmail={userEmail}
          userRole={userRole}
          onLogout={handleLogout}
          onNavigate={handleNavigate}
          isDemoMode={isDemoMode}
        />
      )}
      
      {/* Config Dialog when exiting demo mode */}
      <ApiConfigDialog
        isOpen={showConfigDialog}
        onClose={handleCloseConfigDialog}
        endpoint="/log-auth/login"
        errorMessage="Demo Mode is currently active. To connect to your real API, please configure your API endpoint using one of the options below."
      />
      
      <Toaster />
    </>
  );
}