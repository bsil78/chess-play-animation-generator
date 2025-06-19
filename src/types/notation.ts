/**
 * Représente les pièces en notation standard
 */
export enum StandardPiece {
    WhiteKing = 'K',
    WhiteQueen = 'Q',
    WhiteRook = 'R',
    WhiteBishop = 'B',
    WhiteKnight = 'N',
    WhitePawn = 'P',
    BlackKing = 'k',
    BlackQueen = 'q',
    BlackRook = 'r',
    BlackBishop = 'b',
    BlackKnight = 'n',
    BlackPawn = 'p'
}

/**
 * Représente les pièces en notation française
 */
export enum FrenchPiece {
    WhiteKing = 'R',  // Roi
    WhiteQueen = 'D', // Dame
    WhiteRook = 'T',  // Tour
    WhiteBishop = 'F', // Fou
    WhiteKnight = 'C', // Cavalier
    WhitePawn = 'P',  // Pion
    BlackKing = 'r',
    BlackQueen = 'd',
    BlackRook = 't',
    BlackBishop = 'f',
    BlackKnight = 'c',
    BlackPawn = 'p'
}

/**
 * Représente les files de l'échiquier (colonnes a-h)
 */
export enum File {
    A = 'a',
    B = 'b',
    C = 'c',
    D = 'd',
    E = 'e',
    F = 'f',
    G = 'g',
    H = 'h'
}

/**
 * Représente les rangs de l'échiquier (lignes 1-8)
 */
export type Rank = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

/**
 * Représente une position sur l'échiquier (e.g., 'e4')
 */
export type Square = `${File}${Rank}`;

/**
 * Type pour les droits de roque
 */
export type CastlingRights = {
    whiteKingSide: boolean;
    whiteQueenSide: boolean;
    blackKingSide: boolean;
    blackQueenSide: boolean;
};

/**
 * Type pour une position en-passant
 */
export type EnPassantSquare = Square | '-';


