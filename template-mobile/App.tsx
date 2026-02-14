import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TextInput, Button, Alert, ActivityIndicator } from 'react-native';
import { authClient } from './lib/auth-client';
import * as Linking from 'expo-linking';
import { useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';

export default function App() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  // Handling deep linking for magic link
  useEffect(() => {
    const handleDeepLink = async (event: { url: string }) => {
      let { url } = event;
      console.log("Deep link received:", url);

      // Basic parsing of query params
      // URL format likely: template-mobile://...?token=...&... or similar
      try {
        const queryIndex = url.indexOf('?');
        if (queryIndex !== -1) {
          const query = url.substring(queryIndex + 1);
          const params = new URLSearchParams(query);
          // Verify what parameter name Better Auth uses. Usually 'token' or 'session_token'
          // If the backend simply redirects with the cookie, it might NOT pass the token in URL unless configured.
          // However, provided the user suggestion about expoClient, it implies native handling.
          // We'll look for common token names.
          const token = params.get('token') || params.get('session_token');
          if (token) {
            await SecureStore.setItemAsync("better-auth.session_token", token);
            // Force session refresh
            await authClient.getSession();
            Alert.alert("Success", "You are now signed in!");
          } else {
            console.log("No token found in magic link.");
          }
        }
      } catch (e) {
        console.error("Error parsing deep link", e);
      }
    };

    const sub = Linking.addEventListener('url', handleDeepLink);

    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink({ url });
    });

    return () => sub.remove();
  }, []);

  const { data: session, isPending, error, refetch } = authClient.useSession();

  const handleSignIn = async () => {
    if (!email) return;
    setLoading(true);
    try {
      // Use the IP address or localhost depending on environment
      // For Android Emulator: 10.0.2.2 usually maps to host localhost
      // For iOS Simulator: localhost works
      // But for physical device, need LAN IP.
      // Assuming user runs similar to template env usage.
      const baseUrl = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";
      const scheme = Linking.createURL("");

      await authClient.signIn.magicLink({
        email,
        callbackURL: `${baseUrl}/mobile-callback?callback_scheme=${encodeURIComponent(scheme)}`,
      });
      Alert.alert("Check your email", "A magic link has been sent to your email.");
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await authClient.signOut();
    await SecureStore.deleteItemAsync("better-auth.session_token");
    refetch();
  };

  if (isPending) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {session ? (
        <View style={styles.content}>
          <Text style={styles.title}>Welcome!</Text>
          <Text style={styles.text}>{session.user.email}</Text>
          <Button title="Sign Out" onPress={handleSignOut} />
        </View>
      ) : (
        <View style={styles.content}>
          <Text style={styles.title}>Sign In</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            inputMode="email"
          />
          <Button title={loading ? "Sending..." : "Send Magic Link"} onPress={handleSignIn} disabled={loading} />
          {error && <Text style={{ color: 'red' }}>Error: {error.message}</Text>}
        </View>
      )}
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    width: '80%',
    alignItems: 'center',
    gap: 20
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10
  },
  text: {
    fontSize: 16,
    marginBottom: 20
  }
});
