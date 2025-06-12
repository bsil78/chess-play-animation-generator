import React from 'react';
import { ChessPiece as ChessPieceType } from '../types/chess';

/** 
 * Table de conversion des pièces vers leurs symboles Unicode
 */
const pieceSymbols: { [key in ChessPieceType]: string } = {
    'K': '♔', 'Q': '♕', 'R': '♖', 'B': '♗', 'N': '♘', 'P': '♙',
    'k': '♚', 'q': '♛', 'r': '♜', 'b': '♝', 'n': '♞', 'p': '♟'
};

interface ChessPieceProps {
    piece: ChessPieceType;
    isGhost?: boolean;
    isLastMove?: boolean;
    isWhite: boolean;
}

/**
 * Composant ChessPiece
 * ------------------
 * Affiche une pièce d'échecs avec ses effets visuels
 * 
 * @param piece - Code de la pièce (K, Q, R, etc.)
 * @param isGhost - Si la pièce est un "fantôme" (effet visuel du dernier coup)
 * @param isLastMove - Si la pièce était impliquée dans le dernier coup
 * @param isWhite - Si la pièce est blanche
 */
const ChessPiece: React.FC<ChessPieceProps> = ({
    piece,
    isGhost = false,
    isLastMove = false,
    isWhite
}) => {
    if (isGhost) {
        return (
            <span className="ghost-piece">
                {pieceSymbols[piece]}
            </span>
        );
    }

    return (
        <span
            className={`chess-piece ${isWhite ? 'text-white' : 'text-black'}`}
            style={{
                textShadow: isWhite
                    ? (isLastMove
                        ? '0 0 3px lime, 1px 1px 1px rgba(0,0,0,0.8)'
                        : '1px 1px 1px rgba(0,0,0,0.8)')
                    : (isLastMove ? '0 0 3px lime' : 'none')
            }}
        >
            {pieceSymbols[piece]}
        </span>
    );
};

export default ChessPiece;
