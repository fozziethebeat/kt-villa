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
			var tile_info = _resolve_tile_info(role, pack, tile_name)
			if tile_info.has("key") and not tile_info["key"].is_empty():
				_tiles_by_key[tile_info["key"]] = tile_info
				print("[AssetRegistry] Tile '", tile_info["key"], "' -> pack: ", pack, ", tile: ", tile_name, ", src: ", tile_info["source_id"], ", coords: ", tile_info["coords"])

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

func _extract_tile_key(role: String) -> String:
	var lower = role.to_lower()
	if "roof left" in lower:
		return "roof_l"
	elif "roof center" in lower or "roof middle" in lower:
		return "roof_m"
	elif "roof right" in lower:
		return "roof_r"
	elif "wall left" in lower:
		return "wall_l"
	elif "wall door" in lower or "doorway" in lower:
		return "wall_door"
	elif "wall right" in lower:
		return "wall_r"
	elif "fence" in lower:
		return "fence"
	elif "snow pine" in lower:
		return "pine_snow"
	elif "green pine" in lower:
		return "pine_green"
	elif "plain snow" in lower:
		return "snow"
	elif "snow trail" in lower or "ski path" in lower or "snow path" in lower:
		return "snow_path"
	elif "cobblestone" in lower or "stone path" in lower:
		return "stone_path"
	elif "hot spring" in lower or "water" in lower or "onsen" in lower:
		return "water"
	return ""

func _load_texture_fresh(path: String) -> Texture2D:
	var global_path = ProjectSettings.globalize_path(path)
	if FileAccess.file_exists(global_path):
		var img = Image.load_from_file(global_path)
		if img:
			return ImageTexture.create_from_image(img)
	if ResourceLoader.exists(path):
		return load(path)
	return null

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
		var found_tex = _load_texture_fresh(p)
		if found_tex:
			print("[AssetRegistry] Item '", item_key, "' loaded from: ", p)
			return found_tex

	# 2. Secondary: Check synced texture in assets/sprites/
	var synced_path = "res://assets/sprites/item_" + item_key + ".png"
	var fallback_tex = _load_texture_fresh(synced_path)
	if fallback_tex:
		print("[AssetRegistry] Item '", item_key, "' loaded from fallback: ", synced_path)
		return fallback_tex

	return null

func _resolve_tile_info(role: String, pack: String, tile_name: String) -> Dictionary:
	var key = _extract_tile_key(role)
	var source_id = 0
	var coords = Vector2i.ZERO

	# 1. Resolve source_id from pack
	match pack:
		"tiny-ski":
			source_id = 0
		"tiny-town":
			source_id = 1
		"roguelike-rpg":
			source_id = 2
		"roguelike-chars":
			source_id = 3
		"tiny-dungeon":
			source_id = 4
		"tiny-battle":
			source_id = 5
		_:
			if "SRC_SKI" in role:
				source_id = 0
			else:
				source_id = 1

	# 2. Resolve coords from tile_name
	if tile_name.begins_with("tile_"):
		var idx_str = tile_name.trim_prefix("tile_")
		var idx = int(idx_str)
		var num_cols = 12.0
		if pack == "tiny-battle":
			num_cols = 18.0
		coords = Vector2i(idx % int(num_cols), int(float(idx) / num_cols))
	elif tile_name.begins_with("rpg_r") or tile_name.begins_with("char_r"):
		var parts = tile_name.split("_")
		if parts.size() >= 3:
			var r = int(parts[1].trim_prefix("r"))
			var c = int(parts[2].trim_prefix("c"))
			coords = Vector2i(c, r)
	else:
		# Fallback to coordinates in role string e.g. "(SRC_SKI 1,1)"
		var start_idx = role.find("(")
		var end_idx = role.find(")")
		if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
			var inner = role.substr(start_idx + 1, end_idx - start_idx - 1)
			var parts = inner.split(" ")
			if parts.size() >= 2:
				var coord_str = parts[1]
				var nums = coord_str.split(",")
				if nums.size() == 2:
					coords = Vector2i(int(nums[0]), int(nums[1]))

	return {
		"key": key,
		"role": role,
		"pack": pack,
		"tile_name": tile_name,
		"source_id": source_id,
		"coords": coords
	}

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
