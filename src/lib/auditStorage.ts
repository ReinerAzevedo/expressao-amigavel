export type AuditStatus = "pending" | "found" | "not_found";

export interface Product {
  id: string;
  sessaoId?: string;
  codigo: string;
  codigoBarras?: string;
  descricao: string;
  quantidade: number;
  status: AuditStatus;
  qtdEncontrada?: number;
  auditor?: string;
  data?: string;
  naAreaVenda?: boolean;
  areaVendaAuditor?: string;
  areaVendaData?: string;
  fotoId?: string;
}

export interface Sessao {
  id: string;
  nome?: string;
  criado_em: string;
  total: number;
}

const KEY_PRODUCTS = "audit:products";
const KEY_AUDITOR = "audit:auditor";
const KEY_SESSAO = "audit:sessao";
const KEY_FOTOS = "audit:fotos"; // cache local id -> dataUrl

export const loadProducts = (): Product[] => {
  try {
    return JSON.parse(localStorage.getItem(KEY_PRODUCTS) || "[]");
  } catch {
    return [];
  }
};

export const saveProducts = (products: Product[]) => {
  localStorage.setItem(KEY_PRODUCTS, JSON.stringify(products));
};

export const getAuditor = () => localStorage.getItem(KEY_AUDITOR) || "";
export const setAuditor = (name: string) => localStorage.setItem(KEY_AUDITOR, name);

export const clearProducts = () => {
  localStorage.removeItem(KEY_PRODUCTS);
  localStorage.removeItem(KEY_SESSAO);
};

export const getSessao = (): Sessao | null => {
  try {
    const raw = localStorage.getItem(KEY_SESSAO);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const setSessao = (s: Sessao | null) => {
  if (s) localStorage.setItem(KEY_SESSAO, JSON.stringify(s));
  else localStorage.removeItem(KEY_SESSAO);
};

// --- Cache local de fotos (para visualização offline e fallback) ---
const loadFotosCache = (): Record<string, string> => {
  try {
    return JSON.parse(localStorage.getItem(KEY_FOTOS) || "{}");
  } catch {
    return {};
  }
};
const saveFotosCache = (m: Record<string, string>) => {
  try {
    localStorage.setItem(KEY_FOTOS, JSON.stringify(m));
  } catch (e) {
    console.warn("Cache de fotos cheio, removendo as mais antigas", e);
    const entries = Object.entries(m);
    const reduced = Object.fromEntries(entries.slice(-20));
    localStorage.setItem(KEY_FOTOS, JSON.stringify(reduced));
  }
};

export const saveFotoLocal = (id: string, dataUrl: string) => {
  const m = loadFotosCache();
  m[id] = dataUrl;
  saveFotosCache(m);
};

export const getFotoLocal = (id: string): string | undefined => {
  return loadFotosCache()[id];
};

export const newId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
