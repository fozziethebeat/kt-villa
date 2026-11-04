extends Node

signal item_collected(item_name: String, total_count: int, icon_texture: Texture2D)
signal item_used(item_name: String, remaining_count: int, message: String)
signal inventory_changed()
signal enemy_proximity_changed(enemy_name: String, is_close: bool, distance: float)
signal dialogue_started(speaker_name: String, text: String)
signal dialogue_ended()
signal encounter_prompt_requested(enemy_data: Dictionary, enemy_node: Node)
signal encounter_prompt_closed()
signal battle_requested(enemy_data: Dictionary)
signal battle_ended(outcome: String, enemy_data: Dictionary)
signal season_changed(new_season: String)
signal player_profile_changed(profile_id: String, gender: String)

var inventory: Dictionary = {}
var active_nearby_enemies: Dictionary = {}
var is_dialogue_active: bool = false
var is_menu_active: bool = false
var is_encounter_prompt_active: bool = false
var is_in_battle: bool = false

# Season & Character Class / Profile System
# Seasons: "winter" ("Japow" Winter Season) or "green" (Lush Alpine Summer Green Season)
var current_season: String = "winter"
var player_profile_id: String = "corporate_burnout"
var player_gender: String = "female"

const CHARACTER_PROFILES: Dictionary = {
	"corporate_burnout": {
		"id": "corporate_burnout",
		"title": "Ex-Tokyo Corporate Burnout",
		"subtitle": "Datsusara Newcomer",
		"default_name_female": "Aoi (Ex-Tokyo Burnout)",
		"default_name_male": "Kenji (Ex-Tokyo Burnout)",
		"perk_desc": "Organized & Over-Prepared: Carries a 'Beginner's Guide to Hakuba' and a trusty coffee tumbler.",
		"max_courage": 100,
		"speed_bonus": 1.0,
		"sprites": {
			"female": {
				"winter": {
					"idle": "res://assets/sprites/characters/burnout_female/winter_idle.png",
					"walk": "res://assets/sprites/characters/burnout_female/winter_walk.png",
					"battle": "res://assets/sprites/characters/burnout_female/winter_battle.png"
				},
				"green": {
					"idle": "res://assets/sprites/characters/burnout_female/green_idle.png",
					"walk": "res://assets/sprites/characters/burnout_female/green_walk.png",
					"battle": "res://assets/sprites/characters/burnout_female/green_battle.png"
				}
			}
		}
	},
	"roots_seeker": {
		"id": "roots_seeker",
		"title": "Half-Japanese American Roots-Seeker",
		"subtitle": "Heritage Explorer",
		"default_name_female": "Maya (Roots-Seeker)",
		"default_name_male": "Leo (Roots-Seeker)",
		"perk_desc": "Curious Photographer: Captures village memories with a vintage 35mm camera.",
		"max_courage": 110,
		"speed_bonus": 1.05,
		"sprites": {}
	},
	"indie_creative": {
		"id": "indie_creative",
		"title": "Remote Indie Creative / Powder-Hound",
		"subtitle": "Digital Nomad",
		"default_name_female": "Sora (Indie Creative)",
		"default_name_male": "Ren (Indie Creative)",
		"perk_desc": "Cafe Hopper & Freerider: Moves fast on the slopes and vibes with lofi beats.",
		"max_courage": 95,
		"speed_bonus": 1.12,
		"sprites": {}
	}
}

# Persistent Battle & World Transition State
var current_enemy_data: Dictionary = {}
var player_world_position: Vector2 = Vector2.ZERO
var last_battle_outcome: String = ""
var last_battle_enemy_id: String = ""
var pacified_enemy_ids: Array[String] = []
var spooked_enemy_ids: Array[String] = []
var enemy_cooldown_timers: Dictionary = {}

# Player Stats (Courage replaces traditional HP)
var player_courage: int = 85
var player_max_courage: int = 100
var player_hp: int:
	get:
		return player_courage
	set(val):
		player_courage = val
var player_max_hp: int:
	get:
		return player_max_courage
	set(val):
		player_max_courage = val
var player_warmth: float = 80.0

func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	# Starter supplies for battle testing
	if inventory.is_empty():
		inventory["Nagano Apple"] = 2
		inventory["Onsen Tea"] = 1
		inventory["Lucky Charm"] = 1

func toggle_season() -> void:
	set_season("green" if current_season == "winter" else "winter")

func set_season(new_season: String) -> void:
	if new_season not in ["winter", "green"]:
		return
	if current_season != new_season:
		current_season = new_season
		season_changed.emit(current_season)

func set_player_profile(profile_id: String, gender: String = "female") -> void:
	if CHARACTER_PROFILES.has(profile_id):
		player_profile_id = profile_id
	if gender in ["female", "male"]:
		player_gender = gender
	player_profile_changed.emit(player_profile_id, player_gender)

func get_player_display_name() -> String:
	var prof = CHARACTER_PROFILES.get(player_profile_id, CHARACTER_PROFILES["corporate_burnout"])
	if player_gender == "female":
		return prof.get("default_name_female", "Aoi")
	return prof.get("default_name_male", "Kenji")

func get_player_sprite_paths() -> Dictionary:
	var prof = CHARACTER_PROFILES.get(player_profile_id, CHARACTER_PROFILES["corporate_burnout"])
	var gender_dict = prof.get("sprites", {}).get(player_gender, {})
	if gender_dict.is_empty():
		gender_dict = CHARACTER_PROFILES["corporate_burnout"]["sprites"]["female"]
	var season_dict = gender_dict.get(current_season, gender_dict.get("winter", {}))
	return season_dict

func add_item(item_name: String, icon: Texture2D = null) -> void:
	if not inventory.has(item_name):
		inventory[item_name] = 0
	inventory[item_name] += 1
	item_collected.emit(item_name, inventory[item_name], icon)
	inventory_changed.emit()

func get_item_count(item_name: String) -> int:
	return inventory.get(item_name, 0)

func use_item(item_name: String) -> Dictionary:
	var count = get_item_count(item_name)
	if count <= 0:
		return { "success": false, "message": "You don't have any left!" }

	var data = ItemDatabase.get_item(item_name)
	if not data.get("can_use", false):
		return { "success": false, "message": "%s cannot be consumed." % data.get("name", item_name) }

	inventory[item_name] -= 1
	var remaining = inventory[item_name]

	# Apply stats
	var hp_gain = data.get("hp_restore", 0)
	if hp_gain > 0:
		player_hp = mini(player_hp + hp_gain, player_max_hp)

	var warmth_gain = data.get("warmth_boost", 0.0)
	if warmth_gain > 0.0:
		player_warmth = minf(player_warmth + warmth_gain, 100.0)

	var msg = "Used %s! Restored +%d HP." % [data.get("name", item_name), hp_gain]
	item_used.emit(item_name, remaining, msg)
	inventory_changed.emit()
	return { "success": true, "message": msg }

func get_inventory_items() -> Array[Dictionary]:
	var result: Array[Dictionary] = []
	for item_key in inventory:
		var count = inventory[item_key]
		if count > 0:
			var data = ItemDatabase.get_item(item_key).duplicate()
			data["count"] = count
			data["texture"] = ItemDatabase.get_item_texture(item_key)
			result.append(data)
	return result

func set_enemy_proximity(enemy_id: String, enemy_name: String, is_close: bool, distance: float = 0.0) -> void:
	if is_close:
		active_nearby_enemies[enemy_id] = { "name": enemy_name, "distance": distance }
	else:
		active_nearby_enemies.erase(enemy_id)
	
	var has_threat = not active_nearby_enemies.is_empty()
	var threat_name = ""
	var closest_dist = 99999.0
	if has_threat:
		for id in active_nearby_enemies:
			var info = active_nearby_enemies[id]
			if info.distance < closest_dist:
				closest_dist = info.distance
				threat_name = info.name
	
	enemy_proximity_changed.emit(threat_name, has_threat, closest_dist)

func start_dialogue(speaker: String, text: String) -> void:
	is_dialogue_active = true
	dialogue_started.emit(speaker, text)

func close_dialogue() -> void:
	if is_dialogue_active:
		is_dialogue_active = false
		dialogue_ended.emit()

func request_encounter_prompt(enemy_data: Dictionary, enemy_node: Node) -> void:
	is_encounter_prompt_active = true
	encounter_prompt_requested.emit(enemy_data, enemy_node)

func close_encounter_prompt() -> void:
	if is_encounter_prompt_active:
		is_encounter_prompt_active = false
		encounter_prompt_closed.emit()

func start_battle(enemy_data: Dictionary) -> void:
	close_encounter_prompt()
	is_in_battle = true
	current_enemy_data = enemy_data
	battle_requested.emit(enemy_data)
	get_tree().change_scene_to_file("res://src/battle/battle_scene.tscn")

func end_battle(outcome: String, enemy_data: Dictionary) -> void:
	is_in_battle = false
	last_battle_outcome = outcome
	var uid = enemy_data.get("unique_id", "")
	last_battle_enemy_id = uid
	
	if outcome == "spooked" and uid != "":
		if not spooked_enemy_ids.has(uid):
			spooked_enemy_ids.append(uid)
	elif outcome == "charmed" and uid != "":
		if not pacified_enemy_ids.has(uid):
			pacified_enemy_ids.append(uid)
	elif uid != "":
		enemy_cooldown_timers[uid] = 8.0

	battle_ended.emit(outcome, enemy_data)
	get_tree().change_scene_to_file("res://src/world/hakuba_village.tscn")
