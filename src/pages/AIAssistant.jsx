import React, { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Send, 
  Loader2, 
  Sparkles, 
  AlertCircle,
  Brain,
  TrendingUp,
  Shield
} from "lucide-react";
import { format, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";

import ChatMessage from "../components/ai/ChatMessage";
import SuggestedQuestions from "../components/ai/SuggestedQuestions";

export default function AIAssistant() {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const { data: transactions } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => base44.entities.Transaction.list('-date'),
    initialData: [],
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Prepara o contexto financeiro do usuário
  const prepareFinancialContext = () => {
    const now = new Date();
    const lastMonth = subMonths(now, 1);
    const last3Months = subMonths(now, 3);
    
    // Transações do mês atual
    const currentMonthTransactions = transactions.filter(t => 
      new Date(t.date) >= new Date(now.getFullYear(), now.getMonth(), 1)
    );
    
    // Últimos 3 meses
    const recent3MonthsTransactions = transactions.filter(t => 
      new Date(t.date) >= last3Months
    );
    
    const totalIncome = currentMonthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpense = currentMonthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    // Gastos por categoria
    const expensesByCategory = {};
    currentMonthTransactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) + Math.abs(t.amount);
      });
    
    // Receitas por categoria
    const incomeByCategory = {};
    currentMonthTransactions
      .filter(t => t.type === 'income')
      .forEach(t => {
        incomeByCategory[t.category] = (incomeByCategory[t.category] || 0) + t.amount;
      });
    
    // Tendências dos últimos 3 meses
    const monthlyTrends = [];
    for (let i = 2; i >= 0; i--) {
      const monthDate = subMonths(now, i);
      const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
      const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
      
      const monthTransactions = transactions.filter(t => {
        const date = new Date(t.date);
        return date >= monthStart && date <= monthEnd;
      });
      
      const income = monthTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const expense = monthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);
      
      monthlyTrends.push({
        month: format(monthDate, 'MMMM yyyy', { locale: ptBR }),
        income,
        expense,
        balance: income - expense
      });
    }
    
    return {
      summary: {
        totalTransactions: transactions.length,
        currentMonthIncome: totalIncome,
        currentMonthExpense: totalExpense,
        currentMonthBalance: totalIncome - totalExpense,
        numberOfTransactionsThisMonth: currentMonthTransactions.length
      },
      expensesByCategory,
      incomeByCategory,
      monthlyTrends,
      recentTransactions: recent3MonthsTransactions.slice(0, 20).map(t => ({
        date: t.date,
        description: t.description,
        amount: t.amount,
        type: t.type,
        category: t.category
      }))
    };
  };

  const handleSendMessage = async (question) => {
    const messageText = question || inputValue.trim();
    
    if (!messageText) return;

    // Adiciona mensagem do usuário
    const userMessage = { text: messageText, isUser: true };
    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      const financialContext = prepareFinancialContext();
      
      const prompt = `Você é um consultor financeiro especializado em micro e pequenas empresas brasileiras. 
      
Você tem acesso aos seguintes dados financeiros do usuário:

**Resumo do Mês Atual:**
- Receitas: R$ ${financialContext.summary.currentMonthIncome.toFixed(2)}
- Despesas: R$ ${financialContext.summary.currentMonthExpense.toFixed(2)}
- Saldo: R$ ${financialContext.summary.currentMonthBalance.toFixed(2)}
- Número de transações: ${financialContext.summary.numberOfTransactionsThisMonth}

**Despesas por Categoria (Mês Atual):**
${Object.entries(financialContext.expensesByCategory)
  .sort((a, b) => b[1] - a[1])
  .map(([cat, amount]) => `- ${cat.replace(/_/g, ' ')}: R$ ${amount.toFixed(2)}`)
  .join('\n')}

**Receitas por Categoria (Mês Atual):**
${Object.entries(financialContext.incomeByCategory)
  .sort((a, b) => b[1] - a[1])
  .map(([cat, amount]) => `- ${cat.replace(/_/g, ' ')}: R$ ${amount.toFixed(2)}`)
  .join('\n')}

**Tendências dos Últimos 3 Meses:**
${financialContext.monthlyTrends.map(m => 
  `- ${m.month}: Receitas R$ ${m.income.toFixed(2)}, Despesas R$ ${m.expense.toFixed(2)}, Saldo R$ ${m.balance.toFixed(2)}`
).join('\n')}

**Transações Recentes (últimos 20 registros):**
${financialContext.recentTransactions.map(t => 
  `- ${t.date}: ${t.description} | ${t.type === 'income' ? 'Receita' : 'Despesa'} | ${t.category.replace(/_/g, ' ')} | R$ ${Math.abs(t.amount).toFixed(2)}`
).join('\n')}

Baseado nesses dados, responda à seguinte pergunta do usuário de forma clara, prática e acionável. 
Use linguagem simples e direta, adequada para micro e pequenos empresários brasileiros.
Forneça insights específicos baseados nos dados e recomendações práticas.
Sempre que possível, mencione valores e percentuais específicos dos dados do usuário.

**Pergunta do usuário:** ${messageText}

**Sua resposta:**`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        add_context_from_internet: false
      });

      // Adiciona resposta da IA
      const aiMessage = { 
        text: result || "Desculpe, não consegui processar sua pergunta. Tente novamente.", 
        isUser: false 
      };
      
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error("Erro ao processar mensagem:", error);
      
      const errorMessage = { 
        text: "Desculpe, ocorreu um erro ao processar sua pergunta. Por favor, tente novamente.", 
        isUser: false 
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="p-6 md:p-8 h-[calc(100vh-4rem)] flex flex-col">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Assistente Financeiro IA
            </h1>
            <p className="text-slate-600">
              Consultor financeiro inteligente para sua empresa
            </p>
          </div>
        </div>
      </div>

      {/* Benefícios - só mostra se não tiver mensagens */}
      {messages.length === 0 && (
        <div className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="border-purple-200 bg-purple-50">
              <CardContent className="p-4 flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-purple-900 mb-1">Insights Personalizados</h3>
                  <p className="text-sm text-purple-700">
                    Análise baseada nos seus dados reais
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-4 flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-blue-900 mb-1">Recomendações Práticas</h3>
                  <p className="text-sm text-blue-700">
                    Ações específicas para melhorar seu caixa
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-4 flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                  <Shield className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-green-900 mb-1">100% Privado</h3>
                  <p className="text-sm text-green-700">
                    Seus dados financeiros são seguros
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {transactions.length === 0 && (
            <Alert className="border-orange-200 bg-orange-50">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-900">
                <strong>Dica:</strong> Para obter conselhos mais precisos, adicione algumas transações primeiro. 
                Você pode importar extratos ou adicionar manualmente.
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {/* Área de mensagens */}
      <Card className="flex-1 flex flex-col border-0 shadow-lg overflow-hidden">
        <CardContent className="flex-1 overflow-y-auto p-6">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col justify-center">
              <SuggestedQuestions onSelectQuestion={handleSendMessage} />
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message, index) => (
                <ChatMessage
                  key={index}
                  message={message.text}
                  isUser={message.isUser}
                />
              ))}
              
              {isLoading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                    <Brain className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 inline-block">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm">Analisando seus dados...</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          )}
        </CardContent>

        {/* Input de mensagem */}
        <div className="border-t border-slate-200 p-4 bg-slate-50">
          <div className="flex gap-3">
            <Textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Pergunte algo sobre suas finanças... (Ex: Como posso reduzir custos?)"
              className="resize-none bg-white"
              rows={2}
              disabled={isLoading}
            />
            <Button
              onClick={() => handleSendMessage()}
              disabled={!inputValue.trim() || isLoading}
              className="bg-purple-600 hover:bg-purple-700 px-6"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Pressione Enter para enviar • Shift + Enter para quebra de linha
          </p>
        </div>
      </Card>
    </div>
  );
}