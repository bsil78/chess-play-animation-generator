import React from 'react';
import { StandardPiece } from '../../types/notation';
import './ChessPiece.css';

/** 
 * Table de conversion des pièces vers leurs symboles Unicode
 */
const pieceSymbols: Record<StandardPiece, string> = {
    [StandardPiece.WhiteKing]: '♔',
    [StandardPiece.WhiteQueen]: '♕',
    [StandardPiece.WhiteRook]: '♖',
    [StandardPiece.WhiteBishop]: '♗',
    [StandardPiece.WhiteKnight]: '♘',
    [StandardPiece.WhitePawn]: '♙',
    [StandardPiece.BlackKing]: '♚',
    [StandardPiece.BlackQueen]: '♛',
    [StandardPiece.BlackRook]: '♜',
    [StandardPiece.BlackBishop]: '♝',
    [StandardPiece.BlackKnight]: '♞',
    [StandardPiece.BlackPawn]: '♟'
};

interface ChessPieceProps {
    piece: StandardPiece;
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
