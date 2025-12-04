import { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function SplashScreen() {
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = null;
        await new Promise(resolve => setTimeout(resolve, 2000));
        if (token) {
          router.replace('/(tabs)');
        } else {
          router.replace('/(auth)/login');
        }
      } catch (error) {
        console.error('Auth check error:', error);
        router.replace('/(auth)/login');
      }
    };
    checkAuth();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Image source={require('../assets/images/Logo.png')} style={styles.logo} resizeMode="contain" />
        </View>
        <Text style={styles.title}>DRU EDU</Text>
        <Text style={styles.subtitle}>Parent Portal</Text>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFFFFF" />
        </View>
      </View>
      <View style={styles.footer}>
        <Text style={styles.footerText}>Empowering Parents in Education</Text>
        <View style={styles.dots}>
          <View style={[styles.dot, styles.dotActive]} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#4F46E5',
    justifyContent: 'space-between',
    paddingVertical: 60,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  logo: {
    width: 160,
    height: 160,
  },
  title: {
    fontSize: 42,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 3,
    marginTop: 16,
  },
  subtitle: {
    fontSize: 18,
    color: '#E0E7FF',
    marginTop: 8,
    letterSpacing: 2,
    fontWeight: '300',
  },
  loadingContainer: {
    marginTop: 60,
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    color: '#C7D2FE',
    fontSize: 14,
    letterSpacing: 0.5,
    marginBottom: 20,
  },
  dots: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  dotActive: {
    backgroundColor: '#FFFFFF',
    width: 24,
  },
});
