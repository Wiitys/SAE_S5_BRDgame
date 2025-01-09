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
   category VARCHAR(50),
   value_food INT,
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
   is_private BOOLEAN,
   password VARCHAR(25),
   id_map INT NOT NULL,
   id_server INT NOT NULL,
   PRIMARY KEY(id_party),
   FOREIGN KEY(id_map) REFERENCES Maps(id_map),
   FOREIGN KEY(id_server) REFERENCES Servers(id_server)
);

CREATE TABLE Ennemies(
   id_ennemies INT,
   name VARCHAR(255),
   health_points INT,
   type VARCHAR(50),
   behavior VARCHAR(50),
   attackRange INT,
   searchRange INT,
   actionDelay VARCHAR(50),
   PRIMARY KEY(id_ennemies)
);

CREATE TABLE Farmables(
   id_farmable INT,
   type VARCHAR(50),
   health_point INT,
   PRIMARY KEY(id_farmable)
);

CREATE TABLE Armour(
   id_armour INT,
   armour_name VARCHAR(50),
   is_craftable BOOLEAN,
   effect VARCHAR(50),
   resistance INT,
   id_craft INT NOT NULL,
   PRIMARY KEY(id_armour),
   UNIQUE(id_craft),
   FOREIGN KEY(id_craft) REFERENCES Crafts(id_craft)
);

CREATE TABLE WeaponsTools(
   id_weapon INT,
   weapon_name VARCHAR(50),
   is_craftable BOOLEAN,
   range_tool INT,
   angle INT,
   farmableDamage INT,
   attackDamage INT,
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

CREATE TABLE dropTypeFarm(
   id_ressource INT,
   id_farmable INT,
   PRIMARY KEY(id_ressource, id_farmable),
   FOREIGN KEY(id_ressource) REFERENCES Ressources(id_ressource),
   FOREIGN KEY(id_farmable) REFERENCES Farmables(id_farmable)
);

CREATE TABLE dropTypeMobs(
   id_ressource INT,
   id_ennemies INT,
   PRIMARY KEY(id_ressource, id_ennemies),
   FOREIGN KEY(id_ressource) REFERENCES Ressources(id_ressource),
   FOREIGN KEY(id_ennemies) REFERENCES Ennemies(id_ennemies)
);
