import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Verifica autenticação
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ 
                success: false, 
                error: 'Usuário não autenticado' 
            }, { status: 401 });
        }

        const clientId = Deno.env.get("PLUGGY_CLIENT_ID");
        const clientSecret = Deno.env.get("PLUGGY_CLIENT_SECRET");

        console.log('Client ID presente:', !!clientId);
        console.log('Client Secret presente:', !!clientSecret);

        if (!clientId || !clientSecret) {
            return Response.json({
                success: false,
                error: 'Credenciais do Pluggy não configuradas. Configure PLUGGY_CLIENT_ID e PLUGGY_CLIENT_SECRET nas variáveis de ambiente.'
            }, { status: 500 });
        }

        // Obtém API Key do Pluggy
        console.log('Tentando autenticar no Pluggy...');
        const authResponse = await fetch('https://api.pluggy.ai/auth', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                clientId: clientId,
                clientSecret: clientSecret
            })
        });

        console.log('Status da autenticação:', authResponse.status);

        if (!authResponse.ok) {
            const errorText = await authResponse.text();
            console.error('Erro na autenticação Pluggy:', errorText);
            
            let errorMessage = 'Falha na autenticação com Pluggy.';
            
            if (authResponse.status === 401) {
                errorMessage = 'Credenciais do Pluggy inválidas. Verifique seu Client ID e Client Secret.';
            } else if (authResponse.status === 403) {
                errorMessage = 'Acesso negado pelo Pluggy. Verifique suas permissões.';
            }
            
            return Response.json({
                success: false,
                error: errorMessage,
                details: errorText
            }, { status: 500 });
        }

        const authData = await authResponse.json();
        console.log('Autenticação bem-sucedida, criando connect token...');

        // Cria Connect Token
        const connectTokenResponse = await fetch('https://api.pluggy.ai/connect_token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-KEY': authData.apiKey
            },
            body: JSON.stringify({
                clientUserId: user.id
            })
        });

        console.log('Status do connect token:', connectTokenResponse.status);

        if (!connectTokenResponse.ok) {
            const errorText = await connectTokenResponse.text();
            console.error('Erro ao criar connect token:', errorText);
            return Response.json({
                success: false,
                error: 'Falha ao criar token de conexão',
                details: errorText
            }, { status: 500 });
        }

        const connectTokenData = await connectTokenResponse.json();
        console.log('Connect token criado com sucesso');

        return Response.json({
            success: true,
            accessToken: connectTokenData.accessToken
        });

    } catch (error) {
        console.error('Erro geral:', error);
        return Response.json({
            success: false,
            error: error.message || 'Erro interno do servidor',
            stack: error.stack
        }, { status: 500 });
    }
});