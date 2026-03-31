import * as React from 'react';

interface UseInViewportOnceResult<T extends Element> {
  isInViewport: boolean;
  targetRef: React.RefObject<T | null>;
}

export function useInViewportOnce<T extends Element>(rootMargin = '220px'): UseInViewportOnceResult<T> {
  const targetRef = React.useRef<T | null>(null);
  const [isInViewport, setIsInViewport] = React.useState(false);

  React.useEffect(() => {
    if (isInViewport) {
      return;
    }

    const node = targetRef.current;
    if (!node) {
      return;
    }

    if (typeof window === 'undefined' || typeof window.IntersectionObserver === 'undefined') {
      setIsInViewport(true);
      return;
    }

    const callback: IntersectionObserverCallback = ([entry], observer) => {
      if (entry?.isIntersecting) {
        setIsInViewport(true);
        observer.disconnect();
      }
    };

    const observerOptions: IntersectionObserverInit = { rootMargin, threshold: 0.08 };
    const Observer = window.IntersectionObserver;
    let observer: IntersectionObserver | null = null;

    try {
      observer = new Observer(callback, observerOptions);
    } catch {
      const fallbackObserverFactory = Observer as unknown as (
        callback: IntersectionObserverCallback,
        options?: IntersectionObserverInit
      ) => IntersectionObserver;
      try {
        observer = fallbackObserverFactory(callback, observerOptions);
      } catch {
        setIsInViewport(true);
        return;
      }
    }

    if (!observer || typeof observer.observe !== 'function') {
      setIsInViewport(true);
      return;
    }

    observer.observe(node);

    return () => observer?.disconnect();
  }, [isInViewport, rootMargin]);

  return { isInViewport, targetRef };
}
