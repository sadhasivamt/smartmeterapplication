import { useState } from "react";
import { Button } from "./ui/button";
import { 
  LayoutDashboard, 
  FlaskConical, 
  LogOut, 
  User,
  Shield
} from "lucide-react";
import { cn } from "../lib/utils";

interface NavigationPaneProps {
  currentPage: "dashboard" | "labs" | "set-details" | "admin";
  userName: string;
  onNavigate: (page: "dashboard" | "labs" | "admin") => void;
  onLogout: () => void;
  userRole?: string;
}

export function NavigationPane({ 
  currentPage, 
  userName, 
  onNavigate, 
  onLogout,
  userRole
}: NavigationPaneProps) {
  // Check if user is admin
  const isAdmin = () => {
    const storedRole = userRole || localStorage.getItem("userRole") || sessionStorage.getItem("userRole");
    return storedRole === "admin";
  };

  const navItems = [
    {
      id: "dashboard" as const,
      label: "Dashboard",
      icon: LayoutDashboard,
      onClick: () => onNavigate("dashboard"),
      visible: true, // Always visible
    },
    {
      id: "labs" as const,
      label: "Labs",
      icon: FlaskConical,
      onClick: () => onNavigate("labs"),
      visible: true, // Always visible
    },
    {
      id: "admin" as const,
      label: "Admin",
      icon: Shield,
      onClick: () => onNavigate("admin"),
      visible: isAdmin(), // Only visible for admin users
    },
  ];

  return (
    <div
      className="fixed left-0 top-0 h-full bg-white shadow-lg border-r border-gray-200 w-[156px] z-50 flex flex-col"
    >
      {/* Header - Matching page header height and styling */}
      <div className="py-3 border-b border-gray-200 bg-white shadow-md flex items-center justify-center">
        <h2 className="font-semibold text-gray-800">
          ALS
        </h2>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
            <User className="size-5 text-blue-600" />
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-medium text-gray-800 truncate">
              {userName}
            </p>
            <p className="text-xs text-gray-500">{isAdmin() ? "Admin" : "User"}</p>
          </div>
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.filter(item => item.visible).map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;

          return (
            <button
              key={item.id}
              onClick={item.onClick}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                isActive
                  ? "bg-blue-50 text-blue-600"
                  : "text-gray-700 hover:bg-gray-100"
              )}
            >
              <Icon className="size-5 flex-shrink-0" />
              <span className="text-sm font-medium">{item.label}</span>
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Logout Button */}
      <div className="p-3 border-t border-gray-200">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-600 hover:bg-red-50 transition-all duration-200"
        >
          <LogOut className="size-5 flex-shrink-0" />
          <span className="text-sm font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
}