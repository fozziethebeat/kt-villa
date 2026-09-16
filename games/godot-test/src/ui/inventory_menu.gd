extends Control

signal menu_closed()

@onready var background_dim: ColorRect = $BackgroundDim
@onready var main_panel: PanelContainer = $MainPanel
@onready var tab_all: Button = $MainPanel/Margin/VBox/Header/Tabs/TabAll
@onready var tab_consumables: Button = $MainPanel/Margin/VBox/Header/Tabs/TabConsumables
@onready var tab_keys: Button = $MainPanel/Margin/VBox/Header/Tabs/TabKeys
@onready var tab_relics: Button = $MainPanel/Margin/VBox/Header/Tabs/TabRelics
@onready var grid_container: GridContainer = $MainPanel/Margin/VBox/Body/LeftPane/Scroll/GridContainer
@onready var empty_label: Label = $MainPanel/Margin/VBox/Body/LeftPane/EmptyLabel
@onready var count_summary: Label = $MainPanel/Margin/VBox/Header/CountSummary

# Inspector Elements
@onready var inspector_panel: PanelContainer = $MainPanel/Margin/VBox/Body/RightPane/InspectorCard
@onready var inspect_icon: TextureRect = $MainPanel/Margin/VBox/Body/RightPane/InspectorCard/Margin/VBox/IconBox/InspectIcon
@onready var inspect_name: Label = $MainPanel/Margin/VBox/Body/RightPane/InspectorCard/Margin/VBox/InspectName
@onready var inspect_subname: Label = $MainPanel/Margin/VBox/Body/RightPane/InspectorCard/Margin/VBox/InspectSubname
@onready var inspect_category: Label = $MainPanel/Margin/VBox/Body/RightPane/InspectorCard/Margin/VBox/TagBox/CategoryLabel
@onready var inspect_rarity: Label = $MainPanel/Margin/VBox/Body/RightPane/InspectorCard/Margin/VBox/TagBox/RarityLabel
@onready var inspect_lore: Label = $MainPanel/Margin/VBox/Body/RightPane/InspectorCard/Margin/VBox/InspectLore
@onready var inspect_effects: Label = $MainPanel/Margin/VBox/Body/RightPane/InspectorCard/Margin/VBox/EffectsBox/Margin/InspectEffects
@onready var btn_use: Button = $MainPanel/Margin/VBox/Body/RightPane/InspectorCard/Margin/VBox/Actions/BtnUse
@onready var btn_close: Button = $MainPanel/Margin/VBox/Body/RightPane/InspectorCard/Margin/VBox/Actions/BtnClose
@onready var toast_label: Label = $MainPanel/Margin/VBox/Footer/ToastLabel

var current_category: String = "ALL"
var selected_item_data: Dictionary = {}
var selected_slot_index: int = 0
var slot_nodes: Array[Button] = []
var toast_tween: Tween

const TOTAL_SLOTS = 12

func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	visible = false
	toast_label.modulate.a = 0.0

	# Connect tab buttons
	tab_all.pressed.connect(func(): _switch_category("ALL"))
	tab_consumables.pressed.connect(func(): _switch_category("Consumables"))
	tab_keys.pressed.connect(func(): _switch_category("Key Items"))
	tab_relics.pressed.connect(func(): _switch_category("Relics"))

	# Connect action buttons
	btn_use.pressed.connect(_on_use_pressed)
	btn_close.pressed.connect(close_menu)

	# Listen to game inventory changes
	GameManager.inventory_changed.connect(_on_inventory_changed)

func open_menu() -> void:
	visible = true
	get_tree().paused = true
	GameManager.is_menu_active = true
	_refresh_inventory()

	# Open animation
	modulate.a = 0.0
	main_panel.scale = Vector2(0.95, 0.95)
	main_panel.pivot_offset = main_panel.size / 2.0
	var tween = create_tween().set_parallel(true).set_pause_mode(Tween.TWEEN_PAUSE_PROCESS)
	tween.tween_property(self, "modulate:a", 1.0, 0.18).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_OUT)
	tween.tween_property(main_panel, "scale", Vector2(1.0, 1.0), 0.18).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)

func close_menu() -> void:
	var tween = create_tween().set_parallel(true).set_pause_mode(Tween.TWEEN_PAUSE_PROCESS)
	tween.tween_property(self, "modulate:a", 0.0, 0.15)
	tween.tween_property(main_panel, "scale", Vector2(0.96, 0.96), 0.15)
	tween.chain().tween_callback(func():
		visible = false
		get_tree().paused = false
		GameManager.is_menu_active = false
		menu_closed.emit()
	)

func _unhandled_input(event: InputEvent) -> void:
	if not visible:
		return

	if event.is_action_pressed("ui_cancel") or (event is InputEventKey and event.pressed and (event.keycode == KEY_I or event.keycode == KEY_TAB or event.keycode == KEY_ESCAPE)):
		get_viewport().set_input_as_handled()
		close_menu()
		return

	# Q / E for category tab switching
	if event is InputEventKey and event.pressed:
		if event.keycode == KEY_Q:
			get_viewport().set_input_as_handled()
			_cycle_tab(-1)
		elif event.keycode == KEY_E:
			get_viewport().set_input_as_handled()
			_cycle_tab(1)

func _cycle_tab(direction: int) -> void:
	var cats = ["ALL", "Consumables", "Key Items", "Relics"]
	var cur_idx = cats.find(current_category)
	if cur_idx == -1:
		cur_idx = 0
	var next_idx = (cur_idx + direction + cats.size()) % cats.size()
	_switch_category(cats[next_idx])

func _switch_category(cat: String) -> void:
	current_category = cat
	_update_tab_highlights()
	_refresh_inventory()

func _update_tab_highlights() -> void:
	tab_all.theme_type_variation = "FlatButton"
	tab_consumables.theme_type_variation = "FlatButton"
	tab_keys.theme_type_variation = "FlatButton"
	tab_relics.theme_type_variation = "FlatButton"

	# Highlight active
	var active_color = Color(0.9, 0.8, 0.4)
	var idle_color = Color(0.65, 0.7, 0.8)
	tab_all.modulate = active_color if current_category == "ALL" else idle_color
	tab_consumables.modulate = active_color if current_category == "Consumables" else idle_color
	tab_keys.modulate = active_color if current_category == "Key Items" else idle_color
	tab_relics.modulate = active_color if current_category == "Relics" else idle_color

func _refresh_inventory() -> void:
	for child in grid_container.get_children():
		child.queue_free()
	slot_nodes.clear()

	var all_items = GameManager.get_inventory_items()
	var filtered_items: Array[Dictionary] = []

	for item in all_items:
		if current_category == "ALL" or item.get("category") == current_category:
			filtered_items.append(item)

	var total_count = 0
	for it in all_items:
		total_count += it.get("count", 0)
	count_summary.text = "Items: %d / 48" % total_count

	empty_label.visible = filtered_items.is_empty()

	# Create grid slots
	var slot_count = maxi(TOTAL_SLOTS, filtered_items.size())
	for i in range(slot_count):
		var btn = Button.new()
		btn.custom_minimum_size = Vector2(62, 62)
		btn.focus_mode = Control.FOCUS_ALL
		btn.alignment = HORIZONTAL_ALIGNMENT_CENTER

		# Style the slot
		var style = StyleBoxFlat.new()
		style.bg_color = Color(0.08, 0.11, 0.18, 0.85)
		style.border_width_left = 1
		style.border_width_top = 1
		style.border_width_right = 1
		style.border_width_bottom = 1
		style.border_color = Color(0.2, 0.28, 0.4, 0.5)
		style.corner_radius_top_left = 6
		style.corner_radius_top_right = 6
		style.corner_radius_bottom_right = 6
		style.corner_radius_bottom_left = 6
		btn.add_theme_stylebox_override("normal", style)

		# Focus / Hover style
		var hover_style = style.duplicate()
		hover_style.border_color = Color(0.28, 0.79, 0.96, 0.9)
		hover_style.border_width_left = 2
		hover_style.border_width_top = 2
		hover_style.border_width_right = 2
		hover_style.border_width_bottom = 2
		hover_style.bg_color = Color(0.12, 0.18, 0.28, 0.95)
		btn.add_theme_stylebox_override("hover", hover_style)
		btn.add_theme_stylebox_override("focus", hover_style)

		if i < filtered_items.size():
			var item_data = filtered_items[i]
			_populate_slot(btn, item_data)
			btn.pressed.connect(func(): _select_item(item_data, i))
			btn.mouse_entered.connect(func(): _select_item(item_data, i))
		else:
			# Empty slot
			var empty_inner = ColorRect.new()
			empty_inner.color = Color(1, 1, 1, 0.02)
			empty_inner.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
			empty_inner.mouse_filter = Control.MOUSE_FILTER_IGNORE
			btn.add_child(empty_inner)
			btn.disabled = true

		grid_container.add_child(btn)
		slot_nodes.append(btn)

	# Select first available item or clear inspector
	if not filtered_items.is_empty():
		var idx = clampi(selected_slot_index, 0, filtered_items.size() - 1)
		_select_item(filtered_items[idx], idx)
	else:
		_clear_inspector()

func _populate_slot(btn: Button, item: Dictionary) -> void:
	btn.clip_contents = true
	# Icon texture
	var icon_tex = item.get("texture") as Texture2D
	if icon_tex:
		var tex_rect = TextureRect.new()
		tex_rect.texture = icon_tex
		tex_rect.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
		tex_rect.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
		tex_rect.custom_minimum_size = Vector2(32, 32)
		tex_rect.size = Vector2(32, 32)
		tex_rect.position = Vector2(15, 8)
		tex_rect.texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
		tex_rect.mouse_filter = Control.MOUSE_FILTER_IGNORE
		btn.add_child(tex_rect)

	# Count Badge
	var count = item.get("count", 1)
	var badge = Label.new()
	badge.text = "x%d" % count
	badge.add_theme_font_size_override("font_size", 10)
	badge.add_theme_color_override("font_color", Color(0.95, 0.85, 0.5))
	badge.add_theme_constant_override("outline_size", 3)
	badge.add_theme_color_override("font_outline_color", Color(0.04, 0.06, 0.1, 0.95))
	badge.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	badge.vertical_alignment = VERTICAL_ALIGNMENT_BOTTOM
	badge.position = Vector2(4, 42)
	badge.size = Vector2(54, 16)
	badge.mouse_filter = Control.MOUSE_FILTER_IGNORE
	btn.add_child(badge)

func _select_item(item: Dictionary, slot_idx: int) -> void:
	selected_item_data = item
	selected_slot_index = slot_idx

	# Update Slot Visual Highlights
	for i in range(slot_nodes.size()):
		var slot = slot_nodes[i]
		if i == slot_idx:
			slot.grab_focus()

	# Populate Inspector
	inspect_name.text = item.get("name", "Unknown Item")
	inspect_subname.text = item.get("japanese_name", "")
	inspect_category.text = "📁 %s" % item.get("category", "General")
	inspect_rarity.text = "✨ %s" % item.get("rarity", "Common")
	inspect_lore.text = item.get("lore", "No description available.")
	inspect_effects.text = item.get("effects_text", "No special effects.")

	var tex = item.get("texture") as Texture2D
	inspect_icon.texture = tex

	var can_use = item.get("can_use", false)
	btn_use.visible = can_use
	if can_use:
		btn_use.text = "🍴 %s" % item.get("use_verb", "Use Item")

func _clear_inspector() -> void:
	selected_item_data = {}
	inspect_name.text = "No Item Selected"
	inspect_subname.text = ""
	inspect_category.text = "Pouch Empty"
	inspect_rarity.text = "Explore Hakuba"
	inspect_lore.text = "Walk around the village to discover wild apples, hot spring tea, ski passes, and lucky shrine charms!"
	inspect_effects.text = "Items will appear here once collected."
	inspect_icon.texture = null
	btn_use.visible = false

func _on_use_pressed() -> void:
	if selected_item_data.is_empty():
		return

	var item_name = selected_item_data.get("name", "")
	var res = GameManager.use_item(item_name)
	if res.get("success", false):
		_show_toast(res.get("message", "Item used!"))
		# Subtle bounce tween on inspector icon
		var icon_tween = create_tween().set_pause_mode(Tween.TWEEN_PAUSE_PROCESS)
		icon_tween.tween_property(inspect_icon, "scale", Vector2(1.2, 1.2), 0.1).set_trans(Tween.TRANS_BACK)
		icon_tween.tween_property(inspect_icon, "scale", Vector2(1.0, 1.0), 0.15)
	else:
		_show_toast(res.get("message", "Cannot use item."))

func _show_toast(text: String) -> void:
	toast_label.text = text
	if toast_tween:
		toast_tween.kill()
	toast_tween = create_tween().set_pause_mode(Tween.TWEEN_PAUSE_PROCESS)
	toast_tween.tween_property(toast_label, "modulate:a", 1.0, 0.15)
	toast_tween.tween_interval(2.5)
	toast_tween.tween_property(toast_label, "modulate:a", 0.0, 0.4)

func _on_inventory_changed() -> void:
	if visible:
		_refresh_inventory()
