#!/bin/bash

# Environment Path Variables
WORK_DIR=$(pwd)

# Network/Hostname Variables
HOST="localhost"
USE_COOKIES="1"
DISK_SPACE_WARN_FLAG="0"

# Params
SOURCE_URL="$1"
STREAM_PATH="$2"
RECORDING_PATH="$3"
RUNTIME_PATH="$4"
YTDLP_PATH="$5"
STREAMLINK_PATH="$6"
STREAMING_HOST="$7"
LOG_DL_PROGRESS="$8"
LOW_LATENCY_STREAM="$9"

# Background PID's to close in case of nasty moments while this script was running.
PUBLISHER_PID=""
MBUFFER_PID=""
RECORD_ID=""

sleep 1

echo "List of arguments: "
echo "------------------"
echo "Source URL: $SOURCE_URL"
echo "Stream Path: $STREAM_PATH"
echo "Recording Path: $RECORDING_PATH"
echo "JS Runtime Path: $RUNTIME_PATH"
echo "yt-dlp Path: $YTDLP_PATH"
echo "streamlink Path: $STREAMLINK_PATH"
echo "Mediamtx Host: $STREAMING_HOST"
echo "Download Progress Logging: $LOG_DL_PROGRESS"
echo "Low Latency Stream: $LOW_LATENCY_STREAM"
echo "------------------"


if [[ -z "$RECORDING_PATH" ]]; then
    echo "Recording path is required"
    exit 1
fi

if [[ "$RECORDING_PATH" == "/" ]]; then
    echo "Saving the recording to the root directory is not allowed!"
    exit 1
fi

if [ ! -d "$RECORDING_PATH" ]; then
    echo "Recording directory $RECORDING_PATH does not exist."
    exit 1
fi

if [[ -z "$SOURCE_URL" ]]; then
    echo "Stream URL is required."
    exit 1
fi

if [[ -z "$RUNTIME_PATH" ]]; then
    echo "Runtime path is required."
    exit 1
fi

if [[ -z "$YTDLP_PATH" ]]; then
    echo "yt-dlp path is required."
    exit 1
fi

if [[ -z "$STREAMLINK_PATH" ]]; then
    echo "streamlink path is required."
    exit 1
fi

if [[ -z "$STREAMING_HOST" ]]; then
    echo "Mediamtx host is required."
    exit 1
fi

if [[ -z "$LOG_DL_PROGRESS" ]]; then
    LOG_DL_PROGRESS="0"
elif [[ "$LOG_DL_PROGRESS" != "1" && "$LOG_DL_PROGRESS" != "0" ]]; then
    echo "Invalid downloading progress logging value. Value must be 1 (enabled) or 0 (disabled)"
    exit 1
fi

if [[ -z "$LOW_LATENCY_STREAM" ]]; then
    LOW_LATENCY_STREAM="0"
elif [[ "$LOW_LATENCY_STREAM" != "1" && "$LOW_LATENCY_STREAM" != "0" ]]; then
    echo "Invalid low latency stream value. Value must be 1 (enabled) or 0 (disabled)"
    exit 1
fi

getytdlpCookieArgs() {
    if [[ "$USE_COOKIES" == "1" ]]; then
        echo "--js-runtimes bun:$RUNTIME_PATH --cookies "$WORK_DIR/config/cookies.txt""
    else
        echo ""
    fi
}

getrecordId() {
    curl -s -X POST http://$HOST:3002/publish -F "path=$STREAM_PATH" 2>&1
}

diskStatus() {
    curl -s -X GET http://$HOST:3002/get/stats/disk 2>&1
}

checkStreamIfBroken() {
    curl -s -X POST http://$HOST:3002/verify -F "recordId=$RECORD_ID" 2>&1
}

parseStreamMetadata() {
    local METADATA
    local SAVE_STATUS

    echo "Metadata extraction starting..."

    # shellcheck disable=SC2046
    METADATA=$($YTDLP_PATH $(getytdlpCookieArgs) -O "%(.{id,fulltitle,uploader,timestamp,description,extractor,webpage_url})#j" --no-warnings --skip-download "$SOURCE_URL" 1>&1 | base64)    
    
    if [[ "$METADATA" == "" ]]; then
        echo "Metadata extraction failed."
    else
        echo "Metadata successfully extracted."

        SAVE_STATUS=$(curl -s -X POST http://$HOST:3002/metadata -F "recordId=$RECORD_ID" -F "metadata=$METADATA" 1>&1)
        if [[ "$SAVE_STATUS" == "0" ]]; then
            echo "Metadata saved successfully."
        else
            echo "Metadata saved unsuccessfully."
        fi
    fi
}

publish() {
    local URL=$1
    local BUFFER_SIZE=$2
    local ARGS=$3
    local METADATA=$4
    
    RECORD_ID=$(getrecordId)

    if [[ "$URL" == "" ]]; then
        inform_update "Broken Stream"
        echo "No Manifest URL. Extractor did not process the link properly or a streaming site just got a tantrum."
        echo "Retrying..."
        sleep 5
        return
    fi

    if [[ "$RECORD_ID" == "-1" ]]; then
        inform_update "Internal Server Error"
        echo "Check if the Bun Server is active and running."
        exit 1

    elif [[ "$RECORD_ID" == "1" ]]; then
        inform_update "Internal Server Error"
        echo "Invalid data."
        exit 1
        
    elif [[ "$RECORD_ID" == "2" ]]; then
        inform_update "Path not found."
        echo "Path not found. Retrying..."
        return        
    fi   

    TMPDIR=$(mktemp -d /tmp/buffer.XXXXXX)

    local A_DIR="$RECORDING_PATH/$STREAM_PATH/$RECORD_ID"

    mkfifo "$TMPDIR/filter1"
    mkdir -p "$A_DIR"
    mkdir -p "$A_DIR/segments"

    if [[ "$LOG_DL_PROGRESS" == "1" ]]; then
        echo "Downloading progress logging enabled."
        local LOG_ARGS="--logfile "$A_DIR/logs.txt" --loglevel all"
    else
        echo "Downloading progress logging disabled."
        local LOG_ARGS=""
    fi

    if [[ "$LOW_LATENCY_STREAM" == "1" ]]; then
        echo "Low Latency Streaming is on."
        local BUFFER_CMD=(cat)
        local FFLAGS="-fflags +nobuffer+flush_packets+genpts"
        local FLAGS="-flags +low_delay+global_header"
        local SEGMENT_THREADS=5
        local RINGBUFFER_SIZE="8M"
    else
        echo "Low Latency Streaming is off"
        local BUFFER_CMD=(mbuffer -q -m "$BUFFER_SIZE" -P 60)
        local FFLAGS="-fflags +genpts"
        local FLAGS="-flags +global_header"
        local SEGMENT_THREADS=2
        local RINGBUFFER_SIZE="64M"
    fi

    $STREAMLINK_PATH --loglevel none \
    --http-cookies-file "$WORK_DIR/config/cookies.txt" $LOG_ARGS \
    --stream-segment-threads "$SEGMENT_THREADS" $ARGS --ringbuffer-size "$RINGBUFFER_SIZE" \
    --stdout "$URL" best | \
    "${BUFFER_CMD[@]}" | \
    ffmpeg -hide_banner -loglevel quiet -stats -stats_period 5 \
    -thread_queue_size 2048 $FFLAGS -tag 0 -re \
    -i - \
    -c:v copy \
    $FLAGS \
    -map 0:v -map 0:a \
    -af "aresample=async=1:first_pts=0" \
    -c:a aac \
    -b:a 192k \
    -profile:a aac_low \
    -flags +global_header \
    -aac_coder fast \
    -aac_ms false \
    -aac_is false \
    -aac_pns false \
    -aac_tns false \
    -sn -dn \
    -avoid_negative_ts make_zero \
    -muxdelay 0.1 \
    -f tee " \
        [f=rtsp:onfail=abort:rtpflags=latm]rtsp://$STREAMING_HOST:8554/$STREAM_PATH| \
        [f=hls:onfail=abort:hls_time=5:hls_segment_filename=$A_DIR/segments/segment%d.ts:hls_playlist_type=event]$A_DIR/index.m3u8" &

    PUBLISHER_PID=$!
    
    while true; do
        echo "Thumbnail......"
        if ! kill -0 $PUBLISHER_PID 2>/dev/null ; then
            echo "The publisher was dead. Skipping..."
            break
        fi
        ffmpeg -loglevel quiet -i "$A_DIR/segments/segment1.ts" -frames:v 1 -update true -y "$A_DIR/thumbnail.jpg"
        if [ -f "$A_DIR/thumbnail.jpg" ]; then
            echo "Thumbnail successfully created."
            if [[ "$METADATA" == "yes" ]]; then
                parseStreamMetadata
            fi
            break
        else
            echo "Thumbnail failed. Retrying...."
        fi
        sleep 5
    done

    wait $PUBLISHER_PID
    checkStreamIfBroken
}

inform_update() {
    local MESSAGE=$1
    local INFORM_STATUS
    
    INFORM_STATUS=$(curl -s -X POST http://$HOST:3001/inform -F "path=$STREAM_PATH" -F "status=$MESSAGE" -F "action=Update" 1>&1)
    if [[ "$INFORM_STATUS" != "0" ]]; then
        echo "Error inform_update code $INFORM_STATUS"
    fi
}

inform_delete() {
    local MESSAGE=$1
    local INFORM_STATUS
    
    INFORM_STATUS=$(curl -s -X POST http://$HOST:3001/inform -F "path=$STREAM_PATH" -F "status=$MESSAGE" -F "action=Delete" 1>&1)
    if [[ "$INFORM_STATUS" != "0" ]]; then
        echo "Error inform_delete code $INFORM_STATUS"
    fi
}

close() {
    checkStreamIfBroken
    inform_delete "Closing"
    [ -n "$PUBLISHER_PID" ] && kill -9 "$PUBLISHER_PID" 2>/dev/null
    [ -n "$MBUFFER_PID" ] && kill -9 "$MBUFFER_PID" 2>/dev/null
    rm -rf "$TMPDIR"
    exit 1
}

ytCheckStatus() {
    local STATUS

    STATUS=$($YTDLP_PATH $(getytdlpCookieArgs) --extractor-args "youtubepot-bgutilhttp:base_url=http://potoken:4416" --extractor-args "youtube:skip=dash,translated_subs" --no-warnings --print "live_status" "$SOURCE_URL" 2>&1)
    if [[ "$STATUS" == "is_live" ]]; then
        inform_update "Live Detected"
        return 0
    elif [[ "$STATUS" == "was_live" ]]; then
        inform_update "Error URL"
        echo "Bummer! This link is a VOD!. Exiting..."
        return 2
    elif [[ "$STATUS" == "post_live" || "$STATUS" == "not_live" || "$STATUS" == *"not currently live"* ]]; then
        inform_update "Offline"
        echo "Stream has ended. Exiting...."
        return 2
    elif [[ "$STATUS" == *"The page needs to be reloaded"* ]]; then
        inform_update "YouTube caught it. yt-dlp #16212"
        echo "YouTube caught it. Retrying in 5s..."
        echo "See the root issue here: https://github.com/yt-dlp/yt-dlp/issues/16212"
        echo "Temporarily disabling cookies and retrying..."
        sleep 5
        USE_COOKIES="0"
        return 1
    elif [[ "$STATUS" == "NA" || "$STATUS" == *"not a valid URL"* ]]; then
        inform_update "Unknown URL"
        echo "Unknown URL. Exiting..."
        return 2
    else
        inform_update "$STATUS"
        echo "Unknown ($STATUS). Retrying in 15s..."
        sleep 15
        return 1
    fi
}

ytGetStreamManifest() {
    $YTDLP_PATH $(getytdlpCookieArgs) -f "b" --extractor-args "youtubepot-bgutilhttp:base_url=http://potoken:4416" --extractor-args "youtube:skip=dash,translated_subs" --no-warnings --print "url" "$SOURCE_URL" 1>&1
}

twitchCheckStatus() {
    local STATUS

    STATUS=$($YTDLP_PATH --no-warnings --print "live_status" "$SOURCE_URL" 2>&1)

    if [[ "$STATUS" == "is_live" ]]; then
        inform_update "Live Detected"
        return 0
    elif [[ "$STATUS" == "was_live" ]]; then
        inform_update "Error URL"
        echo "Bummer! This link is a VOD!. Exiting..."
        return 2
    elif [[ "$STATUS" == "post_live" || "$STATUS" == "not_live" || "$STATUS" == *"not currently live"* ]]; then
        inform_update "Offline"
        echo "Stream has ended. Exiting...."
        return 2
    elif [[ "$STATUS" == "NA" || "$STATUS" == *"not a valid URL"* ]]; then
        inform_update "Unknown URL"
        echo "Unknown URL. Exiting..."
        return 2
    else
        inform_update "$STATUS"
        echo "Unknown ($STATUS). Retrying in 15s..."
        sleep 15
        return 1
    fi
}

twitchGetStreamManifest() {
    local CH_NAME
    local PROXY_HOSTNAME="as.luminous.dev"

    CH_NAME=$($YTDLP_PATH --no-warnings --print "%(uploader)s" "$SOURCE_URL" | tr '[:upper:]' '[:lower:]' 1>&1)
    $YTDLP_PATH -q --print "url" "https://$PROXY_HOSTNAME/live/$CH_NAME?allow_source=true&allow_audio_only=true&fast_bread=true" 1>&1
}

othersCheckStatus() {
    local STATUS

    STATUS=$(curl -s -L -o /dev/null -w "%{http_code}\\n" "$SOURCE_URL")

    if [[ "$STATUS" == "200" ]]; then
        inform_update "Live Detected"
        return 0
    else 
        inform_update "Offline"
        return 2
    fi
}

main() {
    while true; do
        local DISK_STATUS=$(diskStatus)
        if [[ "$DISK_STATUS" == "0" ]]; then
            if [[ "$DISK_SPACE_WARN_FLAG" == "1" ]]; then
                DISK_SPACE_WARN_FLAG="0"
            fi
        elif [[ "$DISK_STATUS" == "1" ]]; then
            if [[ "$DISK_SPACE_WARN_FLAG" == "1" ]]; then
                inform_update "Recording Disk Space Critically Low!"
                echo "Recording Disk space critically low! Closing the stream..."
                exit 1
            else
                DISK_SPACE_WARN_FLAG="1"
                inform_update "Recording Disk Space Critically Low!"
                echo "Recording disk space critically low! Retrying for 30 seconds. Free disk space to resume recording."
                sleep 30
                continue
            fi
        elif [[ "$DISK_STATUS" == "2" ]]; then
            if [[ "$DISK_SPACE_WARN_FLAG" == "1" ]]; then
                inform_update "Recording Disk Full!"
                echo "Recording Disk Full! Closing the stream..."
                exit 1
            else
                DISK_SPACE_WARN_FLAG="1"
                inform_update "Recording Disk Full!"
                echo "Recording disk full! Retrying for 30 seconds. Free disk space to resume recording."
                sleep 30
                continue
            fi
        else
            echo "Bad Recording Path or Disk! Closing the stream..."
            exit 1
        fi

        inform_update "Checking"
        echo "Checking status..."

        echo "Use Cookies: $USE_COOKIES"
            
            # Twitch
            if [[ "$SOURCE_URL" =~ ^(https?://)?([a-z0-9]+\.)?twitch\.tv ]]; then
                echo "Twitch URL detected."

                twitchCheckStatus
                local CHECK_STATUS=$?
                if [[ $CHECK_STATUS == 1 ]]; then
                    continue
                elif [[ $CHECK_STATUS == 2 ]]; then
                    break
                fi 

                inform_update "Get Manifest URL using proxy."
                echo "Get Manifest URL using proxy."
                
                if [[ "$LOW_LATENCY_STREAM" == "1" ]]; then
                    local LLS_LIVE_EDGE="1"
                else
                    local LLS_LIVE_EDGE="10"
                fi

                local MANIFEST=$(twitchGetStreamManifest)
                local BUFFER="12M"
                local ADD_ARGS="--hls-playlist-reload-time playlist --hls-live-edge $LLS_LIVE_EDGE --stream-segmented-queue-deadline 6 --stream-segment-timeout 2 --stream-segment-attempts 20"
                local ADD_METADATA="yes"

            # Youtube
            elif [[ "$SOURCE_URL" =~ ^(https?://)?([a-z0-9]+\.)?(youtube\.com|youtu\.be) ]]; then
                echo "Youtube URL detected."

                ytCheckStatus
                local CHECK_STATUS=$?
                if [[ $CHECK_STATUS == 1 ]]; then
                    continue
                elif [[ $CHECK_STATUS == 2 ]]; then
                    break
                fi 

                inform_update "Get Manifest URL"
                echo "Get Manifest URL."
                
                if [[ "$LOW_LATENCY_STREAM" == "1" ]]; then
                    local LLS_LIVE_EDGE="1"
                else
                    local LLS_LIVE_EDGE="10"
                fi

                local MANIFEST=$(ytGetStreamManifest)
                local BUFFER="12M"
                local ADD_ARGS="--hls-playlist-reload-time playlist --hls-live-edge $LLS_LIVE_EDGE --stream-segmented-queue-deadline 6 --stream-segment-timeout 2 --stream-segment-attempts 20"
                local ADD_METADATA="yes"

            # Others
            else
                inform_update "Please wait."
                echo "Use Source URL as a Manifest URL."
                
                othersCheckStatus
                local CHECK_STATUS=$?
                if [[ $CHECK_STATUS == 1 ]]; then
                    continue
                elif [[ $CHECK_STATUS == 2 ]]; then
                    break
                fi 

                if [[ "$LOW_LATENCY_STREAM" == "1" ]]; then
                    local LLS_LIVE_EDGE="2"
                else
                    local LLS_LIVE_EDGE="5"
                fi
                
                local MANIFEST="$SOURCE_URL"
                local BUFFER="12M"
                local ADD_ARGS="--hls-playlist-reload-time playlist --hls-live-edge $LLS_LIVE_EDGE --stream-segment-timeout 1 --stream-segment-attempts 50"
                local ADD_METADATA="no"
            fi

        echo "Starting."
        inform_update "Starting"
        publish "$MANIFEST" "$BUFFER" "$ADD_ARGS" "$ADD_METADATA"
        inform_update "Stopped"

        echo "Ended. Checking once again..."
        
        rm -rf "$TMPDIR"
        inform_update "No Signal"
        echo "Waiting 5 seconds..."
        sleep 5
    done
}

trap close SIGINT SIGTERM EXIT
main