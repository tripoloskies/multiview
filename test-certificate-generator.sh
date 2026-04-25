#!/bin/bash

DOMAIN="$1"
IP="$2"


SSL_PATH="./config/ssl"

echo "Test Certificate Generator."
echo "---------------------------------------------------------------------------------------"
echo "This script generates a certificate and a key to ./config/ssl."
echo "The generated certficate and key should only be used for testing/local environment only"
echo "where HTTPS is absolutely necessary for enabling twitch chat."
echo ""
echo "THIS IS A SELF-SIGNED CERTIFICATE."
echo "For the love of God, DON'T USE THESE FOR PRODUCTION ENVIRONMENT!!!"
echo ""
echo ""

sleep 1
if [[ "$DOMAIN" == "--help" ]]; then

    echo "Syntax: test-certificate-generator.sh <domain name/hostname> <ip address (local or remote)>"
    echo ""
    echo "Notes:"
    echo "1. Don't type localhost as a domain name parameter because it's already added."
    echo "2. Don't type 127.0.0.1 or 0.0.0.0 as an ip address because same reason as number 1."
    echo ""
    exit 0
fi

if [[ ! -z "$DOMAIN" ]]; then
    SAN=",DNS:$DOMAIN"
fi

if [[ ! -z "$IP" ]]; then
    if [[ ! -z "$DOMAIN" ]]; then
        SAN="$SAN,IP:$IP"
    else
        SAN=",IP:$IP"
    fi
fi

openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout "$SSL_PATH/server.key" \
  -out "$SSL_PATH/server.crt" \
  -addext "subjectAltName=DNS:localhost,IP:127.0.0.1$SAN"
