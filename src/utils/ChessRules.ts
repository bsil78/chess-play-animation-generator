import { PositionMap, MoveInfo, ChessPiece, GeneratePositionsResult, MoveDetail } from '../types/chess';

/**
 * Vérifie s'il y a des pièces entre deux cases
 * Utilisé pour les mouvements de la tour, du fou et de la dame
 * @param from Case de départ
 * @param to Case d'arrivée
 * @param position Position actuelle de l'échiquier
 * @returns true s'il y a une pièce entre les deux cases
 */
export const isPieceBetween = (
    from: string,
    to: string,
    position: PositionMap
): boolean => {
    // Convertit les coordonnées algébriques en indices numériques
    const fromFile = from.charCodeAt(0) - 97;
    const fromRank = 8 - parseInt(from[1]);
    const toFile = to.charCodeAt(0) - 97;
    const toRank = 8 - parseInt(to[1]);

    // Calcule la direction du mouvement
    const fileStep = Math.sign(toFile - fromFile) || 0;
    const rankStep = Math.sign(toRank - fromRank) || 0;

    // Vérifie chaque case sur le chemin
    let currentFile = fromFile + fileStep;
    let currentRank = fromRank + rankStep;
    while (currentFile !== toFile || currentRank !== toRank) {
        const square = String.fromCharCode(97 + currentFile) + (8 - currentRank);
        if (position[square]) return true;
        currentFile += fileStep;
        currentRank += rankStep;
    }

    return false;
};

/**
 * Vérifie si un mouvement est légal selon les règles d'échecs
 * @param from Case de départ
 * @param to Case d'arrivée
 * @param piece Pièce à déplacer
 * @param position Position actuelle de l'échiquier
 * @returns true si le mouvement est légal
 */
export const isLegalMove = (
    from: string,
    to: string,
    piece: ChessPiece,
    position: PositionMap
): boolean => {
    const fromFile = from.charCodeAt(0) - 97;
    const fromRank = 8 - parseInt(from[1]);
    const toFile = to.charCodeAt(0) - 97;
    const toRank = 8 - parseInt(to[1]);

    const deltaFile = Math.abs(toFile - fromFile);
    const deltaRank = Math.abs(toRank - fromRank);
    const isWhitePiece = piece === piece.toUpperCase();

    // Vérifie si la case cible contient une pièce de même couleur
    const targetPiece = position[to] as ChessPiece | undefined;
    if (targetPiece) {
        const isTargetWhite = targetPiece === targetPiece.toUpperCase();
        if (isWhitePiece === isTargetWhite) return false;
    }

    const pieceType = piece.toUpperCase() as ChessPiece;
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
};

/**
 * Trouve la pièce capable d'effectuer un mouvement donné
 * Gère aussi les cas spéciaux comme le roque
 * @param position Position actuelle
 * @param move Coup en notation algébrique
 * @param isWhiteTurn True si c'est aux blancs de jouer
 * @returns Informations sur le mouvement ou null si impossible
 */
export const findPieceForMove = (
    position: PositionMap,
    move: string,
    isWhiteTurn: boolean
): MoveInfo | null => {
    // Gestion du roque
    if (move === 'O-O' || move === 'O-O-O') {
        const rank = isWhiteTurn ? '1' : '8';
        const king = (isWhiteTurn ? 'K' : 'k') as ChessPiece;
        const rook = (isWhiteTurn ? 'R' : 'r') as ChessPiece;

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
    let targetSquare: string;
    let piece: ChessPiece;
    let disambiguation = '';

    // Détermine la pièce et la case cible
    if (cleanMove.match(/^[KQRBN]/)) {
        piece = cleanMove[0] as ChessPiece;
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
        piece = 'P' as ChessPiece;
        if (cleanMove.includes('x')) {
            const parts = cleanMove.split('x');
            disambiguation = parts[0];
            targetSquare = parts[1];
        } else {
            targetSquare = cleanMove;
        }
    }

    if (!isWhiteTurn) {
        piece = piece.toLowerCase() as ChessPiece;
    }

    // Trouve toutes les pièces du bon type
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
    );

    return legalSquare ? { from: legalSquare, to: targetSquare, piece } : null;
};

/**
 * Convertit des coordonnées numériques (row, col) en notation algébrique (ex: "e4")
 * @param row Numéro de rangée (0-7)
 * @param col Numéro de colonne (0-7)
 * @returns Notation algébrique de la case (ex: "e4")
 */
export const coordsToAlgebraic = (row: number, col: number): string => {
    return String.fromCharCode(97 + col) + (8 - row);
};

/**
 * Convertit une position en notation française vers la notation standard
 */
export const frenchToStandardFEN = (fen: string): string => {
    if (!isFrenchFEN(fen)) return fen;

    return fen
        .replace(/R/g, 'K').replace(/r/g, 'k') // Roi -> King
        .replace(/D/g, 'Q').replace(/d/g, 'q') // Dame -> Queen
        .replace(/T/g, 'R').replace(/t/g, 'r') // Tour -> Rook
        .replace(/F/g, 'B').replace(/f/g, 'b') // Fou -> Bishop
        .replace(/C/g, 'N').replace(/c/g, 'n'); // Cavalier -> kNight
};

/**
 * Détecte si une chaîne FEN utilise la notation française
 */
export const isFrenchFEN = (fen: string): boolean => {
    const boardPart = fen.split(' ')[0];
    return /[DdTtFfCc]/.test(boardPart);
};

/**
 * Extrait la liste des coups depuis une chaîne en notation algébrique
 */
export const parseMoves = (moveString: string): string[] => {
    if (!moveString) return [];

    // Nettoie et divise la chaîne de coups
    return moveString
        .replace(/\d+\./g, '') // Supprime les numéros de coups
        .trim()
        .split(/\s+/)
        .filter((move: string) => move.length > 0);
};

/**
 * Parse une chaîne FEN et retourne un objet avec les positions des pièces
 */
export const parseFEN = (fen: string): PositionMap => {
    // Convertit le FEN français en standard si nécessaire
    const standardFEN = frenchToStandardFEN(fen);
    const parts = standardFEN.split(' ');
    const boardPart = parts[0];
    const ranks = boardPart.split('/');
    const position: PositionMap = {};

    // Parse chaque rangée
    ranks.forEach((rank: string, rankIndex: number) => {
        let fileIndex = 0;
        for (let char of rank) {
            if (isNaN(Number(char))) {
                // Si c'est une pièce, l'ajouter à la position
                const square = coordsToAlgebraic(rankIndex, fileIndex);
                position[square] = char as ChessPiece;
                fileIndex++;
            } else {
                // Si c'est un nombre, avancer le fileIndex
                fileIndex += parseInt(char);
            }
        }
    });

    return position;
};

/**
 * Génère la séquence complète des positions
 * @param initialPos Position initiale
 * @param moveList Liste des coups
 * @returns Toutes les positions et détails des mouvements
 */
export const generatePositions = (
    initialPos: PositionMap,
    moveList: string[]
): GeneratePositionsResult => {
    const positions: PositionMap[] = [{ ...initialPos }];
    const moveDetails: MoveDetail[] = [];
    let currentPos: PositionMap = { ...initialPos };
    let isWhiteTurn = true;

    moveList.forEach((move: string) => {
        const moveInfo = findPieceForMove(currentPos, move, isWhiteTurn);
        if (moveInfo) {
            // Stocke les détails du mouvement pour le surlignage
            const moveDet: MoveDetail = {
                from: moveInfo.from,
                to: moveInfo.to,
                piece: moveInfo.piece as ChessPiece,
                secondaryFrom: moveInfo.secondaryMove?.from,
                secondaryTo: moveInfo.secondaryMove?.to,
                secondaryPiece: moveInfo.secondaryMove?.piece as ChessPiece | undefined
            };
            moveDetails.push(moveDet);

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
        }
        isWhiteTurn = !isWhiteTurn;
    });

    return { positions, moveDetails };
};
