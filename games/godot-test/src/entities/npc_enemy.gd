extends CharacterBody2D

@export var enemy_name: String = "Wild Snow Monkey"
@export var enemy_sprite: Texture2D
@export var animation_frames: Array = []
@export var animation_fps: float = 6.0
@export var patrol_distance: float = 36.0
@export var patrol_speed: float = 22.0

@onready var sprite: Sprite2D = $Sprite2D
@onready var detection_area: Area2D = $DetectionArea
@onready var alert_icon: Label = $AlertIcon

var start_pos: Vector2
var patrol_target: Vector2
var player_ref: Node2D = null
var unique_id: String
var anim_timer: float = 0.0

func _ready() -> void:
	unique_id = str(get_instance_id())
	start_pos = global_position
	patrol_target = start_pos + Vector2(patrol_distance, 0)
	
	if animation_frames.size() > 0:
		sprite.texture = animation_frames[0]
	elif enemy_sprite:
		sprite.texture = enemy_sprite
		
	alert_icon.visible = false
	
	detection_area.body_entered.connect(_on_detection_area_entered)
	detection_area.body_exited.connect(_on_detection_area_exited)

func _physics_process(delta: float) -> void:
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
	if player_ref:
		var dist = global_position.distance_to(player_ref.global_position)
		GameManager.set_enemy_proximity(unique_id, enemy_name, true, dist)

func _on_detection_area_entered(body: Node2D) -> void:
	if body.is_in_group("player"):
		player_ref = body
		alert_icon.visible = true
		var dist = global_position.distance_to(body.global_position)
		GameManager.set_enemy_proximity(unique_id, enemy_name, true, dist)

func _on_detection_area_exited(body: Node2D) -> void:
	if body.is_in_group("player"):
		player_ref = null
		alert_icon.visible = false
		GameManager.set_enemy_proximity(unique_id, enemy_name, false)

func _exit_tree() -> void:
	GameManager.set_enemy_proximity(unique_id, enemy_name, false)
