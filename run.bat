@echo off
setlocal
title PharmaLink — Startup Manager

echo ===================================================
echo   PharmaLink — Smart Healthcare Startup Script
echo ===================================================
echo.

:: Check for Node.js
echo [1/3] Checking Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not found! Please install it from https://nodejs.org
    pause & exit /b
)
echo [OK] Node.js found.

:: Check for Python
echo [2/3] Checking Python...
set PY_CMD=python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    set PY_CMD=py
    py --version >nul 2>&1
    if %errorlevel% neq 0 (
        set PY_CMD=python3
        python3 --version >nul 2>&1
        if %errorlevel% neq 0 (
            echo [ERROR] Python not found! Please install Python from https://python.org
            pause & exit /b
        )
    )
)
echo [OK] Using: %PY_CMD%

echo [3/3] Starting all services...

:: Auth Server (Node.js / Express)
start "PharmaLink - Auth Server" cmd /k "cd /d "%~dp0auth-server" && npm install && node server.js"

:: Backend (Python / Flask)
start "PharmaLink - Backend" cmd /k "cd /d "%~dp0backend" && %PY_CMD% app.py"

:: Give servers 4 seconds to init
timeout /t 4 /nobreak >nul

:: Frontend (Vite dev server)
start "PharmaLink - Frontend" cmd /k "cd /d "%~dp0frontend" && npm install && npm run dev"

echo.
echo ===================================================
echo   SUCCESS: All services are starting!
echo.
echo   Auth Server  →  http://localhost:3001
echo   Backend      →  http://localhost:5000
echo   Frontend     →  http://localhost:8080
echo ===================================================
echo.
pause
