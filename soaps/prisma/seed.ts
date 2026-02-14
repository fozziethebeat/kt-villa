import { PrismaClient, Prisma, RecipeType } from '../src/lib/generated/prisma';

const prisma = new PrismaClient();

const users: Prisma.UserCreateInput[] = [
  {
    name: 'Admin McAdminFace',
    email: process.env.ADMIN_EMAIL || '',
    roles: 'admin',
  },
  {
    name: 'Testy MctestFace',
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
  {
    id: 'testcode',
  },
  {
    id: 'testcode2',
  },
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

export async function main() {
  for (const data of users) {
    // Using upsert for users to avoid unique constraint errors on re-runs
    await prisma.user.upsert({
      where: { email: data.email },
      update: {},
      create: data,
    });
  }

  for (const data of entityData) {
    // Entities don't have unique constraints shown here easily besides ID (which is missing in input, usually generated)
    // But keeping as create for now, or could check.
    // The original script used create, but let's try to be safer if we can.
    // Usually Entity keys are not unique.
    // I'll stick to create for Entity to avoid changing behavior too much,
    // but users and magic codes have unique keys.
    try {
      await prisma.entity.create({ data });
    } catch (e) {
      // Ignore duplicate key errors if necessary? No, entity doesn't seem to have unique name in seed.
      // But if I want to be safe, I'd probably just leave it or improve it.
      // I will leave entity as create because there's no unique field in the input to upsert on.
    }
  }

  for (const data of magicCodes) {
    if (data.id) {
      await prisma.magicCode.upsert({
        where: { id: data.id },
        update: {},
        create: data
      });
    }
  }

  console.log('Seeding ingredients...');
  for (const data of ingredients) {
    await prisma.ingredient.upsert({
      where: { name: data.name },
      update: {
        // Ensure quantity is updated if it exists but changed in seed
        quantity: data.quantity,
        type: data.type
      },
      create: data,
    });
  }

  console.log('Seeding recipes...');
  for (const data of recipes) {
    // We don't have a unique key for recipes other than ID which isn't provided here.
    // So we'll check by name.
    const existing = await prisma.recipe.findFirst({
      where: { name: data.name }
    });

    if (!existing) {
      await prisma.recipe.create({ data });
    } else {
      // Optionally update content?
      await prisma.recipe.update({
        where: { id: existing.id },
        data: {
          ingredients: data.ingredients,
          notes: data.notes,
          type: data.type
        }
      });
    }
  }
}

main();
