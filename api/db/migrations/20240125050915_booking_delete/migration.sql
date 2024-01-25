-- DropForeignKey
ALTER TABLE "MemberBooking" DROP CONSTRAINT "MemberBooking_bookingId_fkey";

-- AddForeignKey
ALTER TABLE "MemberBooking" ADD CONSTRAINT "MemberBooking_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
