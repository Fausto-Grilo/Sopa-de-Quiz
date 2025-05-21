import React, { useEffect, useState } from 'react';

interface WordSoupProps {
  words: string[];
  correct: string;
  onSelect: (word: string) => void;
}

const GRID_SIZE = 12;

type Position = { row: number; col: number };

const generateGrid = (words: string[]): string[][] => {
    // Inicializa a grid com strings vazias
    const grid: string[][] = Array.from({ length: GRID_SIZE }, () =>
        Array.from({ length: GRID_SIZE }, () => '')
    );

    // Define orientações possíveis com seus respectivos deslocamentos
    const orientations = [
        { dx: 0, dy: 1 },   // horizontal (esquerda para direita)
        { dx: 1, dy: 0 },   // vertical (de cima para baixo)
        { dx: 1, dy: 1 },   // diagonal (superior esquerda para inferior direita)
        { dx: 0, dy: -1 },  // horizontal invertida (direita para esquerda)
        { dx: -1, dy: 0 },  // vertical invertida (de baixo para cima)
        { dx: -1, dy: -1 }  // diagonal invertida (inferior direita para superior esquerda)
    ];

    // Insere cada palavra na grid com posição e orientação aleatórias
    words.forEach((word) => {
        const letters = word.toUpperCase();
        let placed = false;
        for (let attempt = 0; attempt < 100 && !placed; attempt++) {
            const orientation = orientations[Math.floor(Math.random() * orientations.length)];
            const dx = orientation.dx;
            const dy = orientation.dy;

            // Calcula os limites válidos para a linha e coluna de início com base na orientação
            const rowStartMin = dx === -1 ? letters.length - 1 : 0;
            const rowStartMax = dx === 1 ? GRID_SIZE - letters.length : GRID_SIZE - 1;
            const colStartMin = dy === -1 ? letters.length - 1 : 0;
            const colStartMax = dy === 1 ? GRID_SIZE - letters.length : GRID_SIZE - 1;

            if (rowStartMax < rowStartMin || colStartMax < colStartMin) continue; // orientação inviável para a palavra

            const startRow = Math.floor(Math.random() * (rowStartMax - rowStartMin + 1)) + rowStartMin;
            const startCol = Math.floor(Math.random() * (colStartMax - colStartMin + 1)) + colStartMin;

            // Verifica se é possível inserir a palavra na posição escolhida
            let canPlace = true;
            const positions: { row: number; col: number }[] = [];
            for (let i = 0; i < letters.length; i++) {
                const row = startRow + i * dx;
                const col = startCol + i * dy;
                if (row < 0 || row >= GRID_SIZE || col < 0 || col >= GRID_SIZE) {
                    canPlace = false;
                    break;
                }
                // Permite sobreposição apenas se as letras coincidirem
                if (grid[row][col] !== '' && grid[row][col] !== letters[i]) {
                    canPlace = false;
                    break;
                }
                positions.push({ row, col });
            }

            if (canPlace) {
                positions.forEach((pos, idx) => {
                    grid[pos.row][pos.col] = letters[idx];
                });
                placed = true;
            }
        }
    });

    // Preenche os espaços vazios com letras aleatórias
    for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 0; col < GRID_SIZE; col++) {
            if (!grid[row][col]) {
                grid[row][col] = String.fromCharCode(65 + Math.floor(Math.random() * 26));
            }
        }
    }

    return grid;
};

const WordSoup: React.FC<WordSoupProps> = ({ words, correct, onSelect }) => {
  const [grid, setGrid] = useState<string[][]>([]);
  const [selectedPositions, setSelectedPositions] = useState<Position[]>([]);
  const [notification, setNotification] = useState<{ message: string; type: 'error' | 'success' } | null>(null);

  useEffect(() => {
    setGrid(generateGrid(words));
    setSelectedPositions([]); // limpa seleção ao mudar palavras
  }, [words]);

  // Helper to display notifications with auto-dismiss
  const showNotification = (message: string, type: 'error' | 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Alterna seleção da letra clicada
  const toggleSelection = (pos: Position) => {
    const exists = selectedPositions.some(
      (p) => p.row === pos.row && p.col === pos.col
    );
    if (exists) {
      setSelectedPositions(selectedPositions.filter((p) => !(p.row === pos.row && p.col === pos.col)));
    } else {
      setSelectedPositions([...selectedPositions, pos]);
    }
  };

  // Monta a palavra da seleção
  const getSelectedWord = (): string => {
    return selectedPositions
      .map(({ row, col }) => grid[row][col])
      .join('');
  };

  // Verifica se todas as posições são adjacentes sequencialmente
  const isConnectedSequence = (positions: Position[]): boolean => {
    if (positions.length < 2) return true;

    for (let i = 1; i < positions.length; i++) {
      const prev = positions[i - 1];
      const curr = positions[i];
      const rowDiff = Math.abs(prev.row - curr.row);
      const colDiff = Math.abs(prev.col - curr.col);

      const isAdjacent = rowDiff <= 1 && colDiff <= 1;
      if (!isAdjacent) return false;
    }

    return true;
  };

  // Confirma seleção e chama onSelect se válido
  const handleConfirm = () => {
    const selectedWord = getSelectedWord();

    if (!isConnectedSequence(selectedPositions)) {
      showNotification('As letras devem estar conectadas!', 'error');
      return;
    }

    if (selectedWord.toUpperCase() === correct.toUpperCase()) {
      showNotification('Parabéns! Resposta correta.', 'success');
    } else {
      showNotification(`Resposta incorreta. Você escolheu "${selectedWord}", mas o correto é "${correct}".`, 'error');
    }

    onSelect(selectedWord);
    setSelectedPositions([]);
  };

  // Limpa seleção
  const handleClear = () => {
    setSelectedPositions([]);
  };

  const saveResults = async (username: string, answers: any[], score: number) => {
    try {
      const res = await fetch('http://localhost:4000/api/save-results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, answers, score }),
      });
      const data = await res.json();
      alert(data.message);
    } catch (error) {
      alert('Erro ao salvar resultados');
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-6">
      {notification && (
        <div
          className={`p-4 rounded transition-all ${
            notification.type === 'success'
              ? 'bg-green-200 text-green-900'
              : 'bg-red-200 text-red-900'
          }`}
        >
          {notification.message}
        </div>
      )}

      <div className="grid grid-cols-12 gap-2 border rounded-xl p-4 bg-white shadow-md">
        {grid.flatMap((row, rowIndex) =>
          row.map((letter, colIndex) => {
            const isSelected = selectedPositions.some(
              (p) => p.row === rowIndex && p.col === colIndex
            );

            return (
              <div
                key={`${rowIndex}-${colIndex}`}
                onClick={() => toggleSelection({ row: rowIndex, col: colIndex })}
                className={`w-8 h-8 md:w-10 md:h-10 flex items-center justify-center cursor-pointer rounded-md font-mono text-base md:text-lg transition-all select-none
                  ${isSelected ? 'bg-blue-500 text-white' : 'bg-slate-100 text-gray-800 hover:bg-blue-100'}`}
              >
                {letter}
              </div>
            );
          })
        )}
      </div>

      <div className="text-center text-lg font-mono tracking-wider">
        Palavra selecionada: <span className="font-bold">{getSelectedWord()}</span>
      </div>

      <div className="flex justify-center gap-4">
        <button
          onClick={handleClear}
          className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 px-4 rounded-xl select-none transition-all"
        >
          Limpar
        </button>
        <button
          onClick={handleConfirm}
          className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-xl shadow select-none transition-all disabled:opacity-50"
          disabled={selectedPositions.length === 0}
        >
          Avançar
        </button>
      </div>
    </div>
  );
};

export default WordSoup;