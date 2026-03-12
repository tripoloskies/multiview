
#!/bin/bash


INSTALL_ONLY="$1"

CURRENT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &> /dev/null && pwd)
MEDIAMTX_VERSION="v1.16.3"

gentle_exit() {
    if [[ -f "$CURRENT_DIR/tmp/mediamtx.yml" ]]; then
        mv "$CURRENT_DIR/tmp/mediamtx.yml" "$CURRENT_DIR/mediamtx.yml"
        rm -rf "$CURRENT_DIR/tmp"
        exit 1
    fi
    rm $CURRENT_DIR/mediamtx*.tar.gz
    exit 0
}

trap gentle_exit SIGINT SIGTERM

if [[ ! -f "$CURRENT_DIR/mediamtx.yml" ]]; then
    echo "MediaMTX configuration file not found. Please make sure mediamtx.yml is in the same directory as this script."
    exit 1
fi

if [[ ! -f "$CURRENT_DIR/mediamtx" && "$INSTALL_ONLY" == "--install-only" ]]; then
    mkdir -p "$CURRENT_DIR/tmp"
    mv "$CURRENT_DIR/mediamtx.yml" "$CURRENT_DIR/tmp/mediamtx.yml"
    curl -L -o $CURRENT_DIR/mediamtx_${MEDIAMTX_VERSION}_linux_amd64.tar.gz https://github.com/bluenviron/mediamtx/releases/download/v1.16.3/mediamtx_v1.16.3_linux_amd64.tar.gz
    tar -xzf $CURRENT_DIR/mediamtx_${MEDIAMTX_VERSION}_linux_amd64.tar.gz -C $CURRENT_DIR
    ls -l $CURRENT_DIR
    rm $CURRENT_DIR/mediamtx*.tar.gz
    rm -rf "$CURRENT_DIR/mediamtx.yml"
    mv "$CURRENT_DIR/tmp/mediamtx.yml" "$CURRENT_DIR/mediamtx.yml"
    rm -rf "$CURRENT_DIR/tmp"
fi

chmod +x "$CURRENT_DIR/mediamtx"

if ([ "$INSTALL_ONLY" == "--install-only" ]); then
    echo "MediaMTX installed successfully."
    exit 0
fi

"$CURRENT_DIR/mediamtx" "$CURRENT_DIR/mediamtx.yml"
exit 0