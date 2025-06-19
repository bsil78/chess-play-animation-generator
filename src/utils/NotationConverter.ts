import { StandardPiece, FrenchPiece } from '../types/notation';


const standardToFrenchMap: Record<StandardPiece, FrenchPiece> = {
    [StandardPiece.WhiteKing]: FrenchPiece.WhiteKing,
    [StandardPiece.WhiteQueen]: FrenchPiece.WhiteQueen,
    [StandardPiece.WhiteRook]: FrenchPiece.WhiteRook,
    [StandardPiece.WhiteBishop]: FrenchPiece.WhiteBishop,
    [StandardPiece.WhiteKnight]: FrenchPiece.WhiteKnight,
    [StandardPiece.WhitePawn]: FrenchPiece.WhitePawn,
    [StandardPiece.BlackKing]: FrenchPiece.BlackKing,
    [StandardPiece.BlackQueen]: FrenchPiece.BlackQueen,
    [StandardPiece.BlackRook]: FrenchPiece.BlackRook,
    [StandardPiece.BlackBishop]: FrenchPiece.BlackBishop,
    [StandardPiece.BlackKnight]: FrenchPiece.BlackKnight,
    [StandardPiece.BlackPawn]: FrenchPiece.BlackPawn,
};

/**
 * Détermine si une pièce est en notation française
 */
export const isFrenchPiece = (piece: string): piece is FrenchPiece => {
    return Object.values(FrenchPiece).includes(piece as FrenchPiece);
};

/**
 * Détermine si une pièce est en notation standard
 */
export const isStandardPiece = (piece: string): piece is StandardPiece => {
    return Object.values(StandardPiece).includes(piece as StandardPiece);
};

/**
 * Convertit une pièce de la notation française vers la notation standard
 */
export const convertPieceToStandard = (piece: string): string => {
    const conversionMap: Record<string, string> = {
        'R': 'K', 'r': 'k', // Roi -> King
        'D': 'Q', 'd': 'q', // Dame -> Queen
        'T': 'R', 't': 'r', // Tour -> Rook
        'F': 'B', 'f': 'b', // Fou -> Bishop
        'C': 'N', 'c': 'n', // Cavalier -> Knight
        'P': 'P', 'p': 'p'  // Pion -> Pawn
    };
    return conversionMap[piece] || piece;
};

/**
 * Convertit une pièce de la notation standard vers la notation française
 */
export const convertPieceToFrench = (piece: StandardPiece): FrenchPiece => {
    return standardToFrenchMap[piece];
};

/**
 * Vérifie si un coup est en notation française
 */
export const isFrenchNotation = (move: string): boolean => {
    return /^[RDTFC]/.test(move);
};

/**
 * Convertit un coup en notation française vers la notation standard
 */
export const convertMoveToStandard = (move: string): string => {
    if (move === 'O-O' || move === 'O-O-O') return move;
    return move.replace(/^[RDTFC]/i, piece => convertPieceToStandard(piece));
};
