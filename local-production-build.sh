#!/bin/bash
set -e

# Ensure directory exists
mkdir -p builds

# Get current date and time
current_date_time=$(date "+%d_%m_%Y_%H_%M")
apk_name="production_build_${current_date_time}.apk"

echo "🏗️  Starting Local Production Build (Using EAS)..."
# Using --local flag to build on machine but via EAS logic
npx eas-cli build --profile production-apk --platform android --local --output "builds/${apk_name}"

echo "✅ Build completed!"
echo "🚀 APK ready at: builds/${apk_name}"
echo "📲 Install with: adb install builds/${apk_name}"
