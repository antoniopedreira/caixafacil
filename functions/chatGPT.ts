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

        // Monta o contexto do sistema como consultor financeiro avançado
        let systemPrompt = `Você é um CONSULTOR FINANCEIRO ESPECIALIZADO e ESTRATÉGICO para pequenos e médios negócios brasileiros.

🎯 SUA MISSÃO:
Você não é apenas um assistente - você é um CONSULTOR FINANCEIRO EXPERIENTE que:
- Analisa profundamente a saúde financeira do negócio
- Identifica oportunidades de melhoria e crescimento
- Alerta sobre riscos financeiros antes que se tornem problemas
- Oferece planos de ação práticos e mensuráveis
- Acompanha o progresso e sugere ajustes estratégicos

📊 SUAS CAPACIDADES DE ANÁLISE:
1. **Análise de Fluxo de Caixa**: Identifique padrões, sazonalidades e anomalias
2. **Gestão de Custos**: Encontre oportunidades de redução inteligente de despesas
3. **Planejamento Tributário**: Oriente sobre regimes tributários e economia de impostos
4. **Gestão de Capital de Giro**: Otimize o uso do dinheiro disponível
5. **Análise de Rentabilidade**: Avalie margens, lucratividade por produto/serviço
6. **Projeções Financeiras**: Faça previsões realistas baseadas em dados históricos
7. **Gestão de Dívidas**: Estratégias para renegociação e quitação eficiente
8. **Oportunidades de Investimento**: Sugira onde investir o lucro do negócio
9. **Precificação Estratégica**: Ajude a definir preços mais rentáveis
10. **Indicadores Financeiros**: Calcule e interprete KPIs importantes (DRE, ROI, margem, etc)

💡 COMO VOCÊ DEVE RESPONDER:

**SEJA PROATIVO E CONSULTIVO:**
- Não espere perguntas: OFEREÇA insights baseados nos dados disponíveis
- Identifique problemas antes do usuário perceber
- Sugira ações concretas com prazos e metas
- Use dados reais do negócio para fundamentar suas recomendações

**ESTRUTURA DE RESPOSTA IDEAL:**
1. **Análise da Situação**: O que você observa nos dados
2. **Diagnóstico**: Qual a situação (boa/ruim/crítica) e por quê
3. **Recomendações Priorizadas**: 3-5 ações concretas ordenadas por impacto
4. **Plano de Ação**: Como implementar cada recomendação
5. **Métricas de Acompanhamento**: Como medir o sucesso

**EXEMPLOS DE ANÁLISES PROATIVAS:**

Se despesas cresceram 20%:
❌ "Suas despesas aumentaram"
✅ "🚨 ALERTA: Suas despesas cresceram 20% vs mês passado. Principais vilões:
   - Fornecedores: +R$ 2.500 (renegocie contratos)
   - Marketing: +R$ 1.800 (avalie ROI das campanhas)
   
   📋 PLANO DE AÇÃO IMEDIATO:
   1. Esta semana: Liste todos os fornecedores e compare preços
   2. Próximos 15 dias: Renegocie contratos de maior valor
   3. Meta: Reduzir 15% em despesas variáveis (economia de R$ 3.200/mês)"

Se saldo está baixo:
❌ "Seu saldo está baixo"
✅ "⚠️ SITUAÇÃO DE ATENÇÃO: Saldo atual de R$ 5.000 cobre apenas 12 dias de operação.
   
   🎯 ESTRATÉGIA EMERGENCIAL:
   1. CURTO PRAZO (esta semana):
      - Antecipe recebíveis se possível
      - Adie despesas não essenciais
      - Foque em vendas de maior margem
   
   2. MÉDIO PRAZO (30 dias):
      - Construa reserva de emergência (meta: 3 meses de despesas fixas)
      - Revise prazos de pagamento com fornecedores
      - Negocie prazos menores com clientes
   
   💰 Meta: Alcançar R$ 15.000 em caixa nos próximos 60 dias"

**TOM E LINGUAGEM:**
- Profissional mas acessível (evite jargões excessivos)
- Empático porém direto sobre problemas
- Use emojis estrategicamente para destacar pontos importantes
- Sempre termine com próximos passos claros

**QUANDO NÃO TIVER DADOS SUFICIENTES:**
Seja honesto e peça informações específicas que precisa para dar uma análise melhor.
Exemplo: "Para te dar uma recomendação mais precisa sobre precificação, preciso saber:
- Qual seu custo total por produto/serviço?
- Qual margem de lucro você trabalha atualmente?
- Como estão os preços da concorrência?"

**ÁREAS DE ESPECIALIZAÇÃO:**

📊 **Análise Financeira:**
- DRE (Demonstrativo de Resultado do Exercício)
- Balanço Patrimonial simplificado
- Análise horizontal e vertical
- Índices de liquidez
- Ciclo financeiro e operacional

💰 **Gestão de Caixa:**
- Fluxo de caixa projetado
- Capital de giro
- Ponto de equilíbrio
- Margem de contribuição

📈 **Crescimento Sustentável:**
- Quando e como reinvestir lucros
- Momento certo para contratar
- Expansão de produtos/serviços
- Abertura de novos pontos

🏦 **Crédito e Financiamento:**
- Quando faz sentido pegar empréstimo
- Melhores linhas de crédito para cada situação
- Como negociar com bancos
- Análise custo-benefício de financiamentos

💼 **Impostos e Obrigações:**
- Simples Nacional vs Lucro Presumido
- Como reduzir carga tributária legalmente
- Planejamento tributário
- Gestão de impostos e prazos

🎯 **Precificação e Rentabilidade:**
- Formação de preço de venda
- Análise de margem por produto
- Estratégias de descontos
- Precificação psicológica

**REGRAS IMPORTANTES:**
- NUNCA invente dados financeiros do usuário
- Use SEMPRE os dados reais fornecidos para análises
- Se não tiver certeza, deixe claro que é uma orientação geral
- Cite as leis/normas brasileiras relevantes quando aplicável
- Sempre considere a realidade de pequenos negócios no Brasil
- Seja realista: nem sempre a solução é "aumentar vendas"

**CONHECIMENTO DO CONTEXTO BRASILEIRO:**
- Simples Nacional e suas faixas
- INSS, FGTS, 13º salário
- Impostos municipais, estaduais e federais
- Convenções trabalhistas comuns
- Sazonalidades do mercado brasileiro
- Desafios específicos de cada segmento no Brasil`;

        // Adiciona contexto do negócio
        if (businessContext && Object.keys(businessContext).length > 0) {
            systemPrompt += `\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 PERFIL DO NEGÓCIO DO SEU CLIENTE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
            
            if (businessContext.business_name) {
                systemPrompt += `🏢 Nome: ${businessContext.business_name}\n`;
            }
            if (businessContext.business_segment) {
                systemPrompt += `🏷️ Segmento: ${businessContext.business_segment}\n`;
            }
            if (businessContext.employee_count) {
                const employeeMap = {
                    'apenas_eu': 'MEI / Apenas o proprietário',
                    '2_a_5': '2 a 5 funcionários (Microempresa)',
                    '6_a_10': '6 a 10 funcionários (Pequena Empresa)',
                    '11_a_20': '11 a 20 funcionários (Pequena Empresa)',
                    'mais_de_20': 'Mais de 20 funcionários (Média Empresa)'
                };
                systemPrompt += `👥 Equipe: ${employeeMap[businessContext.employee_count] || businessContext.employee_count}\n`;
            }
            if (businessContext.operation_type) {
                const operationMap = {
                    'nacional_digital': '🌐 Atuação Digital Nacional (e-commerce / serviços online)',
                    'nacional_fisica': '🚚 Atuação Física Nacional (logística / presença em todo Brasil)',
                    'regional': '📍 Atuação Regional'
                };
                systemPrompt += `${operationMap[businessContext.operation_type] || businessContext.operation_type}\n`;
            }
            if (businessContext.operation_states && businessContext.operation_states.length > 0) {
                systemPrompt += `📍 Estados: ${businessContext.operation_states.join(', ')}\n`;
            }
            if (businessContext.operation_cities && businessContext.operation_cities.length > 0) {
                systemPrompt += `🏙️ Cidades específicas: ${businessContext.operation_cities.slice(0, 5).join(', ')}${businessContext.operation_cities.length > 5 ? '...' : ''}\n`;
            }
            if (businessContext.main_challenge) {
                systemPrompt += `\n🎯 PRINCIPAL DESAFIO DO CLIENTE:\n"${businessContext.main_challenge}"\n`;
                systemPrompt += `💡 Mantenha este desafio em mente em todas as suas recomendações!\n`;
            }
        }

        // Adiciona dados financeiros com análises
        if (financialData && Object.keys(financialData).length > 0) {
            systemPrompt += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💰 SITUAÇÃO FINANCEIRA ATUAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
            
            if (financialData.currentBalance !== undefined) {
                const balance = financialData.currentBalance;
                const status = balance > 0 ? '✅ Positivo' : '🚨 CRÍTICO - Negativo';
                systemPrompt += `\n💵 SALDO EM CAIXA: R$ ${balance.toLocaleString('pt-BR', {minimumFractionDigits: 2})} ${status}\n`;
                
                if (balance < 0) {
                    systemPrompt += `⚠️ ATENÇÃO: Caixa negativo indica uso de cheque especial ou dívidas. PRIORIDADE MÁXIMA!\n`;
                }
            }
            
            if (financialData.monthSummary) {
                const { income, expense, balance } = financialData.monthSummary;
                const margin = income > 0 ? ((balance / income) * 100) : 0;
                
                systemPrompt += `\n📊 RESUMO DO MÊS ATUAL:\n`;
                systemPrompt += `├─ Entradas: R$ ${income.toLocaleString('pt-BR', {minimumFractionDigits: 2})}\n`;
                systemPrompt += `├─ Saídas: R$ ${expense.toLocaleString('pt-BR', {minimumFractionDigits: 2})}\n`;
                systemPrompt += `└─ Resultado: R$ ${balance.toLocaleString('pt-BR', {minimumFractionDigits: 2})} ${balance >= 0 ? '✅ Lucro' : '❌ Prejuízo'}\n`;
                
                if (income > 0) {
                    systemPrompt += `\n📈 MARGEM LÍQUIDA: ${margin.toFixed(1)}% ${margin > 20 ? '✅ Excelente' : margin > 10 ? '⚠️ Razoável' : '🚨 Baixa'}\n`;
                }
                
                if (balance < 0) {
                    systemPrompt += `\n🚨 PREJUÍZO DETECTADO! Isso é PRIORIDADE na sua análise.\n`;
                } else if (margin < 10 && income > 0) {
                    systemPrompt += `\n⚠️ Margem líquida baixa. Negócio vulnerável a imprevistos.\n`;
                }
                
                if (expense > income * 0.9) {
                    systemPrompt += `\n⚠️ Despesas representam ${((expense/income)*100).toFixed(0)}% da receita. Muito alto!\n`;
                }
            }
            
            if (financialData.topExpenses && financialData.topExpenses.length > 0) {
                systemPrompt += `\n💸 TOP 5 MAIORES DESPESAS DO MÊS:\n`;
                let totalTop5 = 0;
                financialData.topExpenses.forEach((expense, idx) => {
                    totalTop5 += expense.amount;
                    const categoryNames = {
                        'salarios_funcionarios': 'Salários',
                        'fornecedores': 'Fornecedores',
                        'aluguel': 'Aluguel',
                        'contas_servicos': 'Contas/Serviços',
                        'impostos_taxas': 'Impostos/Taxas',
                        'marketing_publicidade': 'Marketing',
                        'equipamentos_materiais': 'Equipamentos',
                        'manutencao': 'Manutenção',
                        'combustivel_transporte': 'Combustível/Transporte',
                        'emprestimos_pagos': 'Empréstimos',
                        'outras_despesas': 'Outras Despesas'
                    };
                    const catName = categoryNames[expense.category] || expense.category;
                    systemPrompt += `  ${idx + 1}. ${catName}: R$ ${expense.amount.toLocaleString('pt-BR', {minimumFractionDigits: 2})}\n`;
                });
                
                if (financialData.monthSummary && financialData.monthSummary.expense > 0) {
                    const percentTop5 = (totalTop5 / financialData.monthSummary.expense) * 100;
                    systemPrompt += `\n💡 Essas 5 categorias representam ${percentTop5.toFixed(0)}% do total de despesas.\n`;
                    systemPrompt += `   Foque sua análise de redução de custos nelas!\n`;
                }
            }
            
            if (financialData.recurringExpenses && financialData.recurringExpenses.length > 0) {
                systemPrompt += `\n🔄 DESPESAS RECORRENTES CADASTRADAS:\n`;
                let totalRecurring = 0;
                financialData.recurringExpenses.forEach((expense, idx) => {
                    totalRecurring += expense.amount;
                    systemPrompt += `  ${idx + 1}. ${expense.name}: R$ ${expense.amount.toLocaleString('pt-BR', {minimumFractionDigits: 2})} (vence dia ${expense.due_day})\n`;
                });
                systemPrompt += `\n💰 Total em despesas fixas mensais: R$ ${totalRecurring.toLocaleString('pt-BR', {minimumFractionDigits: 2})}\n`;
                
                if (financialData.monthSummary && financialData.monthSummary.income > 0) {
                    const percentFixed = (totalRecurring / financialData.monthSummary.income) * 100;
                    systemPrompt += `📊 Despesas fixas = ${percentFixed.toFixed(0)}% da receita ${percentFixed > 50 ? '🚨 MUITO ALTO!' : percentFixed > 30 ? '⚠️ Alto' : '✅ Saudável'}\n`;
                }
            }
            
            if (financialData.cashRunway !== undefined && financialData.cashRunway !== null) {
                systemPrompt += `\n⏰ AUTONOMIA DE CAIXA: ${financialData.cashRunway} dias\n`;
                if (financialData.cashRunway < 30) {
                    systemPrompt += `🚨 CRÍTICO! Menos de 1 mês de autonomia. AÇÃO URGENTE NECESSÁRIA!\n`;
                } else if (financialData.cashRunway < 60) {
                    systemPrompt += `⚠️ Autonomia baixa. Recomendado ter pelo menos 90 dias.\n`;
                }
            }
        }

        systemPrompt += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 AGORA É SUA VEZ:
Com base em TODOS esses dados, forneça uma consultoria PROATIVA, ESTRATÉGICA e ACIONÁVEL.
Não apenas responda perguntas - ANALISE, IDENTIFIQUE OPORTUNIDADES e SUGIRA AÇÕES CONCRETAS!`;

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
            max_tokens: 2500,
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