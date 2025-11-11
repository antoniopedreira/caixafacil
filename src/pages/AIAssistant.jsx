import React, { useState, useEffect, useRef, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Brain, Send, Sparkles, AlertCircle, Zap, TrendingUp, TrendingDown } from "lucide-react";
import { format, subMonths, startOfMonth, endOfMonth, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";

import ChatMessage from "../components/ai/ChatMessage";
import SuggestedQuestions from "../components/ai/SuggestedQuestions";
import BusinessContextDialog from "../components/ai/BusinessContextDialog";

export default function AIAssistant() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const [showContextDialog, setShowContextDialog] = useState(false);

  const { data: user, isLoading: loadingUser } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

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

  const updateUserMutation = useMutation({
    mutationFn: (userData) => base44.auth.updateMe(userData),
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (user && !user.business_segment && messages.length === 0) {
      setShowContextDialog(true);
    }
  }, [user, messages]);

  const hasBusinessContext = useMemo(() => {
    return user?.business_segment && user?.business_name;
  }, [user]);

  // Análise financeira avançada
  const financialData = useMemo(() => {
    if (!transactions.length) return null;

    const currentDate = new Date();
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    
    // Transações do mês atual
    const currentMonthTransactions = transactions.filter(t => {
      const date = new Date(t.date);
      return date >= monthStart && date <= monthEnd;
    });

    // Transações do mês anterior
    const lastMonthStart = startOfMonth(subMonths(currentDate, 1));
    const lastMonthEnd = endOfMonth(subMonths(currentDate, 1));
    const lastMonthTransactions = transactions.filter(t => {
      const date = new Date(t.date);
      return date >= lastMonthStart && date <= lastMonthEnd;
    });

    // Cálculo do saldo total
    const totalBalance = transactions.reduce((sum, t) => {
      return sum + (t.type === 'income' ? t.amount : -Math.abs(t.amount));
    }, 0);

    // Resumo do mês atual
    const currentIncome = currentMonthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const currentExpense = currentMonthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    // Resumo do mês anterior
    const lastIncome = lastMonthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const lastExpense = lastMonthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    // Variações mês a mês
    const incomeVariation = lastIncome > 0 ? ((currentIncome - lastIncome) / lastIncome) * 100 : 0;
    const expenseVariation = lastExpense > 0 ? ((currentExpense - lastExpense) / lastExpense) * 100 : 0;

    // Top despesas por categoria
    const expensesByCategory = {};
    currentMonthTransactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        if (!expensesByCategory[t.category]) {
          expensesByCategory[t.category] = 0;
        }
        expensesByCategory[t.category] += Math.abs(t.amount);
      });

    const topExpenses = Object.entries(expensesByCategory)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    // Média de receita dos últimos 3 meses
    const threeMonthsAgo = subMonths(currentDate, 3);
    const last3MonthsIncome = transactions
      .filter(t => {
        const date = new Date(t.date);
        return t.type === 'income' && date >= threeMonthsAgo;
      })
      .reduce((sum, t) => sum + t.amount, 0);
    
    const avgMonthlyIncome = last3MonthsIncome / 3;

    // Despesas recorrentes ativas
    const activeRecurring = recurringExpenses.filter(e => e.status === 'active');
    const totalRecurringExpenses = activeRecurring.reduce((sum, e) => sum + e.amount, 0);

    // Runway de caixa (quantos dias o caixa aguenta com base nas despesas médias)
    let cashRunway = null;
    if (currentExpense > 0) {
      const avgDailyExpense = currentExpense / 30;
      if (avgDailyExpense > 0 && totalBalance > 0) {
        cashRunway = Math.floor(totalBalance / avgDailyExpense);
      }
    }

    // Análise de sazonalidade (últimos 6 meses)
    const last6Months = [];
    for (let i = 0; i < 6; i++) {
      const monthDate = subMonths(currentDate, i);
      const mStart = startOfMonth(monthDate);
      const mEnd = endOfMonth(monthDate);
      
      const monthTxs = transactions.filter(t => {
        const date = new Date(t.date);
        return date >= mStart && date <= mEnd;
      });
      
      const mIncome = monthTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
      const mExpense = monthTxs.filter(t => t.type === 'expense').reduce((s, t) => s + Math.abs(t.amount), 0);
      
      last6Months.push({
        month: format(monthDate, 'MMM/yy', { locale: ptBR }),
        income: mIncome,
        expense: mExpense,
        balance: mIncome - mExpense
      });
    }

    // Detecta tendência
    const hasGrowingIncome = last6Months.length >= 3 && 
      last6Months[0].income > last6Months[2].income;
    const hasGrowingExpense = last6Months.length >= 3 && 
      last6Months[0].expense > last6Months[2].expense;

    return {
      currentBalance: totalBalance,
      monthSummary: {
        income: currentIncome,
        expense: currentExpense,
        balance: currentIncome - currentExpense
      },
      lastMonthSummary: {
        income: lastIncome,
        expense: lastExpense,
        balance: lastIncome - lastExpense
      },
      variations: {
        income: incomeVariation,
        expense: expenseVariation
      },
      topExpenses,
      recurringExpenses: activeRecurring.slice(0, 5),
      totalRecurringExpenses,
      avgMonthlyIncome,
      cashRunway,
      last6Months: last6Months.reverse(), // Do mais antigo para o mais recente
      trends: {
        hasGrowingIncome,
        hasGrowingExpense
      }
    };
  }, [transactions, recurringExpenses]);

  const businessContext = useMemo(() => {
    if (!user) return null;
    
    return {
      business_name: user.business_name,
      business_segment: user.business_segment,
      employee_count: user.employee_count,
      operation_type: user.operation_type,
      operation_states: user.operation_states,
      operation_cities: user.operation_cities,
      main_challenge: user.main_challenge
    };
  }, [user]);

  const handleSendMessage = async (messageText) => {
    const textToSend = messageText || input.trim();
    if (!textToSend) return;

    const userMessage = {
      role: "user",
      content: textToSend,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const conversationMessages = [...messages, userMessage];

      const response = await base44.functions.invoke('chatGPT', {
        messages: conversationMessages,
        financialData: financialData,
        businessContext: businessContext
      });

      if (response.data.error) {
        throw new Error(response.data.error);
      }

      const assistantMessage = {
        role: "assistant",
        content: response.data.response,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      
      const errorMessage = {
        role: "assistant",
        content: `❌ Desculpe, ocorreu um erro: ${error.message}. Por favor, tente novamente.`,
      };
      
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveContext = async (contextData) => {
    try {
      await updateUserMutation.mutateAsync(contextData);
      setShowContextDialog(false);
      
      const welcomeMessage = {
        role: "assistant",
        content: `Ótimo, ${contextData.business_name}! 🎉

Agora que conheço seu negócio, vou atuar como seu **consultor financeiro pessoal**. 

Como seu consultor, vou:

💰 **Analisar profundamente** sua saúde financeira
🎯 **Identificar oportunidades** de crescimento e economia
📊 **Acompanhar métricas** importantes do seu negócio
💡 **Sugerir estratégias** práticas e personalizadas
⚠️ **Alertar sobre riscos** antes que se tornem problemas

${contextData.main_challenge ? `\n🎯 Vejo que seu principal desafio é: "${contextData.main_challenge}"\nVou focar especialmente nisso nas minhas análises e recomendações!\n` : ''}
Como posso te ajudar hoje? Você pode:
- Pedir uma análise completa da sua situação atual
- Fazer perguntas específicas sobre algum aspecto do negócio
- Pedir um plano de ação para melhorar alguma área
- Ou simplesmente conversar sobre seus desafios financeiros!`,
      };
      
      setMessages([welcomeMessage]);
    } catch (error) {
      console.error('Error saving context:', error);
    }
  };

  // Insights rápidos na interface
  const quickInsights = useMemo(() => {
    if (!financialData) return null;

    const insights = [];
    const { currentBalance, monthSummary, variations, cashRunway, totalRecurringExpenses } = financialData;

    // Alerta de caixa baixo
    if (currentBalance < totalRecurringExpenses && currentBalance > 0) {
      insights.push({
        type: 'warning',
        icon: AlertCircle,
        text: `Caixa cobre apenas ${Math.floor(currentBalance / totalRecurringExpenses * 30)} dias de despesas fixas`
      });
    }

    // Alerta de prejuízo
    if (monthSummary.balance < 0) {
      insights.push({
        type: 'danger',
        icon: TrendingDown,
        text: `Prejuízo de R$ ${Math.abs(monthSummary.balance).toLocaleString('pt-BR', {minimumFractionDigits: 0})} este mês`
      });
    }

    // Crescimento de receita
    if (variations.income > 10) {
      insights.push({
        type: 'success',
        icon: TrendingUp,
        text: `Receita cresceu ${variations.income.toFixed(0)}% vs mês passado`
      });
    }

    // Aumento de despesas
    if (variations.expense > 15) {
      insights.push({
        type: 'warning',
        icon: AlertCircle,
        text: `Despesas aumentaram ${variations.expense.toFixed(0)}% vs mês passado`
      });
    }

    return insights;
  }, [financialData]);

  if (loadingUser || loadingTransactions || loadingRecurring) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 p-6">
        <div className="max-w-4xl mx-auto space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 flex flex-col">
      <div className="flex-1 overflow-hidden flex flex-col max-w-5xl mx-auto w-full p-4 md:p-6">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-4 border-2 border-purple-100">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4 flex-1">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-2xl font-bold text-slate-900">Consultor Financeiro IA</h1>
                  <div className="flex items-center gap-1 bg-gradient-to-r from-purple-100 to-blue-100 px-3 py-1 rounded-full">
                    <Zap className="w-3 h-3 text-purple-600" />
                    <span className="text-xs font-semibold text-purple-700">GPT-4o</span>
                  </div>
                </div>
                <p className="text-slate-600 text-sm">
                  {hasBusinessContext 
                    ? `Seu consultor pessoal para o ${user.business_name} 🚀`
                    : "Consultoria financeira personalizada, 24/7"
                  }
                </p>
              </div>
            </div>
            {hasBusinessContext && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowContextDialog(true)}
                className="flex-shrink-0"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Atualizar Perfil
              </Button>
            )}
          </div>

          {/* Quick Insights */}
          {quickInsights && quickInsights.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-200">
              <p className="text-xs font-semibold text-slate-600 mb-2">📊 Insights Rápidos:</p>
              <div className="flex flex-wrap gap-2">
                {quickInsights.map((insight, idx) => {
                  const Icon = insight.icon;
                  const colors = {
                    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                    warning: 'bg-orange-50 text-orange-700 border-orange-200',
                    danger: 'bg-rose-50 text-rose-700 border-rose-200'
                  };
                  return (
                    <div key={idx} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${colors[insight.type]}`}>
                      <Icon className="w-3.5 h-3.5" />
                      <span className="text-xs font-medium">{insight.text}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Alerts */}
        {!hasBusinessContext && messages.length > 0 && (
          <Alert className="mb-4 border-orange-200 bg-orange-50">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-900">
              <strong>💡 Melhore a consultoria:</strong> Configure o contexto do seu negócio para análises mais precisas!
              <Button
                variant="link"
                size="sm"
                onClick={() => setShowContextDialog(true)}
                className="text-orange-700 hover:text-orange-900 p-0 h-auto ml-2"
              >
                Configurar agora →
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {transactions.length === 0 && (
          <Alert className="mb-4 border-blue-200 bg-blue-50">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-900">
              <strong>📊 Adicione transações</strong> para que eu possa fazer análises profundas e dar recomendações personalizadas!
            </AlertDescription>
          </Alert>
        )}

        {/* Chat Area */}
        <div className="flex-1 bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col border-2 border-purple-100">
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-6 p-6">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center">
                  <Sparkles className="w-10 h-10 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">
                    Como posso te ajudar hoje?
                  </h2>
                  <p className="text-slate-600 max-w-md">
                    Sou seu consultor financeiro pessoal. Posso analisar suas finanças, sugerir melhorias e criar planos de ação!
                  </p>
                </div>
                
                <div className="w-full max-w-2xl">
                  <SuggestedQuestions onSelectQuestion={handleSendMessage} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mt-8">
                  <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                    <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center mb-3">
                      <Brain className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-slate-900 mb-1">Análise Profunda</h3>
                    <p className="text-sm text-slate-600">
                      Entendo seus dados financeiros e seu contexto de negócio
                    </p>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center mb-3">
                      <Target className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-slate-900 mb-1">Consultoria Proativa</h3>
                    <p className="text-sm text-slate-600">
                      Identifico problemas e oportunidades automaticamente
                    </p>
                  </div>
                  <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
                    <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center mb-3">
                      <Zap className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-slate-900 mb-1">Planos de Ação</h3>
                    <p className="text-sm text-slate-600">
                      Forneço estratégias práticas e acionáveis
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {messages.map((message, index) => (
                  <ChatMessage key={index} message={message} />
                ))}
                {isLoading && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <Brain className="w-5 h-5 text-white" />
                    </div>
                    <div className="bg-slate-100 rounded-2xl rounded-tl-sm p-4">
                      <div className="flex gap-2">
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input Area */}
          <div className="border-t border-slate-200 p-4 bg-slate-50">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex gap-2"
            >
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Digite sua pergunta ou peça uma análise..."
                disabled={isLoading}
                className="flex-1 bg-white border-slate-300 focus:border-purple-500 focus:ring-purple-500"
              />
              <Button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 px-6"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Enviar
                  </>
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* Business Context Dialog */}
      <BusinessContextDialog
        open={showContextDialog}
        onClose={() => setShowContextDialog(false)}
        onSave={handleSaveContext}
        user={user}
      />
    </div>
  );
}