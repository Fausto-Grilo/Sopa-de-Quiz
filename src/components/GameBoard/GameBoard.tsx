import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import WordSoup from './WordSoup'; // seu componente para mostrar as palavras


interface Question {
  id: string;
  question: string;
  words: string[];
  correct: string;
}

interface AnswerRecord {
  question_id: string;
  answer: string;
  correct: boolean;
}

interface GameBoardProps {
  username: string;
  questions: Question[];
}

const questions: Question[] = [
  {
    id: "1",
    question: 'Com que arma Blimunda se defendeu do frade?',
    words: ['ESPADA', 'ESPIGÃO', 'COLHER', 'PAU'],
    correct: 'ESPIGÃO',
  },
  {
    id: "2",
    question: 'A que ordem pertência o frade que tentou violar Blimunda?',
    words: ['DOMINICANO', 'FRANCISCANOS', 'DIOCESANOS', 'BENEDITINOS'],
    correct: 'DOMINICANO',
  },
  {
    id: "3",
    question: 'Quantas pessoas foram queimadas no auto de fé Baltasar?',
    words: ['ONZE', 'DEZ', 'DOZE', 'DUAS'],
    correct: 'ONZE',
  },
  {
    id: "4",
    question: 'Qual era o primeiro nome do judeu que foi queimado com Baltasar',
    words: ['BARTOLOMEU', 'JOSÉ', 'ANTÓNIO', 'PEDRO'],
    correct: 'ANTÓNIO',
  },
  {
    id: "5",
    question: 'Quantas vezes Blimunda passou por Lisboa enquanto procurava por Baltasar',
    words: ['SEIS', 'UMA', 'TRÊS', 'DEZ'],
    correct: 'SEIS',
  },
  {
    id: "6",
    question: 'Qual a relação de Inês Antonia com Baltasar',
    words: ['AMIGA', 'PRIMA', 'IRMÂ', 'AMANTE'],
    correct: 'IRMÂ',
  },
];

const GameBoard: React.FC<GameBoardProps> = ({ username }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [quizFinished, setQuizFinished] = useState(false);
  const [loading, setLoading] = useState(false);

  const currentQuestion = questions[currentIndex];

  const handleSelect = async (selectedWord: string) => {
    if (!currentQuestion) return;

    const isCorrect = selectedWord === currentQuestion.correct;

    // Atualiza score se acertou
    if (isCorrect) {
      setScore((prev) => prev + 1);
    }

    // Cria novo registro de resposta
    const newAnswer: AnswerRecord = {
      question_id: currentQuestion.id,
      answer: selectedWord,
      correct: isCorrect,
    };

    const newAnswers = [...answers, newAnswer];
    setAnswers(newAnswers);

    // Salvar no Supabase com upsert
    setLoading(true);
    const { error } = await supabase
      .from('quiz_results')
      .upsert(
        {
          username,
          answers: newAnswers,
          score: isCorrect ? score + 1 : score,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'username' }
      );
    setLoading(false);

    if (error) {
      console.error('Erro ao salvar resultado no Supabase:', error);
    }

    // Avança para próxima pergunta ou finaliza quiz
    if (currentIndex + 1 >= questions.length) {
      setQuizFinished(true);
    } else {
      setCurrentIndex(currentIndex + 1);
    }
  };

  if (quizFinished) {
    return (
      <div className="p-4 text-center">
        <h2 className="text-2xl font-bold mb-4">Quiz Finalizado!</h2>
        <p className="text-lg">Olá {username}, seu score foi: {score} de {questions.length}</p>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-md mx-auto">
      <h2 className="text-xl font-semibold mb-2">Pergunta {currentIndex + 1} de {questions.length}</h2>
      <p className="mb-4 text-gray-700">{currentQuestion.question}</p>
      <WordSoup
        words={currentQuestion.words}
        correct={currentQuestion.correct}
        onSelect={handleSelect}
      />
      {loading && <p className="mt-2 text-sm text-gray-500">Salvando sua resposta...</p>}
    </div>
  );
};

export default GameBoard;
