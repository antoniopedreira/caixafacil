import React from 'react';
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, EyeOff } from "lucide-react";

export default function AccountBalance({ balance, selectedAccount, onAccountChange, accounts, showBalance, onToggleBalance }) {
  return (
    <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 border-0 shadow-xl text-white">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-emerald-100 text-sm font-medium">Saldo total</span>
          <button
            onClick={onToggleBalance}
            className="p-2 hover:bg-emerald-400/30 rounded-lg transition-colors"
          >
            {showBalance ? (
              <Eye className="w-5 h-5" />
            ) : (
              <EyeOff className="w-5 h-5" />
            )}
          </button>
        </div>

        <div className="mb-4">
          {showBalance ? (
            <h2 className="text-4xl font-bold">
              R$ {balance.toFixed(2)}
            </h2>
          ) : (
            <h2 className="text-4xl font-bold">R$ ••••••</h2>
          )}
          <p className="text-emerald-100 text-sm mt-1">
            Atualizado há 5 minutos
          </p>
        </div>

        <Select value={selectedAccount} onValueChange={onAccountChange}>
          <SelectTrigger className="bg-emerald-400/30 border-0 text-white hover:bg-emerald-400/40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as contas</SelectItem>
            {accounts.map((account) => (
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