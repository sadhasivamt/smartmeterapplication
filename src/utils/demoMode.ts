/**
 * Demo Mode Utilities
 * 
 * This module provides utilities for managing demo mode state globally across the application.
 * When demo mode is toggled in one place, it will automatically sync across all components.
 */

/**
 * Enable demo mode manually
 * This sets the demoMode flag in localStorage
 */
export const enableDemoMode = () => {
  localStorage.setItem("demoMode", "true");
  
  // Dispatch a custom event to notify all components
  window.dispatchEvent(new CustomEvent("demoModeChange", { detail: { demoMode: true } }));
  
  console.info("%c✅ Demo Mode Enabled", "color: #10b981; font-weight: bold;", 
    "\nDemo mode has been enabled successfully!",
    "\nAll API calls will now use mock data");
};

/**
 * Disable demo mode globally
 * Removes localStorage flag and dispatches a custom event to notify all components
 */
export const disableDemoMode = () => {
  localStorage.removeItem("demoMode");
  
  // Dispatch a custom event to notify all components
  window.dispatchEvent(new CustomEvent("demoModeChange", { detail: { demoMode: false } }));
  
  console.info("%c❌ Demo Mode Disabled", "color: #ef4444; font-weight: bold;",
    "\nDemo mode has been disabled successfully!",
    "\nApplication will now use real API endpoints");
};

/**
 * Check if demo mode is currently enabled
 * This checks the runtime state (localStorage)
 * 
 * @returns true if demo mode is enabled at runtime, false otherwise
 */
export const isDemoModeEnabled = (): boolean => {
  // Check runtime localStorage
  const runtimeDemoMode = localStorage.getItem("demoMode") === "true";
  return runtimeDemoMode;
};