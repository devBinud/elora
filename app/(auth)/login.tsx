import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ChevronLeft } from 'lucide-react-native';
import { KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuroraBackground, GlassCard } from '@/components/aurora';
import { EloraLogo } from '@/components/aurora/elora-logo';
import {
  ResetPasswordForm,
  SignInForm,
  SignUpForm,
  type AuthMode,
} from '@/features/auth/auth-forms';
import { aurora } from '@/theme/aurora';
import { fonts } from '@/theme/fonts';

const COPY: Record<AuthMode, { overline: string; title: string; accent: string; subtitle: string }> = {
  signin: {
    overline: 'Welcome back',
    title: 'Sign in to',
    accent: 'Elora',
    subtitle: 'Your reminders and news are waiting for you.',
  },
  signup: {
    overline: 'Get started',
    title: 'Create your',
    accent: 'account',
    subtitle: 'It takes a minute. Your data stays private to you.',
  },
  reset: {
    overline: 'Account help',
    title: 'Reset your',
    accent: 'password',
    subtitle: "We'll email you a link to set a new one.",
  },
};

function parseMode(value: string | string[] | undefined): AuthMode {
  return value === 'signup' || value === 'reset' ? value : 'signin';
}

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ mode?: string }>();
  const mode = parseMode(params.mode);
  const copy = COPY[mode];
  const switchMode = (next: AuthMode) => router.setParams({ mode: next });

  const goBack = () => {
    if (mode === 'reset') switchMode('signin');
    else if (router.canGoBack()) router.back();
    else router.replace('/welcome');
  };

  return (
    <View style={styles.root}>
      <AuroraBackground />
      <StatusBar style="light" />
      <KeyboardAvoidingView style={styles.root} behavior="padding">
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.content,
            { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 32 },
          ]}>
          <View style={styles.topRow}>
            <Pressable
              onPress={goBack}
              accessibilityRole="button"
              accessibilityLabel="Back"
              hitSlop={8}
              style={({ pressed }) => [styles.back, pressed && styles.backPressed]}>
              <ChevronLeft size={22} color={aurora.text} strokeWidth={2} />
            </Pressable>
            <EloraLogo size={44} />
            <View style={styles.backSpacer} />
          </View>

          <View>
            <Text style={styles.overline}>{copy.overline}</Text>
            <Text style={styles.title} accessibilityRole="header">
              {copy.title}
            </Text>
            <Text style={styles.accent}>{copy.accent}</Text>
            <Text style={styles.subtitle}>{copy.subtitle}</Text>
          </View>

          <GlassCard style={styles.card}>
            {mode === 'signin' ? <SignInForm key="signin" onSwitchMode={switchMode} /> : null}
            {mode === 'signup' ? <SignUpForm key="signup" onSwitchMode={switchMode} /> : null}
            {mode === 'reset' ? <ResetPasswordForm key="reset" onSwitchMode={switchMode} /> : null}
          </GlassCard>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: aurora.background },
  content: { flexGrow: 1, paddingHorizontal: 20, gap: 24 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  back: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: aurora.glass,
    borderColor: 'rgba(216, 180, 254, 0.22)',
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  backPressed: { backgroundColor: aurora.glassPressed },
  backSpacer: { width: 40 },
  overline: {
    color: aurora.lilac,
    fontFamily: fonts.semibold,
    fontSize: 11,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  title: { color: aurora.text, fontFamily: fonts.bold, fontSize: 32, lineHeight: 40, letterSpacing: -0.7 },
  accent: {
    color: aurora.lilac,
    fontFamily: fonts.lightItalic,
    fontSize: 32,
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  subtitle: {
    color: aurora.textMuted,
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 10,
  },
  card: { padding: 20 },
});
