import React, { useState, useEffect, useRef } from 'react';
import { Play, RotateCcw, Pause, StepForward, StepBack, Download } from 'lucide-react';
import * as htmlToImage from 'html-to-image';
import GIF from 'gif.js';
import './chess-play-generator.css';

// Types pour les pièces d'échecs
type ChessPiece = 'K' | 'Q' | 'R' | 'B' | 'N' | 'P' | 'k' | 'q' | 'r' | 'b' | 'n' | 'p';
type PieceSymbols = { [K in ChessPiece]: string };

// Interfaces pour la gestion des positions et mouvements
interface PositionMap {
  [square: string]: string;
}

interface SecondaryMove {
  from: string;
  to: string;
  piece: string;
}

interface MoveInfo {
  from: string;
  to: string;
  piece: string;
  secondaryMove?: SecondaryMove;
}

interface MoveDetail {
  from: string;
  to: string;
  piece: string;
  secondaryFrom?: string;
  secondaryTo?: string;
  secondaryPiece?: string;
}

interface AlgebraicCoords {
  row: number; // 0-7 pour les rangées (8-1)
  col: number; // 0-7 pour les colonnes (a-h)
}

interface GeneratePositionsResult {
  positions: Array<{ [key: string]: string }>;

  moveDetails: MoveDetail[];
}

// Interfaces pour la conversion de FEN
interface IsFrenchFEN {
  (fen: string): boolean;
}

interface FrenchToStandardFEN {
  (fen: string): string;
}

const ChessAnimator = () => {
  const boardRef = useRef<HTMLDivElement>(null);
  const [fenInput, setFenInput] = useState('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1 1.e4 e5 2.Nf3 Nc6');
  const [currentPosition, setCurrentPosition] = useState<{ [key: string]: string }>({});
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentMoveIndex, setCurrentMoveIndex] = useState(0);
  const [moves, setMoves] = useState<string[]>([]);
  const [positions, setPositions] = useState<Array<{ [key: string]: string }>>([]);
  const [moveDetails, setMoveDetails] = useState<MoveDetail[]>([]);
  const [isGeneratingGif, setIsGeneratingGif] = useState(false);

  const initialFEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

  // Conversion des pièces FEN vers symboles Unicode (standard et français)
  const pieceSymbols: PieceSymbols = {
    // Format standard
    'K': '♔', 'Q': '♕', 'R': '♖', 'B': '♗', 'N': '♘', 'P': '♙',
    'k': '♚', 'q': '♛', 'r': '♜', 'b': '♝', 'n': '♞', 'p': '♟'
  };

  // Détecte si le FEN est en format français
  const isFrenchFEN = React.useCallback<IsFrenchFEN>((fen) => {
    const boardPart = fen.split(' ')[0];
    return /[DdTtFfCc]/.test(boardPart);
  }, []);

  // Convertit FEN français vers standard pour traitement interne
  const frenchToStandardFEN = React.useCallback<FrenchToStandardFEN>((fen) => {
    if (!isFrenchFEN(fen)) return fen;

    return fen
      .replace(/R/g, 'K').replace(/r/g, 'k') // Roi
      .replace(/D/g, 'Q').replace(/d/g, 'q') // Dame
      .replace(/T/g, 'R').replace(/t/g, 'r') // Tour
      .replace(/F/g, 'B').replace(/f/g, 'b') // Fou
      .replace(/C/g, 'N').replace(/c/g, 'n'); // Cavalier
    // P/p restent identiques pour Pion
  }, [isFrenchFEN]);
  // Conversion notation algébrique vers coordonnées


  // Conversion coordonnées vers notation algébrique  
  const coordsToAlgebraic = React.useCallback((row: number, col: number): string => {
    return String.fromCharCode(97 + col) + (8 - row);
  }, []);

  // Parse FEN pour extraire la position (compatible français et standard)
  const parseFEN = React.useCallback((fen: string): { [key: string]: string } => {
    // Convertit automatiquement le FEN français en standard pour traitement
    const standardFEN = frenchToStandardFEN(fen);
    const parts = standardFEN.split(' ');
    const boardPart = parts[0];
    const ranks = boardPart.split('/');
    const position: { [key: string]: string } = {};

    ranks.forEach((rank: string, rankIndex: number) => {
      let fileIndex = 0;
      for (let char of rank) {
        if (isNaN(Number(char))) {
          const coords: AlgebraicCoords = { row: rankIndex, col: fileIndex };
          const square = coordsToAlgebraic(coords.row, coords.col);
          position[square] = char;
          fileIndex++;
        } else {
          fileIndex += parseInt(char);
        }
      }
    });

    return position;
  }, [frenchToStandardFEN, coordsToAlgebraic]);

  // Parse les coups depuis la notation PGN
  const parseMoves = (moveString: string): string[] => {
    if (!moveString) return [];

    // Supprime les numéros de coups et divise les coups
    const cleanMoves: string[] = moveString
      .replace(/\d+\./g, '') // Supprime les numéros de coups
      .trim()
      .split(/\s+/)
      .filter((move: string) => move.length > 0);

    return cleanMoves;
  };

  // Vérifie s'il y a des pièces entre la case de départ et d'arrivée
  const isPieceBetween = React.useCallback((
    from: string,
    to: string,
    position: PositionMap
  ): boolean => {
    const fromFile = from.charCodeAt(0) - 97;
    const fromRank = 8 - parseInt(from[1]);
    const toFile = to.charCodeAt(0) - 97;
    const toRank = 8 - parseInt(to[1]);

    const fileStep = Math.sign(toFile - fromFile) || 0;
    const rankStep = Math.sign(toRank - fromRank) || 0;

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

  // Vérifie si la pièce peut légalement se déplacer vers la case cible
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
  // Trouve la pièce qui peut faire le mouvement
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
  // Génère toutes les positions de l'animation// Réinitialise à la position de base
  const resetToInitial = React.useCallback(() => {
    setIsAnimating(false);
    setCurrentMoveIndex(0);
    // Si nous avons déjà des positions, utilise la première, sinon parse le FEN initial
    if (positions.length > 0) {
      setCurrentPosition(positions[0]);
    } else {
      const initialPos = parseFEN(initialFEN);
      setCurrentPosition(initialPos);
      setPositions([initialPos]);
    }
  }, [positions, initialFEN, parseFEN]);

  // Détermine l'orientation du plateau selon le joueur actuel
  const getBoardOrientation = () => {
    if (positions.length === 0) return true; // Par défaut, côté blancs

    const parts = fenInput.split(' ');
    if (parts.length < 2) return true;

    const fenPart = parts.slice(0, 6).join(' ');
    const standardFEN = frenchToStandardFEN(fenPart);
    const activeColor = standardFEN.split(' ')[1];

    // true = côté blancs en bas, false = côté noirs en bas
    return activeColor === 'w';
  };

  // Génère toutes les positions à partir d'une position initiale et d'une liste de coups
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
  }, [findPieceForMove]);  // Va à une position spécifique
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

  // Crée un GIF à partir de toutes les positions
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

  // Effet pour l'animation automatique
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
  // Effet pour générer automatiquement l'animation quand le FEN change
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

  // Rendu de l'échiquier avec la nouvelle structure 10x10
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