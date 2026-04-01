import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import Layout from '../Layout';

describe('Layout', () => {
  it('does not expose the developer debugger in the default app shell', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<div>Storefront route</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Storefront route')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /dev debugger/i })).not.toBeInTheDocument();
  });

  it('exposes a skip link that moves focus to main content', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<div>Storefront route</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    const skipLink = screen.getByRole('link', { name: /skip to main content/i });
    const main = screen.getByRole('main');

    fireEvent.click(skipLink);

    expect(skipLink).toHaveAttribute('href', '#main-content');
    expect(main).toHaveAttribute('id', 'main-content');
    expect(main).toHaveFocus();
  });
});
