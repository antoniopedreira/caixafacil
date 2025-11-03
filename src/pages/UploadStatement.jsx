import React, { useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Upload, FileText, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

export default function UploadStatement() {
  const queryClient = useQueryClient();
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [status, setStatus] = useState("idle"); // idle, uploading, processing, success, error
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
    }
  }, []);

  const handleFileInput = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setStatus("idle");
      setErrorDetails("");
    }
  };

  const processFile = async () => {
    if (!file) return;

    setStatus("uploading");
    setProgress(10);
    setMessage("Enviando arquivo...");
    setErrorDetails("");

    try {
      // Upload do arquivo
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      setProgress(30);
      setStatus("processing");
      setMessage("Analisando extrato com IA...");

      // Schema simplificado para extração
      const extractionSchema = {
        type: "object",
        properties: {
          transactions: {
            type: "array",
            description: "Lista de todas as transações encontradas no extrato bancário",
            items: {
              type: "object",
              properties: {
                date: {
                  type: "string",
                  format: "date",
                  description: "Data da transação no formato YYYY-MM-DD"
                },
                description: {
                  type: "string",
                  description: "Descrição ou histórico da transação"
                },
                amount: {
                  type: "number",
                  description: "Valor da transação (sempre positivo)"
                },
                type: {
                  type: "string",
                  enum: ["income", "expense"],
                  description: "Tipo: income para entradas/créditos, expense para saídas/débitos"
                },
                category: {
                  type: "string",
                  enum: [
                    "vendas",
                    "servicos",
                    "outras_receitas",
                    "salarios_funcionarios",
                    "fornecedores",
                    "aluguel",
                    "contas_servicos",
                    "impostos_taxas",
                    "marketing_publicidade",
                    "equipamentos_materiais",
                    "manutencao",
                    "combustivel_transporte",
                    "outras_despesas"
                  ],
                  description: "Categoria que melhor representa a transação"
                }
              },
              required: ["date", "description", "amount", "type", "category"]
            }
          }
        },
        required: ["transactions"]
      };

      // Extrair dados do arquivo
      const result = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url,
        json_schema: extractionSchema
      });

      setProgress(70);

      if (result.status === "success" && result.output?.transactions) {
        const transactions = result.output.transactions;
        
        if (transactions.length === 0) {
          throw new Error("Nenhuma transação foi encontrada no arquivo. Verifique se o arquivo contém um extrato bancário válido.");
        }

        setMessage(`Importando ${transactions.length} transações...`);
        setProgress(80);
        
        // Criar transações em lote
        const transactionsToCreate = transactions.map(t => ({
          date: t.date,
          description: t.description,
          amount: t.type === 'expense' ? -Math.abs(t.amount) : Math.abs(t.amount),
          type: t.type,
          category: t.category,
          payment_method: "transferencia",
          notes: `Importado do extrato em ${new Date().toLocaleDateString('pt-BR')}`
        }));

        await base44.entities.Transaction.bulkCreate(transactionsToCreate);

        setProgress(100);
        setStatus("success");
        setExtractedCount(transactions.length);
        setMessage(`✅ ${transactions.length} transações importadas com sucesso!`);
        
        queryClient.invalidateQueries({ queryKey: ['transactions'] });
        
        setTimeout(() => {
          setFile(null);
          setStatus("idle");
          setProgress(0);
          setMessage("");
        }, 4000);
      } else {
        throw new Error(result.details || "Não foi possível extrair dados do arquivo. O formato pode não ser compatível.");
      }
    } catch (error) {
      console.error("Erro completo:", error);
      setStatus("error");
      
      let userMessage = "Erro ao processar o arquivo.";
      let details = "";
      
      if (error.message) {
        if (error.message.includes("encontrada")) {
          userMessage = "Nenhuma transação encontrada no arquivo";
          details = "Verifique se o arquivo é um extrato bancário válido com movimentações.";
        } else if (error.message.includes("formato")) {
          userMessage = "Formato de arquivo não reconhecido";
          details = "Tente com um PDF mais legível ou exporte seu extrato em formato CSV.";
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
          Faça upload do seu extrato em CSV, PDF ou imagem e deixe a IA processar automaticamente
        </p>
      </div>

      {/* Instruções */}
      <Alert className="border-blue-200 bg-blue-50">
        <AlertCircle className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-900">
          <strong>Dica:</strong> O sistema funciona melhor com extratos bancários em formato CSV ou PDF com texto selecionável. 
          Certifique-se de que as informações de data, descrição e valor estejam visíveis.
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
                        setErrorDetails("");
                      }}
                    >
                      Remover
                    </Button>
                    <Button
                      onClick={processFile}
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
                        setStatus("idle");
                        setErrorDetails("");
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
                Selecione ou arraste o arquivo do seu extrato bancário (PDF, CSV ou imagem)
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold flex-shrink-0">
              2
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 mb-1">IA processa automaticamente</h4>
              <p className="text-sm text-slate-600">
                Nossa inteligência artificial lê o arquivo e identifica todas as transações com suas datas, valores e descrições
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
                As transações são automaticamente categorizadas (vendas, despesas, impostos, etc.) para facilitar a análise
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold flex-shrink-0">
              4
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 mb-1">Pronto para análise</h4>
              <p className="text-sm text-slate-600">
                Visualize seus dados no dashboard com gráficos e relatórios automáticos
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
          <p>✓ Use PDFs com texto selecionável (não escaneados)</p>
          <p>✓ Extratos em formato CSV funcionam melhor</p>
          <p>✓ Certifique-se de que o arquivo contém data, descrição e valor</p>
          <p>✓ Evite arquivos muito grandes (máx. 10MB)</p>
        </CardContent>
      </Card>
    </div>
  );
}