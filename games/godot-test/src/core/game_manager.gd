extends Node

signal item_collected(item_name: String, total_count: int, icon_texture: Texture2D)
signal item_used(item_name: String, remaining_count: int, message: String)
signal inventory_changed()
signal enemy_proximity_changed(enemy_name: String, is_close: bool, distance: float)
signal dialogue_started(speaker_name: String, text: String)
signal dialogue_ended()

var inventory: Dictionary = {}
var active_nearby_enemies: Dictionary = {}
var is_dialogue_active: bool = false
var is_menu_active: bool = false

# Player Stats
var player_hp: int = 85
var player_max_hp: int = 100
var player_warmth: float = 80.0

func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS

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
