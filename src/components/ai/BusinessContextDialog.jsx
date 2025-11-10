import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles } from "lucide-react";

export default function BusinessContextDialog({ open, onClose, onSave, user }) {
  const [formData, setFormData] = useState({
    business_segment: user?.business_segment || '',
    business_name: user?.business_name || '',
    employee_count: user?.employee_count || '',
    monthly_revenue_range: user?.monthly_revenue_range || '',
    main_challenge: user?.main_challenge || ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Sparkles className="w-6 h-6 text-purple-600" />
            Conte sobre seu negócio
          </DialogTitle>
          <DialogDescription>
            Com essas informações, posso dar conselhos muito mais direcionados e práticos para você!
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div className="space-y-2">
            <Label htmlFor="business_name">1. Qual o nome do seu negócio? *</Label>
            <Input
              id="business_name"
              placeholder="Ex: Padaria do João, Salão Elegance..."
              value={formData.business_name}
              onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="business_segment">2. Qual o ramo/segmento? *</Label>
            <Select
              value={formData.business_segment}
              onValueChange={(value) => setFormData({ ...formData, business_segment: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="comercio_varejo">🛒 Comércio/Varejo</SelectItem>
                <SelectItem value="restaurante_bar">🍽️ Restaurante/Bar</SelectItem>
                <SelectItem value="salao_beleza">💇 Salão de Beleza/Estética</SelectItem>
                <SelectItem value="consultoria_servicos">💼 Consultoria/Serviços</SelectItem>
                <SelectItem value="construcao_reformas">🏗️ Construção/Reformas</SelectItem>
                <SelectItem value="transporte_logistica">🚚 Transporte/Logística</SelectItem>
                <SelectItem value="saude_clinica">🏥 Saúde/Clínica</SelectItem>
                <SelectItem value="educacao_cursos">📚 Educação/Cursos</SelectItem>
                <SelectItem value="tecnologia_software">💻 Tecnologia/Software</SelectItem>
                <SelectItem value="industria_fabricacao">🏭 Indústria/Fabricação</SelectItem>
                <SelectItem value="agronegocio">🌾 Agronegócio</SelectItem>
                <SelectItem value="outros">📦 Outros</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="employee_count">3. Quantos funcionários? *</Label>
              <Select
                value={formData.employee_count}
                onValueChange={(value) => setFormData({ ...formData, employee_count: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="apenas_eu">Apenas eu (MEI)</SelectItem>
                  <SelectItem value="2_a_5">2 a 5 funcionários</SelectItem>
                  <SelectItem value="6_a_10">6 a 10 funcionários</SelectItem>
                  <SelectItem value="11_a_20">11 a 20 funcionários</SelectItem>
                  <SelectItem value="mais_de_20">Mais de 20</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="monthly_revenue_range">4. Faturamento mensal? *</Label>
              <Select
                value={formData.monthly_revenue_range}
                onValueChange={(value) => setFormData({ ...formData, monthly_revenue_range: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ate_10k">Até R$ 10 mil</SelectItem>
                  <SelectItem value="10k_a_30k">R$ 10 a 30 mil</SelectItem>
                  <SelectItem value="30k_a_100k">R$ 30 a 100 mil</SelectItem>
                  <SelectItem value="100k_a_300k">R$ 100 a 300 mil</SelectItem>
                  <SelectItem value="acima_300k">Acima de R$ 300 mil</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="main_challenge">5. Qual seu maior desafio hoje? (Opcional)</Label>
            <Textarea
              id="main_challenge"
              placeholder="Ex: Aumentar vendas, reduzir custos, organizar o financeiro, contratar equipe..."
              value={formData.main_challenge}
              onChange={(e) => setFormData({ ...formData, main_challenge: e.target.value })}
              rows={3}
            />
            <p className="text-xs text-slate-500">
              Isso me ajuda a focar nas suas prioridades!
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Depois
            </Button>
            <Button 
              type="submit"
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Salvar e Começar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}