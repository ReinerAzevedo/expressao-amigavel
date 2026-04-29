# Servidor de Auditoria — PC Windows

Pequeno servidor que roda no seu PC e:
- Guarda histórico de auditorias e fotos (banco SQLite local)
- **Também serve o app** para o celular (resolve o problema de HTTPS/HTTP)

---

## ⚠️ Por que NÃO usar o link `https://...lovable.app` no celular

O Lovable serve o Preview em **HTTPS**, mas seu servidor é **HTTP**.
Navegadores bloqueiam essa mistura ("Mixed Content") e você vê
"Failed to fetch" mesmo com tudo configurado certo.

**Solução:** rodar o app a partir do próprio PC. O celular acessa
**um único endereço** (ex: `http://192.168.10.73:4000`) e tudo funciona.

---

## ✅ Pré-requisitos (uma vez só)

1. **Instale o Node.js LTS**: https://nodejs.org
   (Pode clicar Next em tudo durante a instalação.)

---

## 🚀 Passo a passo

### 1) Instalar dependências (só na primeira vez)

Abra esta pasta no Explorer, segure **Shift + clique direito** em um espaço vazio
→ "Abrir janela do PowerShell aqui" → digite:

```
npm install
```

### 2) Colocar o app dentro da pasta `public/`

Você precisa do **build do app**. No Lovable:

1. Clique em **Publish** (canto superior direito).
2. Após publicar, clique em **Download Code** (ou peça ao Lovable o link do build).
3. Em qualquer PC com Node, dentro da pasta do projeto baixado, rode:
   ```
   npm install
   npm run build
   ```
4. Isso cria uma pasta `dist/`. Copie **todo o conteúdo** dela para
   `server-windows/public/` (crie a pasta `public` se não existir).

> 💡 Atalho: peça ao Lovable "me gere um zip do build pronto" e ele já entrega
> a pasta `dist` zipada — basta descompactar dentro de `server-windows/public/`.

### 3) Iniciar o servidor

```
npm start
```

Vai aparecer:
```
========================================
  Servidor de Auditoria iniciado!
========================================
  Porta: 4000
  Endereços para usar no celular:
    →  http://192.168.10.73:4000
========================================
  Token de acesso: a1b2c3d4e5f6...
  (salvo em: .../server-windows/token.txt)
========================================
```

> 🔐 **Sobre o token:** ele é gerado automaticamente na primeira vez e protege
> seu servidor contra acesso não autorizado de outros aparelhos na rede.
> Quando você abre o app pelo endereço do próprio PC (passo 4 abaixo), o app
> busca o token sozinho — você não precisa fazer nada. Se quiser **forçar um
> token novo**, apague o arquivo `token.txt` e reinicie o servidor.

### 4) Abrir no celular

1. Conecte o celular **na mesma rede Wi-Fi** do PC.
2. Abra o navegador (Chrome) e digite o endereço exibido acima
   (ex: `http://192.168.10.73:4000`).
3. **Pronto!** O app já está conectado ao servidor automaticamente —
   não precisa configurar IP nas Configurações.
4. Para virar um "ícone no celular": no Chrome, menu ⋮ →
   **Adicionar à tela inicial**.

---

## 🔥 Liberar no Firewall

Na primeira vez que rodar `npm start`, o Windows pode perguntar se quer permitir
o Node.js na rede. Marque **Redes privadas** e clique **Permitir acesso**.

Se você fechou sem permitir:
- **Painel de Controle** → **Sistema e Segurança** → **Firewall do Windows Defender**
- → **Permitir um aplicativo** → procure **Node.js** → marque **Privada** ✓

---

## 💾 Backup dos dados

- Banco: `dados.db` (nesta pasta)
- Fotos: pasta `fotos/`

Copie os dois para um pendrive de tempos em tempos.

---

## ❓ Problemas comuns

**"npm não é reconhecido"** → Reinstale o Node.js e reinicie o PC.

**Celular abre o endereço mas não carrega o app** →
A pasta `public/` está vazia. Volte ao Passo 2.

**Celular não abre o endereço** →
- Mesmo Wi-Fi? (não pode ser Wi-Fi de visitantes/guest)
- Confira o IP com `ipconfig` no PowerShell (procure "IPv4")
- Teste desativar o Firewall só para confirmar

**Quero mudar a porta** → Edite `PORT = 4000` no início de `server.js`.
