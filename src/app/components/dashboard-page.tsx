import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { LogOut, LayoutDashboard, ChevronLeft, ChevronRight, RefreshCw, FlaskConical } from "lucide-react";
import { toast } from "sonner";
import { NavigationPane } from "./navigation-pane";
import { cn } from "../lib/utils";
import { API_ENDPOINTS, getApiUrl, getAuthHeaders } from "../../config/api";

interface DashboardPageProps {
  onLogout: () => void;
  userName: string;
  onNavigateToLabs: () => void;
  onNavigate: (page: "dashboard" | "labs" | "admin") => void;
  userRole?: string;
}

// Type definitions for API response
interface NextPageKey {
  id: string;
}

interface LogCollection {
  transaction_id: string;
  lab_id: string;
  cabinet_id: string;
  ch_type: string;
  start_time: string;
  stop_time: string;
  submit_time: string;
  task_desc: string;
  log_collection_status: string;
  log_collection_status_code: number;
  log_types: string[];
}

interface LogCollectionsResponse {
  next_page_key: NextPageKey | null;
  log_collections: LogCollection[];
}

// Table row data after mapping
interface TableRow {
  sNo: number;
  taskId: string;
  taskDescription: string;
  setDetails: string;
  timeSubmitted: string;
  startTime: string;
  endTime: string;
  status: string;
  statusCode: number;
}

export function DashboardPage({ onLogout, userName, onNavigateToLabs, onNavigate, userRole }: DashboardPageProps) {
  const [tableData, setTableData] = useState<TableRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentNextKey, setCurrentNextKey] = useState<NextPageKey | null>(null);
  const [previousKeys, setPreviousKeys] = useState<(NextPageKey | null)[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isFetchingRef = useRef(false); // Prevent concurrent fetches
  const pendingPageRef = useRef<number | null>(null); // Track pending page changes
  const currentRequestIdRef = useRef<number>(0); // Track request order to prevent race conditions

  // API Configuration
  const POLLING_INTERVAL = 30000; // 30 seconds
  const DEFAULT_LIMIT = 10;

  // Get authentication token from storage
  const getAuthToken = (): string | null => {
    return localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
  };

  /**
   * Map status code to human-readable status
   */
  const getStatusText = (statusCode: number, statusText: string): string => {
    // 105, 106, 107 = "In Progress"
    if (statusCode === 105 || statusCode === 106 || statusCode === 107) {
      return "In Progress";
    }
    // 108 = "Ready for download"
    if (statusCode === 108) {
      return "Ready for download";
    }
    // For other codes, use the log_collection_status text
    return statusText || "Unknown";
  };

  /**
   * Format date safely - returns "-" if invalid date
   */
  const formatDateSafely = (dateString: string): string => {
    if (!dateString) return "-";
    
    const date = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return "-";
    }
    
    return date.toLocaleString();
  };

  /**
   * Fetch log collections from API
   */
  const fetchLogCollections = async (nextPageKey: NextPageKey | null = null, showToast: boolean = false, pageNumber: number = currentPage) => {
    // Note: isFetchingRef is now set by the calling function (handlers)
    // This function assumes the caller has already set isFetchingRef.current = true
    
    setIsLoading(true);
    
    // Cancel any previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      console.log("⚠️ API: Aborting previous request");
    }
    
    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();
    
    // Increment and capture request ID for this specific request
    currentRequestIdRef.current += 1;
    const thisRequestId = currentRequestIdRef.current;
    
    console.log("🚀 API: Starting fetch request", {
      requestId: thisRequestId,
      pageNumber: pageNumber,
      nextPageKey: nextPageKey,
      timestamp: new Date().toISOString(),
    });

    // Build request payload
    const requestPayload: any = {
      filters: {},
      sort: {
        start_time: -1, // 1 for ascending, -1 for descending
      },
      limit: DEFAULT_LIMIT,
    };

    // Add next_page_key if provided (for pagination)
    if (nextPageKey) {
      requestPayload.next_page_key = nextPageKey;
    }

    /* MOCK API CALL - Comment this out when using real API
    setTimeout(() => {
      // Mock data with new API response structure
      const mockData: LogCollectionsResponse = {
        next_page_key: nextPageKey 
          ? null // No next page on second click (mock)
          : {
              id: "69612974799a31d4c3ace371",
            },
        log_collections: Array.from({ length: DEFAULT_LIMIT }, (_, i) => {
          const offset = nextPageKey ? DEFAULT_LIMIT : 0;
          const ch_types = ["edmi", "toshiba_4g", "vmo2", "wnc"];
          return {
            transaction_id: `${crypto.randomUUID()}`,
            lab_id: `andromeda`,
            cabinet_id: `b${String((i + offset) % 30 + 11).padStart(2, '0')}`,
            ch_type: ch_types[(i + offset) % ch_types.length],
            start_time: new Date(Date.now() - (i + offset) * 3600000).toISOString().slice(0, 19),
            stop_time: new Date(Date.now() - (i + offset) * 1800000).toISOString().slice(0, 19),
            submit_time: new Date(Date.now() - (i + offset) * 7200000).toISOString().slice(0, 19),
            task_desc: `Task description for log collection ${i + offset + 1}`,
            log_collection_status: ["log_collection_initiated", "log_collection_in_progress", "log_collection_completed", "log_collection_retrieval_initiated"][i % 4],
            log_collection_status_code: [105, 106, 108, 110][i % 4],
            log_types: (i + offset) % 2 === 0 ? ["ch", "zigbee"] : ["ch"],
          };
        }),
      };

      processApiResponse(mockData);
      setIsLoading(false);
      if (showToast) {
        toast.success("Data refreshed successfully");
      }
    }, 1000);
    */

    // REAL API CALL
    try {
      const token = getAuthToken();
      
      if (!token) {
        toast.error("Authentication token not found. Please login again.");
        setIsLoading(false);
        return;
      }
      
      const logCollectionsUrl = getApiUrl(API_ENDPOINTS.GET_LOG_COLLECTIONS);
      console.log("🚀 API Call - POST GET_LOG_COLLECTIONS:", {
        url: logCollectionsUrl,
        method: "POST",
        body: requestPayload,
        timestamp: new Date().toISOString(),
      });

      const response = await fetch(logCollectionsUrl, {
        method: "POST",
        headers: getAuthHeaders(token),
        body: JSON.stringify(requestPayload),
        signal: abortControllerRef.current.signal, // Add signal to abort request
      });

      console.log("✅ API Response - POST GET_LOG_COLLECTIONS:", {
        url: logCollectionsUrl,
        status: response.status,
        statusText: response.statusText,
        timestamp: new Date().toISOString(),
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
        throw new Error("Unauthorized - Please login again");
      }

      if (response.status === 404) {
        throw new Error("API endpoint not found. Please check your configuration.");
      }

      if (response.status >= 500) {
        if (isJson) {
          const errorData = await response.json();
          throw new Error(errorData.message || errorData.detail || "Server error occurred");
        }
        throw new Error("Server error occurred. Please try again later.");
      }

      if (!response.ok) {
        if (isJson) {
          const errorData = await response.json();
          throw new Error(errorData.message || errorData.detail || "Failed to fetch log collections");
        }
        throw new Error(`Failed to fetch log collections (Status: ${response.status})`);
      }

      // Only try to parse JSON if content-type is JSON
      if (!isJson) {
        throw new Error("Invalid response from server. Expected JSON but received HTML.");
      }

      const data: LogCollectionsResponse = await response.json();
      
      // Check if this response is still relevant (not stale)
      if (thisRequestId !== currentRequestIdRef.current) {
        console.log("⚠️ API: Response is stale, discarding", {
          responseRequestId: thisRequestId,
          currentRequestId: currentRequestIdRef.current,
          pageNumber: pageNumber,
          timestamp: new Date().toISOString(),
        });
        return; // Discard stale response
      }
      
      console.log("✅ API: Response is current, processing data", {
        requestId: thisRequestId,
        pageNumber: pageNumber,
        recordCount: data.log_collections.length,
        timestamp: new Date().toISOString(),
      });
      
      processApiResponse(data, pageNumber);
      if (showToast) {
        toast.success("Data refreshed successfully");
      }
    } catch (error) {
      console.error("Error fetching log collections:", error);
      toast.error("Failed to load log collections. Please try again.");
      setTableData([]);
    } finally {
      isFetchingRef.current = false;
      setIsLoading(false);
    }
  };

  /**
   * Process API response and map to table data
   */
  const processApiResponse = (data: LogCollectionsResponse, pageNumber: number) => {
    // Update next page key
    setCurrentNextKey(data.next_page_key);

    // Map log collections to table rows
    const mappedData: TableRow[] = data.log_collections.map((log, index) => ({
      sNo: (pageNumber - 1) * DEFAULT_LIMIT + index + 1,
      taskId: log.transaction_id,
      taskDescription: log.task_desc,
      setDetails: `${log.lab_id} / ${log.cabinet_id} / ${log.ch_type || ""}`,
      timeSubmitted: log.submit_time,
      startTime: log.start_time,
      endTime: log.stop_time,
      status: getStatusText(log.log_collection_status_code, log.log_collection_status),
      statusCode: log.log_collection_status_code,
    }));

    setTableData(mappedData);
  };

  /**
   * Handle next page button click
   */
  const handleNextPage = () => {
    // STRICT BLOCKING: Check and set flag IMMEDIATELY before any async operation
    if (isFetchingRef.current) {
      console.log("⚠️ Pagination: Already fetching, ignoring Next click", {
        currentPage: currentPage,
        timestamp: new Date().toISOString(),
      });
      toast.info("Please wait for the current request to complete");
      return;
    }
    
    if (!currentNextKey) {
      toast.info("No more records available");
      return;
    }

    // Set flag IMMEDIATELY to block any subsequent clicks
    isFetchingRef.current = true;

    console.log("📄 Pagination: Moving to next page", {
      currentPage: currentPage,
      nextPage: currentPage + 1,
      currentNextKey: currentNextKey,
      fetchingFlagSet: true,
      timestamp: new Date().toISOString(),
    });

    const nextPage = currentPage + 1;
    
    // Save current state to previous keys
    setPreviousKeys([...previousKeys, currentNextKey]);
    setCurrentPage(nextPage);
    
    // Fetch next page with the new page number
    // Note: isFetchingRef.current is already set to true above
    fetchLogCollections(currentNextKey, false, nextPage);
  };

  /**
   * Handle previous page button click
   */
  const handlePreviousPage = () => {
    // STRICT BLOCKING: Check and set flag IMMEDIATELY before any async operation
    if (isFetchingRef.current) {
      console.log("⚠️ Pagination: Already fetching, ignoring Previous click", {
        currentPage: currentPage,
        timestamp: new Date().toISOString(),
      });
      toast.info("Please wait for the current request to complete");
      return;
    }
    
    if (currentPage === 1) {
      toast.info("You are on the first page");
      return;
    }

    // Set flag IMMEDIATELY to block any subsequent clicks
    isFetchingRef.current = true;

    console.log("📄 Pagination: Moving to previous page", {
      currentPage: currentPage,
      prevPage: currentPage - 1,
      previousKeysLength: previousKeys.length,
      fetchingFlagSet: true,
      timestamp: new Date().toISOString(),
    });

    const prevPage = currentPage - 1;

    // Get the previous next_page_key
    const newPreviousKeys = [...previousKeys];
    const previousKey = newPreviousKeys.length > 1 ? newPreviousKeys[newPreviousKeys.length - 2] : null;
    
    // Remove the last key
    newPreviousKeys.pop();
    setPreviousKeys(newPreviousKeys);
    
    setCurrentPage(prevPage);
    
    // Fetch previous page with the previous page number
    // Note: isFetchingRef.current is already set to true above
    fetchLogCollections(previousKey, false, prevPage);
  };

  /**
   * Manual refresh
   */
  const handleRefresh = () => {
    // STRICT BLOCKING: Check and set flag IMMEDIATELY
    if (isFetchingRef.current) {
      console.log("⚠️ Refresh: Already fetching, ignoring refresh click", {
        timestamp: new Date().toISOString(),
      });
      toast.info("Please wait for the current request to complete");
      return;
    }

    // Set flag IMMEDIATELY to block any subsequent clicks
    isFetchingRef.current = true;

    console.log("🔄 Refresh: Resetting to first page", {
      fetchingFlagSet: true,
      timestamp: new Date().toISOString(),
    });

    // Reset to first page
    setPreviousKeys([]);
    setCurrentPage(1);
    
    // Note: isFetchingRef.current is already set to true above
    fetchLogCollections(null, true, 1);
  };

  /**
   * Setup polling on component mount
   */
  useEffect(() => {
    // Initial fetch - don't set blocking flag for initial load
    if (!isFetchingRef.current) {
      isFetchingRef.current = true;
      fetchLogCollections();
    }

    // Setup polling
    pollingIntervalRef.current = setInterval(() => {
      // Only poll if not currently fetching
      if (!isFetchingRef.current) {
        console.log("⏰ Polling: Refreshing current page data", {
          currentPage: currentPage,
          timestamp: new Date().toISOString(),
        });
        
        isFetchingRef.current = true;
        
        // Refresh current page data
        const currentKeyForRefresh = previousKeys.length > 0 
          ? previousKeys[previousKeys.length - 1] 
          : null;
        fetchLogCollections(currentKeyForRefresh);
      } else {
        console.log("⏰ Polling: Skipped - fetch already in progress", {
          currentPage: currentPage,
          timestamp: new Date().toISOString(),
        });
      }
    }, POLLING_INTERVAL);

    // Cleanup on unmount
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
      // Abort any pending request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [currentPage]); // Re-run when page changes

  return (
    <>
      {/* Navigation Pane */}
      <NavigationPane
        currentPage="dashboard"
        userName={userName}
        onNavigate={onNavigate}
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
              <p className="text-sm text-gray-600 text-center">Log Collections Overview</p>
            </div>
          </div>

          {/* User Info and Actions */}
          <div className="max-w-7xl mx-auto mb-6 mt-20">
            <div className="flex items-center justify-between bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center gap-3">
                <LayoutDashboard className="size-6 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-500">Welcome, {userName}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="max-w-7xl mx-auto">
            <Card className="shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Log Collections</CardTitle>
                    <CardDescription>
                      Automatically refreshes every 30 seconds
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handleRefresh} className="gap-2">
                      <RefreshCw className={`size-4 ${isLoading ? 'animate-spin' : ''}`} />
                      Refresh
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-100 border-b-2 border-gray-300">
                        <th className="text-left p-3 font-semibold text-sm">S.No</th>
                        <th className="text-left p-3 font-semibold text-sm">Task ID</th>
                        <th className="text-left p-3 font-semibold text-sm">Task Description</th>
                        <th className="text-left p-3 font-semibold text-sm">Set Details</th>
                        <th className="text-left p-3 font-semibold text-sm">Time submitted</th>
                        <th className="text-left p-3 font-semibold text-sm">Start Time</th>
                        <th className="text-left p-3 font-semibold text-sm">End Time</th>
                        <th className="text-left p-3 font-semibold text-sm">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {isLoading && tableData.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="text-center p-8 text-gray-500">
                            <RefreshCw className="size-6 animate-spin mx-auto mb-2" />
                            Loading log collections...
                          </td>
                        </tr>
                      ) : tableData.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="text-center p-8 text-gray-500">
                            No log collections found
                          </td>
                        </tr>
                      ) : (
                        tableData.map((row, index) => (
                          <tr 
                            key={row.taskId} 
                            className={`border-b hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                          >
                            <td className="p-3 text-sm">{row.sNo}</td>
                            <td className="p-3 text-sm font-mono text-xs">{row.taskId}</td>
                            <td className="p-3 text-sm">{row.taskDescription}</td>
                            <td className="p-3 text-sm font-semibold">{row.setDetails}</td>
                            <td className="p-3 text-sm">{formatDateSafely(row.timeSubmitted)}</td>
                            <td className="p-3 text-sm">{formatDateSafely(row.startTime)}</td>
                            <td className="p-3 text-sm">{formatDateSafely(row.endTime)}</td>
                            <td className="p-3 text-sm">
                              <span 
                                className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                  row.status === "In Progress" 
                                    ? "bg-yellow-100 text-yellow-800"
                                    : row.status === "Ready for download"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {row.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between mt-6 pt-4 border-t">
                  <div className="text-sm text-gray-600">
                    Page {currentPage} {isLoading && <span className="text-blue-600">(Loading...)</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePreviousPage}
                      disabled={currentPage === 1 || isLoading}
                      className="gap-2"
                    >
                      <ChevronLeft className="size-4" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleNextPage}
                      disabled={!currentNextKey || isLoading}
                      className="gap-2"
                    >
                      Next
                      <ChevronRight className="size-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Footer */}
            <div className="mt-6 bg-white rounded-lg shadow-sm p-6">
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

/**
 * Format date-time string to a more readable format
 */
function formatDateTime(dateTime: string): string {
  const date = new Date(dateTime);
  return date.toLocaleString();
}