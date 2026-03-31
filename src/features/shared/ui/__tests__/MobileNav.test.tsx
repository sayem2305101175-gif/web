import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import MobileNav from '../MobileNav';

describe('MobileNav', () => {
  it('exposes dialog semantics and closes on Escape for mobile keyboard users', () => {
    const onClose = vi.fn();

    const { rerender } = render(
      <MemoryRouter>
        <MobileNav
          isOpen
          onClose={onClose}
          setFilter={() => undefined}
          activeFilter="All"
          onOpenCart={() => undefined}
          onOpenProfile={() => undefined}
        />
      </MemoryRouter>
    );

    expect(screen.getByRole('dialog', { name: /velosnak atelier/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /faq/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /open owner panel/i })).toHaveAttribute('href', '/admin/dashboard');
    expect(document.body.style.overflow).toBe('hidden');

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);

    rerender(
      <MemoryRouter>
        <MobileNav
          isOpen={false}
          onClose={onClose}
          setFilter={() => undefined}
          activeFilter="All"
          onOpenCart={() => undefined}
          onOpenProfile={() => undefined}
        />
      </MemoryRouter>
    );

    expect(screen.getByRole('dialog', { hidden: true })).toHaveClass('invisible');
    expect(document.body.style.overflow).toBe('');
  });
});
