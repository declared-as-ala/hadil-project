import { useTranslation } from 'react-i18next';
import './LanguageSwitcher.css';

const LANGS = [
  { code: 'fr', label: 'FR', name: 'Français' },
  { code: 'en', label: 'EN', name: 'English' },
];

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const current = (i18n.resolvedLanguage || i18n.language || 'fr').slice(0, 2);

  return (
    <div className="lang-switcher" role="group" aria-label="Language">
      {LANGS.map((l) => (
        <button
          key={l.code}
          type="button"
          className={`lang-switcher-btn ${current === l.code ? 'is-active' : ''}`}
          onClick={() => i18n.changeLanguage(l.code)}
          title={l.name}
          aria-pressed={current === l.code}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}
