import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Loader2, Building2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { base44 } from "@/api/base44Client";

export default function PluggyConnectButton({ onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleConnect = async () => {
    setLoading(true);
    setError(null);

    try {
      // 1. Buscar token do backend
      console.log('🔑 Buscando token...');
      const response = await base44.functions.invoke('createPluggyConnectToken', {});

      if (!response.data?.success) {
        throw new Error(response.data?.error || 'Erro ao criar token');
      }

      const connectToken = response.data.connectToken;
      console.log('✅ Token obtido');

      // 2. Carregar script do Pluggy se não existir
      if (!window.PluggyConnect) {
        console.log('📦 Carregando Pluggy Connect...');
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://cdn.pluggy.ai/connect/v3/pluggy-connect.js';
          script.onload = () => {
            // Aguarda o objeto ficar disponível
            const checkInterval = setInterval(() => {
              if (window.PluggyConnect) {
                clearInterval(checkInterval);
                resolve();
              }
            }, 100);
            setTimeout(() => {
              clearInterval(checkInterval);
              reject(new Error('Timeout ao carregar Pluggy'));
            }, 10000);
          };
          script.onerror = () => reject(new Error('Falha ao carregar script'));
          document.head.appendChild(script);
        });
      }

      console.log('🚀 Abrindo widget...');

      // 3. Abrir widget
      const pluggy = new window.PluggyConnect({
        connectToken: connectToken,
        includeSandbox: false,
        onSuccess: (data) => {
          console.log('✅ Conexão realizada!', data);
          setLoading(false);
          if (onSuccess) onSuccess(data);
        },
        onError: (err) => {
          console.error('❌ Erro no widget:', err);
          setError('Erro ao conectar banco');
          setLoading(false);
        },
        onClose: () => {
          console.log('🚪 Widget fechado');
          setLoading(false);
        }
      });

      pluggy.init();

    } catch (err) {
      console.error('❌ Erro:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <Button
        onClick={handleConnect}
        disabled={loading}
        className="bg-blue-600 hover:bg-blue-700 w-full"
        size="lg"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Conectando...
          </>
        ) : (
          <>
            <Building2 className="w-5 h-5 mr-2" />
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