#!/bin/bash
# Libera la porta 4000 terminando i processi in ascolto (es. vecchie istanze del server).
set -e
echo "Cercando processi in ascolto sulla porta 4000..."
LISTENERS=$(lsof -i :4000 2>/dev/null | grep LISTEN | awk '{print $2}' | sort -u)
if [ -n "$LISTENERS" ]; then
  echo "Terminando PID: $LISTENERS"
  echo "$LISTENERS" | xargs kill -9 2>/dev/null || true
  sleep 1
  echo "Porta 4000 libera."
else
  echo "Nessun processo in ascolto sulla porta 4000."
fi
