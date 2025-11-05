
import React, { useState, useMemo } from 'react';
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronRight, Info } from "lucide-react";
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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

// Função para abreviar e formatar descrição
const formatDescription = (description, maxWords = 4) => {
  if (!description) return '';
  
  // Converte para Title Case (primeira letra maiúscula)
  const toTitleCase = (str) => {
    return str.toLowerCase().split(' ').map(word => {
      // Mantém palavras pequenas em minúscula (de, da, do, e, a, o)
      if (['de', 'da', 'do', 'e', 'a', 'o', 'das', 'dos'].includes(word.toLowerCase())) {
        return word.toLowerCase();
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    }).join(' ');
  };
  
  // Remove frases como "recebido de", "enviado para", etc
  let cleaned = description
    .replace(/recebido\s+de\s+/gi, '')
    .replace(/enviado\s+para\s+/gi, '')
    .replace(/recebido\s+/gi, '')
    .replace(/enviado\s+/gi, '')
    .trim();
  
  // Divide em palavras e pega apenas as primeiras
  const words = cleaned.split(' ').filter(w => w.length > 0);
  const abbreviated = words.slice(0, maxWords).join(' ');
  
  // Aplica Title Case
  return toTitleCase(abbreviated);
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
  const [selectedTransaction, setSelectedTransaction] = useState(null);

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
    <>
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
                      .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount))
                      .map((transaction) => (
                        <div
                          key={transaction.id}
                          className="flex items-center justify-between p-2 bg-white rounded-lg text-sm hover:bg-slate-50 cursor-pointer transition-colors group"
                          onClick={() => setSelectedTransaction(transaction)}
                        >
                          <div className="flex-1 flex items-center gap-3">
                            <span className="text-xs text-slate-500 min-w-[70px]">
                              {format(new Date(transaction.date), "dd/MM/yyyy")}
                            </span>
                            <span className="text-slate-900 flex-1">
                              {formatDescription(transaction.description)}
                            </span>
                            <Info className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
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

      {/* Modal de detalhes da transação */}
      <Dialog open={!!selectedTransaction} onOpenChange={() => setSelectedTransaction(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Detalhes da Transação</DialogTitle>
          </DialogHeader>
          {selectedTransaction && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-slate-600 mb-1">Descrição Completa</p>
                <p className="font-medium text-slate-900">{selectedTransaction.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Data</p>
                  <p className="font-medium text-slate-900">
                    {format(new Date(selectedTransaction.date), "dd/MM/yyyy")}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 mb-1">Valor</p>
                  <p className={`font-bold ${
                    selectedTransaction.type === 'income' ? 'text-emerald-600' : 'text-rose-600'
                  }`}>
                    R$ {formatCurrency(Math.abs(selectedTransaction.amount))}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm text-slate-600 mb-1">Categoria</p>
                <Badge variant="outline">
                  {CATEGORY_NAMES[selectedTransaction.category] || selectedTransaction.category}
                </Badge>
              </div>

              {selectedTransaction.payment_method && (
                <div>
                  <p className="text-sm text-slate-600 mb-1">Forma de Pagamento</p>
                  <p className="font-medium text-slate-900 capitalize">
                    {selectedTransaction.payment_method.replace(/_/g, ' ')}
                  </p>
                </div>
              )}

              {selectedTransaction.bank_account && (
                <div>
                  <p className="text-sm text-slate-600 mb-1">Conta Bancária</p>
                  <p className="font-medium text-slate-900">{selectedTransaction.bank_account}</p>
                </div>
              )}

              {selectedTransaction.notes && (
                <div>
                  <p className="text-sm text-slate-600 mb-1">Observações</p>
                  <p className="text-sm text-slate-700">{selectedTransaction.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
