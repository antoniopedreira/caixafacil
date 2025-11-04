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
      // Solicita token de acesso do backend
      const response = await fetch('/api/backend-functions/createPluggyConnectToken', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Erro ao criar token de conexão');
      }

      // Carrega o Widget do Pluggy
      if (!window.PluggyConnect) {
        const script = document.createElement('script');
        script.src = 'https://cdn.pluggy.ai/pluggy-connect/v3/pluggy-connect.js';
        script.async = true;
        document.body.appendChild(script);

        await new Promise((resolve, reject) => {
          script.onload = resolve;
          script.onerror = reject;
        });
      }

      // Inicializa o Widget
      const pluggyConnect = new window.PluggyConnect({
        connectToken: data.accessToken,
        includeSandbox: false, // Coloque true apenas para testes
        onSuccess: async (itemData) => {
          console.log('Banco conectado:', itemData);
          
          if (onSuccess) {
            await onSuccess(itemData);
          }
          
          setLoading(false);
        },
        onError: (error) => {
          console.error('Erro no widget:', error);
          setError('Erro ao conectar banco. Tente novamente.');
          setLoading(false);
        },
        onClose: () => {
          setLoading(false);
        },
      });

      pluggyConnect.init();
    } catch (err) {
      console.error('Erro:', err);
      setError(err.message);
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