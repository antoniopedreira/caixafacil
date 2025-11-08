import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Loader2, Link as LinkIcon, RefreshCw, AlertTriangle, CheckCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { base44 } from "@/api/base44Client";

export default function ConnectBankButton({ onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [loadingScript, setLoadingScript] = useState(true);

  useEffect(() => {
    loadScript();
  }, []);

  const loadScript = () => {
    console.log('🔄 Carregando Iniciador Connect...');
    
    if (window.IniciadorConnect) {
      console.log('✅ IniciadorConnect já disponível');
      setScriptLoaded(true);
      setLoadingScript(false);
      return;
    }

    // Remove scripts antigos
    const oldScripts = document.querySelectorAll('script[src*="iniciador"]');
    oldScripts.forEach(s => s.remove());

    const script = document.createElement('script');
    script.src = 'https://cdn.iniciador.com.br/widget/v1/iniciador-connect.js';
    script.async = true;
    
    script.onload = () => {
      console.log('📦 Script carregado');
      
      let attempts = 0;
      const checkInterval = setInterval(() => {
        attempts++;
        if (window.IniciadorConnect) {
          console.log('✅ IniciadorConnect pronto!');
          clearInterval(checkInterval);
          setScriptLoaded(true);
          setLoadingScript(false);
        } else if (attempts > 20) {
          clearInterval(checkInterval);
          setError('Componente não carregou. Tente recarregar (F5) ou desative bloqueadores.');
          setLoadingScript(false);
        }
      }, 200);
    };
    
    script.onerror = () => {
      console.error('❌ Erro ao carregar CDN');
      setError(`⚠️ Não foi possível carregar o Iniciador Connect.

SOLUÇÕES:
1. Desative bloqueadores de anúncios
2. Teste no modo anônimo (Ctrl+Shift+N)
3. Use outro navegador (Chrome/Edge)
4. Tente recarregar a página (F5)`);
      setLoadingScript(false);
    };

    document.head.appendChild(script);
  };

  const connectBank = async () => {
    console.log('🚀 Conectando banco via Iniciador...');
    setLoading(true);
    setError(null);

    try {
      if (!window.IniciadorConnect) {
        throw new Error('Iniciador não está carregado. Recarregue a página (F5).');
      }

      console.log('🔑 Solicitando token...');
      const response = await base44.functions.invoke('createIniciadorToken', {});

      if (!response.data?.success) {
        throw new Error(response.data?.error || 'Erro ao criar token');
      }

      if (!response.data.connectToken) {
        throw new Error('Token não foi retornado');
      }

      console.log('✅ Token obtido');

      const iniciadorConnect = new window.IniciadorConnect({
        token: response.data.connectToken,
        environment: 'production',
        onSuccess: async (data) => {
          console.log('✅ Banco conectado!', data);
          if (onSuccess) await onSuccess({
            item: {
              id: data.consent_id,
              connector: {
                name: data.institution_name || 'Banco',
                imageUrl: data.institution_logo || '',
                id: data.institution_id
              }
            }
          });
          setLoading(false);
        },
        onError: (error) => {
          console.error('❌ Erro:', error);
          setError('Erro ao conectar: ' + (error?.message || 'Tente novamente'));
          setLoading(false);
        },
        onClose: () => {
          console.log('🚪 Widget fechado');
          setLoading(false);
        },
      });

      iniciadorConnect.open();
      
    } catch (err) {
      console.error('❌ Erro:', err);
      
      let errorMsg = err.message || 'Erro desconhecido';
      
      if (errorMsg.includes('Credenciais') || errorMsg.includes('não configuradas')) {
        errorMsg = `⚠️ CONFIGURE AS CREDENCIAIS DO INICIADOR

1. Acesse: https://dashboard.iniciador.com.br
2. Faça login e vá em "API Keys"
3. Copie seu Client ID e Client Secret
4. No CaixaFácil: Dashboard → Settings → Secrets
5. Adicione:
   • INICIADOR_CLIENT_ID
   • INICIADOR_CLIENT_SECRET
6. Volte aqui e tente novamente!`;
      }
      
      setError(errorMsg);
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {loadingScript && (
        <Alert className="border-blue-200 bg-blue-50">
          <AlertDescription className="text-blue-900 flex items-center gap-2 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            Carregando componente do Iniciador...
          </AlertDescription>
        </Alert>
      )}

      {scriptLoaded && !loadingScript && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-900 text-sm">
            ✅ Iniciador Connect carregado! Pronto para conectar.
          </AlertDescription>
        </Alert>
      )}

      <Button
        onClick={connectBank}
        disabled={loading || !scriptLoaded || loadingScript}
        className="bg-blue-600 hover:bg-blue-700 w-full text-base"
        size="lg"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Conectando...
          </>
        ) : (
          <>
            <LinkIcon className="w-5 h-5 mr-2" />
            {loadingScript ? 'Carregando...' : 'Conectar Banco'}
          </>
        )}
      </Button>

      {error && (
        <div className="space-y-2">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-sm whitespace-pre-line">
              {error}
            </AlertDescription>
          </Alert>
          
          <Button 
            variant="outline" 
            onClick={loadScript}
            className="w-full"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Tentar Novamente
          </Button>
        </div>
      )}
    </div>
  );
}