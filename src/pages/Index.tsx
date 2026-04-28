import { useEffect, useMemo, useState } from "react";
import {
  Product,
  AuditStatus,
  loadProducts,
  saveProducts,
  getAuditor,
  setAuditor as persistAuditor,
  clearProducts,
} from "@/lib/auditStorage";
import { AuditorBar } from "@/components/AuditorBar";
import { ImportExport } from "@/components/ImportExport";
import { ProductCard } from "@/components/ProductCard";
import { BarcodeScanner } from "@/components/BarcodeScanner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, ClipboardList, ScanBarcode, X } from "lucide-react";
import { toast } from "sonner";

type Filter = "all" | AuditStatus | "area_venda";

const Index = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [auditor, setAuditorState] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [scannerOpen, setScannerOpen] = useState(false);

  useEffect(() => {
    setProducts(loadProducts());
    setAuditorState(getAuditor());
  }, []);

  const persist = (next: Product[]) => {
    setProducts(next);
    saveProducts(next);
  };

  const handleAuditor = (name: string) => {
    persistAuditor(name);
    setAuditorState(name);
  };

  const updateProduct = (p: Product) => {
    persist(products.map((x) => (x.id === p.id ? p : x)));
  };

  const stats = useMemo(() => {
    return {
      total: products.length,
      found: products.filter((p) => p.status === "found").length,
      not_found: products.filter((p) => p.status === "not_found").length,
      pending: products.filter((p) => p.status === "pending").length,
      area_venda: products.filter((p) => p.naAreaVenda).length,
    };
  }, [products]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      if (filter === "area_venda") {
        if (!p.naAreaVenda) return false;
      } else if (filter !== "all" && p.status !== filter) {
        return false;
      }
      if (dateFilter) {
        if (!p.data) return false;
        const d = new Date(p.data).toISOString().slice(0, 10);
        if (d !== dateFilter) return false;
      }
      if (!q) return true;
      return (
        p.codigo.toLowerCase().includes(q) ||
        p.descricao.toLowerCase().includes(q) ||
        (p.codigoBarras ?? "").toLowerCase().includes(q)
      );
    });
  }, [products, filter, query, dateFilter]);

  const handleBarcode = (code: string) => {
    setScannerOpen(false);
    const trimmed = code.trim();
    setQuery(trimmed);
    const match = products.find(
      (p) => p.codigoBarras === trimmed || p.codigo === trimmed,
    );
    if (match) {
      toast.success(`Produto encontrado: ${match.descricao}`);
    } else {
      toast.error(`Nenhum produto com código ${trimmed}`);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-8">
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <h1 className="flex items-center gap-2 text-xl font-bold">
            <ClipboardList className="h-6 w-6 text-primary" />
            Auditoria de Produtos
          </h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        <AuditorBar auditor={auditor} onChange={handleAuditor} />

        <ImportExport
          products={products}
          onImport={(p) => {
            persist(p);
          }}
          onClear={() => {
            clearProducts();
            setProducts([]);
            toast.success("Lista limpa");
          }}
        />

        {products.length > 0 && (
          <>
            <div className="grid grid-cols-5 gap-2 text-center">
              <div className="rounded-lg border bg-card p-2">
                <p className="text-[10px] text-muted-foreground">Total</p>
                <p className="font-bold text-sm">{stats.total}</p>
              </div>
              <div className="rounded-lg border bg-card p-2">
                <p className="text-[10px] text-muted-foreground">Pend.</p>
                <p className="font-bold text-sm">{stats.pending}</p>
              </div>
              <div className="rounded-lg border bg-card p-2">
                <p className="text-[10px] text-green-700">OK</p>
                <p className="font-bold text-sm text-green-700">{stats.found}</p>
              </div>
              <div className="rounded-lg border bg-card p-2">
                <p className="text-[10px] text-destructive">Falta</p>
                <p className="font-bold text-sm text-destructive">{stats.not_found}</p>
              </div>
              <div className="rounded-lg border bg-card p-2">
                <p className="text-[10px] text-blue-700">Área</p>
                <p className="font-bold text-sm text-blue-700">{stats.area_venda}</p>
              </div>
            </div>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar código, barras ou descrição"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-9 pr-9"
                />
                {query && (
                  <button
                    onClick={() => setQuery("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setScannerOpen(true)}
                aria-label="Ler código de barras"
              >
                <ScanBarcode className="h-5 w-5" />
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs text-muted-foreground shrink-0">Data:</label>
              <Input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="h-9"
              />
              {dateFilter && (
                <Button variant="ghost" size="sm" onClick={() => setDateFilter("")}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
              <TabsList className="grid grid-cols-5 w-full h-auto">
                <TabsTrigger value="all" className="text-xs px-1">Todos</TabsTrigger>
                <TabsTrigger value="pending" className="text-xs px-1">Pend.</TabsTrigger>
                <TabsTrigger value="found" className="text-xs px-1">OK</TabsTrigger>
                <TabsTrigger value="not_found" className="text-xs px-1">Falta</TabsTrigger>
                <TabsTrigger value="area_venda" className="text-xs px-1">Área</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="space-y-3">
              {filtered.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-8">
                  Nenhum produto nesta visão.
                </p>
              ) : (
                filtered.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    auditor={auditor}
                    onUpdate={updateProduct}
                    onRequireAuditor={() => toast.error("Informe seu nome de auditor primeiro")}
                  />
                ))
              )}
            </div>
          </>
        )}

        {products.length === 0 && (
          <div className="text-center py-12 space-y-2">
            <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground" />
            <h2 className="font-semibold">Nenhum produto carregado</h2>
            <p className="text-sm text-muted-foreground px-6">
              Importe uma planilha Excel (.xlsx) com colunas <strong>código</strong>,{" "}
              <strong>descrição</strong>, <strong>quantidade</strong> e opcionalmente{" "}
              <strong>código de barras</strong>.
            </p>
          </div>
        )}
      </main>

      <BarcodeScanner
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onDetected={handleBarcode}
      />
    </div>
  );
};

export default Index;
