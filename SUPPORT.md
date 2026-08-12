# Guide de Support et Résolution d'Incidents Mobile - Tenropes

Ce document détaille les procédures de support et de résolution d'incidents côté application mobile **Tenropes** (`tenropes`).

---

## 1. Niveaux de Support Mobile

| Niveau | Rôle | Périmètre d'intervention |
| :--- | :--- | :--- |
| **N1 - Support Client** | Assistance Utilisateur | Problèmes de configuration de l'URL du serveur, identifiants oubliés, réinstallation de l'application. |
| **N2 - Support Technique** | Diagnostic Client | Problèmes de stockage local (AsyncStorage / SecureStore), jetons de notification push, vidage de cache. |
| **N3 - Équipe Dev Mobile** | Correction de bugs | Résolution de crashs React Native / Expo, correctifs de régression d'affichage, builds APK. |

---

## 2. Procédures de Résolution d'Incidents Fréquents

### Incident 1 : Impossible de se connecter à un serveur personnalisé ("Network Error")
* **Symptômes** : L'écran `AddServer` affiche une erreur lors de l'ajout d'un serveur personnalisé.
* **Procédures de résolution** :
  1. Vérifier que l'URL saisie est bien formatée (`http://IP:3000` ou `https://domaine.com`).
  2. S'assurer que le serveur cible dispose de la route `/health` fonctionnelle.
  3. Si le serveur utilise `http://` sur Android, s'assurer que le trafic non chiffré (`cleartextTraffic`) est autorisé dans les paramètres réseau ou tester avec HTTPS.

### Incident 2 : Perte d'affichage des messages ou état désynchronisé
* **Symptômes** : L'application n'affiche plus les nouveaux messages envoyés dans les canaux.
* **Procédures de résolution** :
  1. Tirer vers le bas (Pull-to-refresh) sur la liste des canaux pour forcer la resynchronisation Redux.
  2. Si le blocage persiste, se déconnecter puis se reconnecter pour régénérer le jeton JWT d'authentification (`secureStorage`).
  3. Vider le cache de l'application mobile via les paramètres du téléphone.

### Incident 3 : Absence de réception des notifications sur l'appareil mobile
* **Procédures de résolution** :
  1. Vérifier que les autorisations de notifications sont accordées pour Tenropes dans les paramètres Android/iOS.
  2. Vérifier que l’appareil est en mesure d'obtenir un jeton Expo Push Token (`utils/notifications.ts`).

---

## 3. Signalement des Bugs

Pour remonter un incident au support Niveau 3 :
- Créer un ticket via le template GitHub : [Nouveau rapport d'anomalie](https://github.com/EliotLouys/tenropes/issues/new?template=bug_report.md)
