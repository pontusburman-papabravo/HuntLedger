import { useTranslation } from 'react-i18next';

const LANGS = ['sv', 'en'] as const;

export function LanguageToggle() {
  const { i18n } = useTranslation();
  const current = (i18n.resolvedLanguage ?? i18n.language ?? 'sv').slice(0, 2);

  return (
    <div className="lang-toggle" role="group" aria-label="Language">
      {LANGS.map((lng) => (
        <button
          key={lng}
          type="button"
          className={current === lng ? 'active' : ''}
          onClick={() => i18n.changeLanguage(lng)}
        >
          {lng.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
