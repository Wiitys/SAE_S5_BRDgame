CREATE TABLE Players(
   id_player INT,
   username VARCHAR(50),
   Money INT,
   level INT,
   kills INT,
   death INT,
   boss_killed INT,
   PRIMARY KEY(id_player),
   UNIQUE(username)
);

CREATE TABLE Maps(
   id_map INT,
   map_name VARCHAR(100),
   PRIMARY KEY(id_map)
);

CREATE TABLE Ressources(
   id_ressource INT,
   ressource_name VARCHAR(50),
   PRIMARY KEY(id_ressource)
);

CREATE TABLE Servers(
   id_server INT,
   server_name VARCHAR(50),
   PRIMARY KEY(id_server)
);

CREATE TABLE Shop(
   id_item INT,
   item_name VARCHAR(100),
   PRIMARY KEY(id_item)
);

CREATE TABLE Crafts(
   id_craft INT,
   craft_name VARCHAR(50),
   PRIMARY KEY(id_craft)
);

CREATE TABLE Parties(
   id_party INT,
   name_party VARCHAR(50),
   is_private LOGICAL,
   password VARCHAR(25),
   id_map INT NOT NULL,
   id_server INT NOT NULL,
   PRIMARY KEY(id_party),
   FOREIGN KEY(id_map) REFERENCES Maps(id_map),
   FOREIGN KEY(id_server) REFERENCES Servers(id_server)
);

CREATE TABLE WeaponsTools(
   id_weapon INT,
   weapon_name VARCHAR(50),
   is_craftable LOGICAL,
   id_craft INT NOT NULL,
   PRIMARY KEY(id_weapon),
   UNIQUE(id_craft),
   FOREIGN KEY(id_craft) REFERENCES Crafts(id_craft)
);

CREATE TABLE PlayerShop(
   id_player INT,
   id_item INT,
   item_cost INT,
   PRIMARY KEY(id_player, id_item),
   FOREIGN KEY(id_player) REFERENCES Players(id_player),
   FOREIGN KEY(id_item) REFERENCES Shop(id_item)
);

CREATE TABLE FriendPlayer(
   id_player INT,
   id_player_1 INT,
   PRIMARY KEY(id_player, id_player_1),
   FOREIGN KEY(id_player) REFERENCES Players(id_player),
   FOREIGN KEY(id_player_1) REFERENCES Players(id_player)
);

CREATE TABLE CraftRessources(
   id_ressource INT,
   id_craft INT,
   id_craft_1 INT,
   quantity_needed INT,
   PRIMARY KEY(id_ressource, id_craft, id_craft_1),
   FOREIGN KEY(id_ressource) REFERENCES Ressources(id_ressource),
   FOREIGN KEY(id_craft) REFERENCES Crafts(id_craft),
   FOREIGN KEY(id_craft_1) REFERENCES Crafts(id_craft)
);

CREATE TABLE PlayersParty(
   id_player INT,
   id_party INT,
   PRIMARY KEY(id_player, id_party),
   FOREIGN KEY(id_player) REFERENCES Players(id_player),
   FOREIGN KEY(id_party) REFERENCES Parties(id_party)
);
