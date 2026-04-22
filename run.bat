@echo off
setlocal
title MedSmart — Startup Manager

echo ===================================================
echo   MedSmart — Smart Healthcare Startup Script
echo ===================================================
echo.

:: Check for Node.js
echo [1/4] Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not found! Please install Node.js and add it to your PATH.
    pause
    exit /b
)
echo [OK] Node.js is installed.

:: Check for Python
echo [2/4] Checking Python installation...
set PY_CMD=python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    set PY_CMD=py
    py --version >nul 2>&1
    if %errorlevel% neq 0 (
        set PY_CMD=python3
        python3 --version >nul 2>&1
        if %errorlevel% neq 0 (
            echo [ERROR] Python not found! Please install Python and add it to your PATH.
            pause
            exit /b
        )
    )
)
echo [OK] Using command: %PY_CMD%

:: Start the Auth Server
echo [3/4] Starting MedSmart Auth Server on port 3001...
if exist auth-server (
    start "MedSmart Auth Server" cmd /k "cd auth-server && npm install && npm start"
) else (
    echo [WARNING] auth-server directory not found!
)

:: Start the Backend
echo [4/4] Starting MedSmart Backend on port 5000...
start "MedSmart Backend" cmd /k "cd backend && %PY_CMD% app.py"

:: Wait for servers to warm up
echo [WAIT] Giving servers 5 seconds to initialize...
timeout /t 5 /nobreak > nul

:: Open Frontend
echo [LAUNCH] Launching MedSmart Website...
if exist index.html (
    start "" index.html
) else (
    echo [WARNING] index.html not found in current directory!
)

echo.
echo ===================================================
echo   SUCCESS: System is now running!
echo.
echo   - Auth Server: Check the Node.js window
echo   - Backend: Check the Python window
echo   - Website: Opened in your browser
echo ===================================================
echo.
pause
