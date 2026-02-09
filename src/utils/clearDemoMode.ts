/**
 * Check current demo mode configuration
 */
export const checkDemoModeConfig = () => {
  const runtimeDemoMode = localStorage.getItem("demoMode") === "true";
  
  console.log("%c🔍 Demo Mode Status Check", "color: #2563eb; font-weight: bold; font-size: 14px;");
  console.log(`%c   Runtime (localStorage): ${runtimeDemoMode ? "✅ ENABLED" : "❌ DISABLED"}`, "color: #64748b;");
  console.log(`%c   Effective Mode: ${runtimeDemoMode ? "DEMO MODE" : "REAL API MODE"}`, "color: #64748b;");
  
  return {
    runtimeDemoMode,
    effectiveMode: runtimeDemoMode ? "demo" : "real"
  };
};