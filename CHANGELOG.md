# Journal des modifications (Changelog) - Application Mobile Tenropes

Toutes les modifications notables apportées au projet mobile Tenropes sont documentées dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/),
et ce projet adhère au [Gestion des versions sémantique (SemVer)](https://semver.org/lang/fr/).

---

## [1.0.1] - 2026-08-05

### Ajouté (Added)
- **Gestion Automatisée des Dépendances (Dependabot)** : Ajout du fichier de configuration `.github/dependabot.yml` configuré pour les mises à jour hebdomadaires avec regroupement et filtres d'exclusion Expo/React Native (`08fd4b4`).
- **Guide de Dépannage et Support** : Intégration du guide de support utilisateur et technique (`SUPPORT.md`).
- **Modèles d'Anomalies (Issue Templates)** : Intégration des gabarits d'issues GitHub pour les bogues et évolutions mobile (`.github/ISSUE_TEMPLATE/`).

### Corrigé (Fixed)
- Ajustement de l'affichage des en-têtes de canaux et gestion de l'affichage des QR codes d'auto-hébergement (`85b5bc0`).
- Correction du formatage de l'horodatage (`formatTime`) dans la liste des messages (`baf3551`).

---

## [1.0.0] - 2026-07-23

### Ajouté (Added)
- **Couverture Complète de Tests Unitaires (Jest & Expo Testing)** :
  - Tests des composants graphiques (Cartes de canaux, Formulaires, En-têtes, Modales GIF) (`23921f`).
  - Tests des écrans applicatifs (Sélection de serveur, Profil, Création de canal, Tabs) (`ec40339`).
  - Tests des Hooks personnalisés (`useChannelAdmin`, `useChannelMessages`) (`95777a4`).
  - Tests du Store Redux Toolkit & Sécurisation (`secureStorage`, `serverThunks`) (`d890d75`).
  - Tests des utilitaires API et notifications (`23b232b`).
- **Documentation Complète (README)** : Documentation utilisateur et développeur mise à jour (`020b235`).

---

## [0.0.2] - 2026-07-01

### Ajouté (Added)
- **Sélecteur de GIF Klipy** : Intégration d'un sélecteur de GIF animé interactif dans le composant d'envoi de messages (`c3ebf90`).
- **Envoi et Prévisualisation d'Images** : Prise en charge des pièces jointes d'images avec encodage sécurisé et aperçu en plein écran (`d311ff6`).

### Corrigé (Fixed)
- Amélioration de la stabilité de la connexion WebSocket lors du changement de serveur.
- Correction du typage TypeScript des médias envoyés (`80132ba`).

---

## [0.0.1] - 2026-03-20

### Ajouté (Added)
- **Gestion Multi-Serveurs & Auto-Hébergement** : Interface de sélection, d'ajout et de basculement entre différents serveurs Tenropes (`5ecd820`).
- **Authentification & Profils** : Écrans de connexion, d'inscription et de gestion du profil utilisateur (`05221c9`).
- **Reception des Notifications Push** : Intégration du SDK Expo Notifications avec relais backend (`982dc9f`).
- **Navigation & Layout Base** : Mise en place d'Expo Router avec navigation par onglets et typage TypeScript strict (`f32e0a9`).
