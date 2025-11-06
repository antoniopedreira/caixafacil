
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Calendar, 
  AlertCircle,
  Bell,
  CheckCircle2,
  TrendingDown,
  Repeat
} from "lucide-react";
import { format, setDate, addMonths, isSameMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import RecurringExpenseCard from "../components/recurring/RecurringExpenseCard";
import RecurringExpenseForm from "../components/recurring/RecurringExpenseForm";

export default function RecurringExpenses() {
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);

  const { data: recurringExpenses, isLoading } = useQuery({
    queryKey: ['recurring-expenses'],
    queryFn: () => base44.entities.RecurringExpense.list('-due_day'),
    initialData: [],
  });

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.RecurringExpense.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-expenses'] });
      setFormOpen(false);
      setEditingExpense(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.RecurringExpense.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-expenses'] });
      setFormOpen(false);
      setEditingExpense(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.RecurringExpense.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-expenses'] });
    },
  });

  const handleSubmit = async (data) => {
    if (editingExpense) {
      await updateMutation.mutateAsync({ id: editingExpense.id, data });
    } else {
      await createMutation.mutateAsync(data);
    }
  };

  const handleEdit = (expense) => {
    setEditingExpense(expense);
    setFormOpen(true);
  };

  const handleMarkAsPaid = async (expenseId) => {
    const expense = recurringExpenses.find(e => e.id === expenseId);
    if (!expense) return;

    // Atualiza a data do último pagamento
    await updateMutation.mutateAsync({
      id: expenseId,
      data: {
        ...expense,
        last_paid_date: format(new Date(), 'yyyy-MM-dd')
      }
    });

    // Cria uma transação para registrar o pagamento
    await base44.entities.Transaction.create({
      date: format(new Date(), 'yyyy-MM-dd'),
      description: expense.name,
      amount: -Math.abs(expense.amount),
      type: 'expense',
      category: expense.category,
      payment_method: expense.payment_method || 'transferencia',
      notes: 'Pagamento de despesa recorrente',
      recurring: true
    });

    queryClient.invalidateQueries({ queryKey: ['transactions'] });
  };

  // Calcula estatísticas
  const stats = React.useMemo(() => {
    const activeExpenses = recurringExpenses.filter(e => e.status === 'active');
    const totalMonthly = activeExpenses.reduce((sum, e) => sum + e.amount, 0);
    
    const now = new Date();
    const upcomingCount = activeExpenses.filter(e => {
      const dueDate = setDate(now, e.due_day);
      const daysDiff = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));
      return daysDiff >= 0 && daysDiff <= e.reminder_days_before;
    }).length;

    const overdueCount = activeExpenses.filter(e => {
      if (e.last_paid_date) {
        const lastPaid = new Date(e.last_paid_date);
        if (isSameMonth(lastPaid, now)) return false;
      }
      const dueDate = setDate(now, e.due_day);
      return dueDate < now;
    }).length;

    return {
      total: activeExpenses.length,
      totalMonthly,
      upcoming: upcomingCount,
      overdue: overdueCount
    };
  }, [recurringExpenses]);

  // Função para formatar valor com ponto para milhares e vírgula para decimal
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Despesas Recorrentes
          </h1>
          <p className="text-slate-600">
            Gerencie suas contas fixas mensais e receba lembretes automáticos
          </p>
        </div>
        
        <Button
          onClick={() => {
            setEditingExpense(null);
            setFormOpen(true);
          }}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Despesa Recorrente
        </Button>
      </div>

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-md">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                <Repeat className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Total de Despesas</p>
                <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                <TrendingDown className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Gasto Mensal</p>
                <p className="text-2xl font-bold text-slate-900">
                  R$ {formatCurrency(stats.totalMonthly)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center">
                <Bell className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Vencendo em Breve</p>
                <p className="text-2xl font-bold text-slate-900">{stats.upcoming}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-rose-100 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Vencidas</p>
                <p className="text-2xl font-bold text-slate-900">{stats.overdue}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alertas */}
      {stats.overdue > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Atenção!</strong> Você tem {stats.overdue} despesa(s) vencida(s) este mês. 
            Marque como pago após efetuar o pagamento.
          </AlertDescription>
        </Alert>
      )}

      {stats.upcoming > 0 && (
        <Alert className="border-orange-200 bg-orange-50">
          <Bell className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-900">
            Você tem {stats.upcoming} despesa(s) vencendo em breve nos próximos dias.
          </AlertDescription>
        </Alert>
      )}

      {recurringExpenses.length === 0 && (
        <Alert className="border-blue-200 bg-blue-50">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-900">
            <strong>Comece agora!</strong> Cadastre suas despesas fixas mensais (aluguel, luz, internet, etc.) 
            e receba lembretes automáticos antes do vencimento.
          </AlertDescription>
        </Alert>
      )}

      {/* Lista de despesas recorrentes */}
      {recurringExpenses.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-slate-900">Suas Despesas Recorrentes</h2>
            <Badge variant="outline" className="text-sm">
              <Calendar className="w-3 h-3 mr-1" />
              {format(new Date(), "MMMM 'de' yyyy", { locale: ptBR })}
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recurringExpenses.map((expense) => (
              <RecurringExpenseCard
                key={expense.id}
                expense={expense}
                onEdit={handleEdit}
                onDelete={(id) => deleteMutation.mutate(id)}
                onMarkAsPaid={handleMarkAsPaid}
              />
            ))}
          </div>
        </div>
      )}

      {/* Formulário */}
      <RecurringExpenseForm
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditingExpense(null);
        }}
        expense={editingExpense}
        onSubmit={handleSubmit}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      {/* Dicas */}
      <Card className="border-purple-200 bg-purple-50">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-2 text-sm text-purple-900">
              <p className="font-semibold">💡 Dicas para usar melhor esta funcionalidade:</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>Configure lembretes com antecedência para não esquecer pagamentos</li>
                <li>Marque como "pago" após realizar o pagamento - isso cria automaticamente uma transação</li>
                <li>Use o campo de observações para salvar informações como código de barras ou dados da conta</li>
                <li>Desative temporariamente despesas que não estão ocorrendo (ex: férias)</li>
                <li>Os lembretes por email são enviados automaticamente nos dias configurados</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
