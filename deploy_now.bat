@echo off
cd /d "C:\Users\abdul\OneDrive\Desktop\tawaslo"
del /f /q ".git\index.lock" 2>nul
del /f /q ".git\HEAD.lock" 2>nul
git add -A
git commit -m "PDF: Hootsuite-style report with real logo, dark cover, post artwork & engagement bars"
git push
echo.
echo Done! Deployed to Vercel.
pause
