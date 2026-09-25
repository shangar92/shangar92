import { useEffect, useRef, useState } from 'react';
import { Animated, LayoutChangeEvent, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '../theme';

type Props<T extends string> = {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
};

export function SegmentedControl<T extends string>({ options, value, onChange }: Props<T>) {
  const [width, setWidth] = useState(0);
  const index = options.findIndex((o) => o.value === value);
  const x = useRef(new Animated.Value(index)).current;

  useEffect(() => {
    Animated.spring(x, { toValue: index, useNativeDriver: true, bounciness: 6, speed: 16 }).start();
  }, [index, x]);

  const segW = width / options.length;
  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width - 8);

  return (
    <View style={styles.track} onLayout={onLayout}>
      {width > 0 && (
        <Animated.View
          style={[styles.thumb, { width: segW, transform: [{ translateX: Animated.multiply(x, segW) }] }]}
        />
      )}
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable key={o.value} style={styles.segment} onPress={() => onChange(o.value)}>
            <Text style={[styles.label, active && styles.labelActive]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
    padding: 4,
  },
  thumb: {
    position: 'absolute',
    top: 4,
    left: 4,
    bottom: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    shadowColor: '#1B1B3A',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  segment: { flex: 1, paddingVertical: 10, alignItems: 'center' },
  label: { fontSize: 15, fontWeight: '600', color: colors.textMuted },
  labelActive: { color: colors.text },
});
