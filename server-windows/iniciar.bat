@echo off
chcp 65001 >nul
title Servidor de Auditoria (porta 4000)
cd /d "%~dp0"

if not exist node_modules (
  echo Dependencias nao instaladas. Rodando instalador...
  call "%~dp0instalar.bat"
)

REM Descobre o IPv4 da rede local (primeiro nao-loopback encontrado)
set "IP="
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do (
  if not defined IP (
    set "IP=%%a"
  )
)
set "IP=%IP: =%"

if defined IP (
  set "URL=http://%IP%:4000"
) else (
  set "URL=http://localhost:4000"
)

echo ========================================
echo   Servidor de Auditoria
echo ========================================
echo  Endereco para o celular:
echo     %URL%
echo ========================================
echo.
echo Abrindo a pagina no navegador (com QR Code)...
start "" "%URL%"

echo.
echo NAO FECHE esta janela enquanto estiver usando o app.
echo Para parar o servidor: feche esta janela ou aperte Ctrl+C.
echo.

node server.js
pause
