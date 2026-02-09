# Admin Users Page - API Integration Documentation

## Overview

The Admin Users page provides user management functionality with real-time API integration and automatic fallback to demo mode.

---

## 🔑 API Endpoints

### 1. Get List of Users

**Endpoint:** `GET /listofuser`

**Description:** Retrieves the list of all users in the organization

**Authentication:** Bearer Token (from login)

**Request:**
```http
GET /listofuser HTTP/1.1
Authorization: Bearer <token>
Content-Type: application/json
```

**Expected Response Format (Option 1 - Direct Array):**
```json
[
  {
    "id": "1",
    "name": "John Doe",
    "email": "john.doe@example.com",
    "username": "johndoe",
    "createdAt": "2024-01-15"
  },
  {
    "id": "2",
    "name": "Jane Smith",
    "email": "jane.smith@example.com",
    "username": "janesmith",
    "createdAt": "2024-01-18"
  }
]
```

**Expected Response Format (Option 2 - Wrapped in Object):**
```json
{
  "users": [
    {
      "id": "1",
      "name": "John Doe",
      "email": "john.doe@example.com",
      "username": "johndoe",
      "createdAt": "2024-01-15"
    }
  ]
}
```

**Expected Response Format (Option 3 - Data Property):**
```json
{
  "data": [
    {
      "id": "1",
      "name": "John Doe",
      "email": "john.doe@example.com",
      "username": "johndoe",
      "createdAt": "2024-01-15"
    }
  ]
}
```

**Response Status Codes:**
- `200 OK` - Successfully retrieved users list
- `401 Unauthorized` - Invalid or missing token
- `403 Forbidden` - User doesn't have permission to view users
- `500 Internal Server Error` - Server error

---

### 2. Invite User (Optional - For Future Implementation)

**Endpoint:** `POST /log-auth/users/invite`

**Description:** Invites a new user to the organization

**Authentication:** Bearer Token (from login)

**Request:**
```http
POST /log-auth/users/invite HTTP/1.1
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "New User",
  "email": "newuser@example.com",
  "username": "newuser"
}
```

**Response:**
```json
{
  "message": "User invited successfully",
  "userId": "3"
}
```

**Response Status Codes:**
- `200 OK` or `201 Created` - User invited successfully
- `400 Bad Request` - Invalid input data
- `401 Unauthorized` - Invalid or missing token
- `409 Conflict` - User already exists
- `500 Internal Server Error` - Server error

---

## 🔐 Authentication

The Users page uses the **Bearer Token** obtained during login. The token is stored in either:
- `localStorage.getItem("authToken")` 
- `sessionStorage.getItem("authToken")`

**Token Usage:**
```javascript
const token = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");

fetch("/listofuser", {
  method: "GET",
  headers: {
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json",
  },
});
```

---

## 📊 User Data Structure

### Required Fields:
- `id` (string) - Unique user identifier
- `name` (string) - Full name of the user
- `email` (string) - Email address
- `username` (string) - Username for login

### Optional Fields:
- `createdAt` (string, ISO date) - Date when user joined (shows as "Joined Date" column)

**TypeScript Interface:**
```typescript
interface User {
  id: string;
  name: string;
  email: string;
  username: string;
  createdAt?: string;
}
```

---

## 🎭 Demo Mode Behavior

### Mock Data (2 Users):

When the API is unavailable or in demo mode, the page shows 2 mock users:

```javascript
const mockUsers = [
  {
    id: "1",
    name: "John Doe",
    email: "john.doe@example.com",
    username: "johndoe",
    createdAt: "2024-01-15",
  },
  {
    id: "2",
    name: "Jane Smith",
    email: "jane.smith@example.com",
    username: "janesmith",
    createdAt: "2024-01-18",
  },
];
```

### Automatic Fallback:

The system automatically falls back to demo mode when:
1. `isDemoMode` prop is `true`
2. No authentication token is found
3. API request fails (network error)
4. API returns non-200 status code

---

## 🔄 API Integration Flow

### Load Users Flow:

```
1. User clicks "Admin" in navigation
         ↓
2. UsersPage component mounts
         ↓
3. useEffect triggers loadUsers()
         ↓
4. Check if in demo mode
         ↓
5a. [Demo Mode] → Show mock data (2 users)
         ↓
5b. [Real Mode] → Get token from storage
         ↓
6. Make GET request to /listofuser with Bearer token
         ↓
7a. [Success] → Parse JSON response → Display users
         ↓
7b. [Error] → Fallback to mock data (2 users)
```

### API Request Example:

```javascript
const loadUsers = async () => {
  setIsLoading(true);
  try {
    if (isDemoMode) {
      await new Promise(resolve => setTimeout(resolve, 500));
      setUsers(mockUsers);
    } else {
      const token = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
      
      const response = await fetch("/listofuser", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        
        // Handle different response structures
        let usersList = [];
        if (Array.isArray(data)) {
          usersList = data;
        } else if (data.users) {
          usersList = data.users;
        } else if (data.data) {
          usersList = data.data;
        }
        
        setUsers(usersList);
        toast.success("Users loaded successfully!");
      } else {
        setUsers(mockUsers);
        toast.info("Using demo data (API unavailable)");
      }
    }
  } catch (error) {
    setUsers(mockUsers);
    toast.info("Using demo data (Connection error)");
  } finally {
    setIsLoading(false);
  }
};
```

---

## 🧪 Testing the Integration

### Test with Real API:

1. Login with valid credentials to get the Bearer token
2. Click "Admin" in the navigation menu
3. Check browser DevTools → Network tab
4. Verify the request to `/listofuser`:
   - Method: `GET`
   - Headers: `Authorization: Bearer <token>`
   - Status: `200 OK`
5. Verify the users are displayed in the table

### Test Demo Mode:

1. Start app (auto-enables demo mode if API unavailable)
2. Click "Admin" in the navigation menu
3. Should see 2 mock users (John Doe, Jane Smith)
4. Toast notification: "Using demo data"

### Test Error Handling:

1. Remove/corrupt the authentication token
2. Click "Admin" menu
3. Should fallback to mock data
4. Toast notification: "Using demo data (API unavailable)"

---

## 📝 API Response Handling

The system handles multiple response formats:

### Format 1: Direct Array
```json
[{ "id": "1", "name": "John", ... }]
```
**Code:** `if (Array.isArray(data)) { usersList = data; }`

### Format 2: Users Property
```json
{ "users": [{ "id": "1", ... }] }
```
**Code:** `if (data.users) { usersList = data.users; }`

### Format 3: Data Property
```json
{ "data": [{ "id": "1", ... }] }
```
**Code:** `if (data.data) { usersList = data.data; }`

---

## ⚙️ Configuration

### API Endpoint Configuration:

The endpoint is currently hardcoded as `/listofuser`. To change it:

**File:** `/src/app/components/users-page.tsx`

```javascript
// Change this line:
const response = await fetch("/listofuser", {
  
// To:
const response = await fetch("/your-custom-endpoint", {
```

### Bearer Token Configuration:

Token is automatically retrieved from storage:
```javascript
const token = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
```

The token is set during login in the AuthPage component.

---

## 🐛 Troubleshooting

### Issue: "No users found"

**Possible Causes:**
1. API returned empty array
2. Token expired or invalid
3. User doesn't have permission

**Solution:**
- Check browser console for error messages
- Verify token in DevTools → Application → Local Storage
- Check API response in Network tab

### Issue: "Using demo data" message

**Possible Causes:**
1. API endpoint not configured
2. Network connection error
3. CORS issues
4. Invalid token

**Solution:**
- Check if API endpoint `/listofuser` exists
- Verify CORS headers on backend
- Check token validity
- Review backend logs

### Issue: Bearer token not being sent

**Solution:**
- Verify token exists: `localStorage.getItem("authToken")`
- Check Network tab → Request Headers → Authorization
- Ensure login was successful and token was stored

---

## 🔒 Security Notes

1. **Bearer Token:** Always transmitted via HTTPS in production
2. **Token Storage:** Consider using `sessionStorage` for sensitive applications
3. **Token Expiry:** Implement token refresh mechanism if needed
4. **CORS:** Ensure backend allows requests from frontend origin
5. **Authorization:** Backend should validate token and user permissions

---

## 📋 Summary

| Feature | Details |
|---------|---------|
| **Endpoint** | `GET /listofuser` |
| **Authentication** | Bearer Token from login |
| **Mock Data** | 2 users (John Doe, Jane Smith) |
| **Auto-Fallback** | Yes (on error, uses mock data) |
| **Response Formats** | Array, `{users:[]}`, or `{data:[]}` |
| **Token Location** | localStorage or sessionStorage |
| **Demo Mode** | Seamless, no error messages |

---

## ✅ Quick Checklist for API Integration

- [ ] Backend endpoint `/listofuser` is implemented
- [ ] Endpoint returns JSON array of users
- [ ] Each user has: id, name, email, username
- [ ] Endpoint accepts Bearer token in Authorization header
- [ ] Endpoint validates token and returns 401 if invalid
- [ ] CORS is configured to allow frontend origin
- [ ] Login endpoint stores token in localStorage/sessionStorage
- [ ] Test API with Postman/curl before integrating

---

**Last Updated:** January 28, 2025  
**Version:** 1.0
