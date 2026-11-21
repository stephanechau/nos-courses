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
3. Ouvrez **Project Settings > API** et notez :
   - **Project URL** (ressemble à `https://abcd1234.supabase.co`)
   - **anon public key** (une longue clé ; elle est faite pour être publique)

## Étape 2 : la connexion par code e-mail

1. **Authentication > Sign In / Providers** : vérifiez que **Email** est activé.
2. **Authentication > Emails > Templates > Magic Link** : remplacez le contenu par :

   ```html
   <h2>Votre code pour Nos courses</h2>
   <p>Tapez ce code dans l'app : <strong style="font-size:24px">{{ .Token }}</strong></p>
   ```

   Ainsi chacun reçoit un **code à 6 chiffres** à taper dans l'app. C'est plus fiable qu'un lien sur iPhone,
   car un lien s'ouvrirait dans Safari au lieu de l'app installée.
3. **Authentication > URL Configuration** : mettez l'adresse du site (voir étape 4) dans **Site URL**.

> L'offre gratuite envoie quelques e-mails par heure, largement assez pour 4 personnes qui ne se connectent qu'une fois.

## Étape 3 : les clés de notification

Les notifications web ont besoin d'une paire de clés « VAPID ».

1. Ouvrez https://vapidkeys.com (ou tout générateur de clés VAPID) et générez une paire.
2. Gardez la **clé publique** et la **clé privée** de côté.

## Étape 4 : publier le site avec GitHub

1. Dans votre dépôt `nos-courses` sur GitHub : **Settings > Secrets and variables > Actions > onglet Variables**, ajoutez :
   - `SUPABASE_URL` : la Project URL de l'étape 1
   - `SUPABASE_ANON_KEY` : la clé anon de l'étape 1
   - `VAPID_PUBLIC_KEY` : la clé publique de l'étape 3
2. **Settings > Pages** : dans **Source**, choisissez **GitHub Actions**.
3. Onglet **Actions** : lancez « Publier l'app » (bouton **Run workflow**).
   L'adresse du site s'affiche à la fin, du type `https://votre-nom.github.io/nos-courses/`.

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

1. Ouvrez l'adresse du site, entrez votre e-mail puis le code reçu, votre prénom et votre couleur.
   Vous créez ainsi la famille.
2. **Réglages > Inviter un membre de la famille** : envoyez le lien à chacun (SMS, WhatsApp…).
3. Sur **iPhone** : ouvrir le lien **dans Safari**, bouton **Partager**, puis **Sur l'écran d'accueil**.
   Ensuite seulement, ouvrir l'app depuis l'icône et activer les notifications dans les réglages.
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
Il utilise les mêmes variables que l'étape 4, il n'y a rien d'autre à faire.

À savoir : GitHub suspend les tâches planifiées d'un dépôt sans aucune modification pendant 60 jours.
Il vous prévient alors par e-mail, et un clic sur **Enable workflow** (onglet Actions) suffit à la relancer.
De toute façon, une liste utilisée chaque semaine garde le projet éveillé toute seule.

## Combien ça coûte ?

0 €. Les offres gratuites de Supabase et GitHub couvrent très largement une famille de 4 personnes.
Le seul cas qui demanderait d'en sortir serait plusieurs milliers d'utilisateurs.
