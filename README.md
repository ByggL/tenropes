# Tenropes

Tenropes est une application de messagerie mobile multi-serveurs construite avec **Expo** et **React Native**. Chaque utilisateur peut se connecter à plusieurs serveurs, rejoindre ou créer des salons (channels) et discuter en temps réel.

Il s'agit de l'application front-end du projet global. L'API back-end à utiliser avec l'application est disponible ici : https://github.com/EliotLouys/messengingBackNest

## Fonctionnalités

- Messagerie en temps réel via Socket.IO
- Gestion de pluseirus serveurs de messagerie en parallèle
- Création de canaux de discussion, personnalisation (thème, couleurs, image) et gestion des membres
- Envoi d'images et de GIFs (Klipy)
- QR code pour partager/rejoindre facilement un serveur ou un canal
- Notifications push (Expo Notifications)
- Authentification JWT avec stockage sécurisé (`expo-secure-store`) et rafraîchissement de session

## Technologies

| Domaine       | Outils                        |
| ------------- | ----------------------------- |
| Framework     | Expo, React Native            |
| Navigation    | Expo Router                   |
| État global   | Redux Toolkit + redux-persist |
| Websocket     | socket.io-client              |
| Requêtes HTTP | axios                         |
| Langage       | TypeScript                    |
| Tests         | Jest + jest-expo              |

## Prérequis

- [Node.js](https://nodejs.org/)
- [Expo CLI](https://docs.expo.dev/) (via `npx expo`)
- Un émulateur Android/iOS ou l'application **Expo Go** sur un smartphone connecté au même réseau wifi

## Installation

```bash
# Installer les dépendances
npm install
```

## Lancement

```bash
# Démarrer le serveur de développement
npm start

# Ou directement sur une plateforme
npm run android   # Android
npm run ios       # iOS
npm run web       # Web
```

## Scripts disponibles

| Commande           | Description                                  |
| ------------------ | -------------------------------------------- |
| `npm start`        | Démarre le serveur de développement Expo     |
| `npm run android`  | Lance l'application sur Android              |
| `npm run ios`      | Lance l'application sur iOS                  |
| `npm run web`      | Lance l'application dans le navigateur       |
| `npm run lint`     | Analyse le code avec ESLint                  |
| `npm test`         | Exécute les tests unitaires (Jest)           |
| `npm run test:cov` | Exécute les tests avec rapport de couverture |
| `npm run format`   | Formate le code avec Prettier                |

## Structure du projet

```
app/          Écrans et navigation (Expo Router)
components/    Composants réutilisables (chat, formulaires, UI)
store/         Store Redux (slices, thunks, stockage sécurisé)
hooks/         Hooks personnalisés (ex. messages de salon)
types/         Types TypeScript partagés
utils/         Utilitaires (API, JWT)
constants/     Constantes (couleurs, thèmes)
```

## Tests

```bash
npm test
```

Le rapport de couverture est généré avec :

```bash
npm run test:cov
```
