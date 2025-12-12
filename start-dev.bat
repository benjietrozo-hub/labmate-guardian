@echo off
echo Starting Labmate Guardian with WebSocket server...
echo.
echo This will open a new window for the WebSocket server and start the development server
echo.
echo Step 1: Starting WebSocket server in new window...
start "WebSocket Server" cmd /k "npm run websocket-server"

echo Step 2: Starting development server...
timeout /t 2 /nobreak >nul
npm run dev

pause
