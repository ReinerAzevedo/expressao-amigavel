import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, getServerUrl, ProdutoServer, RecorrenciaItem, SessaoServer } from "@/lib/serverApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ArrowLeft, Database, Image as ImageIcon, RefreshCw, Search, AlertTriangle } from "lucide-react";
import { PhotoViewer } from "@/components/PhotoViewer";
import { toast } from "sonner";

const formatDate = (s?: string) =>
  s ? new Date(s).toLocaleString("pt-BR") : "-";

const Historico = () => {
  const hasServer = !!getServerUrl();

  return (
    <div className="min-h-screen bg-background pb-8">
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/" aria-label="Voltar">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="flex items-center gap-2 text-xl font-bold">
            <Database className="h-6 w-6 text-primary" />
            Histórico
          </h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        {!hasServer ? (
          <div className="rounded-lg border border-dashed p-6 text-center space-y-2">
            <AlertTriangle className="h-8 w-8 mx-auto text-muted-foreground" />
            <h2 className="font-semibold">Servidor não configurado</h2>
            <p className="text-sm text-muted-foreground">
              Configure o endereço do PC Windows na tela inicial (engrenagem) para visualizar o histórico acumulado.
            </p>
            <Button asChild variant="outline">
              <Link to="/">Voltar</Link>
            </Button>
          </div>
        ) : (
          <Tabs defaultValue="sessoes">
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="sessoes">Sessões</TabsTrigger>
              <TabsTrigger value="recorrencia">Recorrência</TabsTrigger>
              <TabsTrigger value="busca">Buscar código</TabsTrigger>
            </TabsList>

            <TabsContent value="sessoes" className="mt-4">
              <Sessoes />
            </TabsContent>
            <TabsContent value="recorrencia" className="mt-4">
              <Recorrencia />
            </TabsContent>
            <TabsContent value="busca" className="mt-4">
              <BuscaCodigo />
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
};

// --- Sessões ---------------------------------------------------------------
const Sessoes = () => {
  const [sessoes, setSessoes] = useState<SessaoServer[] | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [produtos, setProdutos] = useState<ProdutoServer[]>([]);
  const [foto, setFoto] = useState<string | null>(null);

  const load = async () => {
    setSessoes(null);
    try {
      setSessoes(await api.listSessoes());
    } catch {
      toast.error("Falha ao carregar sessões");
      setSessoes([]);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openSessao = async (id: string) => {
    setOpenId(id);
    setProdutos([]);
    try {
      setProdutos(await api.listProdutosDaSessao(id));
    } catch {
      toast.error("Falha ao carregar produtos");
    }
  };

  if (openId) {
    return (
      <div className="space-y-3">
        <Button variant="ghost" size="sm" onClick={() => setOpenId(null)}>
          <ArrowLeft className="h-4 w-4" /> Voltar às sessões
        </Button>
        {produtos.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">Carregando...</p>
        ) : (
          produtos.map((p) => <ProdutoLinha key={p.id} p={p} onFoto={setFoto} />)
        )}
        <PhotoViewer fotoId={foto} onClose={() => setFoto(null)} />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Button variant="outline" size="sm" onClick={load} className="w-full">
        <RefreshCw className="h-4 w-4" /> Atualizar
      </Button>
      {sessoes === null ? (
        <p className="text-sm text-muted-foreground text-center py-6">Carregando...</p>
      ) : sessoes.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">Nenhuma sessão ainda.</p>
      ) : (
        sessoes.map((s) => (
          <button
            key={s.id}
            onClick={() => openSessao(s.id)}
            className="w-full text-left rounded-lg border bg-card p-3 hover:bg-accent transition"
          >
            <div className="flex justify-between items-start gap-2">
              <div className="min-w-0">
                <p className="font-semibold truncate">{s.nome || "Sem nome"}</p>
                <p className="text-xs text-muted-foreground">{formatDate(s.criado_em)}</p>
              </div>
              <Badge variant="secondary">{s.total} itens</Badge>
            </div>
            <div className="flex flex-wrap gap-1 mt-2 text-[11px]">
              <Badge className="bg-green-600 hover:bg-green-600">OK {s.encontrados}</Badge>
              <Badge variant="destructive">Falta {s.nao_encontrados}</Badge>
              <Badge variant="secondary">Pend {s.pendentes}</Badge>
              <Badge className="bg-blue-600 hover:bg-blue-600">Área {s.na_area}</Badge>
            </div>
          </button>
        ))
      )}
    </div>
  );
};

// --- Recorrência -----------------------------------------------------------
const Recorrencia = () => {
  const [filter, setFilter] = useState<"all" | "not_found" | "pending_or_missing">("all");
  const [items, setItems] = useState<RecorrenciaItem[] | null>(null);

  const load = async (f: typeof filter) => {
    setItems(null);
    try {
      setItems(await api.recorrencia(f));
    } catch {
      toast.error("Falha ao carregar recorrência");
      setItems([]);
    }
  };

  useEffect(() => {
    load(filter);
  }, [filter]);

  return (
    <div className="space-y-3">
      <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="all" className="text-xs">Todos</TabsTrigger>
          <TabsTrigger value="not_found" className="text-xs">Não encontrados</TabsTrigger>
          <TabsTrigger value="pending_or_missing" className="text-xs">Pend + Falta</TabsTrigger>
        </TabsList>
      </Tabs>

      {items === null ? (
        <p className="text-sm text-muted-foreground text-center py-6">Carregando...</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">Sem dados ainda.</p>
      ) : (
        items.map((r) => (
          <div key={r.codigo} className="rounded-lg border bg-card p-3">
            <div className="flex justify-between gap-2">
              <div className="min-w-0">
                <p className="font-mono text-sm font-semibold">{r.codigo}</p>
                <p className="text-sm truncate">{r.descricao}</p>
              </div>
              <Badge variant="secondary">{r.ocorrencias}×</Badge>
            </div>
            <div className="flex flex-wrap gap-1 mt-2 text-[11px]">
              <Badge className="bg-green-600 hover:bg-green-600">OK {r.vezes_encontrado}</Badge>
              <Badge variant="destructive">Falta {r.vezes_nao_encontrado}</Badge>
              <Badge variant="secondary">Pend {r.vezes_pendente}</Badge>
              <Badge className="bg-blue-600 hover:bg-blue-600">Área {r.vezes_na_area}</Badge>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">Última: {formatDate(r.ultima)}</p>
          </div>
        ))
      )}
    </div>
  );
};

// --- Busca por código ------------------------------------------------------
const BuscaCodigo = () => {
  const [q, setQ] = useState("");
  const [items, setItems] = useState<ProdutoServer[] | null>(null);
  const [foto, setFoto] = useState<string | null>(null);

  const buscar = async () => {
    if (!q.trim()) return;
    setItems(null);
    try {
      setItems(await api.historico(q.trim()));
    } catch {
      toast.error("Falha na busca");
      setItems([]);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Código do produto"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && buscar()}
            className="pl-9"
          />
        </div>
        <Button onClick={buscar}>Buscar</Button>
      </div>

      {items === null ? null : items.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">Sem registros.</p>
      ) : (
        items.map((p) => <ProdutoLinha key={p.id} p={p} onFoto={setFoto} showSession />)
      )}
      <PhotoViewer fotoId={foto} onClose={() => setFoto(null)} />
    </div>
  );
};

const ProdutoLinha = ({
  p,
  onFoto,
  showSession,
}: {
  p: ProdutoServer;
  onFoto: (id: string) => void;
  showSession?: boolean;
}) => (
  <div className="rounded-lg border bg-card p-3 space-y-1">
    <div className="flex justify-between gap-2">
      <div className="min-w-0">
        <p className="font-mono text-sm font-semibold">{p.codigo}</p>
        <p className="text-sm truncate">{p.descricao}</p>
      </div>
      <div className="flex flex-col items-end gap-1">
        {p.status === "found" && <Badge className="bg-green-600 hover:bg-green-600">OK</Badge>}
        {p.status === "not_found" && <Badge variant="destructive">Falta</Badge>}
        {p.status === "pending" && <Badge variant="secondary">Pend.</Badge>}
        {p.naAreaVenda && (
          <Badge className="bg-blue-600 hover:bg-blue-600">Área</Badge>
        )}
      </div>
    </div>
    <div className="text-[11px] text-muted-foreground space-y-0.5">
      {showSession && p.sessaoNome && (
        <p>
          Sessão: <span className="font-medium">{p.sessaoNome}</span>{" "}
          ({formatDate(p.sessaoData)})
        </p>
      )}
      {p.auditor && <p>Por: {p.auditor} em {formatDate(p.data)}</p>}
      {p.naAreaVenda && (
        <p>
          Área de venda: {p.areaVendaAuditor} em {formatDate(p.areaVendaData)}
        </p>
      )}
    </div>
    {p.fotoId && (
      <Button size="sm" variant="ghost" onClick={() => onFoto(p.fotoId!)}>
        <ImageIcon className="h-4 w-4" /> Ver foto
      </Button>
    )}
  </div>
);

export default Historico;
