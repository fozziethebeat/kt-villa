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

export function MagicLink({ url, timestamp }: { url: string, timestamp?: string }) {
  return (
    <Html lang="en">
      <Head />
      <Preview>Sign in to KT Villa</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Heading style={styles.heading}>
            Sign in to KT Villa
          </Heading>
          <Text style={styles.text}>
            Click the button below to sign in to your account. This link will expire in 7 days.
          </Text>
          <Section style={styles.buttonContainer}>
            <Link href={url} style={styles.button}>
              Sign In
            </Link>
          </Section>
          <Hr style={styles.hr} />
          <Text style={styles.footer}>
            If you didn't request this email, you can safely ignore it.
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
  buttonContainer: {
    textAlign: 'center' as const,
  },
  button: {
    backgroundColor: '#2563eb',
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
  }
};
