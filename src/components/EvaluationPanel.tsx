/**
 * @author José E. Moraes
 * @copyright 2025 - Todos os direitos reservados
 */
import React, { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { QuestionCard } from './QuestionCard';
import { EvaluationResults } from './EvaluationResults';
import { Button } from '@/components/ui/button';import { QuizData } from '@/types';

interface EvaluationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  quizData: QuizData | null;
}

export const EvaluationPanel: React.FC<EvaluationPanelProps> = ({ isOpen, onClose, quizData }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [showResults, setShowResults] = useState(false);

  const handleAnswer = (isCorrect: boolean) => {
    if (isCorrect) {
      setScore(prev => prev + 1);
    }
  };

  const handleNextQuestion = () => {
    if (quizData && currentQuestionIndex < quizData.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      setShowResults(true);
    }
  };

  const handleRestart = () => {
    setCurrentQuestionIndex(0);
    setScore(0);
    setShowResults(false);
  };

  if (!isOpen || !quizData) {
    return null;
  }

  const currentQuestion = quizData.questions[currentQuestionIndex];

  return (
    <div className="fixed inset-0 bg-black/30 z-40">
      <div className="fixed top-4 right-4 bottom-4 w-full max-w-2xl bg-card shadow-2xl z-50 flex flex-col p-6 border border-border rounded-xl">
        <div className="flex justify-between items-center border-b pb-4 mb-4">
          <h2 className="text-2xl font-bold">{quizData.title}</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-6 w-6" />
          </Button>
        </div>

        <div className="flex-grow overflow-y-auto relative">
          <AnimatePresence mode="wait">
            {!showResults ? (
              <QuestionCard
                key={currentQuestionIndex} // A chave é crucial para a AnimatePresence detectar a troca de componente
                question={currentQuestion}
                totalQuestions={quizData.questions.length}
                onAnswer={handleAnswer}
                onNext={handleNextQuestion}
              />
            ) : (
              <EvaluationResults
                score={score}
                totalQuestions={quizData.questions.length}
                onRestart={handleRestart}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};