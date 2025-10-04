/**
 * @author José E. Moraes
 * @copyright 2025 - Todos os direitos reservados
 */

import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { TrendingUp, ArrowRight, ArrowLeft } from 'lucide-react';

export interface ModelUsage {
  modelName: string;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalTokens: number;
  interactionCount: number;
  estimatedCost: number;
}

interface UsageReportPanelProps {
  isOpen: boolean;
  onClose: () => void;
  data: ModelUsage[];
}

const formatNumber = (num: number) => new Intl.NumberFormat('pt-BR').format(num);
const formatCurrency = (num: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(num);

const UsageReportPanel: React.FC<UsageReportPanelProps> = ({ isOpen, onClose, data }) => {
  const [exchangeRateStr, setExchangeRateStr] = useState('5.50');

  const exchangeRate = useMemo(() => {
    const normalized = exchangeRateStr.replace(',', '.');
    const rate = parseFloat(normalized);
    return isNaN(rate) ? 0 : rate;
  }, [exchangeRateStr]);

  const totalCost = data.reduce((acc, model) => acc + (model.estimatedCost * exchangeRate), 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <TrendingUp size={24} />
            Relatório de Uso de Tokens
          </DialogTitle>
          <DialogDescription>
            Análise do consumo de tokens e custos estimados por modelo de IA em toda a aplicação.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Modelo</TableHead>
                <TableHead className="text-right">Interações</TableHead>
                <TableHead className="text-right">Tokens (Entrada)</TableHead>
                <TableHead className="text-right">Tokens (Saída)</TableHead>
                <TableHead className="text-right">Custo Estimado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    Nenhum dado de uso de token encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                data.map((model) => (
                  <TableRow key={model.modelName}>
                    <TableCell className="font-medium">
                      <Badge variant="secondary">{model.modelName}</Badge>
                    </TableCell>
                    <TableCell className="text-right">{formatNumber(model.interactionCount)}</TableCell>
                    <TableCell className="text-right text-green-500 dark:text-green-400">
                      <div className="flex items-center justify-end gap-1">
                        <ArrowRight size={12} /> {formatNumber(model.totalInputTokens)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-red-500 dark:text-red-400">
                      <div className="flex items-center justify-end gap-1">
                        <ArrowLeft size={12} /> {formatNumber(model.totalOutputTokens)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-bold">{formatCurrency(model.estimatedCost * exchangeRate)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        <div className="mt-4 pt-4 border-t flex justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <label htmlFor="exchange-rate" className="text-sm text-muted-foreground">Cotação USD → BRL:</label>
            <Input 
              id="exchange-rate"
              type="text"
              value={exchangeRateStr}
              onChange={(e) => setExchangeRateStr(e.target.value)}
              className="h-8 w-24 text-right"
            />
          </div>
          {totalCost > 0 && <>
            <span className="text-sm text-muted-foreground">Custo Total Estimado:</span>
            <span className="text-lg font-bold">{formatCurrency(totalCost)}</span>
          </>}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UsageReportPanel;