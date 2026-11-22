import React from "react";
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Tailwind,
  Text,
} from "@react-email/components";

import { toJstDateString } from "@/lib/jst-date";

interface SameDayTurnoverMailProps {
  role: "departing" | "arriving";
  recipientName?: string | null;
  recipientEmail: string;
  turnoverDate: Date;
  stayStartDate: Date;
  stayEndDate: Date;
  bookingLink: string;
  guideLink: string;
}

export function SameDayTurnoverMail({
  role,
  recipientName,
  recipientEmail,
  turnoverDate,
  stayStartDate,
  stayEndDate,
  bookingLink,
  guideLink,
}: SameDayTurnoverMailProps) {
  const isDeparting = role === "departing";
  const turnoverStr = toJstDateString(turnoverDate);
  const startStr = toJstDateString(stayStartDate);
  const endStr = toJstDateString(stayEndDate);

  const previewText = isDeparting
    ? `Same-day arrival on ${turnoverStr} (JST) — please remember laundry & checkout`
    : `Same-day departure on ${turnoverStr} (JST) before your KT Villa arrival`;

  return (
    <Html lang="en">
      <Head />
      <Preview>{previewText}</Preview>
      <Tailwind>
        <Body className="mx-auto my-auto bg-white font-sans">
          <Container className="mx-auto my-[40px] rounded border border-solid border-gray-200 p-[20px]">
            <Heading className="mx-0 my-[24px] p-0 text-center text-[22px] font-semibold text-black">
              {isDeparting
                ? "Same-Day Turnover Reminder"
                : "Same-Day Turnover Notice"}
            </Heading>
            <Hr className="mx-0 my-[20px] w-full border border-solid border-[#eaeaea]" />

            <Text className="text-[13px] leading-[22px] text-[#444444]">
              Hi {recipientName || recipientEmail},
            </Text>

            {isDeparting ? (
              <>
                <Text className="text-[13px] leading-[22px] text-[#444444]">
                  Heads up for your upcoming KT Villa stay ({startStr} –{" "}
                  {endStr} JST): another guest has booked a stay starting on{" "}
                  <strong>{turnoverStr} (JST)</strong>, the same day you are
                  scheduled to check out.
                </Text>
                <Text className="text-[13px] leading-[22px] text-[#444444]">
                  Because the next group will be arriving later that day, please
                  make sure to allow extra time before departure to:
                </Text>
                <Text className="text-[13px] leading-[22px] text-[#444444]">
                  • Wash and dry used bedding and towels (do laundry early!)
                  <br />• Reset the kitchen, tatami room, and common areas
                  <br />• Drop off trash and leave the house ready for the next
                  guests
                </Text>
              </>
            ) : (
              <>
                <Text className="text-[13px] leading-[22px] text-[#444444]">
                  Heads up for your upcoming KT Villa stay ({startStr} –{" "}
                  {endStr} JST): another guest is checking out on{" "}
                  <strong>{turnoverStr} (JST)</strong>, the same day you are
                  scheduled to arrive.
                </Text>
                <Text className="text-[13px] leading-[22px] text-[#444444]">
                  We have also reminded the departing guest to complete laundry
                  and checkout prep ahead of your arrival. Please plan your
                  arrival accordingly and check the house guide if you need
                  arrival details.
                </Text>
              </>
            )}

            <Text className="text-[13px] leading-[22px] text-[#444444]">
              <Link href={bookingLink} className="text-blue-600 underline">
                View Your Booking
              </Link>
              {" · "}
              <Link href={guideLink} className="text-blue-600 underline">
                {isDeparting
                  ? "View Checkout & Laundry Guide"
                  : "View Arrival Guide"}
              </Link>
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
