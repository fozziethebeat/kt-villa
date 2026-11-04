extends Node2D

const TILE_SIZE = 16

# TileSet source IDs:
const SRC_SKI = 0
const SRC_TOWN = 1

# Ground / Terrain Atlas Coordinates (Vector2i(col, row) in packed tilemaps)
const TILE_SNOW = Vector2i(0, 0)        # Ski: tile_0000 (Plain snow)
const TILE_SNOW_PATH = Vector2i(1, 1)   # Ski: tile_0013 (Snow trail)
const TILE_GRASS = Vector2i(0, 0)       # Town: tile_0000 (Green grass)
const TILE_GRASS_ALT = Vector2i(2, 0)   # Town: tile_0002 (Wildflower/textured grass)
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
var battle_scene = preload("res://src/battle/battle_scene.tscn")

# Specific item textures
var apple_tex = preload("res://assets/sprites/item_apple.png")
var skipass_tex = preload("res://assets/sprites/item_skipass.png")
var tea_tex = preload("res://assets/sprites/item_tea.png")
var charm_tex = preload("res://assets/sprites/item_charm.png")

# Specific NPC textures
var elder_tex = preload("res://assets/sprites/npc_elder.png")
var guide_tex = preload("res://assets/sprites/npc_guide.png")

# Enemy Sprites (Snow monkey, 3-frame Yeti, Boar, Wolf)
var snowman_tex = preload("res://assets/sprites/enemy_snow_monkey.png")
var yeti_0 = preload("res://assets/sprites/enemy_yeti_0.png")
var yeti_1 = preload("res://assets/sprites/enemy_yeti_1.png")
var yeti_2 = preload("res://assets/sprites/enemy_yeti_2.png")
var boar_tex = preload("res://assets/sprites/enemy_boar.png")
var wolf_tex = preload("res://assets/sprites/enemy_wolf.png")

@onready var ground_layer: TileMapLayer = $GroundLayer
@onready var structures_layer: TileMapLayer = $StructuresLayer
@onready var obstacles_container: Node2D = $Obstacles
@onready var items_container: Node2D = $Items
@onready var npcs_container: Node2D = $NPCs
@onready var player: CharacterBody2D = $Player

const MAP_W = 48
const MAP_H = 36

func _ready() -> void:
	AssetRegistry.assets_reloaded.connect(_rebuild_world)
	GameManager.season_changed.connect(func(_new_season): _rebuild_season_visuals())
	_rebuild_world()
	
	# Restore player position from before encounter if available
	if GameManager.player_world_position != Vector2.ZERO:
		player.position = GameManager.player_world_position
	else:
		player.position = Vector2(24 * TILE_SIZE, 20 * TILE_SIZE)

func _rebuild_world() -> void:
	for child in obstacles_container.get_children():
		child.queue_free()
	_build_terrain()
	_build_village_structures()
	_spawn_items()
	_spawn_npcs()

func _rebuild_season_visuals() -> void:
	_build_terrain()
	_update_seasonal_trees()

func _set_tile(layer: TileMapLayer, cell: Vector2i, key: String, fallback_source: int, fallback_coords: Vector2i) -> void:
	var src = AssetRegistry.get_tile_source(key, fallback_source)
	var coords = AssetRegistry.get_tile_coords(key, fallback_coords)
	layer.set_cell(cell, src, coords)

func _build_terrain() -> void:
	var is_green = (GameManager.current_season == "green")
	for y in range(MAP_H):
		for x in range(MAP_W):
			var cell = Vector2i(x, y)
			
			# Terrain zoning:
			# North-West (Onsen hot springs)
			if x >= 8 and x <= 14 and y >= 6 and y <= 10:
				if x == 8 or x == 14 or y == 6 or y == 10:
					_set_tile(ground_layer, cell, "stone_path", SRC_TOWN, TILE_STONE_PATH)
				else:
					_set_tile(ground_layer, cell, "water", SRC_TOWN, TILE_WATER)
			# Village paths (Crossroads)
			elif (x >= 22 and x <= 26) or (y >= 18 and y <= 21):
				_set_tile(ground_layer, cell, "stone_path", SRC_TOWN, TILE_STONE_PATH)
			# Southern Slope / Trail
			elif y >= 26 and x >= 18 and x <= 30:
				if is_green:
					ground_layer.set_cell(cell, SRC_TOWN, TILE_GRASS_ALT)
				else:
					_set_tile(ground_layer, cell, "snow_path", SRC_SKI, TILE_SNOW_PATH)
			# Default Hakuba seasonal terrain
			else:
				if is_green:
					if (x + y) % 5 == 0:
						ground_layer.set_cell(cell, SRC_TOWN, TILE_GRASS_ALT)
					else:
						ground_layer.set_cell(cell, SRC_TOWN, TILE_GRASS)
				else:
					if (x + y) % 5 == 0:
						_set_tile(ground_layer, cell, "snow_path", SRC_SKI, TILE_SNOW_PATH)
					else:
						_set_tile(ground_layer, cell, "snow", SRC_SKI, TILE_SNOW)

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
				if w == 0:
					_set_tile(structures_layer, cell, "roof_l", SRC_TOWN, TILE_ROOF_L)
				elif w == width_tiles - 1:
					_set_tile(structures_layer, cell, "roof_r", SRC_TOWN, TILE_ROOF_R)
				else:
					_set_tile(structures_layer, cell, "roof_m", SRC_TOWN, TILE_ROOF_M)
			elif h == height_tiles - 1:
				if w == int(width_tiles / 2.0):
					_set_tile(structures_layer, cell, "wall_door", SRC_TOWN, TILE_WALL_DOOR)
				elif w == 0:
					_set_tile(structures_layer, cell, "wall_l", SRC_TOWN, TILE_WALL_L)
				else:
					_set_tile(structures_layer, cell, "wall_r", SRC_TOWN, TILE_WALL_R)
			else:
				if w == 0:
					_set_tile(structures_layer, cell, "wall_l", SRC_TOWN, TILE_WALL_L)
				else:
					_set_tile(structures_layer, cell, "wall_r", SRC_TOWN, TILE_WALL_R)
	
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

const TREE_COORDS: Array[Vector2i] = [
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

func _update_seasonal_trees() -> void:
	var is_green = (GameManager.current_season == "green")
	for coord in TREE_COORDS:
		if is_green:
			_set_tile(structures_layer, coord, "pine_green", SRC_TOWN, TILE_PINE_GREEN)
		else:
			if coord.y < 20:
				_set_tile(structures_layer, coord, "pine_snow", SRC_SKI, TILE_PINE_SNOW)
			else:
				_set_tile(structures_layer, coord, "pine_green", SRC_TOWN, TILE_PINE_GREEN)

func _create_trees() -> void:
	_update_seasonal_trees()
	for coord in TREE_COORDS:
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
		Rect2(-thickness/2.0, map_px_h/2.0, thickness, map_px_h), # Left
		Rect2(map_px_w + thickness/2.0, map_px_h/2.0, thickness, map_px_h), # Right
		Rect2(map_px_w/2.0, -thickness/2.0, map_px_w, thickness), # Top
		Rect2(map_px_w/2.0, map_px_h + thickness/2.0, map_px_w, thickness) # Bottom
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

func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventKey and event.pressed and not event.echo:
		if event.keycode == KEY_R or event.keycode == KEY_F5:
			print("[HakubaVillage] Reloading AssetRegistry from tools/sprite_usage.json...")
			AssetRegistry.reload()
		elif event.keycode == KEY_T:
			GameManager.toggle_season()

func _spawn_items() -> void:
	for child in items_container.get_children():
		child.queue_free()

	var items_data = [
		{ "name": "Nagano Apple", "key": "apple", "fallback": apple_tex, "pos": Vector2(16, 17) * TILE_SIZE },
		{ "name": "Nagano Apple", "key": "apple", "fallback": apple_tex, "pos": Vector2(28, 17) * TILE_SIZE },
		{ "name": "Ski Pass", "key": "skipass", "fallback": skipass_tex, "pos": Vector2(30, 27) * TILE_SIZE },
		{ "name": "Onsen Tea", "key": "tea", "fallback": tea_tex, "pos": Vector2(7, 12) * TILE_SIZE },
		{ "name": "Lucky Charm", "key": "charm", "fallback": charm_tex, "pos": Vector2(11, 4) * TILE_SIZE }
	]
	
	for data in items_data:
		var item = item_scene.instantiate()
		item.item_name = data["name"]
		var tex = AssetRegistry.get_item_texture(data["key"])
		item.item_icon = tex if tex else data["fallback"]
		item.position = data["pos"]
		items_container.add_child(item)

func _spawn_npcs() -> void:
	for child in npcs_container.get_children():
		child.queue_free()
	# 1. Friendly: Elder Kenzo (Near village center)
	var elder = friendly_npc_scene.instantiate()
	elder.npc_name = "Elder Kenzo"
	elder.npc_role = "Village Elder"
	elder.dialogue_text = "Konnichiwa! Welcome to Hakuba village. Our snow is celebrated across the world. Feel free to explore, but beware of mischievous snowmen and forest yetis!"
	var elder_reg = AssetRegistry.get_entity_preview("elder_kenzo")
	elder.npc_sprite = elder_reg if elder_reg else elder_tex
	elder.position = Vector2(24 * TILE_SIZE, 15 * TILE_SIZE)
	npcs_container.add_child(elder)

	# 2. Friendly: Ski Guide Yuki (Near Southern Trail)
	var guide = friendly_npc_scene.instantiate()
	guide.npc_name = "Yuki"
	guide.npc_role = "Ski Instructor"
	guide.dialogue_text = "Hey there! The powder snow today is amazing! Grab a Ski Pass if you find one and check out the southern slopes. Hold SHIFT if you want to sprint!"
	var guide_reg = AssetRegistry.get_entity_preview("guide_yuki")
	guide.npc_sprite = guide_reg if guide_reg else guide_tex
	guide.position = Vector2(28 * TILE_SIZE, 23 * TILE_SIZE)
	npcs_container.add_child(guide)

	# 3. Enemy: Wild Snow Monkey (Near Onsen / North)
	var monkey = enemy_npc_scene.instantiate()
	monkey.enemy_name = "Wild Snow Monkey"
	monkey.enemy_id = "wild_snowman"
	monkey.enemy_uid = "monkey_onsen"
	var snow_reg = AssetRegistry.get_entity_preview("wild_snowman")
	monkey.enemy_sprite = snow_reg if snow_reg else snowman_tex
	monkey.patrol_distance = 36.0
	monkey.patrol_speed = 20.0
	monkey.position = Vector2(12 * TILE_SIZE, 12 * TILE_SIZE)
	npcs_container.add_child(monkey)

	# 4. Enemy: Mountain Forest Yeti (Animated 3-frames in Eastern Forest)
	var yeti = enemy_npc_scene.instantiate()
	yeti.enemy_name = "Mountain Forest Yeti"
	yeti.enemy_id = "forest_yeti"
	yeti.enemy_uid = "yeti_forest"
	var yeti_frames_reg = AssetRegistry.get_entity_frames("forest_yeti")
	var yeti_anim = yeti_frames_reg if yeti_frames_reg.size() > 0 else [yeti_0, yeti_1, yeti_2]
	yeti.enemy_sprite = yeti_anim[0]
	yeti.animation_frames = yeti_anim
	yeti.animation_fps = AssetRegistry.get_entity_fps("forest_yeti", 5.0)
	yeti.patrol_distance = 45.0
	yeti.patrol_speed = 22.0
	yeti.position = Vector2(38 * TILE_SIZE, 16 * TILE_SIZE)
	npcs_container.add_child(yeti)

	# 5. Enemy: Wild Mountain Boar (Southern Ski slope edge)
	var boar = enemy_npc_scene.instantiate()
	boar.enemy_name = "Wild Mountain Boar"
	boar.enemy_id = "wild_boar"
	boar.enemy_uid = "boar_slopes"
	boar.enemy_sprite = boar_tex
	boar.patrol_distance = 40.0
	boar.patrol_speed = 26.0
	boar.position = Vector2(16 * TILE_SIZE, 27 * TILE_SIZE)
	npcs_container.add_child(boar)

	# 6. Enemy: Hakuba Snow Wolf (Northwest hot spring woods)
	var wolf = enemy_npc_scene.instantiate()
	wolf.enemy_name = "Hakuba Snow Wolf"
	wolf.enemy_id = "snow_wolf"
	wolf.enemy_uid = "wolf_woods"
	wolf.enemy_sprite = wolf_tex
	wolf.patrol_distance = 35.0
	wolf.patrol_speed = 24.0
	wolf.position = Vector2(6 * TILE_SIZE, 7 * TILE_SIZE)
	npcs_container.add_child(wolf)

