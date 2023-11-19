import React from 'react'

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
} from '@react-email/components'

interface CreateBookingProps {
  code: string
  link: string
}

export function CreateBooking({ code, link }: CreateBookingProps) {
  return (
    <Html lang="en">
      <Head />
      <Preview>New Booking Created</Preview>
      <Tailwind>
        <Body className="mx-auto my-auto bg-white font-sans">
          <Container className="mx-auto my-[40px] rounded border border-solid border-gray-200 p-[20px]">
            <Heading className="mx-0 my-[30px] p-0 text-center text-[24px] font-normal text-black">
              New Booking Created
            </Heading>
            <Hr className="mx-0 my-[26px] w-full border border-solid border-[#eaeaea]" />
            <Text className="text-[12px] leading-[24px] text-[#666666]">
              Verify the new booking {code}
            </Text>
            <Link href={link}>Click Here</Link>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}
