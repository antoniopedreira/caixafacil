import React, { useMemo } from 'react';
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, EyeOff, TrendingUp, TrendingDown } from "lucide-react";
import { subMonths, startOfMonth, isBefore } from 'date-fns';

// Função para formatar valor com ponto para milhares e vírgula para decimal
const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

export default function AccountBalance({ balance, selectedAccount, onAccountChange, accounts, showBalance, onToggleBalance, transactions = [] }) {
  // Calcula o saldo do mesmo dia do mês anterior
  const previousMonthComparison = useMemo(() => {
    const now = new Date();
    const currentDay = now.getDate();
    
    // Data do mesmo dia do mês anterior
    const previousMonth = subMonths(now, 1);
    const previousMonthSameDay = new Date(previousMonth.getFullYear(), previousMonth.getMonth(), currentDay);
    
    // Filtra transações até o mesmo dia do mês anterior
    const filteredByAccount = selectedAccount === "all" 
      ? transactions 
      : transactions.filter(t => t.bank_account === selectedAccount);
    
    const previousBalance = filteredByAccount
      .filter(t => {
        const transactionDate = new Date(t.date);
        return isBefore(transactionDate, previousMonthSameDay) || transactionDate.getTime() === previousMonthSameDay.getTime();
      })
      .reduce((sum, t) => {
        return sum + (t.type === 'income' ? t.amount : -Math.abs(t.amount));
      }, 0);
    
    // Calcula a variação percentual
    const variation = previousBalance !== 0 
      ? ((balance - previousBalance) / Math.abs(previousBalance)) * 100 
      : (balance > 0 ? 100 : 0);
    
    return {
      previousBalance,
      variation,
      isPositive: variation >= 0
    };
  }, [transactions, selectedAccount, balance]);

  // Define o label baseado na seleção
  const getAccountLabel = () => {
    if (selectedAccount === "all") {
      // Se tem apenas um banco, mostra o nome dele
      if (accounts.length === 1) {
        return accounts[0];
      }
      return "Todas as contas";
    }
    return selectedAccount;
  };

  return (
    <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 border-0 shadow-xl text-white">
      <div className="p-4">
        <div className="flex items-center justify-between mb-1">
          <div>
            <span className="text-emerald-100 text-sm font-medium">Saldo bancário</span>
            <p className="text-emerald-100 text-xs mt-0.5">
              Atualizado há 5 minutos
            </p>
          </div>
          <button
            onClick={onToggleBalance}
            className="p-1.5 hover:bg-emerald-400/30 rounded-lg transition-colors"
          >
            {showBalance ? (
              <Eye className="w-4 h-4" />
            ) : (
              <EyeOff className="w-4 h-4" />
            )}
          </button>
        </div>

        <div className="mb-2">
          {showBalance ? (
            <>
              <h2 className="text-3xl font-bold">
                R$ {formatCurrency(balance)}
              </h2>
              
              {/* Análise comparativa */}
              <div className="flex items-center gap-2 mt-2">
                <div className={`flex items-center gap-1 px-2 py-1 rounded-md ${
                  previousMonthComparison.isPositive 
                    ? 'bg-emerald-400/30' 
                    : 'bg-rose-400/30'
                }`}>
                  {previousMonthComparison.isPositive ? (
                    <TrendingUp className="w-3.5 h-3.5" />
                  ) : (
                    <TrendingDown className="w-3.5 h-3.5" />
                  )}
                  <span className="text-xs font-semibold">
                    {Math.abs(previousMonthComparison.variation).toFixed(1)}%
                  </span>
                </div>
                <span className="text-emerald-100 text-xs">
                  vs mês anterior (R$ {formatCurrency(previousMonthComparison.previousBalance)})
                </span>
              </div>
            </>
          ) : (
            <h2 className="text-3xl font-bold">R$ ••••••</h2>
          )}
        </div>

        <Select value={selectedAccount} onValueChange={onAccountChange}>
          <SelectTrigger className="bg-emerald-400/30 border-0 text-white hover:bg-emerald-400/40 h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{accounts.length === 1 ? accounts[0] : "Todas as contas"}</SelectItem>
            {accounts.length > 1 && accounts.map((account) => (
              <SelectItem key={account} value={account}>
                {account}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </Card>
  );
}