# Utiliser l'image de Node.js comme base
FROM node:18-alpine

# Créer un répertoire de travail
WORKDIR /app

# COPY du package.json pour vérifier les dépendances et éviter les versions non-testées
COPY package*.json .

# Installation des dépendances
RUN npm install

# Copier les fichiers de l'application dans le conteneur
COPY . .

# Exposer le port
EXPOSE 3000

#RUN npm init -y Pour crée un package.json

# Installation du client socket.io
RUN npm install express socket.io
RUN npm install socket.io-client

# Commande pour démarrer le serveur
CMD ["node", "server.js"]

#Dockerfile server