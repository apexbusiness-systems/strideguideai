# PWA Requirements and Testing Checklist

This document outlines the requirements for Progressive Web App (PWA) functionality in StrideGuide and provides a testing checklist to prevent regression.

## Required Files and Locations

### 1. Manifest File
- **Location**: `public/manifest.webmanifest`
- **Required Fields**:
  - `name`: Full application name (e.g., "StrideGuide - AI Vision Assistant")
  - `short_name`: Short name for app launcher (e.g., "StrideGuide")
  - `start_url`: Entry point URL (e.g., "/app?source=pwa")
  - `scope`: URL scope for PWA (e.g., "/app")
  - `display`: Display mode ("standalone", "fullscreen", or "minimal-ui")
  - `icons`: Array of icon objects with at least one 192x192 or larger icon
  - `background_color`: Background color for splash screen
  - `theme_color`: Theme color for browser UI

### 2. Service Worker
- **Location**: `public/app/sw.js`
- **Registration**: `src/sw/register.ts`
- **Scope**: `/app/` (scoped to app routes only)
- **Requirements**:
  - Must register in production mode only (skips in dev)
  - Must handle cache management
  - Must support offline functionality

### 3. Icons
- **Required Sizes**: 
  - 192x192 (minimum)
  - 512x512 (recommended)
- **Current Files**: 
  - `/logo.png` (used as 192x192)
  - `/logo-optimized.png` (used as 512x512)
- **Note**: Proper PWA icons should be created with correct dimensions and maskable support

### 4. HTML Meta Tags
- **Location**: `index.html`
- **Required Tags**:
  - `<link rel="manifest" href="/manifest.webmanifest" />`
  - `<meta name="application-name" content="StrideGuide" />`
  - `<meta name="apple-mobile-web-app-capable" content="yes" />`
  - `<meta name="apple-mobile-web-app-title" content="StrideGuide" />`
  - `<meta name="theme-color" content="#3730A3" />`

## PWA Installability Criteria

For a PWA to be installable, it must meet ALL of the following criteria:

1. **HTTPS**: Site must be served over HTTPS (or localhost for development)
2. **Valid Manifest**: Manifest must exist, be valid JSON, and contain all required fields
3. **Service Worker**: Service worker must be registered and active
4. **Icons**: At least one icon of 192x192 or larger must be accessible
5. **Display Mode**: Display mode must be "standalone", "fullscreen", or "minimal-ui"

## Service Worker Registration Requirements

### Production Mode
- Service worker registers automatically on `/app` routes
- Skips registration in development mode to avoid conflicts
- Unregisters any root-level service workers on marketing pages

### Registration Logic
- Checks for service worker API support
- Registers at `/app/sw.js` with scope `/app/`
- Handles update events and notifies clients
- Emits custom events for diagnostic purposes

## Icon Requirements

### Current Implementation
- Uses existing logo files (`logo.png`, `logo-optimized.png`)
- Manifest references these files with appropriate size attributes

### Recommended Improvements
- Create dedicated PWA icons with proper dimensions
- Add maskable icons for better Android support
- Ensure icons are optimized for different display densities

## Testing Checklist

### Pre-Deployment Checks

- [ ] Manifest file exists and is valid JSON
- [ ] Manifest contains all required fields
- [ ] Manifest has StrideGuide branding
- [ ] Manifest icons reference existing files
- [ ] HTML has manifest link tag
- [ ] HTML meta tags are correct
- [ ] Service worker file exists at `public/app/sw.js`
- [ ] Service worker registration code exists in `src/sw/register.ts`
- [ ] Service worker has StrideGuide branding
- [ ] Icon files referenced in manifest exist

### Automated Tests

Run the PWA validation tests:
```bash
npm test tests/pwa.test.ts
```

Tests verify:
- Manifest file existence and validity
- Required manifest fields
- HTML manifest link
- Service worker file existence
- Service worker registration code
- Icon file existence
- Branding consistency

### Manual Testing

1. **Build and Deploy**
   ```bash
   npm run build
   ```

2. **Test in Production Environment**
   - Deploy to production (HTTPS required)
   - Navigate to `/app` route
   - Open browser DevTools → Application → Service Workers
   - Verify service worker is registered
   - Check console for service worker logs

3. **Test Installability**
   - Open Chrome DevTools → Lighthouse
   - Run PWA audit
   - Verify all criteria pass
   - Check for install prompt availability

4. **Test PWA Diagnostics Page**
   - Navigate to `/pwa-diagnostics`
   - Verify all diagnostic information displays correctly
   - Check that all criteria show as passed
   - Test refresh functionality

5. **Test Offline Functionality**
   - Install PWA
   - Enable offline mode in DevTools
   - Verify app still loads
   - Check that cached assets are served

### Browser Testing

Test in multiple browsers:
- [ ] Chrome/Edge (Chromium)
- [ ] Safari (iOS)
- [ ] Firefox (limited PWA support)

### Mobile Testing

- [ ] Test on Android device
- [ ] Test on iOS device
- [ ] Verify install prompt appears
- [ ] Verify app installs correctly
- [ ] Verify app launches in standalone mode

## Common Issues and Solutions

### Service Worker Not Registering
- **Cause**: Running in development mode
- **Solution**: Service worker only registers in production builds

### Manifest Not Found
- **Cause**: Manifest file missing or incorrect path
- **Solution**: Verify `public/manifest.webmanifest` exists and HTML link is correct

### Icons Not Loading
- **Cause**: Icon files missing or incorrect paths
- **Solution**: Verify icon files exist at paths specified in manifest

### Install Prompt Not Appearing
- **Cause**: Not all installability criteria met
- **Solution**: Use PWA diagnostics page to identify missing criteria

## Regression Prevention

### Automated Validation
- PWA tests run in CI/CD pipeline
- Tests fail build if critical PWA files are missing or invalid
- Tests verify branding consistency

### Code Review Checklist
- [ ] Manifest changes reviewed for required fields
- [ ] Service worker changes reviewed for scope and caching
- [ ] Icon changes reviewed for size and format
- [ ] HTML meta tag changes reviewed for PWA compatibility

## Diagnostic Tools

### PWA Diagnostics Page
- **URL**: `/pwa-diagnostics`
- **Features**:
  - Real-time diagnostic information
  - Installability criteria status
  - Service worker details
  - Manifest validation
  - Icon availability
  - Install prompt status

### Browser DevTools
- **Application Tab**: Service Workers, Manifest, Storage
- **Lighthouse**: PWA audit
- **Console**: Service worker logs

### Programmatic Access
```typescript
import { PWADiagnostic } from '@/utils/PWADiagnostic';

// Run diagnostics
const result = await PWADiagnostic.diagnose();
console.log(PWADiagnostic.formatResult(result));
```

## Maintenance

### Regular Checks
- Run PWA tests before each release
- Verify installability in production after deployment
- Monitor service worker registration errors
- Check for manifest validation warnings

### Updates
- Update service worker cache version when assets change
- Update manifest version when app features change
- Keep icons up to date with branding changes

## References

- [Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [PWA Checklist](https://web.dev/pwa-checklist/)
- [Lighthouse PWA Audit](https://developers.google.com/web/tools/lighthouse)



