@echo off
title DevaMart - Launcher
echo ============================================
echo   DevaMart - Puja & Astrology Platform
echo ============================================
echo.
echo Starting API server  -> http://localhost:4000
echo Starting User store  -> http://localhost:5173
echo Starting Admin panel -> http://localhost:5174
echo.
start "DevaMart API" cmd /k "cd /d %~dp0server && npm run dev"
start "DevaMart User Store" cmd /k "cd /d %~dp0client-user && npm run dev"
start "DevaMart Admin Panel" cmd /k "cd /d %~dp0client-admin && npm run dev"
echo.
echo All windows opened. Do not close the API window.
timeout /t 5