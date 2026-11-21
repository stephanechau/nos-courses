# Mettre « Nos courses » en ligne

Tout se fait depuis un navigateur sur votre PC Windows : aucun Mac, aucune installation, aucune carte bancaire.
Comptez environ 45 minutes la première fois.

Vous aurez besoin de deux comptes gratuits, sans carte bancaire :

- **GitHub** (garde le code et son historique, publie le site, lance la tâche anti-veille) : https://github.com
- **Supabase** (la base de données, les comptes et les notifications) : https://supabase.com

---

## Étape 1 : créer le projet Supabase

1. Sur https://supabase.com, créez un compte puis **New project**.
   - Nom : `nos-courses`
   - Région : **West EU (Paris)** ou la plus proche
   - Mot de passe de la base : générez-en un et gardez-le de côté (il ne servira presque jamais).
2. Une fois le projet prêt, ouvrez **SQL Editor**, collez tout le contenu du fichier
   `supabase/migrations/20261121000000_init.sql`, puis **Run**. Cela crée la liste, les membres et les règles de sécurité.
   Faites de même, dans l'ordre, avec chaque fichier suivant du dossier `supabase/migrations/`
   (par exemple `20261121180000_code_famille.sql`).
3. Ouvrez **Project Settings > API** et notez :
   - **Project URL** (ressemble à `https://abcd1234.supabase.co`)
   - **anon public key** (une longue clé ; elle est faite pour être publique)

## Étape 2 : la connexion avec le code famille

Pas d'e-mail ni de mot de passe : chacun rejoint la famille avec un **code famille** de 6 caractères,
une seule fois par téléphone. Pour l'autoriser :

1. **Authentication > Sign In / Providers**.
2. Activez **Allow anonymous sign-ins**, puis **Save changes**.

> Sur l'offre gratuite, Supabase n'envoie des e-mails qu'aux membres de votre organisation Supabase :
> c'est pour cela qu'on n'utilise pas la connexion par e-mail.

## Étape 3 : les clés de notification

Les notifications web ont besoin d'une paire de clés « VAPID ».

1. Ouvrez https://vapidkeys.com (ou tout générateur de clés VAPID) et générez une paire.
2. Gardez la **clé publique** et la **clé privée** de côté.

## Étape 4 : publier le site avec GitHub

L'adresse du projet et sa clé publique sont enregistrées dans le fichier `.env.production` du dépôt
(elles sont faites pour être publiques : la sécurité vient des règles de la base).

1. Dans le dépôt `nos-courses` sur GitHub : **Settings > Pages**, puis dans **Source** choisissez **GitHub Actions**.
2. Onglet **Actions** : ouvrez « Publier l'app » et cliquez sur **Run workflow**.
   L'adresse du site s'affiche à la fin : `https://stephanechau.github.io/nos-courses/`.

Ensuite, chaque modification du code envoyée sur GitHub republie le site toute seule.

## Étape 5 : les fonctions (ajout vocal et notifications)

Dans Supabase, **Edge Functions > Deploy a new function > Via Editor** :

1. Fonction **`ajout`** : collez `supabase/functions/ajout/index.ts`, ajoutez aussi le fichier
   `_shared/texte.ts`, désactivez **Verify JWT**, puis **Deploy**.
2. Fonction **`notify`** : même chose avec `supabase/functions/notify/index.ts` (et `_shared/texte.ts`), **Verify JWT** désactivé.
3. **Edge Functions > Secrets**, ajoutez :
   - `VAPID_PUBLIC_KEY` et `VAPID_PRIVATE_KEY` (étape 3)
   - `VAPID_SUBJECT` : `mailto:` suivi de votre adresse e-mail
   - `NOTIFY_SECRET` : un mot de passe au hasard de votre choix
4. **Database > Webhooks > Create a new hook** :
   - Table : `items`, événements : **Insert** et **Update**
   - Type : **Supabase Edge Functions**, fonction : `notify`
   - En-tête HTTP supplémentaire : `x-notify-secret` = la valeur de `NOTIFY_SECRET`

## Étape 6 : installer l'app sur les téléphones

1. Ouvrez l'adresse du site, touchez **Créer la liste de ma famille**, puis entrez votre prénom et votre couleur.
2. **Réglages > Inviter un membre de la famille** : envoyez le lien et le code famille à chacun (SMS, WhatsApp…).
   Chacun touche **J'ai un code famille**, tape le code, son prénom et sa couleur.
3. Sur **iPhone** : ouvrir le lien **dans Safari**, bouton **Partager**, puis **Sur l'écran d'accueil**,
   puis ouvrir l'app **depuis l'icône** et seulement là taper le code famille
   (l'app installée et Safari ne partagent pas leurs données sur iPhone).
   Activer ensuite les notifications dans les réglages de l'app.
4. Sur **Android** : Chrome propose **Installer l'application** ; acceptez.

## Étape 7 : l'ajout à la voix

### iPhone : « Dis Siri, courses »

À faire une fois sur votre iPhone, puis partager aux autres :

1. App **Raccourcis** > **+** > nommez le raccourci **Courses** (c'est la phrase à dire à Siri).
2. Ajoutez l'action **Dicter le texte** (langue : Français).
3. Ajoutez l'action **Obtenir le contenu de l'URL** :
   - URL : `https://<votre-projet>.supabase.co/functions/v1/ajout`
   - Méthode : **POST**, Corps de requête : **JSON**
   - Champ `jeton` : votre jeton (Réglages de l'app > Ajouter avec Siri > Copier mon jeton)
   - Champ `texte` : la variable **Texte dicté**
4. Ajoutez **Obtenir la valeur du dictionnaire** (clé `message`), puis **Énoncer le texte**.
   Siri répondra par exemple « C'est noté : farine et pâtes ».
5. Réglages du raccourci > **Configurer à l'importation** : cochez le champ `jeton`.
   Quand vous partagerez le raccourci (Partager > Copier le lien iCloud), chacun collera **son propre** jeton à l'installation.

Ensuite : « Dis Siri, courses » … « de la farine et des pâtes ».

### Android (Samsung)

Google réserve la phrase « ajoute à ma liste de courses » à ses propres services, on ne peut pas s'y brancher.
Deux solutions simples :

- **Appui long sur l'icône** de l'app > **Ajouter à la voix** : l'app s'ouvre et écoute immédiatement.
  On peut glisser ce raccourci sur l'écran d'accueil pour l'avoir en un geste.
- « **Ok Google, ouvre Nos courses** », puis toucher le micro.

---

## L'anti-veille Supabase

Un projet Supabase gratuit se met en veille après 7 jours sans aucune activité.
Le fichier `.github/workflows/keepalive.yml` fait une petite lecture silencieuse **tous les 3 jours** : rien n'est visible pour la famille.
Il lit l'adresse et la clé publique dans `.env.production`, il n'y a rien d'autre à faire.

À savoir : GitHub suspend les tâches planifiées d'un dépôt sans aucune modification pendant 60 jours.
Il vous prévient alors par e-mail, et un clic sur **Enable workflow** (onglet Actions) suffit à la relancer.
De toute façon, une liste utilisée chaque semaine garde le projet éveillé toute seule.

## Combien ça coûte ?

0 €. Les offres gratuites de Supabase et GitHub couvrent très largement une famille de 4 personnes.
Le seul cas qui demanderait d'en sortir serait plusieurs milliers d'utilisateurs.
