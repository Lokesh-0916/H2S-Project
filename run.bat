@echo off
setlocal
title MedSmart — Startup Manager

echo ===================================================
echo   MedSmart — Smart Healthcare Startup Script
echo ===================================================
echo.

:: Check for Python
echo [1/3] Checking Python installation...
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

:: Start the Backend
echo [2/3] Starting MedSmart Backend on port 5000...
start "MedSmart Backend" cmd /k "cd backend && %PY_CMD% app.py"

:: Wait for server to warm up
echo [WAIT] Giving the backend 4 seconds to initialize database...
timeout /t 4 /nobreak > nul

:: Open Frontend
echo [3/3] Launching MedSmart Website...
if exist index.html (
    start "" index.html
) else (
    echo [WARNING] index.html not found in current directory!
)

echo.
echo ===================================================
echo   SUCCESS: System is now running!
echo.
echo   - Backend: Check the new window for any errors.
echo   - Website: Check the 'Status' badge in the header.
echo ===================================================
echo.
pause
