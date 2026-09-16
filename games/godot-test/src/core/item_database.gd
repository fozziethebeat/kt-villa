extends Node

## Centralized Item Database containing rich JRPG metadata, lore, and stats
## for Hakuba Village RPG.

const ITEMS: Dictionary = {
	"apple": {
		"id": "apple",
		"name": "Nagano Apple",
		"japanese_name": "信州りんご",
		"category": "Consumables",
		"rarity": "Local Fruit",
		"icon_key": "apple",
		"can_use": true,
		"use_verb": "Eat Apple",
		"effects_text": "❤️ Restores +35 HP  •  ❄️ +20s Winter Warmth",
		"lore": "A crisp, sweet apple harvested from the orchard slopes of Nagano Prefecture. Renowned across Japan for its honey-sweet crunch and rich juiciness. A favorite trail snack for alpine explorers.",
		"hp_restore": 35,
		"warmth_boost": 20.0
	},
	"skipass": {
		"id": "skipass",
		"name": "Ski Pass",
		"japanese_name": "白馬リフト券",
		"category": "Key Items",
		"rarity": "Mountain Access",
		"icon_key": "skipass",
		"can_use": false,
		"use_verb": "Inspect Pass",
		"effects_text": "🎿 Unlocks Southern Ski Slopes & Mountain Chairlifts",
		"lore": "An all-access seasonal lift ticket for the Happo-One Hakuba slopes. The RFID chip is stamped with the northern Alps seal. Show this to Ski Guide Yuki to access the powder snow trails.",
		"hp_restore": 0,
		"warmth_boost": 0.0
	},
	"tea": {
		"id": "tea",
		"name": "Onsen Tea",
		"japanese_name": "温泉緑茶",
		"category": "Consumables",
		"rarity": "Thermal Drink",
		"icon_key": "tea",
		"can_use": true,
		"use_verb": "Drink Tea",
		"effects_text": "🍵 Restores +50 HP  •  🔥 Cleanses Cold Debuff",
		"lore": "Steaming green tea brewed with mineral-rich thermal water from Hakuba's natural hot spring baths. Served hot in a handcrafted cedar cup to soothe weary and frozen travelers.",
		"hp_restore": 50,
		"warmth_boost": 35.0
	},
	"charm": {
		"id": "charm",
		"name": "Lucky Charm",
		"japanese_name": "白馬山神社御守",
		"category": "Relics",
		"rarity": "Sacred Talisman",
		"icon_key": "charm",
		"can_use": false,
		"use_verb": "Gaze Upon",
		"effects_text": "⛩️ Passive: +15% Movement Speed on Powder Snow",
		"lore": "A traditional silk brocade omamori amulet blessed by the mountain shrine priests. Warded with sacred mountain seals to protect the wearer against ferocious yetis and freezing winter tempests.",
		"hp_restore": 0,
		"warmth_boost": 0.0
	}
}

func get_item(key: String) -> Dictionary:
	var clean = normalize_key(key)
	if ITEMS.has(clean):
		return ITEMS[clean]
	return {
		"id": clean,
		"name": key.capitalize(),
		"japanese_name": "",
		"category": "Miscellaneous",
		"rarity": "Common",
		"icon_key": clean,
		"can_use": false,
		"use_verb": "Examine",
		"effects_text": "No special effect",
		"lore": "An item collected in Hakuba village.",
		"hp_restore": 0,
		"warmth_boost": 0.0
	}

func get_all_item_keys() -> Array[String]:
	return ["apple", "skipass", "tea", "charm"]

func get_item_texture(key: String) -> Texture2D:
	var clean = normalize_key(key)
	return AssetRegistry.get_item_texture(clean)

func normalize_key(key: String) -> String:
	var lower = key.to_lower()
	if "apple" in lower:
		return "apple"
	elif "pass" in lower or "skipass" in lower:
		return "skipass"
	elif "tea" in lower:
		return "tea"
	elif "charm" in lower:
		return "charm"
	return lower
