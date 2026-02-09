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
  isDemoMode?: boolean;
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

export function DashboardPage({ onLogout, userName, onNavigateToLabs, onNavigate, isDemoMode }: DashboardPageProps) {
  const [tableData, setTableData] = useState<TableRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentNextKey, setCurrentNextKey] = useState<NextPageKey | null>(null);
  const [previousKeys, setPreviousKeys] = useState<(NextPageKey | null)[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

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
   * Fetch log collections from API
   */
  const fetchLogCollections = async (nextPageKey: NextPageKey | null = null, showToast: boolean = false) => {
    setIsLoading(true);

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

    // If in demo mode, use mock data
    if (isDemoMode) {
      setTimeout(() => {
        // Check for pending log collections from localStorage
        const pendingEntries = JSON.parse(localStorage.getItem("pending_log_collections") || "[]");
        
        // Generate all 20 records with different manufacturers
        const ch_types = ["toshiba_4g", "vmo2", "edmi", "wnc"];
        const allMockRecords: LogCollection[] = Array.from({ length: 20 }, (_, i) => {
          const statusCode = [105, 106, 107, 108, 110][i % 5];
          const statusText = statusCode === 108 ? "log_collection_completed" : statusCode === 110 ? "log_collection_retrieval_initiated" : "log_collection_in_progress";
          const cabinetNumber = (i % 10) + 1;
          return {
            transaction_id: `txn-${Math.random().toString(36).substring(7)}-${i + 1}`,
            lab_id: `andromeda`,
            cabinet_id: `b${String(cabinetNumber + 10).padStart(2, '0')}`,
            ch_type: ch_types[i % ch_types.length],
            start_time: `2026-01-${String((i % 28) + 1).padStart(2, '0')}T${String((i % 12) + 8).padStart(2, '0')}:04:17`,
            stop_time: `2026-01-${String((i % 28) + 1).padStart(2, '0')}T${String((i % 12) + 9).padStart(2, '0')}:09:17`,
            submit_time: `2026-01-${String((i % 28) + 1).padStart(2, '0')}T${String((i % 12) + 10).padStart(2, '0')}:27:38`,
            task_desc: `Task ${i + 1}: Log collection for testing`,
            log_collection_status: statusText,
            log_collection_status_code: statusCode,
            log_types: i % 2 === 0 ? ["ch", "zigbee"] : ["ch"],
          };
        });

        // Combine pending entries with existing mock records
        const combinedRecords = [...pendingEntries, ...allMockRecords];

        // Sort by submit_time in descending order (most recent first)
        combinedRecords.sort((a, b) => {
          const dateA = new Date(a.submit_time).getTime();
          const dateB = new Date(b.submit_time).getTime();
          return dateB - dateA; // Descending order
        });

        // Paginate the data
        const startIndex = (currentPage - 1) * DEFAULT_LIMIT;
        const endIndex = startIndex + DEFAULT_LIMIT;
        const paginatedRecords = combinedRecords.slice(startIndex, endIndex);
        
        const mockData: LogCollectionsResponse = {
          next_page_key: currentPage < Math.ceil(combinedRecords.length / DEFAULT_LIMIT) ? { id: "mock-next-key-id" } : null,
          log_collections: paginatedRecords,
        };

        // Transform API response to table rows
        const rows: TableRow[] = mockData.log_collections.map((item, index) => ({
          sNo: (currentPage - 1) * DEFAULT_LIMIT + index + 1,
          taskId: item.transaction_id,
          taskDescription: item.task_desc,
          setDetails: `${item.lab_id} / ${item.cabinet_id} / ${item.ch_type}`,
          timeSubmitted: formatDateTime(item.submit_time),
          startTime: formatDateTime(item.start_time),
          endTime: formatDateTime(item.stop_time),
          status: getStatusText(item.log_collection_status_code, item.log_collection_status),
          statusCode: item.log_collection_status_code,
        }));

        setTableData(rows);
        setCurrentNextKey(mockData.next_page_key || null);
        setIsLoading(false);
        
        if (showToast) {
          toast.success("Log collections refreshed (Demo Mode)");
        }
      }, 500);
      return;
    }

    // MOCK API CALL - Remove this and uncomment real API call below
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

    /* REAL API CALL - Uncomment when connecting to actual backend
    try {
      const token = getAuthToken();
      
      if (!token) {
        toast.error("Authentication token not found. Please login again.");
        setIsLoading(false);
        return;
      }
      
      const response = await fetch(getApiUrl(API_ENDPOINTS.GET_LOG_COLLECTIONS), {
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
      
      processApiResponse(data);
      if (showToast) {
        toast.success("Data refreshed successfully");
      }
    } catch (error) {
      console.error("Error fetching log collections:", error);
      toast.error("Failed to load log collections. Please try again.");
      setTableData([]);
    } finally {
      setIsLoading(false);
    }
    */
  };

  /**
   * Process API response and map to table data
   */
  const processApiResponse = (data: LogCollectionsResponse) => {
    // Update next page key
    setCurrentNextKey(data.next_page_key);

    // Map log collections to table rows
    const mappedData: TableRow[] = data.log_collections.map((log, index) => ({
      sNo: (currentPage - 1) * DEFAULT_LIMIT + index + 1,
      taskId: log.transaction_id,
      taskDescription: log.task_desc,
      setDetails: `${log.lab_id} / ${log.cabinet_id} / ${log.ch_type}`,
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
    if (!currentNextKey) {
      toast.info("No more records available");
      return;
    }

    // Save current state to previous keys
    setPreviousKeys([...previousKeys, currentNextKey]);
    setCurrentPage(currentPage + 1);
    
    // Fetch next page
    fetchLogCollections(currentNextKey);
  };

  /**
   * Handle previous page button click
   */
  const handlePreviousPage = () => {
    if (currentPage === 1) {
      toast.info("You are on the first page");
      return;
    }

    // Get the previous next_page_key
    const newPreviousKeys = [...previousKeys];
    const previousKey = newPreviousKeys.length > 1 ? newPreviousKeys[newPreviousKeys.length - 2] : null;
    
    // Remove the last key
    newPreviousKeys.pop();
    setPreviousKeys(newPreviousKeys);
    
    setCurrentPage(currentPage - 1);
    
    // Fetch previous page
    fetchLogCollections(previousKey);
  };

  /**
   * Manual refresh
   */
  const handleRefresh = () => {
    // Reset to first page
    setPreviousKeys([]);
    setCurrentPage(1);
    fetchLogCollections(null, true);
  };

  /**
   * Setup polling on component mount
   */
  useEffect(() => {
    // Initial fetch
    fetchLogCollections();

    // Setup polling
    pollingIntervalRef.current = setInterval(() => {
      // Refresh current page data
      const currentKeyForRefresh = previousKeys.length > 0 
        ? previousKeys[previousKeys.length - 1] 
        : null;
      fetchLogCollections(currentKeyForRefresh);
    }, POLLING_INTERVAL);

    // Cleanup on unmount
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
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
                            <td className="p-3 text-sm">{new Date(row.timeSubmitted).toLocaleString()}</td>
                            <td className="p-3 text-sm">{new Date(row.startTime).toLocaleString()}</td>
                            <td className="p-3 text-sm">{new Date(row.endTime).toLocaleString()}</td>
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

/**
 * Format date-time string to a more readable format
 */
function formatDateTime(dateTime: string): string {
  const date = new Date(dateTime);
  return date.toLocaleString();
}