import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Loader2, Link as LinkIcon, RefreshCw } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { base44 } from "@/api/base44Client";

export default function ConnectBankButton({ onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [loadingScript, setLoadingScript] = useState(true);
  const [debugInfo, setDebugInfo] = useState([]);

  const addDebugInfo = (message) => {
    console.log(message);
    setDebugInfo(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  useEffect(() => {
    loadPluggyScript();
  }, []);

  const loadPluggyScript = () => {
    setLoadingScript(true);
    setScriptLoaded(false);
    setError(null);
    setDebugInfo([]);
    
    addDebugInfo('🔄 Iniciando carregamento do script Pluggy...');
    
    // Verifica se já existe
    if (window.PluggyConnect) {
      addDebugInfo('✅ PluggyConnect já disponível!');
      setScriptLoaded(true);
      setLoadingScript(false);
      return;
    }

    // Remove script existente
    const existingScript = document.querySelector('script[src*="pluggy-connect"]');
    if (existingScript) {
      addDebugInfo('🗑️ Removendo script antigo...');
      existingScript.remove();
    }

    const script = document.createElement('script');
    script.src = 'https://cdn.pluggy.ai/pluggy-connect/v3/pluggy-connect.js';
    script.async = true;
    script.id = 'pluggy-connect-script';
    
    let attempts = 0;
    let checkInterval;
    
    script.onload = () => {
      addDebugInfo('📦 Script carregado, verificando PluggyConnect...');
      
      checkInterval = setInterval(() => {
        attempts++;
        
        if (window.PluggyConnect) {
          addDebugInfo(`✅ PluggyConnect encontrado após ${attempts} tentativas!`);
          clearInterval(checkInterval);
          setScriptLoaded(true);
          setLoadingScript(false);
        } else if (attempts > 30) {
          addDebugInfo('❌ Timeout: PluggyConnect não foi encontrado');
          clearInterval(checkInterval);
          setError('Componente não carregou. Possíveis causas: bloqueador de anúncios, firewall ou problema de conexão.');
          setLoadingScript(false);
        }
      }, 200);
    };
    
    script.onerror = (e) => {
      addDebugInfo('❌ Erro ao carregar script do CDN');
      setError('Não foi possível carregar o componente do Pluggy. Verifique: 1) Sua conexão com internet 2) Se há bloqueador de anúncios ativo 3) Se o firewall está bloqueando cdn.pluggy.ai');
      setLoadingScript(false);
    };

    addDebugInfo('📥 Adicionando script ao documento...');
    document.head.appendChild(script);

    // Timeout geral
    setTimeout(() => {
      if (checkInterval && !scriptLoaded) {
        clearInterval(checkInterval);
        if (!error) {
          addDebugInfo('⏱️ Timeout geral atingido');
          setError('Tempo esgotado. Recarregue a página (F5) e tente novamente.');
          setLoadingScript(false);
        }
      }
    }, 10000);
  };

  const connectBank = async () => {
    addDebugInfo('🚀 Iniciando conexão bancária...');
    setLoading(true);
    setError(null);

    try {
      addDebugInfo('🔑 Solicitando token de conexão...');
      
      const response = await base44.functions.invoke('createPluggyConnectToken', {});
      
      addDebugInfo(`📦 Resposta recebida: ${JSON.stringify({ success: response.data?.success, hasToken: !!response.data?.accessToken })}`);

      if (!response.data?.success) {
        const errorMsg = response.data?.error || 'Erro desconhecido';
        addDebugInfo(`❌ Erro na resposta: ${errorMsg}`);
        throw new Error(errorMsg);
      }

      if (!response.data.accessToken) {
        addDebugInfo('❌ Token não foi retornado');
        throw new Error('Token não foi retornado pelo servidor');
      }

      addDebugInfo('✅ Token obtido com sucesso');

      if (!window.PluggyConnect) {
        addDebugInfo('❌ PluggyConnect não disponível');
        throw new Error('O componente Pluggy não está disponível. Tente recarregar.');
      }

      addDebugInfo('🎨 Criando widget Pluggy...');

      const pluggyConnect = new window.PluggyConnect({
        connectToken: response.data.accessToken,
        includeSandbox: true,
        onSuccess: async (itemData) => {
          addDebugInfo('✅ Banco conectado com sucesso!');
          
          if (onSuccess) {
            await onSuccess(itemData);
          }
          
          setLoading(false);
        },
        onError: (error) => {
          addDebugInfo(`❌ Erro no widget: ${error?.message || 'Erro desconhecido'}`);
          setError('Erro ao conectar: ' + (error?.message || 'Tente novamente'));
          setLoading(false);
        },
        onClose: () => {
          addDebugInfo('🚪 Widget fechado pelo usuário');
          setLoading(false);
        },
      });

      addDebugInfo('📱 Abrindo widget...');
      pluggyConnect.init();
      
    } catch (err) {
      addDebugInfo(`❌ Erro geral: ${err.message}`);
      
      let errorMessage = 'Erro ao conectar banco';
      
      if (err?.message?.includes('Credenciais') || err?.message?.includes('inválidas')) {
        errorMessage = '⚠️ Credenciais do Pluggy não configuradas ou inválidas. Veja as instruções acima.';
      } else if (err?.message?.includes('Token')) {
        errorMessage = '⚠️ Erro ao gerar token. Verifique as credenciais do Pluggy nas configurações.';
      } else {
        errorMessage = err.message || errorMessage;
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
        <div className="space-y-2">
          <Alert variant="destructive">
            <AlertDescription className="text-sm">
              {error}
            </AlertDescription>
          </Alert>
          
          {!scriptLoaded && (
            <Button 
              variant="outline" 
              onClick={loadPluggyScript}
              className="w-full"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Tentar Carregar Novamente
            </Button>
          )}
          
          {/* Debug info - mostrar apenas em desenvolvimento */}
          {debugInfo.length > 0 && (
            <details className="text-xs bg-slate-50 p-3 rounded-lg">
              <summary className="cursor-pointer font-semibold text-slate-700 mb-2">
                Informações de diagnóstico
              </summary>
              <div className="space-y-1 text-slate-600 max-h-40 overflow-y-auto">
                {debugInfo.map((info, i) => (
                  <div key={i}>{info}</div>
                ))}
              </div>
            </details>
          )}
        </div>
      )}

      {!scriptLoaded && !loadingScript && !error && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertDescription className="text-orange-900 text-sm">
            ⚠️ Componente não carregou. Tente recarregar a página (F5) ou clique em "Tentar Carregar Novamente".
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}