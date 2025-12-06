#!/bin/bash

echo "🚀 Démarrage du déploiement..."

# Aller dans le répertoire de l'application
cd /var/www/gmao-app

# Pull les dernières modifications
echo "📥 Récupération des dernières modifications..."
git pull origin main

# Installer les dépendances
echo "📦 Installation des dépendances..."
pnpm install

# Générer Prisma client
echo "⚡ Génération du client Prisma..."
pnpm prisma generate

# Mettre à jour la base de données
echo "🗄️ Mise à jour de la base de données..."
pnpm prisma db push

# Build l'application
echo "🔨 Construction de l'application..."
pnpm build

# Redémarrer l'application avec PM2
echo "🔄 Redémarrage de l'application..."
pm2 restart gmao-app

echo "✅ Déploiement terminé avec succès!"