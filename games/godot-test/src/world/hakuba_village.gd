extends Node2D

const TILE_SIZE = 16

# TileSet source IDs:
const SRC_SKI = 0
const SRC_TOWN = 1

# Ground / Terrain Atlas Coordinates (Vector2i(col, row) in packed tilemaps)
const TILE_SNOW = Vector2i(0, 0)        # Ski: tile_0000 (Plain snow)
const TILE_SNOW_PATH = Vector2i(1, 1)   # Ski: tile_0013 (Snow trail)
const TILE_STONE_PATH = Vector2i(1, 0)  # Town: tile_0001 (Cobblestone path)
const TILE_WATER = Vector2i(3, 1)       # Town: tile_0015 (Hot spring water)

# Structure / Nature Atlas Coordinates
const TILE_ROOF_L = Vector2i(0, 2)      # Town: tile_0024
const TILE_ROOF_M = Vector2i(1, 2)      # Town: tile_0025
const TILE_ROOF_R = Vector2i(2, 2)      # Town: tile_0026
const TILE_WALL_L = Vector2i(0, 3)      # Town: tile_0036
const TILE_WALL_DOOR = Vector2i(1, 3)   # Town: tile_0037
const TILE_WALL_R = Vector2i(2, 3)      # Town: tile_0038
const TILE_PINE_SNOW = Vector2i(1, 3)   # Ski: tile_0037
const TILE_PINE_GREEN = Vector2i(0, 4)  # Town: tile_0048
const TILE_FENCE = Vector2i(0, 5)       # Town: tile_0060

# Scenes
var item_scene = preload("res://src/entities/item.tscn")
var friendly_npc_scene = preload("res://src/entities/npc_friendly.tscn")
var enemy_npc_scene = preload("res://src/entities/npc_enemy.tscn")

# Specific item textures
var apple_tex = preload("res://assets/sprites/item_apple.png")
var skipass_tex = preload("res://assets/sprites/item_skipass.png")
var tea_tex = preload("res://assets/sprites/item_tea.png")
var charm_tex = preload("res://assets/sprites/item_charm.png")

# Specific NPC textures
var elder_tex = preload("res://assets/sprites/npc_elder.png")
var guide_tex = preload("res://assets/sprites/npc_guide.png")

# Enemy Sprites (Snowman for monkey, 3-frame Yeti for boar)
var snowman_tex = preload("res://assets/sprites/enemy_snow_monkey.png")
var yeti_0 = preload("res://assets/sprites/enemy_yeti_0.png")
var yeti_1 = preload("res://assets/sprites/enemy_yeti_1.png")
var yeti_2 = preload("res://assets/sprites/enemy_yeti_2.png")

@onready var ground_layer: TileMapLayer = $GroundLayer
@onready var structures_layer: TileMapLayer = $StructuresLayer
@onready var obstacles_container: Node2D = $Obstacles
@onready var items_container: Node2D = $Items
@onready var npcs_container: Node2D = $NPCs
@onready var player: CharacterBody2D = $Player

const MAP_W = 48
const MAP_H = 36

func _ready() -> void:
	_build_terrain()
	_build_village_structures()
	_spawn_items()
	_spawn_npcs()
	
	# Place player in village square
	player.position = Vector2(24 * TILE_SIZE, 20 * TILE_SIZE)

func _build_terrain() -> void:
	for y in range(MAP_H):
		for x in range(MAP_W):
			var cell = Vector2i(x, y)
			
			# Terrain zoning:
			# North-West (Onsen hot springs)
			if x >= 8 and x <= 14 and y >= 6 and y <= 10:
				if x == 8 or x == 14 or y == 6 or y == 10:
					ground_layer.set_cell(cell, SRC_TOWN, TILE_STONE_PATH)
				else:
					ground_layer.set_cell(cell, SRC_TOWN, TILE_WATER)
			# Village paths (Crossroads)
			elif (x >= 22 and x <= 26) or (y >= 18 and y <= 21):
				ground_layer.set_cell(cell, SRC_TOWN, TILE_STONE_PATH)
			# Ski trail to the South
			elif y >= 26 and x >= 18 and x <= 30:
				ground_layer.set_cell(cell, SRC_SKI, TILE_SNOW_PATH)
			# Default Hakuba winter terrain
			else:
				if (x + y) % 5 == 0:
					ground_layer.set_cell(cell, SRC_SKI, TILE_SNOW_PATH)
				else:
					ground_layer.set_cell(cell, SRC_SKI, TILE_SNOW)

func _build_village_structures() -> void:
	# 1. Elder's Lodge (Center-North: x=21..27, y=11..13)
	_create_building(Vector2i(21, 11), 6, 3, "Elder Kenzo's Residence")
	
	# 2. Hakuba Ski Lodge (South-East: x=32..37, y=24..26)
	_create_building(Vector2i(32, 24), 5, 3, "Hakuba Ski Rental & Lodge")
	
	# 3. Traditional Tea House (West: x=4..8, y=18..20)
	_create_building(Vector2i(4, 18), 5, 3, "Mountain Tea Pavilion")

	# World Boundary Collision Walls
	_create_boundary_walls()

	# Pine Trees Forest in East & North
	_create_trees()

	# Onsen Bath Perimeter Obstacles
	_create_water_collision(Rect2(9 * TILE_SIZE, 7 * TILE_SIZE, 5 * TILE_SIZE, 3 * TILE_SIZE))

func _create_building(grid_pos: Vector2i, width_tiles: int, height_tiles: int, _name: String) -> void:
	# Visual tiles painted onto StructuresLayer
	for h in range(height_tiles):
		for w in range(width_tiles):
			var cell = grid_pos + Vector2i(w, h)
			if h == 0:
				var tile = TILE_ROOF_L if w == 0 else (TILE_ROOF_R if w == width_tiles - 1 else TILE_ROOF_M)
				structures_layer.set_cell(cell, SRC_TOWN, tile)
			elif h == height_tiles - 1:
				var tile = TILE_WALL_DOOR if w == int(width_tiles / 2) else (TILE_WALL_L if w == 0 else TILE_WALL_R)
				structures_layer.set_cell(cell, SRC_TOWN, tile)
			else:
				var tile = TILE_WALL_L if w == 0 else TILE_WALL_R
				structures_layer.set_cell(cell, SRC_TOWN, tile)
	
	# Static Collision body for building
	var top_left = Vector2(grid_pos * TILE_SIZE)
	var body = StaticBody2D.new()
	body.collision_layer = 1
	body.collision_mask = 2
	var shape = CollisionShape2D.new()
	var box = RectangleShape2D.new()
	box.size = Vector2(width_tiles * TILE_SIZE, height_tiles * TILE_SIZE - 4)
	shape.shape = box
	shape.position = top_left + Vector2((width_tiles * TILE_SIZE) / 2.0, ((height_tiles * TILE_SIZE) / 2.0) + 2)
	body.add_child(shape)
	obstacles_container.add_child(body)

func _create_water_collision(rect: Rect2) -> void:
	var body = StaticBody2D.new()
	body.collision_layer = 1
	body.collision_mask = 2
	var shape = CollisionShape2D.new()
	var box = RectangleShape2D.new()
	box.size = rect.size
	shape.shape = box
	shape.position = rect.position + rect.size / 2.0
	body.add_child(shape)
	obstacles_container.add_child(body)

func _create_trees() -> void:
	var tree_coords = [
		# Eastern Pine Forest
		Vector2i(38, 5), Vector2i(40, 7), Vector2i(42, 6), Vector2i(44, 9),
		Vector2i(39, 12), Vector2i(42, 14), Vector2i(45, 13), Vector2i(40, 18),
		Vector2i(43, 20), Vector2i(41, 24), Vector2i(44, 26), Vector2i(39, 29),
		# North Alpine Trees
		Vector2i(3, 3), Vector2i(6, 4), Vector2i(16, 4), Vector2i(19, 3),
		Vector2i(29, 3), Vector2i(32, 4), Vector2i(35, 3),
		# South Mountain Trees
		Vector2i(4, 28), Vector2i(7, 30), Vector2i(12, 32), Vector2i(15, 30)
	]
	
	for coord in tree_coords:
		var source = SRC_SKI if coord.y < 20 else SRC_TOWN
		var tile = TILE_PINE_SNOW if coord.y < 20 else TILE_PINE_GREEN
		structures_layer.set_cell(coord, source, tile)
		
		# Collision circle at base of tree
		var body = StaticBody2D.new()
		body.collision_layer = 1
		body.collision_mask = 2
		var shape = CollisionShape2D.new()
		var circle = CircleShape2D.new()
		circle.radius = 5.0
		shape.shape = circle
		shape.position = Vector2(coord * TILE_SIZE) + Vector2(8, 12)
		body.add_child(shape)
		obstacles_container.add_child(body)

func _create_boundary_walls() -> void:
	var thickness = 16.0
	var map_px_w = MAP_W * TILE_SIZE
	var map_px_h = MAP_H * TILE_SIZE
	
	var borders = [
		Rect2(-thickness/2, map_px_h/2, thickness, map_px_h), # Left
		Rect2(map_px_w + thickness/2, map_px_h/2, thickness, map_px_h), # Right
		Rect2(map_px_w/2, -thickness/2, map_px_w, thickness), # Top
		Rect2(map_px_w/2, map_px_h + thickness/2, map_px_w, thickness) # Bottom
	]
	
	for r in borders:
		var body = StaticBody2D.new()
		body.collision_layer = 1
		body.collision_mask = 2
		var shape = CollisionShape2D.new()
		var box = RectangleShape2D.new()
		box.size = r.size
		shape.shape = box
		shape.position = r.position
		body.add_child(shape)
		obstacles_container.add_child(body)

func _spawn_items() -> void:
	var items_data = [
		{ "name": "Nagano Apple", "icon": apple_tex, "pos": Vector2(16, 17) * TILE_SIZE },
		{ "name": "Nagano Apple", "icon": apple_tex, "pos": Vector2(28, 17) * TILE_SIZE },
		{ "name": "Ski Pass", "icon": skipass_tex, "pos": Vector2(30, 27) * TILE_SIZE },
		{ "name": "Onsen Tea", "icon": tea_tex, "pos": Vector2(7, 12) * TILE_SIZE },
		{ "name": "Lucky Charm", "icon": charm_tex, "pos": Vector2(11, 4) * TILE_SIZE }
	]
	
	for data in items_data:
		var item = item_scene.instantiate()
		item.item_name = data["name"]
		item.item_icon = data["icon"]
		item.position = data["pos"]
		items_container.add_child(item)

func _spawn_npcs() -> void:
	# 1. Friendly: Elder Kenzo (Near village center)
	var elder = friendly_npc_scene.instantiate()
	elder.npc_name = "Elder Kenzo"
	elder.npc_role = "Village Elder"
	elder.dialogue_text = "Konnichiwa! Welcome to Hakuba village. Our snow is celebrated across the world. Feel free to explore, but beware of mischievous snowmen and forest yetis!"
	elder.npc_sprite = elder_tex
	elder.position = Vector2(24 * TILE_SIZE, 15 * TILE_SIZE)
	npcs_container.add_child(elder)

	# 2. Friendly: Ski Guide Yuki (Near Southern Trail)
	var guide = friendly_npc_scene.instantiate()
	guide.npc_name = "Yuki"
	guide.npc_role = "Ski Instructor"
	guide.dialogue_text = "Hey there! The powder snow today is amazing! Grab a Ski Pass if you find one and check out the southern slopes. Hold SHIFT if you want to sprint!"
	guide.npc_sprite = guide_tex
	guide.position = Vector2(28 * TILE_SIZE, 23 * TILE_SIZE)
	npcs_container.add_child(guide)

	# 3. Enemy: Wild Snowman (Near Onsen / North)
	var monkey = enemy_npc_scene.instantiate()
	monkey.enemy_name = "Wild Snowman"
	monkey.enemy_sprite = snowman_tex
	monkey.patrol_distance = 36.0
	monkey.patrol_speed = 20.0
	monkey.position = Vector2(12 * TILE_SIZE, 12 * TILE_SIZE)
	npcs_container.add_child(monkey)

	# 4. Enemy: Mountain Forest Yeti (Animated 3-frames in Eastern Forest)
	var boar = enemy_npc_scene.instantiate()
	boar.enemy_name = "Mountain Forest Yeti"
	boar.enemy_sprite = yeti_0
	boar.animation_frames = [yeti_0, yeti_1, yeti_2]
	boar.animation_fps = 5.0
	boar.patrol_distance = 45.0
	boar.patrol_speed = 24.0
	boar.position = Vector2(38 * TILE_SIZE, 16 * TILE_SIZE)
	npcs_container.add_child(boar)
