@echo off
title Servidor Administrativo BUSIDEM
echo ====================================================
echo   INICIANDO MODULO ADMINISTRATIVO (LOCAL)
echo ====================================================

:: Cambiar a la carpeta del frontend
cd busidem-frontend

:: Iniciar Vite en el puerto asignado para administracion en segundo plano
start /b npm run admin

:: Esperar 3 segundos para asegurar que el servidor local levante
timeout /t 3 /nobreak > nul

:: Abrir el navegador directamente en el localhost administrativo
start http://localhost:5174

echo Panel administrativo iniciado correctamente en localhost:5174.
echo No cierres esta ventana mientras uses el sistema.
echo ====================================================
pause