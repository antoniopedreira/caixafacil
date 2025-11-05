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
      <div className="p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Entradas e saídas</h3>
        
        <div className="space-y-3">
          {/* Entradas */}
          <div>
            <div 
              className={`flex items-center justify-between p-4 rounded-lg cursor-pointer transition-all ${
                expandedCard === 'income' 
                  ? 'bg-emerald-50 border-2 border-emerald-500' 
                  : 'hover:bg-slate-50'
              }`}
              onClick={onClickIncome}
            >
              <span className="text-slate-700 font-medium">Entradas</span>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-emerald-600">
                  R$ {formatCurrency(income)}
                </span>
                {expandedCard === 'income' ? (
                  <ChevronDown className="w-5 h-5 text-slate-400" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                )}
              </div>
            </div>
            
            {/* Lista expandida de entradas */}
            {expandedCard === 'income' && children?.income}
          </div>

          {/* Saídas */}
          <div>
            <div 
              className={`flex items-center justify-between p-4 rounded-lg cursor-pointer transition-all ${
                expandedCard === 'expense' 
                  ? 'bg-rose-50 border-2 border-rose-500' 
                  : 'hover:bg-slate-50'
              }`}
              onClick={onClickExpense}
            >
              <span className="text-slate-700 font-medium">Saídas</span>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-rose-600">
                  R$ {formatCurrency(expense)}
                </span>
                {expandedCard === 'expense' ? (
                  <ChevronDown className="w-5 h-5 text-slate-400" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                )}
              </div>
            </div>
            
            {/* Lista expandida de saídas */}
            {expandedCard === 'expense' && children?.expense}
          </div>

          {/* Resultado do período */}
          <div className="border-t pt-3 mt-2">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
              <span className="text-slate-900 font-semibold">Resultado do período</span>
              <span className={`text-xl font-bold ${
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