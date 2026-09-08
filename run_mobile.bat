@echo off
setlocal
title KalaSetu Mobile - Expo Go
set "PATH=%AppData%\npm;%PATH%"
echo ==========================================================
echo  Starting KalaSetu Mobile Application (React Native/Expo)
echo  Smart India Hackathon 2026 - Problem Statement SIH26090
echo ==========================================================
cd /d "%~dp0mobile-app"
if not exist "package.json" (
	echo ERROR: mobile-app package.json was not found.
	echo Expected folder: %~dp0mobile-app
	pause
	exit /b 1
)
where node >nul 2>nul
if errorlevel 1 (
	echo ERROR: Node.js is not installed or is not available in PATH.
	echo Install Node.js, then reopen this launcher.
	pause
	exit /b 1
)
where npm >nul 2>nul
if errorlevel 1 (
	echo ERROR: npm is not available in PATH.
	echo Reinstall Node.js or restart Windows after installing it.
	pause
	exit /b 1
)
where python >nul 2>nul
if errorlevel 1 (
	echo ERROR: Python is not installed or is not available in PATH.
	echo Install Python 3.10+, then reopen this launcher.
	pause
	exit /b 1
)
echo Installing backend dependencies...
cd /d "%~dp0"
python -m pip install -r requirements.txt
if errorlevel 1 (
	echo ERROR: Backend dependency installation failed. See the message above.
	pause
	exit /b 1
)
echo Starting KalaSetu API in a separate window...
start "KalaSetu API" cmd /k "cd /d ""%~dp0"" && python app.py"
echo Installing mobile dependencies...
cd /d "%~dp0mobile-app"
call npm install --no-audit --no-fund
if errorlevel 1 (
	echo ERROR: npm install failed. See the message above.
	pause
	exit /b 1
)
echo.
echo Launching Expo Go (LAN MODE - phone and computer must use the same Wi-Fi)...
echo ----------------------------------------------------------------------
echo IMPORTANT: Wait for the QR code to appear, then open Expo Go and scan it.
echo ----------------------------------------------------------------------
call npx expo start --go --lan -c
pause
