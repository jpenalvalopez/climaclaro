@echo off
setlocal

title Clima Claro local - Puerto 5173

set "APP_DIR=C:\Users\jpena\climaclaro"
set "HOST=127.0.0.1"
set "PORT=5173"

cd /d "%APP_DIR%"
if errorlevel 1 (
  echo No se pudo abrir la carpeta %APP_DIR%.
  pause
  exit /b 1
)

echo.
echo ==========================================
echo  Clima Claro local
echo  URL: http://%HOST%:%PORT%
echo ==========================================
echo.

if not exist "node_modules" (
  echo Instalando dependencias...
  call npm.cmd install
  if errorlevel 1 (
    echo.
    echo Error instalando dependencias.
    pause
    exit /b 1
  )
)

echo Levantando servidor de desarrollo...
echo.
call npm.cmd run dev -- --host %HOST% --port %PORT%

echo.
echo El servidor se ha detenido.
pause
