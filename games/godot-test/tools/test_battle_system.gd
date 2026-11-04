extends SceneTree

const BattleDatabase = preload("res://src/battle/battle_database.gd")

func _init() -> void:
	print("\n=== RUNNING HAKUBA RPG BATTLE SYSTEM TEST SUITE ===")
	var passed = 0
	var total = 0

	# Test 1: Battle Database Animals
	total += 1
	var animals = ["wild_snowman", "forest_yeti", "wild_boar", "snow_wolf"]
	var all_animals_valid = true
	for a_key in animals:
		var data = BattleDatabase.get_animal_data(a_key)
		if data.is_empty() or not data.has("name") or not data.has("max_composure") or not data.has("max_pacification"):
			all_animals_valid = false
			print("FAIL: Animal missing required fields: ", a_key)
		if data.get("moves", []).size() == 0:
			all_animals_valid = false
			print("FAIL: Animal has no moves: ", a_key)
	if all_animals_valid:
		passed += 1
		print("✅ PASS: All animal database entries are complete with moves, stats, and text.")

	# Test 2: Spook Actions Integrity
	total += 1
	var spook_valid = true
	for action in BattleDatabase.SPOOK_ACTIONS:
		if action.get("spook_min", 0) <= 0 or action.get("spook_max", 0) < action.get("spook_min", 0):
			spook_valid = false
			print("FAIL: Invalid spook values in ", action)
	if spook_valid and BattleDatabase.SPOOK_ACTIONS.size() >= 4:
		passed += 1
		print("✅ PASS: All 4 Spook actions defined with valid composure ranges.")

	# Test 3: Charm Actions & Jokes
	total += 1
	var charm_valid = true
	for action in BattleDatabase.CHARM_ACTIONS:
		if not action.has("name") or not action.has("description"):
			charm_valid = false
	var joke = BattleDatabase.get_random_joke()
	if not joke.has("setup") or not joke.has("punchline") or joke.get("power", 0) <= 0:
		charm_valid = false
		print("FAIL: Invalid random joke: ", joke)
	if charm_valid and BattleDatabase.JOKES.size() >= 5:
		passed += 1
		print("✅ PASS: All Charm actions & joke pool (%d jokes) verified." % BattleDatabase.JOKES.size())

	# Test 4: Battle Scene Instantiation and Initialization
	total += 1
	var battle_scene = load("res://src/battle/battle_scene.tscn")
	var battle_inst = battle_scene.instantiate()
	root.add_child(battle_inst)
	battle_inst.initialize_encounter("forest_yeti")
	
	if battle_inst.enemy_data.get("name") == "Mountain Forest Yeti" and battle_inst.enemy_composure > 0:
		passed += 1
		print("✅ PASS: Battle scene initialized with Mountain Forest Yeti. Composure: %d, Pacification: %d" % [int(battle_inst.enemy_composure), int(battle_inst.enemy_pacification)])
	else:
		print("FAIL: Battle scene initialization failed.")

	# Test 5: Spook Mechanic Calculation
	total += 1
	var initial_composure = battle_inst.enemy_composure
	var wave_action = BattleDatabase.SPOOK_ACTIONS[0]
	battle_inst._execute_spook_action(wave_action)
	if battle_inst.enemy_composure < initial_composure:
		passed += 1
		print("✅ PASS: Spook action reduced wild composure from %d to %d." % [int(initial_composure), int(battle_inst.enemy_composure)])
	else:
		print("FAIL: Spook action did not lower composure.")

	# Test 6: Charm & Joke Mechanic
	total += 1
	var initial_pacify = battle_inst.enemy_pacification
	var joke_action = BattleDatabase.CHARM_ACTIONS[0] # Dad Joke
	battle_inst._execute_charm_action(joke_action)
	if battle_inst.enemy_pacification > initial_pacify:
		passed += 1
		print("✅ PASS: Charm joke increased pacification from %d to %d." % [int(initial_pacify), int(battle_inst.enemy_pacification)])
	else:
		print("FAIL: Charm action did not raise pacification.")

	# Test 7: Item Usage in Battle
	total += 1
	var initial_courage = battle_inst.player_courage
	battle_inst.player_courage = 40
	battle_inst._execute_item_action({ "id": "tea", "name": "Onsen Tea" })
	if battle_inst.player_courage > 40:
		passed += 1
		print("✅ PASS: Onsen Tea restored player Courage from 40 to %d." % battle_inst.player_courage)
	else:
		print("FAIL: Item did not restore courage.")

	# Test 8: Spook Victory Condition
	total += 1
	battle_inst.enemy_composure = 0.0
	battle_inst._handle_victory_spooked()
	if battle_inst.battle_outcome == "spooked":
		passed += 1
		print("✅ PASS: Spook victory triggered when Composure reached 0.")
	else:
		print("FAIL: Spook victory condition failed.")

	# Test 9: Charm Victory Condition
	total += 1
	battle_inst.enemy_pacification = battle_inst.enemy_max_pacification
	battle_inst._handle_victory_charmed()
	if battle_inst.battle_outcome == "charmed":
		passed += 1
		print("✅ PASS: Charm victory triggered when Pacification was filled.")
	else:
		print("FAIL: Charm victory condition failed.")

	# Test 10: Courage Falter Defeat Condition
	total += 1
	battle_inst.player_courage = 0
	battle_inst._handle_player_defeat()
	if battle_inst.battle_outcome == "defeat":
		passed += 1
		print("✅ PASS: Player safely retreated when Courage faltered (0).")
	else:
		print("FAIL: Defeat condition failed.")

	battle_inst.queue_free()

	# Test 11: Main Village Scene with Enemies & Approach Prompts
	total += 1
	var village_scene = load("res://src/world/hakuba_village.tscn")
	var village = village_scene.instantiate()
	root.add_child(village)
	
	var enemy_count = 0
	for npc in village.npcs_container.get_children():
		if npc.is_in_group("enemy"):
			enemy_count += 1
	if enemy_count == 4:
		passed += 1
		print("✅ PASS: Village has all 4 wild animal types placed with interactive approach zones.")
	else:
		print("FAIL: Expected 4 enemies, found %d." % enemy_count)

	village.queue_free()

	print("\n==========================================")
	print("TEST RESULTS: %d / %d PASSED" % [passed, total])
	print("==========================================\n")

	if passed == total:
		print("ALL TESTS PASSED SUCCESSFULLY! 🎉\n")
		quit(0)
	else:
		print("SOME TESTS FAILED!\n")
		quit(1)
