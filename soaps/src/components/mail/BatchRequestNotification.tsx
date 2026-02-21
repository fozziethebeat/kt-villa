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
    Text,
    Section
} from '@react-email/components';

interface BatchRequestNotificationProps {
    userName: string;
    userEmail: string;
    styleName: string;
    manageUrl: string;
    timestamp?: string;
}

export function BatchRequestNotification({
    userName,
    userEmail,
    styleName,
    manageUrl,
    timestamp,
}: BatchRequestNotificationProps) {
    return (
        <Html lang="en">
            <Head />
            <Preview>New soap style request: {styleName}</Preview>
            <Body style={styles.body}>
                <Container style={styles.container}>
                    <Heading style={styles.heading}>
                        New Style Request
                    </Heading>
                    <Text style={styles.text}>
                        Someone has requested a new soap style. Here are the details:
                    </Text>

                    <Section style={styles.detailsBox}>
                        <Text style={styles.detailLabel}>Requested By</Text>
                        <Text style={styles.detailValue}>{userName} ({userEmail})</Text>

                        <Text style={styles.detailLabel}>Soap Style</Text>
                        <Text style={styles.detailValue}>{styleName}</Text>
                    </Section>

                    <Section style={styles.buttonContainer}>
                        <Link href={manageUrl} style={styles.button}>
                            Manage Requests
                        </Link>
                    </Section>

                    <Hr style={styles.hr} />
                    <Text style={styles.footer}>
                        This notification was sent from KT Soaps because a user submitted a style request.
                    </Text>
                    {/* Hidden timestamp to prevent Gmail threading */}
                    {timestamp && (
                        <Text style={styles.hiddenTimestamp}>
                            {timestamp}
                        </Text>
                    )}
                </Container>
            </Body>
        </Html>
    );
}

const styles = {
    body: {
        backgroundColor: '#f3f4f6',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        margin: 'auto',
    },
    container: {
        margin: '40px auto',
        maxWidth: '600px',
        borderRadius: '8px',
        border: '1px solid #e5e7eb',
        backgroundColor: '#ffffff',
        padding: '40px',
        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    },
    heading: {
        margin: '20px 0',
        textAlign: 'center' as const,
        fontSize: '24px',
        fontWeight: 'bold',
        color: '#1f2937',
    },
    text: {
        color: '#4b5563',
        textAlign: 'center' as const,
        fontSize: '16px',
        marginBottom: '24px',
    },
    detailsBox: {
        backgroundColor: '#f9fafb',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        padding: '20px 24px',
        marginBottom: '24px',
    },
    detailLabel: {
        fontSize: '12px',
        fontWeight: '600' as const,
        color: '#6b7280',
        textTransform: 'uppercase' as const,
        letterSpacing: '0.05em',
        marginBottom: '2px',
    },
    detailValue: {
        fontSize: '16px',
        color: '#1f2937',
        fontWeight: '500' as const,
        marginTop: '0',
        marginBottom: '16px',
    },
    buttonContainer: {
        textAlign: 'center' as const,
    },
    button: {
        backgroundColor: '#4f46e5',
        color: '#ffffff',
        fontWeight: '600',
        padding: '12px 24px',
        borderRadius: '6px',
        textDecoration: 'none',
        display: 'inline-block',
    },
    hr: {
        borderColor: '#e5e7eb',
        margin: '32px 0',
    },
    footer: {
        textAlign: 'center' as const,
        fontSize: '12px',
        color: '#9ca3af',
    },
    hiddenTimestamp: {
        fontSize: '0px',
        opacity: '0',
        color: 'transparent',
        userSelect: 'none' as const,
    },
};
