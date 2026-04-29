/**
 * Cliente para o servidor local (PC Windows).
 * URL fica salva em localStorage. Tudo opcional — app funciona sem servidor.
 *
 * Autenticação: o servidor gera um token aleatório na primeira execução e
 * o expõe em GET /api/token (apenas para requisições same-origin). O app
 * busca esse token automaticamente quando hospedado pelo próprio servidor.
 * Para acesso a partir de outra origem (ex.: Preview do Lovable), o token
 * pode ser informado manualmente nas Configurações.
 */

const KEY_URL = "audit:serverUrl";
const KEY_TOKEN = "audit:serverToken";

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

export const getServerToken = () => localStorage.getItem(KEY_TOKEN) || "";
export const setServerToken = (token: string) => {
  const t = token.trim();
  if (t) localStorage.setItem(KEY_TOKEN, t);
  else localStorage.removeItem(KEY_TOKEN);
};

const baseUrl = () => {
  const u = getServerUrl();
  if (!u) throw new Error("Servidor não configurado");
  return u;
};

/** Tenta obter o token automaticamente (só funciona em same-origin). */
const fetchTokenAuto = async (): Promise<string> => {
  const u = getServerUrl();
  if (!u) return "";
  try {
    const res = await fetch(`${u}/api/token`);
    if (!res.ok) return "";
    const data = await res.json();
    if (data?.token) {
      setServerToken(data.token);
      return data.token;
    }
  } catch {}
  return "";
};

const authHeaders = (): Record<string, string> => {
  const t = getServerToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
};

const req = async <T>(path: string, init?: RequestInit): Promise<T> => {
  let token = getServerToken();
  if (!token) token = await fetchTokenAuto();

  const doFetch = async () =>
    fetch(`${baseUrl()}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(),
        ...(init?.headers || {}),
      },
    });

  let res = await doFetch();
  if (res.status === 401) {
    // Token pode ter mudado (servidor reiniciado com novo token.txt). Tenta refetch.
    const fresh = await fetchTokenAuto();
    if (fresh) res = await doFetch();
  }
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
  fotoUrl: (id: string) => {
    const t = getServerToken();
    return `${baseUrl()}/fotos/${id}${t ? `?t=${encodeURIComponent(t)}` : ""}`;
  },
  fotoUrlAny: (foto: { id?: string; url?: string }) => {
    const t = getServerToken();
    const q = t ? `?t=${encodeURIComponent(t)}` : "";
    if (foto.url) return `${baseUrl()}${foto.url}${q}`;
    return `${baseUrl()}/api/fotos/${foto.id}${q}`;
  },
};
