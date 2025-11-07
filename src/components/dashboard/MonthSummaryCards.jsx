import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { ChevronRight, ChevronDown, HelpCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Função para formatar valores sem decimal
const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

const explanations = {
  initialBalance: {
    title: "Saldo Inicial",
    description: "É o dinheiro que você tinha em caixa no primeiro dia do mês. Esse valor é a soma de todas as entradas menos todas as saídas dos meses anteriores."
  },
  income: {
    title: "Entradas do Mês",
    description: "Todo o dinheiro que ENTROU no seu caixa durante este mês. Inclui vendas, recebimentos de clientes, prestação de serviços, etc."
  },
  expense: {
    title: "Saídas do Mês",
    description: "Todo o dinheiro que SAIU do seu caixa durante este mês. Inclui pagamentos a fornecedores, salários, aluguel, contas, impostos, etc."
  },
  result: {
    title: "Resultado do Mês",
    description: "É quanto você ganhou ou perdeu durante o mês. Se for positivo, você teve lucro (entrou mais do que saiu). Se for negativo, você teve prejuízo (saiu mais do que entrou)."
  },
  finalBalance: {
    title: "Saldo Final em Caixa",
    description: "É o dinheiro que você tem em caixa no último dia do mês. Calculado assim: Saldo Inicial + Resultado do Mês = Saldo Final. É com esse valor que você começa o próximo mês."
  }
};

function InfoIcon({ explanationType }) {
  const [open, setOpen] = useState(false);
  const explanation = explanations[explanationType];

  return (
    <>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        className="flex items-center justify-center w-5 h-5 hover:bg-slate-200 rounded-full transition-colors ml-1"
      >
        <HelpCircle className="w-4 h-4 text-slate-500" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{explanation.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-slate-700 leading-relaxed">
              {explanation.description}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function MonthSummaryCards({ 
  income, 
  expense, 
  balance, 
  initialBalance,
  finalBalance,
  monthName,
  onClickIncome, 
  onClickExpense, 
  expandedCard, 
  children 
}) {
  return (
    <Card className="border-0 shadow-md bg-white">
      <div className="p-4">
        <h3 className="text-base font-semibold text-slate-900 mb-3">Fluxo de Caixa - {monthName}</h3>
        
        <div className="space-y-2">
          {/* Saldo Inicial */}
          <div className="flex items-center justify-between p-3 bg-slate-100 rounded-lg">
            <div className="flex items-center">
              <span className="text-slate-700 font-medium text-sm">(=) Saldo inicial - {monthName}</span>
              <InfoIcon explanationType="initialBalance" />
            </div>
            <span className={`text-lg font-bold ${
              initialBalance >= 0 ? 'text-slate-900' : 'text-rose-600'
            }`}>
              {initialBalance >= 0 ? '' : '-'} R$ {formatCurrency(Math.abs(initialBalance))}
            </span>
          </div>

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
              <div className="flex items-center">
                <span className="text-slate-700 font-medium text-sm">(+) Entradas</span>
                <InfoIcon explanationType="income" />
              </div>
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
              <div className="flex items-center">
                <span className="text-slate-700 font-medium text-sm">(-) Saídas</span>
                <InfoIcon explanationType="expense" />
              </div>
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
            
            {expandedCard === 'expense' && children?.expense}
          </div>

          {/* Resultado do Mês */}
          <div className="border-t pt-2 mt-2">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center">
                <span className="text-slate-900 font-semibold text-sm">(+) Resultado - {monthName}</span>
                <InfoIcon explanationType="result" />
              </div>
              <span className={`text-lg font-bold ${
                balance >= 0 ? 'text-emerald-600' : 'text-rose-600'
              }`}>
                {balance >= 0 ? '+' : '-'} R$ {formatCurrency(Math.abs(balance))}
              </span>
            </div>
          </div>

          {/* Saldo Final */}
          <div className="flex items-center justify-between p-3 bg-gradient-to-r from-slate-100 to-slate-50 rounded-lg border-2 border-slate-200">
            <div className="flex items-center">
              <span className="text-slate-900 font-bold text-sm">(=) Saldo final em caixa - {monthName}</span>
              <InfoIcon explanationType="finalBalance" />
            </div>
            <span className={`text-xl font-bold ${
              finalBalance >= 0 ? 'text-emerald-600' : 'text-rose-600'
            }`}>
              {finalBalance >= 0 ? '' : '-'} R$ {formatCurrency(Math.abs(finalBalance))}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}