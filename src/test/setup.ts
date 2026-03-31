
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock model-viewer since it's a web component not supported in jsdom
class MockModelViewer extends HTMLElement {
  cameraOrbit = '0deg 75deg 105%';
  cameraTarget = 'auto auto auto';
  fieldOfView = 'auto';
  jumpCameraToGoal = vi.fn();
  resetTurntableRotation = vi.fn();
}

if (!customElements.get('model-viewer')) {
  customElements.define('model-viewer', MockModelViewer);
}

// Mock IntersectionObserver
class MockIntersectionObserver implements IntersectionObserver {
  readonly root = null;
  readonly rootMargin = '0px';
  readonly thresholds = [0];

  private readonly callback: IntersectionObserverCallback;

  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
  }

  observe = vi.fn((target: Element) => {
    this.callback(
      [
        {
          isIntersecting: true,
          target,
        } as IntersectionObserverEntry,
      ],
      this
    );
  });

  unobserve = vi.fn();
  disconnect = vi.fn();
  takeRecords = vi.fn(() => []);
}

vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
