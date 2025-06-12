/**
 * Types et interfaces pour l'application d'échecs
 * -------------------------------------------
 */

/**
 * Type représentant les pièces d'échecs possibles.
 * Majuscules pour les pièces blanches, minuscules pour les noires.
 * K/k: Roi, Q/q: Dame, R/r: Tour, B/b: Fou, N/n: Cavalier, P/p: Pion
 */
export type ChessPiece = 'K' | 'Q' | 'R' | 'B' | 'N' | 'P' | 'k' | 'q' | 'r' | 'b' | 'n' | 'p';

/**
 * Structure représentant l'échiquier comme un dictionnaire
 * où les clés sont les cases (ex: "e4") et les valeurs sont les pièces
 */
export interface PositionMap {
    [square: string]: string;
}

/**
 * Représente un mouvement secondaire, utilisé principalement pour le roque
 * où la tour doit aussi se déplacer
 */
export interface SecondaryMove {
    from: string;
    to: string;
    piece: string;
}

/**
 * Information complète sur un mouvement, incluant un éventuel
 * mouvement secondaire pour le roque
 */
export interface MoveInfo {
    from: string;
    to: string;
    piece: string;
    secondaryMove?: SecondaryMove;
}

/**
 * Détails d'un mouvement pour l'affichage et l'animation,
 * incluant les informations pour le roque
 */
export interface MoveDetail {
    from: string;
    to: string;
    piece: string;
    secondaryFrom?: string;
    secondaryTo?: string;
    secondaryPiece?: string;
}

/**
 * Types pour la gestion de la notation française
 */
export interface IsFrenchFEN {
    (fen: string): boolean;
}

export interface FrenchToStandardFEN {
    (fen: string): string;
}

/**
 * Coordonnées sur l'échiquier
 */
export interface AlgebraicCoords {
    row: number; // 0-7 pour les rangées (8-1)
    col: number; // 0-7 pour les colonnes (a-h)
}

/**
 * Résultat de la génération des positions, contenant toutes les
 * positions intermédiaires et les détails des mouvements
 */
export interface GeneratePositionsResult {
    positions: Array<{ [key: string]: string }>;
    moveDetails: MoveDetail[];
}
