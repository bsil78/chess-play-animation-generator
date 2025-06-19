import { PositionMap, GeneratePositionsResult, MoveDetail } from '../types/chess';
import { StandardPiece, Square } from '../types/notation';
import { convertMoveToStandard, isFrenchNotation } from './NotationConverter';

/**
 * Fonction utilitaire pour déterminer si une pièce est blanche
 */
const isWhitePiece = (piece: StandardPiece): boolean => {
    return [
        StandardPiece.WhiteKing,
        StandardPiece.WhiteQueen,
        StandardPiece.WhiteRook,
        StandardPiece.WhiteBishop,
        StandardPiece.WhiteKnight,
        StandardPiece.WhitePawn
    ].includes(piece);
};


/**
 * Fonction utilitaire pour obtenir le type de pièce (sans couleur)
 */
const getPieceType = (piece: StandardPiece): string => {
    if ([StandardPiece.WhiteKing, StandardPiece.BlackKing].includes(piece)) return 'K';
    if ([StandardPiece.WhiteQueen, StandardPiece.BlackQueen].includes(piece)) return 'Q';
    if ([StandardPiece.WhiteRook, StandardPiece.BlackRook].includes(piece)) return 'R';
    if ([StandardPiece.WhiteBishop, StandardPiece.BlackBishop].includes(piece)) return 'B';
    if ([StandardPiece.WhiteKnight, StandardPiece.BlackKnight].includes(piece)) return 'N';
    if ([StandardPiece.WhitePawn, StandardPiece.BlackPawn].includes(piece)) return 'P';
    return '';
};

/**
 * Vérifie s'il y a des pièces entre deux cases
 * Utilisé pour les mouvements de la tour, du fou et de la dame
 */
export const isPieceBetween = (
    from: Square,
    to: Square,
    position: PositionMap
): boolean => {
    // Convertit les coordonnées algébriques en indices numériques
    const fromFile = from.charCodeAt(0) - 97;
    const fromRank = 8 - parseInt(from[1] ?? '1', 10);
    const toFile = to.charCodeAt(0) - 97;
    const toRank = 8 - parseInt(to[1] ?? '1', 10);

    // Calcule la direction du mouvement
    const fileStep = Math.sign(toFile - fromFile) || 0;
    const rankStep = Math.sign(toRank - fromRank) || 0;

    // Vérifie chaque case sur le chemin
    let currentFile = fromFile + fileStep;
    let currentRank = fromRank + rankStep;
    while (currentFile !== toFile || currentRank !== toRank) {
        const square = String.fromCharCode(97 + currentFile) + (8 - currentRank) as Square;
        const pieceAtSquare = position[square];
        if (pieceAtSquare) return true;
        currentFile += fileStep;
        currentRank += rankStep;
    }

    return false;
};

/**
 * Vérifie si un mouvement est légal selon les règles d'échecs
 */
export const isLegalMove = (
    from: Square,
    to: Square,
    piece: StandardPiece,
    position: PositionMap
): boolean => {
    const fromFile = from.charCodeAt(0) - 97;
    const fromRank = 8 - parseInt(from[1] ?? '1', 10);
    const toFile = to.charCodeAt(0) - 97;
    const toRank = 8 - parseInt(to[1] ?? '1', 10);

    const deltaFile = Math.abs(toFile - fromFile);
    const deltaRank = Math.abs(toRank - fromRank);
    const pieceIsWhite = isWhitePiece(piece);

    // Vérifie si la case cible contient une pièce de même couleur
    const targetPiece = position[to];
    if (targetPiece) {
        const isTargetWhite = isWhitePiece(targetPiece);
        if (pieceIsWhite === isTargetWhite) return false;
    }

    const pieceType = getPieceType(piece);
    switch (pieceType) {
        case 'P': // Pion
            const forwardDirection = pieceIsWhite ? -1 : 1;
            const startRank = pieceIsWhite ? 6 : 1;

            // Mouvement simple
            if (fromFile === toFile && !targetPiece) {
                if (toRank - fromRank === forwardDirection) return true;
                // Double avance depuis la position initiale
                if (fromRank === startRank && toRank - fromRank === forwardDirection * 2) {
                    const intermediateSquare = String.fromCharCode(97 + fromFile) + (8 - (fromRank + forwardDirection)) as Square;
                    const pieceAtIntermediate = position[intermediateSquare];
                    return !pieceAtIntermediate;
                }
            }
            // Prise en diagonale
            return !!(deltaFile === 1 && toRank - fromRank === forwardDirection && targetPiece);


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
};

/**
 * Trouve la pièce capable d'effectuer un mouvement donné
 * Gère aussi les cas spéciaux comme le roque
 */
export const findPieceForMove = (
    position: PositionMap,
    move: string,
    isWhiteTurn: boolean
): MoveDetail | null => {
    // Gestion du roque
    if (move === 'O-O' || move === 'O-O-O') {
        const rank = isWhiteTurn ? '1' : '8';
        const king = isWhiteTurn ? StandardPiece.WhiteKing : StandardPiece.BlackKing;
        const rook = isWhiteTurn ? StandardPiece.WhiteRook : StandardPiece.BlackRook;

        if (move === 'O-O') {
            return {
                from: `e${rank}` as Square,
                to: `g${rank}` as Square,
                piece: king,
                secondaryMove: {
                    from: `h${rank}` as Square,
                    to: `f${rank}` as Square,
                    piece: rook
                }
            };
        } else {
            return {
                from: `e${rank}` as Square,
                to: `c${rank}` as Square,
                piece: king,
                secondaryMove: {
                    from: `a${rank}` as Square,
                    to: `d${rank}` as Square,
                    piece: rook
                }
            };
        }
    }

    // Nettoie le coup des annotations
    let cleanMove = move.replace(/[+#!?]/g, '');
    let targetSquare: Square;
    let piece: StandardPiece;
    let disambiguation = '';

    // Convertit d'abord en notation standard si nécessaire
    if (isFrenchNotation(cleanMove)) {
        cleanMove = convertMoveToStandard(cleanMove);
    }

    // Détermine la pièce et la case cible
    if (cleanMove.match(/^[KQRBN]/)) {
        const pieceChar = cleanMove[0];
        if (!pieceChar) return null;

        const rest = cleanMove.slice(1);

        // Détermine la pièce basée sur le caractère et la couleur du tour
        if (pieceChar === 'K') piece = isWhiteTurn ? StandardPiece.WhiteKing : StandardPiece.BlackKing;
        else if (pieceChar === 'Q') piece = isWhiteTurn ? StandardPiece.WhiteQueen : StandardPiece.BlackQueen;
        else if (pieceChar === 'R') piece = isWhiteTurn ? StandardPiece.WhiteRook : StandardPiece.BlackRook;
        else if (pieceChar === 'B') piece = isWhiteTurn ? StandardPiece.WhiteBishop : StandardPiece.BlackBishop;
        else if (pieceChar === 'N') piece = isWhiteTurn ? StandardPiece.WhiteKnight : StandardPiece.BlackKnight;
        else piece = isWhiteTurn ? StandardPiece.WhitePawn : StandardPiece.BlackPawn;

        if (rest.includes('x')) {
            const parts = rest.split('x');
            disambiguation = parts[0] ?? '';
            targetSquare = (parts[1] ?? '') as Square;
        } else {
            if (rest.length > 2) {
                disambiguation = rest.slice(0, -2);
                targetSquare = rest.slice(-2) as Square;
            } else {
                targetSquare = rest as Square;
            }
        }
    } else {
        // Mouvement de pion
        piece = isWhiteTurn ? StandardPiece.WhitePawn : StandardPiece.BlackPawn;
        if (cleanMove.includes('x')) {
            const parts = cleanMove.split('x');
            disambiguation = parts[0] ?? '';
            targetSquare = (parts[1] ?? '') as Square;
        } else {
            targetSquare = cleanMove as Square;
        }
    }

    // Validation de la case cible
    if (!targetSquare || targetSquare.length !== 2) {
        return null;
    }

    // Trouve toutes les pièces du bon type
    const candidateSquares: Square[] = [];
    for (const squareKey in position) {
        const square = squareKey as Square;
        const pieceAtSquare = position[square];
        if (pieceAtSquare === piece) {
            candidateSquares.push(square);
        }
    }

    // Filtre selon la désambiguïsation
    let validSquares: Square[] = candidateSquares;
    if (disambiguation) {
        validSquares = candidateSquares.filter(square => {
            return square.includes(disambiguation);
        });
    }

    // Trouve la pièce qui peut légalement faire le mouvement
    const legalSquare = validSquares.find(square =>
        isLegalMove(square, targetSquare, piece, position)
    );

    return legalSquare ? { from: legalSquare, to: targetSquare, piece } : null;
};

/**
 * Génère la séquence complète des positions
 */
export const generatePositions = (
    initialPos: PositionMap,
    moveList: string[]
): GeneratePositionsResult => {
    const positions: PositionMap[] = [];
    const moveDetails: MoveDetail[] = [];
    let currentPos: PositionMap = { ...initialPos };
    let isWhiteTurn = true;

    moveList.forEach((move: string, index: number) => {
        const standardMove = isFrenchNotation(move) ? convertMoveToStandard(move) : move;

        const moveInfo = findPieceForMove(currentPos, standardMove, isWhiteTurn);
        if (moveInfo) {
            moveDetails.push(moveInfo);

            // Applique le mouvement principal
            const newPos: PositionMap = { ...currentPos };
            delete newPos[moveInfo.from];
            newPos[moveInfo.to] = moveInfo.piece;

            // Applique le mouvement secondaire (roque)
            if (moveInfo.secondaryMove) {
                delete newPos[moveInfo.secondaryMove.from];
                newPos[moveInfo.secondaryMove.to] = moveInfo.secondaryMove.piece;
            }

            currentPos = newPos;
            positions.push({ ...currentPos });
        } else {
            console.warn(`Mouvement non valide à l'index ${index}: ${move} (après conversion: ${standardMove})`);
            // On continue avec la position actuelle même si le mouvement échoue
            positions.push({ ...currentPos });
        }
        isWhiteTurn = !isWhiteTurn;
    });

    // Vérifie que tous les coups ont été exécutés
    if (positions.length !== moveList.length) {
        console.warn(`Attention: Certains coups n'ont pas été exécutés. 
            Coups attendus: ${moveList.length}, 
            Positions générées: ${positions.length}`);
    }

    return {
        positions,
        moveDetails,
        error: positions.length !== moveList.length ? 'Certains coups n\'ont pas pu être exécutés' : undefined
    };
};
