import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp, TrendingDown, Wallet, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

import StatCard from "../components/dashboard/StatCard";
import CashFlowChart from "../components/dashboard/CashFlowChart";
import CategoryChart from "../components/dashboard/CategoryChart";

export default function Dashboard() {
  const [selectedMonth, setSelectedMonth] = useState("0"); // 0 = mês atual

  const { data: transactions, isLoading } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => base44.entities.Transaction.list('-date'),
    initialData: [],
  });

  // Gera lista dos últimos 12 meses
  const monthOptions = React.useMemo(() => {
    const options = [];
    for (let i = 0; i < 12; i++) {
      const date = subMonths(new Date(), i);
      options.push({
        value: i.toString(),
        label: format(date, "MMMM 'de' yyyy", { locale: ptBR }),
        date: date
      });
    }
    return options;
  }, []);

  // Calcular estatísticas do mês selecionado
  const stats = React.useMemo(() => {
    const monthsBack = parseInt(selectedMonth);
    const selectedDate = subMonths(new Date(), monthsBack);
    const previousDate = subMonths(selectedDate, 1);
    
    const selectedMonthStart = startOfMonth(selectedDate);
    const selectedMonthEnd = endOfMonth(selectedDate);
    const previousMonthStart = startOfMonth(previousDate);
    const previousMonthEnd = endOfMonth(previousDate);
    
    const currentMonthTransactions = transactions.filter(t => {
      const date = new Date(t.date);
      return date >= selectedMonthStart && date <= selectedMonthEnd;
    });
    
    const lastMonthTransactions = transactions.filter(t => {
      const date = new Date(t.date);
      return date >= previousMonthStart && date <= previousMonthEnd;
    });
    
    const totalIncome = currentMonthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpense = currentMonthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    const lastMonthIncome = lastMonthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const lastMonthExpense = lastMonthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    const balance = totalIncome - totalExpense;
    const lastMonthBalance = lastMonthIncome - lastMonthExpense;
    
    const incomeTrend = lastMonthIncome > 0 
      ? ((totalIncome - lastMonthIncome) / lastMonthIncome * 100).toFixed(1)
      : 0;
    
    const expenseTrend = lastMonthExpense > 0
      ? ((totalExpense - lastMonthExpense) / lastMonthExpense * 100).toFixed(1)
      : 0;
    
    const balanceTrend = lastMonthBalance !== 0
      ? ((balance - lastMonthBalance) / Math.abs(lastMonthBalance) * 100).toFixed(1)
      : 0;
    
    return {
      totalIncome,
      totalExpense,
      balance,
      incomeTrend: Math.abs(incomeTrend),
      expenseTrend: Math.abs(expenseTrend),
      balanceTrend: Math.abs(balanceTrend),
      incomeTrendDirection: incomeTrend >= 0 ? 'up' : 'down',
      expenseTrendDirection: expenseTrend >= 0 ? 'up' : 'down',
      balanceTrendDirection: balanceTrend >= 0 ? 'up' : 'down'
    };
  }, [transactions, selectedMonth]);

  if (isLoading) {
    return (
      <div className="p-6 md:p-8 space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      </div>
    );
  }

  const selectedMonthLabel = monthOptions.find(m => m.value === selectedMonth)?.label || '';

  return (
    <div className="p-6 md:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Visão Geral do Fluxo de Caixa
          </h1>
          <p className="text-slate-600">
            Acompanhe suas finanças em tempo real
          </p>
        </div>

        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Selecione o mês" />
          </SelectTrigger>
          <SelectContent>
            {monthOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Alert se não houver transações */}
      {transactions.length === 0 && (
        <Alert className="border-blue-200 bg-blue-50">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-900">
            Você ainda não tem transações registradas. Comece importando um extrato bancário ou adicionando transações manualmente!
          </AlertDescription>
        </Alert>
      )}

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Saldo do Mês"
          value={`R$ ${stats.balance.toFixed(2)}`}
          icon={Wallet}
          type={stats.balance >= 0 ? 'income' : 'expense'}
          trend={stats.balanceTrendDirection}
          trendValue={`${stats.balanceTrend}%`}
        />
        <StatCard
          title="Receitas do Mês"
          value={`R$ ${stats.totalIncome.toFixed(2)}`}
          icon={TrendingUp}
          type="income"
          trend={stats.incomeTrendDirection}
          trendValue={`${stats.incomeTrend}%`}
        />
        <StatCard
          title="Despesas do Mês"
          value={`R$ ${stats.totalExpense.toFixed(2)}`}
          icon={TrendingDown}
          type="expense"
          trend={stats.expenseTrendDirection}
          trendValue={`${stats.expenseTrend}%`}
        />
      </div>

      {/* Gráficos */}
      {transactions.length > 0 && (
        <>
          <CashFlowChart transactions={transactions} />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CategoryChart transactions={transactions} type="expense" />
            <CategoryChart transactions={transactions} type="income" />
          </div>
        </>
      )}
    </div>
  );
}