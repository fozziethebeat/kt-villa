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

interface ForgotPasswordProps {
  name: string
  link: string
}

export function ForgotPassword({ name, link }: ForgotPasswordProps) {
  return (
    <Html lang="en">
      <Head />
      <Preview>Reset your KT Villa password</Preview>
      <Tailwind>
        <Body className="mx-auto my-auto bg-white font-sans">
          <Container className="mx-auto my-[40px] rounded border border-solid border-gray-200 p-[20px]">
            <Heading className="mx-0 my-[30px] p-0 text-center text-[24px] font-normal text-black">
              Reset your KT Villa password
            </Heading>
            <Text className="text-[14px] leading-[24px] text-black">
              Hi {name}
            </Text>
            <Hr className="mx-0 my-[26px] w-full border border-solid border-[#eaeaea]" />
            <Text className="text-[12px] leading-[24px] text-[#666666]">
              Reset your password
            </Text>
            <Link href={link}>Click Here</Link>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}
