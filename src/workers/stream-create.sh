
#!/bin/bash

HOST="127.0.0.1"
BUN_SERVER_PORT="3000"


SOURCE_URL="$1"
STREAM_PATH="$2"
SOURCE_URL=${1:-$SOURCE_URL}
STREAM_PATH=${2:-$STREAM_PATH}


CURRENT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &> /dev/null && pwd)
PW_DIR=$(pwd)

if [[ -z "$SOURCE_URL" ]]; then
    echo "Error: Stream URL is required."
    echo "Usage: ./script.sh <URL> <PATH>"
    exit 1
fi

while true; do
    curl -s -X POST http://$HOST:$BUN_SERVER_PORT/api/inform -F "id=$STREAM_PATH" -F "status=Checking" -F "action=Update"
    echo "Checking status..."
    STATUS=$(yt-dlp --js-runtimes bun:$(which bun) --cookies "$PW_DIR/config/cookies.txt" --no-warnings --print "live_status" "$SOURCE_URL" 2>&1)
    if [[ "$STATUS" == "is_live" ]]; then

        curl -s -X POST http://$HOST:$BUN_SERVER_PORT/api/inform -F "id=$STREAM_PATH" -F "status=Live Detected" -F "action=Update"
    
        TMPDIR=$(mktemp -d /tmp/buffer.XXXXXX)

        mkfifo $TMPDIR/filter1
        mkfifo $TMPDIR/filter2

        # Trap signals and errors 
        trap 'curl -s -X POST http://$HOST:$BUN_SERVER_PORT/api/inform -F "id=$STREAM_PATH" -F "status=Force Kill" -F "action=Delete" ; [ -n "$PIDTSP" ] && kill -9 "$PIDTSP" 2>/dev/null; rm -rf "$TMPDIR" ; curl -s -X POST http://$HOST:$BUN_SERVER_PORT/api/inform -F "id=$STREAM_PATH" -F "status=Stopped" -F "action=Delete" ; exit 1' SIGINT SIGTERM EXIT

        # Twitch
        if [[ "$SOURCE_URL" =~ ^(https?://)?([a-z0-9]+\.)?twitch\.tv ]]; then

            echo "Twitch URL detected. Brace for impact. The following output may contain ads or NONE. I don't know."
            echo "Get some manifest URL..."
            curl -s -X POST http://$HOST:$BUN_SERVER_PORT/api/inform -F "id=$STREAM_PATH" -F "status=Get Channel Name" -F "action=Update"
            CH_NAME=$(yt-dlp --no-warnings --print "%(uploader)s" "$SOURCE_URL" | tr '[:upper:]' '[:lower:]' 2>&1)

            curl -s -X POST http://$HOST:$BUN_SERVER_PORT/api/inform -F "id=$STREAM_PATH" -F "status=Use Proxy" -F "action=Update"
            echo "Use proxy if possible (BYPASS)"
            MANIFEST=$(yt-dlp -f "b" --print "url" "https://as.luminous.dev/live/$CH_NAME?allow_source=true&allow_audio_only=true&fast_bread=true" 2>&1)
            BUFFER="16M"

        # Youtube
        elif [[ "$SOURCE_URL" =~ ^(https?://)?([a-z0-9]+\.)?(youtube\.com|youtu\.be) ]]; then

            curl -s -X POST http://$HOST:$BUN_SERVER_PORT/api/inform -F "id=$STREAM_PATH" -F "status=Manifesting" -F "action=Update"
            MANIFEST=$(streamlink --http-cookies-file "$PW_DIR/config/cookies.txt" --stream-url "$SOURCE_URL" best 2>&1)
            BUFFER="16M"

        # Others
        else
        
            curl -s -X POST http://$HOST:$BUN_SERVER_PORT/api/inform -F "id=$STREAM_PATH" -F "status=Manifesting" -F "action=Update"
            MANIFEST=$SOURCE_URL
            BUFFER="64M"
        
        fi

        curl -s -X POST http://$HOST:$BUN_SERVER_PORT/api/inform -F "id=$STREAM_PATH" -F "status=Starting..." -F "action=Update"

        streamlink --stream-segment-threads 3 --hls-playlist-reload-time 2 --ringbuffer-size 4M --stdout "$MANIFEST" best | \
        mbuffer -q -m $BUFFER -P 100 | \
        ffmpeg -loglevel quiet -stats \
        -fflags +discardcorrupt+genpts+igndts \
        -thread_queue_size 8192 \
        -re -i - \
        -c copy \
        -avoid_negative_ts make_zero \
        -flags +global_header \
        -max_delay 5000000 \
        -max_muxing_queue_size 4096 \
        -muxdelay 5 \
        -rtpflags send_bye+latm \
        -f rtsp "rtsp://$HOST:8554/$STREAM_PATH"

        curl -s -X POST http://$HOST:$BUN_SERVER_PORT/api/inform -F "id=$STREAM_PATH" -F "status=Stopped" -F "action=Update"
        echo "Streamed process ended. Checking once again..."
    
    elif [[ "$STATUS" == "upcoming" ]]; then
        curl -s -X POST http://$HOST:$BUN_SERVER_PORT/api/inform -F "id=$STREAM_PATH" -F "status=Wait for live signal." -F "action=Update"
        echo "Stream is scheduled. Sleeping 15s..."
        sleep 15
        continue
    elif [[ "$STATUS" == "was_live" ]]; then
        curl -s -X POST http://$HOST:$BUN_SERVER_PORT/api/inform -F "id=$STREAM_PATH" -F "status=Invalid URL" -F "action=Update"
        echo "Bummer! This link is a VOD!. Exiting..."
        break
        continue
    elif [[ "$STATUS" == "post_live" || "$STATUS" == *"not currently live"* ]]; then
        curl -s -X POST http://$HOST:$BUN_SERVER_PORT/api/inform -F "id=$STREAM_PATH" -F "status=Offline" -F "action=Update"
        echo "Stream has ended. Exiting...."
        break
        continue
    elif [[ "$STATUS" == "NA" || "$STATUS" == *"not a valid URL"* ]]; then
        curl -s -X POST http://$HOST:$BUN_SERVER_PORT/api/inform -F "id=$STREAM_PATH" -F "status=Error" -F "action=Update"
        echo "Unknown URL."
        break
    else
        curl -s -X POST http://$HOST:$BUN_SERVER_PORT/api/inform -F "id=$STREAM_PATH" -F "status=$STATUS" -F "action=Update"
        echo "Unknown ($STATUS). Retrying in 15s..."
        sleep 15
        continue
    fi
    
    if [[ -n "$PIDTSP" ]]; then
        kill -9 "$PIDTSP" 2>/dev/null
    fi
    rm -rf "$TMPDIR"
    curl -s -X POST http://$HOST:$BUN_SERVER_PORT/api/inform -F "id=$STREAM_PATH" -F "status=No Signal" -F "action=Update"
    echo "Wait for 5 seconds..."
    sleep 5
done

curl -s -X POST http://$HOST:$BUN_SERVER_PORT/api/inform -F "id=$STREAM_PATH" -F "status=Stopped" -F "action=Delete"