@echo off
chcp 65001 >nul
title Instalador - Servidor de Auditoria
cd /d "%~dp0"

echo ========================================
echo   Instalador do Servidor de Auditoria
echo ========================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo [ERRO] Node.js nao encontrado.
  echo.
  echo Baixe e instale o Node.js LTS em:
  echo    https://nodejs.org
  echo.
  echo Depois rode este instalador novamente.
  pause
  exit /b 1
)

echo [1/3] Node.js encontrado: 
node --version
echo.

echo [2/3] Instalando dependencias (pode demorar alguns minutos)...
call npm install
if errorlevel 1 (
  echo [ERRO] Falha ao instalar dependencias.
  pause
  exit /b 1
)
echo.

echo [3/3] Criando atalho na Area de Trabalho...
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$s=(New-Object -ComObject WScript.Shell).CreateShortcut([Environment]::GetFolderPath('Desktop')+'\Servidor de Auditoria.lnk');" ^
  "$s.TargetPath='%~dp0iniciar.bat';" ^
  "$s.WorkingDirectory='%~dp0';" ^
  "$s.IconLocation='%SystemRoot%\System32\shell32.dll,13';" ^
  "$s.Description='Inicia o Servidor de Auditoria';" ^
  "$s.Save()"

echo.
echo ========================================
echo   Instalacao concluida!
echo ========================================
echo.
echo Foi criado um atalho chamado "Servidor de Auditoria"
echo na sua Area de Trabalho. Clique nele para iniciar.
echo.
pause
