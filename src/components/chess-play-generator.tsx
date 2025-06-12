import React, { useState, useEffect, useRef } from 'react';
import { Play, RotateCcw, Pause, StepForward, StepBack, Download } from 'lucide-react';
import * as htmlToImage from 'html-to-image';
import GIF from 'gif.js';
import './chess-play-generator.css';

/**
 * Types et Interfaces
 * ------------------
 * Cette section définit la structure des données utilisées dans l'application.
 */

/**
 * Type représentant les pièces d'échecs possibles.
 * Majuscules pour les pièces blanches, minuscules pour les noires.
 * K/k: Roi, Q/q: Dame, R/r: Tour, B/b: Fou, N/n: Cavalier, P/p: Pion
 */
type ChessPiece = 'K' | 'Q' | 'R' | 'B' | 'N' | 'P' | 'k' | 'q' | 'r' | 'b' | 'n' | 'p';

/**
 * Mapping entre les pièces et leurs symboles Unicode pour l'affichage
 */
type PieceSymbols = { [K in ChessPiece]: string };

/**
 * Structure représentant l'échiquier comme un dictionnaire
 * où les clés sont les cases (ex: "e4") et les valeurs sont les pièces
 */
interface PositionMap {
  [square: string]: string;
}

/**
 * Représente un mouvement secondaire, utilisé principalement pour le roque
 * où la tour doit aussi se déplacer
 */
interface SecondaryMove {
  from: string;
  to: string;
  piece: string;
}

/**
 * Information complète sur un mouvement, incluant un éventuel
 * mouvement secondaire pour le roque
 */
interface MoveInfo {
  from: string;
  to: string;
  piece: string;
  secondaryMove?: SecondaryMove;
}

/**
 * Détails d'un mouvement pour l'affichage et l'animation,
 * incluant les informations pour le roque
 */
interface MoveDetail {
  from: string;
  to: string;
  piece: string;
  secondaryFrom?: string;
  secondaryTo?: string;
  secondaryPiece?: string;
}

/**
 * Coordonnées algébriques sur l'échiquier (0-7 pour les rangs et colonnes)
 */
interface AlgebraicCoords {
  row: number; // 0-7 pour les rangées (8-1)
  col: number; // 0-7 pour les colonnes (a-h)
}

/**
 * Résultat de la génération des positions, contenant toutes les
 * positions intermédiaires et les détails des mouvements
 */
interface GeneratePositionsResult {
  positions: Array<{ [key: string]: string }>;

  moveDetails: MoveDetail[];
}

/**
 * Types pour la gestion de la notation française
 */
interface IsFrenchFEN {
  (fen: string): boolean;
}

interface FrenchToStandardFEN {
  (fen: string): string;
}

/**
 * Composant principal ChessAnimator
 * --------------------------------
 * Gère l'affichage et l'animation d'une séquence de coups d'échecs
 */
const ChessAnimator = () => {
  /**
   * Hooks d'état (useState)
   * ----------------------
   */

  // Référence vers l'élément DOM de l'échiquier pour la génération de GIF
  const boardRef = useRef<HTMLDivElement>(null);

  // Position FEN et coups en entrée
  const [fenInput, setFenInput] = useState('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1 1.e4 e5 2.Nf3 Nc6');

  // État actuel de l'échiquier
  const [currentPosition, setCurrentPosition] = useState<{ [key: string]: string }>({});

  // Contrôle de l'animation
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentMoveIndex, setCurrentMoveIndex] = useState(0);

  // Liste des coups et positions
  const [moves, setMoves] = useState<string[]>([]);
  const [positions, setPositions] = useState<Array<{ [key: string]: string }>>([]);
  const [moveDetails, setMoveDetails] = useState<MoveDetail[]>([]);

  // État de la génération du GIF
  const [isGeneratingGif, setIsGeneratingGif] = useState(false);

  // Position FEN initiale standard
  const initialFEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

  /**
   * Table de conversion des pièces vers leurs symboles Unicode
   * Utilisée pour l'affichage des pièces sur l'échiquier
   */
  const pieceSymbols: PieceSymbols = {
    // Format standard
    'K': '♔', 'Q': '♕', 'R': '♖', 'B': '♗', 'N': '♘', 'P': '♙',
    'k': '♚', 'q': '♛', 'r': '♜', 'b': '♝', 'n': '♞', 'p': '♟'
  };

  /**
   * Fonctions de conversion du format français
   * ----------------------------------------
   */

  /**
   * Détecte si une chaîne FEN utilise la notation française
   * (R->K, D->Q, T->R, F->B, C->N pour Roi, Dame, Tour, Fou, Cavalier)
   */
  const isFrenchFEN = React.useCallback<IsFrenchFEN>((fen) => {
    const boardPart = fen.split(' ')[0];
    return /[DdTtFfCc]/.test(boardPart);
  }, []);

  /**
   * Convertit une position en notation française vers la notation standard
   * Utilisé pour normaliser l'entrée avant traitement
   */
  const frenchToStandardFEN = React.useCallback<FrenchToStandardFEN>((fen) => {
    if (!isFrenchFEN(fen)) return fen;

    return fen
      .replace(/R/g, 'K').replace(/r/g, 'k') // Roi -> King
      .replace(/D/g, 'Q').replace(/d/g, 'q') // Dame -> Queen
      .replace(/T/g, 'R').replace(/t/g, 'r') // Tour -> Rook
      .replace(/F/g, 'B').replace(/f/g, 'b') // Fou -> Bishop
      .replace(/C/g, 'N').replace(/c/g, 'n'); // Cavalier -> kNight
  }, [isFrenchFEN]);

  /**
   * Fonctions de conversion de coordonnées
   * ------------------------------------
   */

  /**
   * Convertit des coordonnées numériques (row, col) en notation algébrique (ex: "e4")
   * @param row Numéro de rangée (0-7)
   * @param col Numéro de colonne (0-7)
   * @returns Notation algébrique de la case (ex: "e4")
   */
  const coordsToAlgebraic = React.useCallback((row: number, col: number): string => {
    return String.fromCharCode(97 + col) + (8 - row);
  }, []);

  /**
   * Traitement de la notation FEN
   * ---------------------------
   * La notation FEN (Forsyth-Edwards Notation) est un format standard
   * pour décrire une position d'échecs complète
   */
  const parseFEN = React.useCallback((fen: string): { [key: string]: string } => {
    // Convertit le FEN français en standard si nécessaire
    const standardFEN = frenchToStandardFEN(fen);
    const parts = standardFEN.split(' ');
    const boardPart = parts[0];
    const ranks = boardPart.split('/');
    const position: { [key: string]: string } = {};

    // Parse chaque rangée
    ranks.forEach((rank: string, rankIndex: number) => {
      let fileIndex = 0;
      for (let char of rank) {
        if (isNaN(Number(char))) {
          // Si c'est une pièce, l'ajouter à la position
          const coords: AlgebraicCoords = { row: rankIndex, col: fileIndex };
          const square = coordsToAlgebraic(coords.row, coords.col);
          position[square] = char;
          fileIndex++;
        } else {
          // Si c'est un nombre, avancer le fileIndex
          fileIndex += parseInt(char);
        }
      }
    });

    return position;
  }, [frenchToStandardFEN, coordsToAlgebraic]);

  /**
   * Traitement de la notation PGN
   * ---------------------------
   * Extrait la liste des coups depuis une chaîne en notation algébrique
   */
  const parseMoves = (moveString: string): string[] => {
    if (!moveString) return [];

    // Nettoie et divise la chaîne de coups
    return moveString
      .replace(/\d+\./g, '') // Supprime les numéros de coups
      .trim()
      .split(/\s+/)
      .filter((move: string) => move.length > 0);
  };

  /**
   * Validation des mouvements
   * -----------------------
   */

  /**
   * Vérifie s'il y a des pièces entre deux cases
   * Utilisé pour les mouvements de la tour, du fou et de la dame
   * @param from Case de départ
   * @param to Case d'arrivée
   * @param position Position actuelle de l'échiquier
   * @returns true s'il y a une pièce entre les deux cases
   */
  const isPieceBetween = React.useCallback((
    from: string,
    to: string,
    position: PositionMap
  ): boolean => {
    // Convertit les coordonnées algébriques en indices numériques
    const fromFile = from.charCodeAt(0) - 97;
    const fromRank = 8 - parseInt(from[1]);
    const toFile = to.charCodeAt(0) - 97;
    const toRank = 8 - parseInt(to[1]);

    // Calcule la direction du mouvement
    const fileStep = Math.sign(toFile - fromFile) || 0;
    const rankStep = Math.sign(toRank - fromRank) || 0;

    // Vérifie chaque case sur le chemin
    let currentFile = fromFile + fileStep;
    let currentRank = fromRank + rankStep;
    while (currentFile !== toFile || currentRank !== toRank) {
      const square = String.fromCharCode(97 + currentFile) + (8 - currentRank);
      if (position[square]) return true;
      currentFile += fileStep;
      currentRank += rankStep;
    }

    return false;
  }, []);

  /**
   * Vérifie si un mouvement est légal selon les règles d'échecs
   * @param from Case de départ
   * @param to Case d'arrivée
   * @param piece Pièce à déplacer
   * @param position Position actuelle de l'échiquier
   * @returns true si le mouvement est légal
   */
  const isLegalMove = React.useCallback((
    from: string,
    to: string,
    piece: string,
    position: PositionMap
  ): boolean => {
    const fromFile = from.charCodeAt(0) - 97; // 'a' = 0, 'b' = 1, etc.
    const fromRank = 8 - parseInt(from[1]); // '1' = 7, '2' = 6, etc.
    const toFile = to.charCodeAt(0) - 97;
    const toRank = 8 - parseInt(to[1]);

    const deltaFile = Math.abs(toFile - fromFile);
    const deltaRank = Math.abs(toRank - fromRank);
    const isWhitePiece = piece === piece.toUpperCase();

    // Vérifie si la case cible contient une pièce de même couleur
    const targetPiece = position[to];
    if (targetPiece) {
      const isTargetWhite = targetPiece === targetPiece.toUpperCase();
      if (isWhitePiece === isTargetWhite) return false;
    }

    const pieceType = piece.toUpperCase();
    switch (pieceType) {
      case 'P': // Pion
        const forwardDirection = isWhitePiece ? -1 : 1;
        const startRank = isWhitePiece ? 6 : 1;

        // Mouvement simple
        if (fromFile === toFile && !targetPiece) {
          if (toRank - fromRank === forwardDirection) return true;
          // Double avance depuis la position initiale
          if (fromRank === startRank && toRank - fromRank === forwardDirection * 2 && !position[String.fromCharCode(97 + fromFile) + (8 - (fromRank + forwardDirection))]) {
            return true;
          }
        }
        // Prise en diagonale
        if (deltaFile === 1 && toRank - fromRank === forwardDirection && targetPiece) {
          return true;
        }
        return false;

      case 'R': // Tour
        return (fromFile === toFile || fromRank === toRank) && !isPieceBetween(from, to, position);

      case 'N': // Cavalier
        return (deltaFile === 2 && deltaRank === 1) || (deltaFile === 1 && deltaRank === 2);

      case 'B': // Fou
        return deltaFile === deltaRank && !isPieceBetween(from, to, position);

      case 'Q': // Dame
        return ((fromFile === toFile || fromRank === toRank) || deltaFile === deltaRank) && !isPieceBetween(from, to, position);

      case 'K': // Roi
        return deltaFile <= 1 && deltaRank <= 1;

      default: return false;
    }
  }, [isPieceBetween]);
  /**
   * Trouve la pièce capable d'effectuer un mouvement donné
   * Gère aussi les cas spéciaux comme le roque
   * @param position Position actuelle
   * @param move Coup en notation algébrique
   * @param isWhiteTurn True si c'est aux blancs de jouer
   * @returns Informations sur le mouvement ou null si impossible
   */
  const findPieceForMove = React.useCallback((
    position: PositionMap,
    move: string,
    isWhiteTurn: boolean
  ): MoveInfo | null => {
    // Gestion du roque
    if (move === 'O-O' || move === 'O-O-O') {
      const rank = isWhiteTurn ? '1' : '8';
      const king = isWhiteTurn ? 'K' : 'k';
      const rook = isWhiteTurn ? 'R' : 'r';

      if (move === 'O-O') {
        return {
          from: 'e' + rank,
          to: 'g' + rank,
          piece: king,
          secondaryMove: { from: 'h' + rank, to: 'f' + rank, piece: rook }
        };
      } else {
        return {
          from: 'e' + rank,
          to: 'c' + rank,
          piece: king,
          secondaryMove: { from: 'a' + rank, to: 'd' + rank, piece: rook }
        };
      }
    }

    // Nettoie le coup des annotations
    let cleanMove = move.replace(/[+#!?]/g, '');
    let targetSquare: string, piece: string, disambiguation: string = '';

    // Détermine la pièce et la case cible
    if (cleanMove.match(/^[KQRBN]/)) {
      piece = cleanMove[0];
      const rest = cleanMove.slice(1);
      if (rest.includes('x')) {
        const parts = rest.split('x');
        disambiguation = parts[0];
        targetSquare = parts[1];
      } else {
        if (rest.length > 2) {
          disambiguation = rest.slice(0, -2);
          targetSquare = rest.slice(-2);
        } else {
          targetSquare = rest;
        }
      }
    } else {
      // Mouvement de pion
      piece = 'P';
      if (cleanMove.includes('x')) {
        const parts = cleanMove.split('x');
        disambiguation = parts[0];
        targetSquare = parts[1];
      } else {
        targetSquare = cleanMove;
      }
    }

    if (!isWhiteTurn) {
      piece = piece.toLowerCase();
    }    // Trouve toutes les pièces du bon type
    const candidateSquares: string[] = [];
    for (let square in position) {
      if (position[square] === piece) {
        candidateSquares.push(square);
      }
    }

    // Filtre selon la désambiguïsation
    let validSquares: string[] = candidateSquares;
    if (disambiguation) {
      validSquares = candidateSquares.filter(square => {
        return square.includes(disambiguation);
      });
    }

    // Trouve la pièce qui peut légalement faire le mouvement
    const legalSquare = validSquares.find(square =>
      isLegalMove(square, targetSquare, piece, position)
    ); return legalSquare ? { from: legalSquare, to: targetSquare, piece } : null;
  }, [isLegalMove]);
  /**
   * Gestion de l'animation et de l'état
   * ---------------------------------
   */

  /**
   * Réinitialise l'animation à la position initiale
   */
  const resetToInitial = React.useCallback(() => {
    setIsAnimating(false);
    setCurrentMoveIndex(0);
    if (positions.length > 0) {
      setCurrentPosition(positions[0]);
    } else {
      const initialPos = parseFEN(initialFEN);
      setCurrentPosition(initialPos);
      setPositions([initialPos]);
    }
  }, [positions, initialFEN, parseFEN]);

  /**
   * Détermine l'orientation de l'échiquier selon le joueur actif
   * @returns true si les blancs sont en bas, false si les noirs sont en bas
   */
  const getBoardOrientation = () => {
    if (positions.length === 0) return true;

    const parts = fenInput.split(' ');
    if (parts.length < 2) return true;

    const fenPart = parts.slice(0, 6).join(' ');
    const standardFEN = frenchToStandardFEN(fenPart);
    const activeColor = standardFEN.split(' ')[1];

    return activeColor === 'w';
  };

  /**
   * Génère la séquence complète des positions
   * @param initialPos Position initiale
   * @param moveList Liste des coups
   * @returns Toutes les positions et détails des mouvements
   */
  const generatePositions = React.useCallback((
    initialPos: { [key: string]: string },
    moveList: string[]
  ): GeneratePositionsResult => {
    const positions: Array<{ [key: string]: string }> = [{ ...initialPos }];
    const moveDetails: MoveDetail[] = [];
    let currentPos: { [key: string]: string } = { ...initialPos };
    let isWhiteTurn: boolean = true;

    moveList.forEach((move: string) => {
      const moveInfo = findPieceForMove(currentPos, move, isWhiteTurn);
      if (moveInfo) {
        // Stocke les détails du mouvement pour le surlignage
        const moveDet: MoveDetail = {
          from: moveInfo.from,
          to: moveInfo.to,
          piece: moveInfo.piece,
          secondaryFrom: moveInfo.secondaryMove?.from,
          secondaryTo: moveInfo.secondaryMove?.to,
          secondaryPiece: moveInfo.secondaryMove?.piece
        };
        moveDetails.push(moveDet);

        // Applique le mouvement principal
        const newPos: { [key: string]: string } = { ...currentPos };
        delete newPos[moveInfo.from];
        newPos[moveInfo.to] = moveInfo.piece;

        // Applique le mouvement secondaire (roque)
        if (moveInfo.secondaryMove) {
          delete newPos[moveInfo.secondaryMove.from];
          newPos[moveInfo.secondaryMove.to] = moveInfo.secondaryMove.piece;
        }

        currentPos = newPos;
        positions.push({ ...currentPos });
      }
      isWhiteTurn = !isWhiteTurn;
    });

    return { positions, moveDetails };
  }, [findPieceForMove]);
  /**
   * Système de navigation et contrôle
   * ------------------------------
   * Architecture du système de contrôle :
   * 
   * 1. Navigation temporelle :
   * - Déplacement précis entre positions
   * - Gestion des limites (début/fin)
   * - Transitions fluides
   * 
   * 2. Contrôles utilisateur :
   * - Avance/recul pas à pas
   * - Lecture automatique
   * - Réinitialisation
   * 
   * 3. Gestion des états :
   * - Synchronisation position/index
   * - Validation des mouvements
   * - Maintien de la cohérence
   * 
   * Toutes les fonctions de navigation sont optimisées avec useCallback
   * pour éviter les re-rendus inutiles et maintenir les performances.
   */

  // Navigation vers une position spécifique avec validation
  const goToPosition = React.useCallback((index: number) => {
    if (index >= 0 && index < positions.length) {
      setCurrentMoveIndex(index);
      setCurrentPosition(positions[index]);
    }
  }, [positions]);

  // Avance d'un pas dans l'animation
  const stepForward = React.useCallback(() => {
    if (currentMoveIndex < positions.length - 1) {
      goToPosition(currentMoveIndex + 1);
    }
  }, [currentMoveIndex, positions.length, goToPosition]);

  // Recule d'un pas dans l'animation
  const stepBack = React.useCallback(() => {
    if (currentMoveIndex > 0) {
      goToPosition(currentMoveIndex - 1);
    }
  }, [currentMoveIndex, goToPosition]);

  // Lance/arrête l'animation
  const toggleAnimation = React.useCallback(() => {
    setIsAnimating(!isAnimating);
  }, [isAnimating]);
  /**
   * Génération de GIF
   * ----------------
   * 
   * La génération de GIF se fait en plusieurs étapes :
   * 1. Capture de l'état initial et arrêt de l'animation en cours
   * 2. Création d'un objet GIF avec les paramètres optimaux
   * 3. Itération sur toutes les positions pour capturer chaque frame
   * 4. Génération et téléchargement du fichier final
   * 
   * Paramètres techniques :
   * - Résolution : taille exacte du conteneur d'échiquier
   * - Qualité : 10 (compromis taille/qualité)
   * - Workers : 2 (parallélisation du traitement)
   * - Délai : 1000ms entre chaque frame
   * 
   * Gestion des erreurs :
   * - Validation des prérequis (référence DOM, positions)
   * - Restauration de l'état en cas d'erreur
   * - Nettoyage des ressources après génération
   */
  const generateGif = React.useCallback(async () => {
    if (!boardRef.current || positions.length === 0) return;

    // Sauvegarde l'état actuel
    const currentIndex = currentMoveIndex;
    const wasAnimating = isAnimating;
    setIsAnimating(false);
    setIsGeneratingGif(true);

    try {
      const board = boardRef.current;

      // Création du GIF avec la taille exacte du conteneur
      const gif = new GIF({
        workers: 2,
        quality: 10,
        width: board.getBoundingClientRect().width,
        height: board.getBoundingClientRect().height,
        workerScript: '/gif.worker.js'
      });

      // Capture chaque position
      for (let i = 0; i < positions.length; i++) {
        setCurrentMoveIndex(i);
        setCurrentPosition(positions[i]);
        // Attendre que le DOM soit mis à jour
        await new Promise(resolve => setTimeout(resolve, 100));

        try {
          const dataUrl = await htmlToImage.toPng(board, {
            backgroundColor: '#ffffff',
            pixelRatio: 1,
            skipAutoScale: true,
            style: {
              transform: 'none',
              transformOrigin: 'center'
            },
            cacheBust: true
          });

          const img = new Image();
          img.src = dataUrl;
          await new Promise(resolve => img.onload = resolve);
          gif.addFrame(img, { delay: 1000 });
        } catch (err) {
          console.error('Error capturing frame:', err);
        }
      }

      // Génère le GIF et le télécharge
      gif.on('finished', (blob: Blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'chess-sequence.gif';
        a.click();
        URL.revokeObjectURL(url);

        // Restaure l'état
        setCurrentMoveIndex(currentIndex);
        setCurrentPosition(positions[currentIndex]);
        setIsAnimating(wasAnimating);
        setIsGeneratingGif(false);
      });

      gif.render();
    } catch (error) {
      console.error('Error generating GIF:', error);
      // Restaure l'état en cas d'erreur
      setCurrentMoveIndex(currentIndex);
      setCurrentPosition(positions[currentIndex]);
      setIsAnimating(wasAnimating);
      setIsGeneratingGif(false);
    }
  }, [positions, currentMoveIndex, isAnimating]);
  /**
   * Gestion des effets et cycles de vie
   * --------------------------------
   * L'application utilise plusieurs effets React pour :
   * 
   * 1. Animation automatique :
   * - Timer pour les transitions entre positions
   * - Gestion des états de pause/lecture
   * - Nettoyage automatique des ressources
   * 
   * 2. Synchronisation FEN/Position :
   * - Parse et validation des entrées
   * - Génération des positions intermédiaires
   * - Mise à jour de l'interface
   * 
   * 3. Gestion de la mémoire :
   * - Nettoyage des timers
   * - Libération des ressources GIF
   * - Optimisation des re-rendus
   */

  // Effet pour l'animation automatique : gestion du timing et transitions
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;

    if (isAnimating && currentMoveIndex < positions.length - 1) {
      timer = setTimeout(() => {
        goToPosition(currentMoveIndex + 1);
      }, 1000);
    } else if (currentMoveIndex >= positions.length - 1) {
      setIsAnimating(false);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isAnimating, currentMoveIndex, positions.length, goToPosition]);
  /**
   * Gestion des entrées FEN et mise à jour de l'état
   * --------------------------------------------
   * Processus complet de traitement des entrées :
   * 
   * 1. Validation et parsing :
   * - Vérification du format (standard/français)
   * - Extraction position et coups
   * - Normalisation des données
   * 
   * 2. Génération des états :
   * - Calcul des positions intermédiaires
   * - Validation des mouvements
   * - Création des détails d'animation
   * 
   * 3. Mise à jour synchronisée :
   * - Position actuelle
   * - Index de mouvement
   * - États d'animation
   */
  useEffect(() => {
    if (fenInput && fenInput.trim().length > 0) {
      const parts = fenInput.split(' ');
      const fenPart = parts.slice(0, 6).join(' ');
      const movePart = parts.slice(6).join(' ');

      const initialPos = parseFEN(fenPart);
      const moveList = parseMoves(movePart);

      // Réutilise la position initiale comme première position
      const { positions: nextPositions, moveDetails: allMoveDetails } = generatePositions(initialPos, moveList);

      setMoves(moveList);
      setPositions([initialPos, ...nextPositions.slice(1)]);
      setMoveDetails(allMoveDetails);
      setCurrentPosition(initialPos);
      setCurrentMoveIndex(0);
    }
  }, [fenInput, parseFEN, generatePositions]);
  /**
   * Rendu de l'interface graphique
   * ----------------------------
   * Le rendu de l'échiquier est optimisé pour :
   * 1. Performances : utilisation de React.useCallback pour les fonctions clés
   * 2. Accessibilité : support du contraste pour les pièces
   * 3. Responsive : adaptation à différentes tailles d'écran
   * 
   * Architecture du rendu :
   * - Grille 10x10 (8x8 + coordonnées)
   * - Orientation dynamique selon le joueur actif
   * - Gestion des surlignages et effets visuels
   * - Support des pièces fantômes pour visualisation
   * 
   * Optimisations :
   * - Mise en cache des calculs de position
   * - Rendu conditionnel des effets visuels
   * - Gestion efficace des états transitoires
   */
  const renderBoard = () => {
    const isWhitePerspective = getBoardOrientation();
    const board = [];

    // Détermine les cases du dernier mouvement pour le surlignage
    const lastMoveSquares = [];
    const currentMove = currentMoveIndex > 0 ? moveDetails[currentMoveIndex - 1] : null;

    if (currentMove) {
      lastMoveSquares.push(currentMove.from, currentMove.to);
      if (currentMove.secondaryFrom && currentMove.secondaryTo) {
        lastMoveSquares.push(currentMove.secondaryFrom, currentMove.secondaryTo);
      }
    }

    // Détermine l'ordre des files et rangées selon l'orientation
    const files = isWhitePerspective ? ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] : ['h', 'g', 'f', 'e', 'd', 'c', 'b', 'a'];
    const ranks = isWhitePerspective ? ['8', '7', '6', '5', '4', '3', '2', '1'] : ['1', '2', '3', '4', '5', '6', '7', '8'];

    // Création de la grille 10x10
    for (let row = 0; row < 10; row++) {
      for (let col = 0; col < 10; col++) {
        const isCoordCell = row === 0 || row === 9 || col === 0 || col === 9;

        if (isCoordCell) {
          // Rendu des cellules de coordonnées
          let coordLabel = '';
          if ((row === 0 || row === 9) && col > 0 && col < 9) {
            coordLabel = files[col - 1];
          } else if ((col === 0 || col === 9) && row > 0 && row < 9) {
            coordLabel = ranks[row - 1];
          }

          board.push(
            <div key={`coord-${row}-${col}`} className="board-cell coord-label">
              {coordLabel}
            </div>
          );
        } else {
          // Rendu des cases de l'échiquier
          const boardRow = isWhitePerspective ? row - 1 : 8 - row;
          const boardCol = isWhitePerspective ? col - 1 : 8 - col;
          const isLight = (boardRow + boardCol) % 2 === 0;
          const square = String.fromCharCode(97 + (isWhitePerspective ? col - 1 : 8 - col)) +
            (isWhitePerspective ? 8 - (row - 1) : row);
          const piece = currentPosition[square];

          const isLastMoveSquare = lastMoveSquares.includes(square);
          const isWhitePiece = piece && piece === piece.toUpperCase();

          // Détermine si on doit afficher une pièce fantôme
          let ghostPiece = null;
          if (currentMove && currentMoveIndex > 0) {
            if (square === currentMove.from) {
              ghostPiece = currentMove.piece;
            } else if (currentMove.secondaryFrom && square === currentMove.secondaryFrom) {
              ghostPiece = currentMove.secondaryPiece;
            }
          }

          board.push(
            <div key={`square-${row}-${col}`} className="board-cell">
              <div className={`chess-square ${isLight ? 'light' : 'dark'}`}>
                {ghostPiece && (
                  <span className="ghost-piece">
                    {pieceSymbols[ghostPiece as keyof typeof pieceSymbols]}
                  </span>
                )}
                {piece && (
                  <span
                    className={`chess-piece ${isWhitePiece ? 'text-white' : 'text-black'}`}
                    style={{
                      textShadow: isWhitePiece
                        ? (isLastMoveSquare
                          ? '0 0 3px lime, 1px 1px 1px rgba(0,0,0,0.8)'
                          : '1px 1px 1px rgba(0,0,0,0.8)')
                        : (isLastMoveSquare ? '0 0 3px lime' : 'none')
                    }}
                  >
                    {pieceSymbols[piece as keyof typeof pieceSymbols]}
                  </span>
                )}
              </div>
            </div>
          );
        }
      }
    }
    return board;
  };

  return (<div className="chess-app">
    <header className="chess-header">
      <h1 className="chess-title">
        Welcome to Chess Play Generator
      </h1>
    </header><div className="control-section">
      <div className="input-container">
        <label className="input-label">
          FEN + Coups (compatible format standard et français)
        </label>
        <textarea
          value={fenInput}
          onChange={(e) => setFenInput(e.target.value)}
          className="fen-input"
          rows={3}
          placeholder="Standard: rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1 1.e4 e5... | Français: tcfdrcft/pppppppp/8/8/8/8/PPPPPPPP/TCFDRCFT w - - 0 1 1.e4 e5..."
        />
      </div>

      <div className="button-group">
        <button
          onClick={resetToInitial}
          className="control-button secondary"
        >
          <RotateCcw size={16} />
          Réinitialiser
        </button>

        <button
          onClick={stepBack}
          className="control-button primary"
          disabled={currentMoveIndex === 0}
        >
          <StepBack size={16} />
          Reculer
        </button>

        <button
          onClick={toggleAnimation}
          className="control-button success"
        >
          {isAnimating ? <Pause size={16} /> : <Play size={16} />}
          {isAnimating ? 'Pause' : 'Lecture'}
        </button>

        <button
          onClick={stepForward}
          className="control-button primary"
          disabled={currentMoveIndex >= positions.length - 1}
        >
          <StepForward size={16} />
          Avancer
        </button>

        <button
          onClick={generateGif}
          className="control-button primary ml-4"
          disabled={positions.length === 0 || isGeneratingGif}
          title="Générer un GIF animé de la séquence"
        >
          <Download size={16} />
          {isGeneratingGif ? 'Génération...' : 'Télécharger GIF'}
        </button>
      </div>
    </div>

    {moves.length > 0 && (
      <div className="info-section">
        <p className="text-sm text-gray-600">
          Coup {currentMoveIndex} / {positions.length - 1}
          {currentMoveIndex > 0 && moves[currentMoveIndex - 1] && (
            <span className="ml-2 font-semibold">
              Dernier coup: {moves[currentMoveIndex - 1]}
            </span>
          )}
        </p>
      </div>
    )}

    <div className="board-section">
      <div
        className="chessboard-container"
        ref={boardRef}
        style={{
          display: 'inline-grid',
          gridTemplateColumns: 'repeat(10, 1fr)',
          gridTemplateRows: 'repeat(10, 1fr)',
          gap: '0px',
          padding: '8px',
          backgroundColor: '#fff',
          boxSizing: 'border-box',
          border: '1px solid #ccc',
          borderRadius: '4px',
          width: 'fit-content'
        }}
      >
        {renderBoard()}
      </div>
    </div>

    <div className="help-section">
      <div className="text-sm text-gray-600">
        <p>Format accepté: FEN standard ou français suivi des coups en notation algébrique</p>
        <p>Exemple standard: rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1 1.e4 e5 2.Nf3 Nc6</p>
        <p>Exemple français: tcfdrcft/pppppppp/8/8/8/8/PPPPPPPP/TCFDRCFT w - - 0 1 1.e4 e5 2.Cf3 Cc6</p>
        <p className="mt-2 text-cyan-600 font-medium">
          🔮 Les pièces fantômes cyan indiquent la position de départ du dernier mouvement
        </p>
        <p className="mt-1 text-purple-600 font-medium">
          🔄 L'échiquier s'oriente automatiquement selon le joueur dont c'est le tour (w=blancs en bas, b=noirs en bas)
        </p>
      </div>
    </div>
  </div>
  );
};

export default ChessAnimator;