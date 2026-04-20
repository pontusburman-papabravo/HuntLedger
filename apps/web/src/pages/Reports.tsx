import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useData } from '../data/useData';
import { downloadCsv, toCsv } from '../utils/csv';
import { formatDateTime } from '../utils/format';

export function Reports() {
  const { t, i18n } = useTranslation();
  const { data } = useData();

  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [weaponId, setWeaponId] = useState('');
  const [locationId, setLocationId] = useState('');

  const filtered = useMemo(() => {
    const fromTs = from ? new Date(from).getTime() : -Infinity;
    const toTs = to ? new Date(to).getTime() + 24 * 60 * 60 * 1000 - 1 : Infinity;
    return data.sessions
      .filter((s) => {
        const ts = new Date(s.timestampStart).getTime();
        if (ts < fromTs || ts > toTs) return false;
        if (weaponId && !s.weaponIds.includes(weaponId)) return false;
        if (locationId && s.locationId !== locationId) return false;
        return true;
      })
      .sort(
        (a, b) =>
          new Date(b.timestampStart).getTime() - new Date(a.timestampStart).getTime(),
      );
  }, [data.sessions, from, to, weaponId, locationId]);

  const handleExport = () => {
    const rows = filtered.map((s) => ({
      id: s.id,
      type: s.type,
      timestampStart: s.timestampStart,
      timestampEnd: s.timestampEnd ?? '',
      location: data.locations.find((l) => l.id === s.locationId)?.name ?? '',
      weapons: s.weaponIds
        .map((id) => data.weapons.find((w) => w.id === id)?.name ?? id)
        .join(' | '),
      ammunition: s.ammunitionIds
        .map((id) => data.ammunition.find((a) => a.id === id)?.brand ?? id)
        .join(' | '),
      shotsFired: s.shotsFired ?? '',
      hits: s.hits ?? '',
      notes: s.notes ?? '',
    }));
    const csv = toCsv(rows, [
      'id',
      'type',
      'timestampStart',
      'timestampEnd',
      'location',
      'weapons',
      'ammunition',
      'shotsFired',
      'hits',
      'notes',
    ]);
    downloadCsv(`huntledger-sessions-${new Date().toISOString().slice(0, 10)}.csv`, csv);
  };

  return (
    <>
      <div className="page-header">
        <h1>{t('reports.title')}</h1>
        <button onClick={handleExport} disabled={filtered.length === 0}>
          {t('reports.exportCsv')}
        </button>
      </div>

      <div className="card" style={{ marginBottom: 18 }}>
        <h3>{t('reports.filters')}</h3>
        <div className="toolbar">
          <div className="field">
            <label>{t('reports.from')}</label>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="field">
            <label>{t('reports.to')}</label>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <div className="field">
            <label>{t('reports.weapon')}</label>
            <select value={weaponId} onChange={(e) => setWeaponId(e.target.value)}>
              <option value="">{t('reports.any')}</option>
              {data.weapons.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>{t('reports.location')}</label>
            <select value={locationId} onChange={(e) => setLocationId(e.target.value)}>
              <option value="">{t('reports.any')}</option>
              {data.locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <h3>{t('reports.results', { count: filtered.length })}</h3>
      {filtered.length === 0 ? (
        <div className="empty-state">{t('reports.empty')}</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>{t('sessions.start')}</th>
              <th>{t('sessions.type')}</th>
              <th>{t('sessions.weapon')}</th>
              <th>{t('sessions.location')}</th>
              <th>{t('sessions.shots')}</th>
              <th>{t('sessions.hits')}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => (
              <tr key={s.id}>
                <td>{formatDateTime(s.timestampStart, i18n.resolvedLanguage ?? 'sv')}</td>
                <td>
                  <span className={'badge ' + s.type}>
                    {t(
                      s.type === 'hunt'
                        ? 'sessions.typeHunt'
                        : s.type === 'shooting'
                          ? 'sessions.typeShooting'
                          : 'sessions.typeMaintenance',
                    )}
                  </span>
                </td>
                <td>
                  {s.weaponIds
                    .map((id) => data.weapons.find((w) => w.id === id)?.name ?? '?')
                    .join(', ') || <span className="muted">—</span>}
                </td>
                <td>
                  {data.locations.find((l) => l.id === s.locationId)?.name ?? (
                    <span className="muted">—</span>
                  )}
                </td>
                <td>{s.shotsFired ?? <span className="muted">—</span>}</td>
                <td>{s.hits ?? <span className="muted">—</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
