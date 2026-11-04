extends StaticBody2D

@export var npc_name: String = "Elder Kenzo"
@export var npc_role: String = "Village Elder"
@export_multiline var dialogue_text: String = "Welcome to Hakuba Village! The northern hot springs are wonderful, though some of our villagers have grown restless and turned into mountain spirits!"
@export var npc_sprite: Texture2D
@export var target_height: float = 100.0

@onready var sprite: Sprite2D = $Sprite2D
@onready var prompt_label: Label = $PromptLabel
@onready var interaction_area: Area2D = $InteractionArea

var player_nearby: bool = false
var _anim_timer: float = 0.0
var _base_offset_y: float = -44.0

func _ready() -> void:
	if npc_sprite and sprite:
		sprite.texture = npc_sprite
		sprite.texture_filter = CanvasItem.TEXTURE_FILTER_LINEAR_WITH_MIPMAPS
		var tex_h = float(npc_sprite.get_height())
		var s = target_height / max(1.0, tex_h)
		sprite.scale = Vector2(s, s)
		_base_offset_y = -target_height * 0.44
		sprite.position = Vector2(0, _base_offset_y)

	prompt_label.text = "💬 [E] Talk to " + npc_name
	prompt_label.visible = false
	interaction_area.body_entered.connect(_on_interaction_area_entered)
	interaction_area.body_exited.connect(_on_interaction_area_exited)

func _process(delta: float) -> void:
	_anim_timer += delta
	if sprite:
		sprite.position.y = _base_offset_y + sin(_anim_timer * 2.4) * 1.5

func _unhandled_input(event: InputEvent) -> void:
	if player_nearby and event.is_action_pressed("interact"):
		if GameManager.is_dialogue_active:
			GameManager.close_dialogue()
		else:
			var title = npc_name + " (" + npc_role + ")" if npc_role != "" else npc_name
			GameManager.start_dialogue(title, dialogue_text)

func _on_interaction_area_entered(body: Node2D) -> void:
	if body.is_in_group("player"):
		player_nearby = true
		prompt_label.visible = true

func _on_interaction_area_exited(body: Node2D) -> void:
	if body.is_in_group("player"):
		player_nearby = false
		prompt_label.visible = false
		if GameManager.is_dialogue_active:
			GameManager.close_dialogue()
