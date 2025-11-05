
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, Calendar, Info } from "lucide-react";
import { format, startOfMonth, endOfMonth, subMonths, isWithinInterval, isSameMonth, max } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const CATEGORY_NAMES = {
  vendas: "Vendas",
  servicos: "Serviços",
  investimentos: "Investimentos",
  emprestimos_recebidos: "Empréstimos Recebidos",
  outras_receitas: "Outras Receitas",
  salarios_funcionarios: "Salários",
  fornecedores: "Fornecedores",
  aluguel: "Aluguel",
  contas_servicos: "Contas e Serviços",
  impostos_taxas: "Impostos e Taxas",
  marketing_publicidade: "Marketing",
  equipamentos_materiais: "Equipamentos",
  manutencao: "Manutenção",
  combustivel_transporte: "Transporte",
  emprestimos_pagos: "Empréstimos Pagos",
  outras_despesas: "Outras Despesas"
};

const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

// Função para gerar análise - definida ANTES de ser usada
const generateAnalysis = (data) => {
  if (data.length < 2) return null;
  
  const currentMonth = data[data.length - 1];
  const previousMonth = data[data.length - 2];
  
  const incomeVariation = previousMonth.income > 0
    ? ((currentMonth.income - previousMonth.income) / previousMonth.income * 100)
    : 0;
  
  const expenseVariation = previousMonth.expense > 0
    ? ((currentMonth.expense - previousMonth.expense) / previousMonth.expense * 100)
    : 0;
  
  // Identifica maiores gastos do mês atual
  const topExpenses = Object.entries(currentMonth.expenseByCategory)
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 3);
  
  return {
    incomeVariation,
    expenseVariation,
    topExpenses,
    currentMonth,
    previousMonth
  };
};

export default function MonthlyAnalysisTable({ transactions }) {
  const [showMonths, setShowMonths] = useState(6);
  const [expandedMonth, setExpandedMonth] = useState(null);
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  const { monthsData, lastUpdateDate, analysis } = useMemo(() => {
    const now = new Date();
    const data = [];
    
    // Encontra a data da última transação
    const lastTransactionDate = transactions.length > 0
      ? max(transactions.map(t => new Date(t.date)))
      : now;
    
    // Gera dados dos últimos meses
    const monthsToShow = Math.min(showMonths, 12);
    for (let i = monthsToShow - 1; i >= 0; i--) {
      const date = subMonths(now, i);
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);
      
      const monthTransactions = transactions.filter(t => 
        isWithinInterval(new Date(t.date), { start: monthStart, end: monthEnd })
      );
      
      // Agrupa por categoria
      const incomeByCategory = {};
      const expenseByCategory = {};
      
      monthTransactions.forEach(t => {
        if (t.type === 'income') {
          incomeByCategory[t.category] = incomeByCategory[t.category] || { total: 0, transactions: [] };
          incomeByCategory[t.category].total += t.amount;
          incomeByCategory[t.category].transactions.push(t);
        } else {
          expenseByCategory[t.category] = expenseByCategory[t.category] || { total: 0, transactions: [] };
          expenseByCategory[t.category].total += Math.abs(t.amount);
          expenseByCategory[t.category].transactions.push(t);
        }
      });
      
      const totalIncome = Object.values(incomeByCategory).reduce((sum, cat) => sum + cat.total, 0);
      const totalExpense = Object.values(expenseByCategory).reduce((sum, cat) => sum + cat.total, 0);
      
      data.push({
        date,
        month: format(date, "MMM/yy", { locale: ptBR }),
        fullMonth: format(date, "MMMM 'de' yyyy", { locale: ptBR }),
        income: totalIncome,
        expense: totalExpense,
        balance: totalIncome - totalExpense,
        isCurrentMonth: isSameMonth(date, now),
        incomeByCategory,
        expenseByCategory,
        transactionCount: monthTransactions.length
      });
    }
    
    // Análise automática - agora usando a função definida acima
    const analysisText = generateAnalysis(data);
    
    return {
      monthsData: data,
      lastUpdateDate: lastTransactionDate,
      analysis: analysisText
    };
  }, [transactions, showMonths]);

  const toggleMonth = (monthIndex) => {
    setExpandedMonth(expandedMonth === monthIndex ? null : monthIndex);
    setExpandedCategory(null);
  };

  const toggleCategory = (category) => {
    setExpandedCategory(expandedCategory === category ? null : category);
  };

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Análise Mensal Comparativa</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant={showMonths === 6 ? "default" : "outline"}
                size="sm"
                onClick={() => setShowMonths(6)}
              >
                6 meses
              </Button>
              <Button
                variant={showMonths === 12 ? "default" : "outline"}
                size="sm"
                onClick={() => setShowMonths(12)}
              >
                12 meses
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 text-sm text-blue-900">
              <Info className="w-4 h-4" />
              <span>
                Dados atualizados até <strong>{format(lastUpdateDate, "dd/MM/yyyy", { locale: ptBR })}</strong>
              </span>
            </div>
          </div>

          <div className="space-y-2">
            {monthsData.map((month, index) => (
              <div key={index}>
                <div
                  className={`rounded-lg transition-all cursor-pointer ${
                    month.isCurrentMonth
                      ? 'bg-blue-50 border-2 border-blue-400'
                      : expandedMonth === index
                      ? 'bg-slate-50'
                      : 'hover:bg-slate-50'
                  }`}
                  onClick={() => toggleMonth(index)}
                >
                  <div className="p-4">
                    <div className="grid grid-cols-12 gap-4 items-center">
                      <div className="col-span-3 flex items-center gap-2">
                        {expandedMonth === index ? (
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-slate-400" />
                        )}
                        <div>
                          <span className={`font-semibold ${
                            month.isCurrentMonth ? 'text-blue-900' : 'text-slate-900'
                          }`}>
                            {month.fullMonth}
                          </span>
                          {month.isCurrentMonth && (
                            <Badge className="ml-2 bg-blue-600 text-white text-xs">
                              Mês Atual
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="col-span-3 text-right">
                        <p className="text-xs text-slate-600 mb-1">Entradas</p>
                        <p className="text-lg font-bold text-emerald-600">
                          R$ {formatCurrency(month.income)}
                        </p>
                      </div>

                      <div className="col-span-3 text-right">
                        <p className="text-xs text-slate-600 mb-1">Saídas</p>
                        <p className="text-lg font-bold text-rose-600">
                          R$ {formatCurrency(month.expense)}
                        </p>
                      </div>

                      <div className="col-span-3 text-right">
                        <p className="text-xs text-slate-600 mb-1">Resultado</p>
                        <p className={`text-lg font-bold ${
                          month.balance >= 0 ? 'text-blue-600' : 'text-rose-600'
                        }`}>
                          R$ {formatCurrency(month.balance)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {expandedMonth === index && (
                  <div className="ml-6 mt-2 space-y-2 mb-4">
                    {Object.keys(month.incomeByCategory).length > 0 && (
                      <div className="bg-emerald-50 rounded-lg p-3">
                        <p className="text-sm font-semibold text-emerald-900 mb-2">
                          Detalhamento das Entradas
                        </p>
                        {Object.entries(month.incomeByCategory)
                          .sort((a, b) => b[1].total - a[1].total)
                          .map(([category, data]) => (
                            <div key={category}>
                              <div
                                className="flex items-center justify-between p-2 hover:bg-emerald-100 rounded cursor-pointer"
                                onClick={() => toggleCategory(`income-${category}`)}
                              >
                                <div className="flex items-center gap-2">
                                  {expandedCategory === `income-${category}` ? (
                                    <ChevronDown className="w-3 h-3 text-slate-400" />
                                  ) : (
                                    <ChevronRight className="w-3 h-3 text-slate-400" />
                                  )}
                                  <span className="text-sm text-slate-900">
                                    {CATEGORY_NAMES[category] || category}
                                  </span>
                                </div>
                                <span className="text-sm font-semibold text-emerald-700">
                                  R$ {formatCurrency(data.total)}
                                </span>
                              </div>

                              {expandedCategory === `income-${category}` && (
                                <div className="ml-6 mt-1 space-y-1">
                                  {data.transactions
                                    .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount))
                                    .map((transaction) => (
                                      <div
                                        key={transaction.id}
                                        className="flex items-center justify-between p-2 bg-white rounded text-xs hover:bg-emerald-50 cursor-pointer"
                                        onClick={() => setSelectedTransaction(transaction)}
                                      >
                                        <div className="flex items-center gap-2">
                                          <span className="text-slate-500">
                                            {format(new Date(transaction.date), "dd/MM")}
                                          </span>
                                          <span className="text-slate-900">
                                            {transaction.description}
                                          </span>
                                        </div>
                                        <span className="font-semibold text-emerald-600">
                                          R$ {formatCurrency(Math.abs(transaction.amount))}
                                        </span>
                                      </div>
                                    ))}
                                </div>
                              )}
                            </div>
                          ))}
                      </div>
                    )}

                    {Object.keys(month.expenseByCategory).length > 0 && (
                      <div className="bg-rose-50 rounded-lg p-3">
                        <p className="text-sm font-semibold text-rose-900 mb-2">
                          Detalhamento das Saídas
                        </p>
                        {Object.entries(month.expenseByCategory)
                          .sort((a, b) => b[1].total - a[1].total)
                          .map(([category, data]) => (
                            <div key={category}>
                              <div
                                className="flex items-center justify-between p-2 hover:bg-rose-100 rounded cursor-pointer"
                                onClick={() => toggleCategory(`expense-${category}`)}
                              >
                                <div className="flex items-center gap-2">
                                  {expandedCategory === `expense-${category}` ? (
                                    <ChevronDown className="w-3 h-3 text-slate-400" />
                                  ) : (
                                    <ChevronRight className="w-3 h-3 text-slate-400" />
                                  )}
                                  <span className="text-sm text-slate-900">
                                    {CATEGORY_NAMES[category] || category}
                                  </span>
                                </div>
                                <span className="text-sm font-semibold text-rose-700">
                                  R$ {formatCurrency(data.total)}
                                </span>
                              </div>

                              {expandedCategory === `expense-${category}` && (
                                <div className="ml-6 mt-1 space-y-1">
                                  {data.transactions
                                    .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount))
                                    .map((transaction) => (
                                      <div
                                        key={transaction.id}
                                        className="flex items-center justify-between p-2 bg-white rounded text-xs hover:bg-rose-50 cursor-pointer"
                                        onClick={() => setSelectedTransaction(transaction)}
                                      >
                                        <div className="flex items-center gap-2">
                                          <span className="text-slate-500">
                                            {format(new Date(transaction.date), "dd/MM")}
                                          </span>
                                          <span className="text-slate-900">
                                            {transaction.description}
                                          </span>
                                        </div>
                                        <span className="font-semibold text-rose-600">
                                          R$ {formatCurrency(Math.abs(transaction.amount))}
                                        </span>
                                      </div>
                                    ))}
                                </div>
                              )}
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {analysis && (
        <Card className="border-0 shadow-md bg-gradient-to-br from-purple-50 to-blue-50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-600" />
              Análise do Período
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-lg p-4 border border-emerald-200">
                <p className="text-sm text-slate-600 mb-2">Variação das Entradas</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-bold text-slate-900">
                    {Math.abs(analysis.incomeVariation).toFixed(1)}%
                  </p>
                  <Badge className={
                    analysis.incomeVariation >= 0
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-rose-100 text-rose-700'
                  }>
                    {analysis.incomeVariation >= 0 ? '↑' : '↓'} vs mês anterior
                  </Badge>
                </div>
                <p className="text-xs text-slate-600 mt-2">
                  De R$ {formatCurrency(analysis.previousMonth.income)} para R$ {formatCurrency(analysis.currentMonth.income)}
                </p>
              </div>

              <div className="bg-white rounded-lg p-4 border border-rose-200">
                <p className="text-sm text-slate-600 mb-2">Variação das Saídas</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-bold text-slate-900">
                    {Math.abs(analysis.expenseVariation).toFixed(1)}%
                  </p>
                  <Badge className={
                    analysis.expenseVariation >= 0
                      ? 'bg-rose-100 text-rose-700'
                      : 'bg-emerald-100 text-emerald-700'
                  }>
                    {analysis.expenseVariation >= 0 ? '↑' : '↓'} vs mês anterior
                  </Badge>
                </div>
                <p className="text-xs text-slate-600 mt-2">
                  De R$ {formatCurrency(analysis.previousMonth.expense)} para R$ {formatCurrency(analysis.currentMonth.expense)}
                </p>
              </div>
            </div>

            {analysis.topExpenses.length > 0 && (
              <div className="bg-white rounded-lg p-4">
                <p className="text-sm font-semibold text-slate-900 mb-3">
                  💰 Principais Gastos do Mês Atual
                </p>
                <div className="space-y-2">
                  {analysis.topExpenses.map(([category, data], index) => (
                    <div key={category} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-semibold text-slate-700">
                          {index + 1}
                        </span>
                        <span className="text-sm text-slate-900">
                          {CATEGORY_NAMES[category] || category}
                        </span>
                      </div>
                      <span className="text-sm font-bold text-rose-600">
                        R$ {formatCurrency(data.total)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-white rounded-lg p-4 border-l-4 border-purple-500">
              <p className="text-sm text-slate-700 leading-relaxed">
                {analysis.incomeVariation >= 0 ? (
                  <span className="font-semibold text-emerald-600">
                    Ótima notícia! Suas receitas cresceram {Math.abs(analysis.incomeVariation).toFixed(1)}% em relação ao mês anterior.
                  </span>
                ) : (
                  <span className="font-semibold text-rose-600">
                    Atenção: Suas receitas caíram {Math.abs(analysis.incomeVariation).toFixed(1)}% em relação ao mês anterior.
                  </span>
                )}
                {' '}
                {analysis.expenseVariation >= 0 ? (
                  <span>
                    Suas despesas aumentaram {Math.abs(analysis.expenseVariation).toFixed(1)}%, 
                    sendo que os maiores gastos foram em {CATEGORY_NAMES[analysis.topExpenses[0][0]] || analysis.topExpenses[0][0]}.
                  </span>
                ) : (
                  <span className="text-emerald-600">
                    Parabéns! Você conseguiu reduzir suas despesas em {Math.abs(analysis.expenseVariation).toFixed(1)}%.
                  </span>
                )}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={!!selectedTransaction} onOpenChange={() => setSelectedTransaction(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Detalhes da Transação</DialogTitle>
          </DialogHeader>
          {selectedTransaction && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-slate-600 mb-1">Descrição</p>
                <p className="font-medium text-slate-900">{selectedTransaction.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Data</p>
                  <p className="font-medium text-slate-900">
                    {format(new Date(selectedTransaction.date), "dd/MM/yyyy")}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 mb-1">Valor</p>
                  <p className={`font-bold ${
                    selectedTransaction.type === 'income' ? 'text-emerald-600' : 'text-rose-600'
                  }`}>
                    R$ {formatCurrency(Math.abs(selectedTransaction.amount))}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm text-slate-600 mb-1">Categoria</p>
                <Badge variant="outline">
                  {CATEGORY_NAMES[selectedTransaction.category] || selectedTransaction.category}
                </Badge>
              </div>

              {selectedTransaction.payment_method && (
                <div>
                  <p className="text-sm text-slate-600 mb-1">Forma de Pagamento</p>
                  <p className="font-medium text-slate-900 capitalize">
                    {selectedTransaction.payment_method.replace(/_/g, ' ')}
                  </p>
                </div>
              )}

              {selectedTransaction.notes && (
                <div>
                  <p className="text-sm text-slate-600 mb-1">Observações</p>
                  <p className="text-sm text-slate-700">{selectedTransaction.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
