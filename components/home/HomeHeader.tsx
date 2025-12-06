import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { NotificationBell } from '@/components/NotificationBell';

interface HomeHeaderProps {
  userName: string;
}

export function HomeHeader({ userName }: HomeHeaderProps) {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <>
      <View style={styles.header}>
        <View style={styles.logoSection}>
          <Image
            source={require('@/assets/images/Logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <View style={styles.brandText}>
            <Text style={styles.brandName}>Dr U Education</Text>
            <Text style={styles.brandTagline}>Parent Portal</Text>
          </View>
        </View>
        <NotificationBell color="#1F2937" size={24} />
      </View>

      <View style={styles.greeting}>
        <Text style={styles.greetingText}>{getGreeting()},</Text>
        <Text style={styles.userName}>{userName}</Text>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  logoSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 44,
    height: 44,
    borderRadius: 12,
  },
  brandText: {
    marginLeft: 12,
  },
  brandName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    letterSpacing: 0.5,
  },
  brandTagline: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 1,
  },
  greeting: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  greetingText: {
    fontSize: 14,
    color: '#6B7280',
  },
  userName: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 2,
  },
});
