extends Node

## Database of Wild Animals, Spook Actions, Jokes & Charms, and Battle Items
## for Hakuba Village JRPG Battle System.

const JOKES: Array[Dictionary] = [
	{
		"setup": "Why did the snowman look through the bag of carrots?",
		"punchline": "He was picking his nose!",
		"power": 35
	},
	{
		"setup": "What do wild yetis call skiers in brightly colored jackets?",
		"punchline": "Snacks in shiny wrappers!",
		"power": 30
	},
	{
		"setup": "What do you call a freezing alpine monkey?",
		"punchline": "A snow-chimp-zee!",
		"power": 40
	},
	{
		"setup": "Why don't mountain bears wear ski boots?",
		"punchline": "They prefer bear-footing down the powder!",
		"power": 32
	},
	{
		"setup": "What's an avalanche's favorite dessert?",
		"punchline": "Ice cream with powdered sugar on top!",
		"power": 28
	},
	{
		"setup": "How do snowmen greet each other in Hakuba?",
		"punchline": "\"Ice to meet you! Freeze a jolly good fellow!\"",
		"power": 34
	},
	{
		"setup": "What did the mountain hot spring say to the skier?",
		"punchline": "\"Jump in! I've been warming up for you all day!\"",
		"power": 30
	},
	{
		"setup": "Why was the wild boar so good at winter sports?",
		"punchline": "Because he was born to snowboard!",
		"power": 36
	}
]

const SPOOK_ACTIONS: Array[Dictionary] = [
	{
		"id": "wave_arms",
		"name": "Wave & Shout",
		"description": "Flail your parka sleeves and shout 'Shoo! Get along now!'",
		"spook_min": 25,
		"spook_max": 35,
		"atb_delay": 0.0,
		"courage_cost": 0,
		"anim": "shout",
		"log": "You flail your arms and make loud startling noises at the %s!"
	},
	{
		"id": "flash_lantern",
		"name": "Flash Lantern",
		"description": "Reflect bright winter glare right towards the beast to startle it.",
		"spook_min": 35,
		"spook_max": 45,
		"atb_delay": 1.5,
		"courage_cost": 5,
		"anim": "flash",
		"log": "FLASH! The sudden glare dazzles and startles the %s!"
	},
	{
		"id": "pots_pans",
		"name": "Pots & Pans",
		"description": "Bang camping cookware together with an ear-splitting metallic CLANG!",
		"spook_min": 50,
		"spook_max": 65,
		"atb_delay": 0.5,
		"courage_cost": 10,
		"anim": "clang",
		"log": "CLANG!! The deafening racket echoes across the snow, spooking the %s!"
	},
	{
		"id": "alpine_yodel",
		"name": "Alpine Yodel",
		"description": "Unleash a piercing alpine yodel that reverberates off the peaks.",
		"spook_min": 40,
		"spook_max": 55,
		"atb_delay": 0.0,
		"courage_cost": 8,
		"anim": "yodel",
		"log": "YOOO-DLE-AY-HEE-HOO! The strange echoing shout rattles the %s's composure!"
	},
	{
		"id": "snowball_feint",
		"name": "Snowball Feint",
		"description": "Hurl a snowball against a pine tree to make a sudden loud rustle.",
		"spook_min": 30,
		"spook_max": 42,
		"atb_delay": 0.5,
		"courage_cost": 4,
		"anim": "feint",
		"log": "THWACK! The sudden noise in the snowy branches startles the %s!"
	},
	{
		"id": "bear_roar",
		"name": "Mock Bear Roar",
		"description": "Imitate the deep resonant growl of an alpine brown bear.",
		"spook_min": 45,
		"spook_max": 60,
		"atb_delay": 0.0,
		"courage_cost": 12,
		"anim": "roar",
		"log": "ROAAAR!! Your fierce bear impression shakes the %s's composure!"
	}
]

const CHARM_ACTIONS: Array[Dictionary] = [
	{
		"id": "dad_joke",
		"name": "Tell Dad Joke",
		"description": "Deliver a corny winter dad joke to disarm the beast with giggles.",
		"charm_min": 30,
		"charm_max": 45,
		"courage_heal": 5,
		"anim": "joke",
		"is_joke": true
	},
	{
		"id": "funny_dance",
		"name": "Funny Dance",
		"description": "Perform an awkward penguin waddle dance across the snowbank.",
		"charm_min": 25,
		"charm_max": 35,
		"courage_heal": 10,
		"anim": "dance",
		"log": "You flap your elbows and waddle goofy in the snow. The %s is thoroughly amused!"
	},
	{
		"id": "alpine_flute",
		"name": "Alpine Flute",
		"description": "Play a sweet, tranquil mountain melody on a wooden alpine flute.",
		"charm_min": 40,
		"charm_max": 55,
		"courage_heal": 15,
		"anim": "music",
		"log": "Gentle flute notes float across the snow. The %s calms and listens intently."
	},
	{
		"id": "polite_bow",
		"name": "Polite Bow",
		"description": "Offer a courteous Japanese ojigi bow, showing peaceful respect.",
		"charm_min": 20,
		"charm_max": 30,
		"courage_heal": 25,
		"anim": "bow",
		"log": "You bow with deep respect. The %s senses your sincerity and steadies its breath."
	}
]

static func get_all_charm_options() -> Array[Dictionary]:
	var result: Array[Dictionary] = []
	# 1. Individual Joke Options so players can pick specific jokes!
	var joke_titles = [
		"Joke: Snowman Nose",
		"Joke: Yeti Snacks",
		"Joke: Snow-Chimp-Zee",
		"Joke: Bear Ski Boots",
		"Joke: Avalanche Dessert",
		"Joke: Jolly Snowman",
		"Joke: Hot Spring Warmup",
		"Joke: Snowboard Boar"
	]
	for i in range(JOKES.size()):
		var j = JOKES[i]
		var title = joke_titles[i] if i < joke_titles.size() else "Joke #%d" % (i + 1)
		result.append({
			"id": "joke_%d" % i,
			"name": title,
			"description": "\"%s\"" % j["setup"],
			"charm_min": j.get("power", 32) - 5,
			"charm_max": j.get("power", 32) + 5,
			"courage_heal": 5,
			"is_joke": true,
			"specific_joke": j
		})
	# 2. Add Charm moves
	result.append({
		"id": "funny_dance",
		"name": "Funny Penguin Dance",
		"description": "Perform an awkward penguin waddle dance across the snowbank.",
		"charm_min": 25,
		"charm_max": 35,
		"courage_heal": 10,
		"anim": "dance",
		"log": "You flap your elbows and waddle goofy in the snow. The %s is thoroughly amused!"
	})
	result.append({
		"id": "alpine_flute",
		"name": "Play Alpine Flute",
		"description": "Play a sweet, tranquil mountain melody on a wooden alpine flute.",
		"charm_min": 40,
		"charm_max": 55,
		"courage_heal": 15,
		"anim": "music",
		"log": "Gentle flute notes float across the snow. The %s calms and listens intently."
	})
	result.append({
		"id": "polite_bow",
		"name": "Polite Mountain Bow",
		"description": "Offer a courteous Japanese ojigi bow, showing peaceful respect.",
		"charm_min": 20,
		"charm_max": 30,
		"courage_heal": 25,
		"anim": "bow",
		"log": "You bow with deep respect. The %s senses your sincerity and steadies its breath."
	})
	return result

const ANIMALS: Dictionary = {
	"wild_snowman": {
		"id": "wild_snowman",
		"name": "Wild Snow Monkey",
		"title": "Onsen-Towel Alpine Pest",
		"sprite_path": "res://assets/storybook/entities/enemy_snow_monkey.png",
		"frames": [],
		"fps": 2.0,
		"max_composure": 100,
		"max_pacification": 100,
		"speed": 26.0,
		"intro": "A mischievous Jigokudani Snow Monkey with a stolen onsen towel on its head blocks the path!",
		"favourite_treat": "apple",
		"favourite_joke_bonus": 1.2,
		"moves": [
			{
				"name": "Snowball Toss",
				"damage": 15,
				"text": "The Snow Monkey hurls a packed snowball straight at your glasses!"
			},
			{
				"name": "Primate Screech",
				"damage": 12,
				"text": "The Snow Monkey chatters loudly and waves a stolen Nagano apple!"
			},
			{
				"name": "Adjust Onsen Towel",
				"damage": 0,
				"pacify_bonus": 10,
				"text": "The Snow Monkey carefully balances the warm white onsen towel on its head."
			}
		],
		"spooked_text": "The Wild Snow Monkey squeaked in surprise and scampered back toward the hot spring rocks!",
		"charmed_text": "The Wild Snow Monkey gives a happy chirp, trades you a friendly wave, and strolls off to soak in the onsen!"
	},
	"sacred_serow": {
		"id": "sacred_serow",
		"name": "Sacred Serow Spirit",
		"title": "Transformed Shinto Priest (Kamoshika)",
		"sprite_path": "res://assets/storybook/entities/enemy_sacred_serow.png",
		"frames": [],
		"fps": 3.0,
		"max_composure": 125,
		"max_pacification": 110,
		"speed": 24.0,
		"intro": "A majestic Japanese Serow wearing a sacred Shinto shimenawa rope gazes at you with golden eyes!",
		"favourite_treat": "charm",
		"favourite_joke_bonus": 1.25,
		"moves": [
			{
				"name": "Mystic Ridge Stomp",
				"damage": 18,
				"text": "The Sacred Serow stamps its cloven hooves—paper shide streamers crackle with mountain wind!"
			},
			{
				"name": "Solemn Shrine Gaze",
				"damage": 14,
				"text": "The Serow fixes you with the stern gaze of a vanished Head Shinto Priest!"
			},
			{
				"name": "Nostalgic Sigh",
				"damage": 0,
				"pacify_bonus": 12,
				"text": "The Sacred Serow glances toward the village shrine, remembering its human days..."
			}
		],
		"spooked_text": "Startled by the commotion, the Sacred Serow bounds gracefully up into the cedar mist!",
		"charmed_text": "The Sacred Serow bows its horned head in solemn gratitude—Head Priest Sato's spirit feels warmed and calmer!"
	},
	"moon_bear": {
		"id": "moon_bear",
		"name": "Sleepy Moon Bear Spirit",
		"title": "Transformed Coffee Roaster (Tsukinowaguma)",
		"sprite_path": "res://assets/storybook/entities/enemy_moon_bear.png",
		"frames": [],
		"fps": 3.0,
		"max_composure": 135,
		"max_pacification": 115,
		"speed": 20.0,
		"intro": "A massive Asiatic Black Bear with a golden latte-art crescent on its chest yawns and waves an espresso tamper!",
		"favourite_treat": "tea",
		"favourite_joke_bonus": 1.3,
		"moves": [
			{
				"name": "Espresso Tamper Thump",
				"damage": 21,
				"text": "The Moon Bear thumps its giant wooden coffee tamper on the ground like a grumpy barista!"
			},
			{
				"name": "Decaf Grumble",
				"damage": 16,
				"text": "The Moon Bear lets out a booming, caffeine-deprived mountain growl!"
			},
			{
				"name": "Sniff Coffee Thermos",
				"damage": 0,
				"pacify_bonus": 14,
				"text": "The Moon Bear's nose twitches happily at the aroma of your coffee thermos..."
			}
		],
		"spooked_text": "The Sleepy Moon Bear grumbles about noisy tourists and lumbers back into the cedar woods for a nap!",
		"charmed_text": "Cheered up by warm drinks and good humor, Barista Haru's bear spirit smiles contentedly and relaxes!"
	}
}

static func get_animal_data(key: String) -> Dictionary:
	var clean = key.to_lower()
	if "serow" in clean or "kamoshika" in clean or "priest" in clean:
		return ANIMALS["sacred_serow"].duplicate(true)
	elif "bear" in clean or "yeti" in clean or "coffee" in clean:
		return ANIMALS["moon_bear"].duplicate(true)
	elif "monkey" in clean or "snowman" in clean:
		return ANIMALS["wild_snowman"].duplicate(true)
	elif ANIMALS.has(clean):
		return ANIMALS[clean].duplicate(true)
	return ANIMALS["wild_snowman"].duplicate(true)

static func get_random_joke() -> Dictionary:
	return JOKES.pick_random()
