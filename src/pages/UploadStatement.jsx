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
      // Upload do arquivo
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      setProgress(30);
      setStatus("processing");
      setMessage("Analisando extrato com IA... (pode levar até 30 segundos)");

      // Schema mais simples e robusto
      const extractionSchema = {
        type: "object",
        properties: {
          transactions: {
            type: "array",
            description: "Lista de transações extraídas do extrato. Extraia TODAS as linhas de movimentação do extrato.",
            items: {
              type: "object",
              properties: {
                date: {
                  type: "string",
                  description: "Data da transação no formato YYYY-MM-DD. Se o ano não estiver no extrato, use o ano atual."
                },
                description: {
                  type: "string",
                  description: "Descrição completa da transação como aparece no extrato"
                },
                amount: {
                  type: "number",
                  description: "Valor absoluto da transação (sempre número positivo, sem vírgulas ou pontos de formatação)"
                },
                type: {
                  type: "string",
                  enum: ["income", "expense"],
                  description: "Use 'income' para CRÉDITOS/ENTRADAS e 'expense' para DÉBITOS/SAÍDAS"
                }
              },
              required: ["date", "description", "amount", "type"]
            }
          }
        },
        required: ["transactions"]
      };

      setProgress(50);

      // Extrair dados do arquivo com timeout aumentado
      const result = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url,
        json_schema: extractionSchema
      });

      setProgress(70);

      if (result.status === "success" && result.output?.transactions) {
        let transactions = result.output.transactions;
        
        // Validação e limpeza dos dados
        transactions = transactions.filter(t => {
          // Remove transações inválidas
          if (!t.date || !t.description || !t.amount || !t.type) {
            console.warn('Transação inválida ignorada:', t);
            return false;
          }
          return true;
        });
        
        if (transactions.length === 0) {
          throw new Error("Nenhuma transação válida foi encontrada no arquivo. Verifique se o arquivo contém um extrato bancário com movimentações.");
        }

        setMessage(`Categorizando ${transactions.length} transações...`);
        setProgress(80);

        // Categoriza usando IA em lote
        const categorizationPrompt = `Você é um especialista em categorização financeira para empresas brasileiras.

Categorize cada transação abaixo em UMA das seguintes categorias:

**Para RECEITAS (income):**
- vendas: Vendas de produtos/serviços
- servicos: Prestação de serviços, honorários profissionais
- outras_receitas: Outras receitas não especificadas

**Para DESPESAS (expense):**
- salarios_funcionarios: Pagamentos de salários e folha
- fornecedores: Pagamentos a fornecedores e prestadores
- aluguel: Aluguel comercial
- contas_servicos: Contas (luz, água, internet, telefone)
- impostos_taxas: Impostos, taxas, tributos
- marketing_publicidade: Marketing e publicidade
- equipamentos_materiais: Equipamentos, materiais, software
- manutencao: Manutenção e reparos
- combustivel_transporte: Combustível e transporte
- outras_despesas: Outras despesas

**Transações:**
${transactions.map((t, i) => `${i + 1}. ${t.description} | ${t.type} | R$ ${t.amount}`).join('\n')}

Responda APENAS com um JSON array no formato:
["categoria1", "categoria2", "categoria3", ...]

Exemplo: ["vendas", "fornecedores", "contas_servicos"]`;

        let categories = [];
        try {
          const categorizationResult = await base44.integrations.Core.InvokeLLM({
            prompt: categorizationPrompt,
            add_context_from_internet: false,
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
          
          categories = categorizationResult.categories || [];
        } catch (error) {
          console.error('Erro na categorização:', error);
          // Usa categorias padrão se falhar
          categories = transactions.map(t => 
            t.type === 'income' ? 'outras_receitas' : 'outras_despesas'
          );
        }

        setProgress(90);
        
        // Criar transações em lote
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
            notes: `Importado do extrato em ${new Date().toLocaleDateString('pt-BR')}`
          };
        });

        await base44.entities.Transaction.bulkCreate(transactionsToCreate);

        setProgress(100);
        setStatus("success");
        setExtractedCount(transactions.length);
        setMessage(`✅ ${transactions.length} transações importadas para ${bankAccountName}!`);
        
        queryClient.invalidateQueries({ queryKey: ['transactions'] });
        
        setTimeout(() => {
          setFile(null);
          setBankAccountName("");
          setStatus("idle");
          setProgress(0);
          setMessage("");
        }, 4000);
      } else {
        throw new Error(result.details || "Não foi possível extrair dados do arquivo. O formato pode não ser compatível ou o arquivo pode estar vazio.");
      }
    } catch (error) {
      console.error("Erro completo:", error);
      setStatus("error");
      
      let userMessage = "Erro ao processar o arquivo";
      let details = "";
      
      if (error.message) {
        if (error.message.includes("encontrada") || error.message.includes("válida")) {
          userMessage = "Nenhuma transação encontrada";
          details = "Verifique se o arquivo é um extrato bancário válido com movimentações. Aceitos: CSV do banco ou PDF com texto selecionável.";
        } else if (error.message.includes("formato") || error.message.includes("compatível")) {
          userMessage = "Formato não reconhecido";
          details = "Tente exportar o extrato em formato CSV diretamente do seu banco, ou use um PDF com texto legível (não escaneado).";
        } else if (error.message.includes("timeout") || error.message.includes("tempo")) {
          userMessage = "Tempo de processamento excedido";
          details = "O arquivo é muito grande ou complexo. Tente dividir o extrato em períodos menores (ex: mês a mês).";
        } else {
          userMessage = "Erro ao processar extrato";
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
          Faça upload do seu extrato em CSV ou PDF e deixe a IA processar automaticamente
        </p>
      </div>

      {/* Instruções */}
      <Alert className="border-blue-200 bg-blue-50">
        <AlertCircle className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-900">
          <strong>Melhor resultado:</strong> Use extratos em formato CSV exportados diretamente do site do seu banco. 
          PDFs também funcionam, mas devem ter texto selecionável (não escaneados).
        </AlertDescription>
      </Alert>

      {/* Upload Area */}
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
                  ou clique para selecionar do seu computador
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
                  Formatos aceitos: CSV, PDF, PNG, JPG (máx. 10MB)
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

                {/* Campo para nome da conta bancária */}
                {status === "idle" && (
                  <div className="max-w-md mx-auto space-y-2">
                    <Label htmlFor="bank-account-name" className="text-left block">
                      Nome da Conta Bancária *
                    </Label>
                    <Input
                      id="bank-account-name"
                      value={bankAccountName}
                      onChange={(e) => setBankAccountName(e.target.value)}
                      placeholder="Ex: C6 Bank, Nubank, Banco do Brasil..."
                      className="text-center"
                    />
                    <p className="text-xs text-slate-500">
                      Isso ajudará a identificar de qual conta são essas transações
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
                        <div className="space-y-2">
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
              <h4 className="font-semibold text-slate-900 mb-1">Faça upload do extrato</h4>
              <p className="text-sm text-slate-600">
                Exporte o extrato do site do seu banco em formato CSV ou PDF (com texto selecionável)
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold flex-shrink-0">
              2
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 mb-1">Informe a conta bancária</h4>
              <p className="text-sm text-slate-600">
                Digite o nome da conta (ex: C6 Bank, Nubank) para identificar as transações
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold flex-shrink-0">
              3
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 mb-1">IA processa automaticamente</h4>
              <p className="text-sm text-slate-600">
                Nossa inteligência artificial extrai todas as transações, identificando datas, valores e descrições
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold flex-shrink-0">
              4
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 mb-1">Categorização inteligente</h4>
              <p className="text-sm text-slate-600">
                As transações são automaticamente categorizadas (vendas, despesas, impostos, etc.) para facilitar a análise
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold flex-shrink-0">
              5
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 mb-1">Pronto para análise</h4>
              <p className="text-sm text-slate-600">
                Visualize seus dados no dashboard com gráficos e relatórios automáticos, separados por conta
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dicas para melhor resultado */}
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader>
          <CardTitle className="text-orange-900 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Dicas para Melhor Resultado
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-orange-900 space-y-2">
          <p>✓ <strong>Melhor opção:</strong> Exporte extrato em CSV do site do banco</p>
          <p>✓ PDFs devem ter texto selecionável (não escaneados ou fotos)</p>
          <p>✓ Extratos muito grandes: divida em períodos menores (1-3 meses)</p>
          <p>✓ Certifique-se de que o arquivo contém data, descrição e valor</p>
          <p>✓ Use nomes de contas descritivos (ex: "C6 Bank Conta PJ")</p>
        </CardContent>
      </Card>
    </div>
  );
}