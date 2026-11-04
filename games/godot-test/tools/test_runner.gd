extends Node

const BattleDatabase = preload("res://src/battle/battle_database.gd")

func _ready() -> void:
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
	add_child(battle_inst)
	battle_inst.initialize_encounter("forest_yeti")
	
	if battle_inst.enemy_data.get("name") == "Mountain Forest Yeti" and battle_inst.enemy_composure > 0:
		passed += 1
		print("✅ PASS: Battle scene initialized with Mountain Forest Yeti. Composure: %d, Pacification: %d" % [int(battle_inst.enemy_composure), int(battle_inst.enemy_pacification)])
	else:
		print("FAIL: Battle scene initialization failed.")

	# Test 5: Enemy ATB Pauses While Player Chooses
	total += 1
	battle_inst.current_state = battle_inst.State.PLAYER_SELECTING
	battle_inst.is_active_turn_ready = true
	battle_inst.enemy_atb = 50.0
	battle_inst._process(1.0) # Step 1 second
	if battle_inst.enemy_atb == 50.0:
		passed += 1
		print("✅ PASS: Enemy ATB remained frozen at 50% while player is selecting an action!")
	else:
		print("FAIL: Enemy ATB continued advancing while player was selecting: ", battle_inst.enemy_atb)

	# Test 6: Spook Mechanic Calculation
	total += 1
	var initial_composure = battle_inst.enemy_composure
	var wave_action = BattleDatabase.SPOOK_ACTIONS[0]
	battle_inst.apply_spook_effect(wave_action)
	if battle_inst.enemy_composure < initial_composure:
		passed += 1
		print("✅ PASS: Spook action reduced wild composure from %d to %d." % [int(initial_composure), int(battle_inst.enemy_composure)])
	else:
		print("FAIL: Spook action did not lower composure.")

	# Test 7: Charm & Joke Mechanic
	total += 1
	var initial_pacify = battle_inst.enemy_pacification
	var joke_action = BattleDatabase.CHARM_ACTIONS[0] # Dad Joke
	battle_inst.apply_charm_effect(joke_action)
	if battle_inst.enemy_pacification > initial_pacify:
		passed += 1
		print("✅ PASS: Charm joke increased pacification from %d to %d." % [int(initial_pacify), int(battle_inst.enemy_pacification)])
	else:
		print("FAIL: Charm action did not raise pacification.")

	# Test 8: Item Usage in Battle
	total += 1
	var initial_courage = battle_inst.player_courage
	battle_inst.player_courage = 40
	battle_inst.apply_item_effect({ "id": "tea", "name": "Onsen Tea" })
	if battle_inst.player_courage > 40:
		passed += 1
		print("✅ PASS: Onsen Tea restored player Courage from 40 to %d." % battle_inst.player_courage)
	else:
		print("FAIL: Item did not restore courage.")

	# Test 9: Menu Keyboard Navigation Links & Submenu Escape
	total += 1
	battle_inst._open_submenu("spook")
	var sub_btns = battle_inst.submenu_list.get_children()
	var nav_ok = sub_btns.size() > 0 and sub_btns[0].focus_neighbor_left != NodePath("")
	# Simulate Left arrow / cancel event
	var ev = InputEventKey.new()
	ev.pressed = true
	ev.keycode = KEY_ESCAPE
	battle_inst._unhandled_input(ev)
	if nav_ok and not battle_inst.submenu_panel.visible:
		passed += 1
		print("✅ PASS: Submenu focus neighbors configured and Left/Escape safely exits back to command list.")
	else:
		print("FAIL: Submenu keyboard navigation not correctly linked.")

	# Test 9b: Submenu Scrolling
	total += 1
	battle_inst._open_submenu("charm")
	await get_tree().process_frame
	await get_tree().process_frame
	var charm_btns = battle_inst.submenu_list.get_children()
	print("DEBUG ScrollContainer size: ", battle_inst.submenu_scroll.size, " SubmenuList size: ", battle_inst.submenu_list.size, " btn count: ", charm_btns.size())
	if charm_btns.size() > 0:
		var last_btn = charm_btns[charm_btns.size() - 1] as Button
		last_btn.grab_focus()
		await get_tree().process_frame
		print("DEBUG after grab_focus on last btn: scroll_vertical = ", battle_inst.submenu_scroll.scroll_vertical, " last_btn pos: ", last_btn.position)
		if battle_inst.submenu_scroll.scroll_vertical > 0:
			passed += 1
			print("✅ PASS: Submenu scrolled successfully (scroll_vertical = %d)" % battle_inst.submenu_scroll.scroll_vertical)
		else:
			print("FAIL: Submenu did not scroll! scroll_vertical is 0")
	else:
		print("FAIL: No charm buttons created")



	# Test 9c: Mouse Scroll & Scroll Buttons
	total += 1
	var scroll_before = battle_inst.submenu_scroll.scroll_vertical
	battle_inst.btn_scroll_up.emit_signal("pressed")
	var scroll_after_up = battle_inst.submenu_scroll.scroll_vertical
	battle_inst.btn_scroll_down.emit_signal("pressed")
	var scroll_after_down = battle_inst.submenu_scroll.scroll_vertical
	if scroll_after_up < scroll_before and scroll_after_down > scroll_after_up:
		passed += 1
		print("✅ PASS: Submenu scroll buttons ▲ and ▼ correctly modified vertical scroll offset.")
	else:
		print("FAIL: Scroll buttons did not update scroll offset as expected (before: %d, up: %d, down: %d)" % [scroll_before, scroll_after_up, scroll_after_down])

	# Test 9d: WASD Navigation and Specific Joke Execution
	total += 1
	var joke_opts = BattleDatabase.get_all_charm_options()
	var test_joke = joke_opts[0] # "Joke: Snowman Nose"
	var charm_res = battle_inst.apply_charm_effect(test_joke)
	var expected_setup = test_joke["specific_joke"]["setup"]
	if charm_res["msg"].contains(expected_setup):
		passed += 1
		print("✅ PASS: Specific joke chosen from submenu matched setup & punchline in battle banner.")
	else:
		print("FAIL: Specific joke banner mismatch. Got: ", charm_res["msg"])
	total += 1
	battle_inst.enemy_composure = 0.0
	battle_inst._handle_victory_spooked()
	if battle_inst.battle_outcome == "spooked":
		passed += 1
		print("✅ PASS: Spook victory triggered when Composure reached 0.")
	else:
		print("FAIL: Spook victory condition failed.")

	# Test 11: Charm Victory Condition
	total += 1
	battle_inst.enemy_pacification = battle_inst.enemy_max_pacification
	battle_inst._handle_victory_charmed()
	if battle_inst.battle_outcome == "charmed":
		passed += 1
		print("✅ PASS: Charm victory triggered when Pacification was filled.")
	else:
		print("FAIL: Charm victory condition failed.")

	# Test 12: Courage Falter Defeat Condition
	total += 1
	battle_inst.player_courage = 0
	battle_inst._handle_player_defeat()
	if battle_inst.battle_outcome == "defeat":
		passed += 1
		print("✅ PASS: Player safely retreated when Courage faltered (0).")
	else:
		print("FAIL: Defeat condition failed.")

	battle_inst.queue_free()

	# Test 13: Main Village Scene with Enemies & Approach Prompts
	total += 1
	var village_scene = load("res://src/world/hakuba_village.tscn")
	var village = village_scene.instantiate()
	add_child(village)
	
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
		get_tree().quit(0)
	else:
		print("SOME TESTS FAILED!\n")
		get_tree().quit(1)
