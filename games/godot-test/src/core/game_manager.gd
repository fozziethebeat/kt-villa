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

# Cozy Van-Life & Village Restoration Signals
signal time_changed(day: int, phase: String)
signal currency_changed(yen: int, valley_warmth: int)
signal region_changed(region_id: String)
signal region_stage_updated(region_id: String, new_stage: int)
signal region_restored(region_id: String)
signal van_updated()
signal shop_sale_made(item_name: String, yen_earned: int, warmth_earned: int, is_vip: bool)
signal toast_requested(message: String, color: Color)
signal puzzle_requested(region_id: String)

var inventory: Dictionary = {}
var active_nearby_enemies: Dictionary = {}
var is_dialogue_active: bool = false
var is_menu_active: bool = false
var is_encounter_prompt_active: bool = false
var is_in_battle: bool = false

# Season & Character Class / Profile System
var current_season: String = "winter"
var player_profile_id: String = "corporate_burnout"
var player_gender: String = "female"

const CHARACTER_PROFILES: Dictionary = {
	"corporate_burnout": {
		"id": "corporate_burnout",
		"title": "Ex-Tokyo Corporate Burnout",
		"subtitle": "Datsusara Van-Lifer",
		"default_name_female": "Aoi (Ex-Tokyo Van-Lifer)",
		"default_name_male": "Kenji (Ex-Tokyo Van-Lifer)",
		"perk_desc": "Organized & Over-Prepared: Carries a 'Beginner's Guide to Hakuba' and a trusty pour-over kettle.",
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

# Persistent World State
var current_enemy_data: Dictionary = {}
var player_world_position: Vector2 = Vector2.ZERO
var last_battle_outcome: String = ""
var last_battle_enemy_id: String = ""
var pacified_enemy_ids: Array[String] = []
var spooked_enemy_ids: Array[String] = []
var enemy_cooldown_timers: Dictionary = {}

# Player Stats
var player_courage: int = 100
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
var player_warmth: float = 90.0

# ============================================================================
# COZY VAN-LIFE, DAY/NIGHT CYCLE & 10-REGION RESTORATION STATE
# ============================================================================
const TIME_PHASES: Array[String] = ["morning", "afternoon", "evening", "night"]
const TIME_PHASE_LABELS: Dictionary = {
	"morning": "🌅 Morning (Alpenglow)",
	"afternoon": "☀️ Afternoon (Sunny Slopes)",
	"evening": "🏮 Evening (Lantern Hours)",
	"night": "🌙 Starlight Night (Camp Time)"
}

var current_day: int = 1
var time_of_day: String = "morning"
var _phase_timer: float = 0.0
const PHASE_DURATION_SECONDS: float = 75.0 # Smooth Spiritfarer-style day progression

# Currencies
var player_yen: int = 180
var valley_warmth: int = 10 # Community Goodwill / Heart points

# 10 Sub-Regions Progression
var current_region_id: String = "hakuba_station"
var unlocked_regions: Array[String] = ["hakuba_station"]
# Stage 0: Fetch Quest -> Stage 1: Van Creation Quest -> Stage 2: Regional Puzzle -> Stage 3: Restored!
var region_quest_stages: Dictionary = {}

# Van-Life Business & Interior Grid
var van_chassis_tier: int = 0
var unlocked_licenses: Array[String] = ["cafe"]
var active_license: String = "cafe"
var owned_furniture: Array[String] = ["futon_bed", "camp_kettle"]
# Array of Dictionaries: { "id": String, "gx": int, "gy": int }
var placed_furniture: Array[Dictionary] = [
	{ "id": "futon_bed", "gx": 0, "gy": 1 },
	{ "id": "camp_kettle", "gx": 3, "gy": 0 }
]
# Window Display Rack: Array of Dictionaries { "recipe_id": String, "name": String, "icon": String, "price": int, "warmth": int, "star": bool }
var window_display_rack: Array[Dictionary] = []
var _passive_sale_timer: float = 0.0
var inspired_morning_buff: bool = false

func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	for reg_id in CozyDatabase.SUB_REGIONS:
		region_quest_stages[reg_id] = 0

	if inventory.is_empty():
		inventory["Nagano Apple"] = 3
		inventory["Onsen Tea"] = 3
		inventory["Lucky Charm"] = 1

	# Start with 1 sample ginger tea on the window display so the player sees passive sales in action
	stock_window_item("ginger_tea", false)

func _process(delta: float) -> void:
	if is_dialogue_active or is_menu_active or is_encounter_prompt_active or is_in_battle:
		return

	# 1. Spiritfarer-style Day/Night progression (pauses at "night" until player sleeps in Van)
	if time_of_day != "night":
		_phase_timer += delta
		if _phase_timer >= PHASE_DURATION_SECONDS:
			_phase_timer = 0.0
			advance_time_phase()

	# 2. Passive Window Display Rack Sales while exploring
	if not window_display_rack.is_empty():
		var sale_interval = 14.0
		# Happo Bus Terminal restoration doubles tourist speed!
		if is_region_restored("happo_terminal"):
			sale_interval = 7.5
		_passive_sale_timer += delta
		if _passive_sale_timer >= sale_interval:
			_passive_sale_timer = 0.0
			_process_next_window_sale(false)

func advance_time_phase() -> void:
	var idx = TIME_PHASES.find(time_of_day)
	if idx < TIME_PHASES.size() - 1:
		time_of_day = TIME_PHASES[idx + 1]
		time_changed.emit(current_day, time_of_day)
		var label = TIME_PHASE_LABELS.get(time_of_day, time_of_day)
		if time_of_day == "evening":
			toast_requested.emit("🏮 Evening Lantern Hours! Après-ski crowds are gathering.", Color(1.0, 0.82, 0.38))
		elif time_of_day == "night":
			toast_requested.emit("🌙 Night has fallen over Hakuba. Head to your Van [V] to sleep!", Color(0.65, 0.8, 1.0))

func sleep_in_van() -> Dictionary:
	current_day += 1
	time_of_day = "morning"
	_phase_timer = 0.0
	var comfort = get_van_comfort_score()
	player_courage = player_max_courage
	player_warmth = 100.0
	inspired_morning_buff = (comfort >= 20)
	var bonus_warmth = int(comfort / 10)
	if bonus_warmth > 0:
		add_currency(0, bonus_warmth)
	time_changed.emit(current_day, time_of_day)
	var msg = "☀️ Good morning! Day %d in Hakuba Valley. (Van Comfort %d -> +%d🔥 Goodwill%s)" % [
		current_day,
		comfort,
		bonus_warmth,
		", ✨ Inspired Crafting Active!" if inspired_morning_buff else ""
	]
	toast_requested.emit(msg, Color(1.0, 0.92, 0.45))
	return { "day": current_day, "comfort": comfort, "message": msg }

func get_time_label() -> String:
	return "Day %d • %s" % [current_day, TIME_PHASE_LABELS.get(time_of_day, "🌅 Morning")]

func add_currency(yen_delta: int, warmth_delta: int = 0) -> void:
	player_yen = maxi(0, player_yen + yen_delta)
	valley_warmth = maxi(0, valley_warmth + warmth_delta)
	currency_changed.emit(player_yen, valley_warmth)

func get_van_chassis_data() -> Dictionary:
	var tier = clampi(van_chassis_tier, 0, CozyDatabase.CHASSIS_TIERS.size() - 1)
	return CozyDatabase.CHASSIS_TIERS[tier]

func get_van_comfort_score() -> int:
	var score = 0
	for item in placed_furniture:
		var f_data = CozyDatabase.VAN_FURNITURE.get(item["id"], {})
		score += int(f_data.get("comfort", 0))
	if is_region_restored("lake_aoki"):
		score += 15
	return score

func get_max_display_slots() -> int:
	return int(get_van_chassis_data().get("display_slots", 3))

func can_craft_recipe(recipe_id: String) -> bool:
	var rec = CozyDatabase.RECIPES.get(recipe_id, {})
	if rec.is_empty():
		return false
	var req_license = rec.get("license", "cafe")
	if not unlocked_licenses.has(req_license):
		return false
	var ing_dict: Dictionary = rec.get("ingredients", {})
	for item_name in ing_dict:
		if get_item_count(item_name) < int(ing_dict[item_name]):
			return false
	return true

func craft_recipe_batch(recipe_id: String, is_perfect_star: bool) -> Dictionary:
	var rec = CozyDatabase.RECIPES.get(recipe_id, {})
	if rec.is_empty():
		return { "success": false, "message": "Unknown recipe." }
	var ing_dict: Dictionary = rec.get("ingredients", {})
	for item_name in ing_dict:
		var needed = int(ing_dict[item_name])
		if get_item_count(item_name) < needed:
			return { "success": false, "message": "Missing ingredient: %s" % item_name }

	# Consume ingredients
	for item_name in ing_dict:
		remove_item(item_name, int(ing_dict[item_name]))

	# Calculate yield: 1 goes to personal pouch (for Spirit Creation Quests!) and 3-5 go to the Van Window Display Rack!
	var star_quality = is_perfect_star or inspired_morning_buff or is_region_restored("lake_aoki")
	var batch_size = 5 if is_perfect_star else 3
	if inspired_morning_buff:
		batch_size += 1

	# Add 1 to player's inventory for quest hand-ins
	add_item(rec["name"])

	# Stock the rest on the Window Display Rack (and auto-sell overflow if rack is full)
	var stocked = 0
	var instant_sold = 0
	for i in range(batch_size):
		if window_display_rack.size() < get_max_display_slots():
			stock_window_item(recipe_id, star_quality)
			stocked += 1
		else:
			_sell_single_recipe(rec, star_quality, false)
			instant_sold += 1

	inventory_changed.emit()
	van_updated.emit()
	var qual_str = "★ Star-Quality " if star_quality else ""
	var msg = "Crafted %s%s! (+1 in Pouch for Quests, +%d on Van Display Window%s)" % [
		qual_str,
		rec["name"],
		stocked,
		", +%d sold immediately!" % instant_sold if instant_sold > 0 else ""
	]
	toast_requested.emit("✨ " + msg, Color(0.55, 0.95, 0.65))
	return { "success": true, "message": msg, "star": star_quality }

func stock_window_item(recipe_id: String, star_quality: bool) -> void:
	var rec = CozyDatabase.RECIPES.get(recipe_id, {})
	if rec.is_empty():
		return
	var base_price = int(rec.get("sell_price", 50))
	var base_warmth = int(rec.get("warmth_gain", 5))
	if star_quality:
		base_price = int(round(base_price * 1.35))
		base_warmth += 2
	window_display_rack.append({
		"recipe_id": recipe_id,
		"name": ("★ " if star_quality else "") + rec["name"],
		"icon": rec.get("icon", "🍵"),
		"price": base_price,
		"warmth": base_warmth,
		"best_time": rec.get("best_time", "morning"),
		"star": star_quality
	})
	van_updated.emit()

func _process_next_window_sale(is_vip: bool) -> Dictionary:
	if window_display_rack.is_empty():
		return {}
	var item = window_display_rack.pop_front()
	var price = int(item.get("price", 50))
	var warmth = int(item.get("warmth", 5))
	# Time-of-day matching bonus!
	if item.get("best_time", "") == time_of_day:
		price = int(round(price * 1.2))
	if is_vip:
		price = int(round(price * 1.5))
		warmth += 4

	add_currency(price, warmth)
	van_updated.emit()
	shop_sale_made.emit(item["name"], price, warmth, is_vip)
	var prefix = "🌟 VIP Walk-Up Order!" if is_vip else "🛎️ Van Window Sale:"
	toast_requested.emit("%s Sold %s for +¥%d & +%d🔥" % [prefix, item["name"], price, warmth], Color(1.0, 0.88, 0.35))
	return item

func serve_vip_walkup_customer() -> Dictionary:
	if window_display_rack.is_empty():
		return { "success": false, "message": "Your Van Display Window is empty! Craft a batch inside your Van [V] first." }
	var sold = _process_next_window_sale(true)
	return {
		"success": true,
		"message": "Served %s to a delighted local visitor! Earned +¥%d and +%d🔥 Valley Warmth!" % [sold["name"], sold["price"], sold["warmth"]]
	}

func _sell_single_recipe(rec: Dictionary, star_quality: bool, is_vip: bool) -> void:
	var price = int(rec.get("sell_price", 50))
	var warmth = int(rec.get("warmth_gain", 5))
	if star_quality:
		price = int(round(price * 1.35))
		warmth += 2
	if is_vip:
		price = int(round(price * 1.5))
	add_currency(price, warmth)

# ============================================================================
# REGION RESTORATION & TRAVEL API
# ============================================================================
func get_current_region_data() -> Dictionary:
	return CozyDatabase.SUB_REGIONS.get(current_region_id, CozyDatabase.SUB_REGIONS["hakuba_station"])

func get_region_stage(region_id: String = "") -> int:
	var rid = current_region_id if region_id.is_empty() else region_id
	return int(region_quest_stages.get(rid, 0))

func is_region_restored(region_id: String = "") -> bool:
	return get_region_stage(region_id) >= 3

func get_restored_region_count() -> int:
	var count = 0
	for rid in region_quest_stages:
		if int(region_quest_stages[rid]) >= 3:
			count += 1
	return count

func advance_region_quest_stage(region_id: String) -> void:
	var cur = get_region_stage(region_id)
	if cur >= 3:
		return
	var next_stage = cur + 1
	region_quest_stages[region_id] = next_stage
	region_stage_updated.emit(region_id, next_stage)

	if next_stage >= 3:
		_on_region_fully_restored(region_id)

func _on_region_fully_restored(region_id: String) -> void:
	var reg = CozyDatabase.SUB_REGIONS.get(region_id, {})
	add_currency(150, 25)
	# Unlock connected regions
	for conn_id in reg.get("connected_regions", []):
		if not unlocked_regions.has(conn_id):
			unlocked_regions.append(conn_id)
	# Special regional license unlocks
	if region_id == "snow_peak" and not unlocked_licenses.has("craft"):
		unlocked_licenses.append("craft")
		if not owned_furniture.has("wax_bench"):
			owned_furniture.append("wax_bench")
	elif region_id == "goryu" and not unlocked_licenses.has("soba"):
		unlocked_licenses.append("soba")
		if not owned_furniture.has("soba_boiler"):
			owned_furniture.append("soba_boiler")
	elif region_id == "happo_terminal" and not unlocked_licenses.has("soba"):
		unlocked_licenses.append("soba")
		if not owned_furniture.has("soba_boiler"):
			owned_furniture.append("soba_boiler")

	region_restored.emit(region_id)
	van_updated.emit()
	toast_requested.emit("🌸 Restored %s! +¥150, +25🔥 & Connected Roads Unlocked!" % reg.get("name", region_id), Color(1.0, 0.78, 0.35))

func can_travel_to_region(region_id: String) -> Dictionary:
	if not CozyDatabase.SUB_REGIONS.has(region_id):
		return { "ok": false, "reason": "Unknown sub-region." }
	if not unlocked_regions.has(region_id):
		return { "ok": false, "reason": "Help the spirit guardian in a connected region to clear this road first!" }
	var reg = CozyDatabase.SUB_REGIONS[region_id]
	var req_tier = int(reg.get("req_chassis_tier", 0))
	if van_chassis_tier < req_tier:
		var tier_name = CozyDatabase.CHASSIS_TIERS[req_tier]["name"]
		return { "ok": false, "reason": "Requires Van Chassis Tier %d (%s) to drive this mountain road!" % [req_tier, tier_name] }
	return { "ok": true, "reason": "" }

func travel_to_region(region_id: String) -> bool:
	var check = can_travel_to_region(region_id)
	if not check.get("ok", false):
		toast_requested.emit("🚐 " + check.get("reason", "Locked"), Color(1.0, 0.55, 0.45))
		return false
	current_region_id = region_id
	player_world_position = Vector2(640, 545)
	region_changed.emit(current_region_id)
	var reg = CozyDatabase.SUB_REGIONS[region_id]
	toast_requested.emit("🚐 Parked Kei Van at %s (%s)" % [reg["name"], reg["japanese_name"]], Color(0.65, 0.92, 1.0))
	return true

# ============================================================================
# INVENTORY & CHARACTER HELPERS
# ============================================================================
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

func load_png_texture(res_path: String) -> Texture2D:
	if res_path.is_empty():
		return null
	var abs_path = ProjectSettings.globalize_path(res_path)
	if FileAccess.file_exists(abs_path):
		var img = Image.load_from_file(abs_path)
		if img and not img.is_empty():
			return ImageTexture.create_from_image(img)
	if ResourceLoader.exists(res_path):
		return load(res_path)
	return null

func add_item(item_name: String, icon: Texture2D = null, amount: int = 1) -> void:
	if not inventory.has(item_name):
		inventory[item_name] = 0
	inventory[item_name] += amount
	item_collected.emit(item_name, inventory[item_name], icon)
	inventory_changed.emit()

func remove_item(item_name: String, amount: int = 1) -> bool:
	var current = get_item_count(item_name)
	if current < amount:
		return false
	inventory[item_name] = current - amount
	if inventory[item_name] <= 0:
		inventory.erase(item_name)
	inventory_changed.emit()
	return true

func get_item_count(item_name: String) -> int:
	if inventory.has(item_name):
		return int(inventory[item_name])
	# Case-insensitive fallback
	for k in inventory:
		if k.to_lower() == item_name.to_lower():
			return int(inventory[k])
	return 0

func use_item(item_name: String) -> Dictionary:
	var count = get_item_count(item_name)
	if count <= 0:
		return { "success": false, "message": "You don't have any left!" }

	var data = ItemDatabase.get_item(item_name)
	if not data.get("can_use", false):
		return { "success": false, "message": "%s is a key quest or craft material." % data.get("name", item_name) }

	remove_item(item_name, 1)
	var remaining = get_item_count(item_name)

	var hp_gain = data.get("hp_restore", 0)
	if hp_gain > 0:
		player_hp = mini(player_hp + hp_gain, player_max_hp)

	var warmth_gain = data.get("warmth_boost", 0.0)
	if warmth_gain > 0.0:
		player_warmth = minf(player_warmth + warmth_gain, 100.0)

	var msg = "Enjoyed %s! Restored +%d Cozy Energy." % [data.get("name", item_name), hp_gain]
	item_used.emit(item_name, remaining, msg)
	inventory_changed.emit()
	return { "success": true, "message": msg }

func get_inventory_items() -> Array[Dictionary]:
	var result: Array[Dictionary] = []
	for item_key in inventory:
		var count = inventory[item_key]
		if count > 0:
			var data = ItemDatabase.get_item(item_key).duplicate()
			data["name"] = item_key
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
