/**
 * Cliente para o servidor local (PC Windows).
 * URL fica salva em localStorage. Tudo opcional — app funciona sem servidor.
 */

const KEY_URL = "audit:serverUrl";

/** Detecta se o app está sendo servido pelo próprio servidor local (não-Lovable). */
const isSelfHosted = () => {
  if (typeof window === "undefined") return false;
  const h = window.location.hostname;
  return !h.endsWith("lovable.app") && !h.endsWith("lovable.dev") && h !== "localhost";
};

export const getServerUrl = () => {
  const saved = localStorage.getItem(KEY_URL);
  if (saved) return saved;
  if (isSelfHosted()) return window.location.origin;
  return "";
};
export const setServerUrl = (url: string) => {
  const trimmed = url.trim().replace(/\/+$/, "");
  if (trimmed) localStorage.setItem(KEY_URL, trimmed);
  else localStorage.removeItem(KEY_URL);
};

const baseUrl = () => {
  const u = getServerUrl();
  if (!u) throw new Error("Servidor não configurado");
  return u;
};

const req = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const res = await fetch(`${baseUrl()}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as T;
};

export const ping = async (url?: string): Promise<boolean> => {
  const target = (url || getServerUrl()).replace(/\/+$/, "");
  if (!target) return false;
  try {
    const res = await fetch(`${target}/api/ping`, { method: "GET" });
    if (!res.ok) return false;
    const data = await res.json();
    return !!data.ok;
  } catch {
    return false;
  }
};

export interface SessaoServer {
  id: string;
  nome: string | null;
  criado_em: string;
  total: number;
  encontrados: number;
  nao_encontrados: number;
  pendentes: number;
  na_area: number;
}

export interface ProdutoServer {
  id: string;
  sessaoId: string;
  codigo: string;
  codigoBarras?: string;
  descricao: string;
  quantidade: number;
  status: "pending" | "found" | "not_found";
  qtdEncontrada?: number;
  auditor?: string;
  data?: string;
  naAreaVenda: boolean;
  areaVendaAuditor?: string;
  areaVendaData?: string;
  fotoId?: string;
  atualizadoEm: string;
  sessaoNome?: string;
  sessaoData?: string;
}

export interface RecorrenciaItem {
  codigo: string;
  descricao: string;
  ocorrencias: number;
  vezes_nao_encontrado: number;
  vezes_pendente: number;
  vezes_encontrado: number;
  vezes_na_area: number;
  ultima: string;
}

export const api = {
  listSessoes: () => req<SessaoServer[]>("/api/sessoes"),
  createSessao: (s: { id: string; nome?: string; criado_em: string; total: number }) =>
    req<{ ok: true }>("/api/sessoes", { method: "POST", body: JSON.stringify(s) }),
  listProdutosDaSessao: (sessaoId: string) =>
    req<ProdutoServer[]>(`/api/sessoes/${encodeURIComponent(sessaoId)}/produtos`),
  deleteSessao: (sessaoId: string) =>
    req<{ ok: true }>(`/api/sessoes/${encodeURIComponent(sessaoId)}`, { method: "DELETE" }),
  upsertProdutos: (lista: unknown[]) =>
    req<{ ok: true; count: number }>("/api/produtos/upsert", {
      method: "POST",
      body: JSON.stringify(lista),
    }),
  historico: (codigo: string) =>
    req<ProdutoServer[]>(`/api/historico/${encodeURIComponent(codigo)}`),
  recorrencia: (status?: "all" | "pending" | "not_found" | "pending_or_missing") =>
    req<RecorrenciaItem[]>(`/api/recorrencia${status ? `?status=${status}` : ""}`),
  uploadFoto: (id: string, dataUrl: string) =>
    req<{ ok: true; id: string; url: string; tamanho: number }>("/api/fotos", {
      method: "POST",
      body: JSON.stringify({ id, dataUrl }),
    }),
  fotoUrl: (id: string) => `${baseUrl()}/fotos/${id}`,
  fotoUrlAny: (foto: { id?: string; url?: string }) => {
    if (foto.url) return `${baseUrl()}${foto.url}`;
    return `${baseUrl()}/api/fotos/${foto.id}`;
  },
};
