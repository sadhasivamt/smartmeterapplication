# API Configuration with Environment Variables

This application now uses a centralized API configuration system that reads all endpoint URLs from environment variables.

## Configuration File

All API endpoint configurations are centralized in `/src/config/api.ts`.

## Environment Variables

### Setup

1. **Create a `.env` file** in the root directory:
   ```bash
   cp .env.example .env
   ```

2. **Configure your API endpoints** in the `.env` file:
   ```env
   # API Base URL (leave empty for relative URLs)
   VITE_API_BASE_URL=

   # Authentication Endpoints
   VITE_API_LOGIN=/log-auth/login
   VITE_API_LOGOUT=/log-auth/logout
   VITE_API_USER_LIST=/log-auth/user_list
   VITE_API_INVITE_USER=/log-auth/invite_user
   VITE_API_RESET_PASSWORD=/log-auth/reset_forgot_password

   # Device Inventory Endpoints
   VITE_API_LAB_INVENTORY=/device-inventory/get_lab_inventory
   VITE_API_LAB_DETAILS=/device-inventory/get_lab_details
   VITE_API_DEVICE_INVENTORY=/device-inventory/get_all_lls_inventory

   # Log Collector Endpoints
   VITE_API_START_LOG_COLLECTION=/log-collector/start_log_collection
   VITE_API_GET_LOG_COLLECTIONS=/log-collector/get_log_collections
   ```

3. **Restart the development server** for changes to take effect:
   ```bash
   npm run dev
   ```

## API Endpoints Configuration

### Base URL

- **Variable**: `VITE_API_BASE_URL`
- **Purpose**: Sets the base URL for all API calls
- **Options**:
  - **Empty** (default): Uses relative URLs for same-domain deployment
  - **Full URL**: e.g., `https://logging.taf.smartdcc.co.uk` for cross-domain API

### Authentication Endpoints

| Endpoint | Variable | Default Value | Method |
|----------|----------|---------------|--------|
| Login | `VITE_API_LOGIN` | `/log-auth/login` | POST |
| Logout | `VITE_API_LOGOUT` | `/log-auth/logout` | GET |
| User List | `VITE_API_USER_LIST` | `/log-auth/user_list` | GET |
| Invite User | `VITE_API_INVITE_USER` | `/log-auth/invite_user` | POST |
| Reset Password | `VITE_API_RESET_PASSWORD` | `/log-auth/reset_forgot_password` | POST |

### Device Inventory Endpoints

| Endpoint | Variable | Default Value | Method |
|----------|----------|---------------|--------|
| Lab Inventory | `VITE_API_LAB_INVENTORY` | `/device-inventory/get_lab_inventory` | GET |
| Lab Details | `VITE_API_LAB_DETAILS` | `/device-inventory/get_lab_details` | GET |
| Device Inventory | `VITE_API_DEVICE_INVENTORY` | `/device-inventory/get_all_lls_inventory` | POST |

### Log Collector Endpoints

| Endpoint | Variable | Default Value | Method |
|----------|----------|---------------|--------|
| Start Log Collection | `VITE_API_START_LOG_COLLECTION` | `/log-collector/start_log_collection` | POST |
| Get Log Collections | `VITE_API_GET_LOG_COLLECTIONS` | `/log-collector/get_log_collections` | POST |

## Usage in Code

### Importing

```typescript
import { API_ENDPOINTS, getApiUrl, getAuthHeaders } from "../../config/api";
```

### Making API Calls

#### Simple Endpoint

```typescript
const response = await fetch(getApiUrl(API_ENDPOINTS.LOGIN), {
  method: "POST",
  headers: getAuthHeaders(),
  body: JSON.stringify({ user_id: email, password: password }),
});
```

#### Endpoint with Query Parameters

```typescript
const response = await fetch(getApiUrl(API_ENDPOINTS.LAB_DETAILS, { lab_id: "andromeda" }), {
  method: "GET",
  headers: getAuthHeaders(),
});
```

#### Custom Token

```typescript
const token = "custom-token";
const response = await fetch(getApiUrl(API_ENDPOINTS.USER_LIST), {
  method: "GET",
  headers: getAuthHeaders(token),
});
```

## Helper Functions

### `getApiUrl(endpoint, params?)`

Builds the complete API URL with optional query parameters.

**Parameters:**
- `endpoint`: The API endpoint path (from `API_ENDPOINTS`)
- `params`: Optional object with query parameters

**Returns:** Complete URL string

**Example:**
```typescript
getApiUrl(API_ENDPOINTS.LAB_DETAILS, { lab_id: "andromeda" })
// Returns: "/device-inventory/get_lab_details?lab_id=andromeda"
```

### `getAuthHeaders(token?)`

Returns headers object with Bearer token authentication.

**Parameters:**
- `token`: Optional token to use (otherwise reads from localStorage/sessionStorage)

**Returns:** HeadersInit object with Content-Type and Authorization

**Example:**
```typescript
getAuthHeaders()
// Returns: { "Content-Type": "application/json", "Authorization": "Bearer <token>" }
```

## Components Updated

The following components now use the centralized API configuration:

1. **App.tsx** - Logout endpoint
2. **auth-page.tsx** - Login endpoint
3. **labs-page.tsx** - Lab inventory and lab details endpoints
4. **users-page.tsx** - User list endpoint
5. **invite-user-dialog.tsx** - Invite user endpoint (to be updated)
6. **reset-password-dialog.tsx** - Reset password endpoint (to be updated)
7. **dashboard-page.tsx** - Log collections endpoint (to be updated)
8. **set-details-page.tsx** - Device inventory and log collection endpoints (to be updated)

## Benefits

✅ **Centralized Configuration**: All endpoints in one place  
✅ **Environment-Based**: Easy to configure per environment (dev, staging, prod)  
✅ **Type Safety**: TypeScript autocomplete for endpoints  
✅ **DRY Principle**: No hardcoded URLs scattered across components  
✅ **Easy Maintenance**: Change endpoint once, updates everywhere  
✅ **Query Parameters**: Built-in support for URL parameters  
✅ **Authentication**: Automatic Bearer token headers  

## Deployment

### Production

For production deployment, set the `VITE_API_BASE_URL` in your CI/CD pipeline or hosting platform:

```bash
VITE_API_BASE_URL=https://logging.taf.smartdcc.co.uk
```

### Docker

Update your `Dockerfile` or docker-compose.yml to pass environment variables:

```dockerfile
ENV VITE_API_BASE_URL=https://logging.taf.smartdcc.co.uk
```

### Nginx Proxy

If using nginx as a reverse proxy, you can leave `VITE_API_BASE_URL` empty and configure nginx to proxy API requests.

## Troubleshooting

### Changes not taking effect

- Restart the development server after modifying `.env`
- Clear browser cache and localStorage
- Check browser console for the actual URLs being called

### CORS Issues

- Set `VITE_API_BASE_URL` to empty and configure Vite proxy in `vite.config.ts`
- Or configure CORS headers on your API server

### 404 Errors

- Verify the endpoint paths in `.env` match your actual API
- Check that `VITE_API_BASE_URL` is correct (with or without trailing slash)
