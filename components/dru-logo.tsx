import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle, Path, G, Text as SvgText } from 'react-native-svg';

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
            d="M40 55 L40 125 L58 125 C76 125 85 112 85 90 C85 68 76 55 58 55 Z M50 65 L58 65 C70 65 75 75 75 90 C75 105 70 115 58 115 L50 115 Z"
            fill={color}
          />
          {/* r with dot */}
          <Path
            d="M95 75 L95 125 L105 125 L105 95 C105 85 110 80 120 80 L120 70 C110 70 105 75 102 82 L102 75 Z"
            fill={color}
          />
          {/* Dot above r */}
          <Circle cx="100" cy="60" r="5" fill={color} />
        </G>
        
        {/* U shape - positioned better */}
        <Path
          d="M130 55 L130 100 C130 118 118 130 100 130 C82 130 70 118 70 100 L70 55 L80 55 L80 98 C80 112 88 120 100 120 C112 120 120 112 120 98 L120 55 Z"
          fill={color}
        />
        
        {/* "Education" text at bottom */}
        <SvgText
          x="100"
          y="165"
          fontSize="18"
          fontWeight="600"
          fill={color}
          textAnchor="middle"
        >
          Education
        </SvgText>
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
