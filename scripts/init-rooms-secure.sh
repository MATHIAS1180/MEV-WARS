#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

RPC_URL="${NEXT_PUBLIC_RPC_URL:-https://api.devnet.solana.com}"

echo "Initialisation securisee des rooms (devnet par defaut)"
echo "RPC: $RPC_URL"
echo
read -r -s -p "Colle ta cle privee (base58/array/csv), puis Entrer: " ADMIN_KEY
echo

if [[ -z "$ADMIN_KEY" ]]; then
  echo "Erreur: cle privee vide."
  exit 1
fi

CRANK_PRIVATE_KEY="$ADMIN_KEY" NEXT_PUBLIC_RPC_URL="$RPC_URL" npm run init:rooms

unset ADMIN_KEY
unset CRANK_PRIVATE_KEY || true

echo
echo "Termine. Si les 3 rooms affichent Initialized/Already initialized, c'est bon."