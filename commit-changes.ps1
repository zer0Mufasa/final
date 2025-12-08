# Git Commit Script for POS Path Fixes
# Run this script in a terminal where git is available

Write-Host "Staging POS files..." -ForegroundColor Cyan

git add pos/index.html
git add pos/tickets.html
git add pos/ticket-new.html
git add pos/ticket-view.html
git add pos/customers.html
git add pos/inventory.html
git add pos/settings.html
git add vercel.json

Write-Host "`nCommitting changes..." -ForegroundColor Cyan

git commit -m "Fix: Change all POS CSS/JS paths from absolute to relative

- Updated all 7 HTML files in pos/ directory to use relative paths
- Changed /pos/css/pos.css → css/pos.css
- Changed /pos/js/* → js/*
- Added explicit type=\"text/css\" to CSS links
- Updated vercel.json with proper Content-Type headers for static assets
- Added critical inline CSS as fallback in index.html

This fixes CSS not loading on Vercel deployment by using relative paths
that work regardless of URL structure."

Write-Host "`nPushing to remote..." -ForegroundColor Cyan

git push

Write-Host "`n✓ Done! Changes have been committed and pushed." -ForegroundColor Green

