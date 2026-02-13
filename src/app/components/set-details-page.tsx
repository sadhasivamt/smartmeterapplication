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
import { DeviceInfo } from "./labs-page";

interface SetDetailsPageProps {
  labId: string;
  labNumber: number;
  cabinetId: string;
  manufacture: string;
  variant: string;
  deviceInfo: DeviceInfo[];
  isActiveSet: boolean; // New parameter to check if set is active
  onBack: () => void;
  onBackToDashboard: () => void;
  userName: string;
  onLogout: () => void;
  onNavigateToLabs: () => void;
  onNavigate: (page: "dashboard" | "labs" | "admin") => void;
  userRole?: string;
}

type DeviceType = "CHF" | "ESME" | "PPMID" | "GSME" | "GPF";

export function SetDetailsPage({ labId, labNumber, cabinetId, manufacture, variant, deviceInfo, isActiveSet, onBack, onBackToDashboard, userName, onLogout, onNavigateToLabs, onNavigate, userRole }: SetDetailsPageProps) {
  const [taskDescription, setTaskDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");
  const [logTypes, setLogTypes] = useState({
    CH: false,
    HAN: false,
  });
  const [chLogFormat, setChLogFormat] = useState<string>("");
  const [hanLogFormat, setHanLogFormat] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false); // Loading state for button

  const devices: DeviceType[] = ["CHF", "ESME", "PPMID", "GSME", "GPF"];

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

    // Set loading state before API call
    setIsSubmitting(true);

    try {
      const token = getAuthToken();
      
      if (!token) {
        toast.error("Authentication token not found. Please login again.");
        setIsSubmitting(false); // Reset on error
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
        selectedLogTypes.push("zigbee");
      }

      // Prepare request payload
      const requestPayload: any = {
        transaction_id: transactionId,
        lab_id: labId,
        cabinet_id: cabinetId,
        start_time: formattedStartTime,
        stop_time: formattedStopTime,
        task_description: taskDescription.trim(),
        log_types: selectedLogTypes
      };

      // Add log_format only if HAN is selected and has a format
      // If both CH and HAN are selected, HAN log format takes priority
      // If only CH is selected and has a format, use CH log format (optional)
      if (logTypes.HAN && hanLogFormat) {
        requestPayload.log_format = hanLogFormat;
      } else if (logTypes.CH && chLogFormat) {
        requestPayload.log_format = chLogFormat;
      }

      const startLogCollectionUrl = getApiUrl(API_ENDPOINTS.START_LOG_COLLECTION);
      
      console.log("🚀 API Call - POST START_LOG_COLLECTION:", {
        url: startLogCollectionUrl,
        method: "POST",
        body: requestPayload,
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer [REDACTED]",
        },
        timestamp: new Date().toISOString(),
      });

      // Make API call
      const response = await fetch(startLogCollectionUrl, {
        method: "POST",
        headers: getAuthHeaders(token),
        body: JSON.stringify(requestPayload),
      });

      console.log("✅ API Response - POST START_LOG_COLLECTION:", {
        url: startLogCollectionUrl,
        status: response.status,
        statusText: response.statusText,
        headers: {
          "content-type": response.headers.get("content-type"),
        },
        timestamp: new Date().toISOString(),
      });

      // Check if response is JSON by checking content-type header
      const contentType = response.headers.get("content-type");
      const isJson = contentType && contentType.includes("application/json");

      // Handle specific error codes
      if (response.status === 401) {
        if (isJson) {
          const errorData = await response.json();
          console.error("❌ API Error - START_LOG_COLLECTION (401 Unauthorized):", {
            url: startLogCollectionUrl,
            status: 401,
            errorData: errorData,
            timestamp: new Date().toISOString(),
          });
          throw new Error(errorData.message || errorData.detail || "Unauthorized - Please login again");
        }
        console.error("❌ API Error - START_LOG_COLLECTION (401 Unauthorized):", {
          url: startLogCollectionUrl,
          status: 401,
          error: "Invalid or missing token",
          timestamp: new Date().toISOString(),
        });
        throw new Error("Invalid or missing token");
      }

      if (response.status === 404) {
        console.error("❌ API Error - START_LOG_COLLECTION (404 Not Found):", {
          url: startLogCollectionUrl,
          status: 404,
          error: "Endpoint not found",
          timestamp: new Date().toISOString(),
        });
        throw new Error("Log collection endpoint not found. Please check your API configuration.");
      }

      if (response.status >= 500 || response.status === 400) {
        if (isJson) {
          const errorData = await response.json();
          console.error("❌ API Error - START_LOG_COLLECTION (Server Error):", {
            url: startLogCollectionUrl,
            status: response.status,
            errorData: errorData,
            timestamp: new Date().toISOString(),
          });
          throw new Error(errorData.detail || errorData.message || "API error occurred");
        }
        console.error("❌ API Error - START_LOG_COLLECTION (Server Error):", {
          url: startLogCollectionUrl,
          status: response.status,
          error: "Server error occurred",
          timestamp: new Date().toISOString(),
        });
        throw new Error("Server error occurred. Please try again later.");
      }

      if (!response.ok) {
        if (isJson) {
          const errorData = await response.json();
          console.error("❌ API Error - START_LOG_COLLECTION (Request Failed):", {
            url: startLogCollectionUrl,
            status: response.status,
            errorData: errorData,
            timestamp: new Date().toISOString(),
          });
          throw new Error(errorData.message || errorData.detail || "Failed to submit log collection request");
        }
        console.error("❌ API Error - START_LOG_COLLECTION (Request Failed):", {
          url: startLogCollectionUrl,
          status: response.status,
          error: `Failed to submit request (Status: ${response.status})`,
          timestamp: new Date().toISOString(),
        });
        throw new Error(`Failed to submit log collection request (Status: ${response.status})`);
      }

      // Only try to parse JSON if content-type is JSON
      if (!isJson) {
        console.error("❌ API Error - START_LOG_COLLECTION (Invalid Response):", {
          url: startLogCollectionUrl,
          status: response.status,
          error: "Expected JSON but received HTML",
          contentType: contentType,
          timestamp: new Date().toISOString(),
        });
        throw new Error("Invalid response from server. Expected JSON but received HTML.");
      }

      // Success - parse response data
      const responseData = await response.json().catch(() => ({}));
      
      console.log("🎉 API Success - START_LOG_COLLECTION:", {
        url: startLogCollectionUrl,
        status: response.status,
        responseData: responseData,
        transactionId: transactionId,
        timestamp: new Date().toISOString(),
      });
      
      toast.success("Log collection request submitted successfully!");
      
      // Navigate back to dashboard after 2 seconds
      setTimeout(() => {
        onBackToDashboard();
      }, 2000);
    } catch (error) {
      console.error("Error submitting log collection:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to submit log collection request";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false); // Reset loading state
    }
  };

  // State to hold device inventory
  const [deviceInventory, setDeviceInventory] = useState<DeviceInfo[]>([]);
  const [loading, setLoading] = useState(true);

  // Get authentication token from storage
  const getAuthToken = (): string | null => {
    return localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
  };

  // Generate unique transaction ID
  const generateTransactionId = (): string => {
    return crypto.randomUUID();
  };

  /**
   * Use device information passed from labs page
   */
  useEffect(() => {
    console.log("🔧 Device Info Received in Set Details:", {
      deviceInfo: deviceInfo,
      deviceCount: deviceInfo.length,
      deviceTypes: deviceInfo.map(d => d.device_type),
      timestamp: new Date().toISOString(),
    });

    // Set device inventory from passed props
    setDeviceInventory(deviceInfo);
    setLoading(false);

    if (deviceInfo.length === 0) {
      toast.info("No devices found for this cabinet");
    }
  }, [deviceInfo]);

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
        userRole={userRole}
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

          {/* Back Button and Lab/Cabinet Info */}
          <div className="max-w-6xl mx-auto mb-6 mt-20">
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center gap-4">
                <Button variant="ghost" onClick={onBack} className="gap-2">
                  <ArrowLeft className="size-4" />
                  Back
                </Button>
                <div className="flex-1">
                  <p className="text-sm text-gray-500">
                    Lab {labNumber} - Cabinet {cabinetId.toUpperCase()}
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
                  <>
                    {/* Inactive Set Warning Message */}
                    {!isActiveSet && (
                      <div className="mb-4 p-4 bg-gray-100 border-2 border-gray-400 rounded-lg">
                        <p className="text-sm text-gray-700 font-medium">
                          ⚠️ This cabinet is inactive. Log retrieval is not available for inactive cabinets.
                        </p>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {deviceInventory.map((device, index) => (
                        <div
                          key={index}
                          className="p-4 rounded-lg border-2 border-blue-600 bg-blue-50"
                        >
                          <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-3">
                              <Cpu className="size-8 text-blue-600 flex-shrink-0" />
                              <span className="font-semibold text-lg">{device.device_type || device.host_name.split('-')[0]}</span>
                            </div>
                            <div className="space-y-1.5 text-sm">
                              {device.manufacturer && (
                                <div>
                                  <span className="text-gray-600">Manufacturer:</span>
                                  <p className="font-medium text-gray-900">{device.manufacturer}</p>
                                </div>
                              )}
                              {device.guid && (
                                <div>
                                  <span className="text-gray-600">GUID:</span>
                                  <p className="font-medium text-gray-900 break-all">{device.guid}</p>
                                </div>
                              )}
                              {device.device_state && (
                                <div>
                                  <span className="text-gray-600">Device State:</span>
                                  <p className="font-medium text-gray-900">{device.device_state}</p>
                                </div>
                              )}
                              {device.device_model && (
                                <div>
                                  <span className="text-gray-600">Device Model:</span>
                                  <p className="font-medium text-gray-900">{device.device_model}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Date/Time Selection - Only show for active sets */}
            {isActiveSet && (
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
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="ch-logs"
                            checked={logTypes.CH}
                            onCheckedChange={(checked) => {
                              setLogTypes({ ...logTypes, CH: checked as boolean });
                              if (!checked) {
                                setChLogFormat("");
                              }
                            }}
                          />
                          <Label htmlFor="ch-logs" className="cursor-pointer font-normal">
                            CH Logs
                          </Label>
                        </div>
                        
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
                        
                        {/* HAN Log Format Dropdown - Shows ONLY when HAN is selected (MANDATORY) */}
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
                      disabled={isSubmitting} // Disable button when submitting
                    >
                      {isSubmitting ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Download className="size-4" />
                      )}
                      Retrieve Log Collection
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Selection Summary - Only show for active sets */}
            {isActiveSet && startDate && startTime && endDate && endTime && (
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
                    Copyright © 2026. All rights reserved.
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