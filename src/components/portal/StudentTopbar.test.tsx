import { useState } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import StudentTopbar from './StudentTopbar';

function Harness() {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const notifications = [{ id: 'n1', text: 'Nova aula disponível', read: false, created_at: new Date().toISOString() }];
  return <><StudentTopbar activeTab="dashboard" setActiveTab={() => undefined} setCurrentPage={() => undefined} currentUser={{ id:'u1', email:'aluno@example.com', firstName:'Ana', lastName:'Silva', role:'ALUNO', status:'ACTIVE', streak:0, longestStreak:0, totalHoursLearned:0 }} onSignOut={() => undefined} isMobileSidebarOpen={false} setIsMobileSidebarOpen={() => undefined} isHighContrast={false} themeMode="light" toggleTheme={() => undefined} streakCount={0} unreadMessagesCount={0} notifications={notifications} setNotifications={() => undefined} isNotificationsOpen={notificationsOpen} setIsNotificationsOpen={setNotificationsOpen} isUserMenuOpen={profileOpen} setIsUserMenuOpen={setProfileOpen} globalSearch="" setGlobalSearch={() => undefined} handleGlobalSearchSubmit={(event) => event.preventDefault()} cardThemeClass="bg-white"/><button type="button">Área externa</button></>;
}

describe('StudentTopbar popovers', () => {
  it('dismisses notifications immediately when the user clicks outside', async () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: /notificações/i }));
    expect(screen.getByRole('dialog', { name: 'Notificações' })).toBeInTheDocument();
    fireEvent.pointerDown(screen.getByRole('button', { name: 'Área externa' }));
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Notificações' })).not.toBeInTheDocument());
  });
});
