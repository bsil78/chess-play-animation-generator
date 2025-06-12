import React, { forwardRef } from 'react';
import ChessPiece from './ChessPiece';
import { PositionMap, ChessPiece as ChessPieceType } from '../types/chess';

interface ChessBoardProps {
    currentPosition: PositionMap;
    isWhitePerspective: boolean;
    lastMoveSquares: string[];
    ghostPieces: PositionMap;
}

/**
 * Composant ChessBoard
 * -----------------
 * Gère l'affichage du plateau d'échecs avec :
 * - Les cases blanches et noires
 * - Les coordonnées (a-h, 1-8)
 * - Le placement des pièces
 * - Les effets visuels (derniers coups, pièces fantômes)
 */
const ChessBoard = forwardRef<HTMLDivElement, ChessBoardProps>(({
    currentPosition,
    isWhitePerspective,
    lastMoveSquares,
    ghostPieces
}, ref) => {
    // Détermine l'ordre des files et rangées selon l'orientation
    const files = isWhitePerspective ? ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] : ['h', 'g', 'f', 'e', 'd', 'c', 'b', 'a'];
    const ranks = isWhitePerspective ? ['8', '7', '6', '5', '4', '3', '2', '1'] : ['1', '2', '3', '4', '5', '6', '7', '8'];

    const renderSquare = (row: number, col: number) => {
        const boardRow = isWhitePerspective ? row - 1 : 8 - row;
        const boardCol = isWhitePerspective ? col - 1 : 8 - col;
        const isLight = (boardRow + boardCol) % 2 === 0;
        const square = String.fromCharCode(97 + (isWhitePerspective ? col - 1 : 8 - col)) +
            (isWhitePerspective ? 8 - (row - 1) : row);

        const piece = currentPosition[square] as ChessPieceType;
        const ghostPiece = ghostPieces[square] as ChessPieceType;
        const isLastMove = lastMoveSquares.includes(square);
        const isWhitePiece = piece ? piece === piece.toUpperCase() : false;

        return (
            <div key={`square-${row}-${col}`} className="board-cell">
                <div className={`chess-square ${isLight ? 'light' : 'dark'}`}>
                    {ghostPiece && (
                        <ChessPiece
                            piece={ghostPiece}
                            isGhost={true}
                            isWhite={ghostPiece === ghostPiece.toUpperCase()}
                        />
                    )}
                    {piece && (
                        <ChessPiece
                            piece={piece}
                            isWhite={isWhitePiece}
                            isLastMove={isLastMove}
                        />
                    )}
                </div>
            </div>
        );
    };

    const renderCoordLabel = (row: number, col: number) => {
        let coordLabel = '';
        if ((row === 0 || row === 9) && col > 0 && col < 9) {
            coordLabel = files[col - 1];
        } else if ((col === 0 || col === 9) && row > 0 && row < 9) {
            coordLabel = ranks[row - 1];
        }

        return (
            <div key={`coord-${row}-${col}`} className="board-cell coord-label">
                {coordLabel}
            </div>
        );
    };

    const renderBoard = () => {
        const board = [];
        for (let row = 0; row < 10; row++) {
            for (let col = 0; col < 10; col++) {
                const isCoordCell = row === 0 || row === 9 || col === 0 || col === 9;
                board.push(
                    isCoordCell ? renderCoordLabel(row, col) : renderSquare(row, col)
                );
            }
        }
        return board;
    };

    return (
        <div className="board-section">
            <div
                className="chessboard-container"
                ref={ref}
                style={{
                    display: 'inline-grid',
                    gridTemplateColumns: 'repeat(10, 1fr)',
                    gridTemplateRows: 'repeat(10, 1fr)',
                    gap: '0px',
                    padding: '8px',
                    backgroundColor: '#fff',
                    boxSizing: 'border-box',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    width: 'fit-content'
                }}
            >
                {renderBoard()}
            </div>
        </div>
    );
});

ChessBoard.displayName = 'ChessBoard';
export default ChessBoard;
