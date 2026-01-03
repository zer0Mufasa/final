@echo off
echo ========================================
echo Starting Fixology Dev Server...
echo ========================================
echo.

cd /d "%~dp0"
start "Fixology Dev Server" cmd /k "npm run dev"

echo.
echo Waiting 35 seconds for server to start...
timeout /t 35 /nobreak >nul

echo.
echo ========================================
echo Testing Fixo AI...
echo ========================================
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0test-fixo-final.ps1"

echo.
echo ========================================
echo Test Complete!
echo ========================================
echo.
echo If Fixo test failed, check the server window for errors.
echo The server is still running - you can test it in your browser.
echo.
pause
