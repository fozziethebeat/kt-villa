extends CharacterBody2D

@export var move_speed: float = 95.0
@export var sprint_speed: float = 148.0

@onready var sprite: Sprite2D = $Sprite2D
@onready var anim_player: AnimationPlayer = $AnimationPlayer

var is_moving: bool = false
var facing_direction: Vector2 = Vector2.DOWN

var _idle_tex: Texture2D
var _walk_tex: Texture2D
var _anim_timer: float = 0.0
var _base_scale: Vector2 = Vector2(0.145, 0.145)
var _base_offset_y: float = -10.0

func _ready() -> void:
	# Stop legacy hardcoded AnimationPlayer track so it doesn't overwrite our seasonal textures
	if anim_player:
		anim_player.stop()
	sprite.texture_filter = CanvasItem.TEXTURE_FILTER_LINEAR_WITH_MIPMAPS
	_reload_character_sprites()
	GameManager.season_changed.connect(func(_s): _reload_character_sprites())
	GameManager.player_profile_changed.connect(func(_p, _g): _reload_character_sprites())

func _reload_character_sprites() -> void:
	var paths = GameManager.get_player_sprite_paths()
	var idle_path = paths.get("idle", "res://assets/sprites/characters/burnout_female/winter_idle.png")
	var walk_path = paths.get("walk", "res://assets/sprites/characters/burnout_female/winter_walk.png")

	if ResourceLoader.exists(idle_path):
		_idle_tex = load(idle_path)
	if ResourceLoader.exists(walk_path):
		_walk_tex = load(walk_path)

	if _idle_tex:
		sprite.texture = _idle_tex
		# Scale 256x256 storybook character to ~36px tall on the top-down map with feet anchored at y=3
		var tex_h = float(_idle_tex.get_height())
		if tex_h > 32.0:
			var target_h = 36.0
			var s = target_h / tex_h
			_base_scale = Vector2(s, s)
			_base_offset_y = -11.0
		else:
			_base_scale = Vector2.ONE
			_base_offset_y = 0.0
		sprite.scale = _base_scale
		sprite.position = Vector2(0, _base_offset_y)

func _physics_process(delta: float) -> void:
	_anim_timer += delta

	if GameManager.is_dialogue_active or GameManager.is_encounter_prompt_active or GameManager.is_in_battle or GameManager.is_menu_active:
		velocity = Vector2.ZERO
		move_and_slide()
		_update_visual_pose(false, false)
		return

	var input_dir: Vector2 = Input.get_vector("move_left", "move_right", "move_up", "move_down")
	var sprinting: bool = Input.is_action_pressed("sprint")
	var speed: float = sprint_speed if sprinting else move_speed

	if input_dir != Vector2.ZERO:
		velocity = input_dir.normalized() * speed
		facing_direction = input_dir
		is_moving = true

		# Our storybook sprites face slightly right by default; flip when moving left
		if input_dir.x < 0:
			sprite.flip_h = true
		elif input_dir.x > 0:
			sprite.flip_h = false

		_update_visual_pose(true, sprinting)
	else:
		velocity = Vector2.ZERO
		is_moving = false
		_update_visual_pose(false, false)

	move_and_slide()

func _update_visual_pose(moving: bool, sprinting: bool) -> void:
	if moving:
		var cycle_speed = 9.5 if sprinting else 6.5
		var step_phase = sin(_anim_timer * cycle_speed * PI)
		sprite.texture = _walk_tex if (step_phase > 0.0 and _walk_tex != null) else _idle_tex
		var bob = abs(sin(_anim_timer * cycle_speed * PI)) * 2.0
		var tilt = sin(_anim_timer * cycle_speed * PI) * 0.05
		sprite.position = Vector2(0, _base_offset_y - bob)
		sprite.rotation = tilt
		sprite.scale = _base_scale * Vector2(1.0 + abs(step_phase) * 0.02, 1.0 - abs(step_phase) * 0.02)
	else:
		sprite.texture = _idle_tex
		var breath = sin(_anim_timer * 2.8) * 0.6
		sprite.position = Vector2(0, _base_offset_y + breath)
		sprite.rotation = 0.0
		sprite.scale = _base_scale * Vector2(1.0, 1.0 - sin(_anim_timer * 2.8) * 0.012)

