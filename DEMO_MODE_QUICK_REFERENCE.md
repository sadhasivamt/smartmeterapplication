# Demo Mode Quick Reference

## 🚀 Quick Switch

### Enable Demo Mode
```typescript
// /src/config/demo.ts
export const FORCE_DEMO_MODE = true;
```
Then refresh browser - Auto-logs in automatically.

### Disable Demo Mode
```typescript
// /src/config/demo.ts
export const FORCE_DEMO_MODE = false;
```
Then refresh browser - **Automatically clears demo data!** 
Just login with real credentials.

---

## 🛠️ Console Commands

Open DevTools (F12) → Console tab:

```javascript
// Clear all demo mode data
clearDemoModeData()

// Check current demo mode status
checkDemoModeConfig()

// Manually clear storage
localStorage.clear(); sessionStorage.clear();
```

---

## ✅ Verification

**Check Console on App Load:**

Demo Mode ON:
```
⚠️  Demo Mode is ENABLED in config/demo.ts
```

Demo Mode OFF:
```
✅ Demo Mode is DISABLED in config/demo.ts
```

Lingering Demo Data:
```
⚠️  WARNING: Demo mode is still active in localStorage!
   To use real API data, run: clearDemoModeData()
```

---

## 🔧 Troubleshooting

**Problem:** Set `FORCE_DEMO_MODE = false` but still seeing mock data

**Solution:**
1. Open DevTools (F12)
2. Console tab → Run: `clearDemoModeData()`
3. Refresh page
4. Login with real credentials

---

**Problem:** Getting "API Connection Failed" error when trying to login

**Cause:** `FORCE_DEMO_MODE = false` and backend server is not running or unreachable

**Solution:**
1. Start your backend server
2. Verify API endpoint in `/src/config/api.ts`
3. Check `VITE_API_BASE_URL` environment variable
4. OR set `FORCE_DEMO_MODE = true` to use demo mode

**Note:** When `FORCE_DEMO_MODE = false`, the app will NOT automatically enable demo mode on API errors. You must have a working backend server.

---

## 📁 Key Files

- `/src/config/demo.ts` - Main configuration
- `/src/utils/demoMode.ts` - Utility functions
- `/src/config/api.ts` - API endpoints
- `/DEMO_MODE_CONFIG.md` - Full documentation