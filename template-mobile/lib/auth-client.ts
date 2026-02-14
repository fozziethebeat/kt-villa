import { createAuthClient } from "better-auth/react";
import { magicLinkClient } from "better-auth/client/plugins";
import * as SecureStore from "expo-secure-store";

export const authClient = createAuthClient({
    baseURL: process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000",
    plugins: [
        magicLinkClient()
    ],
    storage: {
        async getItem(key: string) {
            return await SecureStore.getItemAsync(key);
        },
        async setItem(key: string, value: string) {
            return await SecureStore.setItemAsync(key, value);
        },
        async removeItem(key: string) {
            return await SecureStore.deleteItemAsync(key);
        }
    }
});
