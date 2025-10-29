import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Download, TrendingUp, TrendingDown } from "lucide-react";
import { format, startOfMonth, endOfMonth, subMonths, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Reports() {
  const [period, setPeriod] = useState("3");
  
  const { data: transactions, isLoading } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => base44.entities.Transaction.list('-date'),
    initialData: [],
  });

  const monthsData = React.useMemo(() => {
    const months = parseInt(period);
    const data = [];
    
    for (let i = months - 1; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const start = startOfMonth(date);
      const end = endOfMonth(date);
      
      const monthTransactions = transactions.filter(t => 
        isWithinInterval(new Date(t.date), { start, end })
      );
      
      const income = monthTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const expense = monthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);
      
      data.push({
        month: format(date, 'MMM yyyy', { locale: ptBR }),
        receitas: income,
        despesas: expense,
        saldo: income - expense
      });
    }
    
    return data;
  }, [transactions, period]);

  const predictions = React.useMemo(() => {
    if (monthsData.length < 2) return null;
    
    const avgIncome = monthsData.reduce((sum, m) => sum + m.receitas, 0) / monthsData.length;
    const avgExpense = monthsData.reduce((sum, m) => sum + m.despesas, 0) / monthsData.length;
    
    const lastMonth = monthsData[monthsData.length - 1];
    const incomeTrend = avgIncome > 0 ? ((lastMonth.receitas - avgIncome) / avgIncome * 100) : 0;
    const expenseTrend = avgExpense > 0 ? ((lastMonth.despesas - avgExpense) / avgExpense * 100) : 0;
    
    return {
      avgIncome,
      avgExpense,
      predictedIncome: avgIncome * (1 + incomeTrend / 100),
      predictedExpense: avgExpense * (1 + expenseTrend / 100),
      incomeTrend,
      expenseTrend
    };
  }, [monthsData]);

  const exportData = () => {
    const csv = [
      ['Mês', 'Receitas', 'Despesas', 'Saldo'],
      ...monthsData.map(m => [m.month, m.receitas, m.despesas, m.saldo])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'relatorio-financeiro.csv';
    a.click();
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Relatórios</h1>
          <p className="text-slate-600">Análises detalhadas e previsões do seu fluxo de caixa</p>
        </div>
        
        <div className="flex gap-3">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3">Últimos 3 meses</SelectItem>
              <SelectItem value="6">Últimos 6 meses</SelectItem>
              <SelectItem value="12">Últimos 12 meses</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" onClick={exportData}>
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Gráfico comparativo */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Análise Comparativa</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={monthsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" stroke="#64748b" style={{ fontSize: '12px' }} />
              <YAxis 
                stroke="#64748b" 
                style={{ fontSize: '12px' }}
                tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px'
                }}
                formatter={(value) => `R$ ${value.toFixed(2)}`}
              />
              <Legend />
              <Bar dataKey="receitas" fill="#10b981" name="Receitas" radius={[8, 8, 0, 0]} />
              <Bar dataKey="despesas" fill="#ef4444" name="Despesas" radius={[8, 8, 0, 0]} />
              <Bar dataKey="saldo" fill="#3b82f6" name="Saldo" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Previsões */}
      {predictions && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Previsão de Receitas - Próximo Mês</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Média Histórica</p>
                  <p className="text-2xl font-bold text-slate-900">
                    R$ {predictions.avgIncome.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 mb-1">Previsão</p>
                  <p className="text-3xl font-bold text-emerald-600">
                    R$ {predictions.predictedIncome.toFixed(2)}
                  </p>
                </div>
                <div className={`flex items-center gap-2 ${
                  predictions.incomeTrend >= 0 ? 'text-emerald-600' : 'text-rose-600'
                }`}>
                  {predictions.incomeTrend >= 0 ? (
                    <TrendingUp className="w-5 h-5" />
                  ) : (
                    <TrendingDown className="w-5 h-5" />
                  )}
                  <span className="font-semibold">
                    {Math.abs(predictions.incomeTrend).toFixed(1)}% vs média
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Previsão de Despesas - Próximo Mês</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Média Histórica</p>
                  <p className="text-2xl font-bold text-slate-900">
                    R$ {predictions.avgExpense.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 mb-1">Previsão</p>
                  <p className="text-3xl font-bold text-rose-600">
                    R$ {predictions.predictedExpense.toFixed(2)}
                  </p>
                </div>
                <div className={`flex items-center gap-2 ${
                  predictions.expenseTrend >= 0 ? 'text-rose-600' : 'text-emerald-600'
                }`}>
                  {predictions.expenseTrend >= 0 ? (
                    <TrendingUp className="w-5 h-5" />
                  ) : (
                    <TrendingDown className="w-5 h-5" />
                  )}
                  <span className="font-semibold">
                    {Math.abs(predictions.expenseTrend).toFixed(1)}% vs média
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}