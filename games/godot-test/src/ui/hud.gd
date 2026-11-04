extends CanvasLayer

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
@onready var inventory_menu: Control = $InventoryMenu

var warning_tween: Tween
var encounter_tween: Tween
var active_encounter_data: Dictionary = {}

func _ready() -> void:
	warning_panel.visible = false
	dialogue_panel.visible = false
	encounter_panel.visible = false
	_update_inventory_display()
	_update_season_display()
	
	btn_season.pressed.connect(func(): GameManager.toggle_season())
	btn_pouch.pressed.connect(toggle_inventory)
	btn_engage.pressed.connect(_on_engage_pressed)
	btn_leave.pressed.connect(_on_leave_pressed)
	
	GameManager.item_collected.connect(_on_item_collected)
	GameManager.item_used.connect(_on_item_used)
	GameManager.enemy_proximity_changed.connect(_on_enemy_proximity_changed)
	GameManager.dialogue_started.connect(_on_dialogue_started)
	GameManager.dialogue_ended.connect(_on_dialogue_ended)
	GameManager.encounter_prompt_requested.connect(_on_encounter_prompt_requested)
	GameManager.encounter_prompt_closed.connect(_on_encounter_prompt_closed)
	GameManager.season_changed.connect(func(_s): _update_season_display())

func _update_season_display() -> void:
	if GameManager.current_season == "green":
		btn_season.text = "🌿 Green Season (T)"
		location_label.text = "🌿 Hakuba Village — Green Season"
	else:
		btn_season.text = "❄️ Winter Season (T)"
		location_label.text = "🏔️ Hakuba Village — Winter"

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

func toggle_inventory() -> void:
	if GameManager.is_dialogue_active or GameManager.is_encounter_prompt_active or GameManager.is_in_battle:
		return
	if inventory_menu.visible:
		inventory_menu.close_menu()
	else:
		inventory_menu.open_menu()

func _on_item_used(_item_name: String, _remaining: int, _msg: String) -> void:
	_update_inventory_display()

func _update_inventory_display() -> void:
	var apples = GameManager.get_item_count("Nagano Apple")
	var passes = GameManager.get_item_count("Ski Pass")
	var tea = GameManager.get_item_count("Onsen Tea")
	var charms = GameManager.get_item_count("Lucky Charm")
	var courage = GameManager.player_courage
	var max_c = GameManager.player_max_courage
	inventory_label.text = "💛 Courage: %d/%d  |  🍎 x%d  🎿 x%d  🍵 x%d  ⛩️ x%d" % [courage, max_c, apples, passes, tea, charms]

func _on_item_collected(_item_name: String, _count: int, _icon: Texture2D) -> void:
	_update_inventory_display()

func _on_enemy_proximity_changed(enemy_name: String, is_close: bool, distance: float) -> void:
	if is_close:
		warning_label.text = "⚠️ CAUTION: %s is nearby! (Dist: %.0fpx)" % [enemy_name, distance]
		if not warning_panel.visible:
			warning_panel.visible = true
			warning_panel.modulate.a = 0.0
			if warning_tween:
				warning_tween.kill()
			warning_tween = create_tween()
			warning_tween.tween_property(warning_panel, "modulate:a", 1.0, 0.2)
	else:
		if warning_panel.visible:
			if warning_tween:
				warning_tween.kill()
			warning_tween = create_tween()
			warning_tween.tween_property(warning_panel, "modulate:a", 0.0, 0.2)
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

func _on_encounter_prompt_requested(data: Dictionary, _enemy_node: Node) -> void:
	active_encounter_data = data
	var animal_name = data.get("name", "Wild Animal")
	encounter_title.text = "🐾 Approach %s?" % animal_name
	encounter_desc.text = "The %s is standing in the snow drifts watching your movements. Would you like to approach and begin a side-view encounter?" % animal_name
	
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
	GameManager.close_encounter_prompt()
	var p = get_tree().get_first_node_in_group("player")
	if p and p is Node2D:
		GameManager.player_world_position = p.global_position
	GameManager.start_battle(data)

func _on_leave_pressed() -> void:
	GameManager.close_encounter_prompt()
