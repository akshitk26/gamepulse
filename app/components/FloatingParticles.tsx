import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

interface Particle {
  id: number;
  animatedValue: Animated.Value;
  size: number;
  color: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  duration: number;
  delay: number;
}

const FloatingParticles: React.FC = () => {
  const particles = useRef<Particle[]>([]);

  useEffect(() => {
    // Create particles
    for (let i = 0; i < 8; i++) {
      const particle: Particle = {
        id: i,
        animatedValue: new Animated.Value(0),
        size: Math.random() * 4 + 2,
        color: i < 4 ? 'rgba(113, 64, 255, 0.3)' : 'rgba(28, 231, 131, 0.25)',
        startX: Math.random() * 300,
        startY: Math.random() * 600 + 100,
        endX: Math.random() * 300,
        endY: Math.random() * 600 + 100,
        duration: Math.random() * 10000 + 15000,
        delay: Math.random() * 5000,
      };
      particles.current.push(particle);
    }

    // Animate particles
    particles.current.forEach((particle) => {
      const runParticleLoop = () => {
        Animated.loop(
          Animated.sequence([
            Animated.timing(particle.animatedValue, {
              toValue: 1,
              duration: particle.duration,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
            Animated.timing(particle.animatedValue, {
              toValue: 0,
              duration: particle.duration,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
          ])
        ).start();
      };

      setTimeout(runParticleLoop, particle.delay);
    });
  }, []);

  return (
    <View style={styles.container} pointerEvents="none">
      {particles.current.map((particle) => {
        const translateX = particle.animatedValue.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [particle.startX, particle.endX, particle.startX],
        });
        
        const translateY = particle.animatedValue.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [particle.startY, particle.endY, particle.startY],
        });

        const opacity = particle.animatedValue.interpolate({
          inputRange: [0, 0.2, 0.8, 1],
          outputRange: [0, 0.8, 0.8, 0],
        });

        return (
          <Animated.View
            key={particle.id}
            style={[
              styles.particle,
              {
                width: particle.size,
                height: particle.size,
                borderRadius: particle.size / 2,
                backgroundColor: particle.color,
                opacity,
                transform: [{ translateX }, { translateY }],
              },
            ]}
          />
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  particle: {
    position: 'absolute',
    shadowColor: '#8000FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 3,
  },
});

export default FloatingParticles;