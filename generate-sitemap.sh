#!/bin/sh
# Generate sitemap.xml from HTML files

SITE_URL="${SITE_URL:-https://codeutils.de}"
OUTPUT_FILE="${OUTPUT_FILE:-sitemap.xml}"

# Get current date in ISO format
LASTMOD=$(date +%Y-%m-%d)

# Start XML
cat > "$OUTPUT_FILE" << 'HEADER'
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
HEADER

# Find all HTML files and add them to sitemap
for file in *.html; do
    [ -f "$file" ] || continue

    # Skip impressum (legal page)
    if [ "$file" = "impressum.html" ]; then
        continue
    fi

    # Determine URL path
    if [ "$file" = "index.html" ]; then
        url_path=""
    else
        url_path="${file%.html}"
    fi

    cat >> "$OUTPUT_FILE" << EOF
  <url>
    <loc>${SITE_URL}/${url_path}</loc>
    <lastmod>${LASTMOD}</lastmod>
  </url>
EOF
done

# Close XML
echo "</urlset>" >> "$OUTPUT_FILE"

echo "Sitemap generated: $OUTPUT_FILE"
