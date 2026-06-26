import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Upload, Download, FileSpreadsheet, CheckCircle2, AlertCircle, Loader2, History } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/instituicao/importar-bolsas")({
  component: BulkImportPage,
});

const HEADERS = [
  "nome_curso",
  "nivel_ensino",
  "modalidade",
  "turno",
  "unidade",
  "cidade",
  "valor_original",
  "valor_com_bolsa",
  "percentual_desconto",
  "quantidade_bolsas",
  "data_inicio_oferta",
  "data_fim_oferta",
  "titulo_bolsa",
  "status",
  "observacoes",
] as const;

const SAMPLE_ROWS: string[][] = [
  ["Administração","GRADUACAO","PRESENCIAL","NOITE","Unidade Centro","São Paulo","1200,00","600,00","50","10","","","Bolsa 50% Administração","ativa","Bolsa integral para 1º semestre"],
  ["Técnico em Enfermagem","TECNICO","SEMIPRESENCIAL","TARDE","Unidade Centro","São Paulo","900,00","","30","5","2026-02-01","2026-12-31","","ativa",""],
];

type ParsedRow = Record<string, string>;
type ImportError = { linha: number; motivo: string; dados: ParsedRow };

function csvEscape(v: string) {
  if (/[",\n;]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
}

function buildTemplate(): string {
  const rows = [HEADERS.join(","), ...SAMPLE_ROWS.map((r) => r.map(csvEscape).join(","))];
  return "\uFEFF" + rows.join("\n");
}

function downloadFile(name: string, content: string, mime = "text/csv;charset=utf-8") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
}

// Simple CSV parser supporting quoted fields and , or ; separators
function parseCSV(text: string): ParsedRow[] {
  const clean = text.replace(/^\uFEFF/, "");
  const lines: string[][] = [];
  let cur: string[] = [];
  let field = "";
  let inQ = false;
  const sepGuess = (clean.split("\n")[0]?.split(";").length ?? 0) > (clean.split("\n")[0]?.split(",").length ?? 0) ? ";" : ",";

  for (let i = 0; i < clean.length; i++) {
    const c = clean[i];
    if (inQ) {
      if (c === '"' && clean[i+1] === '"') { field += '"'; i++; }
      else if (c === '"') { inQ = false; }
      else { field += c; }
    } else {
      if (c === '"') inQ = true;
      else if (c === sepGuess) { cur.push(field); field = ""; }
      else if (c === "\n") { cur.push(field); lines.push(cur); cur = []; field = ""; }
      else if (c === "\r") { /* skip */ }
      else field += c;
    }
  }
  if (field.length > 0 || cur.length > 0) { cur.push(field); lines.push(cur); }

  if (lines.length === 0) return [];
  const headers = lines[0].map((h) => h.trim().toLowerCase());
  return lines.slice(1)
    .filter((row) => row.some((c) => c && c.trim() !== ""))
    .map((row) => {
      const obj: ParsedRow = {};
      headers.forEach((h, idx) => { obj[h] = (row[idx] ?? "").trim(); });
      return obj;
    });
}

function BulkImportPage() {
  const qc = useQueryClient();
  const { institutionAdminOf } = useAuth();
  const [institutionId, setInstitutionId] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [dragOver, setDragOver] = useState(false);

  const { data: institutions } = useQuery({
    enabled: institutionAdminOf.length > 0,
    queryKey: ["my-inst-mini", institutionAdminOf],
    queryFn: async () => {
      const { data } = await supabase.from("institutions").select("id, trade_name").in("id", institutionAdminOf);
      return data ?? [];
    },
  });

  useMemo(() => {
    if (!institutionId && institutions?.[0]) setInstitutionId(institutions[0].id);
  }, [institutions, institutionId]);

  const { data: history } = useQuery({
    enabled: !!institutionId,
    queryKey: ["scholarship-imports", institutionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("scholarship_imports")
        .select("id, file_name, total_rows, imported_count, failed_count, status, created_at, errors")
        .eq("institution_id", institutionId)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data ?? [];
    },
  });

  function handleFile(file: File) {
    if (!file.name.toLowerCase().endsWith(".csv")) {
      toast.error("Envie um arquivo .csv");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = parseCSV(String(reader.result ?? ""));
        if (parsed.length === 0) { toast.error("Arquivo vazio ou sem registros válidos."); return; }
        const missing = ["nome_curso","valor_original"].filter((k) => !(k in parsed[0]));
        if (missing.length) { toast.error("Colunas obrigatórias ausentes: " + missing.join(", ")); return; }
        setRows(parsed);
        setFileName(file.name);
        toast.success(`${parsed.length} linhas lidas. Revise a pré-visualização.`);
      } catch (e) {
        toast.error("Falha ao ler CSV: " + (e as Error).message);
      }
    };
    reader.readAsText(file, "utf-8");
  }

  const importMut = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc("bulk_import_scholarships", {
        p_institution_id: institutionId,
        p_file_name: fileName,
        p_rows: rows as never,
      });
      if (error) throw error;
      return data as { import_id: string; total: number; imported: number; failed: number; errors: ImportError[] };
    },
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["scholarship-imports", institutionId] });
      toast.success(`${res.imported} bolsa(s) importada(s). ${res.failed} com erro.`);
      if (res.failed > 0 && res.errors?.length) {
        downloadErrorReport(res.errors);
      }
      setRows([]); setFileName("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function downloadErrorReport(errors: ImportError[]) {
    const headers = [...HEADERS, "erro_importacao"];
    const lines = [headers.join(",")];
    for (const e of errors) {
      const row = HEADERS.map((h) => csvEscape(String(e.dados?.[h] ?? "")));
      row.push(csvEscape(e.motivo));
      lines.push(row.join(","));
    }
    downloadFile(`erros-importacao-${Date.now()}.csv`, "\uFEFF" + lines.join("\n"));
  }

  if (institutionAdminOf.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card p-10 text-center">
        <h1 className="font-display text-xl font-bold">Acesso restrito</h1>
        <p className="text-muted-foreground mt-2">Você precisa ter uma instituição aprovada para importar bolsas.</p>
        <Button asChild className="mt-4"><Link to="/instituicao">Voltar</Link></Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link to="/instituicao" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Link>

      <header>
        <h1 className="font-display text-3xl font-extrabold tracking-tight flex items-center gap-2">
          <FileSpreadsheet className="h-7 w-7 text-primary" /> Importar bolsas via CSV
        </h1>
        <p className="text-muted-foreground mt-1">
          Cadastre dezenas de bolsas de uma vez. Baixe o modelo, preencha e envie.
        </p>
      </header>

      {institutions && institutions.length > 1 && (
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium">Instituição:</label>
          <Select value={institutionId} onValueChange={setInstitutionId}>
            <SelectTrigger className="w-[280px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {institutions.map((i) => <SelectItem key={i.id} value={i.id}>{i.trade_name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Como preencher o arquivo</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>1. Baixe o modelo oficial e abra no Excel ou Google Sheets.</p>
          <p>2. Preencha uma linha por bolsa. Valores em reais usam vírgula decimal (ex.: <code>1200,00</code>).</p>
          <p>3. Você pode informar <code>valor_com_bolsa</code> OU <code>percentual_desconto</code> — calculamos o outro automaticamente.</p>
          <p>4. Cursos novos serão criados automaticamente. Unidades são casadas pelo nome ou cidade.</p>
          <p>5. Níveis: GRADUACAO, POS_GRADUACAO, MBA, TECNICO, IDIOMAS, PROFISSIONALIZANTE, CURSO_LIVRE, PRE_VESTIBULAR, EJA, FUNDAMENTAL, MEDIO, MESTRADO.</p>
          <p>6. Modalidades: PRESENCIAL, SEMIPRESENCIAL, EAD. Turnos: MANHA, TARDE, NOITE, INTEGRAL, FLEXIVEL.</p>
          <div className="pt-2">
            <Button variant="outline" className="gap-2" onClick={() => downloadFile("modelo-bolsas-todebolsa.csv", buildTemplate())}>
              <Download className="h-4 w-4" /> Baixar modelo CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">1. Enviar arquivo</CardTitle></CardHeader>
        <CardContent>
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault(); setDragOver(false);
              const f = e.dataTransfer.files?.[0]; if (f) handleFile(f);
            }}
            className={"rounded-xl border-2 border-dashed p-8 text-center transition-colors " + (dragOver ? "border-primary bg-primary/5" : "border-border")}
          >
            <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
            <p className="mt-2 text-sm">Arraste o CSV aqui ou</p>
            <label className="inline-block mt-2">
              <input type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
              <span className="inline-flex items-center gap-2 cursor-pointer rounded-md border border-input bg-background px-3 py-2 text-sm hover:bg-accent">
                Selecionar arquivo
              </span>
            </label>
            {fileName && <p className="mt-3 text-xs text-muted-foreground">Selecionado: <strong>{fileName}</strong> ({rows.length} linhas)</p>}
          </div>
        </CardContent>
      </Card>

      {rows.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">2. Pré-visualização ({rows.length} linhas)</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => { setRows([]); setFileName(""); }}>Limpar</Button>
              <Button onClick={() => importMut.mutate()} disabled={importMut.isPending || !institutionId} className="gap-2">
                {importMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                Confirmar importação
              </Button>
            </div>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  {HEADERS.slice(0, 9).map((h) => <TableHead key={h}>{h}</TableHead>)}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.slice(0, 50).map((r, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                    {HEADERS.slice(0, 9).map((h) => <TableCell key={h} className="whitespace-nowrap text-xs">{r[h] ?? ""}</TableCell>)}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {rows.length > 50 && <p className="mt-2 text-xs text-muted-foreground">Mostrando primeiras 50 linhas de {rows.length}.</p>}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><History className="h-4 w-4" /> Histórico de importações</CardTitle>
        </CardHeader>
        <CardContent>
          {!history || history.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma importação registrada ainda.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Arquivo</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Importadas</TableHead>
                  <TableHead>Erros</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((h) => {
                  const tone = h.status === "COMPLETED" ? "bg-primary-soft text-primary"
                    : h.status === "PARTIAL" ? "bg-warning/15 text-warning-foreground"
                    : "bg-destructive/15 text-destructive";
                  return (
                    <TableRow key={h.id}>
                      <TableCell className="text-xs">{new Date(h.created_at).toLocaleString("pt-BR")}</TableCell>
                      <TableCell className="text-xs">{h.file_name ?? "—"}</TableCell>
                      <TableCell>{h.total_rows}</TableCell>
                      <TableCell className="text-primary font-semibold">{h.imported_count}</TableCell>
                      <TableCell className={h.failed_count > 0 ? "text-destructive font-semibold" : ""}>{h.failed_count}</TableCell>
                      <TableCell><Badge className={tone + " border-0"}>{h.status}</Badge></TableCell>
                      <TableCell>
                        {h.failed_count > 0 && Array.isArray(h.errors) && (
                          <Button size="sm" variant="ghost" className="gap-1" onClick={() => downloadErrorReport(h.errors as unknown as ImportError[])}>
                            <AlertCircle className="h-3 w-3" /> Erros
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
