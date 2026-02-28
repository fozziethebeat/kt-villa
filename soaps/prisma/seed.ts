import {
  PrismaClient,
  Prisma,
  RecipeType,
  BatchStatus,
  RequestStatus,
} from '../src/lib/generated/prisma';

const prisma = new PrismaClient();

// ─── Reference Data ────────────────────────────────────────────────

const users: Prisma.UserCreateInput[] = [
  {
    name: 'Admin McAdminFace',
    email: process.env.ADMIN_EMAIL || '',
    roles: 'admin',
  },
  {
    name: 'Testy McTestFace',
    email: process.env.TEST_USER_EMAIL || '',
  },
];

const entityData: Prisma.EntityCreateInput[] = [
  {
    name: 'Chiver Me Tbimars',
    content: 'I got timbers, do you?',
  },
  {
    name: 'Char Char JInks',
    content: 'I am not Jar Jar I am Char Char',
  },
];

const magicCodes: Prisma.MagicCodeCreateInput[] = [
  { id: 'testcode' },
  { id: 'testcode2' },
  { id: 'lavender-dreams' },
  { id: 'forest-walk' },
  { id: 'rose-garden' },
];

const ingredients: Prisma.IngredientCreateInput[] = [
  // Base Ingredients
  { name: 'Olive Oil', type: RecipeType.BASE, quantity: 1000, unit: 'g' },
  { name: 'Coconut Oil', type: RecipeType.BASE, quantity: 1000, unit: 'g' },
  { name: 'Palm Oil', type: RecipeType.BASE, quantity: 1000, unit: 'g' },
  { name: 'Castor Oil', type: RecipeType.BASE, quantity: 1000, unit: 'g' },
  { name: 'Lye (NaOH)', type: RecipeType.BASE, quantity: 1000, unit: 'g' },
  { name: 'Distilled Water', type: RecipeType.BASE, quantity: 1000, unit: 'g' },
  { name: 'Shea Butter', type: RecipeType.BASE, quantity: 1000, unit: 'g' },
  { name: 'Cocoa Butter', type: RecipeType.BASE, quantity: 1000, unit: 'g' },
  { name: 'Sweet Almond Oil', type: RecipeType.BASE, quantity: 1000, unit: 'g' },
  { name: 'Avocado Oil', type: RecipeType.BASE, quantity: 0, unit: 'g' },
  { name: 'Jojoba Oil', type: RecipeType.BASE, quantity: 0, unit: 'g' },

  // Essential Oils (Style)
  { name: 'Bergamot Essential Oil', type: RecipeType.STYLE, quantity: 100, unit: 'g' },
  { name: 'Lavender Essential Oil', type: RecipeType.STYLE, quantity: 100, unit: 'g' },
  { name: 'Vanilla Oleoresin', type: RecipeType.STYLE, quantity: 100, unit: 'g' },
  { name: 'Geranium Rose Essential Oil', type: RecipeType.STYLE, quantity: 100, unit: 'g' },
  { name: 'Coconut Pulp CO2', type: RecipeType.STYLE, quantity: 100, unit: 'g' },
  { name: 'Litsea Cubeba Essential Oil', type: RecipeType.STYLE, quantity: 100, unit: 'g' },
  { name: 'Rose Essence', type: RecipeType.STYLE, quantity: 100, unit: 'g' },
  { name: 'MUJI Woody Blend', type: RecipeType.STYLE, quantity: 100, unit: 'g' },
  { name: 'Cypress Essential Oil', type: RecipeType.STYLE, quantity: 100, unit: 'g' },
  { name: 'Cedarwood Atlas Essential Oil', type: RecipeType.STYLE, quantity: 100, unit: 'g' },
  { name: 'Hinoki Essential Oil', type: RecipeType.STYLE, quantity: 100, unit: 'g' },
  { name: 'Jasmine Absolute 10%', type: RecipeType.STYLE, quantity: 100, unit: 'g' },
  { name: 'Balsam Peru Essential Oil', type: RecipeType.STYLE, quantity: 100, unit: 'g' },
  { name: 'Clary Sage Essential Oil', type: RecipeType.STYLE, quantity: 100, unit: 'g' },
  { name: 'Douglas Fir Essential Oil', type: RecipeType.STYLE, quantity: 100, unit: 'g' },
  { name: 'Patchouli Essential Oil', type: RecipeType.STYLE, quantity: 100, unit: 'g' },
  { name: 'Sage Essential Oil', type: RecipeType.STYLE, quantity: 100, unit: 'g' },
  { name: 'Juniper Berry Essential Oil', type: RecipeType.STYLE, quantity: 100, unit: 'g' },
  { name: 'Pine Needle Essential Oil', type: RecipeType.STYLE, quantity: 100, unit: 'g' },
  { name: 'Neroli Essential Oil', type: RecipeType.STYLE, quantity: 100, unit: 'g' },

  // Additives (Style)
  { name: 'Rose Clay', type: RecipeType.STYLE, quantity: 100, unit: 'g' },
  { name: 'Rose Petals', type: RecipeType.STYLE, quantity: 50, unit: 'g' },
  { name: 'Activated Charcoal', type: RecipeType.STYLE, quantity: 200, unit: 'g' },
  { name: 'Jasmine Flowers', type: RecipeType.STYLE, quantity: 50, unit: 'g' },
  { name: 'Sea Clay', type: RecipeType.STYLE, quantity: 0, unit: 'g' },
];

const recipes: Prisma.RecipeCreateInput[] = [
  {
    name: 'Standard Olive Oil Soap',
    type: RecipeType.BASE,
    notes: 'A simple, classic Castile soap.',
    ingredients: [
      { name: 'Olive Oil', quantity: '500', unit: 'g' },
      { name: 'Distilled Water', quantity: '150', unit: 'g' },
      { name: 'Lye (NaOH)', quantity: '68', unit: 'g' },
    ],
  },
  {
    name: 'Shea Butter Luxury Base',
    type: RecipeType.BASE,
    notes: 'A rich, moisturizing base with shea butter and coconut oil.',
    ingredients: [
      { name: 'Olive Oil', quantity: '350', unit: 'g' },
      { name: 'Coconut Oil', quantity: '200', unit: 'g' },
      { name: 'Shea Butter', quantity: '100', unit: 'g' },
      { name: 'Castor Oil', quantity: '50', unit: 'g' },
      { name: 'Distilled Water', quantity: '200', unit: 'g' },
      { name: 'Lye (NaOH)', quantity: '95', unit: 'g' },
    ],
  },
  {
    name: 'Basic Charcoal Soap',
    type: RecipeType.STYLE,
    notes: 'Detoxifying charcoal soap.',
    ingredients: [
      { name: 'Activated Charcoal', quantity: '10', unit: 'g' },
      { name: 'Tea Tree Essential Oil', quantity: '5', unit: 'g' },
    ],
  },
  {
    name: 'Labor Day Mess',
    type: RecipeType.STYLE,
    notes: '',
    ingredients: [
      { name: 'Cedarwood Atlas Essential Oil', quantity: '11', unit: 'g' },
      { name: 'Hinoki Essential Oil', quantity: '1', unit: 'g' },
      { name: 'Geranium Rose Essential Oil', quantity: '1', unit: 'g' },
      { name: 'Lavender Essential Oil', quantity: '1', unit: 'g' },
      { name: 'Jasmine Absolute 10%', quantity: '1', unit: 'g' },
      { name: 'Rose Clay', quantity: '2', unit: 'g' },
      { name: 'Rose Petals', quantity: '5', unit: 'g' },
    ],
  },
  {
    name: 'Experiment 12-09',
    type: RecipeType.STYLE,
    notes: '',
    ingredients: [
      { name: 'Cypress Essential Oil', quantity: '8', unit: 'g' },
      { name: 'Rose Essence', quantity: '8', unit: 'g' },
      { name: 'Rose Petals', quantity: '2', unit: 'g' },
      { name: 'Rose Clay', quantity: '2', unit: 'g' },
    ],
  },
  {
    name: 'Experiment 25-11-02',
    type: RecipeType.STYLE,
    notes: '',
    ingredients: [
      { name: 'MUJI Woody Blend', quantity: '10', unit: 'g' },
    ],
  },
  {
    name: 'Experiment 25-10-18',
    type: RecipeType.STYLE,
    notes: '',
    ingredients: [
      { name: 'Coconut Pulp CO2', quantity: '6', unit: 'g' },
      { name: 'Geranium Rose Essential Oil', quantity: '4', unit: 'g' },
      { name: 'Litsea Cubeba Essential Oil', quantity: '4', unit: 'g' },
      { name: 'Rose Essence', quantity: '2', unit: 'g' },
    ],
  },
  {
    name: 'Experiment 25-09-15',
    type: RecipeType.STYLE,
    notes: '',
    ingredients: [
      { name: 'Bergamot Essential Oil', quantity: '6', unit: 'g' },
      { name: 'Lavender Essential Oil', quantity: '6', unit: 'g' },
      { name: 'Vanilla Oleoresin', quantity: '3', unit: 'g' },
    ],
  },
  {
    name: 'Experiment 24-10-14',
    type: RecipeType.STYLE,
    notes: '',
    ingredients: [
      { name: 'Hinoki Essential Oil', quantity: '10', unit: 'g' },
      { name: 'Rose Essence', quantity: '10', unit: 'g' },
    ],
  },
  {
    name: 'Experiment 24-10-09',
    type: RecipeType.STYLE,
    notes: '',
    ingredients: [
      { name: 'Pine Needle Essential Oil', quantity: '5', unit: 'g' },
      { name: 'Neroli Essential Oil', quantity: '5', unit: 'g' },
    ],
  },
  {
    name: 'Experiment 24-11-13',
    type: RecipeType.STYLE,
    notes: '',
    ingredients: [
      { name: 'Jasmine Absolute 10%', quantity: '9', unit: 'g' },
      { name: 'Cedarwood Atlas Essential Oil', quantity: '4', unit: 'g' },
      { name: 'Juniper Berry Essential Oil', quantity: '2', unit: 'g' },
    ],
  },
  {
    name: 'Experiment 24-12-07',
    type: RecipeType.STYLE,
    notes: '',
    ingredients: [
      { name: 'Cedarwood Atlas Essential Oil', quantity: '4', unit: 'g' },
      { name: 'Patchouli Essential Oil', quantity: '4', unit: 'g' },
      { name: 'Sage Essential Oil', quantity: '7', unit: 'g' },
      { name: 'Sea Clay', quantity: '2', unit: 'g' },
      { name: 'Jasmine Flowers', quantity: '2', unit: 'g' },
    ],
  },
  {
    name: 'Experiment 24-11-16',
    type: RecipeType.STYLE,
    notes: '',
    ingredients: [
      { name: 'Cypress Essential Oil', quantity: '5', unit: 'g' },
      { name: 'Hinoki Essential Oil', quantity: '5', unit: 'g' },
      { name: 'Lavender Essential Oil', quantity: '5', unit: 'g' },
    ],
  },
  {
    name: 'Experiment 24-12-15',
    type: RecipeType.STYLE,
    notes: '',
    ingredients: [
      { name: 'Balsam Peru Essential Oil', quantity: '5', unit: 'g' },
      { name: 'Clary Sage Essential Oil', quantity: '5', unit: 'g' },
      { name: 'Douglas Fir Essential Oil', quantity: '5', unit: 'g' },
      { name: 'Activated Charcoal', quantity: '2', unit: 'g' },
    ],
  },
];

// ─── Helpers ───────────────────────────────────────────────────────

/** Returns a Date offset from today by `days` (negative = past). */
function daysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

// ─── Main ──────────────────────────────────────────────────────────

export async function main() {
  console.log('🌱 Starting seed…\n');

  // ── 1. Users ──────────────────────────────────────────────────────
  console.log('👤 Seeding users…');
  const seededUsers: Record<string, string> = {};
  for (const data of users) {
    const user = await prisma.user.upsert({
      where: { email: data.email },
      update: { name: data.name, roles: data.roles ?? 'general' },
      create: data,
    });
    seededUsers[data.email] = user.id;
    console.log(`   ✓ ${data.name} (${data.email})`);
  }
  const adminId = seededUsers[process.env.ADMIN_EMAIL || ''];
  const testUserId = seededUsers[process.env.TEST_USER_EMAIL || ''];

  // ── 2. Entities ───────────────────────────────────────────────────
  console.log('📦 Seeding entities…');
  for (const data of entityData) {
    const existing = await prisma.entity.findFirst({
      where: { name: data.name },
    });
    if (!existing) {
      await prisma.entity.create({ data });
      console.log(`   ✓ Created "${data.name}"`);
    } else {
      console.log(`   – "${data.name}" already exists, skipping`);
    }
  }

  // ── 3. Magic Codes ────────────────────────────────────────────────
  console.log('🪄 Seeding magic codes…');
  for (const data of magicCodes) {
    if (data.id) {
      await prisma.magicCode.upsert({
        where: { id: data.id },
        update: {},
        create: data,
      });
      console.log(`   ✓ ${data.id}`);
    }
  }

  // ── 4. Ingredients ────────────────────────────────────────────────
  console.log('🧪 Seeding ingredients…');
  for (const data of ingredients) {
    await prisma.ingredient.upsert({
      where: { name: data.name },
      update: { quantity: data.quantity, type: data.type },
      create: data,
    });
  }
  console.log(`   ✓ ${ingredients.length} ingredients upserted`);

  // ── 5. Recipes ────────────────────────────────────────────────────
  console.log('📖 Seeding recipes…');
  const recipeIds: Record<string, string> = {};
  for (const data of recipes) {
    const existing = await prisma.recipe.findFirst({
      where: { name: data.name },
    });
    if (!existing) {
      const created = await prisma.recipe.create({ data });
      recipeIds[data.name] = created.id;
    } else {
      await prisma.recipe.update({
        where: { id: existing.id },
        data: {
          ingredients: data.ingredients,
          notes: data.notes,
          type: data.type,
        },
      });
      recipeIds[data.name] = existing.id;
    }
  }
  console.log(`   ✓ ${recipes.length} recipes upserted`);

  // Look up recipe IDs we need for batches
  const baseRecipeId =
    recipeIds['Standard Olive Oil Soap'] ||
    (await prisma.recipe.findFirst({ where: { type: RecipeType.BASE } }))?.id;
  const luxuryBaseId =
    recipeIds['Shea Butter Luxury Base'] ||
    (await prisma.recipe.findFirst({ where: { name: 'Shea Butter Luxury Base' } }))?.id;

  if (!baseRecipeId) {
    console.error('❌ Could not resolve a base recipe — skipping batch seeding.');
    return;
  }

  // Gather style recipe IDs
  const styleRecipeNames = [
    'Labor Day Mess',
    'Experiment 12-09',
    'Experiment 25-11-02',
    'Experiment 25-10-18',
    'Experiment 25-09-15',
    'Experiment 24-10-14',
    'Experiment 24-10-09',
    'Experiment 24-11-13',
    'Experiment 24-12-07',
    'Experiment 24-11-16',
    'Experiment 24-12-15',
    'Basic Charcoal Soap',
  ];
  const styleIds: Record<string, string> = {};
  for (const name of styleRecipeNames) {
    const id = recipeIds[name];
    if (id) styleIds[name] = id;
  }

  // ── 6. Batches (clean + recreate to stay idempotent) ──────────────
  console.log('🧼 Seeding batches…');

  // Clean up volatile relational data that depends on batches
  // Order matters: delete children before parents
  await prisma.soapGift.deleteMany({});
  await prisma.batchRequest.deleteMany({});
  await prisma.batchImage.deleteMany({});
  await prisma.batch.deleteMany({});
  console.log('   ↻ Cleared existing batches & related data');

  // Placeholder image for seeded batches (a nice gradient placeholder)
  const placeholderImage =
    'https://placehold.co/600x400/e8d5c4/8b6f5c?text=Soap+Batch';

  interface BatchSeed {
    name: string;
    baseRecipeId: string;
    styleRecipeName?: string;
    status: BatchStatus;
    startedAt: Date;
    cutAt?: Date;
    readyAt?: Date;
    numBars?: number;
    imageUrl?: string;
    notes?: string;
    magicCodeId?: string;
  }

  const batchSeeds: BatchSeed[] = [
    // READY batches — completed and available
    {
      name: 'Lavender Dreams Batch',
      baseRecipeId: baseRecipeId,
      styleRecipeName: 'Experiment 25-09-15',
      status: BatchStatus.READY,
      startedAt: daysAgo(60),
      cutAt: daysAgo(58),
      readyAt: daysAgo(30),
      numBars: 12,
      imageUrl: placeholderImage,
      notes: 'Beautiful purple hue, strong bergamot-lavender scent.',
      magicCodeId: 'lavender-dreams',
    },
    {
      name: 'Forest Walk Batch',
      baseRecipeId: luxuryBaseId || baseRecipeId,
      styleRecipeName: 'Experiment 24-11-16',
      status: BatchStatus.READY,
      startedAt: daysAgo(50),
      cutAt: daysAgo(48),
      readyAt: daysAgo(20),
      numBars: 10,
      imageUrl: placeholderImage,
      notes: 'Fresh cypress-hinoki blend. Very popular.',
      magicCodeId: 'forest-walk',
    },
    {
      name: 'Rose Garden Batch',
      baseRecipeId: baseRecipeId,
      styleRecipeName: 'Experiment 12-09',
      status: BatchStatus.READY,
      startedAt: daysAgo(45),
      cutAt: daysAgo(43),
      readyAt: daysAgo(15),
      numBars: 8,
      imageUrl: placeholderImage,
      notes: 'Gorgeous pink clay swirl with rose petals on top.',
      magicCodeId: 'rose-garden',
    },

    // CURING batches — cut and drying
    {
      name: 'Midnight Charcoal Batch',
      baseRecipeId: luxuryBaseId || baseRecipeId,
      styleRecipeName: 'Experiment 24-12-15',
      status: BatchStatus.CURING,
      startedAt: daysAgo(20),
      cutAt: daysAgo(18),
      numBars: 14,
      imageUrl: placeholderImage,
      notes: 'Dark, dramatic bars with balsam-fir scent. Need 2 more weeks.',
    },
    {
      name: 'Jasmine Moonlight Batch',
      baseRecipeId: baseRecipeId,
      styleRecipeName: 'Experiment 24-11-13',
      status: BatchStatus.CURING,
      startedAt: daysAgo(14),
      cutAt: daysAgo(12),
      numBars: 10,
      notes: 'Jasmine-cedarwood, incredibly fragrant during cure.',
    },

    // STARTED batches — freshly poured
    {
      name: 'Tropical Coconut Batch',
      baseRecipeId: luxuryBaseId || baseRecipeId,
      styleRecipeName: 'Experiment 25-10-18',
      status: BatchStatus.STARTED,
      startedAt: daysAgo(3),
      notes: 'Coconut-rose-litsea blend. Still in mold, trace was thick.',
    },
    {
      name: 'Woody Zen Batch',
      baseRecipeId: baseRecipeId,
      styleRecipeName: 'Experiment 25-11-02',
      status: BatchStatus.STARTED,
      startedAt: daysAgo(1),
      notes: 'MUJI-inspired minimalism. Very subtle scent.',
    },

    // SCHEDULING batches — planned but not yet started
    {
      name: 'Spring Neroli Batch',
      baseRecipeId: baseRecipeId,
      styleRecipeName: 'Experiment 24-10-09',
      status: BatchStatus.SCHEDULING,
      startedAt: daysAgo(-7), // scheduled for next week
      notes: 'Pine-neroli combo requested by a friend. Sourcing neroli.',
    },

    // ARCHIVED batches — old completed batches
    {
      name: 'Labor Day Special',
      baseRecipeId: baseRecipeId,
      styleRecipeName: 'Labor Day Mess',
      status: BatchStatus.ARCHIVED,
      startedAt: daysAgo(180),
      cutAt: daysAgo(178),
      readyAt: daysAgo(150),
      numBars: 6,
      notes: 'Our very first batch! Messy but full of love.',
      magicCodeId: 'testcode',
    },
    {
      name: 'Hinoki Rose Classic',
      baseRecipeId: baseRecipeId,
      styleRecipeName: 'Experiment 24-10-14',
      status: BatchStatus.ARCHIVED,
      startedAt: daysAgo(120),
      cutAt: daysAgo(118),
      readyAt: daysAgo(90),
      numBars: 8,
      imageUrl: placeholderImage,
      notes: 'One of the best-selling blends. All bars given away.',
      magicCodeId: 'testcode2',
    },
  ];

  const createdBatches: { name: string; id: string }[] = [];
  for (const seed of batchSeeds) {
    const styleRecipeId = seed.styleRecipeName
      ? styleIds[seed.styleRecipeName]
      : undefined;

    const batch = await prisma.batch.create({
      data: {
        name: seed.name,
        baseRecipeId: seed.baseRecipeId,
        styleRecipeId: styleRecipeId || undefined,
        status: seed.status,
        startedAt: seed.startedAt,
        cutAt: seed.cutAt,
        readyAt: seed.readyAt,
        numBars: seed.numBars,
        imageUrl: seed.imageUrl,
        notes: seed.notes,
        magicCodeId: seed.magicCodeId,
      },
    });
    createdBatches.push({ name: seed.name, id: batch.id });
    console.log(`   ✓ ${seed.name} [${seed.status}]`);
  }

  // ── 7. BatchImages ────────────────────────────────────────────────
  console.log('🖼️  Seeding batch images…');
  const batchesWithImages = createdBatches.filter((b) =>
    [
      'Lavender Dreams Batch',
      'Forest Walk Batch',
      'Rose Garden Batch',
      'Hinoki Rose Classic',
    ].includes(b.name)
  );

  for (const batch of batchesWithImages) {
    // Version 1 — initial image
    await prisma.batchImage.create({
      data: {
        batchId: batch.id,
        imageUrl: placeholderImage,
        prompt: `A beautiful artisanal soap bar inspired by "${batch.name}", soft natural lighting, elegant botanical styling`,
        version: 1,
      },
    });
    // Version 2 — regenerated image
    await prisma.batchImage.create({
      data: {
        batchId: batch.id,
        imageUrl: placeholderImage,
        prompt: `An artisanal soap bar for "${batch.name}", close-up macro shot, warm tones, dried flowers scattered around`,
        version: 2,
      },
    });
    console.log(`   ✓ 2 images for "${batch.name}"`);
  }

  // ── 8. SoapGifts ──────────────────────────────────────────────────
  console.log('🎁 Seeding soap gifts…');
  if (testUserId) {
    const readyBatches = createdBatches.filter((b) =>
      [
        'Lavender Dreams Batch',
        'Rose Garden Batch',
        'Hinoki Rose Classic',
      ].includes(b.name)
    );
    for (const batch of readyBatches) {
      await prisma.soapGift.create({
        data: {
          batchId: batch.id,
          userId: testUserId,
          givenAt: daysAgo(Math.floor(Math.random() * 30)),
          note: `Enjoy your ${batch.name.replace(' Batch', '')} soap! 🧼`,
        },
      });
      console.log(`   ✓ Gift from "${batch.name}" → test user`);
    }
  } else {
    console.log('   ⚠ No test user found — skipping soap gifts');
  }

  // ── 9. BatchRequests ──────────────────────────────────────────────
  console.log('📬 Seeding batch requests…');
  if (testUserId) {
    const requestSeeds: {
      styleRecipeName: string;
      status: RequestStatus;
    }[] = [
        // A pending request the admin hasn't reviewed yet
        { styleRecipeName: 'Experiment 24-12-07', status: RequestStatus.PENDING },
        // A planned request the admin accepted
        { styleRecipeName: 'Experiment 24-10-09', status: RequestStatus.PLANNED },
        // A fulfilled request
        { styleRecipeName: 'Experiment 25-09-15', status: RequestStatus.FULFILLED },
        // A rejected request
        { styleRecipeName: 'Basic Charcoal Soap', status: RequestStatus.REJECTED },
      ];

    for (const req of requestSeeds) {
      const recipeId = styleIds[req.styleRecipeName];
      if (!recipeId) {
        console.log(`   ⚠ Style recipe "${req.styleRecipeName}" not found, skipping`);
        continue;
      }
      await prisma.batchRequest.create({
        data: {
          userId: testUserId,
          styleRecipeId: recipeId,
          status: req.status,
        },
      });
      console.log(`   ✓ Request for "${req.styleRecipeName}" [${req.status}]`);
    }
  } else {
    console.log('   ⚠ No test user found — skipping batch requests');
  }

  console.log('\n✅ Seed complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
