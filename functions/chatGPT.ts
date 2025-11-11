import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';
import OpenAI from 'npm:openai@4.28.0';

const openai = new OpenAI({
    apiKey: Deno.env.get("OPENAI_API_KEY"),
});

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { messages, financialData, businessContext } = await req.json();

        if (!messages || !Array.isArray(messages)) {
            return Response.json({ error: 'Messages array is required' }, { status: 400 });
        }

        // Monta o contexto do sistema
        let systemPrompt = `Você é um assistente financeiro especializado em pequenos e médios negócios brasileiros. 
Seu nome é "Assistente CaixaFácil" e você foi criado para ajudar empreendedores a gerenciarem melhor suas finanças.

SUAS CARACTERÍSTICAS:
- Fala português brasileiro de forma clara e acessível
- É amigável, empático e prestativo
- Usa exemplos práticos do dia a dia do empreendedor
- Fornece conselhos acionáveis e específicos
- Entende o contexto de pequenos negócios no Brasil
- Conhece sobre impostos, fluxo de caixa, gestão financeira, crédito, etc.

COMO VOCÊ RESPONDE:
- De forma direta e objetiva, mas gentil
- Com bullet points quando listar itens
- Com números e dados quando disponível
- Com sugestões práticas e próximos passos
- Sempre considerando a realidade do pequeno negócio brasileiro

IMPORTANTE:
- Nunca invente dados financeiros do usuário
- Se não tiver certeza, deixe claro que é uma sugestão geral
- Incentive boas práticas de gestão financeira
- Seja realista sobre desafios e oportunidades`;

        // Adiciona contexto do negócio se disponível
        if (businessContext && Object.keys(businessContext).length > 0) {
            systemPrompt += `\n\n=== CONTEXTO DO NEGÓCIO DO USUÁRIO ===\n`;
            
            if (businessContext.business_name) {
                systemPrompt += `Nome do negócio: ${businessContext.business_name}\n`;
            }
            if (businessContext.business_segment) {
                systemPrompt += `Segmento: ${businessContext.business_segment}\n`;
            }
            if (businessContext.employee_count) {
                systemPrompt += `Quantidade de funcionários: ${businessContext.employee_count}\n`;
            }
            if (businessContext.operation_type) {
                systemPrompt += `Tipo de operação: ${businessContext.operation_type}\n`;
            }
            if (businessContext.operation_states && businessContext.operation_states.length > 0) {
                systemPrompt += `Estados de atuação: ${businessContext.operation_states.join(', ')}\n`;
            }
            if (businessContext.operation_cities && businessContext.operation_cities.length > 0) {
                systemPrompt += `Cidades de atuação: ${businessContext.operation_cities.join(', ')}\n`;
            }
            if (businessContext.main_challenge) {
                systemPrompt += `Principal desafio: ${businessContext.main_challenge}\n`;
            }
        }

        // Adiciona dados financeiros se disponíveis
        if (financialData && Object.keys(financialData).length > 0) {
            systemPrompt += `\n\n=== DADOS FINANCEIROS RECENTES ===\n`;
            
            if (financialData.currentBalance !== undefined) {
                systemPrompt += `Saldo atual em caixa: R$ ${financialData.currentBalance.toLocaleString('pt-BR', {minimumFractionDigits: 2})}\n`;
            }
            
            if (financialData.monthSummary) {
                const { income, expense, balance } = financialData.monthSummary;
                systemPrompt += `\nResumo do mês atual:\n`;
                systemPrompt += `- Entradas: R$ ${income.toLocaleString('pt-BR', {minimumFractionDigits: 2})}\n`;
                systemPrompt += `- Saídas: R$ ${expense.toLocaleString('pt-BR', {minimumFractionDigits: 2})}\n`;
                systemPrompt += `- Resultado: R$ ${balance.toLocaleString('pt-BR', {minimumFractionDigits: 2})}\n`;
            }
            
            if (financialData.topExpenses && financialData.topExpenses.length > 0) {
                systemPrompt += `\nPrincipais despesas do mês:\n`;
                financialData.topExpenses.forEach((expense, idx) => {
                    systemPrompt += `${idx + 1}. ${expense.category}: R$ ${expense.amount.toLocaleString('pt-BR', {minimumFractionDigits: 2})}\n`;
                });
            }
            
            if (financialData.recurringExpenses && financialData.recurringExpenses.length > 0) {
                systemPrompt += `\nDespesas recorrentes cadastradas:\n`;
                financialData.recurringExpenses.forEach((expense, idx) => {
                    systemPrompt += `${idx + 1}. ${expense.name}: R$ ${expense.amount.toLocaleString('pt-BR', {minimumFractionDigits: 2})} (vence dia ${expense.due_day})\n`;
                });
            }
        }

        // Prepara as mensagens para o OpenAI
        const openAIMessages = [
            { role: 'system', content: systemPrompt },
            ...messages.map(msg => ({
                role: msg.role,
                content: msg.content
            }))
        ];

        // Chama o ChatGPT
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: openAIMessages,
            temperature: 0.7,
            max_tokens: 2000,
        });

        const response = completion.choices[0].message.content;

        return Response.json({ 
            success: true,
            response: response,
            model: 'gpt-4o-mini'
        });

    } catch (error) {
        console.error('Error in chatGPT function:', error);
        
        if (error.message?.includes('API key')) {
            return Response.json({ 
                error: 'Chave da API OpenAI não configurada ou inválida. Configure OPENAI_API_KEY nas configurações.' 
            }, { status: 500 });
        }
        
        return Response.json({ 
            error: error.message || 'Erro ao processar sua mensagem. Tente novamente.' 
        }, { status: 500 });
    }
});