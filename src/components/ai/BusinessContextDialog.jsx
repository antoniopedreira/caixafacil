import React, { useState, useMemo } from 'react';
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Search, Check, X } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const BUSINESS_SEGMENTS = [
  { value: "acougue", label: "🥩 Açougue" },
  { value: "academia_fitness", label: "💪 Academia/Fitness" },
  { value: "advocacia", label: "⚖️ Advocacia" },
  { value: "agencia_marketing", label: "📣 Agência de Marketing" },
  { value: "agencia_turismo", label: "✈️ Agência de Turismo" },
  { value: "agencia_viagens", label: "🧳 Agência de Viagens" },
  { value: "agronegocio", label: "🌾 Agronegócio" },
  { value: "autoescola", label: "🚗 Autoescola" },
  { value: "auto_pecas", label: "🔧 Auto Peças" },
  { value: "banco_financeira", label: "🏦 Banco/Financeira" },
  { value: "bar_boteco", label: "🍺 Bar/Boteco" },
  { value: "barbearia", label: "💈 Barbearia" },
  { value: "bijuteria_acessorios", label: "💍 Bijuteria/Acessórios" },
  { value: "buffet_eventos", label: "🎉 Buffet/Eventos" },
  { value: "cafeteria", label: "☕ Cafeteria" },
  { value: "casa_construcao", label: "🏠 Casa de Construção" },
  { value: "clinica_medica", label: "🏥 Clínica Médica" },
  { value: "clinica_odontologica", label: "🦷 Clínica Odontológica" },
  { value: "clinica_veterinaria", label: "🐾 Clínica Veterinária" },
  { value: "confeitaria_doces", label: "🧁 Confeitaria/Doces" },
  { value: "construcao_civil", label: "🏗️ Construção Civil" },
  { value: "consultoria_empresarial", label: "💼 Consultoria Empresarial" },
  { value: "contabilidade", label: "📊 Contabilidade" },
  { value: "coworking", label: "🖥️ Coworking" },
  { value: "decoracao_interiores", label: "🛋️ Decoração/Interiores" },
  { value: "delivery_marmita", label: "🍱 Delivery/Marmita" },
  { value: "despachante", label: "📄 Despachante" },
  { value: "distribuidora", label: "📦 Distribuidora" },
  { value: "drogaria_farmacia", label: "💊 Drogaria/Farmácia" },
  { value: "eletricista", label: "⚡ Eletricista" },
  { value: "eletronica", label: "📱 Eletrônica" },
  { value: "encanador_hidraulica", label: "🚰 Encanador/Hidráulica" },
  { value: "engenharia", label: "👷 Engenharia" },
  { value: "escola_curso", label: "📚 Escola/Curso" },
  { value: "escritorio_advocacia", label: "⚖️ Escritório de Advocacia" },
  { value: "estetica_beleza", label: "💅 Estética/Beleza" },
  { value: "estudio_fotografia", label: "📷 Estúdio de Fotografia" },
  { value: "estudio_tatuagem", label: "🎨 Estúdio de Tatuagem" },
  { value: "eventos_producao", label: "🎭 Eventos/Produção" },
  { value: "farmacia_manipulacao", label: "💊 Farmácia de Manipulação" },
  { value: "fisioterapia", label: "🧘 Fisioterapia" },
  { value: "floricultura", label: "🌸 Floricultura" },
  { value: "food_truck", label: "🚚 Food Truck" },
  { value: "fotografia", label: "📸 Fotografia" },
  { value: "gesso_drywall", label: "🧱 Gesso/Drywall" },
  { value: "grafica", label: "🖨️ Gráfica" },
  { value: "hamburgueria", label: "🍔 Hamburgueria" },
  { value: "hotel_pousada", label: "🏨 Hotel/Pousada" },
  { value: "imobiliaria", label: "🏘️ Imobiliária" },
  { value: "importacao_exportacao", label: "🌐 Importação/Exportação" },
  { value: "industria", label: "🏭 Indústria" },
  { value: "informatica", label: "💻 Informática" },
  { value: "jardinagem_paisagismo", label: "🌳 Jardinagem/Paisagismo" },
  { value: "joalheria", label: "💎 Joalheria" },
  { value: "laboratorio_analises", label: "🔬 Laboratório de Análises" },
  { value: "lanchonete", label: "🥪 Lanchonete" },
  { value: "lavanderia", label: "🧺 Lavanderia" },
  { value: "lava_jato", label: "🚿 Lava Jato" },
  { value: "livraria", label: "📚 Livraria" },
  { value: "loja_animais", label: "🐶 Loja de Animais" },
  { value: "loja_calcados", label: "👞 Loja de Calçados" },
  { value: "loja_informatica", label: "💻 Loja de Informática" },
  { value: "loja_moveis", label: "🛏️ Loja de Móveis" },
  { value: "loja_roupas", label: "👕 Loja de Roupas" },
  { value: "loja_1_99", label: "🛍️ Loja 1,99" },
  { value: "marcenaria", label: "🪵 Marcenaria" },
  { value: "mecanica_auto", label: "🔧 Mecânica Auto" },
  { value: "mercado_mini", label: "🛒 Mercado/Mini" },
  { value: "moda_confeccao", label: "👗 Moda/Confecção" },
  { value: "motel", label: "🏩 Motel" },
  { value: "nutricionista", label: "🥗 Nutricionista" },
  { value: "otica", label: "👓 Ótica" },
  { value: "padaria", label: "🥖 Padaria" },
  { value: "papelaria", label: "📝 Papelaria" },
  { value: "pet_shop", label: "🐕 Pet Shop" },
  { value: "pintura_predial", label: "🎨 Pintura Predial" },
  { value: "pizzaria", label: "🍕 Pizzaria" },
  { value: "pousada", label: "🏡 Pousada" },
  { value: "psicologia", label: "🧠 Psicologia" },
  { value: "relojoaria", label: "⌚ Relojoaria" },
  { value: "restaurante", label: "🍽️ Restaurante" },
  { value: "salao_beleza", label: "💇 Salão de Beleza" },
  { value: "salao_festas", label: "🎊 Salão de Festas" },
  { value: "sapataria", label: "👞 Sapataria" },
  { value: "seguranca_eletronica", label: "🔒 Segurança Eletrônica" },
  { value: "serralheria", label: "🔨 Serralheria" },
  { value: "sorveteria", label: "🍦 Sorveteria" },
  { value: "supermercado", label: "🏪 Supermercado" },
  { value: "tabacaria", label: "🚬 Tabacaria" },
  { value: "tapeçaria", label: "🛋️ Tapeçaria" },
  { value: "taxi_transporte", label: "🚕 Taxi/Transporte" },
  { value: "tecnologia_software", label: "💻 Tecnologia/Software" },
  { value: "telefonia_celular", label: "📱 Telefonia/Celular" },
  { value: "tinturaria", label: "👔 Tinturaria" },
  { value: "torno_mecanico", label: "⚙️ Torno Mecânico" },
  { value: "transporte_carga", label: "🚚 Transporte de Carga" },
  { value: "vidracaria", label: "🪟 Vidraçaria" },
  { value: "outros", label: "📦 Outros" },
].sort((a, b) => a.label.localeCompare(b.label));

const BRAZILIAN_STATES = [
  { value: "AC", label: "Acre" },
  { value: "AL", label: "Alagoas" },
  { value: "AP", label: "Amapá" },
  { value: "AM", label: "Amazonas" },
  { value: "BA", label: "Bahia" },
  { value: "CE", label: "Ceará" },
  { value: "DF", label: "Distrito Federal" },
  { value: "ES", label: "Espírito Santo" },
  { value: "GO", label: "Goiás" },
  { value: "MA", label: "Maranhão" },
  { value: "MT", label: "Mato Grosso" },
  { value: "MS", label: "Mato Grosso do Sul" },
  { value: "MG", label: "Minas Gerais" },
  { value: "PA", label: "Pará" },
  { value: "PB", label: "Paraíba" },
  { value: "PR", label: "Paraná" },
  { value: "PE", label: "Pernambuco" },
  { value: "PI", label: "Piauí" },
  { value: "RJ", label: "Rio de Janeiro" },
  { value: "RN", label: "Rio Grande do Norte" },
  { value: "RS", label: "Rio Grande do Sul" },
  { value: "RO", label: "Rondônia" },
  { value: "RR", label: "Roraima" },
  { value: "SC", label: "Santa Catarina" },
  { value: "SP", label: "São Paulo" },
  { value: "SE", label: "Sergipe" },
  { value: "TO", label: "Tocantins" },
];

export default function BusinessContextDialog({ open, onClose, onSave, user }) {
  const [formData, setFormData] = useState({
    business_segment: user?.business_segment || '',
    business_name: user?.business_name || '',
    employee_count: user?.employee_count || '',
    operation_type: user?.operation_type || 'nacional_digital',
    operation_states: user?.operation_states || [],
    operation_cities: user?.operation_cities || [],
    main_challenge: user?.main_challenge || ''
  });

  const [openCombobox, setOpenCombobox] = useState(false);
  const [openStatesCombobox, setOpenStatesCombobox] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [cityInput, setCityInput] = useState('');

  const selectedSegment = useMemo(() => {
    return BUSINESS_SEGMENTS.find(s => s.value === formData.business_segment);
  }, [formData.business_segment]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleRemoveState = (stateValue) => {
    setFormData({
      ...formData,
      operation_states: formData.operation_states.filter(s => s !== stateValue)
    });
  };

  const handleRemoveCity = (cityValue) => {
    setFormData({
      ...formData,
      operation_cities: formData.operation_cities.filter(c => c !== cityValue)
    });
  };

  const handleAddCity = () => {
    if (cityInput.trim() && !formData.operation_cities.includes(cityInput.trim())) {
      setFormData({
        ...formData,
        operation_cities: [...formData.operation_cities, cityInput.trim()]
      });
      setCityInput('');
    }
  };

  const handleCityKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddCity();
    }
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
            <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openCombobox}
                  className="w-full justify-between"
                >
                  {selectedSegment ? selectedSegment.label : "Digite ou selecione..."}
                  <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <Command>
                  <CommandInput 
                    placeholder="Digite para buscar..." 
                    value={searchValue}
                    onValueChange={setSearchValue}
                  />
                  <CommandList>
                    <CommandEmpty>Nenhum ramo encontrado.</CommandEmpty>
                    <CommandGroup className="max-h-64 overflow-auto">
                      {BUSINESS_SEGMENTS.map((segment) => (
                        <CommandItem
                          key={segment.value}
                          value={segment.label}
                          onSelect={() => {
                            setFormData({ ...formData, business_segment: segment.value });
                            setOpenCombobox(false);
                            setSearchValue('');
                          }}
                        >
                          <Check
                            className={`mr-2 h-4 w-4 ${
                              formData.business_segment === segment.value
                                ? "opacity-100"
                                : "opacity-0"
                            }`}
                          />
                          {segment.label}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            <p className="text-xs text-slate-500">
              Digite para filtrar ou role a lista para ver todas as opções
            </p>
          </div>

          <div className="space-y-2">
            <Label>3. Quantos funcionários? *</Label>
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

          <div className="space-y-3">
            <Label>4. Onde seu negócio atua? *</Label>
            <RadioGroup
              value={formData.operation_type}
              onValueChange={(value) => setFormData({ ...formData, operation_type: value })}
              required
            >
              <div className="flex items-start space-x-2 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
                <RadioGroupItem value="nacional_digital" id="nacional_digital" className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor="nacional_digital" className="font-medium cursor-pointer">
                    🌐 Nacional Digital
                  </Label>
                  <p className="text-xs text-slate-500 mt-1">
                    Atuo online, sem necessidade de presença física (e-commerce, serviços digitais)
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-2 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
                <RadioGroupItem value="nacional_fisica" id="nacional_fisica" className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor="nacional_fisica" className="font-medium cursor-pointer">
                    🚚 Nacional Físico
                  </Label>
                  <p className="text-xs text-slate-500 mt-1">
                    Tenho estrutura física e/ou logística em todo o Brasil
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-2 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
                <RadioGroupItem value="regional" id="regional" className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor="regional" className="font-medium cursor-pointer">
                    📍 Regional
                  </Label>
                  <p className="text-xs text-slate-500 mt-1">
                    Atuo em estados e/ou cidades específicas
                  </p>
                </div>
              </div>
            </RadioGroup>

            {formData.operation_type === 'regional' && (
              <div className="space-y-4 pl-6 mt-4 border-l-2 border-blue-200">
                {/* Estados */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Estados onde atua:</Label>
                  <Popover open={openStatesCombobox} onOpenChange={setOpenStatesCombobox}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between"
                      >
                        Selecionar estados
                        <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Digite para buscar..." />
                        <CommandList>
                          <CommandEmpty>Nenhum estado encontrado.</CommandEmpty>
                          <CommandGroup className="max-h-48 overflow-auto">
                            {BRAZILIAN_STATES.map((state) => (
                              <CommandItem
                                key={state.value}
                                value={state.label}
                                onSelect={() => {
                                  if (!formData.operation_states.includes(state.value)) {
                                    setFormData({
                                      ...formData,
                                      operation_states: [...formData.operation_states, state.value]
                                    });
                                  }
                                }}
                              >
                                <Check
                                  className={`mr-2 h-4 w-4 ${
                                    formData.operation_states.includes(state.value)
                                      ? "opacity-100"
                                      : "opacity-0"
                                  }`}
                                />
                                {state.label} ({state.value})
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  
                  {formData.operation_states.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.operation_states.map((stateValue) => {
                        const state = BRAZILIAN_STATES.find(s => s.value === stateValue);
                        return (
                          <Badge key={stateValue} variant="secondary" className="gap-1">
                            {state?.label}
                            <button
                              type="button"
                              onClick={() => handleRemoveState(stateValue)}
                              className="hover:bg-slate-300 rounded-full p-0.5"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </Badge>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Cidades */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Cidades específicas (opcional):</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Digite o nome da cidade e pressione Enter"
                      value={cityInput}
                      onChange={(e) => setCityInput(e.target.value)}
                      onKeyDown={handleCityKeyDown}
                    />
                    <Button
                      type="button"
                      onClick={handleAddCity}
                      variant="outline"
                      size="icon"
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-slate-500">
                    Ex: São Paulo, Rio de Janeiro, Belo Horizonte...
                  </p>
                  
                  {formData.operation_cities.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.operation_cities.map((city, index) => (
                        <Badge key={index} variant="secondary" className="gap-1">
                          {city}
                          <button
                            type="button"
                            onClick={() => handleRemoveCity(city)}
                            className="hover:bg-slate-300 rounded-full p-0.5"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
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