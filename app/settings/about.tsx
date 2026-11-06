import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { AudioLines, Cloud, Newspaper, Tag } from 'lucide-react-native';
import { StyleSheet, Text } from 'react-native';

import {
  AssistantOrb,
  AuroraListGroup,
  AuroraListItem,
  AuroraScreen,
  GlassCard,
} from '@/components/aurora';
import { useSpeakingStore } from '@/features/voice/voice-engine';
import { aurora } from '@/theme/aurora';
import { fonts } from '@/theme/fonts';

export default function AboutScreen() {
  const router = useRouter();
  const speaking = useSpeakingStore((s) => s.speaking);
  const version = Constants.expoConfig?.version ?? '—';

  return (
    <AuroraScreen
      overline="About"
      title="Meet"
      accent="Elora"
      onBack={() => router.back()}>
      <GlassCard style={styles.hero}>
        <AssistantOrb size={150} idPrefix="about" speaking={speaking} />
        <Text style={styles.tagline}>Your personal voice assistant</Text>
        <Text style={styles.body}>
          Elora keeps your day on track with spoken reminders, brings you the latest news, and
          gives you a private place to write.
        </Text>
      </GlassCard>

      <AuroraListGroup title="App info">
        <AuroraListItem icon={Tag} title="Version" value={version} />
        <AuroraListItem icon={Cloud} title="Cloud" value="Firebase" />
        <AuroraListItem icon={Newspaper} title="News" value="GNews" />
        <AuroraListItem icon={AudioLines} title="Voice" value="On-device speech" />
      </AuroraListGroup>
    </AuroraScreen>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', gap: 10, paddingVertical: 24 },
  tagline: { color: aurora.text, fontFamily: fonts.semibold, fontSize: 18, marginTop: 4 },
  body: {
    color: aurora.textMuted,
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
});
