import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

// Assuming you are in app/(login)/loginPage.tsx
export default function LoginScreen() {
    const router = useRouter();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please enter both email and password.');
            return;
        }

        setLoading(true);

        // --- 1. Simulate API/Auth Logic ---
        console.log(`Attempting login for: ${email}`);

        // Add a small delay to simulate network latency for better UX
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // --- 2. Log Success Message ---
        console.log('Login successful. Simulating navigation to main content.');


        setLoading(false);
        router.replace('/(tabs)/canalPage');
    };

    return (
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <View style={styles.form}>
                <Text style={styles.title}>Welcome Back </Text>

                {/* Email Input */}
                <TextInput
                    style={styles.input}
                    placeholder='Email Address'
                    value={email}
                    onChangeText={setEmail}
                    keyboardType='email-address'
                    autoCapitalize='none'
                    placeholderTextColor='#999'
                    editable={!loading}
                />

                {/* Password Input */}
                <TextInput
                    style={styles.input}
                    placeholder='Password'
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    placeholderTextColor='#999'
                    editable={!loading}
                />

                {/* Login Button */}
                <Pressable
                    style={({ pressed }) => [
                        styles.button,
                        { backgroundColor: loading || pressed ? '#1A4D8C' : '#007AFF' },
                    ]}
                    onPress={handleLogin}
                    disabled={loading}
                >
                    <Text style={styles.buttonText}>{loading ? 'Logging in...' : 'Sign In'}</Text>
                </Pressable>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 30,
        backgroundColor: '#f5f5f5',
    },
    form: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
        color: '#333',
    },
    input: {
        height: 50,
        borderColor: '#ddd',
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 15,
        marginBottom: 15,
        fontSize: 16,
        backgroundColor: '#fafafa',
        color: '#333',
    },
    button: {
        height: 50,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
    link: {
        marginTop: 20,
        padding: 10,
        alignSelf: 'center',
    },
    linkText: {
        color: '#007AFF',
        fontSize: 14,
    },
});
