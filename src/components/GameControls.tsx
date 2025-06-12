import React from 'react';
import { Play, RotateCcw, Pause, StepForward, StepBack, Download } from 'lucide-react';

/**
 * Props pour le composant GameControls
 */
interface GameControlsProps {
    /** Entrée FEN actuelle */
    fenInput: string;
    /** Callback pour la mise à jour de l'entrée FEN */
    onFenInputChange: (value: string) => void;
    /** Si l'animation est en cours */
    isAnimating: boolean;
    /** Si la génération de GIF est en cours */
    isGeneratingGif: boolean;
    /** Index du coup actuel */
    currentMoveIndex: number;
    /** Nombre total de coups */
    totalMoves: number;
    /** Dernier coup joué (notation algébrique) */
    lastMove?: string;
    /** Réinitialise à la position initiale */
    onReset: () => void;
    /** Recule d'un coup */
    onStepBack: () => void;
    /** Démarre/arrête l'animation */
    onTogglePlay: () => void;
    /** Avance d'un coup */
    onStepForward: () => void;
    /** Génère un GIF de la séquence */
    onGenerateGif: () => void;
}

/**
 * Composant GameControls
 * -------------------
 * Gère l'interface utilisateur de contrôle avec :
 * - Saisie de la position FEN et des coups
 * - Boutons de navigation (reset, back, play/pause, forward)
 * - Génération de GIF
 * - Affichage des informations de progression
 */
const GameControls: React.FC<GameControlsProps> = ({
    fenInput,
    onFenInputChange,
    isAnimating,
    isGeneratingGif,
    currentMoveIndex,
    totalMoves,
    lastMove,
    onReset,
    onStepBack,
    onTogglePlay,
    onStepForward,
    onGenerateGif
}) => {
    return (
        <>
            <div className="control-section">
                <div className="input-container">
                    <label className="input-label">
                        FEN + Coups (compatible format standard et français)
                    </label>
                    <textarea
                        value={fenInput}
                        onChange={(e) => onFenInputChange(e.target.value)}
                        className="fen-input"
                        rows={3}
                        placeholder="Standard: rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1 1.e4 e5... | Français: tcfdrcft/pppppppp/8/8/8/8/PPPPPPPP/TCFDRCFT w - - 0 1 1.e4 e5..."
                    />
                </div>

                <div className="button-group">
                    <button
                        onClick={onReset}
                        className="control-button secondary"
                    >
                        <RotateCcw size={16} />
                        Réinitialiser
                    </button>

                    <button
                        onClick={onStepBack}
                        className="control-button primary"
                        disabled={currentMoveIndex === 0}
                    >
                        <StepBack size={16} />
                        Reculer
                    </button>

                    <button
                        onClick={onTogglePlay}
                        className="control-button success"
                    >
                        {isAnimating ? <Pause size={16} /> : <Play size={16} />}
                        {isAnimating ? 'Pause' : 'Lecture'}
                    </button>

                    <button
                        onClick={onStepForward}
                        className="control-button primary"
                        disabled={currentMoveIndex >= totalMoves}
                    >
                        <StepForward size={16} />
                        Avancer
                    </button>

                    <button
                        onClick={onGenerateGif}
                        className="control-button primary ml-4"
                        disabled={totalMoves === 0 || isGeneratingGif}
                        title="Générer un GIF animé de la séquence"
                    >
                        <Download size={16} />
                        {isGeneratingGif ? 'Génération...' : 'Télécharger GIF'}
                    </button>
                </div>
            </div>

            {totalMoves > 0 && (
                <div className="info-section">
                    <p className="text-sm text-gray-600">
                        Coup {currentMoveIndex} / {totalMoves}
                        {lastMove && (
                            <span className="ml-2 font-semibold">
                                Dernier coup: {lastMove}
                            </span>
                        )}
                    </p>
                </div>
            )}

            <div className="help-section">
                <div className="text-sm text-gray-600">
                    <p>Format accepté: FEN standard ou français suivi des coups en notation algébrique</p>
                    <p>Exemple standard: rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1 1.e4 e5 2.Nf3 Nc6</p>
                    <p>Exemple français: tcfdrcft/pppppppp/8/8/8/8/PPPPPPPP/TCFDRCFT w - - 0 1 1.e4 e5 2.Cf3 Cc6</p>
                    <p className="mt-2 text-cyan-600 font-medium">
                        🔮 Les pièces fantômes cyan indiquent la position de départ du dernier mouvement
                    </p>
                    <p className="mt-1 text-purple-600 font-medium">
                        🔄 L'échiquier s'oriente automatiquement selon le joueur dont c'est le tour (w=blancs en bas, b=noirs en bas)
                    </p>
                </div>
            </div>
        </>
    );
};

export default GameControls;
