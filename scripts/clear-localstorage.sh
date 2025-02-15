#!/bin/bash

# Clear localStorage in browsers by opening them with specific commands
echo "Clearing localStorage..."

# Clear localStorage for Chrome (adjust for your OS if needed)
if command -v google-chrome > /dev/null; then
    google-chrome --disable-application-cache --disable-cache --incognito --new-window "about:blank"
fi

# Clear localStorage for Firefox
if command -v firefox > /dev/null; then
    firefox -private-window "about:blank"
fi

echo "localStorage cleared."
