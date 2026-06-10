@echo off
cd /d "C:\dev\tawaslo"

echo Staging all changes...
git add -A

echo Checking for new changes...
git diff --cached --quiet
if %errorlevel%==1 (
  echo Committing...
  git commit -m "deploy: latest changes"
) else (
  echo No new file changes - will still push any pending commits.
)

echo.
echo Pushing to GitHub / Vercel...
git push origin main

echo.
echo ====================================================
echo  Done.
echo  - "Everything up-to-date" means nothing new to send.
echo  - Otherwise a new deploy was triggered.
echo  Free plan builds one at a time - give it about 30s.
echo ====================================================
echo.
pause
