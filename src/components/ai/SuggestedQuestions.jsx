import React from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

const SUGGESTED_QUESTIONS = [
  "Como posso melhorar meu fluxo de caixa?",
  "Quais despesas devo focar em reduzir?",
  "Minha margem de lucro está saudável?",
  "Como aumentar minhas receitas?",
  "Estou gastando muito em alguma categoria?",
  "Devo contratar mais funcionários agora?",
  "Como posso precificar melhor meus produtos/serviços?",
  "Qual o melhor momento para investir no negócio?",
  "Como me preparar para períodos de baixa?",
  "Preciso fazer um empréstimo ou tenho caixa suficiente?"
];

export default function SuggestedQuestions({ onSelectQuestion }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm text-slate-600">
        <Sparkles className="w-4 h-4" />
        <span className="font-medium">Perguntas Sugeridas</span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {SUGGESTED_QUESTIONS.map((question, index) => (
          <Button
            key={index}
            variant="outline"
            className="text-left justify-start h-auto py-3 px-4 text-sm hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200"
            onClick={() => onSelectQuestion(question)}
          >
            {question}
          </Button>
        ))}
      </div>
    </div>
  );
}