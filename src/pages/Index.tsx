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
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, ClipboardList } from "lucide-react";
import { toast } from "sonner";

type Filter = "all" | AuditStatus;

const Index = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [auditor, setAuditorState] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

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
    };
  }, [products]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      if (filter !== "all" && p.status !== filter) return false;
      if (!q) return true;
      return (
        p.codigo.toLowerCase().includes(q) || p.descricao.toLowerCase().includes(q)
      );
    });
  }, [products, filter, query]);

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
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="rounded-lg border bg-card p-2">
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="font-bold">{stats.total}</p>
              </div>
              <div className="rounded-lg border bg-card p-2">
                <p className="text-xs text-muted-foreground">Pend.</p>
                <p className="font-bold">{stats.pending}</p>
              </div>
              <div className="rounded-lg border bg-card p-2">
                <p className="text-xs text-green-700">OK</p>
                <p className="font-bold text-green-700">{stats.found}</p>
              </div>
              <div className="rounded-lg border bg-card p-2">
                <p className="text-xs text-destructive">Falta</p>
                <p className="font-bold text-destructive">{stats.not_found}</p>
              </div>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar código ou descrição"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
              <TabsList className="grid grid-cols-4 w-full">
                <TabsTrigger value="all">Todos</TabsTrigger>
                <TabsTrigger value="pending">Pend.</TabsTrigger>
                <TabsTrigger value="found">OK</TabsTrigger>
                <TabsTrigger value="not_found">Falta</TabsTrigger>
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
              <strong>descrição</strong> e <strong>quantidade</strong>.
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
