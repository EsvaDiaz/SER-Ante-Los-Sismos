@echo off
echo Iniciando Proyecto "Sin Estrés Resilientes" (SER)...

cd /d "%~dp0"

echo [1/2] Iniciando Backend en un nuevo terminal...
start "SER - Backend" /D "%~dp0" cmd /c "uvicorn backend.main:app --reload --port 8000"

echo [2/2] Esperando unos segundos para levantar el Frontend...
timeout /t 5

start "SER - Frontend" /D "%~dp0frontend" cmd /c "npm run dev"

echo Servicios iniciados correctamente.
echo Cerrando este script principal...
exit
