/**
 * Clear Demo Mode Data - Developer Utility
 * 
 * This script helps developers clear all demo mode data from localStorage
 * when switching from demo mode to real API mode.
 * 
 * HOW TO USE:
 * 1. Open browser DevTools (F12)
 * 2. Go to Console tab
 * 3. Copy and paste this code:
 * 
 * ```javascript
 * localStorage.clear(); 
 * sessionStorage.clear(); 
 * console.log("✅ All demo mode data cleared! Please refresh the page.");
 * ```
 * 
 * OR use this function:
 */

export const clearDemoModeData = () => {
  console.log("%c🧹 Clearing all demo mode data...", "color: #f59e0b; font-weight: bold;");
  
  // Clear all localStorage
  localStorage.clear();
  
  // Clear all sessionStorage
  sessionStorage.clear();
  
  console.log("%c✅ All demo mode data cleared!", "color: #10b981; font-weight: bold;");
  console.log("%c   Please refresh the page to use real API mode", "color: #64748b;");
  
  return "Demo mode data cleared successfully!";
};

/**
 * Check current demo mode configuration
 */
export const checkDemoModeConfig = () => {
  const FORCE_DEMO_MODE = false; // This should match your config/demo.ts setting
  const runtimeDemoMode = localStorage.getItem("demoMode") === "true";
  
  console.log("%c🔍 Demo Mode Status Check", "color: #2563eb; font-weight: bold; font-size: 14px;");
  console.log(`%c   Config (FORCE_DEMO_MODE): ${FORCE_DEMO_MODE ? "✅ ENABLED" : "❌ DISABLED"}`, "color: #64748b;");
  console.log(`%c   Runtime (localStorage): ${runtimeDemoMode ? "✅ ENABLED" : "❌ DISABLED"}`, "color: #64748b;");
  console.log(`%c   Effective Mode: ${FORCE_DEMO_MODE || runtimeDemoMode ? "DEMO MODE" : "REAL API MODE"}`, "color: #64748b;");
  
  return {
    forceDemoMode: FORCE_DEMO_MODE,
    runtimeDemoMode,
    effectiveMode: FORCE_DEMO_MODE || runtimeDemoMode ? "demo" : "real"
  };
};

// Make functions available globally in development
if (typeof window !== "undefined") {
  (window as any).clearDemoModeData = clearDemoModeData;
  (window as any).checkDemoModeConfig = checkDemoModeConfig;
}
