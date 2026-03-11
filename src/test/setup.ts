
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
const MockIntersectionObserver = vi.fn(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
}));

vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
