import { useRouter } from 'expo-router';
import {
  AudioLines,
  Bell,
  BellRing,
  Cloud,
  CloudOff,
  Download,
  Info,
  Lock,
  Mail,
  RefreshCw,
  User,
} from 'lucide-react-native';

import { AuroraListGroup, AuroraListItem, AuroraScreen } from '@/components/aurora';
import { voiceSettings } from '@/config/voice-messages';
import { firstNameOf, speak } from '@/features/voice/voice-engine';
import { syncNow } from '@/services/synchronization';
import { useAuthStore } from '@/store/auth-store';
import { useNetworkStore } from '@/store/network-store';
import { useSyncStore } from '@/store/sync-store';
import { formatRelative } from '@/utils/date';

const LANGUAGE_NAMES: Record<string, string> = {
  'en-IN': 'English (India)',
  'en-US': 'English (US)',
  'en-GB': 'English (UK)',
  'hi-IN': 'Hindi',
};

export default function SettingsScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const name = firstNameOf(user?.displayName);
  const isOnline = useNetworkStore((s) => s.isOnline);
  const { isSyncing, pendingCount, lastSyncedAt, lastError } = useSyncStore();

  const syncSubtitle = isSyncing
    ? 'Syncing…'
    : isOnline === false
      ? 'Offline: changes are kept on this device'
      : lastError
        ? `Last attempt failed: ${lastError}`
        : lastSyncedAt
          ? `Last synced ${formatRelative(lastSyncedAt)}`
          : 'Not synced yet';

  const language = LANGUAGE_NAMES[voiceSettings.language] ?? voiceSettings.language;

  return (
    <AuroraScreen
      overline="Account · sync · voice"
      title="Settings"
      onBack={() => router.back()}>
      <AuroraListGroup title="Account">
        <AuroraListItem
          icon={User}
          title={name ?? 'No name set'}
          subtitle="Used in greetings and voice reminders"
        />
        <AuroraListItem icon={Mail} title={user?.email ?? 'No email'} subtitle="Signed in with email" />
      </AuroraListGroup>

      <AuroraListGroup
        title="Sync"
        footer="Your data is saved on this device first, then backed up to your private cloud space.">
        <AuroraListItem
          icon={isOnline === false ? CloudOff : Cloud}
          title="Status"
          subtitle={syncSubtitle}
          badge={isOnline === false ? 'Offline' : 'Online'}
        />
        <AuroraListItem
          icon={RefreshCw}
          title="Sync now"
          subtitle={pendingCount > 0 ? `${pendingCount} change${pendingCount === 1 ? '' : 's'} waiting` : 'Everything is up to date'}
          disabled={isSyncing || isOnline === false}
          onPress={() => void syncNow()}
        />
      </AuroraListGroup>

      <AuroraListGroup
        title="Voice"
        footer="Voice, speed and pronunciations are in src/config/voice-messages.ts">
        <AuroraListItem
          icon={BellRing}
          title="Voice reminders"
          subtitle="Add, edit and schedule what Elora says"
          onPress={() => router.push('/reminders')}
        />
        <AuroraListItem
          icon={AudioLines}
          title="Elora's voice"
          subtitle={`${language} · speed ${voiceSettings.rate} · tap to hear it`}
          onPress={() =>
            speak(`Hi${name ? ` ${name}` : ''}, this is my voice.`, { interrupt: true })
          }
        />
      </AuroraListGroup>

      <AuroraListGroup title="More">
        <AuroraListItem icon={Bell} title="Notifications" subtitle="Choose what Elora alerts you about" badge="Soon" disabled />
        <AuroraListItem icon={Lock} title="Privacy" subtitle="Control your data and permissions" badge="Soon" disabled />
        <AuroraListItem icon={Download} title="Backup & export" subtitle="Download a copy of your data" badge="Soon" disabled />
        <AuroraListItem
          icon={Info}
          title="About Elora"
          subtitle="Version and app information"
          onPress={() => router.push('/settings/about')}
        />
      </AuroraListGroup>
    </AuroraScreen>
  );
}
