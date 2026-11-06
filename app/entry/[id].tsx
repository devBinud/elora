import type { ParamListBase } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { format } from 'date-fns';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Check, ChevronLeft, Star, Trash2 } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuroraBackground, ChipRow } from '@/components/aurora';
import {
  countWords,
  JOURNAL_CATEGORIES,
  journalRepository,
  type JournalCategory,
} from '@/features/journal/journal-repository';
import { useJournalEntry } from '@/features/journal/use-journal';
import { useAuthStore } from '@/store/auth-store';
import { aurora } from '@/theme/aurora';
import { fonts } from '@/theme/fonts';

/** Autosave this long after the last keystroke. */
const AUTOSAVE_MS = 700;
const WORDS_PER_MINUTE = 200;

type Draft = { title: string; body: string; category: JournalCategory; favorite: boolean };
type SaveState = 'idle' | 'saving' | 'saved';

function toCategory(value: string | undefined): JournalCategory {
  return JOURNAL_CATEGORIES.some((c) => c.id === value) ? (value as JournalCategory) : 'journal';
}

const isBlank = (draft: Draft) => !draft.title.trim() && !draft.body.trim();

export default function JournalEntryScreen() {
  const params = useLocalSearchParams<{ id: string; category?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const userId = useAuthStore((s) => s.user?.uid ?? null);

  const isNew = params.id === 'new';
  const stored = useJournalEntry(isNew ? null : params.id);

  const [draft, setDraft] = useState<Draft>({
    title: '',
    body: '',
    category: toCategory(params.category),
    favorite: false,
  });
  const [hydrated, setHydrated] = useState(isNew);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [createdAt, setCreatedAt] = useState(() => Date.now());
  // Whether the entry exists in storage (shows the delete button), and whether it is being deleted.
  const [hasEntry, setHasEntry] = useState(!isNew);
  const [deleting, setDeleting] = useState(false);

  // Mutable save state shared by autosave, leaving the screen and deleting.
  const entryIdRef = useRef<string | null>(isNew ? null : params.id);
  const pendingRef = useRef<Draft | null>(null);
  /** The latest editor contents (read when the screen closes). */
  const latestRef = useRef<Draft | null>(null);
  const chainRef = useRef<Promise<void>>(Promise.resolve());
  const deletedRef = useRef(false);
  const mountedRef = useRef(true);
  const bodyRef = useRef<TextInput>(null);
  const titleRef = useRef<TextInput>(null);
  const navigation = useNavigation<NativeStackNavigationProp<ParamListBase>>();

  // Open the keyboard only after the slide-in finishes, so the two animations
  // don't run at once.
  useEffect(() => {
    if (!isNew) return;
    return navigation.addListener('transitionEnd', (event) => {
      if (!event.data.closing) titleRef.current?.focus();
    });
  }, [navigation, isNew]);

  // Load an existing entry into the editor once.
  useEffect(() => {
    if (hydrated || !stored) return;
    const loaded: Draft = {
      title: stored.title,
      body: stored.body,
      category: stored.category,
      favorite: stored.favorite,
    };
    latestRef.current = loaded;
    setDraft(loaded);
    setCreatedAt(stored.createdAt);
    setSaveState('saved');
    setHydrated(true);
  }, [stored, hydrated]);

  /** Saves `values` after any save already in progress. Creates the entry on first content. */
  const persist = (values: Draft): Promise<void> => {
    chainRef.current = chainRef.current.then(async () => {
      if (!userId || deletedRef.current) return;
      try {
        if (!entryIdRef.current) {
          if (isBlank(values)) return;
          const created = await journalRepository.create(userId, values);
          entryIdRef.current = created.id;
          if (mountedRef.current) setHasEntry(true);
        } else {
          await journalRepository.update(userId, entryIdRef.current, values);
        }
        if (pendingRef.current === values) pendingRef.current = null;
        if (mountedRef.current) setSaveState('saved');
      } catch (error) {
        if (__DEV__) console.warn('[journal] save failed', error);
      }
    });
    return chainRef.current;
  };

  /** Saves pending changes now; removes the entry if it was left completely empty. */
  const flush = async () => {
    const pending = pendingRef.current;
    if (pending) await persist(pending);
    await chainRef.current;
    const latest = latestRef.current;
    // Only remove when the user actually emptied it (never on stale state).
    if (userId && entryIdRef.current && !deletedRef.current && latest && isBlank(latest)) {
      deletedRef.current = true;
      await journalRepository.remove(userId, entryIdRef.current);
    }
  };

  // Debounced autosave while typing.
  useEffect(() => {
    const pending = pendingRef.current;
    if (!pending) return;
    const timer = setTimeout(() => void persist(pending), AUTOSAVE_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `persist` only reads refs and userId.
  }, [draft]);

  // Save whatever is left when the screen closes (back button, gesture).
  useEffect(
    () => () => {
      mountedRef.current = false;
      void flush();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once, on unmount.
    [],
  );

  const change = (changes: Partial<Draft>) => {
    setDraft((current) => {
      const next = { ...current, ...changes };
      pendingRef.current = next;
      latestRef.current = next;
      return next;
    });
    setSaveState('saving');
  };

  // Close straight away: the keyboard hides first, and the final save runs when
  // the screen unmounts (after the animation), so nothing competes with it.
  const goBack = () => {
    Keyboard.dismiss();
    router.back();
  };

  const confirmDelete = () => {
    Alert.alert('Delete this entry?', 'It will be removed from this device and your account.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deletedRef.current = true;
          setDeleting(true);
          pendingRef.current = null;
          void chainRef.current
            .then(async () => {
              if (userId && entryIdRef.current) await journalRepository.remove(userId, entryIdRef.current);
            })
            .finally(() => router.back());
        },
      },
    ]);
  };

  if (!isNew && stored === null && !deleting) {
    return (
      <View style={[styles.root, styles.missing]}>
        <AuroraBackground />
        <StatusBar style="light" />
        <Text style={styles.missingTitle}>This entry no longer exists.</Text>
        <Pressable onPress={() => router.back()} accessibilityRole="button">
          <Text style={styles.missingLink}>Back to journal</Text>
        </Pressable>
      </View>
    );
  }

  const words = countWords(draft.body);
  const minutes = Math.max(1, Math.round(words / WORDS_PER_MINUTE));
  const statusText =
    saveState === 'saving' ? 'Saving…' : saveState === 'saved' ? 'Saved' : isNew ? 'New entry' : '';

  return (
    <View style={styles.root}>
      <AuroraBackground />
      <StatusBar style="light" />

      {/* Top bar */}
      <View style={[styles.bar, { paddingTop: insets.top + 8 }]}>
        <RoundButton label="Back" onPress={goBack}>
          <ChevronLeft size={22} color={aurora.text} strokeWidth={2} />
        </RoundButton>
        <View style={styles.status} accessibilityLiveRegion="polite">
          {saveState === 'saved' ? <Check size={14} color={aurora.lilac} strokeWidth={2.4} /> : null}
          <Text style={styles.statusText}>{statusText}</Text>
        </View>
        <View style={styles.barActions}>
          <RoundButton
            label={draft.favorite ? 'Remove from saved' : 'Save as favourite'}
            onPress={() => change({ favorite: !draft.favorite })}>
            <Star
              size={18}
              color={draft.favorite ? aurora.lilac : aurora.text}
              fill={draft.favorite ? aurora.lilac : 'transparent'}
              strokeWidth={2}
            />
          </RoundButton>
          {hasEntry ? (
            <RoundButton label="Delete entry" onPress={confirmDelete}>
              <Trash2 size={18} color={aurora.danger} strokeWidth={2} />
            </RoundButton>
          ) : null}
        </View>
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior="padding">
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 48 }]}>
          <Text style={styles.date}>{format(createdAt, "EEEE, d MMMM · h:mm a")}</Text>

          <ChipRow
            options={JOURNAL_CATEGORIES}
            selected={draft.category}
            onSelect={(category) => change({ category })}
          />

          <TextInput
            ref={titleRef}
            value={draft.title}
            onChangeText={(title) => change({ title })}
            placeholder="Title"
            placeholderTextColor={aurora.textSubtle}
            selectionColor={aurora.lilac}
            cursorColor={aurora.lilac}
            style={styles.titleInput}
            multiline
            maxLength={200}
            returnKeyType="next"
            submitBehavior="submit"
            onSubmitEditing={() => bodyRef.current?.focus()}
            accessibilityLabel="Title"
          />

          <TextInput
            ref={bodyRef}
            value={draft.body}
            onChangeText={(body) => change({ body })}
            placeholder="Start writing…"
            placeholderTextColor={aurora.textSubtle}
            selectionColor={aurora.lilac}
            cursorColor={aurora.lilac}
            style={styles.bodyInput}
            multiline
            scrollEnabled={false}
            textAlignVertical="top"
            accessibilityLabel="Entry"
          />

          <View style={styles.divider} />
          <Text style={styles.footer}>
            {words} {words === 1 ? 'word' : 'words'} · {minutes} min read
            {'\n'}Saved on this device and synced to your account.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function RoundButton({
  label,
  onPress,
  children,
}: {
  label: string;
  onPress: () => void;
  children: React.ReactNode;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      style={({ pressed }) => [styles.roundButton, pressed && styles.roundButtonPressed]}>
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: aurora.background },
  flex: { flex: 1 },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 12,
  },
  barActions: { flexDirection: 'row', gap: 10 },
  status: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  statusText: { color: aurora.textMuted, fontFamily: fonts.medium, fontSize: 13 },
  roundButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: aurora.glass,
    borderColor: 'rgba(216, 180, 254, 0.22)',
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  roundButtonPressed: { backgroundColor: aurora.glassPressed },

  content: { paddingHorizontal: 20, paddingTop: 12, gap: 16 },
  date: {
    color: aurora.lilac,
    fontFamily: fonts.semibold,
    fontSize: 11,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  titleInput: {
    color: aurora.text,
    fontFamily: fonts.bold,
    fontSize: 26,
    lineHeight: 34,
    letterSpacing: -0.4,
    padding: 0,
    marginTop: 4,
  },
  bodyInput: {
    color: 'rgba(237, 233, 254, 0.9)',
    fontFamily: fonts.regular,
    fontSize: 17,
    lineHeight: 28,
    minHeight: 320,
    padding: 0,
  },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: aurora.glassBorder },
  footer: { color: aurora.textSubtle, fontFamily: fonts.regular, fontSize: 12, lineHeight: 18 },

  missing: { alignItems: 'center', justifyContent: 'center', gap: 12 },
  missingTitle: { color: aurora.text, fontFamily: fonts.semibold, fontSize: 16 },
  missingLink: { color: aurora.lilac, fontFamily: fonts.semibold, fontSize: 14 },
});
