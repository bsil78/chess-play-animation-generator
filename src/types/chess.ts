// src/types/chess.ts
import { StandardPiece, Square } from './notation';

/**
 * Types et interfaces pour l'application d'échecs
 * -------------------------------------------
 */


/**
 * Structure représentant l'échiquier comme un dictionnaire
 * où les clés sont les cases (ex : "e4") et les valeurs sont les pièces
 * Utilise Partial pour permettre des cases vides (optionnelles)
 */
export type PositionMap = Partial<Record<Square, StandardPiece>>;

/**
 * Crée une PositionMap vide
 */
export const createEmptyPosition = (): PositionMap => ({});

/**
 * Crée une PositionMap avec les pièces spécifiées
 */
export const createPositionWithPieces = (pieces: Partial<Record<string, StandardPiece>>): PositionMap => {
    return pieces as PositionMap;
};

/**
 * Représente un mouvement secondaire, utilisé principalement pour le roque
 * où la tour doit aussi se déplacer
 */
export interface SecondaryMove {
    from: Square;
    to: Square;
    piece: StandardPiece;
}


/**
 * Détails d'un coup pour l'animation
 */
export interface MoveDetail {
    from: Square;
    to: Square;
    piece: StandardPiece;
    secondaryMove?: SecondaryMove;
}

/**
 * Résultat de la génération de positions
 */
export interface GeneratePositionsResult {
    positions: PositionMap[];
    moveDetails: MoveDetail[];
    error?: string;
}


export type { Square };