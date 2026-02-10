/**
 * Utility functions for authentication and authorization
 */

/**
 * Check if the current user has admin role
 * @returns true if user has admin role, false otherwise
 */
export function isAdmin(): boolean {
  const storedRole = localStorage.getItem("userRole") || sessionStorage.getItem("userRole");
  return storedRole === "admin";
}

/**
 * Get the current user's roles
 * @returns Array of user roles
 */
export function getUserRoles(): string[] {
  const storedRoles = localStorage.getItem("userRoles") || sessionStorage.getItem("userRoles");
  if (storedRoles) {
    try {
      return JSON.parse(storedRoles);
    } catch (error) {
      console.error("Error parsing user roles:", error);
      return [];
    }
  }
  return [];
}

/**
 * Get the current user's primary role
 * @returns The primary role (first in the roles array)
 */
export function getUserRole(): string | null {
  const storedRole = localStorage.getItem("userRole") || sessionStorage.getItem("userRole");
  return storedRole;
}

/**
 * Check if user has a specific role
 * @param role - Role to check
 * @returns true if user has the role, false otherwise
 */
export function hasRole(role: string): boolean {
  const roles = getUserRoles();
  return roles.includes(role);
}

/**
 * Get authentication token from storage
 * @returns JWT token or null
 */
export function getAuthToken(): string | null {
  return localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
}

/**
 * Get current user's email from storage
 * @returns User email or null
 */
export function getUserEmail(): string | null {
  return localStorage.getItem("userEmail") || sessionStorage.getItem("userEmail");
}

/**
 * Get current user's name from storage
 * @returns User name or null
 */
export function getUserName(): string | null {
  return localStorage.getItem("userName") || sessionStorage.getItem("userName");
}
