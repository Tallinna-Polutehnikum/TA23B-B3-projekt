@echo off
setlocal
set ROOT=%~dp0..
cd /d "%ROOT%"
node database\scheduler.js >> database\scheduler.log 2>&1
endlocal
