# API Configuration Guide

This application requires API endpoints to function properly. Follow the instructions below to configure your API connection.

## Error: "Invalid response from server. Expected JSON but received HTML"

This error occurs when the API endpoint returns HTML (typically a 404 error page) instead of JSON. This means the API endpoint is not accessible or doesn't exist.

## Configuration Options

### Option 1: Environment Variable (Recommended for Production)

1. Create a `.env` file in the root directory (copy from `.env.example`):
   ```bash
   cp .env.example .env
   ```

2. Set your API base URL:
   ```env
   VITE_API_BASE_URL=https://your-api-server.com
   ```

3. Restart your development server

### Option 2: Vite Proxy (Recommended for Development)

If your API is on a different domain during development, use a proxy to avoid CORS issues:

1. Open `vite.config.ts`

2. Uncomment the `server.proxy` section

3. Replace `https://your-api-server.com` with your actual API server URL:
   ```typescript
   server: {
     proxy: {
       '/log-auth': {
         target: 'https://your-api-server.com',
         changeOrigin: true,
         secure: false,
       },
       '/device-inventory': {
         target: 'https://your-api-server.com',
         changeOrigin: true,
         secure: false,
       },
       '/log-collector': {
         target: 'https://your-api-server.com',
         changeOrigin: true,
         secure: false,
       },
     },
   }
   ```

4. Restart your development server

### Option 3: Same Domain Deployment

If your API and frontend are deployed on the same domain, no configuration is needed. The app will use relative URLs.

## API Endpoints Required

The application expects the following endpoints:

### 1. Authentication
- **Endpoint**: `/log-auth/login`
- **Method**: POST
- **Request Body**:
  ```json
  {
    "user_id": "user@example.com",
    "password": "password123"
  }
  ```
- **Response**:
  ```json
  {
    "token": "jwt-token-here"
  }
  ```

### 2. Lab Inventory
- **Endpoint**: `/device-inventory/get_lab_inventory`
- **Method**: GET
- **Headers**: `Authorization: Bearer {token}`
- **Response**:
  ```json
  [
    {
      "lab_id": "andromada",
      "lab_name": "andromada"
    }
  ]
  ```

### 3. Device Inventory
- **Endpoint**: `/device-inventory/get_all_lls_inventory?lab_id={lab_id}`
- **Method**: POST
- **Headers**: `Authorization: Bearer {token}`
- **Request Body**:
  ```json
  {
    "lab_id": "andromada",
    "ch_type": "Kaifa"
  }
  ```
- **Response**:
  ```json
  [
    {
      "lab_id": "andromada",
      "cabinet_id": "a01",
      "host_name": "device-1",
      "host_ip": "192.168.1.1",
      "ch_type": "Kaifa",
      "is_active": true
    }
  ]
  ```

### 4. Log Collection
- **Endpoint**: `/log-collector/start_log_collection`
- **Method**: POST
- **Headers**: `Authorization: Bearer {token}`
- **Request Body**:
  ```json
  {
    "transaction_id": "uuid-here",
    "lab_id": "andromada",
    "cabinet_id": "a01",
    "start_time": "2023-09-28 19:04:35+0000",
    "stop_time": "2023-09-28 20:04:35+0000",
    "task_desc": "Task description here"
  }
  ```

### 5. Log Collections List
- **Endpoint**: `/log-collector/get_log_collections`
- **Method**: POST
- **Headers**: `Authorization: Bearer {token}`
- **Request Body**:
  ```json
  {
    "filters": {},
    "sort": {
      "start_time": 1
    },
    "limit": 20,
    "next_page_key": {
      "id": "68c9393db4cc394460108e8c",
      "start_time": "2023-09-28 19:04:35+0000"
    }
  }
  ```

## Testing the Configuration

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Try to login with valid credentials

3. If you see the error again, check:
   - Is the API server running?
   - Is the URL correct in `.env` or `vite.config.ts`?
   - Can you access the API endpoint in your browser or Postman?
   - Are there any CORS issues? (Check browser console)

## Troubleshooting

### Error: "Authentication endpoint not found"
- Check that the API server is running
- Verify the API URL is correct
- Check that the endpoint path is `/log-auth/login`

### Error: "CORS policy blocked"
- Use the Vite proxy configuration (Option 2)
- Or configure CORS headers on your API server

### Error: "Invalid or missing token"
- The JWT token has expired
- Login again to get a fresh token

## Need Help?

If you're still having issues, please check:
1. Browser developer console for detailed errors
2. Network tab to see the actual request/response
3. API server logs for errors
