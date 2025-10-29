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
    }
  }, []);

  const handleFileInput = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const processFile = async () => {
    if (!file) return;

    setStatus("uploading");
    setProgress(10);
    setMessage("Enviando arquivo...");

    try {
      // Upload do arquivo
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      setProgress(30);
      setStatus("processing");
      setMessage("Analisando extrato...");

      // Extrair dados do arquivo
      const schema = await base44.entities.Transaction.schema();
      const result = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url,
        json_schema: {
          type: "object",
          properties: {
            transactions: {
              type: "array",
              items: schema
            }
          }
        }
      });

      setProgress(60);
      setMessage("Processando transações...");

      if (result.status === "success" && result.output?.transactions) {
        const transactions = result.output.transactions;
        
        // Criar transações em lote
        await base44.entities.Transaction.bulkCreate(
          transactions.map(t => ({
            ...t,
            amount: t.type === 'expense' ? -Math.abs(t.amount) : Math.abs(t.amount)
          }))
        );

        setProgress(100);
        setStatus("success");
        setExtractedCount(transactions.length);
        setMessage(`${transactions.length} transações importadas com sucesso!`);
        
        queryClient.invalidateQueries({ queryKey: ['transactions'] });
        
        setTimeout(() => {
          setFile(null);
          setStatus("idle");
          setProgress(0);
        }, 3000);
      } else {
        throw new Error(result.details || "Não foi possível extrair dados do arquivo");
      }
    } catch (error) {
      setStatus("error");
      setMessage("Erro ao processar arquivo. Verifique se o formato está correto.");
      console.error(error);
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
          <strong>Dica:</strong> O sistema funciona melhor com extratos bancários em formato CSV, PDF ou imagem clara. 
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
                  Formatos aceitos: CSV, PDF, PNG, JPG
                </p>
              </>
            ) : (
              <div className="space-y-4">
                <div className="w-20 h-20 mx-auto bg-green-50 rounded-full flex items-center justify-center">
                  <FileText className="w-10 h-10 text-green-600" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{file.name}</p>
                  <p className="text-sm text-slate-600">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>

                {status !== "idle" && (
                  <div className="space-y-2">
                    <Progress value={progress} className="h-2" />
                    <div className="flex items-center justify-center gap-2 text-sm text-slate-600">
                      {status === "uploading" || status === "processing" ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          {message}
                        </>
                      ) : status === "success" ? (
                        <>
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="text-green-600 font-medium">{message}</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-4 h-4 text-rose-600" />
                          <span className="text-rose-600 font-medium">{message}</span>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {status === "idle" && (
                  <div className="flex gap-3 justify-center">
                    <Button
                      variant="outline"
                      onClick={() => setFile(null)}
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
                Selecione ou arraste o arquivo do seu extrato bancário
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
                Nossa inteligência artificial lê o arquivo e identifica todas as transações
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
                As transações são automaticamente categorizadas para facilitar a análise
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
                Visualize seus dados no dashboard e nos relatórios
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}