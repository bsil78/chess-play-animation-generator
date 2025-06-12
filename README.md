# Chess Play Animation Generator

## Description
Générateur d'animations d'échecs permettant de visualiser et animer des séquences de coups en notation FEN/PGN, avec support du format français et standard.

## Fonctionnalités
- Conversion et affichage de positions FEN (format standard et français)
- Animation pas à pas des coups
- Lecture automatique de la séquence
- Génération de GIF animé
- Affichage des pièces fantômes pour visualiser le dernier mouvement
- Orientation automatique du plateau selon le joueur actif

## Structure du Projet

### Composants React
- `App.tsx`: Point d'entrée de l'application
- `ChessAnimator.tsx`: Composant principal gérant la logique d'échecs et l'interface

### Types et Interfaces Clés
- `ChessPiece`: Type pour les pièces d'échecs (K, Q, R, B, N, P et leurs versions minuscules)
- `PositionMap`: Interface représentant la position des pièces sur l'échiquier
- `MoveDetail`: Interface pour les détails d'un coup (position de départ/arrivée, pièce)
- `MoveInfo`: Interface pour les informations de mouvement (incluant les roques)

### Logique Métier Principale

#### Parsing et Conversion
1. `parseFEN`: Convertit une chaîne FEN en position d'échiquier
2. `frenchToStandardFEN`: Convertit la notation française en notation standard
3. `parseMoves`: Extrait les coups depuis la notation PGN

#### Validation des Mouvements
1. `isLegalMove`: Vérifie si un mouvement est légal selon les règles d'échecs
2. `isPieceBetween`: Vérifie la présence de pièces entre deux cases
3. `findPieceForMove`: Trouve la pièce capable d'effectuer un mouvement donné

#### Gestion de l'Animation
1. `generatePositions`: Génère toutes les positions intermédiaires
2. `goToPosition`: Navigation vers une position spécifique
3. `generateGif`: Création d'un GIF animé de la séquence

## Guide de Développement

### État React (Hooks)
```typescript
// États principaux
const [fenInput, setFenInput] = useState(/* position initiale */)
const [currentPosition, setCurrentPosition] = useState({})
const [isAnimating, setIsAnimating] = useState(false)
const [moveDetails, setMoveDetails] = useState([])
```

### Cycle de Vie et Effets
- `useEffect` pour l'animation automatique
- `useEffect` pour la génération des positions lors du changement de FEN
- `useCallback` pour l'optimisation des fonctions complexes

### Flux de Données
1. L'utilisateur entre une position FEN
2. `parseFEN` convertit en structure de données interne
3. `generatePositions` crée toutes les positions intermédiaires
4. Le rendu affiche la position courante et met à jour l'interface

## Guide d'Utilisation du Code

### Ajouter une Nouvelle Fonctionnalité
1. Définir les interfaces nécessaires
2. Implémenter la logique dans des fonctions pures
3. Intégrer avec les hooks React existants
4. Mettre à jour le rendu si nécessaire

### Tests et Validation
- Vérifier la validité des mouvements spéciaux (roque, prise en passant)
- Tester les conversions FEN français/standard
- Valider l'animation et la génération de GIF

## Dépendances Clés
- `gif.js`: Génération de GIFs animés
- `html-to-image`: Capture des positions pour le GIF
- `lucide-react`: Icônes de l'interface
- React + TypeScript pour la base du projet

## Installation et Développement
```bash
# Installation des dépendances
npm install

# Lancement en développement
npm start

# Construction pour production
npm run build
```
