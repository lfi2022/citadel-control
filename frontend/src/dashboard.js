import layout from '../../shared/dashboard.json';

export const PAGE_GROUPS = { Accueil: [{ title: 'Commandes rapides', entities: layout.pages.Éclairage.flatMap(group => group.entities).slice(0, 4) }], ...layout.pages };
export const HOME = layout.home;
