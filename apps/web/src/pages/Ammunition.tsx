import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useData } from '../data/useData';
import type { CreateAmmunitionInput } from '@huntledger/shared';

export function Ammunition() {
  const { t } = useTranslation();
  const { data, createAmmunition } = useData();
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="page-header">
        <h1>{t('ammunition.title')}</h1>
        <button onClick={() => setOpen((v) => !v)}>{t('ammunition.create')}</button>
      </div>

      {open ? (
        <AmmoForm
          onCancel={() => setOpen(false)}
          onSubmit={async (input) => {
            await createAmmunition(input);
            setOpen(false);
          }}
        />
      ) : null}

      {data.ammunition.length === 0 ? (
        <div className="empty-state">{t('ammunition.empty')}</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>{t('ammunition.brand')}</th>
              <th>{t('ammunition.caliber')}</th>
              <th>{t('ammunition.bulletType')}</th>
            </tr>
          </thead>
          <tbody>
            {data.ammunition.map((a) => (
              <tr key={a.id}>
                <td>{a.brand}</td>
                <td>{a.caliber}</td>
                <td>{a.bulletType}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}

interface AmmoFormProps {
  onCancel: () => void;
  onSubmit: (input: CreateAmmunitionInput) => Promise<void>;
}

function AmmoForm({ onCancel, onSubmit }: AmmoFormProps) {
  const { t } = useTranslation();
  const [brand, setBrand] = useState('');
  const [caliber, setCaliber] = useState('');
  const [bulletType, setBulletType] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await onSubmit({ brand, caliber, bulletType });
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
          <label>{t('ammunition.brand')}</label>
          <input required value={brand} onChange={(e) => setBrand(e.target.value)} />
        </div>
        <div className="field">
          <label>{t('ammunition.caliber')}</label>
          <input required value={caliber} onChange={(e) => setCaliber(e.target.value)} />
        </div>
        <div className="field">
          <label>{t('ammunition.bulletType')}</label>
          <input
            required
            value={bulletType}
            onChange={(e) => setBulletType(e.target.value)}
          />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
        <button type="submit" disabled={submitting}>
          {t('ammunition.save')}
        </button>
        <button type="button" className="secondary" onClick={onCancel}>
          {t('common.cancel')}
        </button>
      </div>
    </form>
  );
}
