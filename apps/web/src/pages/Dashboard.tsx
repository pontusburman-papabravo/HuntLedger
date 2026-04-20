import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useAuth } from '../auth/useAuth';
import { useData } from '../data/useData';
import { groupSessionsByWeek } from '../utils/aggregate';

export function Dashboard() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { data } = useData();

  const totals = useMemo(() => {
    const totalShots = data.sessions.reduce((acc, s) => acc + (s.shotsFired ?? 0), 0);
    const totalHits = data.sessions.reduce((acc, s) => acc + (s.hits ?? 0), 0);
    return {
      sessions: data.sessions.length,
      shots: totalShots,
      hits: totalHits,
      hitRate: totalShots > 0 ? Math.round((totalHits / totalShots) * 100) : 0,
    };
  }, [data.sessions]);

  const weekly = useMemo(
    () => groupSessionsByWeek(data.sessions, i18n.resolvedLanguage ?? 'sv'),
    [data.sessions, i18n.resolvedLanguage],
  );

  const isEmpty = data.sessions.length === 0;

  return (
    <>
      <div className="page-header">
        <div>
          <h1>{t('dashboard.title')}</h1>
          <div className="muted">{t('dashboard.welcome', { name: user?.name ?? '' })}</div>
        </div>
      </div>

      <div className="stat-grid">
        <div className="card">
          <div className="label">{t('dashboard.totalSessions')}</div>
          <div className="value">{totals.sessions}</div>
        </div>
        <div className="card">
          <div className="label">{t('dashboard.totalShots')}</div>
          <div className="value">{totals.shots}</div>
        </div>
        <div className="card">
          <div className="label">{t('dashboard.totalHits')}</div>
          <div className="value">{totals.hits}</div>
        </div>
        <div className="card">
          <div className="label">{t('dashboard.hitRate')}</div>
          <div className="value">{totals.hitRate}%</div>
        </div>
      </div>

      {isEmpty ? (
        <div className="empty-state">{t('dashboard.noData')}</div>
      ) : (
        <div className="chart-grid">
          <div className="card">
            <h3>{t('dashboard.sessionsOverTime')}</h3>
            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer>
                <LineChart data={weekly} margin={{ top: 10, right: 20, bottom: 4, left: -10 }}>
                  <CartesianGrid stroke="#eee" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="sessions"
                    stroke="var(--primary)"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card">
            <h3>{t('dashboard.shotsOverTime')}</h3>
            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer>
                <BarChart data={weekly} margin={{ top: 10, right: 20, bottom: 4, left: -10 }}>
                  <CartesianGrid stroke="#eee" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="shots" fill="var(--accent)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
