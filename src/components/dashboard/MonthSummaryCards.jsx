import React from 'react';
import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Wallet, ChevronDown, ChevronUp } from "lucide-react";

export default function MonthSummaryCards({ income, expense, balance, onClickIncome, onClickExpense, expandedCard }) {
  return (
    <>
      <Card className="border-0 shadow-md bg-white">
        <div className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
              <Wallet className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <p className="text-xs text-slate-600 mb-1">Saldo do mês</p>
          <p className={`text-lg font-bold ${balance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            R$ {balance.toFixed(2)}
          </p>
        </div>
      </Card>

      <Card 
        className="border-0 shadow-md bg-white cursor-pointer hover:shadow-lg transition-all relative"
        onClick={onClickIncome}
      >
        <div className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="ml-auto">
              {expandedCard === 'income' ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </div>
          </div>
          <p className="text-xs text-slate-600 mb-1">Entradas</p>
          <p className="text-lg font-bold text-emerald-600">
            R$ {income.toFixed(2)}
          </p>
        </div>
        {expandedCard === 'income' && (
          <div className="absolute inset-0 border-2 border-emerald-500 rounded-lg pointer-events-none" />
        )}
      </Card>

      <Card 
        className="border-0 shadow-md bg-white cursor-pointer hover:shadow-lg transition-all relative"
        onClick={onClickExpense}
      >
        <div className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center">
              <TrendingDown className="w-4 h-4 text-rose-600" />
            </div>
            <div className="ml-auto">
              {expandedCard === 'expense' ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </div>
          </div>
          <p className="text-xs text-slate-600 mb-1">Saídas</p>
          <p className="text-lg font-bold text-rose-600">
            R$ {expense.toFixed(2)}
          </p>
        </div>
        {expandedCard === 'expense' && (
          <div className="absolute inset-0 border-2 border-rose-500 rounded-lg pointer-events-none" />
        )}
      </Card>
    </>
  );
}