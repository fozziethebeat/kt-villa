extends Area2D

@export var item_name: String = "Nagano Apple"
@export var item_icon: Texture2D

@onready var sprite: Sprite2D = $Sprite2D

var float_offset: float = 0.0
var base_y: float = 0.0
var is_collected: bool = false

func _ready() -> void:
	base_y = sprite.position.y
	if item_icon and sprite:
		sprite.texture = item_icon
		var tex_size = item_icon.get_size()
		if tex_size.x > 16.0 or tex_size.y > 16.0:
			var max_dim = max(tex_size.x, tex_size.y)
			var s = 16.0 / max_dim
			sprite.scale = Vector2(s, s)
		else:
			sprite.scale = Vector2(1.0, 1.0)
	body_entered.connect(_on_body_entered)

func _process(delta: float) -> void:
	if not is_collected:
		float_offset += delta * 4.0
		sprite.position.y = base_y + sin(float_offset) * 2.0

func _on_body_entered(body: Node2D) -> void:
	if is_collected:
		return
	if body.is_in_group("player"):
		is_collected = true
		GameManager.add_item(item_name, sprite.texture)
		
		# Quick bounce & fade out tween
		var tween = create_tween().set_parallel(true)
		tween.tween_property(sprite, "position:y", base_y - 12.0, 0.25).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_OUT)
		tween.tween_property(sprite, "modulate:a", 0.0, 0.25)
		tween.chain().tween_callback(queue_free)
