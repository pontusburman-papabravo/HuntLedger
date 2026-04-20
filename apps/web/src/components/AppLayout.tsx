import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../auth/useAuth';
import { LanguageToggle } from './LanguageToggle';

export function AppLayout() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const navItem = ({ isActive }: { isActive: boolean }) => (isActive ? 'active' : '');

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">{t('app.name')}</div>
        <div className="tagline">{t('app.tagline')}</div>

        <NavLink to="/" end className={navItem}>
          {t('nav.dashboard')}
        </NavLink>
        <NavLink to="/sessions" className={navItem}>
          {t('nav.sessions')}
        </NavLink>
        <NavLink to="/weapons" className={navItem}>
          {t('nav.weapons')}
        </NavLink>
        <NavLink to="/ammunition" className={navItem}>
          {t('nav.ammunition')}
        </NavLink>
        <NavLink to="/reports" className={navItem}>
          {t('nav.reports')}
        </NavLink>

        <div className="spacer" />

        <div className="user-block">
          <div>{user?.name}</div>
          <div className="muted" style={{ fontSize: '0.8rem' }}>
            {user?.email}
          </div>
          <button
            type="button"
            className="ghost"
            style={{ marginTop: 10, color: 'var(--primary-fg)' }}
            onClick={handleLogout}
          >
            {t('nav.logout')}
          </button>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <LanguageToggle />
        </header>
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
