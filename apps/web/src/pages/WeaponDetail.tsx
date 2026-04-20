import { useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useData } from '../data/useData';
import { formatDateTime } from '../utils/format';

export function WeaponDetail() {
  const { id } = useParams<{ id: string }>();
  const { data } = useData();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const weapon = data.weapons.find((w) => w.id === id);
  const sessions = useMemo(
    () =>
      data.sessions
        .filter((s) => weapon && s.weaponIds.includes(weapon.id))
        .sort(
          (a, b) =>
            new Date(b.timestampStart).getTime() - new Date(a.timestampStart).getTime(),
        ),
    [data.sessions, weapon],
  );

  if (!weapon) {
    return (
      <>
        <button className="secondary" onClick={() => navigate('/weapons')}>
          ← {t('weapons.back')}
        </button>
        <div className="empty-state" style={{ marginTop: 18 }}>
          {t('weapons.empty')}
        </div>
      </>
    );
  }

  const totalShots = sessions.reduce((acc, s) => acc + (s.shotsFired ?? 0), 0);
  const maintenance = sessions.filter((s) => s.type === 'maintenance');
  const fieldSessions = sessions.filter((s) => s.type !== 'maintenance');

  return (
    <>
      <Link to="/weapons" className="muted" style={{ fontSize: '0.85rem' }}>
        ← {t('weapons.back')}
      </Link>
      <div className="page-header">
        <div>
          <h1>{weapon.name}</h1>
          <div className="muted">
            {t('weapons.type_' + weapon.type)} · {weapon.caliber} · {weapon.serialNumber}
          </div>
        </div>
      </div>

      <div className="stat-grid">
        <div className="card">
          <div className="label">{t('weapons.totalShots')}</div>
          <div className="value">{totalShots}</div>
        </div>
        <div className="card">
          <div className="label">{t('weapons.totalSessions')}</div>
          <div className="value">{sessions.length}</div>
        </div>
      </div>

      <h2>{t('weapons.history')}</h2>
      {fieldSessions.length === 0 ? (
        <div className="empty-state">{t('sessions.empty')}</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>{t('sessions.start')}</th>
              <th>{t('sessions.type')}</th>
              <th>{t('sessions.shots')}</th>
              <th>{t('sessions.hits')}</th>
              <th>{t('sessions.notes')}</th>
            </tr>
          </thead>
          <tbody>
            {fieldSessions.map((s) => (
              <tr key={s.id}>
                <td>{formatDateTime(s.timestampStart, i18n.resolvedLanguage ?? 'sv')}</td>
                <td>
                  <span className={'badge ' + s.type}>
                    {t(s.type === 'hunt' ? 'sessions.typeHunt' : 'sessions.typeShooting')}
                  </span>
                </td>
                <td>{s.shotsFired ?? '—'}</td>
                <td>{s.hits ?? '—'}</td>
                <td className="muted">{s.notes ?? ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h2 style={{ marginTop: 24 }}>{t('weapons.maintenanceLog')}</h2>
      {maintenance.length === 0 ? (
        <div className="empty-state">{t('weapons.noMaintenance')}</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>{t('sessions.start')}</th>
              <th>{t('sessions.maintenanceType')}</th>
              <th>{t('sessions.maintenanceDescription')}</th>
            </tr>
          </thead>
          <tbody>
            {maintenance.map((s) => (
              <tr key={s.id}>
                <td>{formatDateTime(s.timestampStart, i18n.resolvedLanguage ?? 'sv')}</td>
                <td>{s.maintenance?.type ?? ''}</td>
                <td className="muted">{s.maintenance?.description ?? ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
