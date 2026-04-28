# Servidor de Auditoria — PC Windows

Pequeno servidor que roda no seu PC e guarda o histórico de auditorias e as fotos
enviadas pelo celular (na mesma rede Wi-Fi).

## ✅ Pré-requisitos (uma vez só)

1. **Instale o Node.js** (versão LTS): https://nodejs.org
   - Durante a instalação, pode clicar **Next** em tudo. Deixe marcada a opção
     "Automatically install the necessary tools" se aparecer.

## 🚀 Como rodar

1. Abra o **Prompt de Comando** dentro desta pasta (`server-windows`).
   - Dica: na pasta, segure **Shift + clique direito** → "Abrir janela do PowerShell aqui"
2. Instale as dependências (somente na primeira vez):
   ```
   npm install
   ```
3. Inicie o servidor:
   ```
   npm start
   ```
4. Vai aparecer algo como:
   ```
   Servidor de Auditoria iniciado!
   Porta: 4000
   Endereços para usar no celular:
     →  http://192.168.1.10:4000
   ```
5. **Anote o endereço** (ex: `http://192.168.1.10:4000`).

## 📱 Configurar no celular

1. Conecte o celular **na mesma rede Wi-Fi** do PC.
2. Abra o app de auditoria.
3. Toque no ícone de **engrenagem** (Configurações) no topo.
4. Cole o endereço do servidor e toque em **Testar conexão**.
5. Se aparecer ✅ "Servidor conectado", pronto!

## 🔥 Liberar no Firewall

Na primeira vez que rodar `npm start`, o Windows pode perguntar se quer permitir
o Node.js na rede. Marque **Redes privadas** e clique **Permitir acesso**.

Se você fechou sem permitir:
- **Painel de Controle** → **Sistema e Segurança** → **Firewall do Windows Defender**
- → **Permitir um aplicativo** → procure **Node.js** → marque **Privada** ✓

## 💾 Onde ficam meus dados?

- Banco de dados: arquivo `dados.db` nesta pasta
- Fotos: pasta `fotos/` nesta pasta
- **Faça backup** copiando essas duas coisas de tempos em tempos.

## ❓ Problemas comuns

**"npm não é reconhecido"** → Reinstale o Node.js e reinicie o PC.

**Celular não conecta** →
- Confira se está no mesmo Wi-Fi
- Confira o IP com `ipconfig` no Prompt (procure "IPv4")
- Tente desativar temporariamente o Firewall para testar

**Quero mudar a porta** → Edite `PORT = 4000` no início de `server.js`.
