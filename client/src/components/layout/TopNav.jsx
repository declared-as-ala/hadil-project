import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  SEARCH_TARGETS,
  allowedForRole,
  labelFor,
  menuItems,
  normalizeSearch,
} from './navigation';
import './TopNav.css';

const ROLE_LABELS = {
  admin: 'Administrateur',
  rh: 'Gestionnaire RH',
  employe: 'Employ\u00e9',
  user: 'Utilisateur',
};

function scoreItem(item, query) {
  const label = normalizeSearch(labelFor(item));
  const section = normalizeSearch(item.sectionLabel);
  const path = normalizeSearch(item.path);
  const keywords = (item.keywords || []).map(normalizeSearch);

  if (label === query) return 0;
  if (label.startsWith(query)) return 1;
  if (label.includes(query)) return 2;
  if (keywords.some((keyword) => keyword === query || keyword.startsWith(query))) return 3;
  if (keywords.some((keyword) => keyword.includes(query))) return 4;
  if (section.includes(query) || path.includes(query)) return 5;
  return -1;
}

export default function TopNav({ onMenuToggle }) {
  const { user, logout, role } = useAuth();
  const navigate = useNavigate();
  const searchRef = useRef(null);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const pages = useMemo(
    () => menuItems.filter((item) => !item.section && allowedForRole(item, role)),
    [role]
  );

  const pageResults = useMemo(() => {
    const q = normalizeSearch(query);
    if (!q) return [];

    return pages
      .map((item) => ({ item, score: scoreItem(item, q) }))
      .filter((result) => result.score >= 0)
      .sort((a, b) => a.score - b.score || labelFor(a.item).localeCompare(labelFor(b.item)))
      .slice(0, 6);
  }, [pages, query]);

  const searchTargets = useMemo(
    () => SEARCH_TARGETS.filter((item) => allowedForRole(item, role)).slice(0, 6),
    [role]
  );

  const fallbackTargets = query.trim() && pageResults.length === 0 ? searchTargets : [];
  const optionCount = pageResults.length + fallbackTargets.length;

  useEffect(() => {
    function handlePointerDown(event) {
      if (!searchRef.current?.contains(event.target)) {
        setOpen(false);
        setSelectedIndex(-1);
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  useEffect(() => {
    setSelectedIndex(-1);
  }, [query]);

  const handleLogout = () => {
    logout();
  };

  const userName = user
    ? `${user.nom || user.fullName || ''} ${user.prenom || ''}`.trim() || user.email
    : user?.email || 'User';

  const roleLabel = role ? (ROLE_LABELS[role] || role) : '';

  function closeSearch() {
    setQuery('');
    setOpen(false);
    setSelectedIndex(-1);
  }

  function goTo(path, withSearch = false) {
    const trimmed = query.trim();
    const nextPath = withSearch && trimmed
      ? `${path}?search=${encodeURIComponent(trimmed)}`
      : path;

    navigate(nextPath);
    closeSearch();
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (!query.trim()) return;

    if (pageResults.length > 0) {
      goTo(pageResults[0].item.path);
      return;
    }

    if (searchTargets.length > 0) {
      goTo(searchTargets[0].path, true);
    }
  }

  function handleKeyDown(event) {
    if (event.key === 'Escape') {
      setOpen(false);
      setSelectedIndex(-1);
      return;
    }

    if (!open || optionCount === 0) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setSelectedIndex((index) => (index + 1) % optionCount);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setSelectedIndex((index) => (index <= 0 ? optionCount - 1 : index - 1));
    } else if (event.key === 'Enter' && selectedIndex >= 0) {
      event.preventDefault();
      if (selectedIndex < pageResults.length) {
        goTo(pageResults[selectedIndex].item.path);
      } else {
        const target = fallbackTargets[selectedIndex - pageResults.length];
        goTo(target.path, true);
      }
    }
  }

  return (
    <header className="topnav">
      <div className="topnav-left">
        <button className="topnav-menu-btn" onClick={onMenuToggle} title="Toggle menu">
          &#9776;
        </button>

        <form className="topnav-search" ref={searchRef} onSubmit={handleSubmit}>
          <span className="topnav-search-icon" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="7"></circle>
              <line x1="16.65" y1="16.65" x2="21" y2="21"></line>
            </svg>
          </span>
          <input
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder="Rechercher dans RH System..."
            className="topnav-search-input"
            aria-label="Recherche globale"
          />
          {query && (
            <button type="button" className="topnav-search-clear" onClick={closeSearch} title="Annuler">
              &times;
            </button>
          )}

          {open && query.trim() && (
            <div className="topnav-search-panel">
              {pageResults.length > 0 && (
                <>
                  <div className="topnav-search-heading">Resultats</div>
                  {pageResults.map(({ item }, index) => (
                    <button
                      key={item.path}
                      type="button"
                      className={`topnav-search-result ${selectedIndex === index ? 'is-selected' : ''}`}
                      onMouseDown={(event) => {
                        event.preventDefault();
                        goTo(item.path);
                      }}
                    >
                      <span className="topnav-search-result-icon">{item.icon}</span>
                      <span className="topnav-search-result-text">
                        <span>{labelFor(item)}</span>
                        <small>{item.path}</small>
                      </span>
                    </button>
                  ))}
                </>
              )}

              {fallbackTargets.length > 0 && (
                <>
                  <div className="topnav-search-heading">Chercher dans</div>
                  {fallbackTargets.map((target, index) => {
                    const itemIndex = pageResults.length + index;
                    return (
                      <button
                        key={target.path}
                        type="button"
                        className={`topnav-search-result ${selectedIndex === itemIndex ? 'is-selected' : ''}`}
                        onMouseDown={(event) => {
                          event.preventDefault();
                          goTo(target.path, true);
                        }}
                      >
                        <span className="topnav-search-result-icon">
                          {pages.find((item) => item.key === target.key)?.icon || '\u2315'}
                        </span>
                        <span className="topnav-search-result-text">
                          <span>{labelFor(target)}</span>
                          <small>{query.trim()}</small>
                        </span>
                      </button>
                    );
                  })}
                </>
              )}

              {pageResults.length === 0 && fallbackTargets.length === 0 && (
                <div className="topnav-search-empty">Aucun resultat</div>
              )}
            </div>
          )}
        </form>
      </div>

      <div className="topnav-right">
        <div className="topnav-user">
          <div className="topnav-user-info">
            <span className="topnav-user-name">{userName}</span>
            <span className="topnav-user-role">{roleLabel}</span>
          </div>
          <Link
            to="/profile"
            className="topnav-avatar"
            title="Mon profil"
            style={{ textDecoration: 'none', cursor: 'pointer', overflow: 'hidden' }}
          >
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt="Avatar"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              user?.nom?.[0]?.toUpperCase() || user?.fullName?.[0]?.toUpperCase() || 'U'
            )}
          </Link>
          <button className="btn btn-ghost btn-sm topnav-logout" onClick={handleLogout} title="Déconnexion">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
