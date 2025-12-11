// app/(login)/_layout.tsx
import { Stack } from 'expo-router';

export default function LoginLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            {/* This automatically renders index.tsx, loginPage.tsx, etc. */}
        </Stack>
    );
}
