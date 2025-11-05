import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, Calendar, TrendingUp, BarChart3 } from "lucide-react";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

import AccountBalance from "../components/dashboard/AccountBalance";
import MonthSummaryCards from "../components/dashboard/MonthSummaryCards";
import UpcomingExpenses from "../components/dashboard/UpcomingExpenses";
import RecentTransactions from "../components/dashboard/RecentTransactions";
import ExpandedTransactionList from "../components/dashboard/ExpandedTransactionList";
import SpendingTrends from "../components/dashboard/SpendingTrends";
import TopCategories from "../components/dashboard/TopCategories";
import FinancialProjection from "../components/dashboard/FinancialProjection";

export default function Dashboard() {
  const [selectedMonth, setSelectedMonth] = useState("0");
  const [selectedAccount, setSelectedAccount] = useState("all");
  const [showBalance, setShowBalance] = useState(true);
  const [expandedCard, setExpandedCard] = useState(null);

  const { data: transactions, isLoading: loadingTransactions } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => base44.entities.Transaction.list('-date'),
    initialData: [],
  });

  const { data: recurringExpenses, isLoading: loadingRecurring } = useQuery({
    queryKey: ['recurring-expenses'],
    queryFn: () => base44.entities.RecurringExpense.list('-due_day'),
    initialData: [],
  });

  const isLoading = loadingTransactions || loadingRecurring;

  const monthOptions = useMemo(() => {
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

  const accounts = useMemo(() => {
    const accountSet = new Set();
    transactions.forEach(t => {
      if (t.bank_account) {
        accountSet.add(t.bank_account);
      }
    });
    return Array.from(accountSet);
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    const monthsBack = parseInt(selectedMonth);
    const selectedDate = subMonths(new Date(), monthsBack);
    const monthStart = startOfMonth(selectedDate);
    const monthEnd = endOfMonth(selectedDate);

    return transactions.filter(t => {
      const date = new Date(t.date);
      const dateMatch = date >= monthStart && date <= monthEnd;
      const accountMatch = selectedAccount === "all" || t.bank_account === selectedAccount;
      return dateMatch && accountMatch;
    });
  }, [transactions, selectedMonth, selectedAccount]);

  const totalBalance = useMemo(() => {
    const filteredByAccount = selectedAccount === "all" 
      ? transactions 
      : transactions.filter(t => t.bank_account === selectedAccount);
    
    return filteredByAccount.reduce((sum, t) => {
      return sum + (t.type === 'income' ? t.amount : -Math.abs(t.amount));
    }, 0);
  }, [transactions, selectedAccount]);

  const monthStats = useMemo(() => {
    const income = filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expense = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    return {
      income,
      expense,
      balance: income - expense
    };
  }, [filteredTransactions]);

  const handleToggleCard = (type) => {
    setExpandedCard(expandedCard === type ? null : type);
  };

  const incomeTransactions = useMemo(() => {
    return filteredTransactions.filter(t => t.type === 'income');
  }, [filteredTransactions]);

  const expenseTransactions = useMemo(() => {
    return filteredTransactions.filter(t => t.type === 'expense');
  }, [filteredTransactions]);

  if (isLoading) {
    return (
      <div className="p-6 md:p-8 space-y-6">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6">
      <AccountBalance
        balance={totalBalance}
        selectedAccount={selectedAccount}
        onAccountChange={setSelectedAccount}
        accounts={accounts}
        showBalance={showBalance}
        onToggleBalance={() => setShowBalance(!showBalance)}
      />

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:inline-grid">
          <TabsTrigger value="overview" className="gap-2">
            <Calendar className="w-4 h-4" />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="analysis" className="gap-2">
            <BarChart3 className="w-4 h-4" />
            Análise Avançada
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Resumo do Mês
            </h2>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-64">
                <SelectValue />
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

          <MonthSummaryCards
            income={monthStats.income}
            expense={monthStats.expense}
            balance={monthStats.balance}
            onClickIncome={() => handleToggleCard('income')}
            onClickExpense={() => handleToggleCard('expense')}
            expandedCard={expandedCard}
          >
            {{
              income: incomeTransactions.length > 0 && (
                <ExpandedTransactionList
                  transactions={incomeTransactions}
                  type="income"
                  onClose={() => setExpandedCard(null)}
                />
              ),
              expense: expenseTransactions.length > 0 && (
                <ExpandedTransactionList
                  transactions={expenseTransactions}
                  type="expense"
                  onClose={() => setExpandedCard(null)}
                />
              )
            }}
          </MonthSummaryCards>

          {transactions.length === 0 && (
            <Alert className="border-blue-200 bg-blue-50">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-900">
                <strong>Comece agora!</strong> Importe um extrato bancário ou adicione transações manualmente para visualizar seus dados.
              </AlertDescription>
            </Alert>
          )}

          <UpcomingExpenses recurringExpenses={recurringExpenses} />

          <RecentTransactions transactions={transactions} />
        </TabsContent>

        <TabsContent value="analysis" className="space-y-6">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-slate-900">Análise Avançada</h2>
          </div>
          
          {transactions.length === 0 ? (
            <Alert className="border-orange-200 bg-orange-50">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-900">
                <strong>Adicione transações</strong> para visualizar análises e projeções financeiras avançadas.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              {/* Tendências de gastos */}
              <SpendingTrends transactions={transactions} />

              {/* Top categorias */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <TopCategories transactions={filteredTransactions} type="expense" />
                <TopCategories transactions={filteredTransactions} type="income" />
              </div>

              {/* Projeção financeira */}
              <FinancialProjection
                currentBalance={totalBalance}
                transactions={transactions}
                recurringExpenses={recurringExpenses}
              />
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}