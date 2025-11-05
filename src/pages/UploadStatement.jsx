import React, { useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Upload, FileText, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

export default function UploadStatement() {
  const queryClient = useQueryClient();
  const [file, setFile] = useState(null);
  const [bankAccountName, setBankAccountName] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [status, setStatus] = useState("idle");
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("");
  const [extractedCount, setExtractedCount] = useState(0);
  const [errorDetails, setErrorDetails] = useState("");

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      setFile(droppedFile);
      setStatus("idle");
      setErrorDetails("");
      setMessage("");
    }
  }, []);

  const handleFileInput = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setStatus("idle");
      setErrorDetails("");
      setMessage("");
    }
  };

  const processFile = async () => {
    if (!file) return;
    
    if (!bankAccountName.trim()) {
      setStatus("error");
      setMessage("Nome da conta bancária é obrigatório.");
      setErrorDetails("Por favor, informe o nome da conta bancária para prosseguir com a importação.");
      return;
    }

    setStatus("uploading");
    setProgress(10);
    setMessage("Enviando arquivo...");
    setErrorDetails("");

    try {
      // 1. Upload do arquivo
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      setProgress(30);
      setStatus("processing");
      setMessage("Extraindo transações com IA... aguarde até 40 segundos");

      // 2. Extrai dados usando LLM diretamente (sem ExtractDataFromUploadedFile)
      const extractionPrompt = `Você é um especialista em análise de extratos bancários brasileiros.

Analise o arquivo anexado e extraia TODAS as transações bancárias encontradas.

Para cada transação, identifique:
- **data**: Data no formato YYYY-MM-DD (se o ano não estiver explícito, use 2025)
- **description**: Descrição da transação (combine descrição + fornecedor se houver)
- **amount**: Valor numérico absoluto (apenas número, sem R$, pontos ou vírgulas)
- **type**: "income" para CRÉDITO/ENTRADA ou "expense" para DÉBITO/SAÍDA

**IMPORTANTE:**
- Extraia TODAS as linhas de movimentação
- Converta valores de formato brasileiro (1.234,56) para número puro (1234.56)
- Se houver colunas "Tipo", "Natureza" ou similar, use para definir income/expense
- Ignore cabeçalhos, totais e linhas de saldo

Retorne APENAS um JSON no formato:
{
  "transactions": [
    {
      "date": "2025-01-05",
      "description": "Pagamento - Fornecedor XYZ",
      "amount": 150.00,
      "type": "expense"
    }
  ]
}`;

      const extractionResult = await base44.integrations.Core.InvokeLLM({
        prompt: extractionPrompt,
        file_urls: file_url,
        response_json_schema: {
          type: "object",
          properties: {
            transactions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  date: { type: "string" },
                  description: { type: "string" },
                  amount: { type: "number" },
                  type: { type: "string", enum: ["income", "expense"] }
                },
                required: ["date", "description", "amount", "type"]
              }
            }
          },
          required: ["transactions"]
        }
      });

      setProgress(60);

      if (!extractionResult?.transactions || extractionResult.transactions.length === 0) {
        throw new Error("Nenhuma transação foi encontrada no arquivo. Certifique-se de que é um extrato bancário válido.");
      }

      let transactions = extractionResult.transactions;
      
      // Validação
      transactions = transactions.filter(t => {
        if (!t.date || !t.description || !t.amount || !t.type) {
          console.warn('Transação inválida ignorada:', t);
          return false;
        }
        return true;
      });
      
      if (transactions.length === 0) {
        throw new Error("Nenhuma transação válida foi encontrada após validação.");
      }

      setMessage(`Categorizando ${transactions.length} transações com IA...`);
      setProgress(75);

      // 3. Categoriza em lote
      const categorizationPrompt = `Categorize cada uma das ${transactions.length} transações abaixo.

**Categorias para RECEITAS (income):**
- vendas: Vendas de produtos/serviços
- servicos: Prestação de serviços
- outras_receitas: Outras receitas

**Categorias para DESPESAS (expense):**
- salarios_funcionarios: Salários e folha
- fornecedores: Pagamentos a fornecedores
- aluguel: Aluguel
- contas_servicos: Luz, água, internet, telefone
- impostos_taxas: Impostos e taxas
- marketing_publicidade: Marketing
- equipamentos_materiais: Equipamentos e materiais
- manutencao: Manutenção
- combustivel_transporte: Combustível e transporte
- outras_despesas: Outras despesas

**Transações:**
${transactions.map((t, i) => `${i + 1}. "${t.description}" | ${t.type} | R$ ${t.amount}`).join('\n')}

Retorne um array com as categorias NA MESMA ORDEM das transações.
Exemplo: ["vendas", "fornecedores", "contas_servicos"]`;

      let categories = [];
      try {
        const catResult = await base44.integrations.Core.InvokeLLM({
          prompt: categorizationPrompt,
          response_json_schema: {
            type: "object",
            properties: {
              categories: {
                type: "array",
                items: { type: "string" }
              }
            }
          }
        });
        
        categories = catResult.categories || [];
      } catch (error) {
        console.warn('Erro na categorização, usando padrão:', error);
        categories = transactions.map(t => 
          t.type === 'income' ? 'outras_receitas' : 'outras_despesas'
        );
      }

      setProgress(90);
      setMessage("Salvando transações...");
      
      // 4. Cria transações
      const transactionsToCreate = transactions.map((t, i) => {
        const category = categories[i] || (t.type === 'income' ? 'outras_receitas' : 'outras_despesas');
        
        return {
          date: t.date,
          description: t.description,
          amount: t.type === 'expense' ? -Math.abs(t.amount) : Math.abs(t.amount),
          type: t.type,
          category: category,
          payment_method: "transferencia",
          bank_account: bankAccountName.trim(),
          notes: `Importado em ${new Date().toLocaleDateString('pt-BR')}`
        };
      });

      await base44.entities.Transaction.bulkCreate(transactionsToCreate);

      setProgress(100);
      setStatus("success");
      setExtractedCount(transactions.length);
      setMessage(`✅ ${transactions.length} transações importadas com sucesso!`);
      
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      
      setTimeout(() => {
        setFile(null);
        setBankAccountName("");
        setStatus("idle");
        setProgress(0);
        setMessage("");
      }, 4000);
      
    } catch (error) {
      console.error("Erro:", error);
      setStatus("error");
      
      let userMessage = "Erro ao processar arquivo";
      let details = "";
      
      if (error.message) {
        if (error.message.includes("encontrada") || error.message.includes("Nenhuma")) {
          userMessage = "Nenhuma transação encontrada";
          details = "O arquivo não parece conter transações bancárias válidas. Use CSV ou PDF com texto legível.";
        } else if (error.message.includes("timeout")) {
          userMessage = "Tempo excedido";
          details = "O arquivo é muito grande. Tente dividir em períodos menores (1-2 meses por arquivo).";
        } else {
          userMessage = "Erro ao processar";
          details = error.message;
        }
      }
      
      setMessage(userMessage);
      setErrorDetails(details);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Importar Extrato Bancário</h1>
        <p className="text-slate-600">
          Upload de extrato CSV ou PDF - processamento 100% automático com IA
        </p>
      </div>

      <Alert className="border-blue-200 bg-blue-50">
        <AlertCircle className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-900">
          <strong>Melhor resultado:</strong> Exporte CSV do site do banco. PDFs funcionam se tiverem texto selecionável (não foto/scan).
        </AlertDescription>
      </Alert>

      <Card className="border-2 border-dashed border-slate-200">
        <CardContent className="p-8">
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`text-center transition-colors duration-200 ${
              dragActive ? "bg-blue-50" : ""
            }`}
          >
            {!file ? (
              <>
                <div className="w-20 h-20 mx-auto mb-4 bg-blue-50 rounded-full flex items-center justify-center">
                  <Upload className="w-10 h-10 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  Arraste seu extrato aqui
                </h3>
                <p className="text-slate-600 mb-4">
                  ou clique para selecionar
                </p>
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  accept=".csv,.pdf,.png,.jpg,.jpeg"
                  onChange={handleFileInput}
                />
                <label htmlFor="file-upload">
                  <Button asChild variant="outline" className="cursor-pointer">
                    <span>Selecionar Arquivo</span>
                  </Button>
                </label>
                <p className="text-xs text-slate-500 mt-4">
                  CSV, PDF, PNG ou JPG (máx. 10MB)
                </p>
              </>
            ) : (
              <div className="space-y-4">
                <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center ${
                  status === "success" ? "bg-green-50" : status === "error" ? "bg-rose-50" : "bg-blue-50"
                }`}>
                  <FileText className={`w-10 h-10 ${
                    status === "success" ? "text-green-600" : status === "error" ? "text-rose-600" : "text-blue-600"
                  }`} />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{file.name}</p>
                  <p className="text-sm text-slate-600">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>

                {status === "idle" && (
                  <div className="max-w-md mx-auto space-y-2">
                    <Label htmlFor="bank-account-name" className="text-left block">
                      Nome da Conta Bancária *
                    </Label>
                    <Input
                      id="bank-account-name"
                      value={bankAccountName}
                      onChange={(e) => setBankAccountName(e.target.value)}
                      placeholder="Ex: C6 Bank PJ, Nubank, Bradesco..."
                      className="text-center"
                    />
                    <p className="text-xs text-slate-500">
                      Para identificar de qual conta são as transações
                    </p>
                  </div>
                )}

                {status !== "idle" && (
                  <div className="space-y-3">
                    <Progress value={progress} className="h-2" />
                    <div className="flex items-center justify-center gap-2 text-sm">
                      {status === "uploading" || status === "processing" ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                          <span className="text-slate-700 font-medium">{message}</span>
                        </>
                      ) : status === "success" ? (
                        <>
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          <span className="text-green-700 font-semibold">{message}</span>
                        </>
                      ) : (
                        <div className="space-y-2 w-full">
                          <div className="flex items-center justify-center gap-2">
                            <AlertCircle className="w-5 h-5 text-rose-600" />
                            <span className="text-rose-700 font-semibold">{message}</span>
                          </div>
                          {errorDetails && (
                            <Alert variant="destructive" className="text-left">
                              <AlertDescription className="text-sm">
                                {errorDetails}
                              </AlertDescription>
                            </Alert>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {status === "idle" && (
                  <div className="flex gap-3 justify-center">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setFile(null);
                        setBankAccountName("");
                        setErrorDetails("");
                        setMessage("");
                      }}
                    >
                      Remover
                    </Button>
                    <Button
                      onClick={processFile}
                      disabled={!bankAccountName.trim()}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Processar Extrato
                    </Button>
                  </div>
                )}

                {status === "error" && (
                  <div className="flex gap-3 justify-center pt-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setFile(null);
                        setBankAccountName("");
                        setStatus("idle");
                        setErrorDetails("");
                        setMessage("");
                      }}
                    >
                      Tentar Outro Arquivo
                    </Button>
                    <Button
                      onClick={processFile}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Tentar Novamente
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Como funciona */}
      <Card>
        <CardHeader>
          <CardTitle>Como Funciona</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold flex-shrink-0">
              1
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 mb-1">Upload do extrato</h4>
              <p className="text-sm text-slate-600">
                Envie seu extrato em CSV ou PDF (preferência: CSV do site do banco)
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold flex-shrink-0">
              2
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 mb-1">Extração automática</h4>
              <p className="text-sm text-slate-600">
                IA analisa o arquivo e extrai todas as transações (data, valor, descrição, tipo)
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold flex-shrink-0">
              3
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 mb-1">Categorização inteligente</h4>
              <p className="text-sm text-slate-600">
                Cada transação é categorizada automaticamente (vendas, salários, aluguel, etc.)
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold flex-shrink-0">
              4
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 mb-1">Pronto!</h4>
              <p className="text-sm text-slate-600">
                Visualize tudo no dashboard com análises, gráficos e relatórios automáticos
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dicas */}
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader>
          <CardTitle className="text-orange-900 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Dicas para Melhor Resultado
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-orange-900 space-y-2">
          <p>✓ <strong>CSV do banco:</strong> Melhor formato, 100% de precisão</p>
          <p>✓ <strong>PDF:</strong> Deve ter texto selecionável (não foto/scan)</p>
          <p>✓ <strong>Período:</strong> Recomendado 1-3 meses por arquivo</p>
          <p>✓ <strong>Tamanho:</strong> Máximo 10MB por arquivo</p>
          <p>✓ <strong>Nome da conta:</strong> Use nomes claros (ex: "Nubank PJ")</p>
        </CardContent>
      </Card>
    </div>
  );
}