import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle, Path, G } from 'react-native-svg';

interface LogoProps {
  size?: number;
  color?: string;
  backgroundColor?: string;
}

export default function DruLogo({ 
  size = 120, 
  color = '#FFFFFF',
  backgroundColor = '#1E293B' 
}: LogoProps) {
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox="0 0 200 200">
        {/* Outer circle */}
        <Circle cx="100" cy="100" r="95" fill={backgroundColor} />
        <Circle cx="100" cy="100" r="88" fill="none" stroke={color} strokeWidth="3" />
        
        {/* "Dr" text - stylized */}
        <G>
          {/* D shape */}
          <Path
            d="M55 65 L55 135 L75 135 C95 135 105 120 105 100 C105 80 95 65 75 65 Z M65 75 L75 75 C88 75 95 85 95 100 C95 115 88 125 75 125 L65 125 Z"
            fill={color}
          />
          {/* r with dot */}
          <Path
            d="M115 85 L115 135 L125 135 L125 105 C125 95 130 90 140 90 L140 80 C130 80 125 85 122 92 L122 85 Z"
            fill={color}
          />
          {/* Dot above r */}
          <Circle cx="120" cy="70" r="6" fill={color} />
        </G>
        
        {/* U shape at bottom */}
        <Path
          d="M85 140 L85 160 C85 175 95 185 115 185 C135 185 145 175 145 160 L145 140 L135 140 L135 158 C135 168 128 175 115 175 C102 175 95 168 95 158 L95 140 Z"
          fill={color}
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
