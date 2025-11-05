import React, { useState, useMemo } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronUp } from "lucide-react";
import { format } from 'date-fns';
import { motion, AnimatePresence } from "framer-motion";

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

export default function ExpandedTransactionList({ transactions, type, onClose }) {
  const [viewMode, setViewMode] = useState("categoria"); // categoria, data, valor

  // Agrupa por categoria (visão consolidada)
  const groupedByCategory = useMemo(() => {
    const groups = {};
    
    transactions.forEach(t => {
      if (!groups[t.category]) {
        groups[t.category] = {
          category: t.category,
          categoryName: CATEGORY_NAMES[t.category],
          total: 0,
          transactions: []
        };
      }
      groups[t.category].total += Math.abs(t.amount);
      groups[t.category].transactions.push(t);
    });

    // Ordena por valor decrescente
    return Object.values(groups).sort((a, b) => b.total - a.total);
  }, [transactions]);

  // Ordena por data (mais recente primeiro)
  const sortedByDate = useMemo(() => {
    return [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [transactions]);

  // Ordena por valor decrescente
  const sortedByValue = useMemo(() => {
    return [...transactions].sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));
  }, [transactions]);

  const total = transactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        exit={{ opacity: 0, height: 0 }}
        transition={{ duration: 0.3 }}
        className="col-span-full overflow-hidden"
      >
        <Card className="border-0 shadow-lg mt-4">
          <div className="p-4 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">
                {type === 'income' ? '💰 Entradas do Mês' : '💸 Saídas do Mês'}
              </h3>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ChevronUp className="w-5 h-5 text-slate-600" />
              </button>
            </div>

            {/* Botões de filtro */}
            <div className="flex gap-3">
              <Button
                onClick={() => setViewMode("categoria")}
                variant={viewMode === "categoria" ? "default" : "outline"}
                className={viewMode === "categoria" ? "bg-blue-500 hover:bg-blue-600" : ""}
              >
                Categoria
              </Button>
              <Button
                onClick={() => setViewMode("data")}
                variant={viewMode === "data" ? "default" : "outline"}
                className={viewMode === "data" ? "bg-blue-500 hover:bg-blue-600" : ""}
              >
                Data
              </Button>
              <Button
                onClick={() => setViewMode("valor")}
                variant={viewMode === "valor" ? "default" : "outline"}
                className={viewMode === "valor" ? "bg-blue-500 hover:bg-blue-600" : ""}
              >
                Valor
              </Button>
            </div>

            {/* Total */}
            <div className={`p-3 rounded-lg ${
              type === 'income' ? 'bg-emerald-50 border border-emerald-200' : 'bg-rose-50 border border-rose-200'
            }`}>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-slate-700">
                  Total de {transactions.length} transação(ões)
                </span>
                <span className={`text-lg font-bold ${
                  type === 'income' ? 'text-emerald-600' : 'text-rose-600'
                }`}>
                  R$ {total.toFixed(2).replace('.', ',')}
                </span>
              </div>
            </div>

            {/* Lista - Visão por Categoria (Consolidada) */}
            {viewMode === "categoria" && (
              <div className="max-h-96 overflow-y-auto space-y-2">
                {groupedByCategory.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    Nenhuma transação encontrada
                  </div>
                ) : (
                  groupedByCategory.map((group) => (
                    <div
                      key={group.category}
                      className="p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-semibold text-slate-900">{group.categoryName}</p>
                          <p className="text-xs text-slate-500">
                            {group.transactions.length} {group.transactions.length === 1 ? 'transação' : 'transações'}
                          </p>
                        </div>
                        <p className={`text-lg font-bold ${
                          type === 'income' ? 'text-emerald-600' : 'text-rose-600'
                        }`}>
                          R$ {group.total.toFixed(2).replace('.', ',')}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Lista - Visão por Data */}
            {viewMode === "data" && (
              <div className="max-h-96 overflow-y-auto space-y-2">
                {sortedByDate.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    Nenhuma transação encontrada
                  </div>
                ) : (
                  sortedByDate.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div className="min-w-[80px]">
                            <p className="text-sm font-medium text-slate-900">
                              {format(new Date(transaction.date), "dd/MM/yyyy")}
                            </p>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-slate-900">
                              {transaction.description}
                            </p>
                            <Badge variant="outline" className="text-xs mt-1">
                              {CATEGORY_NAMES[transaction.category]}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <p className={`text-base font-bold ${
                          type === 'income' ? 'text-emerald-600' : 'text-rose-600'
                        }`}>
                          R$ {Math.abs(transaction.amount).toFixed(2).replace('.', ',')}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Lista - Visão por Valor */}
            {viewMode === "valor" && (
              <div className="max-h-96 overflow-y-auto space-y-2">
                {sortedByValue.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    Nenhuma transação encontrada
                  </div>
                ) : (
                  sortedByValue.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div className="min-w-[80px]">
                            <p className="text-sm font-medium text-slate-900">
                              {format(new Date(transaction.date), "dd/MM/yyyy")}
                            </p>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-slate-900">
                              {transaction.description}
                            </p>
                            <Badge variant="outline" className="text-xs mt-1">
                              {CATEGORY_NAMES[transaction.category]}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <p className={`text-base font-bold ${
                          type === 'income' ? 'text-emerald-600' : 'text-rose-600'
                        }`}>
                          R$ {Math.abs(transaction.amount).toFixed(2).replace('.', ',')}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}