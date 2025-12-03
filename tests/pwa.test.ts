/**
 * PWA Validation Tests
 * 
 * Automated tests to prevent PWA regression by validating:
 * - Manifest exists and is valid JSON
 * - Manifest link exists in HTML
 * - Service worker file exists
 * - Icons exist and are accessible
 * - Required manifest fields are present
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

describe('PWA Validation', () => {
  const publicDir = join(process.cwd(), 'public');
  const srcDir = join(process.cwd(), 'src');
  const rootDir = process.cwd();

  describe('Manifest File', () => {
    it('should exist at public/manifest.webmanifest', () => {
      const manifestPath = join(publicDir, 'manifest.webmanifest');
      expect(existsSync(manifestPath)).toBe(true);
    });

    it('should be valid JSON', () => {
      const manifestPath = join(publicDir, 'manifest.webmanifest');
      const manifestContent = readFileSync(manifestPath, 'utf-8');
      
      expect(() => {
        JSON.parse(manifestContent);
      }).not.toThrow();
    });

    it('should contain required fields', () => {
      const manifestPath = join(publicDir, 'manifest.webmanifest');
      const manifestContent = readFileSync(manifestPath, 'utf-8');
      const manifest = JSON.parse(manifestContent);

      // Required fields per PWA spec
      expect(manifest).toHaveProperty('name');
      expect(manifest).toHaveProperty('short_name');
      expect(manifest).toHaveProperty('start_url');
      expect(manifest).toHaveProperty('display');
      expect(manifest).toHaveProperty('icons');
    });

    it('should have valid display mode', () => {
      const manifestPath = join(publicDir, 'manifest.webmanifest');
      const manifestContent = readFileSync(manifestPath, 'utf-8');
      const manifest = JSON.parse(manifestContent);

      const validDisplayModes = ['standalone', 'fullscreen', 'minimal-ui'];
      expect(validDisplayModes).toContain(manifest.display);
    });

    it('should have at least one icon with 192x192 or larger', () => {
      const manifestPath = join(publicDir, 'manifest.webmanifest');
      const manifestContent = readFileSync(manifestPath, 'utf-8');
      const manifest = JSON.parse(manifestContent);

      expect(Array.isArray(manifest.icons)).toBe(true);
      expect(manifest.icons.length).toBeGreaterThan(0);

      const hasValidIcon = manifest.icons.some((icon: any) => {
        const sizes = icon.sizes?.split(' ') || [];
        return sizes.some((size: string) => {
          const dimension = parseInt(size.split('x')[0], 10);
          return dimension >= 192;
        });
      });

      expect(hasValidIcon).toBe(true);
    });

    it('should have StrideGuide branding', () => {
      const manifestPath = join(publicDir, 'manifest.webmanifest');
      const manifestContent = readFileSync(manifestPath, 'utf-8');
      const manifest = JSON.parse(manifestContent);

      // Check that it's StrideGuide
      expect(manifest.name).toContain('StrideGuide');
      expect(manifest.short_name).toContain('StrideGuide');
      
      // Check that it does NOT contain TradeLine branding
      expect(manifest.name).not.toMatch(/TradeLine|24\/7/i);
    });
  });

  describe('HTML Manifest Link', () => {
    it('should have manifest link in index.html', () => {
      const indexPath = join(rootDir, 'index.html');
      const htmlContent = readFileSync(indexPath, 'utf-8');
      
      expect(htmlContent).toContain('<link rel="manifest"');
      expect(htmlContent).toContain('href="/manifest.webmanifest"');
    });
  });

  describe('Service Worker', () => {
    it('should have service worker file at public/app/sw.js', () => {
      const swPath = join(publicDir, 'app', 'sw.js');
      expect(existsSync(swPath)).toBe(true);
    });

    it('should have service worker registration in src/sw/register.ts', () => {
      const registerPath = join(srcDir, 'sw', 'register.ts');
      expect(existsSync(registerPath)).toBe(true);
      
      const registerContent = readFileSync(registerPath, 'utf-8');
      expect(registerContent).toContain('serviceWorker.register');
    });

    it('should have StrideGuide branding in service worker', () => {
      const swPath = join(publicDir, 'app', 'sw.js');
      const swContent = readFileSync(swPath, 'utf-8');
      
      // Check that it's StrideGuide
      expect(swContent).toContain('StrideGuide');
      // Check that it does NOT contain TradeLine branding
      expect(swContent).not.toMatch(/TradeLine|24\/7/i);
    });
  });

  describe('Icons', () => {
    it('should have icon files referenced in manifest', () => {
      const manifestPath = join(publicDir, 'manifest.webmanifest');
      const manifestContent = readFileSync(manifestPath, 'utf-8');
      const manifest = JSON.parse(manifestContent);

      for (const icon of manifest.icons) {
        const iconPath = join(publicDir, icon.src.replace(/^\//, ''));
        expect(existsSync(iconPath)).toBe(true);
      }
    });
  });

  describe('HTML Meta Tags', () => {
    it('should have StrideGuide branding in title', () => {
      const indexPath = join(rootDir, 'index.html');
      const htmlContent = readFileSync(indexPath, 'utf-8');
      
      expect(htmlContent).toContain('StrideGuide');
      expect(htmlContent).not.toMatch(/TradeLine|24\/7/i);
    });

    it('should have application-name meta tag', () => {
      const indexPath = join(rootDir, 'index.html');
      const htmlContent = readFileSync(indexPath, 'utf-8');
      
      expect(htmlContent).toContain('<meta name="application-name"');
    });

    it('should have apple-mobile-web-app-capable meta tag', () => {
      const indexPath = join(rootDir, 'index.html');
      const htmlContent = readFileSync(indexPath, 'utf-8');
      
      expect(htmlContent).toContain('<meta name="apple-mobile-web-app-capable"');
    });
  });
});



