import { useState } from "react";
import { X, UserPlus } from "lucide-react";
import { Button } from "./ui/button";

interface InviteUserDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onInvite: (
    newMemberUserId: string,
    newMemberRole: string,
    newMemberFirstName: string,
    newMemberLastName: string
  ) => void;
  currentUserEmail: string;
  isInviting: boolean;
}

export function InviteUserDialog({ 
  isOpen, 
  onClose, 
  onInvite, 
  currentUserEmail,
  isInviting 
}: InviteUserDialogProps) {
  const [newMemberUserId, setNewMemberUserId] = useState("");
  const [newMemberRole, setNewMemberRole] = useState("User");
  const [newMemberFirstName, setNewMemberFirstName] = useState("");
  const [newMemberLastName, setNewMemberLastName] = useState("");
  const [errors, setErrors] = useState<{ 
    email?: string; 
    firstName?: string; 
    lastName?: string;
  }>({});

  if (!isOpen) return null;

  const validateForm = () => {
    const newErrors: { email?: string; firstName?: string; lastName?: string } = {};

    // Validate email
    if (!newMemberUserId.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newMemberUserId)) {
      newErrors.email = "Please enter a valid email address";
    } else if (newMemberUserId === currentUserEmail) {
      newErrors.email = "You cannot invite yourself";
    }

    // Validate first name
    if (!newMemberFirstName.trim()) {
      newErrors.firstName = "First name is required";
    }

    // Validate last name
    if (!newMemberLastName.trim()) {
      newErrors.lastName = "Last name is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      onInvite(newMemberUserId, newMemberRole, newMemberFirstName, newMemberLastName);
      // Reset form
      setNewMemberUserId("");
      setNewMemberRole("User");
      setNewMemberFirstName("");
      setNewMemberLastName("");
      setErrors({});
    }
  };

  const handleClose = () => {
    setNewMemberUserId("");
    setNewMemberRole("User");
    setNewMemberFirstName("");
    setNewMemberLastName("");
    setErrors({});
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-blue-100 flex items-center justify-center">
              <UserPlus className="size-4 text-blue-600" />
            </div>
            <h2 className="font-semibold text-gray-800">Invite User</h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              id="email"
              type="email"
              value={newMemberUserId}
              onChange={(e) => {
                setNewMemberUserId(e.target.value);
                if (errors.email) setErrors({ ...errors, email: undefined });
              }}
              placeholder="Enter email address"
              disabled={isInviting}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:bg-gray-50 ${
                errors.email ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.email && (
              <p className="text-sm text-red-500 mt-1">{errors.email}</p>
            )}
          </div>

          {/* First Name Field */}
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
              First Name <span className="text-red-500">*</span>
            </label>
            <input
              id="firstName"
              type="text"
              value={newMemberFirstName}
              onChange={(e) => {
                setNewMemberFirstName(e.target.value);
                if (errors.firstName) setErrors({ ...errors, firstName: undefined });
              }}
              placeholder="Enter first name"
              disabled={isInviting}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:bg-gray-50 ${
                errors.firstName ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.firstName && (
              <p className="text-sm text-red-500 mt-1">{errors.firstName}</p>
            )}
          </div>

          {/* Last Name Field */}
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
              Last Name <span className="text-red-500">*</span>
            </label>
            <input
              id="lastName"
              type="text"
              value={newMemberLastName}
              onChange={(e) => {
                setNewMemberLastName(e.target.value);
                if (errors.lastName) setErrors({ ...errors, lastName: undefined });
              }}
              placeholder="Enter last name"
              disabled={isInviting}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:bg-gray-50 ${
                errors.lastName ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.lastName && (
              <p className="text-sm text-red-500 mt-1">{errors.lastName}</p>
            )}
          </div>

          {/* Role Field */}
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <select
              id="role"
              value={newMemberRole}
              onChange={(e) => setNewMemberRole(e.target.value)}
              disabled={isInviting}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300 disabled:opacity-50 disabled:bg-gray-50"
            >
              <option value="User">User</option>
              <option value="Admin">Admin</option>
            </select>
          </div>

          {/* Info Message */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              An invitation email will be sent to the user with instructions to set up their account.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1"
              disabled={isInviting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              disabled={isInviting}
            >
              <UserPlus className="size-4 mr-2" />
              {isInviting ? "Sending..." : "Send Invitation"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}