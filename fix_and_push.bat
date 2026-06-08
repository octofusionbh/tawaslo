@echo off
cd /d "C:\Users\abdul\OneDrive\Desktop\tawaslo"
echo Clearing git locks...
del /f /q ".git\index.lock" 2>nul
del /f /q ".git\HEAD.lock" 2>nul
del /f /q ".git\refs\heads\main.lock" 2>nul
del /f /q ".git\objects\maintenance.lock" 2>nul
del /f /q ".git\index" 2>nul
del /f /q ".eslintrc.verify.js" 2>nul
del /f /q "api\instagram-callback.js" 2>nul
del /f /q "api\meta-callback.js" 2>nul
del /f /q "api\instagram-reply.js" 2>nul
echo Committing latest build...
git reset
git add -A src/ api/
git commit -m "feat: HQ admin (login/sections/live data), security RLS, scheduled-publishing cron engine, support form, icon refinement"
echo.
echo Pushing to Vercel...
git push
echo.
echo Done! Check Vercel for the new deploy.
pause
