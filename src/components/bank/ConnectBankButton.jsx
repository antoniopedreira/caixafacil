import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Loader2, Link as LinkIcon } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { base44 } from "@/api/base44Client";

export default function ConnectBankButton({ onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadPluggyScript = () => {
    return new Promise((resolve, reject) => {
      // Verifica se já está carregado
      if (window.PluggyConnect) {
        resolve();
        return;
      }

      // Remove script antigo se existir
      const existingScript = document.querySelector('script[src*="pluggy-connect"]');
      if (existingScript) {
        existingScript.remove();
      }

      const script = document.createElement('script');
      script.src = 'https://cdn.pluggy.ai/pluggy-connect/v3/pluggy-connect.js';
      script.async = true;
      
      script.onload = () => {
        console.log('Script do Pluggy carregado com sucesso');
        // Aguarda um pouco para garantir que o PluggyConnect está disponível
        setTimeout(() => {
          if (window.PluggyConnect) {
            resolve();
          } else {
            reject(new Error('PluggyConnect não disponível após carregar script'));
          }
        }, 100);
      };
      
      script.onerror = (error) => {
        console.error('Erro ao carregar script:', error);
        reject(new Error('Falha ao carregar o widget do Pluggy'));
      };

      document.head.appendChild(script);
    });
  };

  const connectBank = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('1. Solicitando token do Pluggy...');
      
      const response = await base44.functions.invoke('createPluggyConnectToken', {});
      
      console.log('2. Resposta recebida:', response.data);

      if (!response.data.success) {
        throw new Error(response.data.error || 'Erro ao criar token de conexão');
      }

      console.log('3. Carregando widget do Pluggy...');

      await loadPluggyScript();

      console.log('4. Widget carregado, inicializando...');

      if (!window.PluggyConnect) {
        throw new Error('Widget do Pluggy não está disponível');
      }

      const pluggyConnect = new window.PluggyConnect({
        connectToken: response.data.accessToken,
        includeSandbox: true,
        onSuccess: async (itemData) => {
          console.log('5. Banco conectado com sucesso:', itemData);
          
          if (onSuccess) {
            await onSuccess(itemData);
          }
          
          setLoading(false);
        },
        onError: (error) => {
          console.error('Erro no widget do Pluggy:', error);
          setError('Erro ao conectar banco: ' + (error.message || 'Tente novamente'));
          setLoading(false);
        },
        onClose: () => {
          console.log('Widget fechado pelo usuário');
          setLoading(false);
        },
      });

      console.log('5. Abrindo widget...');
      pluggyConnect.init();
      
    } catch (err) {
      console.error('Erro completo:', err);
      
      let errorMessage = 'Erro ao conectar banco';
      
      if (err?.message) {
        if (err.message.includes('inválidas') || err.message.includes('Credenciais')) {
          errorMessage = 'Credenciais do Pluggy inválidas. Verifique PLUGGY_CLIENT_ID e PLUGGY_CLIENT_SECRET.';
        } else if (err.message.includes('não configuradas')) {
          errorMessage = 'Configure as credenciais do Pluggy (PLUGGY_CLIENT_ID e PLUGGY_CLIENT_SECRET).';
        } else if (err.message.includes('widget') || err.message.includes('script')) {
          errorMessage = 'Erro ao carregar componente de conexão. Verifique sua conexão com a internet e tente novamente.';
        } else if (err.message.includes('disponível')) {
          errorMessage = 'Componente de conexão não carregou. Recarregue a página e tente novamente.';
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
      <Button
        onClick={connectBank}
        disabled={loading}
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