import React from 'react';
import ChessAnimator from './components/chess-play-generator';
import './components/chess-play-generator.css';

const App: React.FC = () => {
    return (
        <div>
            <h1>Welcome to Chess Play Generator</h1>
            <ChessAnimator />
        </div>
    );
};

export default App;