import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import Navbar from './Navbar';

vi.mock('./auth/AuthProvider', () => ({ useAuth: () => ({ user: null, signOut: vi.fn() }) }));

describe('Navbar mobile navigation', () => {
  it('is closed initially and opens, closes with Escape, and updates aria-expanded', () => {
    render(<Navbar currentPage="home" setCurrentPage={vi.fn()} onOpenSignUp={vi.fn()} />);
    const toggle = screen.getByRole('button', { name: /alternar menu/i });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('dialog', { name: /menu de navegação/i })).not.toBeInTheDocument();
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('dialog', { name: /menu de navegação/i })).toBeInTheDocument();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('dialog', { name: /menu de navegação/i })).not.toBeInTheDocument();
  });

  it('closes after selecting a navigation link', () => {
    const setCurrentPage = vi.fn();
    render(<Navbar currentPage="home" setCurrentPage={setCurrentPage} onOpenSignUp={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /alternar menu/i }));
    fireEvent.click(screen.getAllByRole('button', { name: 'Cursos' }).at(-1)!);
    expect(setCurrentPage).toHaveBeenCalledWith('courses');
    expect(screen.queryByRole('dialog', { name: /menu de navegação/i })).not.toBeInTheDocument();
  });
});
