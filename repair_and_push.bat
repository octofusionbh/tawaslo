@echo off
cd /d "C:\dev\tawaslo"

echo Disabling git auto-maintenance...
git config gc.auto 0
git config gc.autoDetach false
git config maintenance.auto false

echo.
echo Undoing the truncated sandbox commit (996cd3a) but KEEPING your real files...
git reset --soft 3ff01d0dd81e058c633a9b8130b357d039c5fdb2
git reset

echo.
echo Re-staging the intact files from your computer...
git add -A

echo.
echo Sanity check - line count of the file being committed (should be ~6800+, NOT 6311):
for /f %%C in ('git show :src/TawasaloApp.js ^| find /c /v ""') do echo   staged TawasaloApp.js lines: %%C

echo.
echo Committing...
git -c gc.auto=0 -c maintenance.auto=false commit -m "Publisher: live Stories, vision Read-the-image, per-slide carousel alt text (IG-only, hidden on Reels/Stories), worldwide AI wording"

echo.
echo Pushing to GitHub / Vercel...
git -c gc.auto=0 -c maintenance.auto=false push origin main

echo.
echo ====================================================
echo  Done. If the line count above was ~6800, you are good.
echo  Free plan builds one at a time - give it about 30s.
echo ====================================================
echo.
pause
