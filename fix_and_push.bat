@echo off
cd /d "C:\Users\abdul\OneDrive\Desktop\tawaslo"

echo Disabling git auto-cleanup (avoids OneDrive lock prompts)...
git config gc.auto 0
git config gc.autoDetach false

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

echo Checking for changes...
git diff --cached --quiet
if %errorlevel%==0 (
  echo.
  echo ====================================================
  echo  Nothing new to deploy - your last push already has
  echo  all your changes. No need to run this again.
  echo ====================================================
  echo.
  pause
  exit /b 0
)

echo Committing...
git commit -m "deploy: latest changes"

echo.
echo Pushing to Vercel...
git push origin main

echo.
echo ====================================================
echo  Done! ONE new deploy was triggered.
echo  Free plan builds one at a time - if others are
echo  queued, just wait for them to finish (about 30s each).
echo ====================================================
echo.
pause
