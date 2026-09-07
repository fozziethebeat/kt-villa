extends SceneTree

func _init():
	print("Building complete hakuba_tileset.tres...")
	var ts = TileSet.new()
	ts.tile_size = Vector2i(16, 16)

	var sources_def = [
		{
			"id": 0,
			"path": "res://assets/kenney/tiny-ski/Tilemap/tilemap_packed.png",
			"cols": 12,
			"rows": 11,
			"sep": Vector2i(0, 0)
		},
		{
			"id": 1,
			"path": "res://assets/kenney/tiny-town/Tilemap/tilemap_packed.png",
			"cols": 12,
			"rows": 11,
			"sep": Vector2i(0, 0)
		},
		{
			"id": 2,
			"path": "res://assets/kenney/roguelike-rpg/Spritesheet/roguelikeSheet_transparent.png",
			"cols": 57,
			"rows": 31,
			"sep": Vector2i(1, 1)
		},
		{
			"id": 3,
			"path": "res://assets/kenney/roguelike-characters/Spritesheet/roguelikeChar_transparent.png",
			"cols": 54,
			"rows": 12,
			"sep": Vector2i(1, 1)
		},
		{
			"id": 4,
			"path": "res://assets/kenney/tiny-dungeon/Tilemap/tilemap_packed.png",
			"cols": 12,
			"rows": 11,
			"sep": Vector2i(0, 0)
		},
		{
			"id": 5,
			"path": "res://assets/kenney/tiny-battle/Tilemap/tilemap_packed.png",
			"cols": 18,
			"rows": 11,
			"sep": Vector2i(0, 0)
		}
	]

	for sdef in sources_def:
		if not ResourceLoader.exists(sdef["path"]):
			print("Warning: path not found: ", sdef["path"])
			continue
		var tex = load(sdef["path"])
		var atlas = TileSetAtlasSource.new()
		atlas.texture = tex
		atlas.texture_region_size = Vector2i(16, 16)
		atlas.separation = sdef["sep"]

		var added = 0
		for r in range(sdef["rows"]):
			for c in range(sdef["cols"]):
				atlas.create_tile(Vector2i(c, r))
				added += 1

		ts.add_source(atlas, sdef["id"])
		print("Added source ", sdef["id"], " (", sdef["path"].get_file(), ") with ", added, " tiles.")

	var err = ResourceSaver.save(ts, "res://assets/tilesets/hakuba_tileset.tres")
	if err == OK:
		print("Successfully saved res://assets/tilesets/hakuba_tileset.tres!")
	else:
		print("Error saving tileset: ", err)

	quit()
