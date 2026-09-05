extends CanvasLayer

@onready var location_label: Label = $TopBar/MarginContainer/HBoxContainer/LocationLabel
@onready var inventory_label: Label = $TopBar/MarginContainer/HBoxContainer/InventoryLabel
@onready var warning_panel: PanelContainer = $WarningPanel
@onready var warning_label: Label = $WarningPanel/MarginContainer/WarningLabel
@onready var dialogue_panel: PanelContainer = $DialoguePanel
@onready var speaker_label: Label = $DialoguePanel/MarginContainer/VBoxContainer/SpeakerLabel
@onready var text_label: Label = $DialoguePanel/MarginContainer/VBoxContainer/TextLabel

var warning_tween: Tween

func _ready() -> void:
	warning_panel.visible = false
	dialogue_panel.visible = false
	_update_inventory_display()
	
	GameManager.item_collected.connect(_on_item_collected)
	GameManager.enemy_proximity_changed.connect(_on_enemy_proximity_changed)
	GameManager.dialogue_started.connect(_on_dialogue_started)
	GameManager.dialogue_ended.connect(_on_dialogue_ended)

func _update_inventory_display() -> void:
	var apples = GameManager.get_item_count("Nagano Apple")
	var passes = GameManager.get_item_count("Ski Pass")
	var tea = GameManager.get_item_count("Onsen Tea")
	var charms = GameManager.get_item_count("Lucky Charm")
	inventory_label.text = "🍎 x%d  |  🎿 x%d  |  🍵 x%d  |  ⛩️ x%d" % [apples, passes, tea, charms]

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
