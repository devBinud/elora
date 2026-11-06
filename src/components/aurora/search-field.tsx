import { Search, X } from 'lucide-react-native';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { aurora } from '@/theme/aurora';
import { fonts } from '@/theme/fonts';

type SearchFieldProps = {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit?: () => void;
  onClear: () => void;
  placeholder?: string;
};

/** Frosted search bar with a clear button. */
export function SearchField({
  value,
  onChangeText,
  onSubmit,
  onClear,
  placeholder = 'Search',
}: SearchFieldProps) {
  return (
    <View style={styles.field}>
      <Search size={18} color={aurora.textSubtle} strokeWidth={1.9} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmit}
        placeholder={placeholder}
        placeholderTextColor={aurora.textSubtle}
        selectionColor={aurora.lilac}
        cursorColor={aurora.lilac}
        returnKeyType="search"
        autoCorrect={false}
        maxLength={200}
        style={styles.input}
        accessibilityLabel={placeholder}
      />
      {value.length > 0 ? (
        <Pressable onPress={onClear} hitSlop={10} accessibilityRole="button" accessibilityLabel="Clear search">
          <X size={18} color={aurora.textMuted} strokeWidth={1.9} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    borderRadius: 24,
    backgroundColor: aurora.glass,
    borderColor: aurora.glassBorder,
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  input: {
    flex: 1,
    color: aurora.text,
    fontFamily: fonts.regular,
    fontSize: 15,
    paddingVertical: 0,
  },
});
