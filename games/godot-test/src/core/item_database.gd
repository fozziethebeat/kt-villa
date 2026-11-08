extends Node

## Centralized Item Database containing rich Cozy Hakuba metadata, lore, and stats
## for regional forageables, fetch-quest relics, and crafted Van-Life goods.

const ITEMS: Dictionary = {
	"apple": {
		"id": "apple",
		"name": "Nagano Apple",
		"japanese_name": "信州りんご",
		"category": "Foraged Ingredients",
		"rarity": "Local Fruit",
		"icon_key": "apple",
		"can_use": true,
		"use_verb": "Eat Crisp Apple",
		"effects_text": "🍎 Used in Café Pastries & Critter Trades  •  +20 Stamina",
		"lore": "A crisp, honey-sweet apple harvested from the orchard slopes of Nagano Prefecture. Loved by snow monkeys and essential for baking Shinshu Apple Cinnamon Tarts in your van.",
		"hp_restore": 20,
		"warmth_boost": 15.0
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
		"effects_text": "🎿 All-Mountain Hakuba Valley Pass",
		"lore": "An all-access seasonal lift pass stamped with the Hakuba Sanzan seal.",
		"hp_restore": 0,
		"warmth_boost": 0.0
	},
	"tea": {
		"id": "tea",
		"name": "Onsen Tea",
		"japanese_name": "温泉茶葉",
		"category": "Foraged Ingredients",
		"rarity": "Thermal Leaf",
		"icon_key": "tea",
		"can_use": true,
		"use_verb": "Sip Warm Tea",
		"effects_text": "🍵 Base for Onsen Ginger Tea & Steamed Manju",
		"lore": "Fragrant green tea leaves steamed over mineral-rich thermal spring vents in Hakuba.",
		"hp_restore": 35,
		"warmth_boost": 25.0
	},
	"charm": {
		"id": "charm",
		"name": "Lucky Charm",
		"japanese_name": "白馬山神社御守",
		"category": "Sacred Relics",
		"rarity": "Shrine Talisman",
		"icon_key": "charm",
		"can_use": false,
		"use_verb": "Admire",
		"effects_text": "⛩️ Used in Shrine Restoration & Folk Crafts",
		"lore": "A silk brocade omamori amulet blessed at the Happo-One mountain shrine.",
		"hp_restore": 0,
		"warmth_boost": 0.0
	},
	"wooden trail plaque": {
		"id": "wooden trail plaque",
		"name": "Wooden Trail Plaque",
		"japanese_name": "白馬道標板",
		"category": "Restoration Items",
		"rarity": "Station Relic",
		"icon_key": "charm",
		"can_use": false,
		"use_verb": "Read Carving",
		"effects_text": "🪧 Needed by Elder Kenzo at JR Hakuba Station",
		"lore": "A hand-carved hinoki directional sign blown off the JR Hakuba Station map board.",
		"hp_restore": 0,
		"warmth_boost": 0.0
	},
	"titanium camp stake": {
		"id": "titanium camp stake",
		"name": "Titanium Camp Stake",
		"japanese_name": "鍛造ペグ",
		"category": "Restoration Items",
		"rarity": "Outfitter Gear",
		"icon_key": "skipass",
		"can_use": false,
		"use_verb": "Inspect Stake",
		"effects_text": "⛺ Needed by the Tanuki Spirit at Snow Peak Land Station",
		"lore": "An ultralight forged titanium tent peg designed for pitching glamping tents in deep snow.",
		"hp_restore": 0,
		"warmth_boost": 0.0
	},
	"rolled onsen towel": {
		"id": "rolled onsen towel",
		"name": "Rolled Onsen Towel",
		"japanese_name": "温泉手ぬぐい",
		"category": "Restoration Items",
		"rarity": "Bathhouse Linen",
		"icon_key": "skipass",
		"can_use": false,
		"use_verb": "Feel Warmth",
		"effects_text": "♨️ Needed by the Steam Macaque Spirit at Happo Bus Terminal",
		"lore": "A steaming cotton tenugui towel stamped with the Happo Onsen crest—often borrowed by snow monkeys.",
		"hp_restore": 0,
		"warmth_boost": 0.0
	},
	"snow-aged beans": {
		"id": "snow-aged beans",
		"name": "Snow-Aged Beans",
		"japanese_name": "雪室珈琲豆",
		"category": "Foraged Ingredients",
		"rarity": "Roastery Specialty",
		"icon_key": "charm",
		"can_use": false,
		"use_verb": "Smell Aroma",
		"effects_text": "☕ Brews Crescent-Moon Pour-Over in the Café Van",
		"lore": "Specialty arabica coffee beans mellowed in a natural Hakuba snow cellar (Yukimuro) for a chocolatey, zero-bitterness finish.",
		"hp_restore": 0,
		"warmth_boost": 0.0
	},
	"highland berries": {
		"id": "highland berries",
		"name": "Highland Berries",
		"japanese_name": "岩岳高原ベリー",
		"category": "Foraged Ingredients",
		"rarity": "Alpine Fruit",
		"icon_key": "apple",
		"can_use": true,
		"use_verb": "Snack on Berries",
		"effects_text": "🥐 Bakes Highland Berry Croissants at Iwatake",
		"lore": "Tart, ruby-red mountain lingonberries picked from the windswept beech ridges of Hakuba Iwatake.",
		"hp_restore": 25,
		"warmth_boost": 10.0
	},
	"shinshu buckwheat": {
		"id": "shinshu buckwheat",
		"name": "Shinshu Buckwheat",
		"japanese_name": "信州玄そば",
		"category": "Foraged Ingredients",
		"rarity": "Mountain Grain",
		"icon_key": "charm",
		"can_use": false,
		"use_verb": "Inspect Grain",
		"effects_text": "🍜 Simmers Shinshu Buckwheat Soba in your Yatai Kitchen",
		"lore": "Fragrant high-altitude buckwheat harvested from the frosty fields at the base of Hakuba Goryu.",
		"hp_restore": 0,
		"warmth_boost": 0.0
	},
	"pine resin": {
		"id": "pine resin",
		"name": "Pine Resin",
		"japanese_name": "赤松の琥珀脂",
		"category": "Foraged Ingredients",
		"rarity": "Forest Craft Material",
		"icon_key": "charm",
		"can_use": false,
		"use_verb": "Examine Resin",
		"effects_text": "🎿 Crafts Beeswax Camp Tarps & Hinoki Powder Board Wax",
		"lore": "Golden, aromatic amber sap gathered from ancient Japanese red pines.",
		"hp_restore": 0,
		"warmth_boost": 0.0
	},
	"driftwood cedar": {
		"id": "driftwood cedar",
		"name": "Driftwood Cedar",
		"japanese_name": "青木湖の流木杉",
		"category": "Foraged Ingredients",
		"rarity": "Lakeside Timber",
		"icon_key": "skipass",
		"can_use": false,
		"use_verb": "Feel Grain",
		"effects_text": "🪵 Carves Cedar Kuksa Camp Mugs at Lake Aoki",
		"lore": "Water-smoothed Japanese cedar cured in the crystal-clear glacial waters of Lake Aoki.",
		"hp_restore": 0,
		"warmth_boost": 0.0
	},
	"mountain walnut": {
		"id": "mountain walnut",
		"name": "Mountain Walnut",
		"japanese_name": "鬼ぐるみ",
		"category": "Foraged Ingredients",
		"rarity": "Tsugaike Nut",
		"icon_key": "apple",
		"can_use": true,
		"use_verb": "Crack & Eat",
		"effects_text": "🍡 Grills Walnut Miso Gohei Mochi at Tsugaike",
		"lore": "Rich, buttery wild Japanese walnuts gathered along the snow walls of Tsugaike Kogen.",
		"hp_restore": 30,
		"warmth_boost": 15.0
	}
}

func get_item(key: String) -> Dictionary:
	var clean = normalize_key(key)
	if ITEMS.has(clean):
		return ITEMS[clean]
	# Check if it's a crafted recipe item from CozyDatabase
	for rec_id in CozyDatabase.RECIPES:
		var rec = CozyDatabase.RECIPES[rec_id]
		if rec["name"].to_lower() == key.to_lower() or rec_id == clean:
			return {
				"id": rec_id,
				"name": rec["name"],
				"japanese_name": "自家製・白馬バン工房",
				"category": "Crafted Van Goods",
				"rarity": "¥%d Shop Item" % rec["sell_price"],
				"icon_key": "tea" if rec["license"] != "craft" else "charm",
				"can_use": true,
				"use_verb": "Sample Creation",
				"effects_text": "%s Sells for ¥%d in Van Window  •  +%d🔥 Valley Warmth" % [rec["icon"], rec["sell_price"], rec["warmth_gain"]],
				"lore": rec["desc"],
				"hp_restore": 40,
				"warmth_boost": 30.0
			}
	return {
		"id": clean,
		"name": key,
		"japanese_name": "白馬の恵み",
		"category": "Valley Items",
		"rarity": "Regional",
		"icon_key": _guess_icon_key(key),
		"can_use": false,
		"use_verb": "Examine",
		"effects_text": "Regional item from Hakuba Valley",
		"lore": "Gathered during your travels across the 10 sub-regions of Hakuba Valley.",
		"hp_restore": 0,
		"warmth_boost": 0.0
	}

func _guess_icon_key(key: String) -> String:
	var lower = key.to_lower()
	if "apple" in lower or "berr" in lower or "walnut" in lower or "tart" in lower or "croissant" in lower:
		return "apple"
	elif "tea" in lower or "coffee" in lower or "soba" in lower or "manju" in lower or "mochi" in lower or "platter" in lower:
		return "tea"
	elif "stake" in lower or "towel" in lower or "cedar" in lower or "pass" in lower or "wax" in lower:
		return "skipass"
	return "charm"

func get_all_item_keys() -> Array[String]:
	return ["apple", "skipass", "tea", "charm"]

func get_item_texture(key: String) -> Texture2D:
	var item_data = get_item(key)
	var icon_key = item_data.get("icon_key", _guess_icon_key(key))
	return AssetRegistry.get_item_texture(icon_key)

func normalize_key(key: String) -> String:
	var lower = key.to_lower().strip_edges()
	if lower == "nagano apple":
		return "apple"
	elif lower == "ski pass":
		return "skipass"
	elif lower == "onsen tea":
		return "tea"
	elif lower == "lucky charm":
		return "charm"
	return lower
