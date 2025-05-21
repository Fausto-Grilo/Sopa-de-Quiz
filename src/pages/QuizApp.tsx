import React, { useState } from 'react';
import GameBoard from '../components/GameBoard/GameBoard';

const QuizApp: React.FC = () => {
  const [username, setUsername] = useState('');
  const [started, setStarted] = useState(false);

  const handleStart = () => {
    if (username.trim() === '') {
      alert('Por favor, insira seu nome para começar o quiz!');
      return;
    }
    setStarted(true);
  };

  return (
    <>
      {!started ? (
        <div className="max-w-md mx-auto p-6">
            <div className="flex flex-col gap-4">
            <h1 className="text-2xl font-bold mb-4">Bem-vindo ao Quiz!</h1>
            <input
                type="text"
                placeholder="Digite seu nome"
                className="border rounded px-4 py-2 text-lg"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
            />
            <button
                onClick={handleStart}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded"
            >
                Começar Quiz
            </button>
            </div>
        </div>
      ) : (
        <GameBoard username={username} />
      )}
    </>
  );
};

export default QuizApp;
