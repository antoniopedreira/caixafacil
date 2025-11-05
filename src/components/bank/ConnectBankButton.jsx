import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Loader2, Link as LinkIcon } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { base44 } from "@/api/base44Client";

export default function ConnectBankButton({ onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const connectBank = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('Solicitando token do Pluggy...');
      
      // Solicita token de acesso do backend usando o SDK
      const response = await base44.functions.invoke('createPluggyConnectToken', {});
      
      console.log('Resposta recebida:', response.data);

      if (!response.data.success) {
        const errorMsg = response.data.error || 'Erro ao criar token de conexão';
        console.error('Erro na resposta:', errorMsg);
        
        // Mostra detalhes técnicos se houver
        if (response.data.details) {
          console.error('Detalhes:', response.data.details);
        }
        
        throw new Error(errorMsg);
      }

      console.log('Token obtido, carregando widget do Pluggy...');

      // Carrega o Widget do Pluggy
      if (!window.PluggyConnect) {
        const script = document.createElement('script');
        script.src = 'https://cdn.pluggy.ai/pluggy-connect/v3/pluggy-connect.js';
        script.async = true;
        document.body.appendChild(script);

        await new Promise((resolve, reject) => {
          script.onload = resolve;
          script.onerror = () => reject(new Error('Falha ao carregar widget do Pluggy'));
        });
      }

      console.log('Inicializando widget do Pluggy...');

      // Inicializa o Widget
      const pluggyConnect = new window.PluggyConnect({
        connectToken: response.data.accessToken,
        includeSandbox: true,
        onSuccess: async (itemData) => {
          console.log('Banco conectado com sucesso:', itemData);
          
          if (onSuccess) {
            await onSuccess(itemData);
          }
          
          setLoading(false);
        },
        onError: (error) => {
          console.error('Erro no widget do Pluggy:', error);
          setError('Erro ao conectar banco. Tente novamente.');
          setLoading(false);
        },
        onClose: () => {
          console.log('Widget fechado pelo usuário');
          setLoading(false);
        },
      });

      pluggyConnect.init();
      console.log('Widget inicializado');
      
    } catch (err) {
      console.error('Erro completo:', err);
      
      let errorMessage = 'Erro desconhecido ao conectar banco';
      
      if (err?.message) {
        errorMessage = err.message;
        
        // Mensagens mais amigáveis
        if (err.message.includes('inválidas')) {
          errorMessage = 'As credenciais do Pluggy estão incorretas. Verifique o Client ID e Client Secret nas configurações.';
        } else if (err.message.includes('não configuradas')) {
          errorMessage = 'Configure as credenciais do Pluggy (PLUGGY_CLIENT_ID e PLUGGY_CLIENT_SECRET) nas variáveis de ambiente.';
        } else if (err.message.includes('widget')) {
          errorMessage = 'Falha ao carregar o widget de conexão. Verifique sua conexão com a internet.';
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