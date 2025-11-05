import React, { useState, useMemo } from 'react';
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronRight } from "lucide-react";
import { format } from 'date-fns';

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

// Função para formatar valores com ponto para milhares
const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

export default function ExpandedTransactionList({ transactions, type }) {
  const [expandedCategory, setExpandedCategory] = useState(null);

  const groupedByCategory = useMemo(() => {
    const groups = {};
    
    transactions.forEach(t => {
      if (!groups[t.category]) {
        groups[t.category] = {
          category: t.category,
          categoryName: CATEGORY_NAMES[t.category] || t.category,
          total: 0,
          transactions: []
        };
      }
      groups[t.category].total += Math.abs(t.amount);
      groups[t.category].transactions.push(t);
    });

    return Object.values(groups).sort((a, b) => b.total - a.total);
  }, [transactions]);

  const toggleCategory = (category) => {
    setExpandedCategory(expandedCategory === category ? null : category);
  };

  return (
    <div className={`ml-4 mt-2 rounded-lg ${
      type === 'income' ? 'bg-emerald-50/50' : 'bg-rose-50/50'
    }`}>
      <div className="p-3 space-y-1">
        {groupedByCategory.length === 0 ? (
          <div className="text-center py-4 text-slate-500 text-sm">
            Nenhuma transação encontrada
          </div>
        ) : (
          groupedByCategory.map((group) => (
            <div key={group.category}>
              {/* Linha da categoria */}
              <div
                className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all ${
                  expandedCategory === group.category
                    ? type === 'income' 
                      ? 'bg-emerald-100 hover:bg-emerald-100' 
                      : 'bg-rose-100 hover:bg-rose-100'
                    : 'hover:bg-white'
                }`}
                onClick={() => toggleCategory(group.category)}
              >
                <div className="flex items-center gap-2">
                  {expandedCategory === group.category ? (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  )}
                  <span className="font-medium text-slate-900 text-sm">
                    {group.categoryName}
                  </span>
                </div>
                <span className={`font-bold text-sm ${
                  type === 'income' ? 'text-emerald-600' : 'text-rose-600'
                }`}>
                  R$ {formatCurrency(group.total)}
                </span>
              </div>

              {/* Lista de transações da categoria */}
              {expandedCategory === group.category && (
                <div className="ml-6 mt-1 space-y-1">
                  {group.transactions
                    .sort((a, b) => new Date(b.date) - new Date(a.date))
                    .map((transaction) => (
                      <div
                        key={transaction.id}
                        className="flex items-center justify-between p-2 bg-white rounded-lg text-sm"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-slate-500 min-w-[70px]">
                              {format(new Date(transaction.date), "dd/MM/yyyy")}
                            </span>
                            <span className="text-slate-900">
                              {transaction.description}
                            </span>
                          </div>
                        </div>
                        <span className={`font-semibold text-sm ml-4 ${
                          type === 'income' ? 'text-emerald-600' : 'text-rose-600'
                        }`}>
                          R$ {formatCurrency(Math.abs(transaction.amount))}
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}