import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { NavigationPane } from "./navigation-pane";
import { UserPlus, Search, KeyRound, Trash2 } from "lucide-react";
import { InviteUserDialog } from "./invite-user-dialog";
import { ResetPasswordDialog } from "./reset-password-dialog";
import { toast } from "sonner";
import { API_ENDPOINTS, getApiUrl, getAuthHeaders } from "../../config/api";

interface UsersPageProps {
  userName: string;
  userEmail?: string;
  userRole?: string;
  onLogout: () => void;
  onNavigate: (page: "dashboard" | "labs" | "admin") => void;
}

interface User {
  id: string;
  name: string;
  email: string;
  username: string;
  first_name?: string;
  last_name?: string;
  role?: string;
  user_id?: string;
  createdAt?: string;
}

// Mock data for demo mode
const mockUsers: User[] = [
  {
    id: "1",
    name: "John Doe",
    email: "john.doe@example.com",
    username: "johndoe",
    first_name: "John",
    last_name: "Doe",
    role: "admin",
    user_id: "john.doe@example.com",
    createdAt: "2024-01-15",
  },
  {
    id: "2",
    name: "Jane Smith",
    email: "jane.smith@example.com",
    username: "janesmith",
    first_name: "Jane",
    last_name: "Smith",
    role: "user",
    user_id: "jane.smith@example.com",
    createdAt: "2024-01-18",
  },
  {
    id: "3",
    name: "Sathwik P",
    email: "sathwik.p@hcltech.com",
    username: "sathwik.p",
    first_name: "Sathwik",
    last_name: "P",
    role: "user",
    user_id: "sathwik.p@hcltech.com",
    createdAt: "2024-02-01",
  },
];

export function UsersPage({ userName, userEmail, userRole, onLogout, onNavigate }: UsersPageProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showResetPasswordDialog, setShowResetPasswordDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDeletingUser, setIsDeletingUser] = useState(false);
  
  // Check if current user is admin
  const isAdmin = () => {
    const storedRole = userRole || localStorage.getItem("userRole");
    const storedRoles = localStorage.getItem("userRoles") || sessionStorage.getItem("userRoles");
    console.log("🔐 Admin Check:", {
      userRole: userRole,
      storedRole: storedRole,
      storedRoles: storedRoles,
      isAdmin: storedRole === "admin",
      timestamp: new Date().toISOString(),
    });
    return storedRole === "admin";
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      // Real API call to /log-auth/user_list
      const token = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
      
      if (!token) {
        console.warn("No authentication token found, using demo data");
        setUsers(mockUsers);
        setIsLoading(false);
        return;
      }

      const response = await fetch(getApiUrl(API_ENDPOINTS.USER_LIST), {
        method: "GET",
        headers: getAuthHeaders(token),
      });

      // Check if response is JSON
      const contentType = response.headers.get("content-type");
      const isJson = contentType && contentType.includes("application/json");

      // Handle specific error codes
      if (response.status === 401) {
        if (isJson) {
          const errorData = await response.json();
          toast.error(errorData.message || errorData.detail || "Unauthorized - Please login again");
        } else {
          toast.error("Invalid or missing token");
        }
        console.warn("Authentication failed, using demo data");
        setUsers(mockUsers);
        setIsLoading(false);
        return;
      }

      if (response.status === 404) {
        toast.error("User list endpoint not found. Please check your API configuration.");
        console.warn("API endpoint not found, using demo data");
        setUsers(mockUsers);
        setIsLoading(false);
        return;
      }

      if (response.status === 422) {
        if (isJson) {
          const errorData = await response.json();
          toast.error(errorData.detail || "Invalid request parameters");
        } else {
          toast.error("Invalid request parameters");
        }
        setUsers(mockUsers);
        setIsLoading(false);
        return;
      }

      if (response.status >= 500 || response.status === 400) {
        if (isJson) {
          const errorData = await response.json();
          toast.error(errorData.detail || errorData.message || "API error occurred");
        } else {
          toast.error("Server error occurred. Please try again later.");
        }
        console.warn("Server error, using demo data");
        setUsers(mockUsers);
        setIsLoading(false);
        return;
      }

      if (!response.ok) {
        if (isJson) {
          const errorData = await response.json();
          toast.error(errorData.message || errorData.detail || "Failed to fetch users");
        } else {
          toast.error(`Failed to fetch users (Status: ${response.status})`);
        }
        console.warn("Failed to load users from API, using demo data");
        setUsers(mockUsers);
        setIsLoading(false);
        return;
      }

      // Only try to parse JSON if content-type is JSON
      if (!isJson) {
        toast.error("Invalid response from server. Expected JSON but received HTML.");
        console.warn("Invalid response format, using demo data");
        setUsers(mockUsers);
        setIsLoading(false);
        return;
      }

      const data = await response.json();
      
      // Expected JSON format:
      // [
      //   {
      //     "first_name": "sathwik",
      //     "last_name": "P",
      //     "role": "user",
      //     "user_id": "sathwik.p@hcltech.com"
      //   }
      // ]
      
      // Transform the API response to match our User interface
      const transformedUsers: User[] = Array.isArray(data) ? data.map((apiUser: any, index: number) => ({
        id: apiUser.user_id || String(index + 1),
        name: `${apiUser.first_name || ""} ${apiUser.last_name || ""}`.trim() || apiUser.user_id || "Unknown",
        email: apiUser.user_id || "",
        username: apiUser.user_id ? apiUser.user_id.split("@")[0] : `user${index + 1}`,
        first_name: apiUser.first_name,
        last_name: apiUser.last_name,
        role: apiUser.role,
        user_id: apiUser.user_id,
      })) : [];
      
      setUsers(transformedUsers);
      toast.success(`Users loaded successfully! (${transformedUsers.length} user${transformedUsers.length !== 1 ? 's' : ''})`);
    } catch (error) {
      console.error("Error loading users:", error);
      // Fallback to demo data on error
      setUsers(mockUsers);
      toast.error("Failed to load users. Using demo data.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInviteUser = async (
    newMemberUserId: string,
    newMemberRole: string,
    newMemberFirstName: string,
    newMemberLastName: string
  ) => {
    setIsInviting(true);
    
    try {
      const token = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
      const currentUserEmail = userEmail || localStorage.getItem("userEmail") || "demo@example.com";
      
      if (!token) {
        toast.error("Authentication required");
        setIsInviting(false);
        return;
      }

      const response = await fetch(getApiUrl(API_ENDPOINTS.INVITE_USER), {
        method: "POST",
        headers: getAuthHeaders(token),
        body: JSON.stringify({
          user_id: currentUserEmail,
          new_member_user_id: newMemberUserId,
          new_member_role: newMemberRole,
          new_member_first_name: newMemberFirstName,
          new_member_last_name: newMemberLastName,
        }),
      });

      const data = await response.json();

      if (response.status === 200) {
        toast.success(data.message || `Email invitation has been sent to ${newMemberUserId}`);
        setShowInviteDialog(false);
        loadUsers(); // Reload the users list
      } else if (response.status === 400) {
        toast.error(data.message || "Email Server error");
      } else if (response.status === 404) {
        toast.error(data.message || "user not exist");
      } else if (response.status === 422) {
        toast.error(data.message || "new_member_user_id is a required property");
      } else if (response.status === 500) {
        toast.error(data.message || "MDB connection Error");
      } else {
        toast.error(data.message || "Failed to invite user");
      }
    } catch (error) {
      console.error("Error inviting user:", error);
      toast.error("Failed to invite user. Please try again.");
    } finally {
      setIsInviting(false);
    }
  };

  const handleResetPassword = async (newPassword: string, confirmPassword: string) => {
    if (!selectedUser) return;
    
    setIsResettingPassword(true);
    
    try {
      const token = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
      
      const response = await fetch(getApiUrl(API_ENDPOINTS.RESET_PASSWORD), {
        method: "POST",
        headers: getAuthHeaders(token),
        body: JSON.stringify({
          user_id: selectedUser.email,
          secret: "9120caof59ab4bd51b39413abe74dfa",
          new_password: newPassword,
          confirm_password: confirmPassword,
        }),
      });

      const data = await response.json();

      if (response.status === 200) {
        toast.success(data.message || "Successfully changed your password; you can now login");
        setShowResetPasswordDialog(false);
        setSelectedUser(null);
      } else if (response.status === 401) {
        toast.error(data.message || "Password not matched with expected pattern");
      } else if (response.status === 422) {
        toast.error(data.message || "Confirm_password is a required property");
      } else if (response.status === 500) {
        toast.error(data.message || "MDB Connection Error");
      } else {
        toast.error(data.message || "Failed to reset password");
      }
    } catch (error) {
      console.error("Error resetting password:", error);
      toast.error("Failed to reset password. Please try again.");
    } finally {
      setIsResettingPassword(false);
    }
  };

  const handleDeleteUser = async (user: User) => {
    // Check if current user is admin
    if (!isAdmin()) {
      toast.error("Only admin users can delete users");
      return;
    }

    // Confirm deletion
    const confirmed = window.confirm(
      `Are you sure you want to delete user "${user.name}" (${user.email})?\n\nThis action cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    setIsDeletingUser(true);
    
    try {
      const token = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
      
      if (!token) {
        toast.error("Authentication required");
        setIsDeletingUser(false);
        return;
      }

      const response = await fetch(getApiUrl(API_ENDPOINTS.DELETE_USER), {
        method: "POST",
        headers: getAuthHeaders(token),
        body: JSON.stringify({
          user_id: user.email || user.user_id,
        }),
      });

      // Check if response is JSON
      const contentType = response.headers.get("content-type");
      const isJson = contentType && contentType.includes("application/json");

      if (response.status === 200) {
        const data = isJson ? await response.json() : {};
        toast.success(data.message || `User ${user.email} has been deleted successfully`);
        loadUsers(); // Reload the users list
      } else if (response.status === 401) {
        const data = isJson ? await response.json() : {};
        toast.error(data.message || "Unauthorized - Only admin users can delete users");
      } else if (response.status === 404) {
        const data = isJson ? await response.json() : {};
        toast.error(data.message || "User not found");
      } else if (response.status === 422) {
        const data = isJson ? await response.json() : {};
        toast.error(data.message || "user_id is a required property");
      } else if (response.status === 500) {
        const data = isJson ? await response.json() : {};
        toast.error(data.message || "MDB Connection Error");
      } else {
        const data = isJson ? await response.json() : {};
        toast.error(data.message || "Failed to delete user");
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Failed to delete user. Please try again.");
    } finally {
      setIsDeletingUser(false);
    }
  };

  const handleNavigate = (page: "dashboard" | "labs" | "admin") => {
    onNavigate(page);
  };

  // Filter users based on search query
  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Pane */}
      <NavigationPane
        currentPage="admin"
        userName={userName}
        onNavigate={handleNavigate}
        onLogout={onLogout}
      />

      {/* Main Content */}
      <div className="ml-[156px]">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-8 py-3 shadow-md sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <h1 className="font-semibold text-gray-800">User Management</h1>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {/* Table Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-gray-800">Users</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Manage and invite users to your organization
                  </p>
                </div>
                {isAdmin() && (
                  <Button
                    onClick={() => setShowInviteDialog(true)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <UserPlus className="size-4 mr-2" />
                    Invite User
                  </Button>
                )}
              </div>

              {/* Search Bar */}
              <div className="mt-4 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, email, or username..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-gray-500">Loading users...</div>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <p className="text-gray-500 mb-2">No users found</p>
                  {searchQuery && (
                    <p className="text-sm text-gray-400">
                      Try adjusting your search criteria
                    </p>
                  )}
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredUsers.map((user) => (
                      <tr
                        key={user.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="size-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                              <span className="text-sm font-medium text-blue-600">
                                {user.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <span className="ml-3 text-sm font-medium text-gray-900">
                              {user.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-700">{user.email}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-700">{user.username}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedUser(user);
                              setShowResetPasswordDialog(true);
                            }}
                            className="text-blue-600 border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                          >
                            <KeyRound className="size-4 mr-2" />
                            Reset Password
                          </Button>
                          {isAdmin() && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteUser(user)}
                              className="text-red-600 border-red-300 hover:bg-red-50 hover:text-red-700 ml-2"
                            >
                              <Trash2 className="size-4 mr-2" />
                              Delete User
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Table Footer */}
            {!isLoading && filteredUsers.length > 0 && (
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                <p className="text-sm text-gray-500">
                  Showing {filteredUsers.length} of {users.length} user{users.length !== 1 ? "s" : ""}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Invite User Dialog */}
      <InviteUserDialog
        isOpen={showInviteDialog}
        onClose={() => setShowInviteDialog(false)}
        onInvite={handleInviteUser}
        currentUserEmail={userEmail || localStorage.getItem("userEmail") || "demo@example.com"}
        isInviting={isInviting}
      />

      {/* Reset Password Dialog */}
      <ResetPasswordDialog
        isOpen={showResetPasswordDialog}
        onClose={() => {
          setShowResetPasswordDialog(false);
          setSelectedUser(null);
        }}
        onReset={handleResetPassword}
        user={selectedUser}
        isResetting={isResettingPassword}
      />
    </div>
  );
}