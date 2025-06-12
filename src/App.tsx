import React from 'react';
import ChessAnimator from './components/chess-play-generator';
import './components/chess-play-generator.css';

const App: React.FC = () => {
    return (
        <div>
            <ChessAnimator />
        </div>
    );
};

export default App;