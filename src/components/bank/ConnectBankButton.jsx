import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Loader2, Link as LinkIcon } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function ConnectBankButton({ onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const connectBank = async () => {
    setLoading(true);
    setError(null);

    try {
      // Solicita token de acesso para o Widget
      const response = await fetch('/api/functions/pluggy/createConnectToken', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Erro ao iniciar conexão');
      }

      const { accessToken } = await response.json();

      // Carrega o Widget do Pluggy
      if (!window.PluggyConnect) {
        const script = document.createElement('script');
        script.src = 'https://cdn.pluggy.ai/pluggy-connect/v2/pluggy-connect.js';
        script.async = true;
        document.body.appendChild(script);

        await new Promise((resolve) => {
          script.onload = resolve;
        });
      }

      // Inicializa o Widget
      const pluggyConnect = new window.PluggyConnect({
        connectToken: accessToken,
        includeSandbox: true, // Habilitar para testes
        onSuccess: async (itemData) => {
          console.log('Conexão criada:', itemData);
          
          // Salva a conexão no banco
          if (onSuccess) {
            await onSuccess(itemData);
          }
        },
        onError: (error) => {
          console.error('Erro no widget:', error);
          setError('Erro ao conectar banco. Tente novamente.');
        },
      });

      pluggyConnect.init();
    } catch (err) {
      console.error('Erro:', err);
      setError(err.message);
    } finally {
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
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}