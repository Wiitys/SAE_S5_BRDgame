-- Serveurs
INSERT INTO Servers (id_server, name_server)
VALUES
(1, 'EU');

-- Cartes
INSERT INTO Maps (id_map, name_map)
VALUES
(1, 'Infernal Abyss');

-- Ressources
INSERT INTO Ressources (id_ressource, name_ressource, category, value_food)
VALUES
(1, 'wood', 'Ressource', 0),
(2, 'stone', 'Ressource', 0),
(3, 'iron', 'Ressource', 0),
(4, 'meat', 'Food', 20),
(5, 'stick', 'Ressource', 0),
(6, 'plank', 'Ressource', 0),
(7, 'gold', 'Ressource', 0),
(8, 'apple', 'Food', 5),
(9, 'ironIngot', 'Ressource', 0),
(10, 'goldIngot', 'Ressource', 0),
(11, 'goldenApple', 'Food', 45);

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
INSERT INTO Ennemies (id_ennemy, name_ennemy, health_points, type, behavior, attackRange, searchRange, actionDelay, id_ressource)
VALUES
(1, 'Boss', 200, 'Boss', 'Aggressive',  250, 400,  4000, NULL);

-- Crafts
INSERT INTO Crafts (id_craft, name_craft, quantity_out)
VALUES
(1, 'stick', 2),
(2, 'plank', 4),
(3, 'ironIngot', 1),
(4, 'woodenAxe', 1),
(5, 'woodenPickaxe', 1),
(6, 'stonePickaxe', 1),
(7, 'stoneAxe', 1),
(8, 'ironSword', 1),
(9, 'ironAxe', 1),
(10, 'ironPickaxe', 1),
(11, 'goldIngot', 1),
(12, 'goldenApple', 1),
(13, 'goldOrnateSword', 1),
(14, 'clothTorso', 1);

-- Armes et outils
INSERT INTO Tools (id_tool, name_tool, is_craftable, range_tool, angle, farmableDamage, attackDamage, id_craft)
VALUES
(1, 'woodenAxe', TRUE, 30, 60, 2, 2, 4),
(2, 'woodenPickaxe', TRUE, 60, 20, 3, 2, 5),
(3, 'stonePickaxe', TRUE, 45, 90, 4, 3, 6),
(4, 'stoneAxe', TRUE, 70, 90, 4, 3, 7),
(5, 'ironSword', TRUE, 90, 70, 0, 10, 8),
(6, 'ironAxe', TRUE, 70, 90, 8, 5, 9),
(7, 'ironPickaxe', TRUE, 45, 90, 8, 5, 10),
(8, 'goldOrnateSword', TRUE, 90, 70, 0, 15, 13);

-- Armures
INSERT INTO Armour (id_armour, name_armour, is_craftable, effect, resistance, id_craft)
VALUES
(1, 'clothTorso', TRUE, '', 10, 14);

-- CraftRessources
INSERT INTO CraftRessources (id_ressource, id_craft, quantity_needed)
VALUES
(1, 1, 1),
(1, 2, 2),
(3, 3, 2),
(7, 11, 2),
(10, 12, 1),
(8, 12, 1),
(9, 8, 2),
(5, 8, 1),
(9, 10, 3),
(5, 10, 2),
(10, 13, 3);

-- CraftToolWithTool
INSERT INTO CraftToolWithTool (id_craft, id_tool, quantity_needed)
VALUES
(13, 5, 1);
