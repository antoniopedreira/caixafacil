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
  const [debugInfo, setDebugInfo] = useState([]);
  const [cdnBlocked, setCdnBlocked] = useState(false);

  const addDebugInfo = (message) => {
    console.log(message);
    setDebugInfo(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  useEffect(() => {
    loadPluggyScript();
  }, []);

  const testCdnAccess = async () => {
    try {
      addDebugInfo('🧪 Testando acesso ao CDN do Pluggy...');
      const response = await fetch('https://cdn.pluggy.ai/pluggy-connect/v3/pluggy-connect.js', { 
        method: 'HEAD',
        mode: 'no-cors' // Permite testar sem CORS
      });
      addDebugInfo('✅ CDN acessível (ou modo no-cors passou)');
      return true;
    } catch (error) {
      addDebugInfo(`❌ CDN não acessível: ${error.message}`);
      return false;
    }
  };

  const loadPluggyScript = async () => {
    setLoadingScript(true);
    setScriptLoaded(false);
    setError(null);
    setCdnBlocked(false);
    setDebugInfo([]);
    
    addDebugInfo('🔄 Iniciando carregamento do Pluggy Connect...');
    
    // Verifica se já existe
    if (window.PluggyConnect) {
      addDebugInfo('✅ PluggyConnect já disponível!');
      setScriptLoaded(true);
      setLoadingScript(false);
      return;
    }

    // Testa acesso ao CDN primeiro
    const cdnAccessible = await testCdnAccess();
    
    // Remove scripts existentes
    const existingScripts = document.querySelectorAll('script[src*="pluggy"]');
    if (existingScripts.length > 0) {
      addDebugInfo(`🗑️ Removendo ${existingScripts.length} script(s) antigo(s) do Pluggy...`);
      existingScripts.forEach(s => s.remove());
    }

    const PLUGGY_CDN_URL = 'https://cdn.pluggy.ai/pluggy-connect/v3/pluggy-connect.js';
    addDebugInfo(`📥 URL do script: ${PLUGGY_CDN_URL}`);

    const script = document.createElement('script');
    script.src = PLUGGY_CDN_URL;
    script.async = true;
    script.id = 'pluggy-connect-script';
    script.crossOrigin = 'anonymous';
    
    let attempts = 0;
    let checkInterval;
    let scriptErrorOccurred = false;
    
    script.onload = () => {
      addDebugInfo('📦 Script carregado do CDN com sucesso');
      
      checkInterval = setInterval(() => {
        attempts++;
        addDebugInfo(`🔍 Verificando PluggyConnect (tentativa ${attempts})...`);
        
        if (window.PluggyConnect) {
          addDebugInfo(`✅ PluggyConnect disponível após ${attempts} tentativa(s)!`);
          clearInterval(checkInterval);
          setScriptLoaded(true);
          setLoadingScript(false);
        } else if (attempts > 30) {
          addDebugInfo('❌ Timeout: PluggyConnect não foi encontrado após 30 tentativas');
          clearInterval(checkInterval);
          setError('O componente Pluggy carregou mas não inicializou. Tente recarregar a página (F5).');
          setLoadingScript(false);
        }
      }, 200);
    };
    
    script.onerror = (e) => {
      scriptErrorOccurred = true;
      addDebugInfo(`❌ ERRO ao carregar script do CDN`);
      addDebugInfo(`Tipo de erro: ${e.type || 'desconhecido'}`);
      addDebugInfo(`URL tentada: ${PLUGGY_CDN_URL}`);
      
      setCdnBlocked(true);
      
      setError(`Não foi possível carregar o Pluggy Connect do CDN.

🚨 CAUSA MAIS PROVÁVEL: Bloqueador de anúncios

📋 SOLUÇÕES (tente nesta ordem):

1️⃣ **Desative bloqueadores de anúncios** para esta página:
   • uBlock Origin
   • AdBlock
   • Brave Shields
   • Extensões antivírus

2️⃣ **Adicione exceção para cdn.pluggy.ai** no seu bloqueador

3️⃣ **Use o modo anônimo** do navegador (Ctrl+Shift+N)

4️⃣ **Teste em outro navegador** (Chrome, Firefox, Edge)

5️⃣ **Verifique firewall corporativo** se estiver no trabalho

Após fazer uma das ações acima, clique em "Tentar Carregar Novamente"`);
      setLoadingScript(false);
    };

    addDebugInfo('📥 Adicionando script ao documento...');
    document.head.appendChild(script);

    // Timeout geral de 10 segundos
    setTimeout(() => {
      if (checkInterval && !scriptLoaded && !scriptErrorOccurred) {
        clearInterval(checkInterval);
        if (!error) {
          addDebugInfo('⏱️ Timeout geral atingido (10s)');
          setError('Tempo limite excedido. O script pode estar sendo bloqueado. Veja as soluções acima.');
          setLoadingScript(false);
          setCdnBlocked(true);
        }
      }
    }, 10000);
  };

  const connectBank = async () => {
    addDebugInfo('🚀 Iniciando processo de conexão bancária...');
    setLoading(true);
    setError(null);

    try {
      if (!window.PluggyConnect) {
        addDebugInfo('❌ PluggyConnect não está disponível no window');
        throw new Error('O componente Pluggy não está carregado. Por favor, recarregue a página (F5) e tente novamente.');
      }

      addDebugInfo('🔑 Solicitando token de acesso...');
      
      const response = await base44.functions.invoke('createPluggyConnectToken', {});
      
      addDebugInfo(`📦 Resposta recebida - Status: ${response.status}`);
      addDebugInfo(`📦 Dados: ${JSON.stringify({ success: response.data?.success, hasToken: !!response.data?.accessToken })}`);

      if (!response.data?.success) {
        const errorMsg = response.data?.error || 'Erro desconhecido ao criar token';
        addDebugInfo(`❌ Erro do servidor: ${errorMsg}`);
        throw new Error(errorMsg);
      }

      if (!response.data.accessToken) {
        addDebugInfo('❌ Token não retornado pelo servidor');
        throw new Error('Token de acesso não foi retornado. Verifique as credenciais do Pluggy.');
      }

      addDebugInfo('✅ Token obtido, criando widget...');

      const pluggyConnect = new window.PluggyConnect({
        connectToken: response.data.accessToken,
        includeSandbox: true,
        onSuccess: async (itemData) => {
          addDebugInfo('✅ Banco conectado com sucesso!');
          addDebugInfo(`Item ID: ${itemData?.item?.id}`);
          
          if (onSuccess) {
            await onSuccess(itemData);
          }
          
          setLoading(false);
        },
        onError: (error) => {
          addDebugInfo(`❌ Erro no widget Pluggy: ${error?.message || 'Erro desconhecido'}`);
          setError('Erro ao conectar com o banco: ' + (error?.message || 'Tente novamente'));
          setLoading(false);
        },
        onClose: () => {
          addDebugInfo('🚪 Widget fechado pelo usuário');
          setLoading(false);
        },
      });

      addDebugInfo('📱 Abrindo widget do Pluggy...');
      pluggyConnect.init();
      
    } catch (err) {
      addDebugInfo(`❌ Erro geral: ${err.message}`);
      
      let errorMessage = 'Erro ao conectar banco';
      
      if (err?.message?.includes('Credenciais') || err?.message?.includes('inválidas')) {
        errorMessage = '⚠️ Credenciais do Pluggy inválidas ou não configuradas. Verifique os secrets PLUGGY_CLIENT_ID e PLUGGY_CLIENT_SECRET.';
      } else if (err?.message?.includes('Token')) {
        errorMessage = '⚠️ ' + err.message;
      } else if (err?.message?.includes('não está carregado') || err?.message?.includes('disponível')) {
        errorMessage = err.message;
      } else {
        errorMessage = err.message || errorMessage;
      }
      
      setError(errorMessage);
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {loadingScript && !cdnBlocked && (
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

      {cdnBlocked && (
        <Alert variant="destructive" className="border-2">
          <AlertTriangle className="h-5 w-5" />
          <AlertDescription className="text-sm">
            <div className="space-y-3">
              <p className="font-bold text-base">🚨 Bloqueador de Anúncios Detectado</p>
              <p>O CDN do Pluggy (cdn.pluggy.ai) está sendo bloqueado.</p>
              
              <div className="bg-rose-100 rounded-lg p-3 space-y-2">
                <p className="font-semibold">✅ Soluções Rápidas:</p>
                <ol className="list-decimal list-inside space-y-1 text-sm">
                  <li>Desative bloqueadores de anúncios nesta página</li>
                  <li>Adicione exceção para <code className="bg-rose-200 px-1 rounded">cdn.pluggy.ai</code></li>
                  <li>Teste no modo anônimo (Ctrl+Shift+N)</li>
                  <li>Use outro navegador</li>
                </ol>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {error && !cdnBlocked && (
        <div className="space-y-2">
          <Alert variant="destructive">
            <AlertDescription className="text-sm whitespace-pre-line">
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
        </div>
      )}

      {(cdnBlocked || (!scriptLoaded && !loadingScript)) && (
        <Button 
          variant="outline" 
          onClick={loadPluggyScript}
          className="w-full border-2 border-orange-300 hover:bg-orange-50"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Tentar Carregar Novamente
        </Button>
      )}
      
      {/* Debug info */}
      {debugInfo.length > 0 && (
        <details className="text-xs bg-slate-50 p-3 rounded-lg border border-slate-200">
          <summary className="cursor-pointer font-semibold text-slate-700 mb-2">
            📋 Logs de Diagnóstico (clique para expandir)
          </summary>
          <div className="space-y-1 text-slate-600 max-h-60 overflow-y-auto font-mono">
            {debugInfo.map((info, i) => (
              <div key={i} className="border-b border-slate-200 pb-1">
                {info}
              </div>
            ))}
          </div>
        </details>
      )}

      {scriptLoaded && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-900 text-sm">
            ✅ Componente carregado com sucesso! Clique em "Conectar Banco" para começar.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}