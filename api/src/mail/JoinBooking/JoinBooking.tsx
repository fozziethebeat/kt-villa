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

interface JoinBookingProps {
  code: string
  link: string
  name: string
}

export function JoinBooking({ code, link, name }: JoinBookingProps) {
  return (
    <Html lang="en">
      <Head />
      <Preview>New request to join your trip</Preview>
      <Tailwind>
        <Body className="mx-auto my-auto bg-white font-sans">
          <Container className="mx-auto my-[40px] rounded border border-solid border-gray-200 p-[20px]">
            <Heading className="mx-0 my-[30px] p-0 text-center text-[24px] font-normal text-black">
              New request to join your trip
            </Heading>
            <Hr className="mx-0 my-[26px] w-full border border-solid border-[#eaeaea]" />
            <Text className="text-[12px] leading-[24px] text-[#666666]">
              Your trip {code} has a new request to join: {name}.
            </Text>
            <Link href={link}>Review Here</Link>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}
