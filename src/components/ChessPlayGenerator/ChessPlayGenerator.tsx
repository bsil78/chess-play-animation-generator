import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import * as htmlToImage from 'html-to-image';
import GIF from 'gif.js';
import { PositionMap, MoveDetail, createEmptyPosition, createPositionWithPieces, Square } from '../../types/chess';
import { generatePositions } from '../../utils/ChessRules';
import { parseFEN } from '../../utils';
import { StandardPiece } from '../../types/notation';
import ChessBoard from '../ChessBoard/ChessBoard';
import GameControls from '../GameControls/GameControls';
import './ChessPlayGenerator.css';

/**
 * Composant principal ChessPlayGenerator
 * Gère l'affichage et l'animation d'une séquence de coups d'échecs
 */
const ChessPlayGenerator: React.FC = () => {
  // Référence vers l'élément DOM de l'échiquier pour la génération de GIF
  const boardRef = useRef<HTMLDivElement>(null);

  // États principaux
  const [fenInput, setFenInput] = useState('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1 1.e4 e5 2.Nf3 Nc6');
  const [currentPosition, setCurrentPosition] = useState<PositionMap>(createEmptyPosition());
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentMoveIndex, setCurrentMoveIndex] = useState(0);
  const [isGeneratingGif, setIsGeneratingGif] = useState(false);

  // Données dérivées de la position FEN
  const [moves, setMoves] = useState<string[]>([]);
  const [positions, setPositions] = useState<PositionMap[]>([]);
  const [moveDetails, setMoveDetails] = useState<MoveDetail[]>([]);

  // Position FEN initiale standard
  const initialFEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

  /**
   * Navigation et contrôles
   */
  const goToPosition = useCallback((index: number) => {
    if (index >= 0 && index < positions.length && positions[index]) {
      setCurrentMoveIndex(index);
      setCurrentPosition(positions[index]!);
    }
  }, [positions]);

  const resetToInitial = useCallback(() => {
    setIsAnimating(false);
    setCurrentMoveIndex(0);
    if (positions.length > 0 && positions[0]) {
      setCurrentPosition(positions[0]);
    } else {
      const parsedFEN = parseFEN(initialFEN);
      if (parsedFEN.isValid) {
        setCurrentPosition(parsedFEN.structure.position);
      }
    }
  }, [positions, initialFEN]);

  const stepForward = useCallback(() => {
    if (currentMoveIndex < positions.length - 1) {
      goToPosition(currentMoveIndex + 1);
    }
  }, [currentMoveIndex, goToPosition, positions.length]);

  const stepBack = useCallback(() => {
    if (currentMoveIndex > 0) {
      goToPosition(currentMoveIndex - 1);
    }
  }, [currentMoveIndex, goToPosition]);

  const toggleAnimation = useCallback(() => {
    setIsAnimating(!isAnimating);
  }, [isAnimating]);

  /**
   * Données calculées
   */
  const lastMoveSquares = useMemo((): Square[] => {
    if (currentMoveIndex === 0) return [];
    const currentMove = moveDetails[currentMoveIndex - 1];
    if (!currentMove) return [];
    
    const squares: Square[] = [currentMove.from, currentMove.to];
    if (currentMove.secondaryMove) {
        squares.push(currentMove.secondaryMove.from, currentMove.secondaryMove.to);
    }
    return squares;
  }, [currentMoveIndex, moveDetails]);

  const ghostPieces = useMemo((): PositionMap => {
    if (currentMoveIndex === 0) {
        return createEmptyPosition();
    }
    
    const currentMove = moveDetails[currentMoveIndex - 1];
    if (!currentMove) {
        return createEmptyPosition();
    }
    
    const pieces: Record<string, StandardPiece> = {};
    
    pieces[currentMove.from] = currentMove.piece;
    
    if (currentMove.secondaryMove) {
        pieces[currentMove.secondaryMove.from] = currentMove.secondaryMove.piece;
    }
    
    return createPositionWithPieces(pieces);
  }, [currentMoveIndex, moveDetails]);

  const boardOrientation = useMemo(() => {
    if (fenInput.trim().length === 0) return true;
    const parsedFEN = parseFEN(fenInput);
    return parsedFEN.isValid ? parsedFEN.structure.activeColor === 'w' : true;
  }, [fenInput]);

  /**
   * Génération de GIF
   */
  const generateGif = useCallback(async () => {
    if (!boardRef.current || positions.length === 0) return;

    const currentIndex = currentMoveIndex;
    const wasAnimating = isAnimating;
    setIsAnimating(false);
    setIsGeneratingGif(true);

    try {
      const board = boardRef.current;
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
        const position = positions[i];
        if (position) {
          setCurrentPosition(position);
        }
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
          await new Promise<void>(resolve => { 
            img.onload = () => resolve(); 
          });
          gif.addFrame(img, { delay: 1000 });
        } catch (err) {
          console.error('Error capturing frame:', err);
        }
      }

      gif.on('finished', (blob: Blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'chess-sequence.gif';
        a.click();
        URL.revokeObjectURL(url);

        // Restaure l'état
        setCurrentMoveIndex(currentIndex);
        const restoredPosition = positions[currentIndex];
        if (restoredPosition) {
          setCurrentPosition(restoredPosition);
        }
        setIsAnimating(wasAnimating);
        setIsGeneratingGif(false);
      });

      gif.render();
    } catch (error) {
      console.error('Error generating GIF:', error);
      setCurrentMoveIndex(currentIndex);
      const restoredPosition = positions[currentIndex];
      if (restoredPosition) {
        setCurrentPosition(restoredPosition);
      }
      setIsAnimating(wasAnimating);
      setIsGeneratingGif(false);
    }
  }, [currentMoveIndex, isAnimating, positions]);

  /**
   * Effets
   */
  // Animation automatique
  useEffect(() => {
    if (!isAnimating || currentMoveIndex >= positions.length - 1) {
      if (currentMoveIndex >= positions.length - 1) {
        setIsAnimating(false);
      }
      return;
    }

    const timer = setTimeout(() => {
      goToPosition(currentMoveIndex + 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [isAnimating, currentMoveIndex, goToPosition, positions.length]);

  // Synchronisation avec l'entrée FEN
  useEffect(() => {
    if (!fenInput || fenInput.trim().length === 0) return;

    const parsedFEN = parseFEN(fenInput);
    if (!parsedFEN.isValid) {
      console.error('Invalid FEN:', parsedFEN.error);
      return;
    }

    const result = generatePositions(parsedFEN.structure.position, parsedFEN.structure.moves);

    setMoves(parsedFEN.structure.moves);
    setPositions([parsedFEN.structure.position, ...result.positions]);
    setMoveDetails(result.moveDetails);
    setCurrentPosition(parsedFEN.structure.position);
    setCurrentMoveIndex(0);
  }, [fenInput]);

  // Protection pour s'assurer qu'on a toujours un lastMove valide
  const safeLastMove = currentMoveIndex > 0 && moves[currentMoveIndex - 1] ? 
    moves[currentMoveIndex - 1] : undefined;

  return (
    <div className="chess-app">
      <header className="chess-header">
        <h1 className="chess-title">Chess Play Generator</h1>
      </header>

      <GameControls
        fenInput={fenInput}
        onFenInputChange={setFenInput}
        isAnimating={isAnimating}
        isGeneratingGif={isGeneratingGif}
        currentMoveIndex={currentMoveIndex}
        totalMoves={positions.length - 1}
        lastMove={safeLastMove}
        onReset={resetToInitial}
        onStepBack={stepBack}
        onTogglePlay={toggleAnimation}
        onStepForward={stepForward}
        onGenerateGif={generateGif}
      />

      <ChessBoard
        ref={boardRef}
        position={currentPosition}
        isWhitePerspective={boardOrientation}
        lastMoveSquares={lastMoveSquares}
        ghostPieces={ghostPieces}
      />
    </div>
  );
};

export default ChessPlayGenerator;