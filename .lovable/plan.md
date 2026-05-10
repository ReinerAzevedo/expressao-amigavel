
## Objetivo

Gerar um pacote `.zip` atualizado do servidor Windows (com a data de hoje) e entregar um passo a passo claro de instalação e uso pelo celular.

## O que já existe no projeto

A pasta `server-windows/` já está pronta:
- `server.js` — servidor Node + SQLite + token de segurança + rota `/qr`
- `package.json` — dependências (express, cors, better-sqlite3)
- `instalar.bat` — instala dependências e cria atalho na Área de Trabalho
- `iniciar.bat` — inicia o servidor e abre o QR Code no navegador
- `README.md` — instruções

Não preciso recriar arquivos — só empacotar e documentar.

## Passos do plano

### 1. Build do app frontend
Rodar o build do React (`npm run build`) e copiar o resultado (`dist/`) para `server-windows/public/`. Assim o celular acessa o app direto pelo IP do PC, sem depender do Lovable.

### 2. Gerar o ZIP datado
Empacotar `server-windows/` em `/mnt/documents/servidor-auditoria-windows-AAAA-MM-DD.zip`, **excluindo**:
- `node_modules/`
- `token.txt`, `dados.db`, `dados.db-wal`, `dados.db-shm`
- `fotos/`

O `public/` (build do app) **vai incluído** desta vez.

### 3. Entregar o ZIP via `<lov-artifact>` para download direto.

### 4. Passo a passo de instalação (no chat)

**No PC Windows (uma vez):**
1. Instalar Node.js LTS de https://nodejs.org
2. Baixar o ZIP e extrair em `C:\Auditoria`
3. Dar duplo clique em `instalar.bat` — instala dependências e cria o atalho **"Servidor de Auditoria"** na Área de Trabalho
4. Liberar a porta 4000 no Firewall do Windows quando ele perguntar

**Para usar (todo dia):**
1. Duplo clique no atalho **"Servidor de Auditoria"** na Área de Trabalho
2. Vai abrir uma janela preta (deixar aberta) e o navegador com um QR Code
3. No celular, abrir a câmera e apontar para o QR Code → o app abre direto
4. (Opcional) Em **Configurações** do app no celular, copiar o **Token** que aparece na janela preta do servidor — só precisa fazer 1 vez por celular

**Requisitos de rede:**
- PC e celular na **mesma rede Wi-Fi**
- Roteador não pode ter "isolamento de clientes" ativado
- Se não conectar: testar `http://IP-DO-PC:4000/api/ping` no navegador do celular

### 5. Lembrete sobre dados existentes
Como o ZIP **não inclui** `dados.db` nem `fotos/`, instalar em uma pasta nova começa do zero. Se o usuário já tinha uma instalação anterior e quer manter o histórico, deve **copiar `dados.db` e a pasta `fotos/`** da instalação antiga para a nova antes de iniciar.

## Resultado entregue

- Arquivo `servidor-auditoria-windows-2026-05-10.zip` em `/mnt/documents/`
- Passo a passo numerado e curto na resposta
- Aviso sobre token e firewall
