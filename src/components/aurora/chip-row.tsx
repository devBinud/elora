import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { aurora } from '@/theme/aurora';
import { fonts } from '@/theme/fonts';

type ChipRowProps<T extends string> = {
  options: { id: T; label: string }[];
  selected: T;
  onSelect: (id: T) => void;
};

/** Horizontally scrolling pills (filters, categories). The selected one glows violet. */
export function ChipRow<T extends string>({ options, selected, onSelect }: ChipRowProps<T>) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      style={styles.scroller}>
      {options.map(({ id, label }) => {
        const isSelected = id === selected;
        return (
          <Pressable
            key={id}
            onPress={() => onSelect(id)}
            accessibilityRole="tab"
            accessibilityState={{ selected: isSelected }}
            style={({ pressed }) => [
              styles.chip,
              isSelected && styles.chipSelected,
              pressed && !isSelected && styles.chipPressed,
            ]}>
            <Text style={[styles.label, isSelected && styles.labelSelected]}>{label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  // Bleed to the screen edges so chips scroll past the page padding.
  scroller: { marginHorizontal: -20 },
  row: { gap: 8, paddingHorizontal: 20 },
  chip: {
    height: 36,
    paddingHorizontal: 16,
    borderRadius: 18,
    justifyContent: 'center',
    backgroundColor: aurora.glass,
    borderColor: aurora.glassBorder,
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  chipSelected: {
    backgroundColor: aurora.violet,
    borderColor: aurora.accentBorder,
    boxShadow: '0 0 16px rgba(139, 92, 246, 0.55)',
  },
  chipPressed: { backgroundColor: aurora.glassPressed },
  label: { color: aurora.textMuted, fontFamily: fonts.medium, fontSize: 13, lineHeight: 18, includeFontPadding: false, textAlignVertical: 'center' },
  labelSelected: { color: aurora.text, fontFamily: fonts.semibold },
});
