import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Building2, 
  Plus, 
  Zap,
  CheckCircle,
  TrendingUp,
  Shield,
  AlertCircle
} from "lucide-react";

import ConnectBankButton from "../components/bank/ConnectBankButton";
import BankConnectionCard from "../components/bank/BankConnectionCard";

export default function BankConnections() {
  const queryClient = useQueryClient();

  const { data: connections, isLoading } = useQuery({
    queryKey: ['bank-connections'],
    queryFn: () => base44.entities.BankConnection.list('-created_date'),
    initialData: [],
  });

  const createConnectionMutation = useMutation({
    mutationFn: async (itemData) => {
      return await base44.entities.BankConnection.create({
        pluggy_item_id: itemData.item.id,
        bank_name: itemData.item.connector.name,
        bank_logo: itemData.item.connector.imageUrl,
        connector_id: itemData.item.connector.id,
        status: 'active',
        last_sync: new Date().toISOString(),
      });
    },
    onSuccess: async (connection) => {
      queryClient.invalidateQueries({ queryKey: ['bank-connections'] });
      
      // Sincroniza automaticamente após conectar
      await syncConnection(connection.id);
    },
  });

  const syncMutation = useMutation({
    mutationFn: async (connectionId) => {
      const response = await fetch('/api/functions/pluggy/syncBankTransactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ connectionId }),
      });

      if (!response.ok) {
        throw new Error('Erro ao sincronizar');
      }

      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-connections'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (connectionId) => {
      const connection = connections.find(c => c.id === connectionId);
      
      // Deleta no Pluggy
      await fetch('/api/functions/pluggy/deleteItem', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ itemId: connection.pluggy_item_id }),
      });

      // Deleta localmente
      await base44.entities.BankConnection.delete(connectionId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-connections'] });
    },
  });

  const syncConnection = async (connectionId) => {
    await syncMutation.mutateAsync(connectionId);
  };

  if (isLoading) {
    return (
      <div className="p-6 md:p-8 space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          Conexões Bancárias
        </h1>
        <p className="text-slate-600">
          Conecte seus bancos e sincronize transações automaticamente
        </p>
      </div>

      {/* Benefícios */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4 flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
              <Zap className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">Automático</h3>
              <p className="text-sm text-blue-700">
                Transações sincronizadas em tempo real
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4 flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
              <Shield className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-green-900 mb-1">Seguro</h3>
              <p className="text-sm text-green-700">
                Criptografia de ponta a ponta
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50">
          <CardContent className="p-4 flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-purple-900 mb-1">Inteligente</h3>
              <p className="text-sm text-purple-700">
                Categorização automática via IA
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Instruções de configuração */}
      {connections.length === 0 && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-900">
            <strong>Importante:</strong> Para usar esta funcionalidade, você precisa:
            <ol className="list-decimal list-inside mt-2 space-y-1">
              <li>Criar uma conta gratuita em <a href="https://dashboard.pluggy.ai" target="_blank" rel="noopener noreferrer" className="underline font-semibold">dashboard.pluggy.ai</a></li>
              <li>Obter suas credenciais (Client ID e Client Secret)</li>
              <li>Configurar os secrets no Dashboard → Settings → Secrets</li>
            </ol>
          </AlertDescription>
        </Alert>
      )}

      {/* Lista de conexões */}
      {connections.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-slate-900 mb-4">
            Seus Bancos Conectados
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {connections.map((connection) => (
              <BankConnectionCard
                key={connection.id}
                connection={connection}
                onSync={syncConnection}
                onDelete={(id) => deleteMutation.mutate(id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Adicionar nova conexão */}
      <Card className="border-2 border-dashed border-slate-200">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-blue-50 rounded-full flex items-center justify-center">
            <Building2 className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            {connections.length === 0 ? 'Conecte seu Primeiro Banco' : 'Adicionar Outro Banco'}
          </h3>
          <p className="text-slate-600 mb-6">
            Conecte de forma segura usando Open Banking através do Pluggy
          </p>
          
          <ConnectBankButton 
            onSuccess={(itemData) => createConnectionMutation.mutate(itemData)}
          />

          <div className="mt-6 flex items-center justify-center gap-6 text-xs text-slate-500">
            <div className="flex items-center gap-1">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>Banco Central</span>
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>Criptografado</span>
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>Certificado</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Como funciona */}
      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold text-slate-900 mb-4">Como Funciona a Conexão</h3>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold flex-shrink-0">
                1
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 mb-1">Selecione seu banco</h4>
                <p className="text-sm text-slate-600">
                  Escolha entre mais de 300 bancos e instituições financeiras brasileiras
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold flex-shrink-0">
                2
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 mb-1">Faça login com segurança</h4>
                <p className="text-sm text-slate-600">
                  Use suas credenciais bancárias em uma conexão criptografada e certificada pelo Banco Central
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold flex-shrink-0">
                3
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 mb-1">Sincronização automática</h4>
                <p className="text-sm text-slate-600">
                  Suas transações são importadas e categorizadas automaticamente pela IA
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold flex-shrink-0">
                4
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 mb-1">Mantenha atualizado</h4>
                <p className="text-sm text-slate-600">
                  Clique em "Sincronizar" quando quiser atualizar seus dados mais recentes
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}