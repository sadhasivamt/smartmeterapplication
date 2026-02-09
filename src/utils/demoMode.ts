/**
 * Demo Mode Utilities
 * 
 * This module provides utilities for managing demo mode state globally across the application.
 * When demo mode is toggled in one place, it will automatically sync across all components.
 * 
 * NOTE: If FORCE_DEMO_MODE is set to true in /src/config/demo.ts, the application will
 * always run in demo mode regardless of these functions.
 */

import { FORCE_DEMO_MODE } from "../config/demo";

/**
 * Enable demo mode manually
 * This sets the demoMode flag in localStorage
 * 
 * NOTE: This will be overridden if FORCE_DEMO_MODE is true in config
 */
export const enableDemoMode = () => {
  if (FORCE_DEMO_MODE) {
    console.info("%c✅ Demo Mode Already Active", "color: #10b981; font-weight: bold;", 
      "\nDemo mode is permanently enabled via config (FORCE_DEMO_MODE = true)");
    return;
  }

  localStorage.setItem("demoMode", "true");
  
  console.log("%c✅ Demo Mode Enabled", "color: #10b981; font-weight: bold;", 
    "\nUsing mock data for all API calls");
};

/**
 * Disable demo mode globally
 * Removes localStorage flag and dispatches a custom event to notify all components
 * 
 * NOTE: This will be overridden if FORCE_DEMO_MODE is true in config
 */
export const disableDemoMode = () => {
  if (FORCE_DEMO_MODE) {
    console.info("%cℹ️ Demo Mode is Locked", "color: #3b82f6; font-weight: bold;",
      "\nDemo mode is permanently enabled via config (FORCE_DEMO_MODE = true)",
      "\nTo disable: Set FORCE_DEMO_MODE = false in /src/config/demo.ts");
    return;
  }

  localStorage.removeItem("demoMode");
  
  // Dispatch custom event to notify all components in the same tab
  const event = new CustomEvent("demoModeChange", {
    detail: { demoMode: false }
  });
  window.dispatchEvent(event);
  
  console.log("%c✅ Demo Mode Disabled", "color: #10b981; font-weight: bold;", 
    "\nSwitched to real API mode");
};

/**
 * Check if demo mode is currently enabled
 * This checks both the config setting (FORCE_DEMO_MODE) and runtime state (localStorage)
 * 
 * @returns true if demo mode is enabled (either forced or at runtime), false otherwise
 */
export const isDemoModeEnabled = (): boolean => {
  // If forced in config, always return true
  if (FORCE_DEMO_MODE) {
    return true;
  }
  
  // Otherwise check localStorage
  return localStorage.getItem("demoMode") === "true";
};