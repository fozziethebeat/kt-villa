extends Node

signal assets_reloaded()

const USAGE_JSON_PATH = "res://tools/sprite_usage.json"

var _usage_data: Dictionary = {}
var _items_by_key: Dictionary = {}
var _entities_by_id: Dictionary = {}
var _tiles_by_key: Dictionary = {}

func _ready() -> void:
	load_registry()

func load_registry() -> void:
	if not FileAccess.file_exists(USAGE_JSON_PATH):
		push_warning("[AssetRegistry] Missing: " + USAGE_JSON_PATH)
		return

	var file = FileAccess.open(USAGE_JSON_PATH, FileAccess.READ)
	if not file:
		push_error("[AssetRegistry] Failed to open " + USAGE_JSON_PATH)
		return

	var json_str = file.get_as_text()
	var json = JSON.new()
	var err = json.parse(json_str)
	if err != OK:
		push_error("[AssetRegistry] Failed to parse JSON: " + json.get_error_message())
		return

	_usage_data = json.data
	_parse_entities()
	_parse_usages()
	print("[AssetRegistry] Loaded assets from " + USAGE_JSON_PATH)
	assets_reloaded.emit()

func reload() -> void:
	load_registry()

func _parse_entities() -> void:
	_entities_by_id.clear()
	var entities = _usage_data.get("entities", [])
	for ent in entities:
		var id = ent.get("id", "")
		if id.is_empty():
			continue

		var preview_path = ent.get("preview_img", "")
		# Convert relative '../' to 'res://'
		if preview_path.begins_with("../"):
			preview_path = "res://" + preview_path.substr(3)

		var preview_tex: Texture2D = null
		if ResourceLoader.exists(preview_path):
			preview_tex = load(preview_path)

		var frames_array: Array[Texture2D] = []
		for f in ent.get("frames", []):
			var f_path = f.get("resPath", "")
			if f_path.is_empty():
				var img_src = f.get("imgSrc", "")
				if img_src.begins_with("../"):
					f_path = "res://" + img_src.substr(3)
			if not f_path.is_empty() and ResourceLoader.exists(f_path):
				var tex = load(f_path)
				if tex:
					frames_array.append(tex)

		_entities_by_id[id] = {
			"id": id,
			"name": ent.get("name", id),
			"fps": float(ent.get("fps", 4.0)),
			"preview": preview_tex,
			"frames": frames_array,
			"raw": ent
		}

func _parse_usages() -> void:
	_items_by_key.clear()
	_tiles_by_key.clear()

	var usages = _usage_data.get("usages", [])
	for u in usages:
		if u.get("project") != "godot-test":
			continue

		var entity_type = u.get("entity_type", "")
		var pack = u.get("pack", "")
		var tile_name = u.get("tile_name", "")
		var role = u.get("role", "")

		# Parse items
		if entity_type == "item":
			var item_key = _extract_item_key(role)
			var tex = _find_item_texture(item_key, pack, tile_name)
			_items_by_key[item_key] = {
				"key": item_key,
				"role": role,
				"pack": pack,
				"tile_name": tile_name,
				"texture": tex
			}

		# Parse terrain, structure, nature tiles
		elif entity_type in ["terrain", "structure", "nature"]:
			var tile_info = _parse_tile_role(role, pack, tile_name)
			if tile_info.has("key"):
				_tiles_by_key[tile_info["key"]] = tile_info

func _extract_item_key(role: String) -> String:
	var lower = role.to_lower()
	if "apple" in lower:
		return "apple"
	elif "ski pass" in lower or "skipass" in lower:
		return "skipass"
	elif "tea" in lower:
		return "tea"
	elif "charm" in lower or "talisman" in lower:
		return "charm"
	return lower

func _find_item_texture(item_key: String, pack: String, tile_name: String) -> Texture2D:
	# 1. Primary: Direct Kenney texture path
	var direct_paths = [
		"res://assets/kenney/" + pack + "/Tiles/" + tile_name + ".png",
		"res://assets/kenney/" + pack + "/PNG/Colored/" + tile_name + ".png",
		"res://assets/kenney/" + pack + "/PNG/White/" + tile_name + ".png",
		"res://assets/kenney/" + pack + "/PNG/Default/" + tile_name + ".png",
		"res://assets/kenney/" + pack + "/PNG/Retina/" + tile_name + ".png",
		"res://assets/kenney/" + pack + "/PNG/" + tile_name + ".png",
		"res://assets/kenney/" + pack + "/PNG/Players/Tiles/" + tile_name + ".png",
		"res://assets/kenney/" + pack + "/PNG/Tiles/Tiles/" + tile_name + ".png",
		"res://assets/kenney/" + pack + "/PNG/Interface/Tiles/" + tile_name + ".png"
	]
	for p in direct_paths:
		if ResourceLoader.exists(p):
			var tex = load(p)
			if tex:
				print("[AssetRegistry] Item '", item_key, "' loaded from: ", p)
				return tex

	# 2. Secondary: Check synced texture in assets/sprites/
	var synced_path = "res://assets/sprites/item_" + item_key + ".png"
	if ResourceLoader.exists(synced_path):
		var tex = load(synced_path)
		if tex:
			print("[AssetRegistry] Item '", item_key, "' loaded from fallback: ", synced_path)
			return tex

	return null

func _parse_tile_role(role: String, pack: String, tile_name: String) -> Dictionary:
	var res: Dictionary = {
		"role": role,
		"pack": pack,
		"tile_name": tile_name,
		"source_id": 0,
		"coords": Vector2i.ZERO
	}

	# Extract source ID from role string e.g. "(SRC_SKI 0,0)" or "(SRC_TOWN 1,0)"
	if "SRC_SKI" in role:
		res["source_id"] = 0
	elif "SRC_TOWN" in role:
		res["source_id"] = 1
	elif pack == "tiny-ski":
		res["source_id"] = 0
	else:
		res["source_id"] = 1

	# Extract coordinates if formatted like "(SRC_... 1,2)"
	var start_idx = role.find("(")
	var end_idx = role.find(")")
	if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
		var inner = role.substr(start_idx + 1, end_idx - start_idx - 1)
		var parts = inner.split(" ")
		if parts.size() >= 2:
			var coord_str = parts[1]
			var nums = coord_str.split(",")
			if nums.size() == 2:
				res["coords"] = Vector2i(int(nums[0]), int(nums[1]))

	# Determine clean key for world builder
	var lower = role.to_lower()
	if "plain snow" in lower:
		res["key"] = "snow"
	elif "snow trail" in lower or "ski path" in lower:
		res["key"] = "snow_path"
	elif "cobblestone" in lower or "stone path" in lower:
		res["key"] = "stone_path"
	elif "hot spring" in lower or "water" in lower:
		res["key"] = "water"
	elif "roof left" in lower:
		res["key"] = "roof_l"
	elif "roof center" in lower:
		res["key"] = "roof_m"
	elif "roof right" in lower:
		res["key"] = "roof_r"
	elif "wall left" in lower:
		res["key"] = "wall_l"
	elif "wall door" in lower:
		res["key"] = "wall_door"
	elif "wall right" in lower:
		res["key"] = "wall_r"
	elif "fence" in lower:
		res["key"] = "fence"
	elif "snow pine" in lower:
		res["key"] = "pine_snow"
	elif "green pine" in lower:
		res["key"] = "pine_green"

	return res

# Public API

func get_item_texture(key: String) -> Texture2D:
	var clean_key = _extract_item_key(key)
	if _items_by_key.has(clean_key):
		var tex = _items_by_key[clean_key].get("texture")
		if tex:
			return tex

	# Fallback
	var fallback_path = "res://assets/sprites/item_" + clean_key + ".png"
	if ResourceLoader.exists(fallback_path):
		return load(fallback_path)
	return null

func get_entity_frames(entity_id: String) -> Array[Texture2D]:
	if _entities_by_id.has(entity_id):
		return _entities_by_id[entity_id].get("frames", [])
	return []

func get_entity_preview(entity_id: String) -> Texture2D:
	if _entities_by_id.has(entity_id):
		return _entities_by_id[entity_id].get("preview")
	return null

func get_entity_fps(entity_id: String, default_fps: float = 4.0) -> float:
	if _entities_by_id.has(entity_id):
		return _entities_by_id[entity_id].get("fps", default_fps)
	return default_fps

func get_tile_source(key: String, fallback_source: int = 0) -> int:
	if _tiles_by_key.has(key):
		return _tiles_by_key[key].get("source_id", fallback_source)
	return fallback_source

func get_tile_coords(key: String, fallback_coords: Vector2i = Vector2i.ZERO) -> Vector2i:
	if _tiles_by_key.has(key):
		return _tiles_by_key[key].get("coords", fallback_coords)
	return fallback_coords
