import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Loader2, Link as LinkIcon } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { base44 } from "@/api/base44Client";

export default function ConnectBankButton({ onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [loadingScript, setLoadingScript] = useState(true);

  useEffect(() => {
    let checkInterval;
    
    const loadScript = () => {
      console.log('🔄 Iniciando carregamento do script Pluggy...');
      
      // Verifica se já existe
      if (window.PluggyConnect) {
        console.log('✅ PluggyConnect já existe!');
        setScriptLoaded(true);
        setLoadingScript(false);
        return;
      }

      // Remove script existente se houver
      const existingScript = document.querySelector('script[src*="pluggy-connect"]');
      if (existingScript) {
        console.log('🗑️ Removendo script antigo...');
        existingScript.remove();
      }

      const script = document.createElement('script');
      script.src = 'https://cdn.pluggy.ai/pluggy-connect/v3/pluggy-connect.js';
      script.async = true;
      script.id = 'pluggy-connect-script';
      
      script.onload = () => {
        console.log('📦 Script carregado, aguardando PluggyConnect...');
        
        // Verifica múltiplas vezes se o PluggyConnect está disponível
        let attempts = 0;
        checkInterval = setInterval(() => {
          attempts++;
          console.log(`🔍 Tentativa ${attempts} de encontrar PluggyConnect...`);
          
          if (window.PluggyConnect) {
            console.log('✅ PluggyConnect encontrado!');
            clearInterval(checkInterval);
            setScriptLoaded(true);
            setLoadingScript(false);
          } else if (attempts > 20) {
            console.error('❌ Timeout: PluggyConnect não foi carregado após 20 tentativas');
            clearInterval(checkInterval);
            setError('Componente não carregou. Recarregue a página (F5) e tente novamente.');
            setLoadingScript(false);
          }
        }, 200);
      };
      
      script.onerror = (e) => {
        console.error('❌ Erro ao carregar script:', e);
        setError('Erro ao carregar componente. Verifique sua conexão de internet.');
        setLoadingScript(false);
      };

      console.log('📥 Adicionando script ao DOM...');
      document.head.appendChild(script);
    };

    loadScript();

    return () => {
      if (checkInterval) {
        clearInterval(checkInterval);
      }
    };
  }, []);

  const connectBank = async () => {
    console.log('🚀 Iniciando conexão bancária...');
    setLoading(true);
    setError(null);

    try {
      console.log('🔑 1. Solicitando token...');
      
      const response = await base44.functions.invoke('createPluggyConnectToken', {});
      
      console.log('📦 2. Resposta recebida:', { 
        success: response.data?.success, 
        hasToken: !!response.data?.accessToken 
      });

      if (!response.data?.success) {
        throw new Error(response.data?.error || 'Erro ao criar token');
      }

      if (!response.data.accessToken) {
        throw new Error('Token não foi retornado');
      }

      console.log('✅ 3. Token obtido com sucesso');

      if (!window.PluggyConnect) {
        throw new Error('O componente Pluggy não está disponível. Recarregue a página (F5).');
      }

      console.log('🎨 4. Criando widget Pluggy...');

      const pluggyConnect = new window.PluggyConnect({
        connectToken: response.data.accessToken,
        includeSandbox: true,
        onSuccess: async (itemData) => {
          console.log('✅ Banco conectado com sucesso!', itemData);
          
          if (onSuccess) {
            await onSuccess(itemData);
          }
          
          setLoading(false);
        },
        onError: (error) => {
          console.error('❌ Erro no widget:', error);
          setError('Erro ao conectar: ' + (error?.message || 'Tente novamente'));
          setLoading(false);
        },
        onClose: () => {
          console.log('🚪 Widget fechado pelo usuário');
          setLoading(false);
        },
      });

      console.log('📱 5. Abrindo widget...');
      pluggyConnect.init();
      
    } catch (err) {
      console.error('❌ Erro geral:', err);
      
      let errorMessage = 'Erro ao conectar banco';
      
      if (err?.message) {
        if (err.message.includes('Credenciais') || err.message.includes('inválidas')) {
          errorMessage = '⚠️ Configure as credenciais do Pluggy primeiro (veja instruções acima)';
        } else if (err.message.includes('componente') || err.message.includes('disponível')) {
          errorMessage = err.message;
        } else if (err.message.includes('Token')) {
          errorMessage = '⚠️ Erro nas credenciais do Pluggy. Verifique os secrets configurados.';
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {loadingScript && (
        <Alert className="border-blue-200 bg-blue-50">
          <AlertDescription className="text-blue-900 flex items-center gap-2 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            Carregando componente de conexão bancária...
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
        <Alert variant="destructive">
          <AlertDescription className="text-sm">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {!scriptLoaded && !loadingScript && !error && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertDescription className="text-orange-900 text-sm">
            ⚠️ Componente não carregou completamente. Recarregue a página (F5) e tente novamente.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}