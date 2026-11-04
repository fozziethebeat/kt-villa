extends StaticBody2D

@export var npc_name: String = "Elder Kenzo"
@export var npc_role: String = "Village Elder"
@export_multiline var dialogue_text: String = "Welcome to Hakuba Village, traveler! The northern hot springs are wonderful in winter, but watch out for mischievous snow monkeys!"
@export var npc_sprite: Texture2D

@onready var sprite: Sprite2D = $Sprite2D
@onready var prompt_label: Label = $PromptLabel
@onready var interaction_area: Area2D = $InteractionArea

var player_nearby: bool = false

func _ready() -> void:
	if npc_sprite and sprite:
		sprite.texture = npc_sprite
	prompt_label.visible = false
	interaction_area.body_entered.connect(_on_interaction_area_entered)
	interaction_area.body_exited.connect(_on_interaction_area_exited)

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
