import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import {
  AudioLines,
  BellRing,
  Bookmark,
  History,
  ListChecks,
  LogOut,
  Settings,
  ShieldCheck,
} from 'lucide-react-native';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { AuroraListGroup, AuroraListItem, AuroraScreen, GlassCard } from '@/components/aurora';
import { firstNameOf, getScheduledMessages, speak } from '@/features/voice/voice-engine';
import { useVoiceRemindersStore } from '@/features/voice/voice-reminders-store';
import { signOutUser } from '@/firebase/auth';
import { useAuthStore } from '@/store/auth-store';
import { aurora } from '@/theme/aurora';
import { fonts } from '@/theme/fonts';
import { greetingFor } from '@/utils/date';

export default function MoreScreen() {
  const router = useRouter();
  const isAdmin = useAuthStore((s) => s.isAdmin);
  const email = useAuthStore((s) => s.user?.email);
  const displayName = useAuthStore((s) => s.user?.displayName);
  const name = firstNameOf(displayName);
  const reminders = useVoiceRemindersStore((s) => s.reminders);
  const activeReminders = getScheduledMessages(reminders).length;

  const confirmSignOut = () => {
    Alert.alert('Sign out?', 'Data saved on this device stays here until you sign in again.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => void signOutUser() },
    ]);
  };

  const testVoice = () =>
    speak(`${greetingFor(new Date())}${name ? ` ${name}` : ''}. This is how I sound.`, {
      interrupt: true,
    });

  return (
    <AuroraScreen overline="Account & settings" title="Your" accent="Elora">
      {/* Profile */}
      <GlassCard>
        <View style={styles.profile}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{(name ?? email ?? '?').charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.flex}>
            <Text style={styles.name} numberOfLines={1}>
              {name ?? 'Your account'}
            </Text>
            {email ? (
              <Text style={styles.email} numberOfLines={1}>
                {email}
              </Text>
            ) : null}
          </View>
          {isAdmin ? (
            <View style={styles.adminPill}>
              <Text style={styles.adminText}>Admin</Text>
            </View>
          ) : null}
        </View>
      </GlassCard>

      <AuroraListGroup title="Voice">
        <AuroraListItem
          icon={AudioLines}
          title="Test Elora's voice"
          subtitle="Hear how Elora sounds right now"
          onPress={testVoice}
        />
        <AuroraListItem
          icon={BellRing}
          title="Voice reminders"
          subtitle={`${activeReminders} active · add, edit and schedule`}
          onPress={() => router.push('/reminders')}
        />
      </AuroraListGroup>

      <AuroraListGroup title="Productivity">
        <AuroraListItem icon={ListChecks} title="Tasks" subtitle="Plan and track your to-dos" badge="Soon" disabled />
        <AuroraListItem icon={Bookmark} title="Saved articles" subtitle="News you want to read later" badge="Soon" disabled />
        <AuroraListItem icon={History} title="Notification history" subtitle="Everything Elora reminded you about" badge="Soon" disabled />
      </AuroraListGroup>

      <AuroraListGroup title="App">
        {isAdmin ? (
          <AuroraListItem
            icon={ShieldCheck}
            title="Admin control centre"
            subtitle="Manage content and app settings"
            onPress={() => router.push('/admin')}
          />
        ) : null}
        <AuroraListItem
          icon={Settings}
          title="Settings"
          subtitle="Account, sync and appearance"
          onPress={() => router.push('/settings')}
        />
      </AuroraListGroup>

      <AuroraListGroup>
        <AuroraListItem icon={LogOut} title="Sign out" destructive onPress={confirmSignOut} />
      </AuroraListGroup>

      <Text style={styles.version}>Elora {Constants.expoConfig?.version ?? ''}</Text>
    </AuroraScreen>
  );
}

const AVATAR = 52;

const styles = StyleSheet.create({
  flex: { flex: 1 },
  profile: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: {
    width: AVATAR,
    height: AVATAR,
    borderRadius: AVATAR / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: aurora.violet,
    borderColor: aurora.accentBorder,
    borderWidth: 2,
    boxShadow: '0 0 18px rgba(139, 92, 246, 0.55)',
  },
  avatarText: { color: aurora.text, fontFamily: fonts.bold, fontSize: 22 },
  name: { color: aurora.text, fontFamily: fonts.semibold, fontSize: 18, lineHeight: 24 },
  email: { color: aurora.textMuted, fontFamily: fonts.regular, fontSize: 13, lineHeight: 18 },
  adminPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: aurora.accentTint,
    borderColor: aurora.accentBorder,
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  adminText: { color: aurora.lilac, fontFamily: fonts.semibold, fontSize: 11 },
  version: {
    color: aurora.textSubtle,
    fontFamily: fonts.regular,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
});
