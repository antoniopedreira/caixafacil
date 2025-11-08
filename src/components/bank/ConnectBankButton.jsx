import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Loader2, Link as LinkIcon, RefreshCw, AlertTriangle } from "lucide-react";
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
    console.log('🔄 Carregando Pluggy Connect...');
    
    if (window.PluggyConnect) {
      console.log('✅ PluggyConnect já disponível');
      setScriptLoaded(true);
      setLoadingScript(false);
      return;
    }

    // Remove scripts antigos
    const oldScripts = document.querySelectorAll('script[src*="pluggy"]');
    oldScripts.forEach(s => s.remove());

    const script = document.createElement('script');
    script.src = 'https://cdn.pluggy.ai/pluggy-connect/v3/pluggy-connect.js';
    script.async = true;
    
    script.onload = () => {
      console.log('📦 Script carregado');
      
      // Verifica se PluggyConnect está disponível
      let attempts = 0;
      const checkInterval = setInterval(() => {
        attempts++;
        if (window.PluggyConnect) {
          console.log('✅ PluggyConnect pronto!');
          clearInterval(checkInterval);
          setScriptLoaded(true);
          setLoadingScript(false);
        } else if (attempts > 20) {
          clearInterval(checkInterval);
          setError('Componente não carregou. Recarregue a página (F5).');
          setLoadingScript(false);
        }
      }, 200);
    };
    
    script.onerror = () => {
      console.error('❌ Erro ao carregar CDN');
      setError(`⚠️ Não foi possível carregar o Pluggy Connect.

SOLUÇÕES:
1. Desative bloqueadores de anúncios
2. Adicione exceção para cdn.pluggy.ai
3. Teste no modo anônimo (Ctrl+Shift+N)
4. Use outro navegador`);
      setLoadingScript(false);
    };

    document.head.appendChild(script);
  };

  const connectBank = async () => {
    console.log('🚀 Conectando banco...');
    setLoading(true);
    setError(null);

    try {
      if (!window.PluggyConnect) {
        throw new Error('Pluggy não está carregado. Recarregue a página (F5).');
      }

      console.log('🔑 Solicitando token...');
      const response = await base44.functions.invoke('createPluggyConnectToken', {});

      if (!response.data?.success) {
        throw new Error(response.data?.error || 'Erro ao criar token');
      }

      if (!response.data.accessToken) {
        throw new Error('Token não foi retornado');
      }

      console.log('✅ Token obtido');

      const pluggyConnect = new window.PluggyConnect({
        connectToken: response.data.accessToken,
        includeSandbox: true,
        onSuccess: async (itemData) => {
          console.log('✅ Banco conectado!');
          if (onSuccess) await onSuccess(itemData);
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

      pluggyConnect.init();
      
    } catch (err) {
      console.error('❌ Erro:', err);
      
      let errorMsg = err.message || 'Erro desconhecido';
      
      if (errorMsg.includes('Credenciais') || errorMsg.includes('inválidas')) {
        errorMsg = '⚠️ Configure as credenciais do Pluggy (veja instruções acima)';
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
            Carregando componente...
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