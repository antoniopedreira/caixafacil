import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, Calendar, TrendingUp, BarChart3 } from "lucide-react";
import { format, subMonths, startOfMonth, endOfMonth, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

import AccountBalance from "../components/dashboard/AccountBalance";
import MonthSummaryCards from "../components/dashboard/MonthSummaryCards";
import UpcomingExpenses from "../components/dashboard/UpcomingExpenses";
import RecentTransactions from "../components/dashboard/RecentTransactions";
import ExpandedTransactionList from "../components/dashboard/ExpandedTransactionList";
import SpendingTrends from "../components/dashboard/SpendingTrends";
import TopCategories from "../components/dashboard/TopCategories";
import FinancialProjection from "../components/dashboard/FinancialProjection";
import MonthlyAnalysisTable from "../components/dashboard/MonthlyAnalysisTable";
import CashBalanceEvolution from "../components/dashboard/CashBalanceEvolution";

export default function Dashboard() {
  const [selectedMonth, setSelectedMonth] = useState("0");
  const [selectedAccount, setSelectedAccount] = useState("all");
  const [showBalance, setShowBalance] = useState(true);
  const [expandedCard, setExpandedCard] = useState(null);
  const [customPeriod, setCustomPeriod] = useState(null);
  const [tempCustomPeriod, setTempCustomPeriod] = useState({
    startDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd')
  });
  const [customDialogOpen, setCustomDialogOpen] = useState(false);

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
        shortLabel: format(date, "MMMM", { locale: ptBR }),
        date: date
      });
    }
    options.push({
      value: 'custom',
      label: 'Personalizar período...',
      shortLabel: 'Personalizado',
      date: null
    });
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

  const { filteredTransactions, periodStart, periodEnd } = useMemo(() => {
    let start, end;

    if (customPeriod) {
      start = startOfDay(new Date(customPeriod.startDate));
      end = endOfDay(new Date(customPeriod.endDate));
    } else {
      const monthsBack = parseInt(selectedMonth);
      const selectedDate = subMonths(new Date(), monthsBack);
      start = startOfMonth(selectedDate);
      end = endOfMonth(selectedDate);
    }

    const filtered = transactions.filter(t => {
      const date = new Date(t.date);
      const dateMatch = date >= start && date <= end;
      const accountMatch = selectedAccount === "all" || t.bank_account === selectedAccount;
      return dateMatch && accountMatch;
    });

    return {
      filteredTransactions: filtered,
      periodStart: start,
      periodEnd: end
    };
  }, [transactions, selectedMonth, selectedAccount, customPeriod]);

  const totalBalance = useMemo(() => {
    const filteredByAccount = selectedAccount === "all" 
      ? transactions 
      : transactions.filter(t => t.bank_account === selectedAccount);
    
    return filteredByAccount.reduce((sum, t) => {
      return sum + (t.type === 'income' ? t.amount : -Math.abs(t.amount));
    }, 0);
  }, [transactions, selectedAccount]);

  const { initialBalance, finalBalance, periodLabel } = useMemo(() => {
    const filteredByAccount = selectedAccount === "all" 
      ? transactions 
      : transactions.filter(t => t.bank_account === selectedAccount);
    
    const initial = filteredByAccount
      .filter(t => new Date(t.date) < periodStart)
      .reduce((sum, t) => {
        return sum + (t.type === 'income' ? t.amount : -Math.abs(t.amount));
      }, 0);
    
    const final = filteredByAccount
      .filter(t => new Date(t.date) <= periodEnd)
      .reduce((sum, t) => {
        return sum + (t.type === 'income' ? t.amount : -Math.abs(t.amount));
      }, 0);
    
    let label;
    if (customPeriod) {
      const startFormatted = format(periodStart, "MMM/yy", { locale: ptBR });
      const endFormatted = format(periodEnd, "MMM/yy", { locale: ptBR });
      label = startFormatted === endFormatted ? startFormatted : `${startFormatted} a ${endFormatted}`;
    } else {
      label = format(periodStart, "MMM/yy", { locale: ptBR });
    }
    
    return {
      initialBalance: initial,
      finalBalance: final,
      periodLabel: label
    };
  }, [transactions, selectedAccount, periodStart, periodEnd, customPeriod]);

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

  const handleMonthChange = (value) => {
    if (value === 'custom') {
      setCustomDialogOpen(true);
    } else {
      setCustomPeriod(null);
      setSelectedMonth(value);
    }
  };

  const handleApplyCustomPeriod = () => {
    setCustomPeriod(tempCustomPeriod);
    setSelectedMonth('custom');
    setCustomDialogOpen(false);
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
    <div className="p-3 md:p-4 space-y-3">
      <AccountBalance
        balance={totalBalance}
        selectedAccount={selectedAccount}
        onAccountChange={setSelectedAccount}
        accounts={accounts}
        showBalance={showBalance}
        onToggleBalance={() => setShowBalance(!showBalance)}
        transactions={transactions}
      />

      <Tabs defaultValue="overview" className="space-y-3">
        <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:inline-grid h-9">
          <TabsTrigger value="overview" className="gap-2 text-sm">
            <Calendar className="w-4 h-4" />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="analysis" className="gap-2 text-sm">
            <BarChart3 className="w-4 h-4" />
            Análise Avançada
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-3 mt-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Resumo do Período
            </h2>
            <Select value={selectedMonth} onValueChange={handleMonthChange}>
              <SelectTrigger className="w-56 h-9 text-sm">
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
            initialBalance={initialBalance}
            finalBalance={finalBalance}
            periodLabel={periodLabel}
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

          {transactions.length > 0 && (
            <CashBalanceEvolution transactions={transactions} />
          )}

          <UpcomingExpenses recurringExpenses={recurringExpenses} />

          <RecentTransactions transactions={transactions} />
        </TabsContent>

        <TabsContent value="analysis" className="space-y-3 mt-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-900">Análise Avançada</h2>
          </div>
          
          {transactions.length === 0 ? (
            <Alert className="border-orange-200 bg-orange-50">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-900">
                <strong>Adicione transações</strong> para visualizar análises e projeções financeiras avançadas.
              </AlertDescription>
            </Alert>
          ) : (
            <MonthlyAnalysisTable transactions={transactions} />
          )}
        </TabsContent>
      </Tabs>

      {/* Dialog para período personalizado */}
      <Dialog open={customDialogOpen} onOpenChange={setCustomDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Período Personalizado</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Data Inicial</label>
              <Input
                type="date"
                value={tempCustomPeriod.startDate}
                onChange={(e) => setTempCustomPeriod({ ...tempCustomPeriod, startDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Data Final</label>
              <Input
                type="date"
                value={tempCustomPeriod.endDate}
                onChange={(e) => setTempCustomPeriod({ ...tempCustomPeriod, endDate: e.target.value })}
              />
            </div>
            <Button onClick={handleApplyCustomPeriod} className="w-full">
              Aplicar Período
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}