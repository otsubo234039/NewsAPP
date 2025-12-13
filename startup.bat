@echo off
REM NewsAPP Quick Startup Script (Windows Command Prompt)

echo.
echo ============================================
echo   NewsAPP Quick Startup
echo ============================================
echo.

REM Docker Desktop check
echo Checking Docker Desktop...
docker ps >nul 2>&1
if errorlevel 1 (
    echo Starting Docker Desktop...
    start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    echo Waiting for Docker to start (30 seconds)...
    timeout /t 30 /nobreak
)

REM Clear port 3000
echo.
echo Clearing port 3000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000 ^| findstr LISTENING') do taskkill /PID %%a /F >nul 2>&1

REM Start containers
cd /d "c:\Users\harut\OneDrive\デスクトップ\NewsAPP"
echo.
echo Starting backend and database containers...
docker compose up -d
timeout /t 3 /nobreak

REM Start frontend dev server
echo.
echo Starting frontend development server...
echo.
echo ✓ Open http://localhost:3000 in your browser
echo.
call npm run dev

pause
