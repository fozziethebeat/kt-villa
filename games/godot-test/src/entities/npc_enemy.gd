extends CharacterBody2D

## Cozy Regional Critter Entity (Snow Monkey, Kitsune, Stoat, Uribo Piglet, Kamoshika Calf).
## Replaces combat enemies with friendly overworld critters that trade regional fetch/forage items!

@export var enemy_name: String = "Curious Snow Monkey"
@export var enemy_id: String = "wild_snowman"
@export var enemy_uid: String = ""
@export var enemy_sprite: Texture2D
@export var animation_frames: Array = []
@export var animation_fps: float = 6.0
@export var patrol_distance: float = 65.0
@export var patrol_speed: float = 40.0
@export var target_height: float = 88.0

var want_item: String = "Nagano Apple"
var reward_item: String = "Wooden Trail Plaque"
var critter_dialogue: String = "A curious mountain critter is holding something shiny! Offer a snack or friendly bow?"

@onready var sprite: Sprite2D = $Sprite2D
@onready var detection_area: Area2D = $DetectionArea
@onready var interaction_area: Area2D = $InteractionArea
@onready var alert_icon: Label = $AlertIcon
@onready var prompt_badge: Label = $PromptBadge

var start_pos: Vector2
var patrol_target: Vector2
var player_in_approach_range: bool = false
var unique_id: String
var anim_timer: float = 0.0
var _base_offset_y: float = -42.0
var is_pacified: bool = false

func _ready() -> void:
	if enemy_uid.is_empty():
		enemy_uid = enemy_id + "_" + str(int(global_position.x)) + "_" + str(int(global_position.y))
	unique_id = enemy_uid

	start_pos = global_position
	patrol_target = start_pos + Vector2(patrol_distance, 0)

	if animation_frames.size() > 0:
		sprite.texture = animation_frames[0]
	elif enemy_sprite:
		sprite.texture = enemy_sprite

	if sprite.texture:
		sprite.texture_filter = CanvasItem.TEXTURE_FILTER_LINEAR_WITH_MIPMAPS
		var tex_h = float(sprite.texture.get_height())
		var s = target_height / max(1.0, tex_h)
		sprite.scale = Vector2(s, s)
		_base_offset_y = -target_height * 0.44
		sprite.position = Vector2(0, _base_offset_y)

	prompt_badge.text = "🐾 [E] Trade with " + enemy_name
	alert_icon.text = "🎁 Has " + reward_item
	alert_icon.visible = true
	prompt_badge.visible = false

	detection_area.body_entered.connect(_on_detection_area_entered)
	detection_area.body_exited.connect(_on_detection_area_exited)
	interaction_area.body_entered.connect(_on_interaction_area_entered)
	interaction_area.body_exited.connect(_on_interaction_area_exited)

func _physics_process(delta: float) -> void:
	anim_timer += delta

	if is_pacified or GameManager.is_dialogue_active or GameManager.is_encounter_prompt_active or GameManager.is_menu_active:
		velocity = Vector2.ZERO
		if sprite:
			sprite.position.y = _base_offset_y + sin(anim_timer * 2.5) * 1.5
		return

	if global_position.distance_to(patrol_target) < 4.0:
		patrol_target = start_pos - (patrol_target - start_pos)
		sprite.flip_h = (patrol_target.x < global_position.x)

	var dir = (patrol_target - global_position).normalized()
	velocity = dir * patrol_speed
	move_and_slide()

	if sprite:
		sprite.position.y = _base_offset_y - abs(sin(anim_timer * 4.5)) * 3.0

func _unhandled_input(event: InputEvent) -> void:
	if player_in_approach_range and event.is_action_pressed("interact"):
		if not GameManager.is_dialogue_active and not GameManager.is_encounter_prompt_active and not GameManager.is_menu_active:
			get_viewport().set_input_as_handled()
			var data = {
				"id": enemy_id,
				"name": enemy_name,
				"unique_id": unique_id,
				"want_item": want_item,
				"reward_item": reward_item,
				"dialogue": critter_dialogue
			}
			GameManager.request_encounter_prompt(data, self)

func _on_detection_area_entered(_body: Node2D) -> void:
	pass

func _on_detection_area_exited(_body: Node2D) -> void:
	pass

func _on_interaction_area_entered(body: Node2D) -> void:
	if body.is_in_group("player"):
		player_in_approach_range = true
		prompt_badge.visible = true

func _on_interaction_area_exited(body: Node2D) -> void:
	if body.is_in_group("player"):
		player_in_approach_range = false
		prompt_badge.visible = false
		if GameManager.is_encounter_prompt_active:
			GameManager.close_encounter_prompt()

func on_charmed() -> void:
	is_pacified = true
	alert_icon.text = "💖 Happy Critter! (+%s)" % reward_item
	alert_icon.visible = true
	var tween = create_tween()
	tween.tween_property(sprite, "position:y", _base_offset_y - 16.0, 0.16)
	tween.tween_property(sprite, "position:y", _base_offset_y, 0.16)
	# Allow trading again after a brief happy bounce so player can never get softlocked on ingredients!
	tween.tween_interval(1.5)
	tween.tween_callback(func():
		is_pacified = false
		alert_icon.text = "🎁 Has " + reward_item
	)
