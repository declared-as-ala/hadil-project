import { ROLES } from '../../utils/constants';

export const menuItems = [
  { key: 'dashboard', path: '/dashboard', icon: '\uD83D\uDCCA', roles: [ROLES.ADMIN, ROLES.RH, ROLES.EMPLOYE], keywords: ['home', 'stats', 'tableau', 'bord'] },
  { section: 'hr', roles: [ROLES.ADMIN, ROLES.RH] },
  { key: 'employes', path: '/employes', icon: '\uD83D\uDC65', roles: [ROLES.ADMIN, ROLES.RH], keywords: ['employee', 'employees', 'personnel', 'salarie', 'staff', 'poste', 'contrat'] },
  { key: 'absences', path: '/absences', icon: '\uD83D\uDCD3', roles: [ROLES.ADMIN, ROLES.RH, ROLES.EMPLOYE], keywords: ['absence', 'justifie', 'non justifie', 'retard'] },
  { key: 'conges', path: '/conges', icon: '\uD83C\uDFD6\uFE0F', roles: [ROLES.ADMIN, ROLES.RH, ROLES.EMPLOYE], keywords: ['conge', 'conges', 'vacances', 'leave', 'demande', 'repos'] },
  { key: 'documents', path: '/documents-admin', icon: '\uD83D\uDCC2', roles: [ROLES.ADMIN, ROLES.RH, ROLES.EMPLOYE], keywords: ['document', 'docs', 'attestation', 'certificat', 'fiche paie', 'papier'] },
  { key: 'heuresSup', path: '/heures-sup', icon: '\u23F0', roles: [ROLES.ADMIN, ROLES.RH, ROLES.EMPLOYE], keywords: ['heure', 'heures', 'supplementaire', 'overtime', 'hs'] },
  { key: 'paie', path: '/paie', icon: '\uD83D\uDCB0', roles: [ROLES.ADMIN, ROLES.RH, ROLES.EMPLOYE], keywords: ['salaire', 'salaires', 'payroll', 'fiche', 'poste', 'affectation'] },
  { key: 'cvAi', path: '/hr/cv-ai', icon: '\uD83E\uDD16', roles: [ROLES.ADMIN, ROLES.RH], keywords: ['cv', 'ia', 'ai', 'candidat', 'candidature', 'recrutement', 'analyse'] },
  { section: 'communication', roles: [ROLES.ADMIN, ROLES.RH, ROLES.EMPLOYE] },
  { key: 'messages', path: '/messages', icon: '\uD83D\uDCAC', roles: [ROLES.ADMIN, ROLES.RH, ROLES.EMPLOYE], keywords: ['message', 'chat', 'conversation', 'mail'] },
  { section: 'account', roles: [ROLES.ADMIN, ROLES.RH, ROLES.EMPLOYE] },
  { key: 'profile', path: '/profile', icon: '\uD83D\uDC64', roles: [ROLES.ADMIN, ROLES.RH, ROLES.EMPLOYE], keywords: ['profil', 'profile', 'compte', 'account', 'parametre'] },
];

export const SECTION_LABELS = {
  hr: 'Gestion RH',
  communication: 'Communication',
  account: 'Compte',
};

export const LINK_LABELS = {
  dashboard: 'Tableau de bord',
  employes: 'Employ\u00e9s',
  absences: 'Absences',
  conges: 'Demande Cong\u00e9s',
  documents: 'Demandes Docs',
  heuresSup: 'Heures Sup',
  paie: 'Gestion Paie',
  cvAi: 'Analyseur CV IA',
  messages: 'Messages',
  profile: 'Profil',
};

export const SEARCH_TARGETS = [
  { key: 'employes', path: '/employes', roles: [ROLES.ADMIN, ROLES.RH] },
  { key: 'absences', path: '/absences', roles: [ROLES.ADMIN, ROLES.RH, ROLES.EMPLOYE] },
  { key: 'conges', path: '/conges', roles: [ROLES.ADMIN, ROLES.RH, ROLES.EMPLOYE] },
  { key: 'heuresSup', path: '/heures-sup', roles: [ROLES.ADMIN, ROLES.RH, ROLES.EMPLOYE] },
  { key: 'paie', path: '/paie', roles: [ROLES.ADMIN, ROLES.RH, ROLES.EMPLOYE] },
  { key: 'cvAi', path: '/hr/cv-ai', roles: [ROLES.ADMIN, ROLES.RH] },
];

export function labelFor(item) {
  return item.section ? SECTION_LABELS[item.section] : LINK_LABELS[item.key];
}

export function normalizeSearch(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function allowedForRole(item, role) {
  return !item.roles || item.roles.includes(role);
}
