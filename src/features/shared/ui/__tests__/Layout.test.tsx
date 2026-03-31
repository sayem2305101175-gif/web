import { render, screen } from '@testing-library/react';
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
});
