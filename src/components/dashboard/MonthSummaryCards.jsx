import React from 'react';
import { Card } from "@/components/ui/card";
import { ChevronRight, ChevronDown } from "lucide-react";

// Função para formatar valores sem decimal
const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

export default function MonthSummaryCards({ income, expense, balance, onClickIncome, onClickExpense, expandedCard, children }) {
  return (
    <Card className="border-0 shadow-md bg-white">
      <div className="p-4">
        <h3 className="text-base font-semibold text-slate-900 mb-3">Entradas e saídas</h3>
        
        <div className="space-y-2">
          {/* Entradas */}
          <div>
            <div 
              className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all ${
                expandedCard === 'income' 
                  ? 'bg-emerald-50 border-2 border-emerald-500' 
                  : 'hover:bg-slate-50'
              }`}
              onClick={onClickIncome}
            >
              <span className="text-slate-700 font-medium text-sm">Entradas</span>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-emerald-600">
                  R$ {formatCurrency(income)}
                </span>
                {expandedCard === 'income' ? (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                )}
              </div>
            </div>
            
            {/* Lista expandida de entradas */}
            {expandedCard === 'income' && children?.income}
          </div>

          {/* Saídas */}
          <div>
            <div 
              className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all ${
                expandedCard === 'expense' 
                  ? 'bg-rose-50 border-2 border-rose-500' 
                  : 'hover:bg-slate-50'
              }`}
              onClick={onClickExpense}
            >
              <span className="text-slate-700 font-medium text-sm">Saídas</span>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-rose-600">
                  R$ {formatCurrency(expense)}
                </span>
                {expandedCard === 'expense' ? (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                )}
              </div>
            </div>
            
            {/* Lista expandida de saídas */}
            {expandedCard === 'expense' && children?.expense}
          </div>

          {/* Resultado do período */}
          <div className="border-t pt-2 mt-2">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <span className="text-slate-900 font-semibold text-sm">Resultado do período</span>
              <span className={`text-lg font-bold ${
                balance >= 0 ? 'text-emerald-600' : 'text-rose-600'
              }`}>
                {balance >= 0 ? '' : '-'} R$ {formatCurrency(Math.abs(balance))}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}