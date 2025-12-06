/**
 * TEST-01: JSDOM Environment Tests
 *
 * Tests that verify jsdom environment is properly configured
 * for React component testing.
 *
 * @vitest-environment jsdom
 */

import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';

describe('TEST-01: JSDOM Environment for Components', () => {
  describe('Browser Globals', () => {
    it('should have window defined in jsdom', () => {
      expect(typeof window).toBe('object');
      expect(window).not.toBeNull();
    });

    it('should have document defined in jsdom', () => {
      expect(typeof document).toBe('object');
      expect(document).not.toBeNull();
    });

    it('should have document.body', () => {
      expect(document.body).toBeInstanceOf(HTMLElement);
    });

    it('should have navigator defined', () => {
      expect(typeof navigator).toBe('object');
    });

    it('should have localStorage defined', () => {
      expect(typeof localStorage).toBe('object');
      expect(typeof localStorage.getItem).toBe('function');
    });
  });

  describe('React Testing Library', () => {
    it('should render a simple component', () => {
      const TestComponent = () => <div data-testid="test">Hello Test</div>;

      render(<TestComponent />);

      expect(screen.getByTestId('test')).toBeInTheDocument();
      expect(screen.getByText('Hello Test')).toBeInTheDocument();
    });

    it('should render with children', () => {
      const Parent = ({ children }: { children: React.ReactNode }) => (
        <div data-testid="parent">{children}</div>
      );

      render(
        <Parent>
          <span>Child content</span>
        </Parent>
      );

      expect(screen.getByTestId('parent')).toBeInTheDocument();
      expect(screen.getByText('Child content')).toBeInTheDocument();
    });

    it('should support className and style', () => {
      const StyledComponent = () => (
        <div
          data-testid="styled"
          className="test-class"
          style={{ color: 'red' }}
        >
          Styled
        </div>
      );

      render(<StyledComponent />);

      const element = screen.getByTestId('styled');
      expect(element).toHaveClass('test-class');
      expect(element).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });
  });

  describe('DOM Manipulation', () => {
    it('should support document.createElement', () => {
      const div = document.createElement('div');
      div.textContent = 'Dynamic';
      document.body.appendChild(div);

      expect(document.body.textContent).toContain('Dynamic');

      // Cleanup
      document.body.removeChild(div);
    });

    it('should support querySelector', () => {
      render(<div id="query-test">Query Target</div>);

      const element = document.querySelector('#query-test');
      expect(element).not.toBeNull();
      expect(element?.textContent).toBe('Query Target');
    });
  });

  describe('Node.js Compatibility', () => {
    it('should still have process.env in jsdom', () => {
      expect(typeof process).toBe('object');
      expect(typeof process.env).toBe('object');
      expect(process.env.NODE_ENV).toBe('test');
    });

    it('should have path alias working', async () => {
      // Path aliases should work in jsdom too
      const { isTest } = await import('@/lib/config/env');
      expect(typeof isTest).toBe('function');
    });
  });
});
