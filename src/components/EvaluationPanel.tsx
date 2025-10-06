/**
 * @author José E. Moraes
 * @copyright 2025 - Todos os direitos reservados
 */
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useAppContext } from '@/AppContext';
import { QuizData, AnswerOption } from '@/types';

interface EvaluationPanelProps {
  quizData: QuizData;
  onClose: () => void;
}

export const EvaluationPanel: React.FC<EvaluationPanelProps> = ({ quizData, onClose }) => {
  // Efeito para reiniciar o estado sempre que o quizData mudar (ou seja, um novo quiz começar)
  React.useEffect(() => {
    setCurrentQuestionIndex(0);
    setScore(0);
    setSelectedAnswerIndex(null);
    setIsAnswered(false);
  }, [quizData]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswerIndex, setSelectedAnswerIndex] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const currentQuestion = quizData.questions[currentQuestionIndex];
  const isQuizFinished = currentQuestionIndex >= quizData.questions.length;

  const handleAnswerSelect = (index: number) => {
    if (isAnswered) return;
    setSelectedAnswerIndex(index);
  };

  const handleCheckAnswer = () => {
    if (selectedAnswerIndex === null) return;

    const selectedOption = currentQuestion.answerOptions[selectedAnswerIndex];
    if (selectedOption.isCorrect) {
      setScore(prev => prev + 1);
    }
    setIsAnswered(true);
  };

  const handleNextQuestion = () => {
    setIsAnswered(false);
    setSelectedAnswerIndex(null);
    setShowHint(false);
    setCurrentQuestionIndex(prev => prev + 1);
  };

  const getOptionClassName = (option: AnswerOption, index: number) => {
    if (!isAnswered) return '';
    if (option.isCorrect) return 'bg-green-100 dark:bg-green-900/50 border-green-500';
    if (index === selectedAnswerIndex && !option.isCorrect) return 'bg-red-100 dark:bg-red-900/50 border-red-500';
    return '';
  };

  const renderQuiz = () => (
    <>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>{currentQuestion.question}</CardTitle>
          <span className="text-sm text-muted-foreground">
            {currentQuestionIndex + 1} / {quizData.questions.length}
          </span>
        </div>
      </CardHeader>
      <CardContent className="flex-grow overflow-y-auto">
        <RadioGroup
          value={selectedAnswerIndex?.toString()}
          onValueChange={(value) => handleAnswerSelect(parseInt(value))}
          disabled={isAnswered}
        >
          {currentQuestion.answerOptions.map((option, index) => (
            <div key={index} className={`p-4 rounded-lg border transition-colors mb-3 ${getOptionClassName(option, index)}`}>
              <div className="flex items-start space-x-3">
                <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                <Label htmlFor={`option-${index}`} className="font-normal cursor-pointer flex-1">
                  {option.text}
                </Label>
              </div>
              {isAnswered && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-3 text-sm text-muted-foreground pl-7"
                >
                  <strong>Racional:</strong> {option.rationale}
                </motion.div>
              )}
            </div>
          ))}
        </RadioGroup>
        <div className="mt-4">
          <Button variant="outline" size="sm" onClick={() => setShowHint(!showHint)}>
            {showHint ? 'Esconder Dica' : 'Mostrar Dica'}
          </Button>
          <AnimatePresence>
            {showHint && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-2 p-3 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-md text-sm"
              >
                {currentQuestion.hint}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </CardContent>
      <CardFooter>
        {isAnswered ? (
          <Button onClick={handleNextQuestion} className="w-full">
            {currentQuestionIndex < quizData.questions.length - 1 ? 'Próxima Pergunta' : 'Ver Resultados'}
          </Button>
        ) : (
          <Button onClick={handleCheckAnswer} disabled={selectedAnswerIndex === null} className="w-full">
            Verificar Resposta
          </Button>
        )}
      </CardFooter>
    </>
  );

  const renderResults = () => {
    const percentage = (score / quizData.questions.length) * 100;
    return (
      <>
        <CardHeader>
          <CardTitle>Avaliação Concluída!</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg">
            Seu placar final: <strong>{score} de {quizData.questions.length}</strong> corretas.
          </p>
          <p className="text-2xl font-bold mt-2">
            Aproveitamento de {percentage.toFixed(1)}%
          </p>
        </CardContent>
        <CardFooter>
          <Button onClick={onClose} className="w-full">
            Fechar Avaliação
          </Button>
        </CardFooter>
      </>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: '100%' }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: '100%' }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <Card className="relative w-full max-w-4xl h-[90vh] flex flex-col">
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="absolute top-3 right-3 z-10"
        >
          <X className="h-5 w-5" />
        </Button>
        {isQuizFinished ? renderResults() : renderQuiz()}
      </Card>
    </motion.div>
  );
};

const EvaluationContainer: React.FC = () => {
  const { isEvaluationPanelOpen, activeQuizData, handleCloseEvaluation } = useAppContext();

  return (
    <AnimatePresence>
      {isEvaluationPanelOpen && activeQuizData && (
        <EvaluationPanel quizData={activeQuizData} onClose={handleCloseEvaluation} />
      )}
    </AnimatePresence>
  );
};

export default EvaluationContainer;
