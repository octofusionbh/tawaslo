@echo off
cd /d "C:\Users\abdul\OneDrive\Desktop\tawaslo"
del /f /q ".git\index.lock" 2>nul
del /f /q ".git\HEAD.lock" 2>nul
del /f /q ".git\objects\maintenance.lock" 2>nul
git add -A
set /p msg="Commit message: "
git commit -m "%msg%"
git push
echo.
echo Done!
pause
