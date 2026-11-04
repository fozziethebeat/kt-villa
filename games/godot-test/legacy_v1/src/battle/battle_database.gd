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
		"title": "Mischievous Alpine Primate",
		"sprite_path": "res://assets/sprites/enemy_snow_monkey.png",
		"frames": [],
		"fps": 2.0,
		"max_composure": 100,
		"max_pacification": 100,
		"speed": 26.0,
		"intro": "A mischievous Wild Snow Monkey perches on a snowdrift, eyeing you with curiosity!",
		"favourite_treat": "apple",
		"favourite_joke_bonus": 1.2,
		"moves": [
			{
				"name": "Snowball Toss",
				"damage": 15,
				"text": "The Snow Monkey hurls a packed snowball straight at your hat!"
			},
			{
				"name": "Primate Screech",
				"damage": 12,
				"text": "The Snow Monkey gives a shrill chattering screech, testing your nerve!"
			},
			{
				"name": "Curious Tilt",
				"damage": 0,
				"pacify_bonus": 8,
				"text": "The Snow Monkey tilts its head, blinking in wonder at your strange outfit."
			}
		],
		"spooked_text": "The Wild Snow Monkey got startled, squeaked loudly, and dashed up into the snowy pines!",
		"charmed_text": "The Wild Snow Monkey gives a cheerful chirp, bounds up to inspect your mittens, and strolls away peacefully!"
	},
	"forest_yeti": {
		"id": "forest_yeti",
		"name": "Mountain Forest Yeti",
		"title": "Ancient Snowy Guardian",
		"sprite_path": "res://assets/sprites/enemy_yeti_1.png",
		"frames": [
			"res://assets/sprites/enemy_yeti_0.png",
			"res://assets/sprites/enemy_yeti_1.png",
			"res://assets/sprites/enemy_yeti_2.png"
		],
		"fps": 5.0,
		"max_composure": 130,
		"max_pacification": 120,
		"speed": 22.0,
		"intro": "A towering Mountain Forest Yeti lumbers forward, kicking up deep powder snow!",
		"favourite_treat": "tea",
		"favourite_joke_bonus": 1.3,
		"moves": [
			{
				"name": "Avalanche Stomp",
				"damage": 22,
				"text": "The Yeti stomps the snow fiercely, sending tremors through your boots!"
			},
			{
				"name": "Alpine Bellow",
				"damage": 18,
				"text": "The Yeti bellows a resonant mountain roar that rattles your courage!"
			},
			{
				"name": "Frosty Yawn",
				"damage": 0,
				"pacify_bonus": 10,
				"text": "The Yeti stretches its massive arms and lets out a frosty, sleepy yawn..."
			}
		],
		"spooked_text": "The Mountain Forest Yeti throws its arms up, startled by the racket, and bounds off into the deep forest!",
		"charmed_text": "The Mountain Forest Yeti chuckles deeply, gives a friendly wave with its giant paw, and reclines peacefully in the snow!"
	},
	"wild_boar": {
		"id": "wild_boar",
		"name": "Wild Mountain Boar",
		"title": "Rugged Alpine Rusher",
		"sprite_path": "res://assets/sprites/enemy_boar.png",
		"frames": [],
		"fps": 3.0,
		"max_composure": 110,
		"max_pacification": 90,
		"speed": 30.0,
		"intro": "A bristling Wild Mountain Boar paws the frozen ground, snorting steamy breath!",
		"favourite_treat": "apple",
		"favourite_joke_bonus": 1.0,
		"moves": [
			{
				"name": "Snow Plow Charge",
				"damage": 20,
				"text": "The Boar charges forward, scattering a rooster tail of powder snow!"
			},
			{
				"name": "Steamy Snort",
				"damage": 14,
				"text": "The Boar snorts fiercely and snaps its tusks!"
			},
			{
				"name": "Sniff Ground",
				"damage": 0,
				"pacify_bonus": 6,
				"text": "The Boar sniffs around in the snow looking for buried acorns."
			}
		],
		"spooked_text": "The Wild Boar wheezes in fright, turns around, and scrambles down the slope into the undergrowth!",
		"charmed_text": "The Wild Boar happily wiggles its snout, rubs its back against a cedar post, and wanders off peacefully!"
	},
	"snow_wolf": {
		"id": "snow_wolf",
		"name": "Hakuba Snow Wolf",
		"title": "Silver Prowler",
		"sprite_path": "res://assets/sprites/enemy_wolf.png",
		"frames": [],
		"fps": 3.0,
		"max_composure": 115,
		"max_pacification": 110,
		"speed": 28.0,
		"intro": "A sleek Hakuba Snow Wolf steps lightly onto the snowy trail, watching your every step.",
		"favourite_treat": "tea",
		"favourite_joke_bonus": 1.1,
		"moves": [
			{
				"name": "Echoing Howl",
				"damage": 18,
				"text": "The Snow Wolf howls to the snowy peaks, sending chills down your spine!"
			},
			{
				"name": "Prowling Leap",
				"damage": 15,
				"text": "The Wolf leaps gracefully across a snowbank, feigning a sudden rush!"
			},
			{
				"name": "Curious Whimper",
				"damage": 0,
				"pacify_bonus": 10,
				"text": "The Wolf cocks its ears and lets out a soft, inquisitive whimper."
			}
		],
		"spooked_text": "The Hakuba Snow Wolf lowers its tail in surprise and darts like a silver arrow into the blizzard!",
		"charmed_text": "The Snow Wolf wags its tail, rolls over into the fresh powder, and trotts off contentedly!"
	}
}

static func get_animal_data(key: String) -> Dictionary:
	var clean = key.to_lower()
	if "monkey" in clean or "snowman" in clean:
		return ANIMALS["wild_snowman"].duplicate(true)
	elif "yeti" in clean:
		return ANIMALS["forest_yeti"].duplicate(true)
	elif "boar" in clean:
		return ANIMALS["wild_boar"].duplicate(true)
	elif "wolf" in clean:
		return ANIMALS["snow_wolf"].duplicate(true)
	elif ANIMALS.has(clean):
		return ANIMALS[clean].duplicate(true)
	return ANIMALS["wild_snowman"].duplicate(true)

static func get_random_joke() -> Dictionary:
	return JOKES.pick_random()
