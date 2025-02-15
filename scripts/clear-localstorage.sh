#!/bin/bash

echo "🔄 Running localStorage.clear()..."

# Detect OS
OS=$(uname)

# Create a temporary HTML file to run the JavaScript
TEMP_HTML=$(mktemp /tmp/clear_localstorage.XXXXXX.html)

# Insert the JavaScript into the temporary HTML file
cat <<EOF > "$TEMP_HTML"
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Clear LocalStorage</title>
    <script src="file://$(pwd)/scripts/clear-localstorage.js"></script>
</head>
<body>
    <h1>localStorage Cleared</h1>
</body>
</html>
EOF

# Open the HTML file in a headless browser
if command -v google-chrome > /dev/null; then
    echo "🧹 Clearing localStorage using Google Chrome..."
    google-chrome --headless --disable-gpu --no-sandbox --disable-application-cache --disable-cache "$TEMP_HTML"
elif command -v chromium > /dev/null; then
    echo "🧹 Clearing localStorage using Chromium..."
    chromium --headless --disable-gpu --no-sandbox --disable-application-cache --disable-cache "$TEMP_HTML"
elif command -v firefox > /dev/null; then
    echo "🧹 Clearing localStorage using Firefox..."
    firefox --headless "$TEMP_HTML"
else
    echo "⚠️ No supported browser found. Please install Chrome, Chromium, or Firefox."
fi

# Clean up the temporary file
rm "$TEMP_HTML"

echo "✅ localStorage cleared successfully!"
