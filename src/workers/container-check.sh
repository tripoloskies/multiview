#!/bin/bash

URL=$1

if [ -z "$URL" ]; then
    exit 1
fi

# Function to resolve relative URLs
resolve_url() {
    local parent="$1"
    local child="$2"
    if [[ "$child" =~ ^http ]]; then
        echo "$child"
    else
        local base=$(echo "$parent" | sed 's/[^/]*$//')
        echo "${base}${child}"
    fi
}

# 1. Get the Manifest
CONTENT=$(curl -sL "$URL")

# 2. Find the first link (ignoring tags)
FIRST_PATH=$(echo "$CONTENT" | grep -v '^#' | grep -m 1 '.')

if [ -z "$FIRST_PATH" ]; then
    exit 1
fi

TARGET_URL=$(resolve_url "$URL" "$FIRST_PATH")

# 3. If the link is ANOTHER manifest (.m3u8), drill down one more level
if [[ "$TARGET_URL" == *".m3u8"* ]]; then
    # Fetch the sub-manifest and find the first actual segment
    SUB_CONTENT=$(curl -sL "$TARGET_URL")
    # This regex looks for lines that don't start with # and aren't empty
    SEGMENT_PATH=$(echo "$SUB_CONTENT" | grep -v '^#' | grep -m 1 '.')
    FINAL_URL=$(resolve_url "$TARGET_URL" "$SEGMENT_PATH")
else
    FINAL_URL="$TARGET_URL"
fi
# 3. Download the first 188 bytes (one full TS packet)
# We use a temp buffer in memory
BUFFER=$(curl -sL "$FINAL_URL" -H "User-Agent: Mozilla/5.0" --range 0-187 | xxd -p -c 188)

# 4. Binary Inspection Logic
# MPEG-TS: Starts with 0x47
# fMP4: Contains 'ftyp' (66747970) or 'moof' (6d6f6f66) starting at offset 4
if [[ "$BUFFER" =~ ^47 ]]; then
    # Verify it's not a fluke by checking if the next packet also starts with 47
    # (Optional: download 376 bytes and check index 0 and 188)
    echo "mpegts"
elif [[ "$BUFFER" =~ "66747970" ]] || [[ "$BUFFER" =~ "6d6f6f66" ]]; then
    # This is fMP4/CMAF
    echo "fmp4"
else
    # Unknown or actual image data
    exit 0
fi