import {Command} from 'commander';

import {PrismaClient as NewClient} from '@prisma/client';
import {PrismaClient as OldClient} from '../old_prisma/client';

import {helpers, PredictionServiceClient} from '@google-cloud/aiplatform';

import imageAdapters from '../image_adapters.json';

const newDB = new NewClient();
const oldDB = new OldClient();
const program = new Command();

function createTestDate(now: Date, daysToAdvance: number): string {
  const d = new Date(now);
  d.setDate(now.getDate() + daysToAdvance);

  // Set the time components
  d.setHours(8);
  d.setMinutes(0);
  d.setSeconds(0);
  d.setMilliseconds(0);

  const datePart = d.toISOString().split('T')[0];
  const timePart = `08:00:00.000`;
  return `${datePart}T${timePart}+09:00`;
}

// Configure the CLI
program
  .name('kt-villa-tools')
  .description('CLI tools for KT Villa Operations')
  .version('1.0.0');

program
  .command('generate')
  .description('Generate Test Image')
  .action(async () => {
    const location = process.env.GEMINI_LOCATION;
    const projectId = process.env.GEMINI_PROJECT_ID;
    const predictionServiceClient = new PredictionServiceClient({
      apiEndpoint: `${location}-aiplatform.googleapis.com`,
    });
    const endpoint = `projects/${projectId}/locations/${location}/publishers/google/models/imagen-3.0-generate-001`;
    const parameters = helpers.toValue({
      sampleCount: 1,
      aspectRatio: '1:1',
      safetyFilterLevel: 'block_none',
      personGeneration: 'allow_adult',
    });
    const instances = [
      helpers.toValue({
        prompt: 'A simple photo of cats',
      }),
    ];
    const request = {
      endpoint,
      instances,
      parameters,
    };

    await predictionServiceClient.predict(request);
  });

program
  .command('migrate')
  .description('Migrate databases')
  .action(async () => {
    console.log('Fetching old users');
    // First, load up all the users and then create a mapping from the old
    // User ID (integer) to the new User ID (cuid).  This will make it easier
    // to then load up all other associated assets by swapping out the user ID
    // as needed.
    const usersOld = await oldDB.user.findMany();
    const emailToId = Object.fromEntries(
      usersOld.map(user => [user.email, user.id]),
    );

    console.log('Adding users');
    const usersNew = usersOld.map(u => ({
      name: u.name,
      email: u.email,
      emailVerified: new Date(),
      roles: u.roles,
      trustStatus: u.trustStatus,
    }));

    const users = await newDB.user.createManyAndReturn({
      data: usersNew,
    });

    // The mapping from (int) User ID to (cuid) User ID.
    const oldIdToNew = Object.fromEntries(
      users.map(newUser => {
        const oldId = emailToId[newUser.email];
        return [oldId, newUser.id];
      }),
    );

    console.log('Adding bookings');
    // Now extract all the Bookings and StableItems.
    // NOTE: this is more painful than it should be.  We have to:
    // 1. Fetch all the old bookings (without member bookings or items)
    // 2. Create each booking one at a time
    // 3. Fetch the associated Stable Item
    // 4. Create the new stable item
    // 5. Update the new booking with the new stable item
    const oldBookings = await oldDB.booking.findMany({
      select: {
        id: true,
        startDate: true,
        endDate: true,
        numGuests: true,
        maxGuests: true,
        bookingCode: true,
        status: true,
        withCat: true,
        withDog: true,
        userId: true,
        userItemId: true,
      },
    });

    const oldBookingToNew: Record<number, number> = {};
    const newBookings = oldBookings.map(b => ({
      ...b,
      userId: oldIdToNew[b.userId],
    }));
    for (const fullBooking of newBookings) {
      const {userItemId, id, ...booking} = fullBooking;
      const createdBooking = await newDB.booking.create({
        data: booking,
      });
      oldBookingToNew[id] = createdBooking.id;
      const userItem = await oldDB.stableItem.findUnique({
        where: {id: userItemId || ''},
      });
      if (!userItem) {
        throw new Error('total failure');
      }
      const createdItem = await newDB.stableItem.create({
        data: {
          id: userItem.id,
          image: userItem.image,
          claimCode: userItem.claimCode,
          claimStatus: userItem.claimStatus,
          claimVisible: userItem.claimVisible,
          ownerId: oldIdToNew[userItem?.ownerId || ''],
          createdAt: booking.startDate,
        },
      });
      await newDB.booking.update({
        where: {id: createdBooking.id},
        data: {
          userItemId: createdItem.id,
        },
      });
    }

    console.log('Adding member bookings');
    // Now do the same horrible mess with member bookings.
    const oldMemberBookings = await oldDB.memberBooking.findMany({
      select: {
        status: true,
        bookingId: true,
        userId: true,
        userItemId: true,
        booking: {
          select: {
            startDate: true,
          },
        },
      },
    });
    for (const fullMemberBooking of oldMemberBookings) {
      const {userItemId, booking, ...memberBooking} = fullMemberBooking;
      const createdBooking = await newDB.memberBooking.create({
        data: {
          status: memberBooking.status,
          bookingId: oldBookingToNew[memberBooking.bookingId],
          userId: oldIdToNew[memberBooking.userId],
        },
      });
      const userItem = await oldDB.stableItem.findUnique({
        where: {id: userItemId || ''},
      });
      if (!userItem) {
        throw new Error('total failure');
      }
      const createdItem = await newDB.stableItem.create({
        data: {
          id: userItem.id,
          image: userItem.image,
          claimCode: userItem.claimCode,
          claimStatus: userItem.claimStatus,
          claimVisible: userItem.claimVisible,
          ownerId: oldIdToNew[userItem?.ownerId || ''],
          createdAt: booking.startDate,
        },
      });
      await newDB.memberBooking.update({
        where: {id: createdBooking.id},
        data: {
          userItemId: createdItem.id,
        },
      });
    }

    console.log('Adding adapters');
    const now = new Date();
    const adapterData = imageAdapters.map((adapter, i) => ({
      ...adapter,
      startDate: createTestDate(now, i * 14),
    }));
    await newDB.imageAdapterSetting.createMany({
      data: adapterData,
    });
  });

program.parse();
