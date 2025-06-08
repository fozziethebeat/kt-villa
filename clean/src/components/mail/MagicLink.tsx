import React from 'react';

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
} from '@react-email/components';

interface MagicLinkProps {
  url: string;
}

export function MagicLink({url}: MagicLinkProps) {
  return (
    <Html lang="en">
      <Head />
      <Preview>Sign in to the App</Preview>
      <Tailwind>
        <Body className="mx-auto my-auto bg-white font-sans">
          <Container className="mx-auto my-[40px] rounded border border-solid border-gray-200 p-[20px]">
            <Heading className="mx-0 my-[30px] p-0 text-center text-[24px] font-normal text-black">
              Sign in to Yumegai
            </Heading>
            <Hr className="mx-0 my-[26px] w-full border border-solid border-[#eaeaea]" />
            <Link href={url}>Sign in</Link>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
