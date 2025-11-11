import React, { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronRight } from 'lucide-react';
import TransactionDetailModal from './TransactionDetailModal';

const CATEGORY_NAMES = {
  // Receitas
  vendas: 'Vendas',
  servicos: 'Serviços',
  investimentos: 'Investimentos',
  emprestimos_recebidos: 'Empréstimos Recebidos',
  outras_receitas: 'Outras Receitas',
  // Despesas
  salarios_funcionarios: 'Salários',
  fornecedores: 'Fornecedores',
  aluguel: 'Aluguel',
  contas_servicos: 'Contas/Serviços',
  impostos_taxas: 'Impostos/Taxas',
  marketing_publicidade: 'Marketing',
  equipamentos_materiais: 'Equipamentos',
  manutencao: 'Manutenção',
  combustivel_transporte: 'Combustível',
  emprestimos_pagos: 'Empréstimos Pagos',
  outras_despesas: 'Outras Despesas',
};

function formatDescription(text) {
  if (!text) return '';
  const cleaned = text.trim();
  if (cleaned.length <= 40) return cleaned;
  return cleaned.slice(0, 40) + '...';
}

const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

export default function ExpandedTransactionList({ transactions, type, onClose, allTransactions }) {
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  // Agrupa transações por categoria
  const groupedTransactions = useMemo(() => {
    const groups = {};
    
    transactions.forEach(transaction => {
      const category = transaction.category || 'outros';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(transaction);
    });

    // Ordena por total de cada categoria (maior primeiro)
    const sortedGroups = Object.entries(groups)
      .map(([category, items]) => {
        const total = items.reduce((sum, t) => sum + Math.abs(t.amount), 0);
        return { category, items, total };
      })
      .sort((a, b) => b.total - a.total);

    return sortedGroups;
  }, [transactions]);

  const handleTransactionClick = (transaction) => {
    setSelectedTransaction(transaction);
  };

  return (
    <>
      <div className="mt-4 bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="max-h-96 overflow-y-auto">
          <div className="divide-y divide-slate-200">
            {groupedTransactions.map(({ category, items, total }) => (
              <div key={category}>
                {/* Header da categoria */}
                <button
                  onClick={() => setExpandedCategory(expandedCategory === category ? null : category)}
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {expandedCategory === category ? (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    )}
                    <span className="font-semibold text-slate-900 text-sm">
                      {CATEGORY_NAMES[category] || category}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {items.length} {items.length === 1 ? 'transação' : 'transações'}
                    </Badge>
                  </div>
                  <span className={`font-bold text-sm ${
                    type === 'income' ? 'text-emerald-600' : 'text-rose-600'
                  }`}>
                    R$ {formatCurrency(total)}
                  </span>
                </button>

                {/* Lista de transações da categoria */}
                {expandedCategory === category && (
                  <div className="bg-slate-50 divide-y divide-slate-200">
                    {items.map((transaction, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleTransactionClick(transaction)}
                        className="w-full px-4 py-2.5 flex items-center justify-between hover:bg-slate-100 transition-colors text-left"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-slate-900 truncate">
                            {formatDescription(transaction.description)}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {format(new Date(transaction.date), "dd/MM/yyyy", { locale: ptBR })}
                          </p>
                        </div>
                        <span className={`font-semibold text-sm ml-4 whitespace-nowrap ${
                          type === 'income' ? 'text-emerald-600' : 'text-rose-600'
                        }`}>
                          R$ {formatCurrency(Math.abs(transaction.amount))}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal de detalhes */}
      <TransactionDetailModal
        transaction={selectedTransaction}
        allTransactions={allTransactions || transactions}
        open={!!selectedTransaction}
        onClose={() => setSelectedTransaction(null)}
      />
    </>
  );
}