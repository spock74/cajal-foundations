/**
 * @author José E. Moraes
 * @copyright 2025 - Todos os direitos reservados
 */
import React, { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { QuestionCard } from './QuestionCard';
import { EvaluationResults } from './EvaluationResults';
import { Button } from '@/components/ui/button';
import { QuizData } from '@/types';
import { fileExportService } from '@/services/fileExportService';

interface EvaluationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  quizData: QuizData | null;
}

export const EvaluationPanel: React.FC<EvaluationPanelProps> = ({ isOpen, onClose, quizData }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<{ [questionNumber: number]: string }>({});
  const [score, setScore] = useState(0);
  const [showResults, setShowResults] = useState(false);

  const handleAnswer = (questionNumber: number, answerLetter: string, isCorrect: boolean) => {
    if (isCorrect) {
      setScore(prev => prev + 1);
    }
    setUserAnswers(prev => ({ ...prev, [questionNumber]: answerLetter }));
  };

  const handleNextQuestion = () => {
    if (quizData && currentQuestionIndex < quizData.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      // Ao chegar na última questão, prepara e baixa o JSON
      if (quizData) {
        const quizWithAnswers = {
          ...quizData,
          questions: quizData.questions.map(q => ({
            ...q,
            resposta_aluno: userAnswers[q.questionNumber] || null,
          })),
        };
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        fileExportService.downloadJson(quizWithAnswers, `avaliacao_completa_${timestamp}.json`);
      }
      setShowResults(true);
    }
  };

  const handleRestart = () => {
    setCurrentQuestionIndex(0);
    setUserAnswers({});
    setScore(0);
    setShowResults(false);
  };

  if (!isOpen || !quizData) {
    return null;
  }

  const currentQuestion = quizData.questions[currentQuestionIndex];

  return (
    <div className="fixed inset-0 bg-black/30 z-40">
      <div className="fixed top-0 right-0 bottom-0 w-full bg-card shadow-2xl z-50 flex flex-col p-4 md:top-4 md:right-4 md:bottom-4 md:max-w-2xl md:rounded-xl md:border md:border-border md:p-6">
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