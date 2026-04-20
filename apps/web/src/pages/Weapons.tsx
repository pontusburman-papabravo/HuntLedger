import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useData } from '../data/useData';
import { formatDate } from '../utils/format';
import type { CreateWeaponInput, WeaponType } from '@huntledger/shared';

export function Weapons() {
  const { t, i18n } = useTranslation();
  const { data, createWeapon } = useData();
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="page-header">
        <h1>{t('weapons.title')}</h1>
        <button onClick={() => setOpen((v) => !v)}>{t('weapons.create')}</button>
      </div>

      {open ? (
        <WeaponForm
          onCancel={() => setOpen(false)}
          onSubmit={async (input) => {
            await createWeapon(input);
            setOpen(false);
          }}
        />
      ) : null}

      {data.weapons.length === 0 ? (
        <div className="empty-state">{t('weapons.empty')}</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>{t('weapons.name')}</th>
              <th>{t('weapons.type')}</th>
              <th>{t('weapons.caliber')}</th>
              <th>{t('weapons.serialNumber')}</th>
              <th>{t('weapons.createdAt')}</th>
            </tr>
          </thead>
          <tbody>
            {data.weapons.map((w) => (
              <tr key={w.id}>
                <td>
                  <Link to={`/weapons/${w.id}`}>{w.name}</Link>
                </td>
                <td>{t('weapons.type_' + w.type)}</td>
                <td>{w.caliber}</td>
                <td className="muted">{w.serialNumber}</td>
                <td className="muted">
                  {formatDate(w.createdAt, i18n.resolvedLanguage ?? 'sv')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}

interface WeaponFormProps {
  onCancel: () => void;
  onSubmit: (input: CreateWeaponInput) => Promise<void>;
}

function WeaponForm({ onCancel, onSubmit }: WeaponFormProps) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [type, setType] = useState<WeaponType>('rifle');
  const [caliber, setCaliber] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await onSubmit({ name, type, caliber, serialNumber });
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
          <label>{t('weapons.name')}</label>
          <input required value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="field">
          <label>{t('weapons.type')}</label>
          <select value={type} onChange={(e) => setType(e.target.value as WeaponType)}>
            <option value="rifle">{t('weapons.type_rifle')}</option>
            <option value="shotgun">{t('weapons.type_shotgun')}</option>
            <option value="handgun">{t('weapons.type_handgun')}</option>
            <option value="air_rifle">{t('weapons.type_air_rifle')}</option>
            <option value="other">{t('weapons.type_other')}</option>
          </select>
        </div>
        <div className="field">
          <label>{t('weapons.caliber')}</label>
          <input required value={caliber} onChange={(e) => setCaliber(e.target.value)} />
        </div>
        <div className="field">
          <label>{t('weapons.serialNumber')}</label>
          <input
            required
            value={serialNumber}
            onChange={(e) => setSerialNumber(e.target.value)}
          />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
        <button type="submit" disabled={submitting}>
          {t('weapons.save')}
        </button>
        <button type="button" className="secondary" onClick={onCancel}>
          {t('common.cancel')}
        </button>
      </div>
    </form>
  );
}
