import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import FooterSection from '../FooterSection';

describe('FooterSection', () => {
  it('surfaces shopper quick links and a deliberate studio entry', () => {
    render(
      <MemoryRouter>
        <FooterSection
          shippingContent={{ title: 'Shipping', message: 'Ships in 1 to 2 business days.' }}
          returnsContent={{ title: 'Returns', message: 'Simple exchanges within 14 days.' }}
        />
      </MemoryRouter>
    );

    expect(screen.getByRole('button', { name: /collection/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^faq$/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /open studio/i })).toHaveAttribute('href', '/admin/dashboard');
  });
});
