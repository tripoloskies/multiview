
#!/bin/bash


# Params
SOURCE_URL="$1"
STREAM_PATH="$2"

# Environment Path Variables
RECORDING_PATH="/mnt/record-storage"
CURRENT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &> /dev/null && pwd)
PW_DIR=$(pwd)

# Network/Hostname Variables
HOST="127.0.0.1"
BUN_SERVER_PORT="3000"


# Background PID's to close in case of nasty moments while this script was running.
PUBLISHER_PID=""
MBUFFER_PID=""




if [[ -z "$SOURCE_URL" ]]; then
    echo "Error: Stream URL is required."
    echo "Usage: ./script.sh <URL> <PATH>"
    exit 1
fi

getVodId() {
    echo $(curl -s -X POST http://$HOST:$BUN_SERVER_PORT/api/vod/publish -F "id=$STREAM_PATH" 2>&1)
}


publish() {
    local URL=$1
    local BUFFER_SIZE=$2
    local ARGS=$3

    local VOD_ID=$(getVodId)

    if [[ "$VOD_ID" == "null" ]]; then
        echo "Check if the Bun Server is active and running."
        exit 1
    fi   

    TMPDIR=$(mktemp -d /tmp/buffer.XXXXXX)

    mkfifo $TMPDIR/filter1

    streamlink --stream-segment-threads 3 $ARGS --ringbuffer-size 64M --stdout "$URL" best | \
    mbuffer -q -m $BUFFER_SIZE -P 60 > $TMPDIR/filter1 &
    MBUFFER_PID=$!

    local VCODEC=$(ffprobe -loglevel quiet -select_streams v:0 -show_entries stream=codec_name -of default=noprint_wrappers=1:nokey=1 -analyzeduration 2k -probesize 2k -i "$URL" | head -n 1)

    if [[ "$VCODEC" == "h264" ]]; then
        TAG="avc1"
    elif [[ "$VCODEC" == "h265" ]]; then
        TAG="hvc1"
    else
        TAG="$VCODEC"
    fi

    local A_DIR="$RECORDING_PATH/$VOD_ID"
    mkdir -p $A_DIR

    ffmpeg -stats \
    -thread_queue_size 8192 -fflags +genpts -re \
    -i $TMPDIR/filter1 \
    -c:v copy \
    -c:a aac \
    -b:a 192k \
    -af aresample=async=1 -profile:a aac_low -ar 44100 \
    -aac_coder fast \
    -flags +global_header \
    -map 0:v -map 0:a \
    -aac_ms false \
    -aac_is false \
    -aac_pns false \
    -tag:v "$TAG" \
    -aac_tns false \
    -sn -dn \
    -avoid_negative_ts make_zero \
    -muxdelay 0.5 \
    -f tee " \
        [f=mpegts]srt://$HOST:8890?streamid=publish:$STREAM_PATH&latency=500000&pkt_size=1316| \
        [f=mp4:movflags=+frag_keyframe+empty_moov+default_base_moof]$A_DIR/index.mp4" &

    PUBLISHER_PID=$!
    
    while true; do
        echo "Thumbnail......"
        if ! kill -0 $MBUFFER_PID 2>/dev/null && ! kill -0 $PUBLISHER_PID 2>/dev/null ; then
            echo "The publisher was dead. Skipping..."
            break
        fi
        ffmpeg -loglevel quiet -i $A_DIR/index.mp4 -frames:v 1 -update true -y $A_DIR/thumbnail.jpg
        if [ -f "$A_DIR/thumbnail.jpg" ]; then
            echo "Thumbnail successfully created."
            break
        else
            echo "Thumbnail failed. Retrying...."
        fi
        sleep 5
    done

    wait $PUBLISHER_PID
}

inform_update() {
    local MESSAGE=$1
    curl -s -X POST http://$HOST:$BUN_SERVER_PORT/api/inform -F "id=$STREAM_PATH" -F "status=$MESSAGE" -F "action=Update"
}

inform_delete() {
    local MESSAGE=$1
    curl -s -X POST http://$HOST:$BUN_SERVER_PORT/api/inform -F "id=$STREAM_PATH" -F "status=$MESSAGE" -F "action=Delete"
}

close() {
    inform_delete "Closing" ; \
    [ -n "$PUBLISHER_PID" ] && kill -9 "$PUBLISHER_PID" 2>/dev/null; \
    [ -n "$MBUFFER_PID" ] && kill -9 "$MBUFFER_PID" 2>/dev/null; \
    rm -rf "$TMPDIR" ; \
    exit 1
}


while true; do
    inform_update "Checking"
    echo "Checking status..."
    STATUS=$(yt-dlp --js-runtimes bun:$(which bun) --cookies "$PW_DIR/config/cookies.txt" --no-warnings --print "live_status" "$SOURCE_URL" 2>&1)

    if [[ "$STATUS" == "is_live" ]]; then

        inform_update "Live Detected"

        # Trap signals and errors 
        trap close SIGINT SIGTERM EXIT

        # Twitch
        if [[ "$SOURCE_URL" =~ ^(https?://)?([a-z0-9]+\.)?twitch\.tv ]]; then

            echo "Twitch URL detected."
            inform_update "Get Channel Name"
            CH_NAME=$(yt-dlp --no-warnings --print "%(uploader)s" "$SOURCE_URL" | tr '[:upper:]' '[:lower:]' 2>&1)

            inform_update "Get Manifest URL using proxy."
            echo "Get Manifest URL using proxy."
            MANIFEST=$(yt-dlp -f "b" --print "url" "https://as.luminous.dev/live/$CH_NAME?allow_source=true&allow_audio_only=true&fast_bread=true" 2>&1)
            BUFFER="12M"
            ADD_ARGS="--hls-playlist-reload-time segment --hls-live-edge 10 --stream-segment-timeout 1 --stream-segment-attempts 20"

        # Youtube
        elif [[ "$SOURCE_URL" =~ ^(https?://)?([a-z0-9]+\.)?(youtube\.com|youtu\.be) ]]; then

            inform_update "Get Manifest URL"
            echo "Get Manifest URL."
            MANIFEST=$(yt-dlp --js-runtimes bun:$(which bun) --cookies "$PW_DIR/config/cookies.txt" --no-warnings --print "url" "$SOURCE_URL" 2>&1)
            BUFFER="12M"
            ADD_ARGS="--hls-playlist-reload-time segment --hls-live-edge 10 --stream-segment-timeout 1 --stream-segment-attempts 20"

        # Others
        else
            inform_update "Please wait."
            echo "Use Source URL as a Manifest URL."
            MANIFEST="$SOURCE_URL"
            BUFFER="12M"
            ADD_ARGS="--hls-playlist-reload-time playlist --hls-live-edge 5 --stream-segment-timeout 1 --stream-segment-attempts 50"
        fi

        echo "Starting."
        inform_update "Starting"
        publish "$MANIFEST" "$BUFFER" "$ADD_ARGS"
        inform_update "Stopped"

        echo "Ended. Checking once again..."
    
    elif [[ "$STATUS" == "upcoming" ]]; then
        inform_update "Waiting for the LIVE signal"
        echo "Stream is scheduled. Sleeping 15s..."
        sleep 15
        continue
    elif [[ "$STATUS" == "was_live" ]]; then
        inform_update "Error URL"
        echo "Bummer! This link is a VOD!. Exiting..."
        break
    elif [[ "$STATUS" == "post_live" || "$STATUS" == *"not currently live"* ]]; then
        inform_update "Offline"
        echo "Stream has ended. Exiting...."
        break
    elif [[ "$STATUS" == "NA" || "$STATUS" == *"not a valid URL"* ]]; then
        inform_update "Unknown URL"
        echo "Unknown URL."
        break
    else
        inform_update $STATUS
        echo "Unknown ($STATUS). Retrying in 15s..."
        sleep 15
        continue
    fi
    
    rm -rf "$TMPDIR"
    inform_update "No Signal"
    echo "Waiting 5 seconds..."
    sleep 5
done