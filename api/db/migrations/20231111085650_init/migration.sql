-- CreateTable
CREATE TABLE "StableItem" (
    "id" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "text" TEXT,
    "imageRequest" JSONB,
    "claimCode" TEXT NOT NULL,
    "claimStatus" TEXT NOT NULL,
    "claimVisible" BOOLEAN NOT NULL,
    "ownerId" INTEGER,

    CONSTRAINT "StableItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" SERIAL NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "numGuests" INTEGER NOT NULL,
    "bookingCode" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "userId" INTEGER NOT NULL,
    "userItemId" TEXT,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MemberBooking" (
    "id" SERIAL NOT NULL,
    "status" TEXT NOT NULL,
    "bookingId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "userItemId" TEXT,

    CONSTRAINT "MemberBooking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "hashedPassword" TEXT NOT NULL,
    "salt" TEXT NOT NULL,
    "resetToken" TEXT,
    "resetTokenExpiresAt" TIMESTAMP(3),
    "roles" TEXT NOT NULL DEFAULT 'general',
    "trustStatus" TEXT NOT NULL DEFAULT 'new',

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SignupCode" (
    "id" TEXT NOT NULL,

    CONSTRAINT "SignupCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImageAdapterSetting" (
    "id" SERIAL NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "adapter" TEXT NOT NULL,

    CONSTRAINT "ImageAdapterSetting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Booking_bookingCode_key" ON "Booking"("bookingCode");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_userItemId_key" ON "Booking"("userItemId");

-- CreateIndex
CREATE UNIQUE INDEX "MemberBooking_userItemId_key" ON "MemberBooking"("userItemId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "StableItem" ADD CONSTRAINT "StableItem_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_userItemId_fkey" FOREIGN KEY ("userItemId") REFERENCES "StableItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberBooking" ADD CONSTRAINT "MemberBooking_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberBooking" ADD CONSTRAINT "MemberBooking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberBooking" ADD CONSTRAINT "MemberBooking_userItemId_fkey" FOREIGN KEY ("userItemId") REFERENCES "StableItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
