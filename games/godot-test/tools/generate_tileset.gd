@tool
extends SceneTree

func _init():
	print("Generating Hakuba TileSet resource...")
	var tileset = TileSet.new()
	tileset.tile_size = Vector2i(16, 16)
	
	# Source 0: Tiny Ski (packed 192x176, 12x11 tiles, 16x16)
	var ski_tex = load("res://assets/kenney/tiny-ski/Tilemap/tilemap_packed.png")
	if ski_tex:
		var source_ski = TileSetAtlasSource.new()
		source_ski.texture = ski_tex
		source_ski.texture_region_size = Vector2i(16, 16)
		for y in range(11):
			for x in range(12):
				source_ski.create_tile(Vector2i(x, y))
		var id0 = tileset.add_source(source_ski, 0)
		print("Added source 0 (Tiny Ski): id =", id0)
	else:
		printerr("Failed to load tiny-ski packed tilemap")

	# Source 1: Tiny Town (packed 192x176, 12x11 tiles, 16x16)
	var town_tex = load("res://assets/kenney/tiny-town/Tilemap/tilemap_packed.png")
	if town_tex:
		var source_town = TileSetAtlasSource.new()
		source_town.texture = town_tex
		source_town.texture_region_size = Vector2i(16, 16)
		for y in range(11):
			for x in range(12):
				source_town.create_tile(Vector2i(x, y))
		var id1 = tileset.add_source(source_town, 1)
		print("Added source 1 (Tiny Town): id =", id1)
	else:
		printerr("Failed to load tiny-town packed tilemap")

	var err = ResourceSaver.save(tileset, "res://assets/tilesets/hakuba_tileset.tres")
	if err == OK:
		print("Successfully saved hakuba_tileset.tres!")
	else:
		printerr("Error saving tileset:", err)

	quit()
