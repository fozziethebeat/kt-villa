import type { Prisma } from "@prisma/client";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function devSeed() {
  try {
    const users = [
      {
        name: "fozziethebeat",
        email: "fozziethebeat+admin@gmail.com",
        roles: "admin",
        trustStatus: "trusted",
      },
      {
        name: "amysurfs",
        email: "fozziethebeat+amy@gmail.com",
        roles: "general",
        trustStatus: "new",
      },
      {
        name: "charliechair",
        email: "fozziethebeat+charlie@gmail.com",
        roles: "general",
        trustStatus: "trusted",
      },
      {
        name: "asakusakids",
        email: "fozziethebeat+tianyi@gmail.com",
        roles: "admin",
        trustStatus: "trusted",
      },
    ];
    const createdUsers = await db.user.createManyAndReturn({
      data: users,
    });

    const itemData: Prisma.StableItemCreateArgs["data"][] = [
      {
        id: "uU1NqVR4iC",
        image:
          "https://ktvilla-images.s3.ap-northeast-1.amazonaws.com/results/DJ4LxL_full.png",
        claimCode: "1111",
        claimStatus: "claimed",
        claimVisible: true,
        ownerId: createdUsers[0].id,
      },
      {
        id: "WMapPW59wR",
        image:
          "https://ktvilla-images.s3.ap-northeast-1.amazonaws.com/results/08QpKS_full.png",
        claimCode: "2222",
        claimStatus: "claimed",
        claimVisible: true,
        ownerId: createdUsers[3].id,
      },
      {
        id: "znGNt5S7QN",
        image:
          "https://ktvilla-images.s3.ap-northeast-1.amazonaws.com/results/MW2Qm5.png",
        claimCode: "3333",
        claimStatus: "claimed",
        claimVisible: true,
        ownerId: createdUsers[0].id,
      },
    ];
    await db.stableItem.createMany({ data: itemData });

    const bookingData = [
      {
        startDate: "2023-11-19T08:00:00.000+09:00",
        endDate: "2023-11-23T20:00:00.000+09:00",
        numGuests: 2,
        userId: createdUsers[0].id,
        userItemId: "uU1NqVR4iC",
        status: "approved",
        bookingCode: "xyz",
        member: {
          create: {
            userId: createdUsers[3].id,
            userItemId: "WMapPW59wR",
            status: "approved",
          },
        },
      },
      {
        startDate: "2024-03-07T08:00:00.000+09:00",
        endDate: "2024-03-11T20:00:00.000+09:00",
        numGuests: 1,
        userId: createdUsers[0].id,
        userItemId: "znGNt5S7QN",
        status: "approved",
        bookingCode: "abc",
      },
    ];
    await Promise.all(
      bookingData.map(async (data) => db.booking.create({ data }))
    );

    await db.signupCode.create({ data: { id: "keithiscool" } });
    await db.imageAdapterSetting.create({
      data: {
        startDate: "2023-11-09T16:00:00.000Z",
        adapter: "hasuikawase",
        promptTemplate:
          "in Hakuba Village mountains during the spring time in the style of a miniature diorama",
        negativePrompt: "",
        steps: 30,
        variants: [
          "mountain biking monkeys",
          "jogging rabbits",
          "kayaking giraffes",
          "golfing cats",
          "doings doing stand up paddle",
          "ferrets Parasailing",
          "turtles white water rafting",
        ],
      },
    });
  } catch (error) {
    console.warn("Please define your seed data.");
    console.error(error);
  }
}

async function prodSeed() {
  try {
    const users = [
      {
        name: process.env.ADMIN_NAME,
        email: process.env.ADMIN_EMAIL,
        roles: "admin",
        trustStatus: "trusted",
      },
    ];
    await db.user.createMany({
      data: users.map(({ name, email, roles, trustStatus }) => {
        return {
          name,
          email,
          roles,
          trustStatus,
        };
      }),
    });
    await db.signupCode.create({ data: { id: "HakubaOrBust" } });
    await db.imageAdapterSetting.createMany({
      data: [
        {
          startDate: "2023-11-09T16:00:00.000Z",
          adapter: "hasuikawase",
          promptTemplate: "high resolution, mountains, ski slopes, winter",
          negativePrompt:
            "misshaped bodies, watermark, misshaped faces, bad eyes",
          steps: 30,
          variants: [
            "snowboarding monkeys",
            "skiing rabbits",
            "snowboarding giraffes",
            "skiing cats",
            "snowboarding dogs",
            "telemark skiing ferrets",
            "snow biking turtles",
          ],
        },
        {
          startDate: "2023-12-09T16:00:00.000Z",
          adapter: "gemmacorrell",
          promptTemplate: "high resolution, mountains, ski slopes, winter",
          negativePrompt:
            "misshaped bodies, watermark, misshaped faces, bad eyes",
          steps: 30,
          variants: [
            "snowboarding monkeys",
            "skiing rabbits",
            "snowboarding giraffes",
            "skiing cats",
            "snowboarding dogs",
            "telemark skiing ferrets",
            "snow biking turtles",
          ],
        },
      ],
    });
  } catch (error) {
    console.warn("Please define your seed data.");
    console.error(error);
  }
}

async function main() {
  const environment = process.env.NODE_ENV || "dev";
  if (environment === "prod") {
    await prodSeed();
  } else {
    await devSeed();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
