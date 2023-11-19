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

interface JoinApprovedProps {
  code: string
  link: string
  name: string
}

export function JoinApproved({ code, link, name }: JoinApprovedProps) {
  return (
    <Html lang="en">
      <Head />
      <Preview>Your request to join is approved</Preview>
      <Tailwind>
        <Body className="mx-auto my-auto bg-white font-sans">
          <Container className="mx-auto my-[40px] rounded border border-solid border-gray-200 p-[20px]">
            <Heading className="mx-0 my-[30px] p-0 text-center text-[24px] font-normal text-black">
              Your request to join trip {code} is approved!
            </Heading>
            <Hr className="mx-0 my-[26px] w-full border border-solid border-[#eaeaea]" />
            <Text className="text-[12px] leading-[24px] text-[#666666]">
              Hi {name}, your request to join trip {code} is approved.
            </Text>
            <Link href={link}>See more Here</Link>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}
