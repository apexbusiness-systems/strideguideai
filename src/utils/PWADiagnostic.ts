/**
 * PWA Diagnostic Utility
 *
 * Comprehensive diagnostic tool to check PWA installability criteria,
 * manifest validity, service worker status, and icon availability.
 */

export interface ManifestIcon {
  src: string;
  sizes?: string;
  type?: string;
  purpose?: string;
}

export interface WebManifest {
  name?: string;
  short_name?: string;
  start_url?: string;
  display?: string;
  icons?: ManifestIcon[];
  background_color?: string;
  theme_color?: string;
  description?: string;
  [key: string]: unknown;
}

export interface ServiceWorkerDetails {
  registered: boolean;
  scope?: string;
  state?: string;
  scriptURL?: string;
}

export interface IconCheckDetails {
  found: string[];
  missing: string[];
}

export interface PWADiagnosticResult {
  isInstallable: boolean;
  criteria: {
    https: { passed: boolean; message: string };
    manifest: { passed: boolean; message: string; details?: WebManifest };
    serviceWorker: { passed: boolean; message: string; details?: ServiceWorkerDetails };
    icons: { passed: boolean; message: string; details?: IconCheckDetails };
    display: { passed: boolean; message: string };
  };
  manifest?: WebManifest;
  serviceWorker?: ServiceWorkerDetails;
  icons?: IconCheckDetails;
  errors: string[];
  warnings: string[];
}

export class PWADiagnostic {
  /**
   * Run comprehensive PWA diagnostic
   */
  static async diagnose(): Promise<PWADiagnosticResult> {
    const result: PWADiagnosticResult = {
      isInstallable: false,
      criteria: {
        https: { passed: false, message: '' },
        manifest: { passed: false, message: '' },
        serviceWorker: { passed: false, message: '' },
        icons: { passed: false, message: '' },
        display: { passed: false, message: '' },
      },
      errors: [],
      warnings: [],
    };

    // Check HTTPS
    result.criteria.https = this.checkHTTPS();

    // Check Manifest
    try {
      result.criteria.manifest = await this.checkManifest();
      result.manifest = result.criteria.manifest.details;
    } catch (error) {
      result.criteria.manifest = {
        passed: false,
        message: `Manifest check failed: ${error instanceof Error ? error.message : String(error)}`,
      };
      result.errors.push(`Manifest error: ${error instanceof Error ? error.message : String(error)}`);
    }

    // Check Service Worker
    try {
      result.criteria.serviceWorker = await this.checkServiceWorker();
      result.serviceWorker = result.criteria.serviceWorker.details;
    } catch (error) {
      result.criteria.serviceWorker = {
        passed: false,
        message: `Service worker check failed: ${error instanceof Error ? error.message : String(error)}`,
      };
      result.errors.push(`Service worker error: ${error instanceof Error ? error.message : String(error)}`);
    }

    // Check Icons
    try {
      result.criteria.icons = await this.checkIcons(result.manifest);
      result.icons = result.criteria.icons.details;
    } catch (error) {
      result.criteria.icons = {
        passed: false,
        message: `Icon check failed: ${error instanceof Error ? error.message : String(error)}`,
      };
      result.errors.push(`Icon error: ${error instanceof Error ? error.message : String(error)}`);
    }

    // Check Display Mode
    result.criteria.display = this.checkDisplayMode(result.manifest);

    // Determine overall installability
    result.isInstallable =
      result.criteria.https.passed &&
      result.criteria.manifest.passed &&
      result.criteria.serviceWorker.passed &&
      result.criteria.icons.passed &&
      result.criteria.display.passed;

    return result;
  }

  /**
   * Check if site is served over HTTPS
   */
  static checkHTTPS(): { passed: boolean; message: string } {
    const isHTTPS = window.location.protocol === 'https:' || window.location.hostname === 'localhost';
    return {
      passed: isHTTPS,
      message: isHTTPS
        ? 'Site is served over HTTPS'
        : 'Site must be served over HTTPS for PWA installability',
    };
  }

  /**
   * Check manifest validity and required fields
   */
  static async checkManifest(): Promise<{ passed: boolean; message: string; details?: WebManifest }> {
    const manifestLink = document.querySelector('link[rel="manifest"]');
    if (!manifestLink) {
      return {
        passed: false,
        message: 'Manifest link not found in HTML',
      };
    }

    const manifestHref = manifestLink.getAttribute('href');
    if (!manifestHref) {
      return {
        passed: false,
        message: 'Manifest link has no href attribute',
      };
    }

    try {
      const response = await fetch(manifestHref);
      if (!response.ok) {
        return {
          passed: false,
          message: `Manifest file not accessible: ${response.status} ${response.statusText}`,
        };
      }

      const manifest = await response.json() as WebManifest;

      // Check required fields
      const requiredFields = ['name', 'short_name', 'start_url', 'display', 'icons'];
      const missingFields = requiredFields.filter((field) => !manifest[field]);

      if (missingFields.length > 0) {
        return {
          passed: false,
          message: `Manifest missing required fields: ${missingFields.join(', ')}`,
          details: manifest,
        };
      }

      // Check icons array
      if (!Array.isArray(manifest.icons) || manifest.icons.length === 0) {
        return {
          passed: false,
          message: 'Manifest icons array is missing or empty',
          details: manifest,
        };
      }

      // Check for at least one icon with 192x192 or larger
      const hasValidIcon = manifest.icons.some((icon: ManifestIcon) => {
        const sizes = icon.sizes?.split(' ') || [];
        return sizes.some((size: string) => {
          const dimension = parseInt(size.split('x')[0], 10);
          return dimension >= 192;
        });
      });

      if (!hasValidIcon) {
        return {
          passed: false,
          message: 'Manifest must include at least one icon of 192x192 or larger',
          details: manifest,
        };
      }

      return {
        passed: true,
        message: 'Manifest is valid and contains all required fields',
        details: manifest,
      };
    } catch (error) {
      return {
        passed: false,
        message: `Failed to fetch or parse manifest: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * Check service worker registration
   */
  static async checkServiceWorker(): Promise<{ passed: boolean; message: string; details?: ServiceWorkerDetails }> {
    if (!('serviceWorker' in navigator)) {
      return {
        passed: false,
        message: 'Service Worker API not supported in this browser',
      };
    }

    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      const controller = navigator.serviceWorker.controller;

      if (registrations.length === 0 && !controller) {
        return {
          passed: false,
          message: 'No service worker registered',
        };
      }

      const activeRegistration = registrations.find((reg) => reg.active) || registrations[0];
      const swDetails = {
        registered: registrations.length > 0,
        scope: activeRegistration?.scope,
        state: activeRegistration?.active?.state || controller?.state,
        scriptURL: activeRegistration?.active?.scriptURL || controller?.scriptURL,
      };

      return {
        passed: true,
        message: `Service worker is registered (scope: ${swDetails.scope})`,
        details: swDetails,
      };
    } catch (error) {
      return {
        passed: false,
        message: `Service worker check failed: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * Check icon availability
   */
  static async checkIcons(manifest?: WebManifest): Promise<{ passed: boolean; message: string; details?: IconCheckDetails }> {
    if (!manifest || !manifest.icons) {
      return {
        passed: false,
        message: 'Manifest not available for icon check',
      };
    }

    const found: string[] = [];
    const missing: string[] = [];

    for (const icon of manifest.icons) {
      try {
        const response = await fetch(icon.src, { method: 'HEAD' });
        if (response.ok) {
          found.push(icon.src);
        } else {
          missing.push(icon.src);
        }
      } catch {
        missing.push(icon.src);
      }
    }

    const hasRequiredIcons = found.length >= 2; // At least 192x192 and 512x512

    return {
      passed: hasRequiredIcons,
      message: hasRequiredIcons
        ? `Icons found: ${found.length}/${manifest.icons.length}`
        : `Missing icons: ${missing.length} icon(s) not accessible`,
      details: {
        found,
        missing,
      },
    };
  }

  /**
   * Check display mode
   */
  static checkDisplayMode(manifest?: WebManifest): { passed: boolean; message: string } {
    if (!manifest) {
      return {
        passed: false,
        message: 'Manifest not available for display mode check',
      };
    }

    const validDisplayModes = ['standalone', 'fullscreen', 'minimal-ui'];
    const display = manifest.display || 'browser';

    if (!validDisplayModes.includes(display)) {
      return {
        passed: false,
        message: `Display mode "${display}" is not optimal for PWA. Use: ${validDisplayModes.join(', ')}`,
      };
    }

    return {
      passed: true,
      message: `Display mode is set to "${display}"`,
    };
  }

  /**
   * Get install prompt availability
   */
  static async checkInstallPrompt(): Promise<{ available: boolean; deferredPrompt?: Event }> {
    if (!('BeforeInstallPromptEvent' in window)) {
      return { available: false };
    }

    // Check if there's a deferred prompt
    let deferredPrompt: Event | null = null;
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
    });

    return {
      available: deferredPrompt !== null,
      deferredPrompt: deferredPrompt || undefined,
    };
  }

  /**
   * Format diagnostic result for console output
   */
  static formatResult(result: PWADiagnosticResult): string {
    const lines: string[] = [];
    lines.push('=== PWA Diagnostic Report ===');
    lines.push(`Overall Status: ${result.isInstallable ? '✅ INSTALLABLE' : '❌ NOT INSTALLABLE'}`);
    lines.push('');
    lines.push('Criteria:');
    lines.push(`  HTTPS: ${result.criteria.https.passed ? '✅' : '❌'} ${result.criteria.https.message}`);
    lines.push(`  Manifest: ${result.criteria.manifest.passed ? '✅' : '❌'} ${result.criteria.manifest.message}`);
    lines.push(`  Service Worker: ${result.criteria.serviceWorker.passed ? '✅' : '❌'} ${result.criteria.serviceWorker.message}`);
    lines.push(`  Icons: ${result.criteria.icons.passed ? '✅' : '❌'} ${result.criteria.icons.message}`);
    lines.push(`  Display Mode: ${result.criteria.display.passed ? '✅' : '❌'} ${result.criteria.display.message}`);

    if (result.errors.length > 0) {
      lines.push('');
      lines.push('Errors:');
      result.errors.forEach((error) => lines.push(`  ❌ ${error}`));
    }

    if (result.warnings.length > 0) {
      lines.push('');
      lines.push('Warnings:');
      result.warnings.forEach((warning) => lines.push(`  ⚠️ ${warning}`));
    }

    return lines.join('\n');
  }
}

// Make available globally for debugging
declare global {
  interface Window {
    PWADiagnostic: typeof PWADiagnostic;
  }
}

if (typeof window !== 'undefined') {
  window.PWADiagnostic = PWADiagnostic;
}



