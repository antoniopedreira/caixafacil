import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Filter, ChevronUp } from "lucide-react";
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
  const [filterCategory, setFilterCategory] = useState("all");
  const [sortBy, setSortBy] = useState("date-desc");

  const filteredAndSorted = React.useMemo(() => {
    let filtered = [...transactions];

    if (filterCategory !== "all") {
      filtered = filtered.filter(t => t.category === filterCategory);
    }

    filtered.sort((a, b) => {
      if (sortBy === "date-desc") {
        return new Date(b.date) - new Date(a.date);
      } else if (sortBy === "date-asc") {
        return new Date(a.date) - new Date(b.date);
      } else if (sortBy === "amount-desc") {
        return Math.abs(b.amount) - Math.abs(a.amount);
      } else if (sortBy === "amount-asc") {
        return Math.abs(a.amount) - Math.abs(b.amount);
      }
      return 0;
    });

    return filtered;
  }, [transactions, filterCategory, sortBy]);

  const categories = React.useMemo(() => {
    const categorySet = new Set(transactions.map(t => t.category));
    return Array.from(categorySet);
  }, [transactions]);

  const total = filteredAndSorted.reduce((sum, t) => sum + Math.abs(t.amount), 0);

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

            {/* Filtros */}
            <div className="flex flex-col md:flex-row gap-3 pb-4 border-b">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-600" />
                <span className="text-sm font-medium text-slate-700">Filtrar:</span>
              </div>
              
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="md:w-64">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as categorias</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>
                      {CATEGORY_NAMES[cat]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="md:w-52">
                  <SelectValue placeholder="Ordenar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date-desc">Data (mais recente)</SelectItem>
                  <SelectItem value="date-asc">Data (mais antiga)</SelectItem>
                  <SelectItem value="amount-desc">Valor (maior)</SelectItem>
                  <SelectItem value="amount-asc">Valor (menor)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Total */}
            <div className={`p-3 rounded-lg ${
              type === 'income' ? 'bg-emerald-50 border border-emerald-200' : 'bg-rose-50 border border-rose-200'
            }`}>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-slate-700">
                  Total de {filteredAndSorted.length} transação(ões)
                </span>
                <span className={`text-lg font-bold ${
                  type === 'income' ? 'text-emerald-600' : 'text-rose-600'
                }`}>
                  R$ {total.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Lista de transações */}
            <div className="max-h-96 overflow-y-auto space-y-2">
              {filteredAndSorted.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  Nenhuma transação encontrada
                </div>
              ) : (
                filteredAndSorted.map((transaction) => (
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
                        R$ {Math.abs(transaction.amount).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}