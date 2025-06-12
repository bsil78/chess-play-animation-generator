import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as htmlToImage from 'html-to-image';
import GIF from 'gif.js';
import ChessBoard from './ChessBoard';
import GameControls from './GameControls';
import { PositionMap, MoveDetail } from '../types/chess';
import {
  parseFEN,
  parseMoves,
  generatePositions,
  frenchToStandardFEN
} from '../utils/ChessRules';
import './chess-play-generator.css';

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
  const [currentPosition, setCurrentPosition] = useState<PositionMap>({});

  // Contrôle de l'animation
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentMoveIndex, setCurrentMoveIndex] = useState(0);

  // Liste des coups et positions
  const [moves, setMoves] = useState<string[]>([]);
  const [positions, setPositions] = useState<PositionMap[]>([]);
  const [moveDetails, setMoveDetails] = useState<MoveDetail[]>([]);

  // État de la génération du GIF
  const [isGeneratingGif, setIsGeneratingGif] = useState(false);

  // Position FEN initiale standard
  const initialFEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

  /**
   * Gestion de l'animation et de l'état
   * ---------------------------------
   */

  /**
   * Réinitialise l'animation à la position initiale
   */  const resetToInitial = React.useCallback(() => {
    setIsAnimating(false);
    setCurrentMoveIndex(0);
    if (positions.length > 0) {
      setCurrentPosition(positions[0]);
    } else {
      const initialPos = parseFEN(initialFEN);
      setCurrentPosition(initialPos);
      setPositions([initialPos]);
    }
  }, [positions]);

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
  }, [currentMoveIndex, goToPosition, positions.length]);

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

  // Fonctions utilitaires mémorisées
  const lastMoveSquares = useMemo(() => {
    if (currentMoveIndex === 0 || !moveDetails[currentMoveIndex - 1]) return [];
    const currentMove = moveDetails[currentMoveIndex - 1];
    const squares = [currentMove.from, currentMove.to];
    if (currentMove.secondaryFrom && currentMove.secondaryTo) {
      squares.push(currentMove.secondaryFrom, currentMove.secondaryTo);
    }
    return squares;
  }, [currentMoveIndex, moveDetails]);
  const ghostPieces = useMemo(() => {
    if (currentMoveIndex === 0 || !moveDetails[currentMoveIndex - 1]) return {};
    const currentMove = moveDetails[currentMoveIndex - 1];
    const pieces: PositionMap = {
      [currentMove.from]: currentMove.piece
    };
    if (currentMove.secondaryFrom && currentMove.secondaryPiece) {
      pieces[currentMove.secondaryFrom] = currentMove.secondaryPiece;
    }
    return pieces;
  }, [currentMoveIndex, moveDetails]);

  const boardOrientation = useMemo(() => {
    if (positions.length === 0) return true;

    const parts = fenInput.split(' ');
    if (parts.length < 2) return true;

    const fenPart = parts.slice(0, 6).join(' ');
    const standardFEN = frenchToStandardFEN(fenPart);
    const activeColor = standardFEN.split(' ')[1];

    return activeColor === 'w';
  }, [fenInput, positions.length]);

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
   */  const generateGif = React.useCallback(async () => {
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
  }, [currentMoveIndex, isAnimating, positions]);
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
  }, [isAnimating, currentMoveIndex, goToPosition, positions.length]);

  // Effet pour synchroniser les positions avec l'entrée FEN
  useEffect(() => {
    if (fenInput && fenInput.trim().length > 0) {
      const parts = fenInput.split(' ');
      const fenPart = parts.slice(0, 6).join(' ');
      const movePart = parts.slice(6).join(' ');

      const initialPos = parseFEN(fenPart);
      const moveList = parseMoves(movePart);

      const { positions: nextPositions, moveDetails: allMoveDetails } = generatePositions(initialPos, moveList);

      setMoves(moveList);
      setPositions([initialPos, ...nextPositions.slice(1)]);
      setMoveDetails(allMoveDetails);
      setCurrentPosition(initialPos);
      setCurrentMoveIndex(0);
    }
  }, [fenInput]);

  /**
   * Fonctions utilitaires pour les composants enfants
   * --------------------------------------------
   * Ces fonctions préparent les données nécessaires aux composants
   * ChessBoard et GameControls, en assurant une séparation claire
   * des responsabilités et en minimisant le couplage.
   */
  return (
    <div className="chess-app">
      <header className="chess-header">
        <h1 className="chess-title">
          Welcome to Chess Play Generator
        </h1>
      </header>

      <GameControls
        fenInput={fenInput}
        onFenInputChange={setFenInput}
        isAnimating={isAnimating}
        isGeneratingGif={isGeneratingGif}
        currentMoveIndex={currentMoveIndex}
        totalMoves={positions.length - 1}
        lastMove={currentMoveIndex > 0 ? moves[currentMoveIndex - 1] : undefined}
        onReset={resetToInitial}
        onStepBack={stepBack}
        onTogglePlay={toggleAnimation}
        onStepForward={stepForward}
        onGenerateGif={generateGif}
      />

      <ChessBoard
        ref={boardRef}
        currentPosition={currentPosition}
        isWhitePerspective={boardOrientation}
        lastMoveSquares={lastMoveSquares}
        ghostPieces={ghostPieces}
      />
    </div>
  );
};

export default ChessAnimator;