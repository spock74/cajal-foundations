/**
 * @author José E. Moraes
 * @copyright 2025 - Todos os direitos reservados
 */
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { QuizQuestion } from '@/types';
import { cn } from '@/lib/utils';

interface QuestionCardProps {
  question: QuizQuestion;
  totalQuestions: number;
  onAnswer: (questionNumber: number, answerLetter: string, isCorrect: boolean) => void;
  onNext: () => void;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({ question, totalQuestions, onAnswer, onNext }) => {
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const handleCheckAnswer = () => {
    if (selectedOptionIndex === null) return;
    setIsAnswered(true);
    const selectedIndex = selectedOptionIndex;
    const isCorrect = question.answerOptions[selectedIndex].isCorrect;
    const answerLetter = String.fromCharCode(97 + selectedIndex); // 0->'a', 1->'b', etc.
    onAnswer(question.questionNumber, answerLetter, isCorrect);
  };

  const cardVariants = {
    initial: { opacity: 0, x: 100 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -100 },
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="absolute w-full"
    >
      <div className="flex justify-between items-center mb-4 pb-2 border-b">
        <h3 className="text-lg font-semibold">{question.question}</h3>
        <span className="text-sm text-muted-foreground">
          Questão {question.questionNumber} de {totalQuestions}
        </span>
      </div>

      <ul className="space-y-3">
        {question.answerOptions.map((option, index) => {
          const isCorrect = option.isCorrect;
          const isSelected = selectedOptionIndex === index;

          return (
            <li key={index}>
              <label
                className={cn(
                  "block p-4 border rounded-lg cursor-pointer transition-all",
                  isAnswered && isCorrect && "bg-green-100 border-green-400 dark:bg-green-900/50 dark:border-green-700",
                  isAnswered && isSelected && !isCorrect && "bg-red-100 border-red-400 dark:bg-red-900/50 dark:border-red-700",
                  !isAnswered && "hover:bg-muted/50",
                  !isAnswered && isSelected && "border-primary"
                )}
              >
                <input
                  type="radio"
                  name="option"
                  className="hidden"
                  checked={isSelected}
                  disabled={isAnswered}
                  onChange={() => setSelectedOptionIndex(index)}
                />
                {option.text}
                {isAnswered && (
                  <p className="text-sm mt-2 text-muted-foreground italic">
                    <strong>Raciocínio:</strong> {option.rationale}
                  </p>
                )}
              </label>
            </li>
          );
        })}
      </ul>

      <div className="mt-6 space-y-4">
        <div className="flex justify-between items-center">
          <Button variant="outline" size="sm" onClick={() => setShowHint(!showHint)}>
            <Lightbulb className="h-4 w-4 mr-2" />
            Dica
          </Button>
          {!isAnswered ? (
            <Button onClick={handleCheckAnswer} disabled={selectedOptionIndex === null}>Verificar</Button>
          ) : (
            <Button onClick={onNext}>
              {question.questionNumber === totalQuestions ? 'Ver Resultados' : 'Próxima'}
            </Button>
          )}
        </div>
        {showHint && (
          <p className="text-sm p-4 bg-blue-50 border border-blue-200 rounded-lg dark:bg-blue-950 dark:border-blue-800">
            {question.hint}
          </p>
        )}
      </div>
    </motion.div>
  );
};