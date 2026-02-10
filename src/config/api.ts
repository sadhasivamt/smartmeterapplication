/**
 * API Configuration
 *
 * This file centralizes all API endpoint configurations.
 * Endpoints can be configured via environment variables in .env file.
 *
 * To configure:
 * 1. Copy .env.example to .env
 * 2. Update the values in .env file
 * 3. Restart the development server
 */

// API Base URL (leave empty for relative URLs)
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "";

// Authentication Endpoints
export const API_ENDPOINTS = {
  // Auth endpoints
  LOGIN: import.meta.env.VITE_API_LOGIN || "/log-auth/login",
  LOGOUT: import.meta.env.VITE_API_LOGOUT || "/log-auth/logout",
  USER_LIST:
    import.meta.env.VITE_API_USER_LIST || "/log-auth/user_list",
  INVITE_USER:
    import.meta.env.VITE_API_INVITE_USER ||
    "/log-auth/invite_user",
  RESET_PASSWORD:
    import.meta.env.VITE_API_RESET_PASSWORD ||
    "/log-auth/reset_forgot_password",
  DELETE_USER:
    import.meta.env.VITE_API_DELETE_USER ||
    "/log-auth/delete_user",

  // Device Inventory endpoints
  LABS:
    import.meta.env.VITE_API_LABS ||
    "/device-inventory/get_lab_inventory",
  LAB_DETAILS:
    import.meta.env.VITE_API_LAB_DETAILS ||
    "/device-inventory/get_lab_details",
  LLS_INVENTORY:
    import.meta.env.VITE_API_LLS_INVENTORY ||
    "/device-inventory/get_lls_inventory",

  // Log Collector endpoints
  START_LOG_COLLECTION:
    import.meta.env.VITE_API_START_LOG_COLLECTION ||
    "/log-collector/start_log_collection",
  GET_LOG_COLLECTIONS:
    import.meta.env.VITE_API_GET_LOG_COLLECTIONS ||
    "/log-collector/log_collection_list",
} as const;

/**
 * Helper function to build full API URL with query parameters
 * @param endpoint - The API endpoint path
 * @param params - Optional query parameters
 * @returns Full URL with base URL if configured and query parameters
 */
export const getApiUrl = (
  endpoint: string,
  params?: Record<string, string>,
): string => {
  let url = API_BASE_URL
    ? `${API_BASE_URL}${endpoint}`
    : endpoint;

  // Add query parameters if provided
  if (params && Object.keys(params).length > 0) {
    const queryString = new URLSearchParams(params).toString();
    url = `${url}?${queryString}`;
  }

  return url;
};

/**
 * Helper function to get authentication headers
 * @param token - Optional token to use instead of looking it up
 * @returns Headers object with Authorization token if available
 */
export const getAuthHeaders = (
  token?: string | null,
): HeadersInit => {
  const authToken =
    token ||
    localStorage.getItem("authToken") ||
    sessionStorage.getItem("authToken");

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }

  return headers;
};