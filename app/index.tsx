import { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function SplashScreen() {

  useEffect(() => {
    // Check authentication status
    const checkAuth = async () => {
      try {
        // TODO: Check if user is logged in using AsyncStorage or SecureStore
        // const token = await AsyncStorage.getItem('token');
        const token = null; // For now, always redirect to login
        
        // Simulate a brief splash delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        if (token) {
          // User is logged in, go to main app
          router.replace('/(tabs)');
        } else {
          // User is not logged in, go to login
          router.replace('/(auth)/login');
        }
      } catch (error) {
        console.error('Auth check error:', error);
        router.replace('/(auth)/login');
      } finally {
        // Loading complete
      }
    };

    checkAuth();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      <View style={styles.content}>
        <Text style={styles.logo}>DRU EDU</Text>
        <Text style={styles.subtitle}>Parent Portal</Text>
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
      
      <Text style={styles.footer}>Empowering Parents in Education</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
  },
  logo: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 18,
    color: '#E0E7FF',
    marginTop: 8,
    letterSpacing: 1,
  },
  loadingContainer: {
    marginTop: 60,
    alignItems: 'center',
  },
  loadingText: {
    color: '#E0E7FF',
    marginTop: 12,
    fontSize: 14,
  },
  footer: {
    position: 'absolute',
    bottom: 50,
    color: '#C7D2FE',
    fontSize: 14,
  },
});
