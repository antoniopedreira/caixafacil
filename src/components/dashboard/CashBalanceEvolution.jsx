import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Dot } from 'recharts';
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval, isSameMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TrendingUp, AlertCircle } from 'lucide-react';

const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3">
        <p className="text-sm font-semibold text-slate-900 mb-1">
          {data.fullMonth}
          {data.isPartial && (
            <Badge variant="outline" className="ml-2 text-xs">Parcial</Badge>
          )}
        </p>
        <p className={`text-lg font-bold ${
          data.balance >= 0 ? 'text-emerald-600' : 'text-rose-600'
        }`}>
          R$ {formatCurrency(data.balance)}
        </p>
      </div>
    );
  }
  return null;
};

const CustomDot = (props) => {
  const { cx, cy, payload } = props;
  
  if (payload.isCurrentMonth) {
    return (
      <g>
        <circle 
          cx={cx} 
          cy={cy} 
          r={8} 
          fill="#3b82f6"
          stroke="#fff"
          strokeWidth={3}
        />
        <circle 
          cx={cx} 
          cy={cy} 
          r={4} 
          fill="#fff"
        />
      </g>
    );
  }
  
  return (
    <circle 
      cx={cx} 
      cy={cy} 
      r={5} 
      fill={payload.balance >= 0 ? '#10b981' : '#ef4444'}
      stroke="#fff"
      strokeWidth={2}
    />
  );
};

export default function CashBalanceEvolution({ transactions }) {
  const chartData = useMemo(() => {
    const now = new Date();
    const data = [];
    
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(now, i);
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);
      const isCurrentMonth = isSameMonth(date, now);
      
      // Calcula saldo final do mês (todas as transações até o fim do mês)
      const balance = transactions
        .filter(t => new Date(t.date) <= monthEnd)
        .reduce((sum, t) => {
          return sum + (t.type === 'income' ? t.amount : -Math.abs(t.amount));
        }, 0);
      
      data.push({
        month: format(date, 'MMM', { locale: ptBR }),
        fullMonth: format(date, "MMMM 'de' yyyy", { locale: ptBR }),
        balance: balance,
        isCurrentMonth: isCurrentMonth,
        isPartial: isCurrentMonth
      });
    }
    
    return data;
  }, [transactions]);

  const trend = useMemo(() => {
    if (chartData.length < 2) return 'neutral';
    const lastMonth = chartData[chartData.length - 1].balance;
    const previousMonth = chartData[chartData.length - 2].balance;
    return lastMonth >= previousMonth ? 'up' : 'down';
  }, [chartData]);

  const currentBalance = chartData[chartData.length - 1]?.balance || 0;

  return (
    <Card className="border-0 shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Evolução do Saldo (6 meses)</CardTitle>
          <div className="flex items-center gap-2">
            <Badge className={
              trend === 'up' 
                ? 'bg-emerald-100 text-emerald-700' 
                : 'bg-rose-100 text-rose-700'
            }>
              {trend === 'up' ? (
                <TrendingUp className="w-3 h-3 mr-1" />
              ) : (
                <TrendingUp className="w-3 h-3 mr-1 rotate-180" />
              )}
              {trend === 'up' ? 'Crescimento' : 'Declínio'}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex items-start gap-3 bg-blue-50 rounded-lg p-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-blue-900">
              <strong>Saldo atual:</strong> R$ {formatCurrency(currentBalance)}
            </p>
            <p className="text-xs text-blue-700 mt-1">
              O mês atual mostra valores parciais (até hoje). Clique nos pontos para ver o saldo de cada mês.
            </p>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis 
              dataKey="month" 
              stroke="#64748b" 
              style={{ fontSize: '12px' }}
              tick={{ fill: '#64748b' }}
            />
            <YAxis 
              stroke="#64748b" 
              style={{ fontSize: '12px' }}
              tickFormatter={(value) => {
                const absValue = Math.abs(value);
                if (absValue >= 1000) {
                  return `${value >= 0 ? '' : '-'}${(absValue / 1000).toFixed(0)}k`;
                }
                return value.toFixed(0);
              }}
              tick={{ fill: '#64748b' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line 
              type="monotone" 
              dataKey="balance" 
              stroke="#3b82f6"
              strokeWidth={3}
              dot={<CustomDot />}
              activeDot={{ r: 8 }}
            />
          </LineChart>
        </ResponsiveContainer>

        <div className="flex items-center justify-center gap-4 mt-4 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
            <span>Saldo Positivo</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-rose-500"></div>
            <span>Saldo Negativo</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-600 border-2 border-white"></div>
            <span>Mês Atual</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}