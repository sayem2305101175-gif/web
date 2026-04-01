import type { RefObject } from 'react';
import { useInViewportOnce } from './useInViewportOnce';
import { useReducedMotion } from './useReducedMotion';

interface UseScrollRevealResult<T extends Element> {
  isRevealed: boolean;
  revealClassName: string;
  targetRef: RefObject<T | null>;
}

export function useScrollReveal<T extends Element>(rootMargin?: string): UseScrollRevealResult<T> {
  const prefersReducedMotion = useReducedMotion();
  const { isInViewport, targetRef } = useInViewportOnce<T>(rootMargin);
  const isRevealed = prefersReducedMotion || isInViewport;

  return {
    isRevealed,
    revealClassName: prefersReducedMotion ? '' : isInViewport ? 'fade-in-up-enter' : 'fade-in-up-ready',
    targetRef,
  };
}
