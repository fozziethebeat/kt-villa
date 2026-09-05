extends Node

signal item_collected(item_name: String, total_count: int, icon_texture: Texture2D)
signal enemy_proximity_changed(enemy_name: String, is_close: bool, distance: float)
signal dialogue_started(speaker_name: String, text: String)
signal dialogue_ended()

var inventory: Dictionary = {}
var active_nearby_enemies: Dictionary = {}
var is_dialogue_active: bool = false

func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS

func add_item(item_name: String, icon: Texture2D = null) -> void:
	if not inventory.has(item_name):
		inventory[item_name] = 0
	inventory[item_name] += 1
	item_collected.emit(item_name, inventory[item_name], icon)

func get_item_count(item_name: String) -> int:
	return inventory.get(item_name, 0)

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
