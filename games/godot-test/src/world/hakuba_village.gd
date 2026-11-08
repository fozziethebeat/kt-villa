extends Node2D

## Cozy Storybook Illustrated 2.5D Hakuba Valley World Scene (1280x720)
## Dynamically renders any of the 10 Hakuba Sub-Regions with:
## - Spiritfarer-style Day/Night atmospheric lighting
## - Cozy Grove-style "Lantern Warming" (desaturated misty tint -> warm golden bloom when restored)
## - Parked Kei Van & Mobile Shop entity
## - Sub-region Forest Spirit Guardian (3-Stage Restoration Arc -> Human Villager)
## - Regional Forageables & Friendly Critter Trade entities

const ParkedVanScript = preload("res://src/entities/parked_van.gd")
const SpiritGuardianScript = preload("res://src/entities/spirit_guardian_npc.gd")

const WORLD_W = 1280.0
const WORLD_H = 720.0

var winter_bg_tex: Texture2D
var green_bg_tex: Texture2D
var lodge_prop_tex: Texture2D
var kiosk_prop_tex: Texture2D
var shrine_prop_tex: Texture2D

var item_scene = preload("res://src/entities/item.tscn")
var friendly_npc_scene = preload("res://src/entities/npc_friendly.tscn")
var enemy_npc_scene = preload("res://src/entities/npc_enemy.tscn")

var apple_tex = preload("res://assets/sprites/item_apple.png")
var skipass_tex = preload("res://assets/sprites/item_skipass.png")
var tea_tex = preload("res://assets/sprites/item_tea.png")
var charm_tex = preload("res://assets/sprites/item_charm.png")

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
@onready var hud: CanvasLayer = $HUD

var _day_night_modulate: CanvasModulate

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

	_day_night_modulate = CanvasModulate.new()
	add_child(_day_night_modulate)

	GameManager.season_changed.connect(func(_new_season): _apply_atmosphere_visuals())
	GameManager.time_changed.connect(func(_d, _p): _apply_atmosphere_visuals())
	GameManager.region_changed.connect(func(_r):
		_rebuild_world()
		_apply_atmosphere_visuals()
		player.position = Vector2(540, 560)
	)
	GameManager.region_restored.connect(func(_r): _animate_region_restoration_bloom())

	_rebuild_world()
	_apply_atmosphere_visuals()

	if GameManager.player_world_position != Vector2.ZERO:
		player.position = GameManager.player_world_position
	else:
		player.position = Vector2(540, 560)

func _apply_atmosphere_visuals() -> void:
	var is_green = (GameManager.current_season == "green") or (GameManager.current_region_id == "lake_aoki")
	if backdrop_sprite:
		backdrop_sprite.texture = green_bg_tex if is_green else winter_bg_tex
		backdrop_sprite.texture_filter = CanvasItem.TEXTURE_FILTER_LINEAR
		# Cozy Grove-style visual warming: slightly muted cool mist before restoration, vibrant warm glow once restored!
		var is_restored = GameManager.is_region_restored()
		backdrop_sprite.modulate = Color(1.04, 1.0, 0.96, 1.0) if is_restored else Color(0.82, 0.88, 0.96, 1.0)

	if snow_particles:
		snow_particles.emitting = not is_green

	if _day_night_modulate:
		var target_col = Color(1.0, 0.98, 0.95)
		match GameManager.time_of_day:
			"morning":
				target_col = Color(1.0, 0.96, 0.92)
			"afternoon":
				target_col = Color(1.0, 1.0, 1.0)
			"evening":
				target_col = Color(0.96, 0.84, 0.74)
			"night":
				target_col = Color(0.68, 0.74, 0.92)
		var tw = create_tween()
		tw.tween_property(_day_night_modulate, "color", target_col, 0.6)

func _animate_region_restoration_bloom() -> void:
	if not backdrop_sprite:
		return
	var tw = create_tween()
	tw.tween_property(backdrop_sprite, "modulate", Color(1.25, 1.18, 0.95, 1.0), 0.35)
	tw.tween_property(backdrop_sprite, "modulate", Color(1.04, 1.0, 0.96, 1.0), 0.65)

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
	_add_rect_obstacle(Rect2(0, 0, WORLD_W, 335))
	_add_rect_obstacle(Rect2(-20, 0, 25, WORLD_H))
	_add_rect_obstacle(Rect2(WORLD_W - 5, 0, 25, WORLD_H))
	_add_rect_obstacle(Rect2(0, WORLD_H - 12, WORLD_W, 30))
	_add_rect_obstacle(Rect2(130, 320, 310, 125))
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
	_add_prop_landmark(kiosk_prop_tex, Vector2(560, 385), 145.0, Vector2(95, 36))
	_add_prop_landmark(shrine_prop_tex, Vector2(935, 420), 175.0, Vector2(90, 34))

	# Spawn the Player's Parked Kei Van & Mobile Shop Hub!
	var van = ParkedVanScript.new()
	van.position = Vector2(310, 580)
	van.van_interacted.connect(func():
		if hud and hud.has_method("toggle_van_overlay"):
			hud.toggle_van_overlay()
	)
	props_container.add_child(van)

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

	var reg = GameManager.get_current_region_data()
	var items_data: Array = reg.get("forage_items", [])

	for data in items_data:
		var item = item_scene.instantiate()
		item.item_name = data["name"]
		var key = data.get("key", "charm")
		var tex = AssetRegistry.get_item_texture(key)
		var fallback = charm_tex
		if key == "apple":
			fallback = apple_tex
		elif key == "skipass":
			fallback = skipass_tex
		elif key == "tea":
			fallback = tea_tex
		item.item_icon = tex if tex else fallback
		item.position = data["pos"]
		items_container.add_child(item)

func _spawn_npcs() -> void:
	for child in npcs_container.get_children():
		child.queue_free()

	var reg = GameManager.get_current_region_data()

	# 1. Sub-Region Spirit Guardian (or Elder Kenzo in Region 1) -> Transforms to Restored Villager!
	var guardian = SpiritGuardianScript.new()
	guardian.region_id = GameManager.current_region_id
	guardian.target_height = 108.0
	guardian.position = Vector2(665, 435)
	npcs_container.add_child(guardian)

	# 2. Friendly VIP Customer / Valley Guide Yuki near the lower-right path
	var guide = friendly_npc_scene.instantiate()
	guide.npc_name = "Yuki"
	guide.npc_role = "VIP Customer & Valley Guide"
	guide.dialogue_text = "Hey Aoi! Welcome to %s! Walk up to your Kei Van [V] to brew warm drinks or craft mountain gear, then talk to %s above to restore this region! Press [M] anytime to travel across all 10 Hakuba sub-regions!" % [
		reg.get("name", "Hakuba"),
		reg.get("spirit_name", "the Spirit Guardian")
	]
	guide.npc_sprite = yuki_tex
	guide.target_height = 100.0
	guide.position = Vector2(945, 595)
	npcs_container.add_child(guide)

	# 3. Cozy Regional Critter (Trades fetch/forage items!)
	var critter_info: Dictionary = reg.get("critter", {})
	if not critter_info.is_empty():
		var critter = enemy_npc_scene.instantiate()
		critter.enemy_name = critter_info.get("name", "Curious Snow Monkey")
		critter.enemy_id = "critter_" + GameManager.current_region_id
		critter.enemy_uid = "critter_" + GameManager.current_region_id
		var c_tex = GameManager.load_png_texture(critter_info.get("sprite", "res://assets/storybook/entities/enemy_snow_monkey.png"))
		critter.enemy_sprite = c_tex if c_tex else monkey_tex
		critter.want_item = critter_info.get("want_item", "Nagano Apple")
		critter.reward_item = critter_info.get("reward_item", reg.get("fetch_item", "Wooden Trail Plaque"))
		critter.critter_dialogue = critter_info.get("dialogue", "A friendly critter wants to trade!")
		critter.target_height = 88.0
		critter.patrol_distance = 55.0
		critter.patrol_speed = 38.0
		critter.position = Vector2(385, 485)
		npcs_container.add_child(critter)
