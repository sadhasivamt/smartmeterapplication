/**
 * Demo Mode Configuration
 *
 * This file contains demo user credentials for testing purposes.
 * Demo mode can be enabled/disabled at runtime by the user.
 */

/**
 * Check if the application should run in demo mode
 * This checks the runtime demo mode state from localStorage
 *
 * @param runtimeDemoMode - The current demo mode state from the application
 * @returns true if demo mode is enabled at runtime, false otherwise
 */
export const isDemoMode = (
  runtimeDemoMode: boolean = false,
): boolean => {
  return runtimeDemoMode;
};

/**
 * Demo user credentials for testing when demo mode is enabled
 */
export const DEMO_USER = {
  userName: "demo.user",
  userEmail: "demo.user@example.com",
  userRole: "admin",
  authToken: "demo-token-12345",
};