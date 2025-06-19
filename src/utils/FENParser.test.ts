import { describe, expect, test } from '@jest/globals';
import { parseFEN } from './FENParser';
import { StandardPiece, Square } from '../types/notation';

describe('FEN Parser Tests', () => {
    test('Parse position initiale en notation standard', () => {
        const fenStandard = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
        const result = parseFEN(fenStandard);

        expect(result.isValid).toBe(true);
        expect(result.structure.position['e1' as Square]).toBe(StandardPiece.WhiteKing);
        expect(result.structure.position['d8' as Square]).toBe(StandardPiece.BlackQueen);
        expect(result.structure.activeColor).toBe('w');
        expect(result.structure.castling).toEqual({
            whiteKingSide: true,
            whiteQueenSide: true,
            blackKingSide: true,
            blackQueenSide: true
        });
        expect(result.structure.moves).toHaveLength(0);
    });

    test('Parse position initiale en notation française', () => {
        const fenFrench = 'tcfdrfct/pppppppp/8/8/8/8/PPPPPPPP/TCFDRFCT w - - 0 1';
        const result = parseFEN(fenFrench);

        expect(result.isValid).toBe(true);
        expect(result.structure.position['e1' as Square]).toBe(StandardPiece.WhiteKing); // R -> K (Roi)
        expect(result.structure.position['d1' as Square]).toBe(StandardPiece.WhiteQueen); // D -> Q (Dame)
        expect(result.structure.position['c1' as Square]).toBe(StandardPiece.WhiteBishop); // F -> B (Fou)
        expect(result.structure.position['f1' as Square]).toBe(StandardPiece.WhiteBishop); // F -> B (Fou)
        expect(result.structure.castling).toEqual({
            whiteKingSide: false,
            whiteQueenSide: false,
            blackKingSide: false,
            blackQueenSide: false
        });
    });

    test('Parse séquence de coups en notation standard', () => {
        const fenWithMoves = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1 1.e4 e5 2.Nf3 Nc6';
        const result = parseFEN(fenWithMoves);

        expect(result.isValid).toBe(true);
        expect(result.structure.moves).toEqual(['e4', 'e5', 'Nf3', 'Nc6']);
    });

    test('Parse séquence de coups en notation française', () => {
        const fenWithMoves = 'tcfdrcft/pppppppp/8/8/8/8/PPPPPPPP/TCFDRCFT w - - 0 1 1.e4 e5 2.Cf3 Cc6';
        const result = parseFEN(fenWithMoves);

        expect(result.isValid).toBe(true);
        expect(result.structure.moves).toEqual(['e4', 'e5', 'Nf3', 'Nc6']);
    });

    test('Compare les résultats entre notation standard et française', () => {
        // Position initiale en notation standard et française
        const fenStandard = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1 1.e4 e5 2.Nf3 Nc6';
        const fenFrench = 'tcfdrfct/pppppppp/8/8/8/8/PPPPPPPP/TCFDRFCT w RDrd - 0 1 1.e4 e5 2.Cf3 Cc6';

        const resultStandard = parseFEN(fenStandard);
        const resultFrench = parseFEN(fenFrench);

        // Vérifie que toutes les pièces sont converties en notation standard
        const expectedStandardPositions = {
            // White pieces
            'a1': 'R', 'b1': 'N', 'c1': 'B', 'd1': 'Q', 'e1': 'K', 'f1': 'B', 'g1': 'N', 'h1': 'R',
            // Black pieces
            'a8': 'r', 'b8': 'n', 'c8': 'b', 'd8': 'q', 'e8': 'k', 'f8': 'b', 'g8': 'n', 'h8': 'r',
            // White pawns
            'a2': 'P', 'b2': 'P', 'c2': 'P', 'd2': 'P', 'e2': 'P', 'f2': 'P', 'g2': 'P', 'h2': 'P',
            // Black pawns
            'a7': 'p', 'b7': 'p', 'c7': 'p', 'd7': 'p', 'e7': 'p', 'f7': 'p', 'g7': 'p', 'h7': 'p'
        } as Record<Square, string>;        // Compare each piece position
        Object.entries(expectedStandardPositions).forEach(([square, expectedPiece]) => {
            expect(resultStandard.structure.position[square as Square]).toBe(expectedPiece);
            expect(resultFrench.structure.position[square as Square]).toBe(expectedPiece);
        });

        // Vérifie que les coups sont convertis en notation standard
        const expectedMoves = ['e4', 'e5', 'Nf3', 'Nc6'];
        expect(resultStandard.structure.moves).toEqual(expectedMoves);
        expect(resultFrench.structure.moves).toEqual(expectedMoves);
    });

    test('Gestion des erreurs', () => {
        const invalidFen = 'invalid/fen/string';
        const result = parseFEN(invalidFen);

        expect(result.isValid).toBe(false);
        expect(result.error).toBeDefined();
    });
});
