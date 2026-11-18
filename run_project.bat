
@echo off
chcp 65001 > nul
title QueryForge - SQL Practice Platform
color 0B

echo.
echo  ==================================================
echo             QUERYFORGE - STARTUP
echo  ==================================================
echo.

cd /d "%~dp0"

:: Check Node.js
where node >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed or not in PATH.
    pause
    exit /b 1
)

:: Check npm
where npm >nul 2>&1
if errorlevel 1 (
    echo [ERROR] npm is not installed or not in PATH.
    pause
    exit /b 1
)

echo [INFO] Node.js version:
node --version

echo [INFO] npm version:
call npm --version

echo.

:: Check package.json
if not exist "package.json" (
    echo [ERROR] package.json not found in:
    echo %CD%
    pause
    exit /b 1
)

:: Install dependencies
if not exist "node_modules" (
    echo [INFO] Installing project dependencies...
    call npm install

    if errorlevel 1 (
        echo [ERROR] npm install failed.
        pause
        exit /b 1
    )
) else (
    echo [INFO] Dependencies already installed.
)

echo.

:: Optional content build
set "rebuild=N"
set /p rebuild="Rebuild content from Markdown? (Y/N): "

if /i "%rebuild%"=="Y" (
    echo [INFO] Rebuilding content...
    call npm run build:content

    if errorlevel 1 (
        echo [ERROR] Content build failed.
        pause
        exit /b 1
    )
)

echo.
echo  ==================================================
echo              STARTING QUERYFORGE
echo  ==================================================
echo.
echo [INFO] Launching Vite...
echo.

call npm run dev -- --open

echo.
echo [INFO] Server stopped.
pause
