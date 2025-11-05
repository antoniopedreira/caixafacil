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

        if (!clientId || !clientSecret) {
            return Response.json({
                success: false,
                error: 'Credenciais do Pluggy não configuradas. Por favor, configure PLUGGY_CLIENT_ID e PLUGGY_CLIENT_SECRET nos secrets.'
            }, { status: 500 });
        }

        // Obtém API Key do Pluggy
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

        if (!authResponse.ok) {
            const errorData = await authResponse.text();
            console.error('Erro na autenticação Pluggy:', errorData);
            return Response.json({
                success: false,
                error: 'Falha na autenticação com Pluggy. Verifique suas credenciais.'
            }, { status: 500 });
        }

        const authData = await authResponse.json();

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

        if (!connectTokenResponse.ok) {
            const errorData = await connectTokenResponse.text();
            console.error('Erro ao criar connect token:', errorData);
            return Response.json({
                success: false,
                error: 'Falha ao criar token de conexão'
            }, { status: 500 });
        }

        const connectTokenData = await connectTokenResponse.json();

        return Response.json({
            success: true,
            accessToken: connectTokenData.accessToken
        });

    } catch (error) {
        console.error('Erro:', error);
        return Response.json({
            success: false,
            error: error.message || 'Erro interno do servidor'
        }, { status: 500 });
    }
});