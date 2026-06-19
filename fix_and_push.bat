@echo off
cd /d "C:\dev\tawaslo"

echo Clearing any stale git lock...
if exist ".git\index.lock" del /f /q ".git\index.lock"

echo Disabling git auto-maintenance (stops the "Deletion of directory" prompts)...
git config gc.auto 0
git config gc.autoDetach false
git config maintenance.auto false
git config core.fscache true
git config core.preloadIndex true

echo Staging all changes...
git add -A

echo Checking for new changes...
git diff --cached --quiet
if %errorlevel%==1 (
  echo Committing...
  git -c gc.auto=0 -c maintenance.auto=false commit -m "deploy: latest changes"
) else (
  echo No new file changes - will still push any pending commits.
)

echo.
echo Pushing to GitHub / Vercel...
git -c gc.auto=0 -c maintenance.auto=false push origin main

echo.
echo ====================================================
echo  Done.
echo  - "Everything up-to-date" means nothing new to send.
echo  - Otherwise a new deploy was triggered.
echo  Free plan builds one at a time - give it about 30s.
echo ====================================================
echo.
pause
