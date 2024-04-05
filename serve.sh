#!/bin/sh

KEYS=$HOME/.office-addin-dev-certs

http-server -S -C $KEYS/localhost.crt -K $KEYS/localhost.key --cors . -p 3000