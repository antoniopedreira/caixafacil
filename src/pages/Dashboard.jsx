import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Calendar } from "lucide-react";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

import AccountBalance from "../components/dashboard/AccountBalance";
import MonthSummaryCards from "../components/dashboard/MonthSummaryCards";
import UpcomingExpenses from "../components/dashboard/UpcomingExpenses";
import RecentTransactions from "../components/dashboard/RecentTransactions";

export default function Dashboard() {
  const [selectedMonth, setSelectedMonth] = useState("0");
  const [selectedAccount, setSelectedAccount] = useState("all");
  const [showBalance, setShowBalance] = useState(true);

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

  // Extrai contas únicas das transações
  const accounts = React.useMemo(() => {
    const accountSet = new Set();
    transactions.forEach(t => {
      if (t.bank_account) {
        accountSet.add(t.bank_account);
      }
    });
    return Array.from(accountSet);
  }, [transactions]);

  // Filtra transações por conta e mês
  const filteredTransactions = React.useMemo(() => {
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

  // Calcula saldo total (todas as transações até hoje)
  const totalBalance = React.useMemo(() => {
    const filteredByAccount = selectedAccount === "all" 
      ? transactions 
      : transactions.filter(t => t.bank_account === selectedAccount);
    
    return filteredByAccount.reduce((sum, t) => {
      return sum + (t.type === 'income' ? t.amount : -Math.abs(t.amount));
    }, 0);
  }, [transactions, selectedAccount]);

  // Estatísticas do mês selecionado
  const monthStats = React.useMemo(() => {
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

  if (isLoading) {
    return (
      <div className="p-6 md:p-8 space-y-6">
        <Skeleton className="h-48 w-full" />
        <div className="grid grid-cols-3 gap-3">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Saldo total das contas */}
      <AccountBalance
        balance={totalBalance}
        selectedAccount={selectedAccount}
        onAccountChange={setSelectedAccount}
        accounts={accounts}
        showBalance={showBalance}
        onToggleBalance={() => setShowBalance(!showBalance)}
      />

      {/* Filtro de mês */}
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

      {/* Cards de resumo do mês */}
      <MonthSummaryCards
        income={monthStats.income}
        expense={monthStats.expense}
        balance={monthStats.balance}
      />

      {/* Alert se não houver transações */}
      {transactions.length === 0 && (
        <Alert className="border-blue-200 bg-blue-50">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-900">
            <strong>Comece agora!</strong> Importe um extrato bancário ou adicione transações manualmente para visualizar seus dados.
          </AlertDescription>
        </Alert>
      )}

      {/* Próximos lançamentos */}
      <UpcomingExpenses recurringExpenses={recurringExpenses} />

      {/* Últimas transações */}
      <RecentTransactions transactions={transactions} />
    </div>
  );
}