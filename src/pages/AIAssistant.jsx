import React, { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import BusinessContextDialog from "../components/ai/BusinessContextDialog";

export default function AIAssistant() {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showContextDialog, setShowContextDialog] = useState(false);
  const messagesEndRef = useRef(null);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: transactions } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => base44.entities.Transaction.list('-date'),
    initialData: [],
  });

  const updateUserMutation = useMutation({
    mutationFn: (data) => base44.auth.updateMe(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
    },
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Verifica se precisa coletar contexto do negócio
  useEffect(() => {
    if (user && !user.business_context_collected && messages.length === 0) {
      // Mostra mensagem automática pedindo contexto
      setTimeout(() => {
        const welcomeMessage = {
          text: `Olá! 👋 Sou seu assistente financeiro.\n\nPara te ajudar melhor, preciso conhecer seu negócio. São só 4 perguntas rápidas!\n\n**Vamos começar?** Clique no botão abaixo.`,
          isUser: false,
          showContextButton: true
        };
        setMessages([welcomeMessage]);
      }, 500);
    }
  }, [user, messages.length]);

  const handleContextSaved = async (contextData) => {
    await updateUserMutation.mutateAsync({
      ...contextData,
      business_context_collected: true
    });
    
    setShowContextDialog(false);
    
    // Mensagem de confirmação
    const confirmMessage = {
      text: `Perfeito! Agora posso te ajudar de forma muito mais direcionada. 🎯\n\n**O que você quer saber sobre seu negócio?**`,
      isUser: false
    };
    setMessages(prev => [...prev.filter(m => !m.showContextButton), confirmMessage]);
  };

  // Mapeia segmentos para nomes legíveis
  const getSegmentName = (segment) => {
    const segments = {
      comercio_varejo: "comércio/varejo",
      restaurante_bar: "restaurante/bar",
      salao_beleza: "salão de beleza",
      consultoria_servicos: "consultoria/serviços",
      construcao_reformas: "construção/reformas",
      transporte_logistica: "transporte/logística",
      saude_clinica: "saúde/clínica",
      educacao_cursos: "educação/cursos",
      tecnologia_software: "tecnologia/software",
      industria_fabricacao: "indústria/fabricação",
      agronegocio: "agronegócio",
      outros: "outros"
    };
    return segments[segment] || segment;
  };

  // Prepara o contexto financeiro do usuário
  const prepareFinancialContext = () => {
    const now = new Date();
    const lastMonth = subMonths(now, 1);
    const last3Months = subMonths(now, 3);
    
    const currentMonthTransactions = transactions.filter(t => 
      new Date(t.date) >= new Date(now.getFullYear(), now.getMonth(), 1)
    );
    
    const recent3MonthsTransactions = transactions.filter(t => 
      new Date(t.date) >= last3Months
    );
    
    const totalIncome = currentMonthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpense = currentMonthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    const expensesByCategory = {};
    currentMonthTransactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) + Math.abs(t.amount);
      });
    
    const incomeByCategory = {};
    currentMonthTransactions
      .filter(t => t.type === 'income')
      .forEach(t => {
        incomeByCategory[t.category] = (incomeByCategory[t.category] || 0) + t.amount;
      });
    
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

    // Se não tem contexto, pede para cadastrar
    if (!user?.business_context_collected) {
      setShowContextDialog(true);
      return;
    }

    const userMessage = { text: messageText, isUser: true };
    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      const financialContext = prepareFinancialContext();
      
      // Monta contexto do negócio
      const businessContext = user.business_segment ? `
📋 **PERFIL DO NEGÓCIO:**
- Segmento: ${getSegmentName(user.business_segment)}
- Nome: ${user.business_name || 'Não informado'}
- Funcionários: ${user.employee_count ? user.employee_count.replace(/_/g, ' ') : 'Não informado'}
- Faturamento mensal: ${user.monthly_revenue_range ? user.monthly_revenue_range.replace(/_/g, ' ').replace('k', ' mil') : 'Não informado'}
- Desafio principal: ${user.main_challenge || 'Não informado'}
` : '';

      const prompt = `Você é o Marcos, um empresário experiente de ${getSegmentName(user.business_segment || 'comércio')} que mentora outros empresários. Você fala de forma direta, sem enrolação, como um amigo que quer ajudar.

${businessContext}

📊 **DADOS FINANCEIROS (MÊS ATUAL):**
- Receitas: R$ ${financialContext.summary.currentMonthIncome.toLocaleString('pt-BR')}
- Despesas: R$ ${financialContext.summary.currentMonthExpense.toLocaleString('pt-BR')}
- Saldo: R$ ${financialContext.summary.currentMonthBalance.toLocaleString('pt-BR')}

💰 **TOP 3 MAIORES DESPESAS:**
${Object.entries(financialContext.expensesByCategory)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 3)
  .map(([cat, amount], i) => `${i+1}. ${cat.replace(/_/g, ' ')}: R$ ${amount.toLocaleString('pt-BR')}`)
  .join('\n')}

📈 **TENDÊNCIA (3 MESES):**
${financialContext.monthlyTrends.map(m => 
  `- ${m.month}: Saldo R$ ${m.balance.toLocaleString('pt-BR')}`
).join('\n')}

---

**REGRAS PARA SUA RESPOSTA:**

1. **SEJA DIRETO**: Vá direto ao ponto, sem textão
2. **USE TÓPICOS**: Organize tudo em bullet points
3. **NÚMEROS REAIS**: Sempre cite valores específicos dos dados acima
4. **AÇÕES PRÁTICAS**: Dê no máximo 3 ações que ele pode fazer HOJE
5. **TOM PRÓXIMO**: Fale como se fosse um amigo dando conselho no bar
6. **ESPECÍFICO PRO SEGMENTO**: Adapte exemplos pro segmento dele (${getSegmentName(user.business_segment || 'comércio')})

**FORMATO OBRIGATÓRIO:**

🎯 **RESPOSTA DIRETA**
[Responda em 1 linha]

📊 **O QUE VI NOS SEUS DADOS**
• [Insight 1 com número]
• [Insight 2 com número]

💡 **FAÇA HOJE**
1. [Ação específica com valor estimado]
2. [Ação específica com valor estimado]
3. [Ação específica com valor estimado]

❓ **[Pergunta para aprofundar o tema]**

---

**EXEMPLOS DE BOM E RUIM:**

❌ RUIM: "Você deve considerar a otimização dos seus custos operacionais"
✅ BOM: "Seus R$ 8.500 em fornecedores estão altos. Ligue pra 3 deles hoje e peça 10% de desconto - economiza R$ 850/mês"

❌ RUIM: "Analise suas receitas"
✅ BOM: "Suas vendas caíram 15% vs mês passado (de R$ 45k pra R$ 38k). Faça uma promoção esta semana pra recuperar"

**Pergunta do empresário:** ${messageText}

**Sua resposta como Marcos (empresário experiente):**`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        add_context_from_internet: false
      });

      const aiMessage = { 
        text: result || "Desculpe, não consegui processar sua pergunta. Tenta reformular?", 
        isUser: false 
      };
      
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error("Erro ao processar mensagem:", error);
      
      const errorMessage = { 
        text: "Ops, deu um problema aqui. Tenta de novo?", 
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
      <div className="mb-3">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Assistente Financeiro IA
            </h1>
            <p className="text-slate-600">
              {user?.business_name ? `Consultoria para ${user.business_name}` : 'Seu consultor financeiro pessoal'}
            </p>
          </div>
        </div>
      </div>

      {/* Benefícios - ultra compactos */}
      {messages.length === 0 && !user?.business_context_collected && (
        <div className="mb-4">
          <Alert className="border-blue-200 bg-blue-50">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-900 text-sm">
              <strong>Primeira vez aqui?</strong> Vou te fazer 4 perguntas rápidas sobre seu negócio para dar conselhos ultra direcionados! 🎯
            </AlertDescription>
          </Alert>
        </div>
      )}

      {messages.length === 0 && user?.business_context_collected && (
        <div className="mb-4">
          <div className="flex items-center justify-center gap-6 mb-3 p-2 bg-slate-50 rounded-lg">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <span className="text-xs font-medium text-slate-700">Respostas Diretas</span>
            </div>
            <div className="flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-medium text-slate-700">Ações Práticas</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-green-600" />
              <span className="text-xs font-medium text-slate-700">100% Privado</span>
            </div>
          </div>

          {transactions.length === 0 && (
            <Alert className="border-orange-200 bg-orange-50">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-900 text-sm">
                <strong>Dica:</strong> Adicione transações para obter conselhos mais precisos com base nos seus números reais.
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {/* Área de mensagens */}
      <Card className="flex-1 flex flex-col border-0 shadow-lg overflow-hidden">
        <CardContent className="flex-1 overflow-y-auto p-6">
          {messages.length === 0 && user?.business_context_collected ? (
            <div className="h-full flex flex-col justify-center">
              <SuggestedQuestions onSelectQuestion={handleSendMessage} />
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div key={index}>
                  <ChatMessage
                    message={message.text}
                    isUser={message.isUser}
                  />
                  {message.showContextButton && (
                    <div className="flex justify-center mt-4">
                      <Button
                        onClick={() => setShowContextDialog(true)}
                        className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                      >
                        <Sparkles className="w-4 h-4 mr-2" />
                        Vamos lá! Cadastrar meu negócio
                      </Button>
                    </div>
                  )}
                </div>
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
              placeholder="Ex: Como reduzo custos? Minhas vendas estão boas?"
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
            Pressione Enter para enviar • Shift + Enter para nova linha
          </p>
        </div>
      </Card>

      {/* Dialog de contexto do negócio */}
      <BusinessContextDialog
        open={showContextDialog}
        onClose={() => setShowContextDialog(false)}
        onSave={handleContextSaved}
        user={user}
      />
    </div>
  );
}