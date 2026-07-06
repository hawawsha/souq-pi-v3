# Souq Pi v2.1.0 Upgrade Guide

## Overview
This document outlines all changes made to upgrade Souq Pi to v2.1.0, including dependency upgrades, API migrations, and configuration updates.

## What's New in v2.1.0

### 🚀 Major Updates

#### 1. **Stellar SDK Migration**
- **Old:** `stellar-sdk` v13.3.0
- **New:** `@stellar/stellar-sdk` v13.5.0
- **Impact:** Better maintenance, official Stellar organization package

**Breaking Changes:**
```javascript
// OLD API (deprecated)
const StellarSdk = require('stellar-sdk');
const server = new StellarSdk.Server(horizonUrl);
await server.fetchBaseFee();
await server.fetchTimebounds(180);

// NEW API (v13.5.0)
const StellarSdk = require('@stellar/stellar-sdk');
const server = new StellarSdk.Horizon.Server(horizonUrl);
const response = await server.feeStats().call();
const baseFee = response.last_ledger_base_fee;
// Timebounds now inline in TransactionBuilder
```

#### 2. **Dependency Upgrades**
| Package | Old Version | New Version | Change |
|---------|------------|------------|--------|
| axios | ^1.6.0 | ^1.7.7 | +8 minor versions |
| mongoose | ^8.0.0 | ^8.5.5 | +5 minor versions |
| winston | ^3.11.0 | ^3.14.2 | +3 minor versions |
| jsonwebtoken | ^9.0.0 | ^9.1.2 | +1 minor version |
| helmet | ^7.1.0 | ^7.2.0 | +1 minor version |
| dotenv | ^16.3.0 | ^16.4.5 | +1 minor version |
| eslint | ^8.54.0 | ^9.15.0 | +7 minor versions |
| next | ^16.2.10 | ^16.2.10 | No change |
| react | ^18.2.0 | ^18.3.1 | +1 minor version |
| react-dom | ^18.2.0 | ^18.3.1 | +1 minor version |

#### 3. **Node.js Engine Update**
- **Old Requirement:** `>=18.0.0`
- **New Requirement:** `>=18.17.0`
- **Reason:** Better LTS support and security patches

### 📝 Configuration Changes

#### Environment Variables
**DEPRECATED (no longer required):**
- `PI_APP_SECRET` - Removed from requirements

**Still REQUIRED:**
- `PI_APP_ID`
- `PI_API_KEY`

**New behavior in `lib/pi-config.js`:**
- Simplified `validateNetwork()` function
- Only checks for `PI_APP_ID` and `PI_API_KEY`
- `PI_APP_SECRET` can be safely removed from `.env`

### 🔧 Code Changes

#### `lib/stellar-client.js`
**Key Changes:**
1. Package import: `stellar-sdk` → `@stellar/stellar-sdk`
2. Server initialization: `new StellarSdk.Server()` → `new StellarSdk.Horizon.Server()`
3. Account loading: Now properly constructs `StellarSdk.Account` object
4. Fee calculation: `fetchBaseFee()` → `feeStats().call()`
5. Timebounds: Now inline in `TransactionBuilder` instead of separate call
6. Memo handling: Text memos limited to 28 characters (Stellar network limit)

#### `lib/pi-config.js`
**Key Changes:**
1. Removed `PI_APP_SECRET` from required variables
2. Consolidated API Base URL to single endpoint: `https://api.minepi.com`
3. Added comprehensive comments explaining network detection
4. Added clarification that `PI_APP_SECRET` is deprecated

### ✅ Backward Compatibility

**Maintained:**
- ✅ All API endpoints work exactly the same
- ✅ Database schemas unchanged
- ✅ Frontend components unchanged
- ✅ Payment flow unchanged
- ✅ Refund mechanism unchanged
- ✅ Dynamic network support (testnet/mainnet)

**Not Breaking:**
- ✅ Existing `.env` files still work (PI_APP_SECRET is optional)
- ✅ All existing deployments continue to work
- ✅ No database migrations required

## Installation & Deployment

### Local Development
```bash
# Pull latest changes
git pull origin main

# Install updated dependencies
npm install

# Start development server
npm run dev
```

### Vercel Deployment
```bash
# Method 1: Automatic (recommended)
# Just push to main branch - Vercel will auto-deploy

# Method 2: Manual
vercel --prod

# Ensure environment variables are set in Vercel dashboard:
# - PI_NETWORK
# - PI_APP_ID
# - PI_API_KEY
# - (Remove PI_APP_SECRET from Vercel if present)
```

## Verification Checklist

### After Upgrade
- [ ] Run `npm install` to get new dependencies
- [ ] Build succeeds: `npm run build`
- [ ] Dev server starts: `npm run dev`
- [ ] Admin panel loads and logs in
- [ ] Can view products list
- [ ] Payment creation works
- [ ] Health check endpoint returns 200 (`/api/health`)
- [ ] No console errors in browser or server logs

### Testing Refunds (Optional)
If you use the refund system:
- [ ] Create test order
- [ ] Trigger refund
- [ ] Check logs for proper Stellar transaction handling
- [ ] Verify refund status endpoint works

## Network Configuration Examples

### Testnet
```bash
PI_NETWORK=testnet
PI_APP_ID=app_id_testnet
PI_API_KEY=api_key_testnet
SERVER_WALLET_PUBLIC_KEY=G_TESTNET...
SERVER_WALLET_SECRET_KEY=S_TESTNET...
```

### Mainnet
```bash
PI_NETWORK=mainnet
PI_APP_ID=app_id_mainnet
PI_API_KEY=api_key_mainnet
SERVER_WALLET_PUBLIC_KEY=G_MAINNET...
SERVER_WALLET_SECRET_KEY=S_MAINNET...
```

## Troubleshooting

### Issue: "Missing required environment variables: PI_API_KEY"
**Solution:** Ensure `PI_API_KEY` is set in `.env` or Vercel dashboard

### Issue: Build fails with "Cannot find module '@stellar/stellar-sdk'"
**Solution:** Run `npm install` and clear node_modules if needed:
```bash
rm -rf node_modules package-lock.json
npm install
```

### Issue: Stellar transaction fails with "Invalid memo"
**Solution:** This is now fixed in v2.1.0. Memos are automatically truncated to 28 characters.

### Issue: Old code references `stellar-sdk`
**Solution:** These have been updated in v2.1.0. If you have custom code, update imports:
```javascript
// Change from:
const StellarSdk = require('stellar-sdk');

// To:
const StellarSdk = require('@stellar/stellar-sdk');
```

## Performance Improvements

- Faster dependency resolution with optimized package versions
- Better error handling in fee retrieval (graceful fallback to 100 stroops)
- Improved transaction timebounds with 5-minute timeout
- Enhanced logging for debugging blockchain operations

## Security Updates

- Latest security patches from all core dependencies
- ESLint upgraded to v9 with latest rules
- No new security vulnerabilities introduced
- All breaking changes reviewed for security implications

## Support & Questions

If you encounter issues:
1. Check the troubleshooting section above
2. Review Git commit history: `git log --oneline | head -20`
3. Check API health: `curl https://your-domain.com/api/health`
4. Review server logs for error messages

## Migration Timeline

| Date | Milestone |
|------|-----------|
| June 6, 2026 | v2.1.0 Released |
| - | All production deployments recommended to upgrade |
| - | Support for v2.0.x ends 90 days after v2.1.0 release |

## Version History

### v2.1.0 (Current)
- Stellar SDK migration to @stellar/stellar-sdk
- All dependencies upgraded to latest stable versions
- Node.js engine updated to >=18.17.0
- Removed PI_APP_SECRET requirement

### v2.0.0
- Dynamic network support (testnet/mainnet)
- Initial production release

---

**Last Updated:** June 6, 2026
**Maintained by:** Souq Pi Development Team
