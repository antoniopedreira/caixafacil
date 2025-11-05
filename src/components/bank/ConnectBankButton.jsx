import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Loader2, Link as LinkIcon } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { base44 } from "@/api/base44Client";

export default function ConnectBankButton({ onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  // Pré-carrega o script do Pluggy quando o componente é montado
  useEffect(() => {
    const loadScript = () => {
      if (window.PluggyConnect) {
        setScriptLoaded(true);
        return;
      }

      const existingScript = document.querySelector('script[src*="pluggy-connect"]');
      if (existingScript) {
        existingScript.remove();
      }

      const script = document.createElement('script');
      script.src = 'https://cdn.pluggy.ai/pluggy-connect/v3/pluggy-connect.js';
      script.async = true;
      
      script.onload = () => {
        console.log('✅ Script do Pluggy carregado');
        setTimeout(() => {
          if (window.PluggyConnect) {
            setScriptLoaded(true);
          }
        }, 200);
      };
      
      script.onerror = () => {
        console.error('❌ Falha ao carregar script do Pluggy');
        setError('Não foi possível carregar o componente de conexão bancária. Verifique sua internet.');
      };

      document.head.appendChild(script);
    };

    loadScript();
  }, []);

  const connectBank = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('🔄 1. Solicitando token...');
      
      const response = await base44.functions.invoke('createPluggyConnectToken', {});
      
      console.log('📦 2. Resposta:', response.data);

      if (!response.data.success) {
        throw new Error(response.data.error || 'Erro ao criar token');
      }

      if (!response.data.accessToken) {
        throw new Error('Token de acesso não foi retornado');
      }

      console.log('✅ 3. Token obtido');

      // Aguarda o script estar carregado
      if (!window.PluggyConnect) {
        console.log('⏳ Aguardando script...');
        await new Promise((resolve) => {
          const checkInterval = setInterval(() => {
            if (window.PluggyConnect) {
              clearInterval(checkInterval);
              resolve();
            }
          }, 100);
          
          // Timeout de 10 segundos
          setTimeout(() => {
            clearInterval(checkInterval);
            resolve();
          }, 10000);
        });
      }

      if (!window.PluggyConnect) {
        throw new Error('O componente Pluggy não carregou. Recarregue a página e tente novamente.');
      }

      console.log('🚀 4. Inicializando widget...');

      const pluggyConnect = new window.PluggyConnect({
        connectToken: response.data.accessToken,
        includeSandbox: true, // Altere para false para usar bancos reais
        onSuccess: async (itemData) => {
          console.log('✅ Banco conectado!', itemData);
          
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
          console.log('👋 Widget fechado');
          setLoading(false);
        },
      });

      console.log('📱 5. Abrindo widget...');
      pluggyConnect.init();
      
    } catch (err) {
      console.error('❌ Erro:', err);
      
      let errorMessage = 'Erro ao conectar banco';
      
      if (err?.message) {
        if (err.message.includes('inválidas') || err.message.includes('Credenciais')) {
          errorMessage = 'Credenciais do Pluggy inválidas. Verifique as configurações.';
        } else if (err.message.includes('não carregou') || err.message.includes('componente')) {
          errorMessage = 'Componente não carregou. Recarregue a página (F5) e tente novamente.';
        } else if (err.message.includes('Token')) {
          errorMessage = 'Falha ao obter token de conexão. Verifique as credenciais do Pluggy.';
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
      {!scriptLoaded && !error && (
        <Alert className="border-blue-200 bg-blue-50">
          <AlertDescription className="text-blue-900 flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Carregando componente de conexão...
          </AlertDescription>
        </Alert>
      )}

      <Button
        onClick={connectBank}
        disabled={loading || !scriptLoaded}
        className="bg-blue-600 hover:bg-blue-700 w-full"
        size="lg"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Carregando...
          </>
        ) : (
          <>
            <LinkIcon className="w-5 h-5 mr-2" />
            Conectar Banco
          </>
        )}
      </Button>

      {error && (
        <Alert variant="destructive">
          <AlertDescription className="text-sm">{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}