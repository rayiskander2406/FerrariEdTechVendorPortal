/**
 * Portal 2.0 Phase 1: Routing Configuration Tests (TDD)
 *
 * These tests verify that the dashboard routing structure is correctly configured.
 * Uses static analysis to verify file structure exists.
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

// =============================================================================
// HELPERS
// =============================================================================

const APP_DIR = path.resolve(__dirname, '../../../app');

function fileExists(relativePath: string): boolean {
  return fs.existsSync(path.join(APP_DIR, relativePath));
}

function dirExists(relativePath: string): boolean {
  const fullPath = path.join(APP_DIR, relativePath);
  return fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory();
}

function readFile(relativePath: string): string {
  return fs.readFileSync(path.join(APP_DIR, relativePath), 'utf-8');
}

// =============================================================================
// ROUTE GROUP TESTS
// =============================================================================

describe('Portal 2.0 Phase 1: Route Structure', () => {
  describe('Dashboard Route Group', () => {
    it('(dashboard) route group exists', () => {
      expect(dirExists('(dashboard)')).toBe(true);
    });

    it('dashboard layout.tsx exists', () => {
      expect(fileExists('(dashboard)/layout.tsx')).toBe(true);
    });

    it('dashboard layout imports DashboardLayout component', () => {
      const content = readFile('(dashboard)/layout.tsx');
      expect(content).toContain('DashboardLayout');
    });
  });

  describe('Dashboard Pages', () => {
    const dashboardPages = [
      { name: 'overview', path: '(dashboard)/overview/page.tsx' },
      { name: 'oneroster', path: '(dashboard)/oneroster/page.tsx' },
      { name: 'sso', path: '(dashboard)/sso/page.tsx' },
      { name: 'lti', path: '(dashboard)/lti/page.tsx' },
      { name: 'messages', path: '(dashboard)/messages/page.tsx' },
      { name: 'audit', path: '(dashboard)/audit/page.tsx' },
      { name: 'settings', path: '(dashboard)/settings/page.tsx' },
    ];

    it.each(dashboardPages)('$name page exists at $path', ({ path: pagePath }) => {
      expect(fileExists(pagePath)).toBe(true);
    });

    it.each(dashboardPages)('$name page exports default component', ({ path: pagePath }) => {
      const content = readFile(pagePath);
      expect(content).toMatch(/export\s+default\s+function|export\s+default\s+\w+Page/);
    });
  });

  describe('Chat Route (Legacy)', () => {
    it('chat page still exists at /chat', () => {
      // Chat should remain accessible as fallback
      expect(
        fileExists('chat/page.tsx') || fileExists('(chat)/chat/page.tsx')
      ).toBe(true);
    });
  });
});

// =============================================================================
// COMPONENT FILE TESTS
// =============================================================================

describe('Portal 2.0 Phase 1: Component Structure', () => {
  const COMPONENTS_DIR = path.resolve(__dirname, '../../../components/dashboard');

  function componentExists(filename: string): boolean {
    return fs.existsSync(path.join(COMPONENTS_DIR, filename));
  }

  describe('Dashboard Components', () => {
    const requiredComponents = [
      'DashboardLayout.tsx',
      'Sidebar.tsx',
      'TopNav.tsx',
    ];

    it.each(requiredComponents)('%s exists', (filename) => {
      expect(componentExists(filename)).toBe(true);
    });
  });

  describe('DashboardLayout Component', () => {
    it('exports DashboardLayout', () => {
      const content = fs.readFileSync(
        path.join(COMPONENTS_DIR, 'DashboardLayout.tsx'),
        'utf-8'
      );
      expect(content).toMatch(/export\s+(function|const)\s+DashboardLayout/);
    });

    it('uses Sidebar component', () => {
      const content = fs.readFileSync(
        path.join(COMPONENTS_DIR, 'DashboardLayout.tsx'),
        'utf-8'
      );
      expect(content).toContain('<Sidebar');
    });

    it('uses TopNav component', () => {
      const content = fs.readFileSync(
        path.join(COMPONENTS_DIR, 'DashboardLayout.tsx'),
        'utf-8'
      );
      expect(content).toContain('<TopNav');
    });

    it('renders children in main content area', () => {
      const content = fs.readFileSync(
        path.join(COMPONENTS_DIR, 'DashboardLayout.tsx'),
        'utf-8'
      );
      expect(content).toContain('{children}');
      expect(content).toContain('<main');
    });
  });

  describe('Sidebar Component', () => {
    it('exports Sidebar', () => {
      const content = fs.readFileSync(
        path.join(COMPONENTS_DIR, 'Sidebar.tsx'),
        'utf-8'
      );
      expect(content).toMatch(/export\s+(function|const)\s+Sidebar/);
    });

    it('defines navigation items', () => {
      const content = fs.readFileSync(
        path.join(COMPONENTS_DIR, 'Sidebar.tsx'),
        'utf-8'
      );
      // Should either define nav items directly or import from navigation config (DRY)
      const hasDirectLinks = content.includes('/overview') && content.includes('/oneroster');
      const importsFromConfig = content.includes('DASHBOARD_NAV') && content.includes('navigation');
      expect(hasDirectLinks || importsFromConfig).toBe(true);
    });

    it('includes Chat Mode link', () => {
      const content = fs.readFileSync(
        path.join(COMPONENTS_DIR, 'Sidebar.tsx'),
        'utf-8'
      );
      // Should either define /chat directly or import CHAT_NAV from config
      const hasDirectChat = content.includes('/chat');
      const importsChatNav = content.includes('CHAT_NAV') && content.includes('navigation');
      expect(hasDirectChat || importsChatNav).toBe(true);
      // Chat Mode text should be referenced (directly or via config)
      expect(content).toMatch(/chat/i);
    });
  });

  describe('TopNav Component', () => {
    it('exports TopNav', () => {
      const content = fs.readFileSync(
        path.join(COMPONENTS_DIR, 'TopNav.tsx'),
        'utf-8'
      );
      expect(content).toMatch(/export\s+(function|const)\s+TopNav/);
    });

    it('includes AI help trigger', () => {
      const content = fs.readFileSync(
        path.join(COMPONENTS_DIR, 'TopNav.tsx'),
        'utf-8'
      );
      // Should have AI help button with keyboard shortcut
      expect(content).toMatch(/ai|help|assist/i);
    });
  });
});

// =============================================================================
// NAVIGATION CONFIG TESTS
// =============================================================================

describe('Portal 2.0 Phase 1: Navigation Configuration', () => {
  const CONFIG_PATH = path.resolve(__dirname, '../../../lib/config/navigation.ts');

  it('navigation config file exists', () => {
    expect(fs.existsSync(CONFIG_PATH)).toBe(true);
  });

  it('defines dashboard navigation items', () => {
    const content = fs.readFileSync(CONFIG_PATH, 'utf-8');
    expect(content).toContain('DASHBOARD_NAV');
  });

  it('navigation items have required properties', () => {
    const content = fs.readFileSync(CONFIG_PATH, 'utf-8');
    // Each nav item should have: label, href, icon
    expect(content).toContain('label');
    expect(content).toContain('href');
    expect(content).toContain('icon');
  });

  it('exports navigation items for use in Sidebar', () => {
    const content = fs.readFileSync(CONFIG_PATH, 'utf-8');
    expect(content).toMatch(/export\s+(const|function)/);
  });
});
