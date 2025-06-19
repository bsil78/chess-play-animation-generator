import { PositionMap } from '../types/chess';
import { StandardPiece, Square, File, Rank, CastlingRights, EnPassantSquare } from '../types/notation';
import { convertPieceToStandard, isFrenchPiece } from './NotationConverter';

/**
 * Interface pour représenter une position FEN complète
 */
export interface FENStructure {
    position: PositionMap;       // Position des pièces
    activeColor: 'w' | 'b';      // Couleur au trait
    castling: CastlingRights;    // Droits de roque
    enPassant: EnPassantSquare;  // Case de prise en passant possible
    halfMoveClock: number;       // Compteur de demi-coups
    fullMoveNumber: number;      // Numéro du coup
    moves: string[];             // Liste des coups à jouer
}

export interface ParsedFEN {
    structure: FENStructure;
    isValid: boolean;
    error?: string;
}

/**
 * Convertit des coordonnées numériques en notation algébrique
 */
const coordsToAlgebraic = (row: number, col: number): Square => {
    const file = String.fromCharCode(97 + col) as File;
    const rank = (8 - row) as Rank;
    return `${file}${rank}`;
};

/**
 * Vérifie si une position FEN utilise la notation française pour les pièces
 */
export const isFrenchFENNotation = (fen: string): boolean => {
    const boardPart = fen.split('/')[0];
    return /[DTFCdtfc]/.test(boardPart??"");
};

/**
 * Parse la partie position d'une chaîne FEN
 */
const parsePosition = (boardPart: string): PositionMap => {
    const position = {} as PositionMap;
    const ranks = boardPart.split('/');

    if (ranks.length !== 8) {
        throw new Error('Invalid FEN: must have 8 ranks');
    }

    // Détecte si la position utilise la notation française
    const isFrench = isFrenchFENNotation(boardPart);

    ranks.forEach((rank: string, rankIndex: number) => {
        let fileIndex = 0;
        for (let char of rank) {
            if (isNaN(Number(char))) {
                if (fileIndex >= 8) {
                    throw new Error(`Invalid FEN: too many pieces in rank ${8 - rankIndex}`);
                }
                const square = coordsToAlgebraic(rankIndex, fileIndex);
                if (isFrench && isFrenchPiece(char)) {
                    // Convert French notation pieces to standard
                    switch (char.toUpperCase()) {
                        case 'R': position[square] = char === 'R' ? StandardPiece.WhiteKing : StandardPiece.BlackKing; break;
                        case 'D': position[square] = char === 'D' ? StandardPiece.WhiteQueen : StandardPiece.BlackQueen; break;
                        case 'T': position[square] = char === 'T' ? StandardPiece.WhiteRook : StandardPiece.BlackRook; break;
                        case 'F': position[square] = char === 'F' ? StandardPiece.WhiteBishop : StandardPiece.BlackBishop; break;
                        case 'C': position[square] = char === 'C' ? StandardPiece.WhiteKnight : StandardPiece.BlackKnight; break;
                        case 'P': position[square] = char === 'P' ? StandardPiece.WhitePawn : StandardPiece.BlackPawn; break;
                        default: throw new Error(`Invalid French notation piece: ${char}`);
                    }
                } else {
                    // Convert standard FEN characters to StandardPiece enum values
                    switch (char) {
                        case 'K': position[square] = StandardPiece.WhiteKing; break;
                        case 'Q': position[square] = StandardPiece.WhiteQueen; break;
                        case 'R': position[square] = StandardPiece.WhiteRook; break;
                        case 'B': position[square] = StandardPiece.WhiteBishop; break;
                        case 'N': position[square] = StandardPiece.WhiteKnight; break;
                        case 'P': position[square] = StandardPiece.WhitePawn; break;
                        case 'k': position[square] = StandardPiece.BlackKing; break;
                        case 'q': position[square] = StandardPiece.BlackQueen; break;
                        case 'r': position[square] = StandardPiece.BlackRook; break;
                        case 'b': position[square] = StandardPiece.BlackBishop; break;
                        case 'n': position[square] = StandardPiece.BlackKnight; break;
                        case 'p': position[square] = StandardPiece.BlackPawn; break;
                        default: throw new Error(`Invalid piece character: ${char}`);
                    }
                }
                fileIndex++;
            } else {
                const emptySquares = parseInt(char);
                if (fileIndex + emptySquares > 8) {
                    throw new Error(`Invalid FEN: rank ${8 - rankIndex} is too long`);
                }
                fileIndex += emptySquares;
            }
        }
        if (fileIndex !== 8) {
            throw new Error(`Invalid FEN: rank ${8 - rankIndex} is incorrect length`);
        }
    });

    return position;
};

/**
 * Parse les coups d'une séquence
 */
const parseMoves = (movePart: string): string[] => {
    if (!movePart) return [];

    // Nettoie la chaîne de coups
    const moves = movePart
        .replace(/\s+/g, ' ')
        .trim()
        .split(/\s+/)
        .filter(move => move.length > 0);

    // Supprime les numéros de coups et convertit la notation française si nécessaire
    return moves
        .map(move => move.replace(/^\d+\./, '').trim()) // Remove move numbers
        .filter(move => move.length > 0)
        .map(move => {
            if (move === 'O-O' || move === 'O-O-O') return move;
            // Convert French notation to standard
            return move.replace(/^[RDTFC]/i, piece => convertPieceToStandard(piece));
        });
};

/**
 * Convertit une chaîne de droits de roque en structure CastlingRights
 */
const parseCastlingRights = (castlingString: string): CastlingRights => {
    return {
        whiteKingSide: castlingString.includes('K'),
        whiteQueenSide: castlingString.includes('Q'),
        blackKingSide: castlingString.includes('k'),
        blackQueenSide: castlingString.includes('q')
    };
};

/**
 * Parse une chaîne FEN complète
 */
export const parseFEN = (fenString: string): ParsedFEN => {
    try {
        // Trouve l'index du premier numéro de coup
        const moveStartIndex = fenString.search(/\d+\./);
        const fenPart = moveStartIndex !== -1 ?
            fenString.slice(0, moveStartIndex).trim() :
            fenString.trim();
        const movePart = moveStartIndex !== -1 ?
            fenString.slice(moveStartIndex).trim() :
            '';

        // Divise la partie FEN en ses composants
        const fenParts = fenPart.split(/\s+/);
        if (fenParts.length < 4) {
            throw new Error('Invalid FEN: missing required components');
        }

        // Parse chaque composant
        const position = parsePosition(fenParts[0]??"");
        const activeColor = fenParts[1] as 'w' | 'b';
        const castling = parseCastlingRights(fenParts[2]??"");
        const enPassant = fenParts[3] as EnPassantSquare;
        const halfMoveClock = parseInt(fenParts[4] || '0');
        const fullMoveNumber = parseInt(fenParts[5] || '1');

        // Parse les coups
        const moves = parseMoves(movePart);

        return {
            isValid: true,
            structure: {
                position,
                activeColor,
                castling,
                enPassant,
                halfMoveClock,
                fullMoveNumber,
                moves
            }
        };
    } catch (error) {
        return {
            isValid: false,
            error: error instanceof Error ? error.message : 'Unknown error parsing FEN',
            structure: {
                position: {} as PositionMap,
                activeColor: 'w',
                castling: {
                    whiteKingSide: false,
                    whiteQueenSide: false,
                    blackKingSide: false,
                    blackQueenSide: false
                },
                enPassant: '-',
                halfMoveClock: 0,
                fullMoveNumber: 1,
                moves: []
            }
        };
    }
};
