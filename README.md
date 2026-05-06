# Hackathon-Procrastination-POC
# 😤 La Flemme — Application Anti-Procrastination

> **Réalisé en 10 heures lors d'un hackathon.**  
> Une app qui combat la procrastination — pas avec de la motivation, mais avec de la pression.
---

## C'est quoi La Flemme ?

**La Flemme** est une application mobile et web qui te force à rester responsable en faisant ce qu'aucune autre app de productivité n'ose faire : **t'appeler en boucle jusqu'à ce que tu termines ta tâche.**

Tu rates une deadline ? La Flemme t'appelle. Tu l'ignores ? Elle rappelle. Toutes les deux minutes. Jusqu'à ce que ce soit fini.

---

## ✨ Fonctionnalités

(Voir notes de développement pour appel)

### 📋 Gestion des tâches
- Créer des tâches avec un **titre**, une **description**, une **deadline** et une **priorité** (haute / normale / basse)
- Découper les tâches en **étapes concrètes** avec des estimations de durée optionnelles
- Liste triable par **date**, **priorité** ou **avancement**
- Barres de progression visuelles et alertes de retard

### ⏱ Cycles Focus Pomodoro
- **Minuteur Pomodoro** intégré avec des durées personnalisables
  - 🔥 Focus (25 min par défaut)
  - ☕ Pause courte (5 min par défaut)
  - 🌊 Grande pause tous les 4 cycles (15 min par défaut)
- Sessions par tâche — lance un cycle directement depuis une tâche
- Sons ambiants sur le web (pluie, lo-fi, etc.)
- Vibrations sur mobile lors des transitions de phase

### 😤 La Flemme — Le Système de Pression
- Quand une tâche dépasse sa deadline sans être terminée, **La Flemme s'active**
- Un backend Python utilise **Twilio** pour passer des appels automatiques sur ton numéro
- Le message vocal : *« La Flemme te rappelle. Tu as une tâche en retard. Finis-la, maintenant. »*
- Les appels se répètent toutes les **2 minutes** jusqu'à ce que la tâche soit marquée comme terminée
- Peut être déclenchée **manuellement** ou **automatiquement** à la deadline
- Escalade : intervalles de 2h → 1h → 30min → 15min au fur et à mesure du retard
- Optionnel : enregistre « La Flemme 😤 » dans tes contacts pour savoir qui appelle

### 🎮 Gamification
- Gagne des **XP** en complétant des étapes (+10 XP) et des tâches (+50 XP)
- 8 **niveaux** de *« Full Flemme »* à *« La Flemme vaincue »* (basé sur les XP)
- **Streaks quotidiens** avec messages de motivation
- **Badges** débloqués par paliers (première tâche, streak de 5 jours, 1000 XP, etc.)
- **Écran de statistiques** avec graphique d'activité hebdomadaire et indicateurs clés

### ⚙️ Paramètres
- Numéro de téléphone pour recevoir les appels de La Flemme
- Configuration de l'URL du backend
- Durées Pomodoro personnalisables
- Interrupteur d'activation automatique de La Flemme
- Chargement des données de démo (10 tâches réalistes pré-remplies)

---

## 🛠 Stack Technique

| Couche | Technologie |
|--------|-------------|
| Mobile / Web | React Native + Expo (iOS, Android, Web) |
| Routage | Expo Router (basé sur les fichiers) |
| Gestion d'état | Zustand |
| Stockage local | AsyncStorage |
| Backend | Python + FastAPI |
| Appels téléphoniques | (Twilio) |
| Notifications | Expo Notifications |

---


## 🚀 Démarrage rapide

### Prérequis
- Node.js ≥ 18
- Python 3.10+
- (Un compte [Twilio](https://twilio.com) (pour les appels téléphoniques))
- L'application Expo Go sur ton téléphone (optionnel, pour les tests natifs)


### Installation mobile / web

```bash
cd mobile

# Installer les dépendances
npm install

# Démarrer le serveur de développement Expo
npm start

# Ou cibler une plateforme spécifique
npm run web
```

Ouvre l'app dans Expo Go (scan du QR code) ou dans ton navigateur.

Dans **Paramètres**, renseigne ton numéro de téléphone.

---


## 📱 Écrans

| Écran | Description |
|-------|-------------|
| **Liste des tâches** | Affiche toutes les tâches en cours et terminées, triables par date / priorité / avancement |
| **Détail d'une tâche** | Cocher les étapes, lancer un cycle focus, déclencher La Flemme manuellement |
| **Créer une tâche** | Formulaire avec titre, deadline, étapes et estimations de temps |
| **Cycle focus** | Minuteur Pomodoro lié à la tâche en cours |
| **Statistiques** | Niveau XP, streak, graphique hebdomadaire, badges |
| **Paramètres** | Numéro de téléphone, config Pomodoro, interrupteur La Flemme |
| **Onboarding** | Introduction en 5 étapes au premier lancement |

---

## 🧑‍💻 Notes de développement

- L'app fonctionne entièrement **hors ligne** — les tâches sont stockées localement via AsyncStorage.  
  Le backend n'est nécessaire que lorsque La Flemme doit passer un appel et il n'est pas fonctionnel nécéssitant un appel API couteux.
- L'interface est en **français** (projet réalisé dans le cadre d'un hackathon français).
- Les données de démo peuvent être chargées depuis l'écran vide ou depuis les Paramètres.

---

## 📄 Licence

MIT — réalisé lors d'un hackathon, utilisation libre.