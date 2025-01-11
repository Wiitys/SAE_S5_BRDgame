-- Serveurs
INSERT INTO Servers (id_server, server_name)
VALUES
(1, 'EU');

-- Cartes
INSERT INTO Maps (id_map, map_name)
VALUES
(1, 'Infernal Abyss');


-- Ressources
INSERT INTO Ressources (id_ressource, ressource_name, category, value_food)
VALUES
(1, 'wood', 'Ressource', 0),
(2, 'stone', 'Ressource', 0),
(3, 'iron', 'Ressource', 0),
(4, 'meat', 'Food', 20),
(5, 'stick', 'Ressource', 0),
(6, 'plank', 'Ressource', 0),
(7, 'gold', 'Ressource', 0),
(8, 'apple', 'Food', 5);


-- Farmable
INSERT INTO Farmables (id_farmable, type, health_points)
VALUES
(1, 'tree', 10),
(2, 'rock', 10),
(3, 'ironOre', 10),
(4, 'goldOre', 10);


-- dropTypeFarm
INSERT INTO dropTypeFarm (id_ressource, id_farmable)
VALUES
(1, 1),  -- wood for tree
(2, 2),  -- stone for rock
(3, 3),  -- iron for ironOre
(7, 4),  -- gold for goldOre
(5, 1),  -- stick for tree
(8, 1);  -- apple for tree


-- Ennemis
INSERT INTO Ennemies (id_ennemies, name, health_points, type, behavior, attackRange, searchRange, actionDelay, id_ressource)
VALUES
(1, 'Boss', 50, 'Boss', 'Aggressive',  250, 400,  4000, NULL);

-- Crafts
INSERT INTO Crafts (id_craft, craft_name)
VALUES
(1, 'stick'),
(2, 'plank'),
(3, 'ironIngot'),
(4, 'woodenAxe'),
(5, 'woodenPickaxe'),
(6, 'stonePickaxe'),
(7, 'stoneAxe'),
(8, 'ironSword'),
(9, 'ironAxe'),
(10, 'ironPickaxe');

-- Armes et outils
INSERT INTO WeaponsTools (id_weapon, weapon_name, is_craftable, range_tool, angle, farmableDamage, attackDamage, id_craft)
VALUES
(1, 'woodenAxe', TRUE, 30, 60, 2, 2, 4),
(2, 'woodenPickaxe', TRUE, 60, 20, 3, 2, 5),
(3, 'stonePickaxe', TRUE, 45, 90, 4, 3, 6),
(4, 'stoneAxe', TRUE, 70, 90, 4, 3, 7),
(5, 'ironSword', TRUE, 90, 70, 0, 10, 8),
(6, 'ironAxe', TRUE, 70, 90, 8, 5, 9),
(7, 'ironPickaxe', TRUE, 45, 90, 8, 5, 10);


-- CraftRessources
INSERT INTO CraftRessources (id_ressource, id_craft, quantity_out, quantity_needed)
VALUES
(1, 1, 2, 1),
(1, 2, 4, 2),
(3, 3, 1, 2);