import React from 'react';
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, EyeOff } from "lucide-react";

// Função para formatar valor com ponto para milhares e vírgula para decimal
const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

export default function AccountBalance({ balance, selectedAccount, onAccountChange, accounts, showBalance, onToggleBalance }) {
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
        <div className="flex items-center justify-between mb-2">
          <span className="text-emerald-100 text-sm font-medium">Saldo bancário</span>
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

        <div className="mb-3">
          {showBalance ? (
            <h2 className="text-3xl font-bold">
              R$ {formatCurrency(balance)}
            </h2>
          ) : (
            <h2 className="text-3xl font-bold">R$ ••••••</h2>
          )}
          <p className="text-emerald-100 text-xs mt-1">
            Atualizado há 5 minutos
          </p>
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