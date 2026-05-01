import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { App } from './App';

describe('<App />', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ status: 'ok', uptime: 1, timestamp: 'now' }),
        }),
      ) as unknown as typeof fetch,
    );
  });

  it('renderiza a Home na rota /', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { name: /parceriza/i })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText(/"status": "ok"/)).toBeInTheDocument());
  });
});
