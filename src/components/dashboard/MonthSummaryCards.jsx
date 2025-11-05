import React from 'react';
import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Wallet } from "lucide-react";

export default function MonthSummaryCards({ income, expense, balance, onClickIncome, onClickExpense }) {
  return (
    <div className="grid grid-cols-3 gap-3">
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
        className="border-0 shadow-md bg-white cursor-pointer hover:shadow-lg transition-shadow"
        onClick={onClickIncome}
      >
        <div className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
          <p className="text-xs text-slate-600 mb-1">Entradas</p>
          <p className="text-lg font-bold text-emerald-600">
            R$ {income.toFixed(2)}
          </p>
        </div>
      </Card>

      <Card 
        className="border-0 shadow-md bg-white cursor-pointer hover:shadow-lg transition-shadow"
        onClick={onClickExpense}
      >
        <div className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center">
              <TrendingDown className="w-4 h-4 text-rose-600" />
            </div>
          </div>
          <p className="text-xs text-slate-600 mb-1">Saídas</p>
          <p className="text-lg font-bold text-rose-600">
            R$ {expense.toFixed(2)}
          </p>
        </div>
      </Card>
    </div>
  );
}