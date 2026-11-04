extends Control

## Classic Final Fantasy style side-view battle system with Active Time Battle (ATB) gauge,
## non-violent action mechanics (Spook, Charm/Jokes, Items), and a Courage meter.

signal battle_completed(outcome: String, enemy_data: Dictionary)

const BattleDatabase = preload("res://src/battle/battle_database.gd")

# Battle States
enum State { INTRO, ACTIVE, PLAYER_SELECTING, EXECUTING_ACTION, ENEMY_TURN, VICTORY, DEFEAT }
var current_state: State = State.INTRO

# Combatants Data
var enemy_data: Dictionary = {}
var player_courage: int = 85
var player_max_courage: int = 100
var player_atb: float = 25.0
var player_speed: float = 32.0

var enemy_composure: float = 100.0
var enemy_max_composure: float = 100.0
var enemy_pacification: float = 0.0
var enemy_max_pacification: float = 100.0
var enemy_atb: float = 10.0
var enemy_speed: float = 22.0
var enemy_anim_frames: Array[Texture2D] = []
var enemy_anim_fps: float = 4.0
var enemy_anim_timer: float = 0.0

# UI & Node References
@onready var background: Control = $Background
@onready var snow_particles: CPUParticles2D = $SnowParticles
@onready var enemy_anchor: Node2D = $Arena/EnemyAnchor
@onready var enemy_sprite: Sprite2D = $Arena/EnemyAnchor/EnemySprite
@onready var player_anchor: Node2D = $Arena/PlayerAnchor
@onready var player_sprite: Sprite2D = $Arena/PlayerAnchor/PlayerSprite

# Floating text container
@onready var fx_container: Control = $FXContainer

# Top Status Banners
@onready var enemy_name_label: Label = $TopUI/EnemyPanel/VBox/EnemyName
@onready var enemy_title_label: Label = $TopUI/EnemyPanel/VBox/EnemyTitle
@onready var composure_bar: ProgressBar = $TopUI/EnemyPanel/VBox/ComposureRow/ComposureBar
@onready var composure_label: Label = $TopUI/EnemyPanel/VBox/ComposureRow/ComposureLabel
@onready var pacify_bar: ProgressBar = $TopUI/EnemyPanel/VBox/PacifyRow/PacifyBar
@onready var pacify_label: Label = $TopUI/EnemyPanel/VBox/PacifyRow/PacifyLabel
@onready var enemy_atb_bar: ProgressBar = $TopUI/EnemyPanel/VBox/EnemyATBRow/EnemyATBBar

@onready var message_banner: PanelContainer = $TopUI/MessageBanner
@onready var message_label: Label = $TopUI/MessageBanner/Margin/MessageLabel

# Classic FF Bottom Window
@onready var bottom_hud: PanelContainer = $BottomHUD
@onready var cmd_list: VBoxContainer = $BottomHUD/Margin/HBox/CommandPanel/Margin/CmdList
@onready var btn_spook: Button = $BottomHUD/Margin/HBox/CommandPanel/Margin/CmdList/BtnSpook
@onready var btn_charm: Button = $BottomHUD/Margin/HBox/CommandPanel/Margin/CmdList/BtnCharm
@onready var btn_item: Button = $BottomHUD/Margin/HBox/CommandPanel/Margin/CmdList/BtnItem
@onready var btn_flee: Button = $BottomHUD/Margin/HBox/CommandPanel/Margin/CmdList/BtnFlee

@onready var submenu_panel: PanelContainer = $BottomHUD/Margin/HBox/SubmenuPanel
@onready var submenu_scroll: ScrollContainer = $BottomHUD/Margin/HBox/SubmenuPanel/Margin/VBox/Scroll
@onready var submenu_title: Label = $BottomHUD/Margin/HBox/SubmenuPanel/Margin/VBox/HeaderHBox/SubmenuTitle
@onready var btn_scroll_up: Button = $BottomHUD/Margin/HBox/SubmenuPanel/Margin/VBox/HeaderHBox/BtnScrollUp
@onready var btn_scroll_down: Button = $BottomHUD/Margin/HBox/SubmenuPanel/Margin/VBox/HeaderHBox/BtnScrollDown
@onready var submenu_list: VBoxContainer = $BottomHUD/Margin/HBox/SubmenuPanel/Margin/VBox/Scroll/SubmenuList
@onready var submenu_info: Label = $BottomHUD/Margin/HBox/SubmenuPanel/Margin/VBox/SubmenuInfo

@onready var player_status_panel: PanelContainer = $BottomHUD/Margin/HBox/StatusPanel
@onready var player_name_label: Label = $BottomHUD/Margin/HBox/StatusPanel/Margin/VBox/PlayerName
@onready var courage_bar: ProgressBar = $BottomHUD/Margin/HBox/StatusPanel/Margin/VBox/CourageBar
@onready var courage_label: Label = $BottomHUD/Margin/HBox/StatusPanel/Margin/VBox/CourageLabel
@onready var atb_bar: ProgressBar = $BottomHUD/Margin/HBox/StatusPanel/Margin/VBox/ATBBar
@onready var atb_label: Label = $BottomHUD/Margin/HBox/StatusPanel/Margin/VBox/ATBLabel

# Victory / Defeat Overlay
@onready var end_overlay: PanelContainer = $EndOverlay
@onready var end_title: Label = $EndOverlay/Margin/VBox/EndTitle
@onready var end_desc: Label = $EndOverlay/Margin/VBox/EndDesc
@onready var end_rewards: Label = $EndOverlay/Margin/VBox/EndRewards
@onready var btn_end_return: Button = $EndOverlay/Margin/VBox/BtnEndReturn

# Positions for Combatant Tweening
var player_idle_pos: Vector2
var player_forward_pos: Vector2
var enemy_idle_pos: Vector2

var command_buttons: Array[Button] = []
var current_command_idx: int = 0
var current_submenu_type: String = "" # "spook", "charm", "item"
var is_active_turn_ready: bool = false
var battle_outcome: String = ""

# Track button raw labels for cursor prefixing
var base_button_labels: Dictionary = {}

func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	end_overlay.visible = false
	
	player_idle_pos = player_anchor.position
	player_forward_pos = player_idle_pos + Vector2(-50, 0)
	enemy_idle_pos = enemy_anchor.position

	command_buttons = [btn_spook, btn_charm, btn_item, btn_flee]
	base_button_labels[btn_spook] = "👻 Spook"
	base_button_labels[btn_charm] = "🎭 Charm / Joke"
	base_button_labels[btn_item] = "🍎 Item"
	base_button_labels[btn_flee] = "🏃 Step Back"

	_setup_command_focus_neighbors()
	_connect_ui_signals()
	
	# Check if GameManager provided encounter data from the world
	if not GameManager.current_enemy_data.is_empty():
		initialize_encounter_dict(GameManager.current_enemy_data)
	elif enemy_data.is_empty():
		initialize_encounter("wild_snowman")
	else:
		_setup_encounter()

func _setup_command_focus_neighbors() -> void:
	for i in range(command_buttons.size()):
		var btn = command_buttons[i]
		btn.focus_mode = Control.FOCUS_ALL
		var prev_btn = command_buttons[(i - 1 + command_buttons.size()) % command_buttons.size()]
		var next_btn = command_buttons[(i + 1) % command_buttons.size()]
		btn.focus_neighbor_top = prev_btn.get_path()
		btn.focus_neighbor_bottom = next_btn.get_path()
		btn.focus_neighbor_right = submenu_panel.get_path()
		
		# Hook focus changed for cursor prefix
		var idx = i
		btn.focus_entered.connect(func(): _on_command_focused(idx))
		btn.mouse_entered.connect(func():
			if not btn.disabled and current_state == State.PLAYER_SELECTING:
				btn.grab_focus()
		)

func _on_command_focused(idx: int) -> void:
	current_command_idx = idx
	for i in range(command_buttons.size()):
		var b = command_buttons[i]
		var base = base_button_labels.get(b, b.text)
		if i == idx:
			b.text = "▶ " + base
		else:
			b.text = "  " + base

func initialize_encounter(enemy_key_or_name: String) -> void:
	var base_dict = BattleDatabase.get_animal_data(enemy_key_or_name)
	base_dict["unique_id"] = enemy_key_or_name
	enemy_data = base_dict
	_setup_encounter()

func initialize_encounter_dict(dict: Dictionary) -> void:
	var base_dict = BattleDatabase.get_animal_data(dict.get("id", "wild_snowman"))
	# Merge any specific properties like unique_id from the world instance
	for k in dict:
		base_dict[k] = dict[k]
	enemy_data = base_dict
	_setup_encounter()

func _setup_encounter() -> void:
	# Initialize Player Stats from GameManager
	player_courage = GameManager.player_courage
	player_max_courage = GameManager.player_max_courage
	player_atb = 30.0

	# Initialize Enemy Stats
	enemy_max_composure = float(enemy_data.get("max_composure", 100))
	enemy_composure = enemy_max_composure
	enemy_max_pacification = float(enemy_data.get("max_pacification", 100))
	enemy_pacification = 0.0
	enemy_speed = float(enemy_data.get("speed", 24.0))
	enemy_atb = 0.0

	# Setup Visuals
	enemy_name_label.text = enemy_data.get("name", "Wild Animal")
	enemy_title_label.text = enemy_data.get("title", "Creature of Hakuba")
	
	# Setup Enemy Sprite & Frames
	enemy_anim_frames.clear()
	var frame_paths = enemy_data.get("frames", [])
	if frame_paths.size() > 0:
		for p in frame_paths:
			if ResourceLoader.exists(p):
				enemy_anim_frames.append(load(p))
	if enemy_anim_frames.size() > 0:
		enemy_sprite.texture = enemy_anim_frames[0]
	else:
		var spr_path = enemy_data.get("sprite_path", "res://assets/sprites/enemy_snow_monkey.png")
		if ResourceLoader.exists(spr_path):
			enemy_sprite.texture = load(spr_path)
	
	enemy_anim_fps = float(enemy_data.get("fps", 4.0))

	# Player Sprite & Seasonal Arena Styling
	_apply_player_and_season_battle_visuals()
	
	_update_all_meters()
	_close_submenu()
	_set_commands_enabled(false)

	# Intro message & transition
	current_state = State.INTRO
	_show_banner(enemy_data.get("intro", "A wild animal blocks your snowy path!"))
	
	# Start gentle bobbing animations
	_start_combatant_idle_anims()

	# Begin active battle after 1.2s
	get_tree().create_timer(1.2).timeout.connect(func():
		current_state = State.ACTIVE
		_show_banner("The encounter has begun! Await your Action Meter...")
	)

func _apply_player_and_season_battle_visuals() -> void:
	if player_name_label:
		player_name_label.text = GameManager.get_player_display_name()

	var paths = GameManager.get_player_sprite_paths()
	var battle_tex_path = paths.get("battle", "res://assets/sprites/characters/burnout_female/winter_battle.png")
	if ResourceLoader.exists(battle_tex_path):
		player_sprite.texture = load(battle_tex_path)
	elif ResourceLoader.exists("res://assets/sprites/player_idle.png"):
		player_sprite.texture = load("res://assets/sprites/player_idle.png")

	player_sprite.texture_filter = CanvasItem.TEXTURE_FILTER_LINEAR_WITH_MIPMAPS
	if player_sprite.texture and player_sprite.texture.get_height() > 32:
		# Scale 256x256 storybook battle sprite to ~96px tall in the 640x360 battle arena
		var target_h = 96.0
		var s = target_h / float(player_sprite.texture.get_height())
		player_sprite.scale = Vector2(s, s)
		player_sprite.position = Vector2(0, -18)
		# Flip horizontally so she faces LEFT toward the enemy on the left side of the screen
		player_sprite.flip_h = true
	else:
		player_sprite.scale = Vector2(3.5, 3.5)
		player_sprite.position = Vector2.ZERO
		player_sprite.flip_h = true

	# Update Arena Backdrop for Winter vs. Green Season
	var is_green = (GameManager.current_season == "green")
	if snow_particles:
		snow_particles.emitting = not is_green
	if background:
		var sky = background.get_node_or_null("Sky")
		var ground_back = background.get_node_or_null("GroundSnowBack")
		var ground_front = background.get_node_or_null("GroundSnowFront")
		var pines = background.get_node_or_null("DistantPines")
		if is_green:
			if sky: sky.color = Color(0.28, 0.55, 0.82, 1.0)
			if ground_back: ground_back.color = Color(0.26, 0.58, 0.32, 1.0)
			if ground_front: ground_front.color = Color(0.35, 0.68, 0.38, 1.0)
			if pines: pines.color = Color(0.14, 0.36, 0.22, 1.0)
		else:
			if sky: sky.color = Color(0.09, 0.13, 0.22, 1.0)
			if ground_back: ground_back.color = Color(0.68, 0.77, 0.88, 1.0)
			if ground_front: ground_front.color = Color(0.82, 0.89, 0.96, 1.0)
			if pines: pines.color = Color(0.1, 0.18, 0.22, 1.0)

func _start_combatant_idle_anims() -> void:
	var base_py = player_sprite.position.y
	var tween_p = create_tween().set_loops()
	tween_p.tween_property(player_sprite, "position:y", base_py - 3.0, 0.7).set_trans(Tween.TRANS_SINE)
	tween_p.tween_property(player_sprite, "position:y", base_py, 0.7).set_trans(Tween.TRANS_SINE)

	var base_ey = enemy_sprite.position.y
	var tween_e = create_tween().set_loops()
	tween_e.tween_property(enemy_sprite, "position:y", base_ey - 3.0, 0.85).set_trans(Tween.TRANS_SINE)
	tween_e.tween_property(enemy_sprite, "position:y", base_ey, 0.85).set_trans(Tween.TRANS_SINE)

func _process(delta: float) -> void:
	# Cycle enemy animation frames if multiple exist
	if enemy_anim_frames.size() > 1:
		enemy_anim_timer += delta * enemy_anim_fps
		var idx = int(enemy_anim_timer) % enemy_anim_frames.size()
		enemy_sprite.texture = enemy_anim_frames[idx]

	if current_state == State.ACTIVE or current_state == State.PLAYER_SELECTING:
		# Tick Player ATB only when turn not ready
		if not is_active_turn_ready:
			player_atb = minf(player_atb + (player_speed * delta), 100.0)
			_update_player_atb_display()
			if player_atb >= 100.0:
				_on_player_atb_ready()

		# --- PAUSE ENEMY ATB WHILE PLAYER CHOOSES ---
		# Enemy ATB ticks ONLY when it's NOT the player's turn to choose or act!
		var is_player_busy = is_active_turn_ready or current_state == State.PLAYER_SELECTING or current_state == State.EXECUTING_ACTION
		if not is_player_busy and current_state == State.ACTIVE:
			enemy_atb = minf(enemy_atb + (enemy_speed * delta), 100.0)
			_update_enemy_atb_display()
			if enemy_atb >= 100.0:
				_execute_enemy_turn()

func _update_all_meters() -> void:
	composure_bar.max_value = enemy_max_composure
	composure_bar.value = enemy_composure
	composure_label.text = "Wild Composure: %d / %d" % [int(enemy_composure), int(enemy_max_composure)]

	pacify_bar.max_value = enemy_max_pacification
	pacify_bar.value = enemy_pacification
	pacify_label.text = "Pacification: %d / %d" % [int(enemy_pacification), int(enemy_max_pacification)]

	courage_bar.max_value = player_max_courage
	courage_bar.value = player_courage
	courage_label.text = "Courage: %d / %d" % [player_courage, player_max_courage]
	
	_update_player_atb_display()
	_update_enemy_atb_display()

func _update_player_atb_display() -> void:
	atb_bar.value = player_atb
	if player_atb >= 100.0:
		atb_label.text = "⚡ READY!"
		atb_label.modulate = Color(1.0, 0.95, 0.4)
	else:
		atb_label.text = "ATB: %d%%" % int(player_atb)
		atb_label.modulate = Color(0.7, 0.85, 1.0)

func _update_enemy_atb_display() -> void:
	enemy_atb_bar.value = enemy_atb

func _on_player_atb_ready() -> void:
	is_active_turn_ready = true
	current_state = State.PLAYER_SELECTING
	_set_commands_enabled(true)
	_on_command_focused(0)
	btn_spook.grab_focus()
	_show_banner("Your Action Meter is READY! Choose an action without rushing.")

func _set_commands_enabled(enabled: bool) -> void:
	for b in command_buttons:
		b.disabled = not enabled

func _connect_ui_signals() -> void:
	btn_spook.pressed.connect(func(): _open_submenu("spook"))
	btn_charm.pressed.connect(func(): _open_submenu("charm"))
	btn_item.pressed.connect(func(): _open_submenu("item"))
	btn_flee.pressed.connect(_on_flee_pressed)
	btn_end_return.pressed.connect(_on_end_return_pressed)
	
	if is_instance_valid(btn_scroll_up):
		btn_scroll_up.pressed.connect(func(): _scroll_submenu_by(-44))
	if is_instance_valid(btn_scroll_down):
		btn_scroll_down.pressed.connect(func(): _scroll_submenu_by(44))

	var on_wheel = func(event: InputEvent):
		if event is InputEventMouseButton and event.pressed:
			if event.button_index == MOUSE_BUTTON_WHEEL_UP:
				_scroll_submenu_by(-28)
			elif event.button_index == MOUSE_BUTTON_WHEEL_DOWN:
				_scroll_submenu_by(28)

	submenu_scroll.gui_input.connect(on_wheel)
	submenu_panel.gui_input.connect(on_wheel)

# --- KEYBOARD NAVIGATION RECOVERY & HANDLING ---

func _unhandled_input(event: InputEvent) -> void:
	# End overlay navigation
	if end_overlay.visible:
		if event.is_action_pressed("ui_accept") or (event is InputEventKey and event.pressed and (event.keycode == KEY_SPACE or event.keycode == KEY_ENTER or event.keycode == KEY_ESCAPE)):
			get_viewport().set_input_as_handled()
			_on_end_return_pressed()
			return

	if current_state != State.PLAYER_SELECTING:
		return

	# Mouse wheel scrolling fallback over submenu panel
	if submenu_panel.visible and event is InputEventMouseButton and event.pressed:
		if event.button_index == MOUSE_BUTTON_WHEEL_UP:
			get_viewport().set_input_as_handled()
			_scroll_submenu_by(-28)
			return
		elif event.button_index == MOUSE_BUTTON_WHEEL_DOWN:
			get_viewport().set_input_as_handled()
			_scroll_submenu_by(28)
			return

	# Focus loss recovery: if focus owner was cleared by mouse click, restore it!
	var current_focus = get_viewport().gui_get_focus_owner()
	if current_focus == null:
		if submenu_panel.visible and submenu_list.get_child_count() > 0:
			var first = submenu_list.get_child(0)
			if first is Button:
				first.grab_focus()
		else:
			command_buttons[current_command_idx].grab_focus()

	# Submenu Navigation (when submenu is open)
	if submenu_panel.visible:
		# Cancel / Back to command list
		if event.is_action_pressed("ui_cancel") or event.is_action_pressed("ui_left") or (event is InputEventKey and event.pressed and (event.keycode == KEY_ESCAPE or event.keycode == KEY_A or event.keycode == KEY_BACKSPACE)):
			get_viewport().set_input_as_handled()
			_close_submenu()
			command_buttons[current_command_idx].grab_focus()
			return

		# WASD / Arrow / Page keys inside submenu
		if event is InputEventKey and event.pressed:
			var sub_children: Array[Button] = []
			for c in submenu_list.get_children():
				if c is Button and not c.disabled:
					sub_children.append(c)
			
			if sub_children.size() > 0:
				var focus_owner = get_viewport().gui_get_focus_owner()
				var cur_idx = sub_children.find(focus_owner)
				if cur_idx == -1:
					cur_idx = 0

				if event.keycode == KEY_W:
					get_viewport().set_input_as_handled()
					var prev_idx = (cur_idx - 1 + sub_children.size()) % sub_children.size()
					sub_children[prev_idx].grab_focus()
					_ensure_button_visible(sub_children[prev_idx])
					return
				elif event.keycode == KEY_S:
					get_viewport().set_input_as_handled()
					var next_idx = (cur_idx + 1) % sub_children.size()
					sub_children[next_idx].grab_focus()
					_ensure_button_visible(sub_children[next_idx])
					return
				elif event.keycode == KEY_PAGEUP:
					get_viewport().set_input_as_handled()
					var target_idx = maxi(cur_idx - 3, 0)
					sub_children[target_idx].grab_focus()
					_ensure_button_visible(sub_children[target_idx])
					return
				elif event.keycode == KEY_PAGEDOWN:
					get_viewport().set_input_as_handled()
					var target_idx = mini(cur_idx + 3, sub_children.size() - 1)
					sub_children[target_idx].grab_focus()
					_ensure_button_visible(sub_children[target_idx])
					return

	# Main command to submenu navigation with Right Arrow / D, or W / S vertical navigation
	if not submenu_panel.visible:
		if event.is_action_pressed("ui_right") or (event is InputEventKey and event.pressed and event.keycode == KEY_D):
			get_viewport().set_input_as_handled()
			match current_command_idx:
				0: _open_submenu("spook")
				1: _open_submenu("charm")
				2: _open_submenu("item")
			return
		elif event is InputEventKey and event.pressed:
			if event.keycode == KEY_W:
				get_viewport().set_input_as_handled()
				_on_command_focused((current_command_idx - 1 + command_buttons.size()) % command_buttons.size())
				command_buttons[current_command_idx].grab_focus()
				return
			elif event.keycode == KEY_S:
				get_viewport().set_input_as_handled()
				_on_command_focused((current_command_idx + 1) % command_buttons.size())
				command_buttons[current_command_idx].grab_focus()
				return

func _open_submenu(type: String) -> void:
	current_submenu_type = type
	submenu_panel.visible = true
	submenu_scroll.scroll_vertical = 0
	
	# Clear list
	for child in submenu_list.get_children():
		child.queue_free()

	var created_buttons: Array[Button] = []

	match type:
		"spook":
			submenu_title.text = "👻 SPOOK ACTIONS (%d)" % BattleDatabase.SPOOK_ACTIONS.size()
			submenu_info.text = "Startle the animal to lower its wild composure."
			for action in BattleDatabase.SPOOK_ACTIONS:
				var btn = _create_submenu_button(action["name"])
				var desc = action["description"]
				btn.mouse_entered.connect(func():
					if not btn.disabled and current_state == State.PLAYER_SELECTING:
						btn.grab_focus()
				)
				btn.focus_entered.connect(func():
					submenu_info.text = desc
					_ensure_button_visible(btn)
					_update_submenu_cursor(created_buttons, btn)
				)
				btn.pressed.connect(func(): _execute_spook_action(action))
				submenu_list.add_child(btn)
				created_buttons.append(btn)

		"charm":
			var charm_opts = BattleDatabase.get_all_charm_options()
			submenu_title.text = "🎭 CHARM & JOKES (%d)" % charm_opts.size()
			submenu_info.text = "Pick a joke or peaceful charm to raise its pacification."
			for action in charm_opts:
				var btn = _create_submenu_button(action["name"])
				var desc = action["description"]
				btn.mouse_entered.connect(func():
					if not btn.disabled and current_state == State.PLAYER_SELECTING:
						btn.grab_focus()
				)
				btn.focus_entered.connect(func():
					submenu_info.text = desc
					_ensure_button_visible(btn)
					_update_submenu_cursor(created_buttons, btn)
				)
				btn.pressed.connect(func(): _execute_charm_action(action))
				submenu_list.add_child(btn)
				created_buttons.append(btn)

		"item":
			var items = GameManager.get_inventory_items()
			submenu_title.text = "🎒 BATTLE ITEMS"
			submenu_info.text = "Use snacks or refreshments to befriend beasts or restore courage."
			var has_usable = false
			for it in items:
				var count = it.get("count", 0)
				var key = it.get("id", "")
				if count > 0:
					has_usable = true
					var btn = _create_submenu_button("%s (x%d)" % [it.get("name", key), count])
					var it_desc = it.get("effects_text", "")
					btn.mouse_entered.connect(func():
						if not btn.disabled and current_state == State.PLAYER_SELECTING:
							btn.grab_focus()
					)
					btn.focus_entered.connect(func():
						submenu_info.text = it_desc
						_ensure_button_visible(btn)
						_update_submenu_cursor(created_buttons, btn)
					)
					btn.pressed.connect(func(): _execute_item_action(it))
					submenu_list.add_child(btn)
					created_buttons.append(btn)
			
			if not has_usable:
				var label = Label.new()
				label.text = "Pouch empty!\nExplore village to gather apples & tea."
				label.add_theme_font_size_override("font_size", 11)
				label.add_theme_color_override("font_color", Color(0.7, 0.7, 0.7))
				submenu_list.add_child(label)
				var demo_btn = _create_submenu_button("🍎 Trail Apple (Testing)")
				demo_btn.pressed.connect(func(): 
					_execute_item_action({ "id": "apple", "name": "Nagano Apple" })
				)
				submenu_list.add_child(demo_btn)
				created_buttons.append(demo_btn)

	# Configure submenu vertical wrap-around and Left arrow back to command button
	var parent_cmd = command_buttons[current_command_idx]
	for i in range(created_buttons.size()):
		var b = created_buttons[i]
		b.focus_neighbor_left = parent_cmd.get_path()
		var prev_b = created_buttons[(i - 1 + created_buttons.size()) % created_buttons.size()]
		var next_b = created_buttons[(i + 1) % created_buttons.size()]
		b.focus_neighbor_top = prev_b.get_path()
		b.focus_neighbor_bottom = next_b.get_path()

	if created_buttons.size() > 0:
		created_buttons[0].grab_focus()
		_ensure_button_visible(created_buttons[0])
		_update_submenu_cursor(created_buttons, created_buttons[0])

	get_tree().create_timer(0.05).timeout.connect(func():
		_update_scroll_buttons()
	)

func _scroll_submenu_by(delta_pixels: int) -> void:
	if not is_instance_valid(submenu_scroll):
		return
	var vbar = submenu_scroll.get_v_scroll_bar()
	var max_scroll = int(vbar.max_value - vbar.page) if vbar else 999
	submenu_scroll.scroll_vertical = clampi(submenu_scroll.scroll_vertical + delta_pixels, 0, maxi(max_scroll, 0))
	_update_scroll_buttons()

func _update_scroll_buttons() -> void:
	if not is_instance_valid(submenu_scroll):
		return
	var vbar = submenu_scroll.get_v_scroll_bar()
	var max_scroll = int(vbar.max_value - vbar.page) if vbar else 0
	var cur = submenu_scroll.scroll_vertical
	if is_instance_valid(btn_scroll_up):
		btn_scroll_up.disabled = (cur <= 0)
		btn_scroll_up.modulate = Color(1.0, 1.0, 1.0, 1.0) if not btn_scroll_up.disabled else Color(0.5, 0.5, 0.5, 0.35)
	if is_instance_valid(btn_scroll_down):
		btn_scroll_down.disabled = (cur >= max_scroll or max_scroll <= 0)
		btn_scroll_down.modulate = Color(1.0, 1.0, 1.0, 1.0) if not btn_scroll_down.disabled else Color(0.5, 0.5, 0.5, 0.35)

func _ensure_button_visible(btn: Button) -> void:
	if not is_instance_valid(submenu_scroll) or not is_instance_valid(btn):
		return
	submenu_scroll.ensure_control_visible(btn)
	var idx = btn.get_index()
	var btn_h = maxf(btn.size.y, 22.0)
	var btn_top = btn.position.y
	if idx > 0 and btn_top <= 0.0:
		btn_top = idx * (btn_h + 2.0)
	var btn_bottom = btn_top + btn_h
	var cur_scroll = submenu_scroll.scroll_vertical
	var view_h = submenu_scroll.size.y
	if view_h <= 0.0:
		view_h = 72.0

	if btn_top < cur_scroll:
		submenu_scroll.scroll_vertical = maxi(int(btn_top - 2.0), 0)
	elif btn_bottom > cur_scroll + view_h:
		submenu_scroll.scroll_vertical = int(btn_bottom - view_h + 4.0)

	_update_scroll_buttons()

func _update_submenu_cursor(buttons: Array[Button], focused: Button) -> void:
	for b in buttons:
		var base = base_button_labels.get(b, b.text)
		if b == focused:
			b.text = "▶ " + base
		else:
			b.text = "  " + base

func _create_submenu_button(text: String) -> Button:
	var btn = Button.new()
	base_button_labels[btn] = text
	btn.text = "  " + text
	btn.custom_minimum_size = Vector2(0, 22)
	btn.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	btn.clip_contents = true
	btn.alignment = HORIZONTAL_ALIGNMENT_LEFT
	btn.focus_mode = Control.FOCUS_ALL
	btn.mouse_filter = Control.MOUSE_FILTER_PASS
	btn.gui_input.connect(func(event: InputEvent):
		if event is InputEventMouseButton and event.pressed:
			if event.button_index == MOUSE_BUTTON_WHEEL_UP:
				_scroll_submenu_by(-28)
				btn.accept_event()
			elif event.button_index == MOUSE_BUTTON_WHEEL_DOWN:
				_scroll_submenu_by(28)
				btn.accept_event()
	)
	
	var style = StyleBoxFlat.new()
	style.bg_color = Color(0.06, 0.12, 0.22, 0.9)
	style.border_width_left = 1
	style.border_width_top = 1
	style.border_width_right = 1
	style.border_width_bottom = 1
	style.border_color = Color(0.25, 0.45, 0.75, 0.6)
	style.corner_radius_top_left = 3
	style.corner_radius_top_right = 3
	style.corner_radius_bottom_right = 3
	style.corner_radius_bottom_left = 3
	btn.add_theme_stylebox_override("normal", style)
	
	var hover = style.duplicate()
	hover.bg_color = Color(0.12, 0.25, 0.45, 0.95)
	hover.border_color = Color(0.4, 0.8, 1.0, 0.9)
	btn.add_theme_stylebox_override("hover", hover)
	btn.add_theme_stylebox_override("focus", hover)
	btn.add_theme_font_size_override("font_size", 10)
	return btn

func _close_submenu() -> void:
	submenu_panel.visible = false
	current_submenu_type = ""

# --- ACTION EXECUTION ---

func apply_spook_effect(action: Dictionary) -> Dictionary:
	var animal_name = enemy_data.get("name", "beast")
	var spook_amt = randf_range(action.get("spook_min", 25), action.get("spook_max", 40))
	
	var cost = action.get("courage_cost", 0)
	if cost > 0:
		player_courage = maxi(player_courage - cost, 1)
		_spawn_floating_text("- %d Courage" % cost, player_anchor.global_position + Vector2(0, -30), Color(1.0, 0.8, 0.3))

	enemy_composure = maxf(enemy_composure - spook_amt, 0.0)
	_update_all_meters()
	_animate_enemy_hit("spook")
	_spawn_floating_text("👻 Spooked -%d!" % int(spook_amt), enemy_anchor.global_position + Vector2(0, -35), Color(0.4, 0.8, 1.0))
	
	var delay = action.get("atb_delay", 0.0)
	if delay > 0.0:
		enemy_atb = maxf(enemy_atb - (delay * 20.0), 0.0)
		_update_enemy_atb_display()

	var log_msg = action.get("log", "You spooked the %s!") % animal_name
	_show_banner(log_msg)
	return { "spook": spook_amt, "cost": cost, "msg": log_msg }

func _execute_spook_action(action: Dictionary) -> void:
	_close_submenu()
	_set_commands_enabled(false)
	current_state = State.EXECUTING_ACTION
	_animate_player_action(func():
		apply_spook_effect(action)
		get_tree().create_timer(1.2).timeout.connect(func():
			if enemy_composure <= 0.0:
				_handle_victory_spooked()
			else:
				_finish_player_turn()
		)
	)

func apply_charm_effect(action: Dictionary) -> Dictionary:
	var animal_name = enemy_data.get("name", "beast")
	var is_joke = action.get("is_joke", false)
	var joke_dict: Dictionary = {}
	var charm_amt: float = 0.0

	if is_joke:
		if action.has("specific_joke"):
			joke_dict = action["specific_joke"]
		else:
			joke_dict = BattleDatabase.get_random_joke()
		charm_amt = float(joke_dict.get("power", 35))
	else:
		charm_amt = randf_range(action.get("charm_min", 25), action.get("charm_max", 40))
	
	var bonus = float(enemy_data.get("favourite_joke_bonus", 1.0))
	charm_amt *= bonus

	var heal = action.get("courage_heal", 0)
	if heal > 0:
		player_courage = mini(player_courage + heal, player_max_courage)
		_spawn_floating_text("✨ +%d Courage" % heal, player_anchor.global_position + Vector2(0, -30), Color(0.4, 1.0, 0.5))

	enemy_pacification = minf(enemy_pacification + charm_amt, enemy_max_pacification)
	_update_all_meters()
	_animate_enemy_hit("charm")
	_spawn_floating_text("💖 Charmed +%d!" % int(charm_amt), enemy_anchor.global_position + Vector2(0, -35), Color(1.0, 0.45, 0.75))

	var msg = ""
	if is_joke:
		msg = "\"%s\" ... \"%s\"" % [joke_dict.get("setup", ""), joke_dict.get("punchline", "")]
	else:
		msg = action.get("log", "You charmed the %s!") % animal_name
	_show_banner(msg)
	return { "charm": charm_amt, "heal": heal, "msg": msg }

func _execute_charm_action(action: Dictionary) -> void:
	_close_submenu()
	_set_commands_enabled(false)
	current_state = State.EXECUTING_ACTION
	_animate_player_action(func():
		apply_charm_effect(action)
		get_tree().create_timer(1.4).timeout.connect(func():
			if enemy_pacification >= enemy_max_pacification:
				_handle_victory_charmed()
			else:
				_finish_player_turn()
		)
	)

func apply_item_effect(item_data: Dictionary) -> Dictionary:
	var item_name = item_data.get("name", "Item")
	var item_id = item_data.get("id", "").to_lower()
	var animal_name = enemy_data.get("name", "beast")

	if "apple" in item_id:
		var charm_val = 55.0
		enemy_pacification = minf(enemy_pacification + charm_val, enemy_max_pacification)
		_update_all_meters()
		_animate_enemy_hit("charm")
		_spawn_floating_text("🍎 Delicious! +%d Charm" % int(charm_val), enemy_anchor.global_position + Vector2(0, -35), Color(1.0, 0.4, 0.6))
		var msg = "You tossed a sweet Nagano Apple to the %s! It munches with pure joy!" % animal_name
		_show_banner(msg)
		GameManager.use_item("Nagano Apple")
		return { "type": "apple", "charm": charm_val, "msg": msg }

	elif "tea" in item_id:
		var heal = 50
		player_courage = mini(player_courage + heal, player_max_courage)
		_update_all_meters()
		_spawn_floating_text("🍵 Warmth +%d Courage!" % heal, player_anchor.global_position + Vector2(0, -30), Color(0.4, 1.0, 0.4))
		var msg = "You drank steaming Onsen Tea! Your courage and spirits surge with warmth!"
		_show_banner(msg)
		GameManager.use_item("Onsen Tea")
		return { "type": "tea", "heal": heal, "msg": msg }

	elif "charm" in item_id:
		var charm_val = 40.0
		enemy_pacification = minf(enemy_pacification + charm_val, enemy_max_pacification)
		var heal = 25
		player_courage = mini(player_courage + heal, player_max_courage)
		_update_all_meters()
		_animate_enemy_hit("charm")
		_spawn_floating_text("⛩️ Warded +%d Charm" % int(charm_val), enemy_anchor.global_position + Vector2(0, -35), Color(0.9, 0.8, 0.3))
		var msg = "You presented the Lucky Shrine Charm! A sacred, calming aura enchants the snow!"
		_show_banner(msg)
		return { "type": "charm", "charm": charm_val, "heal": heal, "msg": msg }

	else:
		_spawn_floating_text("❓ Curious...", enemy_anchor.global_position + Vector2(0, -35), Color(0.8, 0.8, 0.8))
		var msg = "You held out the %s. The %s inspects it with curious eyes." % [item_name, animal_name]
		_show_banner(msg)
		return { "type": "other", "msg": msg }

func _execute_item_action(item_data: Dictionary) -> void:
	_close_submenu()
	_set_commands_enabled(false)
	current_state = State.EXECUTING_ACTION
	_animate_player_action(func():
		apply_item_effect(item_data)
		get_tree().create_timer(1.2).timeout.connect(func():
			if enemy_pacification >= enemy_max_pacification:
				_handle_victory_charmed()
			else:
				_finish_player_turn()
		)
	)

func _on_flee_pressed() -> void:
	_close_submenu()
	_set_commands_enabled(false)
	current_state = State.EXECUTING_ACTION
	_show_banner("You step back carefully through the snowdrifts, making a calm retreat...")

	var tween = create_tween()
	tween.tween_property(player_anchor, "position:x", player_idle_pos.x + 120.0, 0.7).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_IN)
	tween.chain().tween_callback(func():
		_handle_flee_success()
	)

func _finish_player_turn() -> void:
	player_atb = 0.0
	is_active_turn_ready = false
	_update_player_atb_display()
	current_state = State.ACTIVE

# --- ENEMY TURN ---

func _execute_enemy_turn() -> void:
	current_state = State.EXECUTING_ACTION
	enemy_atb = 0.0
	_update_enemy_atb_display()

	var moves = enemy_data.get("moves", [])
	var chosen_move: Dictionary
	if moves.size() > 0:
		chosen_move = moves.pick_random()
	else:
		chosen_move = { "name": "Snow Scratch", "damage": 12, "text": "The creature kicks up a swirl of snow!" }

	_show_banner(chosen_move.get("text", "The animal moves!"))

	# Animate Enemy lunge
	var tween = create_tween()
	tween.tween_property(enemy_anchor, "position:x", enemy_idle_pos.x + 40.0, 0.18).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
	tween.chain().tween_callback(func():
		var dmg = chosen_move.get("damage", 10)
		var pacify_bonus = chosen_move.get("pacify_bonus", 0)

		if dmg > 0:
			player_courage = maxi(player_courage - dmg, 0)
			_update_all_meters()
			_animate_player_hit()
			_spawn_floating_text("💔 Courage -%d" % dmg, player_anchor.global_position + Vector2(0, -30), Color(1.0, 0.35, 0.35))
		elif pacify_bonus > 0:
			enemy_pacification = minf(enemy_pacification + pacify_bonus, enemy_max_pacification)
			_update_all_meters()
			_spawn_floating_text("✨ Peaceful +%d" % pacify_bonus, enemy_anchor.global_position + Vector2(0, -35), Color(0.6, 1.0, 0.6))

		# Return enemy to idle pos
		var ret_tween = create_tween()
		ret_tween.tween_property(enemy_anchor, "position", enemy_idle_pos, 0.2)
		
		# Check if Player Courage hit 0 (Defeat)
		ret_tween.chain().tween_callback(func():
			if player_courage <= 0:
				_handle_player_defeat()
			else:
				current_state = State.ACTIVE
		)
	)

# --- ANIMATIONS & FX ---

func _animate_player_action(on_action_point: Callable) -> void:
	var tween = create_tween()
	tween.tween_property(player_anchor, "position", player_forward_pos, 0.15).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_OUT)
	tween.chain().tween_callback(func():
		on_action_point.call()
		var back_tween = create_tween()
		back_tween.tween_interval(0.4)
		back_tween.tween_property(player_anchor, "position", player_idle_pos, 0.2).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_IN)
	)

func _animate_enemy_hit(type: String) -> void:
	var tween = create_tween()
	if type == "spook":
		tween.tween_property(enemy_anchor, "position:x", enemy_idle_pos.x - 18.0, 0.08)
		tween.tween_property(enemy_anchor, "position:x", enemy_idle_pos.x + 8.0, 0.08)
		tween.tween_property(enemy_anchor, "position", enemy_idle_pos, 0.08)
		
		enemy_sprite.modulate = Color(2.5, 2.5, 2.5)
		var flash = create_tween()
		flash.tween_property(enemy_sprite, "modulate", Color(1, 1, 1), 0.25)
	else:
		tween.tween_property(enemy_anchor, "position:y", enemy_idle_pos.y - 12.0, 0.12).set_trans(Tween.TRANS_BACK)
		tween.tween_property(enemy_anchor, "position", enemy_idle_pos, 0.12)
		
		enemy_sprite.modulate = Color(1.3, 0.8, 1.2)
		var flash = create_tween()
		flash.tween_property(enemy_sprite, "modulate", Color(1, 1, 1), 0.3)

func _animate_player_hit() -> void:
	var tween = create_tween()
	tween.tween_property(player_anchor, "position:x", player_idle_pos.x + 12.0, 0.08)
	tween.tween_property(player_anchor, "position:x", player_idle_pos.x - 6.0, 0.08)
	tween.tween_property(player_anchor, "position", player_idle_pos, 0.08)

	player_sprite.modulate = Color(1.8, 0.5, 0.5)
	var flash = create_tween()
	flash.tween_property(player_sprite, "modulate", Color(1, 1, 1), 0.25)

func _spawn_floating_text(text: String, start_pos: Vector2, color: Color) -> void:
	var label = Label.new()
	label.text = text
	label.position = start_pos - Vector2(50, 10)
	label.size = Vector2(100, 20)
	label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	label.add_theme_font_size_override("font_size", 13)
	label.add_theme_color_override("font_color", color)
	label.add_theme_constant_override("outline_size", 3)
	label.add_theme_color_override("font_outline_color", Color(0, 0, 0, 0.95))
	fx_container.add_child(label)

	var tween = create_tween().set_parallel(true)
	tween.tween_property(label, "position:y", label.position.y - 30.0, 0.85).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_OUT)
	tween.tween_property(label, "modulate:a", 0.0, 0.85).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_IN)
	tween.chain().tween_callback(label.queue_free)

func _show_banner(text: String) -> void:
	message_label.text = text
	message_banner.visible = true

# --- RESOLUTION & VICTORY ---

func _handle_victory_spooked() -> void:
	current_state = State.VICTORY
	battle_outcome = "spooked"
	_show_banner(enemy_data.get("spooked_text", "The beast fled into the mountains!"))

	enemy_sprite.flip_h = false
	var run_tween = create_tween()
	run_tween.tween_property(enemy_anchor, "position:x", -100.0, 0.9).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_IN)
	run_tween.chain().tween_callback(func():
		_display_end_card("SPOOK VICTORY! 👻", 
			"You successfully startled the %s without harming a single hair!" % enemy_data.get("name", "beast"),
			"🏆 +5 Max Courage Acquired!\n🏔️ Hakuba village trail is safe once again!"
		)
		GameManager.player_max_courage += 5
		GameManager.player_courage = GameManager.player_max_courage
	)

func _handle_victory_charmed() -> void:
	current_state = State.VICTORY
	battle_outcome = "charmed"
	_show_banner(enemy_data.get("charmed_text", "The beast is peacefully charmed!"))

	var hop_tween = create_tween().set_loops(3)
	hop_tween.tween_property(enemy_sprite, "position:y", -14.0, 0.15)
	hop_tween.tween_property(enemy_sprite, "position:y", 0.0, 0.15)
	
	get_tree().create_timer(1.0).timeout.connect(func():
		var walk_away = create_tween()
		walk_away.tween_property(enemy_anchor, "position:x", -120.0, 1.2)
		walk_away.chain().tween_callback(func():
			_display_end_card("CHARM VICTORY! 💖",
				"The %s felt your warmth and friendly humor! It has become docile and content." % enemy_data.get("name", "beast"),
				"✨ Courage fully restored!\n🍎 Reward: Gained +1 Nagano Apple & Alpine Goodwill!"
			)
			GameManager.player_courage = GameManager.player_max_courage
			GameManager.add_item("Nagano Apple")
		)
	)

func _handle_player_defeat() -> void:
	current_state = State.DEFEAT
	battle_outcome = "defeat"
	_show_banner("Your courage faltered under the wild beast's fierce roar!")
	
	_display_end_card("COURAGE FALTERED... 💔",
		"You were overwhelmed by the wild mountain beast and scrambled back to the safety of the village square.",
		"❄️ Take a rest, sip hot Onsen Tea, and rebuild your courage before trying again."
	)
	GameManager.player_courage = 50

func _handle_flee_success() -> void:
	current_state = State.DEFEAT
	battle_outcome = "flee"
	_display_end_card("RETREATED SAFELY 🏃",
		"You carefully backed away from the encounter without provoking the creature.",
		"You returned safely to Hakuba village."
	)

func _display_end_card(title: String, desc: String, rewards: String) -> void:
	end_title.text = title
	end_desc.text = desc
	end_rewards.text = rewards
	end_overlay.visible = true
	end_overlay.modulate.a = 0.0
	
	var tween = create_tween()
	tween.tween_property(end_overlay, "modulate:a", 1.0, 0.25)
	btn_end_return.grab_focus()

func _on_end_return_pressed() -> void:
	GameManager.player_courage = player_courage
	battle_completed.emit(battle_outcome, enemy_data)
	# ALWAYS return to the main world!
	GameManager.end_battle(battle_outcome, enemy_data)
