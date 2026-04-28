import { Product } from "./auditStorage";
import { api, getServerUrl } from "./serverApi";

/** Envia produto para o servidor (best-effort, não lança). */
export const syncProduct = async (p: Product) => {
  if (!getServerUrl() || !p.sessaoId) return false;
  try {
    await api.upsertProdutos([p]);
    return true;
  } catch (e) {
    console.warn("sync produto falhou", e);
    return false;
  }
};

/** Envia foto e retorna o id (mesmo id passado). */
export const syncFoto = async (id: string, dataUrl: string) => {
  if (!getServerUrl()) return false;
  try {
    await api.uploadFoto(id, dataUrl);
    return true;
  } catch (e) {
    console.warn("upload foto falhou", e);
    return false;
  }
};

/** Cria/atualiza sessão no servidor. */
export const syncSessao = async (s: { id: string; nome?: string; criado_em: string; total: number }) => {
  if (!getServerUrl()) return false;
  try {
    await api.createSessao({ id: s.id, nome: s.nome, criado_em: s.criado_em, total: s.total });
    return true;
  } catch (e) {
    console.warn("sync sessão falhou", e);
    return false;
  }
};

/** Sincroniza tudo de uma vez (botão manual). */
export const syncAll = async (sessao: { id: string; nome?: string; criado_em: string; total: number } | null, products: Product[]) => {
  if (!getServerUrl()) throw new Error("Servidor não configurado");
  if (sessao) await api.createSessao(sessao);
  if (products.length) {
    // chunk de 100
    for (let i = 0; i < products.length; i += 100) {
      await api.upsertProdutos(products.slice(i, i + 100));
    }
  }
};
