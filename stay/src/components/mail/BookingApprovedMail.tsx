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

interface BookingApprovedProps {
    startDate: Date;
    endDate: Date;
    userEmail: string;
    link: string;
    name?: string;
}

export function BookingApprovedMail({
    startDate,
    endDate,
    userEmail,
    link,
    name,
}: BookingApprovedProps) {
    return (
        <Html lang="en">
            <Head />
            <Preview>Your booking is approved</Preview>
            <Tailwind>
                <Body className="mx-auto my-auto bg-white font-sans">
                    <Container className="mx-auto my-[40px] rounded border border-solid border-gray-200 p-[20px]">
                        <Heading className="mx-0 my-[30px] p-0 text-center text-[24px] font-normal text-black">
                            Your booking is approved!
                        </Heading>
                        <Hr className="mx-0 my-[26px] w-full border border-solid border-[#eaeaea]" />
                        <Text className="text-[12px] leading-[24px] text-[#666666]">
                            Hi {name || userEmail},
                        </Text>
                        <Text className="text-[12px] leading-[24px] text-[#666666]">
                            Your booking for the following dates has been approved:
                        </Text>
                        <Text className="text-[12px] leading-[24px] text-[#666666]">
                            Start Date: {startDate.toLocaleDateString('en-CA')}
                        </Text>
                        <Text className="text-[12px] leading-[24px] text-[#666666]">
                            End Date: {endDate.toLocaleDateString('en-CA')}
                        </Text>
                        <Link href={link}>View Booking</Link>
                    </Container>
                </Body>
            </Tailwind>
        </Html>
    );
}
