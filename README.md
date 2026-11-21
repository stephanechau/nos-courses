# Nos courses

La liste de courses partagée de la famille : une web app installable (iPhone et Android),
synchronisée en direct, avec ajout à la voix (Siri, Android) et notifications.

- Interface : React + Vite + TypeScript, installable (PWA)
- En ligne : Supabase (base, comptes par code famille sans e-mail, temps réel, fonctions)
- Publication : GitHub Pages, tâche anti-veille GitHub Actions

## Essayer sur un ordinateur

```bash
npm install
npm run dev
```

Sans fichier `.env.local`, l'app démarre en **mode test** : tout reste dans le navigateur,
pratique pour essayer les écrans. Avec les valeurs de `.env.example` remplies, elle utilise Supabase.

## Mettre en ligne

Voir [docs/DEPLOIEMENT.md](docs/DEPLOIEMENT.md), pas à pas.

## Organisation du code

| Dossier | Rôle |
| --- | --- |
| `src/components/` | Les écrans : liste, ajout, connexion, réglages, assistant vocal |
| `src/data/` | Accès aux données (mode test local ou Supabase), voix, notifications |
| `src/sw.ts` | Service worker : hors ligne et réception des notifications |
| `supabase/migrations/` | Schéma de la base et règles de sécurité |
| `supabase/functions/ajout` | Ajout par les raccourcis vocaux |
| `supabase/functions/notify` | Envoi des notifications |
| `supabase/functions/_shared` | Reconnaissance des rayons et des phrases, partagée avec l'app |
