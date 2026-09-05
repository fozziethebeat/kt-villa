extends CharacterBody2D

@export var move_speed: float = 90.0
@export var sprint_speed: float = 140.0

@onready var sprite: Sprite2D = $Sprite2D
@onready var anim_player: AnimationPlayer = $AnimationPlayer

var is_moving: bool = false
var facing_direction: Vector2 = Vector2.DOWN

func _physics_process(_delta: float) -> void:
	if GameManager.is_dialogue_active:
		velocity = Vector2.ZERO
		move_and_slide()
		if anim_player.is_playing() and anim_player.current_animation != "idle":
			anim_player.play("idle")
		return

	var input_dir: Vector2 = Input.get_vector("move_left", "move_right", "move_up", "move_down")
	var speed: float = sprint_speed if Input.is_action_pressed("sprint") else move_speed

	if input_dir != Vector2.ZERO:
		velocity = input_dir.normalized() * speed
		facing_direction = input_dir
		is_moving = true
		
		# Flip sprite based on horizontal direction
		if input_dir.x < 0:
			sprite.flip_h = true
		elif input_dir.x > 0:
			sprite.flip_h = false
			
		if anim_player.current_animation != "walk":
			anim_player.play("walk")
	else:
		velocity = Vector2.ZERO
		is_moving = false
		if anim_player.current_animation != "idle":
			anim_player.play("idle")

	move_and_slide()
