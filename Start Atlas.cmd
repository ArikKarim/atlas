@echo off
cd /d "%~dp0"
start "" http://localhost:4319
node server.mjs
pause
