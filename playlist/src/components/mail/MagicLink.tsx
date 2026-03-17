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
      <Preview>Sign in to Our Playlist Journey</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Heading style={styles.heading}>
            🎵 Our Playlist Journey
          </Heading>
          <Text style={styles.text}>
            Click the button below to sign in. This link will expire in 7 days.
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
    backgroundColor: '#faf8f5',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    margin: 'auto',
  },
  container: {
    margin: '40px auto',
    maxWidth: '600px',
    borderRadius: '12px',
    border: '1px solid #e8e0d8',
    backgroundColor: '#ffffff',
    padding: '40px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
  },
  heading: {
    margin: '20px 0',
    textAlign: 'center' as const,
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#5c2d50',
  },
  text: {
    color: '#6b5f54',
    textAlign: 'center' as const,
    fontSize: '16px',
    marginBottom: '24px',
  },
  buttonContainer: {
    textAlign: 'center' as const,
  },
  button: {
    backgroundColor: '#7c3a5c',
    color: '#ffffff',
    fontWeight: '600',
    padding: '12px 24px',
    borderRadius: '8px',
    textDecoration: 'none',
    display: 'inline-block',
  },
  hr: {
    borderColor: '#e8e0d8',
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
