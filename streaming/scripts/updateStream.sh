#!/bin/bash


HOST="web"

STREAM_PATH=$1
STATUS=$2

if [[ -z "$STREAM_PATH" || -z "$STATUS" ]]; then
    echo "Script Usage: ./updateStream.sh <path> <status>"
    exit 1
fi


INFORM_STATUS=$(curl -s -X POST http://$HOST:3001/inform -F "path=$STREAM_PATH" -F "status=$STATUS" -F "action=Update" 1>&1)

if [[ "$INFORM_STATUS" != "0" ]]; then
    echo "Error inform_update code $INFORM_STATUS"
fi