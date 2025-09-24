# OlympicGamesStarter

## Table of Contents (English)
- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Running the Application](#running-the-application)
- [Other Useful Scripts](#other-useful-scripts)
- [Project Structure](#project-structure)

## Overview
Welcome to **OlympicGamesStarter**, an Angular application that provides a foundation for visualizing and analyzing Olympic Games results. This project acts as a starter kit for front-end workshops: the entire architecture is ready so you can focus on implementing features.

- **Goal**: deliver an Angular baseline to work with Olympic Games data (available in `src/assets/olympic.json`).
- **Target audience**: learners who want to get comfortable with Angular 18, consuming JSON data, and setting up a modular architecture.
- **Core technologies**: Angular 18, TypeScript, RxJS, Jasmine/Karma.

## Prerequisites
Before you begin, make sure your environment includes:
- [Node.js](https://nodejs.org/) >= 18
- [npm](https://www.npmjs.com/) >= 9 (bundled with Node.js)
- [Angular CLI](https://angular.io/cli) >= 18 (`npm install -g @angular/cli`)

## Installation
1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd OlympicGamesStarter
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

## Running the Application
To start the development server:
```bash
npm start
```
- The application runs at [http://localhost:4200](http://localhost:4200).
- Code changes automatically reload the page.

## Other Useful Scripts
- **Production build**:
  ```bash
  npm run build
  ```
  Build artifacts are generated in `dist/`.
- **Unit tests**:
  ```bash
  npm test
  ```
  Tests run through Karma.
- **Lint** *(if you add ESLint to the project)*:
  ```bash
  npm run lint
  ```

## Project Structure
The project follows a modular architecture designed to separate concerns:

```
src/
├── app/
│   ├── core/          # Services, models, and business logic
│   ├── components/    # Reusable components
│   ├── pages/         # Page components used in routing
│   └── app-routing.module.ts
├── assets/            # Static data (e.g., olympic.json)
└── environments/      # Environment-specific configuration (create as needed)
```

Getting started tips:
- Open `app/app-routing.module.ts` to understand the routing setup.
- Review `app/core/services/olympic.service.ts` to see how data is loaded.
- Create your TypeScript interfaces in `app/core/models/` and replace `any` types with strong typings.

Happy exploring and coding!

---

## Table des matières (Français)
- [Présentation](#présentation)
- [Prérequis](#prérequis)
- [Installation](#installation)
- [Lancement de l'application](#lancement-de-lapplication)
- [Autres scripts utiles](#autres-scripts-utiles)
- [Structure du projet](#structure-du-projet)

## Présentation
Bienvenue dans **OlympicGamesStarter**, une application Angular qui propose une base de travail pour visualiser et analyser les résultats des Jeux Olympiques. Ce projet sert de squelette pour les ateliers front-end : toute l'architecture est prête afin de vous concentrer sur l'implémentation des fonctionnalités.

- **Objectif** : fournir un socle Angular pour manipuler les données des Jeux Olympiques (données disponibles dans `src/assets/olympic.json`).
- **Public visé** : apprenants souhaitant se familiariser avec Angular 18, la consommation de données JSON et la mise en place d'une architecture modulaire.
- **Technologies principales** : Angular 18, TypeScript, RxJS, Jasmine/Karma.

## Prérequis
Avant de démarrer, vérifiez que votre environnement dispose des éléments suivants :
- [Node.js](https://nodejs.org/) >= 18
- [npm](https://www.npmjs.com/) >= 9 (installé avec Node.js)
- [Angular CLI](https://angular.io/cli) >= 18 (`npm install -g @angular/cli`)

## Installation
1. Clonez le dépôt :
   ```bash
   git clone <url-du-repo>
   cd OlympicGamesStarter
   ```
2. Installez les dépendances :
   ```bash
   npm install
   ```

## Lancement de l'application
Pour lancer le serveur de développement :
```bash
npm start
```
- L'application est disponible sur [http://localhost:4200](http://localhost:4200).
- Les modifications sur le code rechargent automatiquement la page.

## Autres scripts utiles
- **Build de production** :
  ```bash
  npm run build
  ```
  Les artefacts de build sont générés dans `dist/`.
- **Tests unitaires** :
  ```bash
  npm test
  ```
  Les tests sont exécutés via Karma.
- **Lint** *(si vous ajoutez ESLint au projet)* :
  ```bash
  npm run lint
  ```

## Structure du projet
Le projet suit une architecture modulaire pensée pour séparer les responsabilités :

```
src/
├── app/
│   ├── core/          # Services, modèles et logique métier
│   ├── components/    # Composants réutilisables
│   ├── pages/         # Composants de page utilisés dans le routing
│   └── app-routing.module.ts
├── assets/            # Données statiques (ex: olympic.json)
└── environments/      # Configuration selon l'environnement (à créer si besoin)
```

Quelques conseils pour débuter :
- Ouvrez `app/app-routing.module.ts` pour comprendre le routing.
- Étudiez `app/core/services/olympic.service.ts` pour voir comment les données sont chargées.
- Créez vos interfaces TypeScript dans `app/core/models/` et remplacez les `any` par des types forts.


