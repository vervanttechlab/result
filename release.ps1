# Builds the minified production copy in release\ (needs: npm install -g terser clean-css-cli html-minifier-terser)
# Run from the project folder:  powershell -ExecutionPolicy Bypass -File release.ps1
Remove-Item -Recurse -Force release -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Force release\css, release\js | Out-Null

terser js\app.js --compress --mangle -o release\js\app.js
terser js\vue-app.js --compress --mangle -o release\js\vue-app.js
cleancss -o release\css\style.css css\style.css
html-minifier-terser index.html --collapse-whitespace --collapse-boolean-attributes --remove-comments -o release\index.html

Copy-Item -Recurse images, data, vendor release\

Write-Host "Done. Serve it with: http-server release -p 8081"
