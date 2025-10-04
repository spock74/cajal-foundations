/**
 * @author José E. Moraes
 * @copyright 2025 - Todos os direitos reservados
 */
import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

interface EvaluationResultsProps {
  score: number;
  totalQuestions: number;
  onRestart: () => void;
}

export const EvaluationResults: React.FC<EvaluationResultsProps> = ({ score, totalQuestions, onRestart }) => {
  const percentage = totalQuestions > 0 ? (score / totalQuestions) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="text-center flex flex-col items-center justify-center h-full"
    >
      <h2 className="text-3xl font-bold mb-4">Avaliação Concluída!</h2>
      <p className="text-xl text-muted-foreground mb-2">Seu placar final:</p>
      <p className="text-6xl font-bold mb-6">{score} / {totalQuestions}</p>
      <p className="text-lg mb-8">Aproveitamento de <strong>{percentage.toFixed(1)}%</strong>.</p>
      <Button onClick={onRestart}>Refazer Avaliação</Button>
    </motion.div>
  );
};