import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image, Dimensions, Animated, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const STORAGE_KEYS = {
  AUTH_TOKEN: '@dru_auth_token',
  USER_DATA: '@dru_user_data',
  TOKEN_EXPIRY: '@dru_token_expiry',
};

export default function SplashScreen() {
  // Using React Native's built-in Animated API (more stable for production)
  const logoScale = useRef(new Animated.Value(0.5)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(20)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const footerOpacity = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Start animations
    Animated.sequence([
      // Logo animation
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
      // Title animation
      Animated.parallel([
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(titleTranslateY, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
      // Tagline animation
      Animated.timing(taglineOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      // Footer
      Animated.timing(footerOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Pulse animation for loading
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();

    const checkAuth = async () => {
      try {
        const [storedToken, storedUser, tokenExpiry] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN),
          AsyncStorage.getItem(STORAGE_KEYS.USER_DATA),
          AsyncStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRY),
        ]);

        await new Promise(resolve => setTimeout(resolve, 3000));

        if (storedToken && storedUser) {
          const now = Date.now();
          const expiry = tokenExpiry ? parseInt(tokenExpiry, 10) : 0;
          
          if (expiry && now > expiry) {
            await Promise.all([
              AsyncStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN),
              AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA),
              AsyncStorage.removeItem(STORAGE_KEYS.TOKEN_EXPIRY),
            ]);
            router.replace('/(auth)/login');
          } else {
            router.replace('/(tabs)');
          }
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
        {/* Animated Logo */}
        <Animated.View 
          style={[
            styles.logoContainer, 
            { 
              opacity: logoOpacity,
              transform: [{ scale: logoScale }] 
            }
          ]}
        >
          <View style={styles.logoGlow} />
          <Image 
            source={require('../assets/images/Logo.png')} 
            style={styles.logo} 
            resizeMode="contain" 
          />
        </Animated.View>

        {/* Animated Title */}
        <Animated.View 
          style={{ 
            opacity: titleOpacity,
            transform: [{ translateY: titleTranslateY }]
          }}
        >
          <Text style={styles.title}>Dr U Education</Text>
        </Animated.View>

        {/* Subtitle */}
        <Animated.Text style={[styles.subtitle, { opacity: titleOpacity }]}>
          Parent Portal
        </Animated.Text>

        {/* Tagline */}
        <Animated.View style={[styles.taglineContainer, { opacity: taglineOpacity }]}>
          <View style={styles.taglineBadge}>
            <Text style={styles.taglineMain}>Melbourne's Premier Tutoring Institute</Text>
          </View>
        </Animated.View>

        {/* Loading */}
        <Animated.View style={[styles.loadingContainer, { transform: [{ scale: pulseAnim }] }]}>
          <ActivityIndicator size="large" color="#FFFFFF" />
        </Animated.View>
      </View>

      {/* Footer */}
      <Animated.View style={[styles.footer, { opacity: footerOpacity }]}>
        <Text style={styles.footerText}>Empowering Parents in Education</Text>
        <View style={styles.dots}>
          <View style={[styles.dot, styles.dotActive]} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#4F46E5',
    justifyContent: 'space-between',
    paddingVertical: 60,
    overflow: 'hidden',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: 24,
    position: 'relative',
  },
  logoGlow: {
    position: 'absolute',
    top: -20,
    left: -20,
    right: -20,
    bottom: -20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 100,
  },
  logo: {
    width: 140,
    height: 140,
  },
  title: {
    fontSize: 38,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 2,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 18,
    color: '#E0E7FF',
    marginTop: 8,
    letterSpacing: 4,
    fontWeight: '300',
    textTransform: 'uppercase',
  },
  taglineContainer: {
    marginTop: 30,
    alignItems: 'center',
  },
  taglineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  taglineMain: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  loadingContainer: {
    marginTop: 40,
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    color: '#C7D2FE',
    fontSize: 14,
    letterSpacing: 0.5,
    marginBottom: 20,
    fontWeight: '500',
  },
  dots: {
    flexDirection: 'row',
    gap: 12,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  dotActive: {
    backgroundColor: '#FFFFFF',
    width: 24,
  },
});
