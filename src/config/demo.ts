/**
 * Demo Mode Configuration
 *
 * This file controls whether the application uses mock data (demo mode) or real API data.
 *
 * USAGE:
 * - Set FORCE_DEMO_MODE to `true` to enable demo mode globally (uses mock data)
 * - Set FORCE_DEMO_MODE to `false` to disable demo mode (uses real API endpoints)
 *
 * When FORCE_DEMO_MODE is true:
 * - All API calls will be bypassed
 * - Mock data will be returned for all operations
 * - User will be automatically logged in with demo credentials
 * - No real authentication is required
 *
 * When FORCE_DEMO_MODE is false:
 * - Real API endpoints will be called
 * - Authentication tokens are required
 * - All data comes from the backend server
 */

/**
 * CONFIGURATION - Change this value to enable/disable demo mode
 */
export const FORCE_DEMO_MODE = true; // Set to `true` for demo mode, `false` for real API data

/**
 * Check if the application should run in demo mode
 * This checks both the config setting and the runtime demo mode state
 *
 * @param runtimeDemoMode - The current demo mode state from the application
 * @returns true if demo mode is enabled (either forced or at runtime), false otherwise
 */
export const isDemoMode = (
  runtimeDemoMode: boolean = false,
): boolean => {
  return FORCE_DEMO_MODE || runtimeDemoMode;
};

/**
 * Get demo mode status message for developers
 */
export const getDemoModeStatus = (): string => {
  if (FORCE_DEMO_MODE) {
    return "Demo Mode is FORCED ON in config (using mock data)";
  }
  return "Demo Mode config is OFF (using real API data)";
};

/**
 * Demo user credentials for auto-login when FORCE_DEMO_MODE is enabled
 */
export const DEMO_USER = {
  userName: "demo.user",
  userEmail: "demo.user@example.com",
  userRole: "admin",
  authToken: "demo-token-12345",
};