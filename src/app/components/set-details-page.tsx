import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Checkbox } from "./ui/checkbox";
import { ArrowLeft, Download, Cpu, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { NavigationPane } from "./navigation-pane";
import { cn } from "../lib/utils";
import { API_ENDPOINTS, getApiUrl, getAuthHeaders } from "../../config/api";

interface SetDetailsPageProps {
  labId: string;
  labNumber: number;
  setNumber: number;
  manufacture: string;
  onBack: () => void;
  onBackToDashboard: () => void;
  userName: string;
  onLogout: () => void;
  onNavigateToLabs: () => void;
  onNavigate: (page: "dashboard" | "labs" | "admin") => void;
  isDemoMode?: boolean;
}

// Type definitions for API response
interface DeviceInventory {
  lab_id: string;
  cabinet_id: string;
  host_name: string;
  host_ip: string;
  ch_type: string;
  is_active: boolean;
}

type DeviceType = "CH" | "ESME" | "PPMID" | "GSME";

export function SetDetailsPage({ labId, labNumber, setNumber, manufacture, onBack, onBackToDashboard, userName, onLogout, onNavigateToLabs, onNavigate, isDemoMode }: SetDetailsPageProps) {
  const [taskDescription, setTaskDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");
  const [logTypes, setLogTypes] = useState({
    CH: false,
    HAN: false,
  });
  const [hanLogFormat, setHanLogFormat] = useState<string>("");

  const devices: DeviceType[] = ["CH", "ESME", "PPMID", "GSME"];

  // Format date and time to API format: "2023-09-28 19:04:35+0000"
  const formatDateTime = (date: string, time: string): string => {
    // Input: date = "2023-09-28", time = "19:04"
    // Output: "2023-09-28 19:04:35+0000"
    return `${date} ${time}:00+0000`;
  };

  // Get current date in YYYY-MM-DD format
  const getCurrentDate = (): string => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Get current time in HH:MM format
  const getCurrentTime = (): string => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const maxDate = getCurrentDate();
  const maxTime = getCurrentTime();

  const validateDates = (): boolean => {
    if (!startDate || !startTime || !endDate || !endTime) {
      toast.error("Please select both start and end date/time");
      return false;
    }

    const startDateTime = new Date(`${startDate}T${startTime}`);
    const endDateTime = new Date(`${endDate}T${endTime}`);
    const now = new Date();

    // Check if dates are in the future
    if (startDateTime > now) {
      toast.error("Start date and time cannot be in the future");
      return false;
    }

    if (endDateTime > now) {
      toast.error("End date and time cannot be in the future");
      return false;
    }

    // Check if start date is less than end date
    if (startDateTime >= endDateTime) {
      toast.error("Start date and time must be less than end date and time");
      return false;
    }

    return true;
  };

  const handleRetrieveLogs = async () => {
    if (!taskDescription.trim()) {
      toast.error("Please enter a task description");
      return;
    }

    if (taskDescription.trim().length < 5) {
      toast.error("Task description must be at least 5 characters long");
      return;
    }

    if (!validateDates()) {
      return;
    }

    if (!logTypes.CH && !logTypes.HAN) {
      toast.error("Please select at least one log type");
      return;
    }

    // Validate HAN log format if HAN is selected
    if (logTypes.HAN && !hanLogFormat) {
      toast.error("Please select a log format for HAN Logs");
      return;
    }

    // If in demo mode, simulate successful submission
    if (isDemoMode) {
      // Generate unique transaction ID
      const transactionId = generateTransactionId();

      // Format dates to API format
      const formattedStartTime = formatDateTime(startDate, startTime);
      const formattedStopTime = formatDateTime(endDate, endTime);

      // Create a new log collection entry
      const newLogEntry = {
        lab_id: labId,
        cabinet_id: `a${String(setNumber).padStart(2, '0')}`,
        manufacture: manufacture,
        transaction_id: transactionId,
        log_collection_status: "Processing",
        log_collection_status_code: 105,
        start_time: formattedStartTime,
        end_time: formattedStopTime,
        submitted_time: formatDateTime(getCurrentDate(), getCurrentTime()),
        task_desc: taskDescription.trim(),
      };

      // Store the new log entry in localStorage to be picked up by the dashboard
      const existingEntries = JSON.parse(localStorage.getItem("pending_log_collections") || "[]");
      existingEntries.push(newLogEntry);
      localStorage.setItem("pending_log_collections", JSON.stringify(existingEntries));

      toast.success("Log collection request submitted successfully! (Demo Mode)");
      setTimeout(() => {
        onBackToDashboard();
      }, 2000);
      return;
    }

    try {
      const token = getAuthToken();
      
      if (!token) {
        toast.error("Authentication token not found. Please login again.");
        return;
      }

      // Generate unique transaction ID
      const transactionId = generateTransactionId();

      // Format dates to API format
      const formattedStartTime = formatDateTime(startDate, startTime);
      const formattedStopTime = formatDateTime(endDate, endTime);

      // Build log_types array based on selected checkboxes
      const selectedLogTypes: string[] = [];
      if (logTypes.CH) {
        selectedLogTypes.push("ch");
      }
      if (logTypes.HAN) {
        selectedLogTypes.push("han");
      }

      // Prepare request payload
      const requestPayload: any = {
        transaction_id: transactionId,
        lab_id: labId,
        cabinet_id: `a${String(setNumber).padStart(2, '0')}`, // Format: a01, a02, etc.
        start_time: formattedStartTime,
        stop_time: formattedStopTime,
        task_desc: taskDescription.trim(),
        log_types: selectedLogTypes,
      };

      // Add log_format only if HAN is selected
      if (logTypes.HAN && hanLogFormat) {
        requestPayload.log_format = hanLogFormat;
      }

      // Make API call
      const response = await fetch(getApiUrl(API_ENDPOINTS.START_LOG_COLLECTION), {
        method: "POST",
        headers: getAuthHeaders(token),
        body: JSON.stringify(requestPayload),
      });

      // Check if response is JSON by checking content-type header
      const contentType = response.headers.get("content-type");
      const isJson = contentType && contentType.includes("application/json");

      // Handle specific error codes
      if (response.status === 401) {
        if (isJson) {
          const errorData = await response.json();
          throw new Error(errorData.message || errorData.detail || "Unauthorized - Please login again");
        }
        throw new Error("Invalid or missing token");
      }

      if (response.status === 404) {
        throw new Error("Log collection endpoint not found. Please check your API configuration.");
      }

      if (response.status >= 500 || response.status === 400) {
        if (isJson) {
          const errorData = await response.json();
          throw new Error(errorData.detail || errorData.message || "API error occurred");
        }
        throw new Error("Server error occurred. Please try again later.");
      }

      if (!response.ok) {
        if (isJson) {
          const errorData = await response.json();
          throw new Error(errorData.message || errorData.detail || "Failed to submit log collection request");
        }
        throw new Error(`Failed to submit log collection request (Status: ${response.status})`);
      }

      // Only try to parse JSON if content-type is JSON
      if (!isJson) {
        throw new Error("Invalid response from server. Expected JSON but received HTML.");
      }

      // Success - optionally parse response if needed
      await response.json().catch(() => ({})); // Parse but ignore response data
      
      toast.success("Log collection request submitted successfully!");
      
      // Navigate back to dashboard after 2 seconds
      setTimeout(() => {
        onBackToDashboard();
      }, 2000);
    } catch (error) {
      console.error("Error submitting log collection:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to submit log collection request";
      toast.error(errorMessage);
    }
  };

  // State to hold device inventory
  const [deviceInventory, setDeviceInventory] = useState<DeviceInventory[]>([]);
  const [loading, setLoading] = useState(true);

  // Get authentication token from storage
  const getAuthToken = (): string | null => {
    return localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
  };

  // Generate unique transaction ID
  const generateTransactionId = (): string => {
    return crypto.randomUUID();
  };

  // Fetch device inventory from API when component mounts
  useEffect(() => {
    fetchDeviceInventory();
  }, [labId, manufacture]);

  const fetchDeviceInventory = async () => {
    setLoading(true);
    
    // If in demo mode, use mock data
    if (isDemoMode) {
      setTimeout(() => {
        const mockInventory: DeviceInventory[] = devices.map((device, i) => ({
          lab_id: labId,
          cabinet_id: `a${String(setNumber).padStart(2, '0')}`,
          host_name: `${device}-host-${i + 1}`,
          host_ip: `192.168.1.${100 + i}`,
          ch_type: manufacture,
          is_active: true,
        }));
        setDeviceInventory(mockInventory);
        setLoading(false);
        toast.success("Device inventory loaded (Demo Mode)");
      }, 500);
      return;
    }
    
    try {
      const token = getAuthToken();
      
      if (!token) {
        toast.error("Authentication token not found. Please login again.");
        setLoading(false);
        return;
      }

      // Build URL with query parameters
      const url = getApiUrl(API_ENDPOINTS.DEVICE_INVENTORY, { lab_id: labId });

      const response = await fetch(url, {
        method: "POST",
        headers: getAuthHeaders(token),
        body: JSON.stringify({
          lab_id: labId,
          ch_type: manufacture,
        }),
      });

      // Check if response is JSON by checking content-type header
      const contentType = response.headers.get("content-type");
      const isJson = contentType && contentType.includes("application/json");

      // Handle specific error codes
      if (response.status === 401) {
        if (isJson) {
          const errorData = await response.json();
          throw new Error(errorData.message || errorData.detail || "Unauthorized - Please login again");
        }
        throw new Error("Invalid or missing token");
      }

      if (response.status === 404) {
        throw new Error("Device inventory endpoint not found. Please check your API configuration.");
      }

      if (response.status >= 500 || response.status === 400) {
        if (isJson) {
          const errorData = await response.json();
          throw new Error(errorData.detail || errorData.message || "API error occurred");
        }
        throw new Error("Server error occurred. Please try again later.");
      }

      if (!response.ok) {
        if (isJson) {
          const errorData = await response.json();
          throw new Error(errorData.message || errorData.detail || "Failed to fetch device inventory");
        }
        throw new Error(`Failed to fetch device inventory (Status: ${response.status})`);
      }

      // Only try to parse JSON if content-type is JSON
      if (!isJson) {
        throw new Error("Invalid response from server. Expected JSON but received HTML.");
      }

      const data: DeviceInventory[] = await response.json();
      setDeviceInventory(data);
      toast.success("Device inventory loaded successfully");
    } catch (error) {
      console.error("Error fetching device inventory:", error);
      const errorMessage = error instanceof Error ? error.message : "Error fetching device inventory";
      toast.error(errorMessage);
      setDeviceInventory([]);
    } finally {
      setLoading(false);
    }
  };

  const handleNavigate = (page: "dashboard" | "labs" | "admin") => {
    onNavigate(page);
  };

  return (
    <>
      {/* Navigation Pane */}
      <NavigationPane
        currentPage="set-details"
        userName={userName}
        onNavigate={handleNavigate}
        onLogout={onLogout}
      />

      {/* Main Content with margin for navigation */}
      <div className="ml-[156px] transition-all duration-300">
        <div className="w-full min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
          {/* Common Header */}
          <div className="fixed top-0 left-[156px] right-4 bg-white shadow-md z-10 py-3 rounded-br-lg">
            <div className="max-w-7xl mx-auto px-4">
              <h1 className="font-semibold text-center">Automated Logging Solution</h1>
              <p className="text-sm text-gray-600 text-center">Logs Details and Download</p>
            </div>
          </div>

          {/* Back Button and Lab/Set Info */}
          <div className="max-w-6xl mx-auto mb-6 mt-20">
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center gap-4">
                <Button variant="ghost" onClick={onBack} className="gap-2">
                  <ArrowLeft className="size-4" />
                  Back
                </Button>
                <div className="flex-1">
                  <p className="text-sm text-gray-500">
                    Lab {labNumber} - Set {setNumber}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Set Details - Show all devices */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Set Details</CardTitle>
                <CardDescription>All devices in this set</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center items-center h-48">
                    <Loader2 className="size-8 animate-spin text-blue-600" />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {devices.map((device) => (
                      <div
                        key={device}
                        className="p-6 rounded-lg border-2 border-blue-600 bg-blue-50"
                      >
                        <div className="flex flex-col items-center gap-3">
                          <Cpu className="size-8 text-blue-600" />
                          <span className="font-semibold">{device}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Date/Time Selection */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Select Date and Time Range</CardTitle>
                <CardDescription>
                  Choose the time period for log retrieval (future dates not allowed)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Task Description */}
                <div className="space-y-2">
                  <Label htmlFor="task-description">
                    Task Description <span className="text-red-600">*</span>
                  </Label>
                  <input
                    id="task-description"
                    type="text"
                    placeholder="Enter task description"
                    value={taskDescription}
                    onChange={(e) => setTaskDescription(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Start Date/Time */}
                  <div className="space-y-2">
                    <Label htmlFor="start-date">Start Date</Label>
                    <input
                      id="start-date"
                      type="date"
                      max={maxDate}
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="start-time">Start Time</Label>
                    <input
                      id="start-time"
                      type="time"
                      max={maxTime}
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>

                  {/* End Date/Time */}
                  <div className="space-y-2">
                    <Label htmlFor="end-date">End Date</Label>
                    <input
                      id="end-date"
                      type="date"
                      min={startDate || undefined}
                      max={maxDate}
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="end-time">End Time</Label>
                    <input
                      id="end-time"
                      type="time"
                      max={maxTime}
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>
                </div>

                {/* Log Type Selection */}
                {startDate && startTime && endDate && endTime && (
                  <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                    <Label>Log Type</Label>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="ch-logs"
                        checked={logTypes.CH}
                        onCheckedChange={(checked) => setLogTypes({ ...logTypes, CH: checked as boolean })}
                      />
                      <Label htmlFor="ch-logs" className="cursor-pointer font-normal">
                        CH Logs
                      </Label>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="han-logs"
                          checked={logTypes.HAN}
                          onCheckedChange={(checked) => {
                            setLogTypes({ ...logTypes, HAN: checked as boolean });
                            if (!checked) {
                              setHanLogFormat("");
                            }
                          }}
                        />
                        <Label htmlFor="han-logs" className="cursor-pointer font-normal">
                          HAN Logs
                        </Label>
                      </div>
                      
                      {/* HAN Log Format Dropdown - Shows when HAN is selected */}
                      {logTypes.HAN && (
                        <div className="ml-6 space-y-2">
                          <Label htmlFor="han-log-format" className="text-sm">
                            Log Format <span className="text-red-600">*</span>
                          </Label>
                          <select
                            id="han-log-format"
                            value={hanLogFormat}
                            onChange={(e) => setHanLogFormat(e.target.value)}
                            className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <option value="">Select log format</option>
                            <option value=".pcap">.pcap</option>
                            <option value=".dcf">.dcf</option>
                            <option value=".cubx">.cubx</option>
                          </select>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Retrieve Button */}
                {startDate && startTime && endDate && endTime && (logTypes.CH || logTypes.HAN) && (
                  <Button
                    onClick={handleRetrieveLogs}
                    className="w-full gap-2"
                    size="lg"
                  >
                    <Download className="size-4" />
                    Retrieve Log Collection
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Selection Summary */}
            {startDate && startTime && endDate && endTime && (
              <Card className="shadow-lg bg-blue-50 border-blue-200">
                <CardHeader>
                  <CardTitle className="text-sm">Current Selection Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {startDate && startTime && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Start:</span>
                      <Badge variant="secondary">
                        {new Date(`${startDate}T${startTime}`).toLocaleString()}
                      </Badge>
                    </div>
                  )}
                  {endDate && endTime && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">End:</span>
                      <Badge variant="secondary">
                        {new Date(`${endDate}T${endTime}`).toLocaleString()}
                      </Badge>
                    </div>
                  )}
                  {logTypes.CH && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Log Type:</span>
                      <Badge variant="outline">CH Logs</Badge>
                    </div>
                  )}
                  {logTypes.HAN && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Log Type:</span>
                      <Badge variant="outline">HAN Logs</Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Footer */}
          <div className="max-w-6xl mx-auto mt-6 mb-4">
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
      </div>
    </>
  );
}