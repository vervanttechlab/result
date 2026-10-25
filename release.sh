#!/bin/sh
# Builds the minified production copy in release/ (macOS/Linux version of release.ps1)
# Needs: npm install -g terser clean-css-cli html-minifier-terser
set -e
rm -rf release
mkdir -p release/css release/js

terser js/app.js --compress --mangle -o release/js/app.js
terser js/vue-app.js --compress --mangle -o release/js/vue-app.js
cleancss -o release/css/style.css css/style.css
html-minifier-terser index.html --collapse-whitespace --collapse-boolean-attributes --remove-comments -o release/index.html

cp -R images data vendor release/

echo "Done. Serve it with: http-server release -p 8081"
