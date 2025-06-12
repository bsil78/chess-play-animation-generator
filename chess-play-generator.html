import React, { useState, useEffect } from 'react';
import { Play, RotateCcw, Pause } from 'lucide-react';

const ChessAnimator = () => {
  const [fenInput, setFenInput] = useState('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1 1.e4 e5 2.Nf3 Nc6');
  const [currentPosition, setCurrentPosition] = useState({});
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentMoveIndex, setCurrentMoveIndex] = useState(0);
  const [moves, setMoves] = useState([]);
  const [positions, setPositions] = useState([]);
  const [moveDetails, setMoveDetails] = useState([]);

  const initialFEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

  // Conversion des pièces FEN vers symboles Unicode (standard et français)
  const pieceSymbols = {
    // Format standard
    'K': '♔', 'Q': '♕', 'R': '♖', 'B': '♗', 'N': '♘', 'P': '♙',
    'k': '♚', 'q': '♛', 'r': '♜', 'b': '♝', 'n': '♞', 'p': '♟',
    // Format français
    'R': '♔', 'D': '♕', 'T': '♖', 'F': '♗', 'C': '♘', 'P': '♙',
    'r': '♚', 'd': '♛', 't': '♜', 'f': '♝', 'c': '♞', 'p': '♟'
  };

  // Détecte si le FEN est en format français
  const isFrenchFEN = (fen) => {
    const boardPart = fen.split(' ')[0];
    return /[DdTtFfCc]/.test(boardPart);
  };

  // Convertit FEN français vers standard pour traitement interne
  const frenchToStandardFEN = (fen) => {
    if (!isFrenchFEN(fen)) return fen;
    
    return fen
      .replace(/R/g, 'K').replace(/r/g, 'k') // Roi
      .replace(/D/g, 'Q').replace(/d/g, 'q') // Dame
      .replace(/T/g, 'R').replace(/t/g, 'r') // Tour
      .replace(/F/g, 'B').replace(/f/g, 'b') // Fou
      .replace(/C/g, 'N').replace(/c/g, 'n') // Cavalier
      // P/p restent identiques pour Pion
  };

  // Conversion notation algébrique vers coordonnées
  const algebraicToCoords = (square) => {
    const file = square.charCodeAt(0) - 97; // a=0, b=1, etc.
    const rank = 8 - parseInt(square[1]); // 8=0, 7=1, etc.
    return { row: rank, col: file };
  };

  // Conversion coordonnées vers notation algébrique  
  const coordsToAlgebraic = (row, col) => {
    return String.fromCharCode(97 + col) + (8 - row);
  };

  // Parse FEN pour extraire la position (compatible français et standard)
  const parseFEN = (fen) => {
    // Convertit automatiquement le FEN français en standard pour traitement
    const standardFEN = frenchToStandardFEN(fen);
    const parts = standardFEN.split(' ');
    const boardPart = parts[0];
    const ranks = boardPart.split('/');
    const position = {};

    ranks.forEach((rank, rankIndex) => {
      let fileIndex = 0;
      for (let char of rank) {
        if (isNaN(char)) {
          const square = coordsToAlgebraic(rankIndex, fileIndex);
          position[square] = char;
          fileIndex++;
        } else {
          fileIndex += parseInt(char);
        }
      }
    });

    return position;
  };

  // Parse les coups depuis la notation PGN
  const parseMoves = (moveString) => {
    if (!moveString) return [];
    
    // Supprime les numéros de coups et divise les coups
    const cleanMoves = moveString
      .replace(/\d+\./g, '') // Supprime les numéros de coups
      .trim()
      .split(/\s+/)
      .filter(move => move.length > 0);
    
    return cleanMoves;
  };

  // Trouve la pièce qui peut faire le mouvement
  const findPieceForMove = (position, move, isWhiteTurn) => {
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
    let targetSquare, piece, disambiguation = '';

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
    }

    // Trouve toutes les pièces du bon type
    const candidateSquares = [];
    for (let square in position) {
      if (position[square] === piece) {
        candidateSquares.push(square);
      }
    }

    // Filtre selon la désambiguïsation
    let validSquares = candidateSquares;
    if (disambiguation) {
      validSquares = candidateSquares.filter(square => {
        return square.includes(disambiguation);
      });
    }

    // Pour simplifier, prend la première pièce valide
    const fromSquare = validSquares[0];
    
    return fromSquare ? { from: fromSquare, to: targetSquare, piece } : null;
  };

  // Génère toutes les positions de l'animation
  const generatePositions = (initialPos, moveList) => {
    const positions = [{ ...initialPos }];
    const moveDetails = [];
    let currentPos = { ...initialPos };
    let isWhiteTurn = true;

    moveList.forEach(move => {
      const moveInfo = findPieceForMove(currentPos, move, isWhiteTurn);
      if (moveInfo) {
        // Stocke les détails du mouvement pour le surlignage
        const moveDet = {
          from: moveInfo.from,
          to: moveInfo.to,
          piece: moveInfo.piece,
          secondaryFrom: moveInfo.secondaryMove?.from,
          secondaryTo: moveInfo.secondaryMove?.to,
          secondaryPiece: moveInfo.secondaryMove?.piece
        };
        moveDetails.push(moveDet);

        // Applique le mouvement principal
        const newPos = { ...currentPos };
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
  };

  // Réinitialise à la position de base
  const resetToInitial = () => {
    setFenInput(initialFEN);
    setIsAnimating(false);
    setCurrentMoveIndex(0);
    const initialPos = parseFEN(initialFEN);
    setCurrentPosition(initialPos);
    setMoves([]);
    setPositions([initialPos]);
    setMoveDetails([]);
  };

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

  // Génère l'animation
  const generateAnimation = () => {
    const parts = fenInput.split(' ');
    const fenPart = parts.slice(0, 6).join(' ');
    const movePart = parts.slice(6).join(' ');
    
    // Détecte automatiquement le format et convertit si nécessaire
    const isFrench = isFrenchFEN(fenPart);
    const initialPos = parseFEN(fenPart);
    const moveList = parseMoves(movePart);
    
    setMoves(moveList);
    const { positions: allPositions, moveDetails: allMoveDetails } = generatePositions(initialPos, moveList);
    setPositions(allPositions);
    setMoveDetails(allMoveDetails);
    setCurrentPosition(allPositions[0]);
    setCurrentMoveIndex(0);
    
    // Affiche le format détecté (optionnel, pour information)
    console.log(`Format détecté: ${isFrench ? 'FEN Français' : 'FEN Standard'}`);
  };

  // Lance/arrête l'animation
  const toggleAnimation = () => {
    setIsAnimating(!isAnimating);
  };

  // Effet pour l'animation automatique
  useEffect(() => {
    if (isAnimating && currentMoveIndex < positions.length - 1) {
      const timer = setTimeout(() => {
        const nextIndex = currentMoveIndex + 1;
        setCurrentMoveIndex(nextIndex);
        setCurrentPosition(positions[nextIndex]);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (currentMoveIndex >= positions.length - 1) {
      setIsAnimating(false);
    }
  }, [isAnimating, currentMoveIndex, positions]);

  // Initialise avec la position de départ
  useEffect(() => {
    const initialPos = parseFEN(initialFEN);
    setCurrentPosition(initialPos);
  }, []);

  // Rendu de l'échiquier
  const renderBoard = () => {
    const board = [];
    const isWhitePerspective = getBoardOrientation();
    
    // Détermine les cases du dernier mouvement pour le surlignage
    const lastMoveSquares = [];
    const currentMove = currentMoveIndex > 0 ? moveDetails[currentMoveIndex - 1] : null;
    
    if (currentMove) {
      lastMoveSquares.push(currentMove.from, currentMove.to);
      if (currentMove.secondaryFrom && currentMove.secondaryTo) {
        lastMoveSquares.push(currentMove.secondaryFrom, currentMove.secondaryTo);
      }
    }
    
    // Détermine l'ordre des rangées et colonnes selon l'orientation
    const rows = isWhitePerspective ? [0, 1, 2, 3, 4, 5, 6, 7] : [7, 6, 5, 4, 3, 2, 1, 0];
    const cols = isWhitePerspective ? [0, 1, 2, 3, 4, 5, 6, 7] : [7, 6, 5, 4, 3, 2, 1, 0];
    
    for (let rowIdx = 0; rowIdx < 8; rowIdx++) {
      for (let colIdx = 0; colIdx < 8; colIdx++) {
        const row = rows[rowIdx];
        const col = cols[colIdx];
        const isLight = (row + col) % 2 === 0;
        const square = coordsToAlgebraic(row, col);
        const piece = currentPosition[square];
        
        // Vérifie si cette case fait partie du dernier mouvement
        const isLastMoveSquare = lastMoveSquares.includes(square);
        const isWhitePiece = piece && piece === piece.toUpperCase();
        
        // Détermine si on doit afficher une pièce fantôme
        let ghostPiece = null;
        if (currentMove && currentMoveIndex > 0) {
          // Pièce fantôme sur la case de départ du mouvement principal
          if (square === currentMove.from) {
            ghostPiece = currentMove.piece;
          }
          // Pièce fantôme sur la case de départ du mouvement secondaire (roque)
          else if (currentMove.secondaryFrom && square === currentMove.secondaryFrom) {
            ghostPiece = currentMove.secondaryPiece;
          }
        }
        
        board.push(
          <div
            key={`${rowIdx}-${colIdx}`}
            className={`w-12 h-12 flex items-center justify-center text-2xl font-bold relative ${
              isLight ? 'bg-amber-100' : 'bg-amber-800'
            }`}
          >
            {/* Pièce fantôme (position de départ) */}
            {ghostPiece && (
              <span 
                className="absolute inset-0 flex items-center justify-center text-cyan-400"
                style={{
                  textShadow: '0 0 8px cyan, 0 0 12px cyan',
                  opacity: 0.8
                }}
              >
                {pieceSymbols[ghostPiece]}
              </span>
            )}
            
            {/* Pièce normale (position actuelle) */}
            {piece && (
              <span 
                className={`relative z-10 ${
                  isWhitePiece 
                    ? 'text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]' 
                    : 'text-black'
                }`}
                style={{
                  textShadow: isWhitePiece 
                    ? (isLastMoveSquare 
                        ? '0 0 3px lime, 1px 1px 1px rgba(0,0,0,0.8)' 
                        : '1px 1px 1px rgba(0,0,0,0.8)')
                    : (isLastMoveSquare ? '0 0 3px lime' : 'none')
                }}
              >
                {pieceSymbols[piece]}
              </span>
            )}
          </div>
        );
      }
    }
    return board;
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white">
      <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">
        Animateur d'Échecs FEN avec Pièce Fantôme
      </h1>
      
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          FEN + Coups (compatible format standard et français)
        </label>
        <textarea
          value={fenInput}
          onChange={(e) => setFenInput(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          rows="3"
          placeholder="Standard: rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1 1.e4 e5... | Français: tcfdrcft/pppppppp/8/8/8/8/PPPPPPPP/TCFDRCFT w - - 0 1 1.e4 e5..."
        />
      </div>

      <div className="flex gap-4 mb-6">
        <button
          onClick={resetToInitial}
          className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
        >
          <RotateCcw size={16} />
          Réinitialiser
        </button>
        
        <button
          onClick={generateAnimation}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
        >
          Générer l'animation
        </button>
        
        {positions.length > 1 && (
          <button
            onClick={toggleAnimation}
            className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
          >
            {isAnimating ? <Pause size={16} /> : <Play size={16} />}
            {isAnimating ? 'Pause' : 'Lecture'}
          </button>
        )}
      </div>

      {moves.length > 0 && (
        <div className="mb-4 p-3 bg-gray-50 rounded-md">
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

      <div className="flex justify-center">
        <div className="inline-block">
          {/* Coordonnées supérieures (colonnes a-h ou h-a selon orientation) */}
          <div className="flex">
            <div className="w-6"></div> {/* Espace pour coin */}
            {(getBoardOrientation() ? ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] : ['h', 'g', 'f', 'e', 'd', 'c', 'b', 'a']).map(file => (
              <div key={`top-${file}`} className="w-12 h-6 flex items-center justify-center text-sm font-semibold text-gray-700">
                {file}
              </div>
            ))}
            <div className="w-6"></div> {/* Espace pour coin */}
          </div>
          
          {/* Échiquier avec coordonnées latérales */}
          <div className="flex">
            {/* Coordonnées gauches (rangées 8-1 ou 1-8 selon orientation) */}
            <div className="flex flex-col">
              {(getBoardOrientation() ? [8, 7, 6, 5, 4, 3, 2, 1] : [1, 2, 3, 4, 5, 6, 7, 8]).map(rank => (
                <div key={`left-${rank}`} className="w-6 h-12 flex items-center justify-center text-sm font-semibold text-gray-700">
                  {rank}
                </div>
              ))}
            </div>
            
            {/* Échiquier principal */}
            <div className="grid grid-cols-8 gap-0 border-2 border-gray-800">
              {renderBoard()}
            </div>
            
            {/* Coordonnées droites (rangées 8-1 ou 1-8 selon orientation) */}
            <div className="flex flex-col">
              {(getBoardOrientation() ? [8, 7, 6, 5, 4, 3, 2, 1] : [1, 2, 3, 4, 5, 6, 7, 8]).map(rank => (
                <div key={`right-${rank}`} className="w-6 h-12 flex items-center justify-center text-sm font-semibold text-gray-700">
                  {rank}
                </div>
              ))}
            </div>
          </div>
          
          {/* Coordonnées inférieures (colonnes a-h ou h-a selon orientation) */}
          <div className="flex">
            <div className="w-6"></div> {/* Espace pour coin */}
            {(getBoardOrientation() ? ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] : ['h', 'g', 'f', 'e', 'd', 'c', 'b', 'a']).map(file => (
              <div key={`bottom-${file}`} className="w-12 h-6 flex items-center justify-center text-sm font-semibold text-gray-700">
                {file}
              </div>
            ))}
            <div className="w-6"></div> {/* Espace pour coin */}
          </div>
        </div>
      </div>

      <div className="mt-4 text-sm text-gray-600 text-center">
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
  );
};

export default ChessAnimator;