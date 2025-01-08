-- Serveurs
INSERT INTO Servers (id_server, server_name)
VALUES
(1, 'EU');

-- Cartes
INSERT INTO Maps (id_map, map_name)
VALUES
(1, 'Infernal Abyss'),


-- Ressources
INSERT INTO Ressources (id_ressource, ressource_name, category, value_food)
VALUES


-- Farmables
INSERT INTO Farmables (id_farmable, type, health_point, id_ressource)
VALUES


-- Ennemis
INSERT INTO Ennemies (id_ennemies, name, health_points, type, behavior, attackRange, searchRange, actionDelay, id_ressource)
VALUES
(1, 'Boss', 50, 'Boss', 'Aggressive',  250, 400,  4000, NULL),

-- Crafts
INSERT INTO Crafts (id_craft, craft_name)
VALUES


-- Armures
INSERT INTO Armour (id_armour, armour_name, is_craftable, effect, resistance, id_craft)
VALUES


-- Armes et outils
INSERT INTO WeaponsTools (id_weapon, weapon_name, is_craftable, range_tool, angle, farmableDamage, attackDamage, id_craft)
VALUES


-- Shop
INSERT INTO Shop (id_item, item_name)
VALUES


-- CraftRessources
INSERT INTO CraftRessources (id_ressource, id_craft, id_craft_1, quantity_needed)
VALUES
