import { useMemo, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../auth/useAuth';
import { useData } from '../data/useData';
import {
  formatDateTime,
  fromDateTimeLocalValue,
  toDateTimeLocalValue,
} from '../utils/format';
import type { CreateSessionInput, SessionType } from '@huntledger/shared';

export function Sessions() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { data, createSession } = useData();
  const [open, setOpen] = useState(false);

  const ordered = useMemo(
    () =>
      [...data.sessions].sort(
        (a, b) => new Date(b.timestampStart).getTime() - new Date(a.timestampStart).getTime(),
      ),
    [data.sessions],
  );

  const lookupWeapon = (id: string) => data.weapons.find((w) => w.id === id);
  const lookupLocation = (id: string | undefined) =>
    id ? data.locations.find((l) => l.id === id) : undefined;

  return (
    <>
      <div className="page-header">
        <h1>{t('sessions.title')}</h1>
        <button onClick={() => setOpen((v) => !v)}>{t('sessions.create')}</button>
      </div>

      {open && user ? (
        <SessionForm
          onCancel={() => setOpen(false)}
          onSubmit={async (input) => {
            await createSession(input);
            setOpen(false);
          }}
          userId={user.id}
        />
      ) : null}

      {ordered.length === 0 ? (
        <div className="empty-state">{t('sessions.empty')}</div>
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
              <th>{t('sessions.notes')}</th>
            </tr>
          </thead>
          <tbody>
            {ordered.map((s) => (
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
                  {s.weaponIds.length === 0
                    ? t('sessions.noWeapon')
                    : s.weaponIds.map((id) => lookupWeapon(id)?.name ?? '?').join(', ')}
                </td>
                <td>{lookupLocation(s.locationId)?.name ?? <span className="muted">—</span>}</td>
                <td>{s.shotsFired ?? <span className="muted">—</span>}</td>
                <td>{s.hits ?? <span className="muted">—</span>}</td>
                <td className="muted" style={{ maxWidth: 320 }}>
                  {s.notes ?? ''}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}

interface SessionFormProps {
  userId: string;
  onCancel: () => void;
  onSubmit: (input: CreateSessionInput) => Promise<void>;
}

function SessionForm({ userId, onCancel, onSubmit }: SessionFormProps) {
  const { t } = useTranslation();
  const { data } = useData();

  const [type, setType] = useState<SessionType>('shooting');
  const [start, setStart] = useState(toDateTimeLocalValue(new Date().toISOString()));
  const [end, setEnd] = useState('');
  const [locationId, setLocationId] = useState('');
  const [weaponIds, setWeaponIds] = useState<string[]>([]);
  const [ammunitionIds, setAmmunitionIds] = useState<string[]>([]);
  const [shotsFired, setShotsFired] = useState('');
  const [hits, setHits] = useState('');
  const [notes, setNotes] = useState('');
  const [maintType, setMaintType] = useState('cleaning');
  const [maintDescription, setMaintDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const startIso = fromDateTimeLocalValue(start);
      if (!startIso) throw new Error('Invalid start time');
      const input: CreateSessionInput = {
        type,
        timestampStart: startIso,
        timestampEnd: fromDateTimeLocalValue(end),
        locationId: locationId || undefined,
        userId,
        weaponIds,
        ammunitionIds,
        dogIds: [],
        notes: notes || undefined,
        shotsFired: type === 'maintenance' || !shotsFired ? undefined : Number(shotsFired),
        hits: type === 'maintenance' || !hits ? undefined : Number(hits),
        maintenance:
          type === 'maintenance'
            ? { type: maintType, description: maintDescription || maintType }
            : undefined,
      };
      await onSubmit(input);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="card" onSubmit={handleSubmit} style={{ marginBottom: 18 }}>
      {error ? <div className="error">{error}</div> : null}
      <div className="form-grid">
        <div className="field">
          <label>{t('sessions.type')}</label>
          <select value={type} onChange={(e) => setType(e.target.value as SessionType)}>
            <option value="shooting">{t('sessions.typeShooting')}</option>
            <option value="hunt">{t('sessions.typeHunt')}</option>
            <option value="maintenance">{t('sessions.typeMaintenance')}</option>
          </select>
        </div>
        <div className="field">
          <label>{t('sessions.start')}</label>
          <input
            type="datetime-local"
            required
            value={start}
            onChange={(e) => setStart(e.target.value)}
          />
        </div>
        <div className="field">
          <label>{t('sessions.end')}</label>
          <input type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} />
        </div>
        <div className="field">
          <label>{t('sessions.location')}</label>
          <select value={locationId} onChange={(e) => setLocationId(e.target.value)}>
            <option value="">{t('sessions.noLocation')}</option>
            {data.locations.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label>{t('sessions.weapons')}</label>
          <select
            multiple
            value={weaponIds}
            onChange={(e) =>
              setWeaponIds(Array.from(e.target.selectedOptions, (o) => o.value))
            }
            style={{ minHeight: 80 }}
          >
            {data.weapons.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name} ({w.caliber})
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>{t('sessions.ammunition')}</label>
          <select
            multiple
            value={ammunitionIds}
            onChange={(e) =>
              setAmmunitionIds(Array.from(e.target.selectedOptions, (o) => o.value))
            }
            style={{ minHeight: 80 }}
          >
            {data.ammunition.map((a) => (
              <option key={a.id} value={a.id}>
                {a.brand} — {a.bulletType}
              </option>
            ))}
          </select>
        </div>

        {type !== 'maintenance' ? (
          <>
            <div className="field">
              <label>{t('sessions.shots')}</label>
              <input
                type="number"
                min={0}
                value={shotsFired}
                onChange={(e) => setShotsFired(e.target.value)}
              />
            </div>
            <div className="field">
              <label>{t('sessions.hits')}</label>
              <input
                type="number"
                min={0}
                value={hits}
                onChange={(e) => setHits(e.target.value)}
              />
            </div>
          </>
        ) : (
          <>
            <div className="field">
              <label>{t('sessions.maintenanceType')}</label>
              <input value={maintType} onChange={(e) => setMaintType(e.target.value)} />
            </div>
            <div className="field" style={{ gridColumn: '1 / -1' }}>
              <label>{t('sessions.maintenanceDescription')}</label>
              <textarea
                rows={3}
                value={maintDescription}
                onChange={(e) => setMaintDescription(e.target.value)}
              />
            </div>
          </>
        )}

        <div className="field" style={{ gridColumn: '1 / -1' }}>
          <label>{t('sessions.notes')}</label>
          <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
        <button type="submit" disabled={submitting}>
          {t('sessions.save')}
        </button>
        <button type="button" className="secondary" onClick={onCancel}>
          {t('common.cancel')}
        </button>
      </div>
    </form>
  );
}
