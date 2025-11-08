import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Loader2, Link as LinkIcon, RefreshCw, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { base44 } from "@/api/base44Client";

export default function ConnectBankButton({ onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [scriptStatus, setScriptStatus] = useState('loading'); // loading, loaded, failed
  const [diagnostics, setDiagnostics] = useState(null);

  useEffect(() => {
    loadScript();
  }, []);

  const runDiagnostics = () => {
    const results = {
      pluggyAvailable: !!window.PluggyConnect,
      adBlockerDetected: false,
      scriptInDOM: false,
      consoleErrors: []
    };

    // Verifica se o script está no DOM
    const scripts = document.querySelectorAll('script[src*="pluggy"]');
    results.scriptInDOM = scripts.length > 0;

    // Tenta detectar bloqueador
    const testDiv = document.createElement('div');
    testDiv.className = 'ad advertisement adsbox';
    testDiv.style.height = '1px';
    document.body.appendChild(testDiv);
    
    setTimeout(() => {
      if (testDiv.offsetHeight === 0) {
        results.adBlockerDetected = true;
      }
      document.body.removeChild(testDiv);
      setDiagnostics(results);
    }, 100);
  };

  const loadScript = () => {
    console.log('🔄 Iniciando carregamento do Pluggy Connect...');
    setScriptStatus('loading');
    
    if (window.PluggyConnect) {
      console.log('✅ PluggyConnect já disponível!');
      setScriptStatus('loaded');
      runDiagnostics();
      return;
    }

    // Remove scripts antigos
    const oldScripts = document.querySelectorAll('script[src*="pluggy"]');
    oldScripts.forEach(s => {
      console.log('🗑️ Removendo script antigo');
      s.remove();
    });

    const script = document.createElement('script');
    script.src = 'https://cdn.pluggy.ai/pluggy-connect/v3/pluggy-connect.js';
    script.async = true;
    script.id = 'pluggy-connect-script';
    
    let loadTimeout;
    
    script.onload = () => {
      console.log('📦 Script carregado do CDN');
      clearTimeout(loadTimeout);
      
      // Verifica se PluggyConnect está disponível
      let attempts = 0;
      const checkInterval = setInterval(() => {
        attempts++;
        console.log(`🔍 Tentativa ${attempts}/30 de encontrar PluggyConnect...`);
        
        if (window.PluggyConnect) {
          console.log('✅ PluggyConnect encontrado e pronto!');
          clearInterval(checkInterval);
          setScriptStatus('loaded');
          runDiagnostics();
        } else if (attempts > 30) {
          console.error('❌ PluggyConnect não foi encontrado após 30 tentativas');
          clearInterval(checkInterval);
          setScriptStatus('failed');
          setError('O componente Pluggy não inicializou. Provavelmente há um bloqueador de anúncios ativo.');
          runDiagnostics();
        }
      }, 200);
    };
    
    script.onerror = (e) => {
      console.error('❌ ERRO ao carregar script do CDN:', e);
      clearTimeout(loadTimeout);
      setScriptStatus('failed');
      setError(`Não foi possível carregar o Pluggy Connect do servidor.

🚨 BLOQUEADOR DE ANÚNCIOS DETECTADO

Por favor, DESATIVE seu bloqueador de anúncios:
1. Clique no ícone do bloqueador (canto superior direito)
2. Escolha "Pausar neste site" ou "Desativar"
3. Recarregue esta página (F5)

OU teste em modo anônimo (Ctrl+Shift+N)`);
      runDiagnostics();
    };

    // Timeout de segurança
    loadTimeout = setTimeout(() => {
      if (scriptStatus === 'loading') {
        console.error('⏱️ Timeout ao carregar script');
        setScriptStatus('failed');
        setError('Tempo esgotado ao carregar. Bloqueador de anúncios pode estar ativo.');
        runDiagnostics();
      }
    }, 10000);

    console.log('📡 Adicionando script ao DOM...');
    document.head.appendChild(script);
  };

  const connectBank = async () => {
    console.log('🚀 Iniciando conexão com banco...');
    
    if (!window.PluggyConnect) {
      console.error('❌ PluggyConnect não está disponível');
      setError(`PluggyConnect não carregou.

🔴 AÇÃO NECESSÁRIA:
1. DESATIVE o bloqueador de anúncios
2. Clique em "Tentar Novamente" abaixo
3. OU pressione F5 para recarregar a página

Se o problema persistir, abra em modo anônimo (Ctrl+Shift+N)`);
      runDiagnostics();
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('🔑 Solicitando token de acesso...');
      const response = await base44.functions.invoke('createPluggyConnectToken', {});

      console.log('📨 Resposta do servidor:', response.data);

      if (!response.data?.success) {
        throw new Error(response.data?.error || 'Erro ao criar token de acesso');
      }

      if (!response.data.accessToken) {
        throw new Error('Token não foi retornado pelo servidor');
      }

      console.log('✅ Token obtido com sucesso!');
      console.log('🎯 Inicializando Pluggy Connect...');

      const pluggyConnect = new window.PluggyConnect({
        connectToken: response.data.accessToken,
        includeSandbox: true,
        onSuccess: async (itemData) => {
          console.log('🎉 Banco conectado com sucesso!', itemData);
          if (onSuccess) await onSuccess(itemData);
          setLoading(false);
        },
        onError: (error) => {
          console.error('❌ Erro no Pluggy:', error);
          setError('Erro ao conectar: ' + (error?.message || 'Tente novamente'));
          setLoading(false);
        },
        onClose: () => {
          console.log('🚪 Widget do Pluggy foi fechado');
          setLoading(false);
        },
      });

      console.log('▶️ Abrindo widget do Pluggy...');
      pluggyConnect.init();
      
    } catch (err) {
      console.error('❌ Erro na conexão:', err);
      
      let errorMsg = err.message || 'Erro desconhecido';
      
      if (errorMsg.includes('Credenciais') || errorMsg.includes('inválidas')) {
        errorMsg = `⚠️ CREDENCIAIS NÃO CONFIGURADAS

Vá em: Dashboard → Settings → Secrets
Adicione:
- PLUGGY_CLIENT_ID
- PLUGGY_CLIENT_SECRET

Veja as instruções na página.`;
      }
      
      setError(errorMsg);
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Status do carregamento */}
      {scriptStatus === 'loading' && (
        <Alert className="border-blue-200 bg-blue-50">
          <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
          <AlertDescription className="text-blue-900 text-sm">
            Carregando componente Pluggy Connect...
          </AlertDescription>
        </Alert>
      )}

      {scriptStatus === 'loaded' && !error && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-900 text-sm">
            Componente carregado! Pronto para conectar.
          </AlertDescription>
        </Alert>
      )}

      {/* Botão principal - SEMPRE VISÍVEL */}
      <Button
        onClick={connectBank}
        disabled={loading}
        className="bg-blue-600 hover:bg-blue-700 w-full text-base font-semibold"
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
            Conectar Banco
          </>
        )}
      </Button>

      {/* Diagnóstico detalhado */}
      {diagnostics && scriptStatus === 'failed' && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-900 text-xs space-y-2">
            <p className="font-semibold">Diagnóstico:</p>
            <ul className="list-disc list-inside space-y-1">
              <li className={diagnostics.pluggyAvailable ? 'text-green-700' : 'text-red-700'}>
                {diagnostics.pluggyAvailable ? '✅' : '❌'} Pluggy disponível
              </li>
              <li className={!diagnostics.adBlockerDetected ? 'text-green-700' : 'text-red-700'}>
                {!diagnostics.adBlockerDetected ? '✅' : '🚨'} Bloqueador de anúncios {diagnostics.adBlockerDetected ? 'DETECTADO' : 'não detectado'}
              </li>
              <li className={diagnostics.scriptInDOM ? 'text-green-700' : 'text-red-700'}>
                {diagnostics.scriptInDOM ? '✅' : '❌'} Script no DOM
              </li>
            </ul>
            {diagnostics.adBlockerDetected && (
              <p className="font-bold text-red-700 mt-2">
                ⚠️ BLOQUEADOR ATIVO! Desative para continuar.
              </p>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Mensagens de erro */}
      {error && (
        <div className="space-y-2">
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription className="text-sm whitespace-pre-line">
              {error}
            </AlertDescription>
          </Alert>
          
          <Button 
            variant="outline" 
            onClick={() => {
              setError(null);
              setScriptStatus('loading');
              loadScript();
            }}
            className="w-full"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Tentar Novamente
          </Button>
        </div>
      )}

      {/* Instruções sempre visíveis */}
      <Alert className="border-slate-200 bg-slate-50">
        <AlertDescription className="text-slate-700 text-xs">
          <strong>💡 Dica:</strong> Se o botão não funcionar, abra o Console (F12) e veja os logs detalhados.
        </AlertDescription>
      </Alert>
    </div>
  );
}