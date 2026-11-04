extends CharacterBody2D

@export var enemy_name: String = "Wild Snow Monkey"
@export var enemy_id: String = "wild_snowman"
@export var enemy_uid: String = ""
@export var enemy_sprite: Texture2D
@export var animation_frames: Array = []
@export var animation_fps: float = 6.0
@export var patrol_distance: float = 36.0
@export var patrol_speed: float = 22.0

@onready var sprite: Sprite2D = $Sprite2D
@onready var detection_area: Area2D = $DetectionArea
@onready var interaction_area: Area2D = $InteractionArea
@onready var alert_icon: Label = $AlertIcon
@onready var prompt_badge: Label = $PromptBadge

var start_pos: Vector2
var patrol_target: Vector2
var player_ref: Node2D = null
var player_in_approach_range: bool = false
var unique_id: String
var anim_timer: float = 0.0

var is_pacified: bool = false
var is_spooked: bool = false
var encounter_cooldown: float = 0.0

func _ready() -> void:
	if enemy_uid.is_empty():
		enemy_uid = enemy_id + "_" + str(int(global_position.x)) + "_" + str(int(global_position.y))
	unique_id = enemy_uid

	# Check persistent state from GameManager
	if GameManager.spooked_enemy_ids.has(unique_id):
		queue_free()
		return
	if GameManager.pacified_enemy_ids.has(unique_id):
		is_pacified = true
	if GameManager.enemy_cooldown_timers.has(unique_id):
		encounter_cooldown = GameManager.enemy_cooldown_timers[unique_id]

	start_pos = global_position
	patrol_target = start_pos + Vector2(patrol_distance, 0)
	
	if animation_frames.size() > 0:
		sprite.texture = animation_frames[0]
	elif enemy_sprite:
		sprite.texture = enemy_sprite
		
	if is_pacified:
		alert_icon.text = "💖"
		alert_icon.visible = true
	else:
		alert_icon.visible = false
	prompt_badge.visible = false
	
	detection_area.body_entered.connect(_on_detection_area_entered)
	detection_area.body_exited.connect(_on_detection_area_exited)
	interaction_area.body_entered.connect(_on_interaction_area_entered)
	interaction_area.body_exited.connect(_on_interaction_area_exited)

func _physics_process(delta: float) -> void:
	if encounter_cooldown > 0.0:
		encounter_cooldown -= delta
		if encounter_cooldown <= 0.0:
			GameManager.enemy_cooldown_timers.erase(unique_id)

	if is_spooked or is_pacified or GameManager.is_in_battle or GameManager.is_encounter_prompt_active:
		velocity = Vector2.ZERO
		return

	# Patrol movement
	if global_position.distance_to(patrol_target) < 2.0:
		patrol_target = start_pos - (patrol_target - start_pos)
		sprite.flip_h = (patrol_target.x < global_position.x)
	
	var dir = (patrol_target - global_position).normalized()
	velocity = dir * patrol_speed
	move_and_slide()
	
	# Cycle animation frames if multiple frames provided
	if animation_frames.size() > 1:
		anim_timer += delta * animation_fps
		var frame_idx = int(anim_timer) % animation_frames.size()
		sprite.texture = animation_frames[frame_idx]
	
	# Update proximity distance if player is detected
	if player_ref and not is_pacified and not is_spooked:
		var dist = global_position.distance_to(player_ref.global_position)
		GameManager.set_enemy_proximity(unique_id, enemy_name, true, dist)

func _unhandled_input(event: InputEvent) -> void:
	if player_in_approach_range and not is_pacified and not is_spooked and encounter_cooldown <= 0.0:
		if event.is_action_pressed("interact"):
			if not GameManager.is_dialogue_active and not GameManager.is_encounter_prompt_active and not GameManager.is_in_battle and not GameManager.is_menu_active:
				get_viewport().set_input_as_handled()
				var data = {
					"id": enemy_id,
					"name": enemy_name,
					"unique_id": unique_id
				}
				GameManager.request_encounter_prompt(data, self)

func _on_detection_area_entered(body: Node2D) -> void:
	if body.is_in_group("player") and not is_pacified and not is_spooked:
		player_ref = body
		alert_icon.visible = true
		var dist = global_position.distance_to(body.global_position)
		GameManager.set_enemy_proximity(unique_id, enemy_name, true, dist)

func _on_detection_area_exited(body: Node2D) -> void:
	if body.is_in_group("player"):
		player_ref = null
		if not is_pacified:
			alert_icon.visible = false
		GameManager.set_enemy_proximity(unique_id, enemy_name, false)

func _on_interaction_area_entered(body: Node2D) -> void:
	if body.is_in_group("player") and not is_pacified and not is_spooked:
		player_in_approach_range = true
		if encounter_cooldown <= 0.0:
			prompt_badge.visible = true

func _on_interaction_area_exited(body: Node2D) -> void:
	if body.is_in_group("player"):
		player_in_approach_range = false
		prompt_badge.visible = false
		if GameManager.is_encounter_prompt_active:
			GameManager.close_encounter_prompt()

func on_spooked() -> void:
	is_spooked = true
	alert_icon.text = "💨"
	alert_icon.visible = true
	prompt_badge.visible = false
	GameManager.set_enemy_proximity(unique_id, enemy_name, false)

	# Flee animation
	var dir = Vector2(-1, -0.5).normalized()
	var tween = create_tween()
	tween.tween_property(self, "global_position", global_position + (dir * 90.0), 0.8).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_IN)
	tween.parallel().tween_property(self, "modulate:a", 0.0, 0.8)
	tween.chain().tween_callback(queue_free)

func on_charmed() -> void:
	is_pacified = true
	alert_icon.text = "💖"
	alert_icon.visible = true
	prompt_badge.visible = false
	GameManager.set_enemy_proximity(unique_id, enemy_name, false)

	# Gentle happy bounce
	var tween = create_tween()
	tween.tween_property(sprite, "position:y", -6.0, 0.15)
	tween.tween_property(sprite, "position:y", 0.0, 0.15)

func _exit_tree() -> void:
	GameManager.set_enemy_proximity(unique_id, enemy_name, false)
