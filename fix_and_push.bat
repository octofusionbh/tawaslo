@echo off
cd /d "C:\Users\abdul\OneDrive\Desktop\tawaslo"

echo Clearing stale git locks...
del /f /q ".git\index.lock" 2>nul
del /f /q ".git\HEAD.lock" 2>nul
del /f /q ".git\refs\heads\main.lock" 2>nul
del /f /q ".git\objects\maintenance.lock" 2>nul

echo Removing old/merged files...
del /f /q ".eslintrc.verify.js" 2>nul
del /f /q "api\instagram-callback.js" 2>nul
del /f /q "api\meta-callback.js" 2>nul
del /f /q "api\instagram-reply.js" 2>nul

echo Staging all changes...
git add -A

echo Committing...
git commit -m "deploy: latest changes"

echo.
echo Pushing to Vercel...
git push --force origin main

echo.
echo Done! Vercel will start a new deploy. Give it ~1 minute, then refresh tawaslo.com.
pause
