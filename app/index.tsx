import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  withRepeat,
  Easing,
  interpolate,
  FadeIn,
  FadeInDown,
  FadeInUp,
} from 'react-native-reanimated';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const STORAGE_KEYS = {
  AUTH_TOKEN: '@dru_auth_token',
  USER_DATA: '@dru_user_data',
  TOKEN_EXPIRY: '@dru_token_expiry',
};

const AnimatedText = Animated.createAnimatedComponent(Text);

export default function SplashScreen() {
  // Animation values
  const logoScale = useSharedValue(0);
  const logoRotate = useSharedValue(0);
  const titleOpacity = useSharedValue(0);
  const taglineIndex = useSharedValue(0);
  const shimmer = useSharedValue(0);
  const pulse = useSharedValue(1);
  const dotProgress = useSharedValue(0);

  const taglines = [
    "Melbourne's Best Institute",
    "Where Excellence Meets Education",
    "Shaping Future Leaders",
  ];

  useEffect(() => {
    // Logo animation - scale up with bounce
    logoScale.value = withSequence(
      withTiming(1.2, { duration: 400, easing: Easing.out(Easing.back) }),
      withTiming(1, { duration: 200 })
    );

    // Subtle logo rotation
    logoRotate.value = withSequence(
      withDelay(300, withTiming(5, { duration: 150 })),
      withTiming(-5, { duration: 150 }),
      withTiming(0, { duration: 150 })
    );

    // Title fade in
    titleOpacity.value = withDelay(400, withTiming(1, { duration: 600 }));

    // Shimmer effect
    shimmer.value = withRepeat(
      withTiming(1, { duration: 2000, easing: Easing.linear }),
      -1,
      false
    );

    // Pulse animation for loading
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.2, { duration: 600 }),
        withTiming(1, { duration: 600 })
      ),
      -1,
      true
    );

    // Animated dots
    dotProgress.value = withRepeat(
      withTiming(3, { duration: 1500, easing: Easing.linear }),
      -1,
      false
    );

    // Tagline rotation
    const taglineInterval = setInterval(() => {
      taglineIndex.value = (taglineIndex.value + 1) % taglines.length;
    }, 2000);

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

    return () => clearInterval(taglineInterval);
  }, []);

  // Animated styles
  const logoAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: logoScale.value },
      { rotate: `${logoRotate.value}deg` },
    ],
  }));

  const titleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: interpolate(titleOpacity.value, [0, 1], [20, 0]) }],
  }));

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(shimmer.value, [0, 1], [-width, width]) }],
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
    opacity: interpolate(pulse.value, [1, 1.2], [0.7, 1]),
  }));

  const dot1Style = useAnimatedStyle(() => ({
    opacity: interpolate(dotProgress.value, [0, 0.5, 1, 3], [1, 0.3, 0.3, 1]),
    transform: [{ scale: interpolate(dotProgress.value, [0, 0.5, 1, 3], [1.3, 1, 1, 1.3]) }],
  }));

  const dot2Style = useAnimatedStyle(() => ({
    opacity: interpolate(dotProgress.value, [0, 1, 1.5, 2, 3], [0.3, 1, 0.3, 0.3, 0.3]),
    transform: [{ scale: interpolate(dotProgress.value, [0, 1, 1.5, 2, 3], [1, 1.3, 1, 1, 1]) }],
  }));

  const dot3Style = useAnimatedStyle(() => ({
    opacity: interpolate(dotProgress.value, [0, 2, 2.5, 3], [0.3, 1, 0.3, 0.3]),
    transform: [{ scale: interpolate(dotProgress.value, [0, 2, 2.5, 3], [1, 1.3, 1, 1]) }],
  }));

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Animated background gradient overlay */}
      <Animated.View style={[styles.shimmerOverlay, shimmerStyle]} />
      
      <View style={styles.content}>
        {/* Animated Logo */}
        <Animated.View style={[styles.logoContainer, logoAnimatedStyle]}>
          <View style={styles.logoGlow} />
          <Image 
            source={require('../assets/images/Logo.png')} 
            style={styles.logo} 
            resizeMode="contain" 
          />
        </Animated.View>

        {/* Animated Title */}
        <Animated.View style={titleAnimatedStyle}>
          <Text style={styles.title}>Dr U Education</Text>
        </Animated.View>

        {/* Animated Subtitle */}
        <Animated.Text 
          entering={FadeInDown.delay(600).duration(500)}
          style={styles.subtitle}
        >
          Parent Portal
        </Animated.Text>

        {/* Catchy Tagline with animation */}
        <Animated.View 
          entering={FadeInUp.delay(800).duration(600)}
          style={styles.taglineContainer}
        >
          <View style={styles.taglineBadge}>
            <Text style={styles.starIcon}>⭐</Text>
            <Text style={styles.taglineMain}>Melbourne's Best Institute</Text>
            <Text style={styles.starIcon}>⭐</Text>
          </View>
        </Animated.View>

        {/* Secondary taglines */}
        <Animated.View 
          entering={FadeIn.delay(1200).duration(800)}
          style={styles.secondaryTaglines}
        >
          <Text style={styles.secondaryText}>🎓 Excellence in Education</Text>
          <Text style={styles.secondaryText}>🚀 Shaping Future Leaders</Text>
          <Text style={styles.secondaryText}>💡 Where Dreams Take Flight</Text>
        </Animated.View>

        {/* Animated Loading */}
        <Animated.View style={[styles.loadingContainer, pulseStyle]}>
          <View style={styles.loadingRing}>
            <View style={styles.loadingInner} />
          </View>
        </Animated.View>
      </View>

      {/* Footer */}
      <Animated.View 
        entering={FadeInUp.delay(1000).duration(500)}
        style={styles.footer}
      >
        <Text style={styles.footerText}>Empowering Parents in Education</Text>
        <View style={styles.dots}>
          <Animated.View style={[styles.dot, dot1Style]} />
          <Animated.View style={[styles.dot, dot2Style]} />
          <Animated.View style={[styles.dot, dot3Style]} />
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
  shimmerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: width * 0.5,
    backgroundColor: 'rgba(255,255,255,0.05)',
    transform: [{ skewX: '-20deg' }],
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
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  starIcon: {
    fontSize: 16,
    marginHorizontal: 8,
  },
  taglineMain: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  secondaryTaglines: {
    marginTop: 24,
    alignItems: 'center',
    gap: 8,
  },
  secondaryText: {
    fontSize: 14,
    color: '#C7D2FE',
    letterSpacing: 0.5,
    fontWeight: '500',
  },
  loadingContainer: {
    marginTop: 40,
  },
  loadingRing: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
    borderTopColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingInner: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.5)',
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
    backgroundColor: '#FFFFFF',
  },
});
