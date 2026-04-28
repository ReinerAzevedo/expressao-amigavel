export type AuditStatus = "pending" | "found" | "not_found";

export interface Product {
  id: string;
  codigo: string;
  descricao: string;
  quantidade: number;
  status: AuditStatus;
  qtdEncontrada?: number;
  auditor?: string;
  data?: string;
}

const KEY_PRODUCTS = "audit:products";
const KEY_AUDITOR = "audit:auditor";

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

export const clearProducts = () => localStorage.removeItem(KEY_PRODUCTS);
