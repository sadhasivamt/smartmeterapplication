import { useState } from "react";
import { useEffect } from "react";
import { AuthPage } from "./components/auth-page";
import { DashboardPage } from "./components/dashboard-page";
import { LabsPage, DeviceInfo } from "./components/labs-page";
import { SetDetailsPage } from "./components/set-details-page";
import { UsersPage } from "./components/users-page";
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
  const [selectedCabinetId, setSelectedCabinetId] = useState<string>("");
  const [selectedManufacture, setSelectedManufacture] = useState("");
  const [selectedVariant, setSelectedVariant] = useState("");
  const [selectedDeviceInfo, setSelectedDeviceInfo] = useState<DeviceInfo[]>([]);
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
      
      const storedPage = (localStorage.getItem("currentPage") || sessionStorage.getItem("currentPage")) as Page;

      // IMPORTANT: Only restore session if we have a valid token AND username
      // For real API mode, we should validate the token is still valid
      if (token && storedUserName) {
        // Restore user state
        setUserName(storedUserName);
        setUserEmail(storedUserEmail || "");
        setUserRole(storedUserRole || "");
        
        // Restore the page user was on, default to dashboard
        if (storedPage && storedPage !== "auth") {
          setCurrentPage(storedPage);
        } else {
          setCurrentPage("dashboard");
        }
      } else {
        // No valid session, clear all auth data and stay on auth page
        localStorage.removeItem("authToken");
        localStorage.removeItem("userName");
        localStorage.removeItem("userEmail");
        localStorage.removeItem("userRole");
        localStorage.removeItem("currentPage");
        sessionStorage.removeItem("authToken");
        sessionStorage.removeItem("userName");
        sessionStorage.removeItem("userEmail");
        sessionStorage.removeItem("userRole");
        sessionStorage.removeItem("currentPage");
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

  const handleLoginSuccess = (name: string, demoMode: boolean = false, email?: string, role?: string) => {
    setUserName(name);
    setUserEmail(email || "");
    setUserRole(role || "");
    setCurrentPage("dashboard");
    
    // Persist user data to storage
    const storage = localStorage.getItem("authToken") ? localStorage : sessionStorage;
    storage.setItem("userName", name);
    if (email) {
      storage.setItem("userEmail", email);
    }
    if (role) {
      storage.setItem("userRole", role);
    }
    storage.setItem("currentPage", "dashboard");
  };

  const handleLogout = async () => {
    // Get the token before clearing
    const token = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");

    // Call the logout API if token exists
    if (token) {
      try {
        const logoutUrl = getApiUrl(API_ENDPOINTS.LOGOUT);
        console.log("🚀 API Call - LOGOUT:", {
          url: logoutUrl,
          method: "GET",
          timestamp: new Date().toISOString(),
        });

        const response = await fetch(logoutUrl, {
          method: "GET",
          headers: getAuthHeaders(token),
        });

        console.log("✅ API Response - LOGOUT:", {
          url: logoutUrl,
          status: response.status,
          statusText: response.statusText,
          timestamp: new Date().toISOString(),
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
    setUserRole("");
    setSelectedLab(0);
    setSelectedLabId("");
    setSelectedCabinetId("");
    setSelectedManufacture("");
    localStorage.removeItem("authToken");
    sessionStorage.removeItem("authToken");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userRoles"); // Clear roles array
    localStorage.removeItem("userName");
    sessionStorage.removeItem("userName");
    sessionStorage.removeItem("userEmail");
    sessionStorage.removeItem("userRole");
    sessionStorage.removeItem("userRoles"); // Clear roles array
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

  const handleSelectSet = (labId: string, labNumber: number, cabinetId: string, manufacture: string, variant: string, deviceInfo: DeviceInfo[]) => {
    setSelectedLabId(labId);
    setSelectedLab(labNumber);
    setSelectedCabinetId(cabinetId);
    setSelectedManufacture(manufacture);
    setSelectedVariant(variant);
    setSelectedDeviceInfo(deviceInfo);
    setCurrentPage("setDetails");
  };

  const handleBackToLabs = () => {
    setCurrentPage("labs");
  };

  const handleBackToDashboard = () => {
    setCurrentPage("dashboard");
  };

  return (
    <>
      {currentPage === "auth" && (
        <AuthPage onLoginSuccess={handleLoginSuccess} />
      )}

      {currentPage === "dashboard" && (
        <DashboardPage
          onLogout={handleLogout}
          userName={userName}
          onNavigateToLabs={handleNavigateToLabs}
          onNavigate={handleNavigate}
          userRole={userRole}
        />
      )}
      
      {currentPage === "labs" && (
        <LabsPage
          onLogout={handleLogout}
          userName={userName}
          onSelectSet={handleSelectSet}
          onNavigateToDashboard={handleBackToDashboard}
          onNavigate={handleNavigate}
          userRole={userRole}
        />
      )}
      
      {currentPage === "setDetails" && (
        <SetDetailsPage
          labId={selectedLabId}
          labNumber={selectedLab}
          cabinetId={selectedCabinetId}
          manufacture={selectedManufacture}
          variant={selectedVariant}
          deviceInfo={selectedDeviceInfo}
          onBack={handleBackToLabs}
          onBackToDashboard={handleBackToDashboard}
          userName={userName}
          onLogout={handleLogout}
          onNavigateToLabs={handleNavigateToLabs}
          onNavigate={handleNavigate}
          userRole={userRole}
        />
      )}

      {currentPage === "admin" && (
        <UsersPage
          userName={userName}
          userEmail={userEmail}
          userRole={userRole}
          onLogout={handleLogout}
          onNavigate={handleNavigate}
        />
      )}
      
      <Toaster />
    </>
  );
}