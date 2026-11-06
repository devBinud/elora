import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { BellRing, NotebookPen, Newspaper, type LucideIcon } from 'lucide-react-native';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AssistantOrb, AuroraBackground, GradientButton } from '@/components/aurora';
import { EloraLogo } from '@/components/aurora/elora-logo';
import { aurora } from '@/theme/aurora';
import { fonts } from '@/theme/fonts';

const FEATURES: { icon: LucideIcon; label: string }[] = [
  { icon: BellRing, label: 'Voice reminders' },
  { icon: Newspaper, label: 'Daily news' },
  { icon: NotebookPen, label: 'Private journal' },
];

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      <AuroraBackground />
      <StatusBar style="light" />
      <ScrollView
        bounces={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 },
        ]}>
        <View style={styles.logoRow}>
          <EloraLogo size={72} />
        </View>

        <View style={styles.hero}>
          <AssistantOrb size={210} idPrefix="welcome" />
          <Text style={styles.overline}>Your personal voice assistant</Text>
          <Text style={styles.title}>Meet</Text>
          <Text style={styles.accent}>Elora</Text>
          <Text style={styles.body}>
            Spoken reminders, trusted news and a private journal, all in one calm place.
          </Text>
          <View style={styles.features}>
            {FEATURES.map(({ icon: Icon, label }) => (
              <View key={label} style={styles.feature}>
                <Icon size={14} color={aurora.lilac} strokeWidth={2} />
                <Text style={styles.featureText}>{label}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.actions}>
          <GradientButton
            title="Create account"
            onPress={() => router.push({ pathname: '/login', params: { mode: 'signup' } })}
          />
          <GradientButton
            title="I already have an account"
            variant="glass"
            onPress={() => router.push({ pathname: '/login', params: { mode: 'signin' } })}
          />
          <Text style={styles.footnote}>Your data stays private to your account.</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: aurora.background },
  content: { flexGrow: 1, paddingHorizontal: 24, gap: 28 },
  logoRow: { alignItems: 'center' },
  hero: { alignItems: 'center' },
  overline: {
    color: aurora.lilac,
    fontFamily: fonts.semibold,
    fontSize: 11,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginTop: 8,
    marginBottom: 8,
  },
  title: {
    color: aurora.text,
    fontFamily: fonts.bold,
    fontSize: 38,
    lineHeight: 46,
    letterSpacing: -0.8,
  },
  accent: {
    color: aurora.lilac,
    fontFamily: fonts.lightItalic,
    fontSize: 38,
    lineHeight: 46,
    letterSpacing: -0.6,
    marginTop: -4,
  },
  body: {
    color: aurora.textMuted,
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginTop: 12,
    maxWidth: 320,
  },
  features: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: aurora.glass,
    borderColor: aurora.glassBorder,
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  featureText: { color: aurora.text, fontFamily: fonts.medium, fontSize: 12, lineHeight: 16, includeFontPadding: false, textAlignVertical: 'center' },
  actions: { marginTop: 'auto', gap: 12 },
  footnote: {
    color: aurora.textSubtle,
    fontFamily: fonts.regular,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
});
