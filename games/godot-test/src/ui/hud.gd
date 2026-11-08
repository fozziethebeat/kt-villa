extends CanvasLayer

const VanOverlayScript = preload("res://src/ui/van_interior_overlay.gd")
const ValleyMapScript = preload("res://src/ui/valley_map_overlay.gd")
const PuzzleOverlayScript = preload("res://src/ui/regional_puzzle_overlay.gd")

@onready var top_hbox: HBoxContainer = $TopBar/MarginContainer/HBoxContainer
@onready var location_label: Label = $TopBar/MarginContainer/HBoxContainer/LocationLabel
@onready var inventory_label: Label = $TopBar/MarginContainer/HBoxContainer/InventoryLabel
@onready var btn_season: Button = $TopBar/MarginContainer/HBoxContainer/BtnSeason
@onready var btn_pouch: Button = $TopBar/MarginContainer/HBoxContainer/BtnPouch
@onready var warning_panel: PanelContainer = $WarningPanel
@onready var warning_label: Label = $WarningPanel/MarginContainer/WarningLabel
@onready var dialogue_panel: PanelContainer = $DialoguePanel
@onready var speaker_label: Label = $DialoguePanel/MarginContainer/VBoxContainer/SpeakerLabel
@onready var text_label: Label = $DialoguePanel/MarginContainer/VBoxContainer/TextLabel
@onready var encounter_panel: PanelContainer = $EncounterPanel
@onready var encounter_title: Label = $EncounterPanel/Margin/VBox/Title
@onready var encounter_desc: Label = $EncounterPanel/Margin/VBox/Desc
@onready var btn_engage: Button = $EncounterPanel/Margin/VBox/Buttons/BtnEngage
@onready var btn_leave: Button = $EncounterPanel/Margin/VBox/Buttons/BtnLeave
@onready var controls_footer: Label = $ControlsFooter
@onready var inventory_menu: Control = $InventoryMenu

var van_overlay: Control
var map_overlay: Control
var puzzle_overlay: Control
var btn_van: Button
var btn_map: Button

var warning_tween: Tween
var encounter_tween: Tween
var active_encounter_data: Dictionary = {}
var active_critter_node: Node = null

func _ready() -> void:
	warning_panel.visible = false
	dialogue_panel.visible = false
	encounter_panel.visible = false

	# Add Van & Map buttons to the TopBar
	btn_van = Button.new()
	btn_van.text = "🚐 Van Shop (V)"
	btn_van.add_theme_font_size_override("font_size", 11)
	btn_van.pressed.connect(toggle_van_overlay)
	top_hbox.add_child(btn_van)
	top_hbox.move_child(btn_van, btn_season.get_index())

	btn_map = Button.new()
	btn_map.text = "🗺️ Valley Map (M)"
	btn_map.add_theme_font_size_override("font_size", 11)
	btn_map.pressed.connect(toggle_map_overlay)
	top_hbox.add_child(btn_map)
	top_hbox.move_child(btn_map, btn_season.get_index())

	if controls_footer:
		controls_footer.text = "Move: WASD/Arrows | Interact: E | Van & Shop: V | Valley Map: M | Pouch: I | Season: T"

	# Instantiate Cozy Overlays
	van_overlay = VanOverlayScript.new()
	add_child(van_overlay)

	map_overlay = ValleyMapScript.new()
	add_child(map_overlay)

	puzzle_overlay = PuzzleOverlayScript.new()
	add_child(puzzle_overlay)

	btn_season.pressed.connect(func(): GameManager.toggle_season())
	btn_pouch.pressed.connect(toggle_inventory)
	btn_engage.pressed.connect(_on_engage_pressed)
	btn_leave.pressed.connect(_on_leave_pressed)

	GameManager.item_collected.connect(_on_item_collected)
	GameManager.item_used.connect(_on_item_used)
	GameManager.inventory_changed.connect(_update_hud_labels)
	GameManager.currency_changed.connect(func(_y, _w): _update_hud_labels())
	GameManager.time_changed.connect(func(_d, _p): _update_hud_labels())
	GameManager.region_changed.connect(func(_r): _update_hud_labels())
	GameManager.region_stage_updated.connect(func(_r, _s): _update_hud_labels())
	GameManager.van_updated.connect(_update_hud_labels)
	GameManager.dialogue_started.connect(_on_dialogue_started)
	GameManager.dialogue_ended.connect(_on_dialogue_ended)
	GameManager.encounter_prompt_requested.connect(_on_encounter_prompt_requested)
	GameManager.encounter_prompt_closed.connect(_on_encounter_prompt_closed)
	GameManager.season_changed.connect(func(_s): _update_hud_labels())
	GameManager.toast_requested.connect(_show_cozy_toast)
	GameManager.puzzle_requested.connect(func(reg_id: String): puzzle_overlay.open_puzzle(reg_id))

	_update_hud_labels()

func _update_hud_labels() -> void:
	var reg = GameManager.get_current_region_data()
	var stage = GameManager.get_region_stage()
	var stage_badge = "🌸 Restored" if stage >= 3 else "Stage %d/3" % (stage + 1)
	var season_icon = "🌿" if GameManager.current_season == "green" else "🏔️"
	location_label.text = "%s %d/10 %s (%s) [%s]" % [
		season_icon,
		int(reg.get("index", 1)),
		reg.get("name", "Hakuba"),
		reg.get("japanese_name", ""),
		stage_badge
	]
	btn_season.text = "🌿 Green (T)" if GameManager.current_season == "green" else "❄️ Winter (T)"

	var time_short = "🌅 Morn"
	match GameManager.time_of_day:
		"afternoon": time_short = "☀️ Aft"
		"evening": time_short = "🏮 Eve"
		"night": time_short = "🌙 Night"

	inventory_label.text = "Day %d %s  |  💴 ¥%d  |  🔥 %d  |  🛎️ Rack %d/%d" % [
		GameManager.current_day,
		time_short,
		GameManager.player_yen,
		GameManager.valley_warmth,
		GameManager.window_display_rack.size(),
		GameManager.get_max_display_slots()
	]

func _unhandled_input(event: InputEvent) -> void:
	if encounter_panel.visible:
		if event.is_action_pressed("ui_cancel") or (event is InputEventKey and event.pressed and event.keycode == KEY_ESCAPE):
			get_viewport().set_input_as_handled()
			_on_leave_pressed()
			return
		elif event.is_action_pressed("interact") or event.is_action_pressed("ui_accept"):
			get_viewport().set_input_as_handled()
			_on_engage_pressed()
			return

	if event is InputEventKey and event.pressed and not event.echo:
		if event.keycode == KEY_I or event.keycode == KEY_TAB:
			get_viewport().set_input_as_handled()
			toggle_inventory()
		elif event.keycode == KEY_V:
			get_viewport().set_input_as_handled()
			toggle_van_overlay()
		elif event.keycode == KEY_M:
			get_viewport().set_input_as_handled()
			toggle_map_overlay()

func toggle_van_overlay() -> void:
	if GameManager.is_dialogue_active or GameManager.is_encounter_prompt_active:
		return
	if map_overlay.visible:
		map_overlay.close_map()
	if inventory_menu.visible:
		inventory_menu.close_menu()
	if puzzle_overlay.visible:
		puzzle_overlay.close_puzzle()
	if van_overlay.visible:
		van_overlay.close_van_overlay()
	else:
		van_overlay.open_van_overlay()

func toggle_map_overlay() -> void:
	if GameManager.is_dialogue_active or GameManager.is_encounter_prompt_active:
		return
	if van_overlay.visible:
		van_overlay.close_van_overlay()
	if inventory_menu.visible:
		inventory_menu.close_menu()
	if puzzle_overlay.visible:
		puzzle_overlay.close_puzzle()
	if map_overlay.visible:
		map_overlay.close_map()
	else:
		map_overlay.open_map()

func toggle_inventory() -> void:
	if GameManager.is_dialogue_active or GameManager.is_encounter_prompt_active:
		return
	if van_overlay.visible:
		van_overlay.close_van_overlay()
	if map_overlay.visible:
		map_overlay.close_map()
	if puzzle_overlay.visible:
		puzzle_overlay.close_puzzle()
	if inventory_menu.visible:
		inventory_menu.close_menu()
	else:
		inventory_menu.open_menu()

func _on_item_used(_item_name: String, _remaining: int, _msg: String) -> void:
	_update_hud_labels()

func _on_item_collected(item_name: String, count: int, _icon: Texture2D) -> void:
	_update_hud_labels()
	_show_cozy_toast("🎒 Collected %s (Total: %d)" % [item_name, count], Color(0.75, 0.95, 0.78))

func _show_cozy_toast(message: String, col: Color = Color(1, 0.92, 0.45)) -> void:
	warning_label.text = message
	warning_label.add_theme_color_override("font_color", col)
	warning_panel.visible = true
	warning_panel.modulate.a = 0.0
	if warning_tween:
		warning_tween.kill()
	warning_tween = create_tween()
	warning_tween.tween_property(warning_panel, "modulate:a", 1.0, 0.18)
	warning_tween.tween_interval(3.2)
	warning_tween.tween_property(warning_panel, "modulate:a", 0.0, 0.3)
	warning_tween.chain().tween_callback(func(): warning_panel.visible = false)

func _on_dialogue_started(speaker: String, text: String) -> void:
	speaker_label.text = speaker
	text_label.text = text
	dialogue_panel.visible = true
	dialogue_panel.modulate.a = 0.0
	var tween = create_tween()
	tween.tween_property(dialogue_panel, "modulate:a", 1.0, 0.15)

func _on_dialogue_ended() -> void:
	var tween = create_tween()
	tween.tween_property(dialogue_panel, "modulate:a", 0.0, 0.15)
	tween.chain().tween_callback(func(): dialogue_panel.visible = false)

func _on_encounter_prompt_requested(data: Dictionary, enemy_node: Node) -> void:
	active_encounter_data = data
	active_critter_node = enemy_node
	var animal_name = data.get("name", "Mountain Critter")
	var want = data.get("want_item", "Nagano Apple")
	var reward = data.get("reward_item", "Wooden Trail Plaque")
	var have_want = GameManager.get_item_count(want)

	encounter_title.text = "🐾 Befriend & Trade with %s" % animal_name
	encounter_desc.text = "%s\n\n🎁 Critter is holding: [%s]\n🍎 Preferred Treat: %s (You have: %d)" % [
		data.get("dialogue", "A friendly mountain critter approaches!"),
		reward,
		want,
		have_want
	]
	if have_want > 0:
		btn_engage.text = "🍎 Trade 1 %s (E)" % want
	else:
		btn_engage.text = "🙇 Polite Mountain Bow (E)"

	encounter_panel.visible = true
	encounter_panel.modulate.a = 0.0
	encounter_panel.scale = Vector2(0.95, 0.95)
	encounter_panel.pivot_offset = encounter_panel.size / 2.0

	if encounter_tween:
		encounter_tween.kill()
	encounter_tween = create_tween().set_parallel(true)
	encounter_tween.tween_property(encounter_panel, "modulate:a", 1.0, 0.15)
	encounter_tween.tween_property(encounter_panel, "scale", Vector2.ONE, 0.15)
	btn_engage.grab_focus()

func _on_encounter_prompt_closed() -> void:
	if encounter_panel.visible:
		if encounter_tween:
			encounter_tween.kill()
		encounter_tween = create_tween().set_parallel(true)
		encounter_tween.tween_property(encounter_panel, "modulate:a", 0.0, 0.12)
		encounter_tween.tween_property(encounter_panel, "scale", Vector2(0.95, 0.95), 0.12)
		encounter_tween.chain().tween_callback(func(): encounter_panel.visible = false)

func _on_engage_pressed() -> void:
	var data = active_encounter_data.duplicate()
	var critter = active_critter_node
	GameManager.close_encounter_prompt()

	var want = data.get("want_item", "Nagano Apple")
	var reward = data.get("reward_item", "Wooden Trail Plaque")
	if GameManager.get_item_count(want) > 0:
		GameManager.remove_item(want, 1)

	GameManager.add_item(reward)
	GameManager.add_currency(15, 5)
	if critter and is_instance_valid(critter) and critter.has_method("on_charmed"):
		critter.on_charmed()
	_show_cozy_toast("💖 Befriended %s! Received +1 [%s] & +5🔥!" % [data.get("name", "Critter"), reward], Color(1.0, 0.88, 0.4))

func _on_leave_pressed() -> void:
	GameManager.close_encounter_prompt()
