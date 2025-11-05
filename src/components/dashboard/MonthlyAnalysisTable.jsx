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
  const [expandedRow, setExpandedRow] = useState(null); // 'income', 'expense', ou null
  const [expandedMonth, setExpandedMonth] = useState(null); // índice do mês expandido
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  const { monthsData, lastUpdateDate, analysis } = useMemo(() => {
    const now = new Date();
    const data = [];
    
    const lastTransactionDate = transactions.length > 0
      ? max(transactions.map(t => new Date(t.date)))
      : now;
    
    const monthsToShow = Math.min(showMonths, 12);
    for (let i = monthsToShow - 1; i >= 0; i--) {
      const date = subMonths(now, i);
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);
      
      const monthTransactions = transactions.filter(t => 
        isWithinInterval(new Date(t.date), { start: monthStart, end: monthEnd })
      );
      
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
    
    const analysisText = generateAnalysis(data);
    
    return {
      monthsData: data,
      lastUpdateDate: lastTransactionDate,
      analysis: analysisText
    };
  }, [transactions, showMonths]);

  const toggleRow = (rowType) => {
    if (expandedRow === rowType) {
      setExpandedRow(null);
      setExpandedMonth(null);
      setExpandedCategory(null);
    } else {
      setExpandedRow(rowType);
      setExpandedMonth(null);
      setExpandedCategory(null);
    }
  };

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

          {/* Tabela horizontal */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-slate-200">
                  <th className="text-left p-3 font-semibold text-slate-900 sticky left-0 bg-white z-10">
                    
                  </th>
                  {monthsData.map((month, index) => (
                    <th key={index} className="p-3 text-center min-w-[140px]">
                      <div className={`${
                        month.isCurrentMonth 
                          ? 'bg-blue-100 text-blue-900 font-bold rounded-lg p-2' 
                          : 'text-slate-700'
                      }`}>
                        <div className="text-sm">{month.month}</div>
                        {month.isCurrentMonth && (
                          <Badge className="bg-blue-600 text-white text-xs mt-1">
                            Atual
                          </Badge>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Linha de Entradas */}
                <tr className={`border-b border-slate-100 hover:bg-emerald-50 cursor-pointer transition-colors ${
                  expandedRow === 'income' ? 'bg-emerald-50' : ''
                }`}>
                  <td 
                    className="p-3 font-semibold text-slate-900 sticky left-0 bg-white z-10"
                    onClick={() => toggleRow('income')}
                  >
                    <div className="flex items-center gap-2">
                      {expandedRow === 'income' ? (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      )}
                      <span className="text-emerald-700">Entradas</span>
                    </div>
                  </td>
                  {monthsData.map((month, index) => (
                    <td key={index} className="p-3 text-center">
                      <div className="font-bold text-emerald-600">
                        R$ {formatCurrency(month.income)}
                      </div>
                    </td>
                  ))}
                </tr>

                {/* Detalhamento de Entradas */}
                {expandedRow === 'income' && (
                  <tr>
                    <td colSpan={monthsData.length + 1} className="p-0">
                      <div className="bg-emerald-50 p-4">
                        <p className="text-sm font-semibold text-emerald-900 mb-3">
                          Clique em um mês para ver o detalhamento:
                        </p>
                        <div className="grid gap-2" style={{ gridTemplateColumns: `120px repeat(${monthsData.length}, 1fr)` }}>
                          {/* Cabeçalho de categorias */}
                          <div></div>
                          {monthsData.map((month, index) => (
                            <div key={index} className="text-center">
                              <Button
                                variant={expandedMonth === index ? "default" : "outline"}
                                size="sm"
                                onClick={() => toggleMonth(index)}
                                className="w-full text-xs"
                              >
                                {month.month}
                              </Button>
                            </div>
                          ))}
                          
                          {/* Categorias de entrada */}
                          {expandedMonth !== null && (
                            <>
                              {Object.entries(monthsData[expandedMonth].incomeByCategory)
                                .sort((a, b) => b[1].total - a[1].total)
                                .map(([category, data]) => (
                                  <React.Fragment key={category}>
                                    <div 
                                      className="text-sm text-slate-700 font-medium p-2 hover:bg-emerald-100 rounded cursor-pointer"
                                      onClick={() => toggleCategory(`income-${category}`)}
                                    >
                                      <div className="flex items-center gap-1">
                                        {expandedCategory === `income-${category}` ? (
                                          <ChevronDown className="w-3 h-3" />
                                        ) : (
                                          <ChevronRight className="w-3 h-3" />
                                        )}
                                        {CATEGORY_NAMES[category] || category}
                                      </div>
                                    </div>
                                    {monthsData.map((m, idx) => (
                                      <div key={idx} className={`text-center p-2 ${idx === expandedMonth ? 'bg-white rounded' : ''}`}>
                                        {idx === expandedMonth && (
                                          <span className="text-sm font-semibold text-emerald-700">
                                            R$ {formatCurrency(data.total)}
                                          </span>
                                        )}
                                      </div>
                                    ))}
                                    
                                    {/* Transações da categoria */}
                                    {expandedCategory === `income-${category}` && (
                                      <>
                                        <div className="col-span-full ml-8 space-y-1 mt-2">
                                          {data.transactions
                                            .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount))
                                            .map((transaction) => (
                                              <div
                                                key={transaction.id}
                                                className="flex items-center justify-between p-2 bg-white rounded text-xs hover:bg-emerald-100 cursor-pointer"
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
                                      </>
                                    )}
                                  </React.Fragment>
                                ))}
                            </>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}

                {/* Linha de Saídas */}
                <tr className={`border-b border-slate-100 hover:bg-rose-50 cursor-pointer transition-colors ${
                  expandedRow === 'expense' ? 'bg-rose-50' : ''
                }`}>
                  <td 
                    className="p-3 font-semibold text-slate-900 sticky left-0 bg-white z-10"
                    onClick={() => toggleRow('expense')}
                  >
                    <div className="flex items-center gap-2">
                      {expandedRow === 'expense' ? (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      )}
                      <span className="text-rose-700">Saídas</span>
                    </div>
                  </td>
                  {monthsData.map((month, index) => (
                    <td key={index} className="p-3 text-center">
                      <div className="font-bold text-rose-600">
                        R$ {formatCurrency(month.expense)}
                      </div>
                    </td>
                  ))}
                </tr>

                {/* Detalhamento de Saídas */}
                {expandedRow === 'expense' && (
                  <tr>
                    <td colSpan={monthsData.length + 1} className="p-0">
                      <div className="bg-rose-50 p-4">
                        <p className="text-sm font-semibold text-rose-900 mb-3">
                          Clique em um mês para ver o detalhamento:
                        </p>
                        <div className="grid gap-2" style={{ gridTemplateColumns: `120px repeat(${monthsData.length}, 1fr)` }}>
                          <div></div>
                          {monthsData.map((month, index) => (
                            <div key={index} className="text-center">
                              <Button
                                variant={expandedMonth === index ? "default" : "outline"}
                                size="sm"
                                onClick={() => toggleMonth(index)}
                                className="w-full text-xs"
                              >
                                {month.month}
                              </Button>
                            </div>
                          ))}
                          
                          {expandedMonth !== null && (
                            <>
                              {Object.entries(monthsData[expandedMonth].expenseByCategory)
                                .sort((a, b) => b[1].total - a[1].total)
                                .map(([category, data]) => (
                                  <React.Fragment key={category}>
                                    <div 
                                      className="text-sm text-slate-700 font-medium p-2 hover:bg-rose-100 rounded cursor-pointer"
                                      onClick={() => toggleCategory(`expense-${category}`)}
                                    >
                                      <div className="flex items-center gap-1">
                                        {expandedCategory === `expense-${category}` ? (
                                          <ChevronDown className="w-3 h-3" />
                                        ) : (
                                          <ChevronRight className="w-3 h-3" />
                                        )}
                                        {CATEGORY_NAMES[category] || category}
                                      </div>
                                    </div>
                                    {monthsData.map((m, idx) => (
                                      <div key={idx} className={`text-center p-2 ${idx === expandedMonth ? 'bg-white rounded' : ''}`}>
                                        {idx === expandedMonth && (
                                          <span className="text-sm font-semibold text-rose-700">
                                            R$ {formatCurrency(data.total)}
                                          </span>
                                        )}
                                      </div>
                                    ))}
                                    
                                    {expandedCategory === `expense-${category}` && (
                                      <>
                                        <div className="col-span-full ml-8 space-y-1 mt-2">
                                          {data.transactions
                                            .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount))
                                            .map((transaction) => (
                                              <div
                                                key={transaction.id}
                                                className="flex items-center justify-between p-2 bg-white rounded text-xs hover:bg-rose-100 cursor-pointer"
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
                                      </>
                                    )}
                                  </React.Fragment>
                                ))}
                            </>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}

                {/* Linha de Resultado do Período */}
                <tr className="border-t-2 border-slate-300 bg-slate-50">
                  <td className="p-3 font-bold text-slate-900 sticky left-0 bg-slate-50 z-10">
                    Resultado do Período
                  </td>
                  {monthsData.map((month, index) => (
                    <td key={index} className="p-3 text-center">
                      <div className={`font-bold text-lg ${
                        month.balance >= 0 ? 'text-blue-600' : 'text-rose-600'
                      }`}>
                        R$ {formatCurrency(month.balance)}
                      </div>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Análise automática */}
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

      {/* Modal de detalhes da transação */}
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