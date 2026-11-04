extends Node2D

## Cozy Storybook Illustrated 2.5D Hakuba Village Scene (1280x720)
## Replaces the legacy Kenney 16x16 tilemap with a full-resolution painted 2.5D diorama
## supporting Winter ("Japow") and Green Season transitions, Y-sorted 2.5D architectural props,
## Village NPCs, and Spirit-Animal Enemies ("Villagers Gone Wild").

const WORLD_W = 1280.0
const WORLD_H = 720.0

# Seasonal 2.5D Diorama Backdrops
var winter_bg_tex: Texture2D
var green_bg_tex: Texture2D

# 2.5D Storybook Architectural Props
var lodge_prop_tex: Texture2D
var kiosk_prop_tex: Texture2D
var shrine_prop_tex: Texture2D

# Entity Scenes
var item_scene = preload("res://src/entities/item.tscn")
var friendly_npc_scene = preload("res://src/entities/npc_friendly.tscn")
var enemy_npc_scene = preload("res://src/entities/npc_enemy.tscn")

# Collectible Item Icons
var apple_tex = preload("res://assets/sprites/item_apple.png")
var skipass_tex = preload("res://assets/sprites/item_skipass.png")
var tea_tex = preload("res://assets/sprites/item_tea.png")
var charm_tex = preload("res://assets/sprites/item_charm.png")

# Storybook NPCs & Spirit Beast Sprites
var elder_tex: Texture2D
var yuki_tex: Texture2D
var monkey_tex: Texture2D
var serow_tex: Texture2D
var bear_tex: Texture2D

@onready var backdrop_sprite: Sprite2D = $BackdropSprite
@onready var obstacles_container: Node2D = $Obstacles
@onready var items_container: Node2D = $Items
@onready var props_container: Node2D = $YSortStage/Props
@onready var npcs_container: Node2D = $YSortStage/NPCs
@onready var player: CharacterBody2D = $YSortStage/Player
@onready var snow_particles: CPUParticles2D = $SnowParticles

func _ready() -> void:
	winter_bg_tex = GameManager.load_png_texture("res://assets/storybook/world/village_winter_bg.png")
	green_bg_tex = GameManager.load_png_texture("res://assets/storybook/world/village_green_bg.png")
	lodge_prop_tex = GameManager.load_png_texture("res://assets/storybook/props/prop_kominka_lodge.png")
	kiosk_prop_tex = GameManager.load_png_texture("res://assets/storybook/props/prop_tea_kiosk.png")
	shrine_prop_tex = GameManager.load_png_texture("res://assets/storybook/props/prop_shrine_cedars.png")
	elder_tex = GameManager.load_png_texture("res://assets/storybook/entities/npc_elder_kenzo.png")
	yuki_tex = GameManager.load_png_texture("res://assets/storybook/entities/npc_ski_yuki.png")
	monkey_tex = GameManager.load_png_texture("res://assets/storybook/entities/enemy_snow_monkey.png")
	serow_tex = GameManager.load_png_texture("res://assets/storybook/entities/enemy_sacred_serow.png")
	bear_tex = GameManager.load_png_texture("res://assets/storybook/entities/enemy_moon_bear.png")

	GameManager.season_changed.connect(func(_new_season): _apply_season_visuals())
	_rebuild_world()
	_apply_season_visuals()

	# Restore player position from before encounter if available
	if GameManager.player_world_position != Vector2.ZERO:
		player.position = GameManager.player_world_position
	else:
		player.position = Vector2(640, 545)

func _apply_season_visuals() -> void:
	var is_green = (GameManager.current_season == "green")
	if backdrop_sprite:
		backdrop_sprite.texture = green_bg_tex if is_green else winter_bg_tex
		backdrop_sprite.texture_filter = CanvasItem.TEXTURE_FILTER_LINEAR
	if snow_particles:
		snow_particles.emitting = not is_green

func _rebuild_world() -> void:
	for child in obstacles_container.get_children():
		child.queue_free()
	for child in props_container.get_children():
		child.queue_free()

	_create_diorama_boundaries()
	_spawn_storybook_props()
	_spawn_items()
	_spawn_npcs()

func _create_diorama_boundaries() -> void:
	# 1. Horizon mountain line (keep player on the 2.5D village courtyard below y=335)
	_add_rect_obstacle(Rect2(0, 0, WORLD_W, 335))
	# 2. Screen perimeter walls
	_add_rect_obstacle(Rect2(-20, 0, 25, WORLD_H))
	_add_rect_obstacle(Rect2(WORLD_W - 5, 0, 25, WORLD_H))
	_add_rect_obstacle(Rect2(0, WORLD_H - 12, WORLD_W, 30))
	# 3. Upper-Left Steaming Onsen Pool water boundary
	_add_rect_obstacle(Rect2(130, 320, 310, 125))
	# 4. Left & Right painted foreground house footprints
	_add_rect_obstacle(Rect2(0, 480, 175, 190))
	_add_rect_obstacle(Rect2(1075, 450, 205, 250))

func _add_rect_obstacle(rect: Rect2) -> void:
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

func _spawn_storybook_props() -> void:
	# Place interactive 2.5D Y-sorted Storybook landmarks that the player can walk in front of and behind!
	_add_prop_landmark(kiosk_prop_tex, Vector2(560, 385), 145.0, Vector2(95, 36))
	_add_prop_landmark(shrine_prop_tex, Vector2(935, 420), 175.0, Vector2(90, 34))

func _add_prop_landmark(tex: Texture2D, base_pos: Vector2, target_h: float, footprint: Vector2) -> void:
	var prop_body = StaticBody2D.new()
	prop_body.position = base_pos
	prop_body.collision_layer = 1
	prop_body.collision_mask = 2

	var spr = Sprite2D.new()
	spr.texture = tex
	spr.texture_filter = CanvasItem.TEXTURE_FILTER_LINEAR_WITH_MIPMAPS
	var s = target_h / max(1.0, float(tex.get_height()))
	spr.scale = Vector2(s, s)
	spr.position = Vector2(0, -target_h * 0.45)
	prop_body.add_child(spr)

	var shape = CollisionShape2D.new()
	var box = RectangleShape2D.new()
	box.size = footprint
	shape.shape = box
	shape.position = Vector2(0, -8)
	prop_body.add_child(shape)

	props_container.add_child(prop_body)

func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventKey and event.pressed and not event.echo:
		if event.keycode == KEY_T:
			GameManager.toggle_season()

func _spawn_items() -> void:
	for child in items_container.get_children():
		child.queue_free()

	var items_data = [
		{ "name": "Nagano Apple", "key": "apple", "fallback": apple_tex, "pos": Vector2(440, 560) },
		{ "name": "Nagano Apple", "key": "apple", "fallback": apple_tex, "pos": Vector2(790, 585) },
		{ "name": "Ski Pass", "key": "skipass", "fallback": skipass_tex, "pos": Vector2(880, 645) },
		{ "name": "Onsen Tea", "key": "tea", "fallback": tea_tex, "pos": Vector2(485, 435) },
		{ "name": "Lucky Charm", "key": "charm", "fallback": charm_tex, "pos": Vector2(885, 455) }
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

	# 1. Friendly: Elder Kenzo (Near the Mountain Tea & Roastery Kiosk)
	var elder = friendly_npc_scene.instantiate()
	elder.npc_name = "Elder Kenzo"
	elder.npc_role = "Village Historian"
	elder.dialogue_text = "Welcome to Hakuba, Aoi! Leaving that Tokyo desk job was a brave step. Lately our head Shinto priest and coffee roaster got bored and transformed into forest spirits! Use your guidebook, warm tea, and jokes to calm them down!"
	elder.npc_sprite = elder_tex
	elder.target_height = 104.0
	elder.position = Vector2(645, 425)
	npcs_container.add_child(elder)

	# 2. Friendly: Yuki (Ski & Mountain Patrol Instructor on the lower right lane)
	var guide = friendly_npc_scene.instantiate()
	guide.npc_name = "Yuki"
	guide.npc_role = "Hakuba Ski Instructor"
	guide.dialogue_text = "Hey Aoi! Press [T] anytime to see Hakuba in both Winter Japow and Summer Green Season! Watch out for the Snow Monkey by the onsen and the transformed villager spirit beasts!"
	guide.npc_sprite = yuki_tex
	guide.target_height = 102.0
	guide.position = Vector2(945, 595)
	npcs_container.add_child(guide)

	# 3. Pest Enemy: Jigokudani Wild Snow Monkey (Near the Onsen Bridge)
	var monkey = enemy_npc_scene.instantiate()
	monkey.enemy_name = "Wild Snow Monkey"
	monkey.enemy_id = "wild_snowman"
	monkey.enemy_uid = "monkey_onsen"
	monkey.enemy_sprite = monkey_tex
	monkey.target_height = 86.0
	monkey.patrol_distance = 65.0
	monkey.patrol_speed = 48.0
	monkey.position = Vector2(355, 505)
	npcs_container.add_child(monkey)

	# 4. Transformed Villager Spirit Beast: Sacred Japanese Serow (Head Shinto Priest near the Shrine!)
	var serow = enemy_npc_scene.instantiate()
	serow.enemy_name = "Sacred Serow Spirit"
	serow.enemy_id = "sacred_serow"
	serow.enemy_uid = "serow_shrine"
	serow.enemy_sprite = serow_tex
	serow.target_height = 104.0
	serow.patrol_distance = 70.0
	serow.patrol_speed = 42.0
	serow.position = Vector2(825, 485)
	npcs_container.add_child(serow)

	# 5. Transformed Villager Spirit Beast: Caffeine-Deprived Moon Bear (Coffee Shop Owner in the lower-left plaza)
	var bear = enemy_npc_scene.instantiate()
	bear.enemy_name = "Sleepy Moon Bear Spirit"
	bear.enemy_id = "moon_bear"
	bear.enemy_uid = "bear_plaza"
	bear.enemy_sprite = bear_tex
	bear.target_height = 112.0
	bear.patrol_distance = 60.0
	bear.patrol_speed = 36.0
	bear.position = Vector2(310, 635)
	npcs_container.add_child(bear)
