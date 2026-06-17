#!/bin/bash
# SONAFRIK — Export local via pg_dump
# Usage : ./scripts/backup-export.sh
# Pré-requis : pg_dump installé + DATABASE_URL dans l'environnement (.env.local)
#
# NE PAS exécuter en production sans accord — risque de charge DB.
# Ce script est réservé aux développeurs pour des exports locaux.

set -e

if [ -z "$DATABASE_URL" ]; then
  echo "❌ DATABASE_URL non défini. Copier .env.example → .env.local et renseigner DATABASE_URL."
  exit 1
fi

mkdir -p backups
DATE=$(date +%Y%m%d_%H%M%S)
OUTFILE="backups/sonafrik_$DATE.dump"

echo "📦 Démarrage de l'export SONAFRIK..."
pg_dump "$DATABASE_URL" \
  --no-owner \
  --no-acl \
  -F c \
  -f "$OUTFILE"

echo "✅ Backup créé : $OUTFILE"
echo "   Taille : $(du -h "$OUTFILE" | cut -f1)"
echo ""
echo "Pour restaurer :"
echo "  pg_restore --no-owner --no-acl -d \"\$DATABASE_URL\" $OUTFILE"
