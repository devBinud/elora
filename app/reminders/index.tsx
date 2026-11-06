import { useRouter } from 'expo-router';
import { BellOff, BellRing, Plus } from 'lucide-react-native';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { AuroraScreen, GlassCard, GradientButton, IconBubble } from '@/components/aurora';
import { ReminderCard } from '@/features/voice/components/reminder-card';
import { firstNameOf } from '@/features/voice/voice-engine';
import { voiceRemindersRepository, type VoiceReminderItem } from '@/features/voice/voice-reminders-repository';
import { useVoiceRemindersStore } from '@/features/voice/voice-reminders-store';
import { useNotificationPermission } from '@/features/voice/use-notification-permission';
import { useAuthStore } from '@/store/auth-store';
import { aurora } from '@/theme/aurora';
import { fonts } from '@/theme/fonts';

export default function RemindersScreen() {
  const router = useRouter();
  const uid = useAuthStore((s) => s.user?.uid ?? null);
  const name = useAuthStore((s) => firstNameOf(s.user?.displayName));
  const reminders = useVoiceRemindersStore((s) => s.reminders);
  const loaded = useVoiceRemindersStore((s) => s.loaded);
  const { status, enable } = useNotificationPermission();

  const activeCount = reminders.filter((r) => r.enabled !== false).length;

  const toggle = (reminder: VoiceReminderItem, enabled: boolean) => {
    if (uid) void voiceRemindersRepository.update(uid, reminder.id, { enabled });
  };
  const openEditor = (id: string) => router.push({ pathname: '/reminders/[id]', params: { id } });
  const confirmDelete = (reminder: VoiceReminderItem) => {
    Alert.alert('Delete this reminder?', `“${reminder.message}”`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          if (uid) void voiceRemindersRepository.remove(uid, reminder.id);
        },
      },
    ]);
  };

  return (
    <AuroraScreen
      overline={`${activeCount} active · spoken by Elora`}
      title="Voice"
      accent="reminders"
      onBack={() => router.back()}>
      {/* Notification permission */}
      {status === 'granted' ? (
        <GlassCard>
          <View style={styles.row}>
            <IconBubble icon={BellRing} size={40} />
            <View style={styles.flex}>
              <Text style={styles.cardTitle}>Notifications are on</Text>
              <Text style={styles.cardBody}>
                You&apos;ll get a notification at each reminder time, even when Elora is closed.
              </Text>
            </View>
          </View>
        </GlassCard>
      ) : status !== 'unknown' ? (
        <GlassCard style={styles.alertCard}>
          <View style={styles.row}>
            <IconBubble icon={BellOff} size={40} tone="danger" />
            <View style={styles.flex}>
              <Text style={styles.cardTitle}>Turn on notifications</Text>
              <Text style={styles.cardBody}>
                Without them, reminders only play while Elora is open.
              </Text>
            </View>
          </View>
          <View style={styles.alertAction}>
            <GradientButton title="Allow notifications" icon={BellRing} onPress={() => void enable()} />
          </View>
        </GlassCard>
      ) : null}

      <GradientButton
        title="New reminder"
        icon={Plus}
        onPress={() => openEditor('new')}
      />

      {loaded && reminders.length === 0 ? (
        <GlassCard style={styles.empty}>
          <IconBubble icon={BellRing} size={52} />
          <Text style={styles.emptyTitle}>No reminders yet</Text>
          <Text style={styles.emptyBody}>
            Add one and Elora will say it out loud at that time, every day or on the days you pick.
          </Text>
        </GlassCard>
      ) : (
        reminders.map((reminder) => (
          <ReminderCard
            key={reminder.id}
            reminder={reminder}
            name={name}
            onToggle={(enabled) => toggle(reminder, enabled)}
            onEdit={() => openEditor(reminder.id)}
            onDelete={() => confirmDelete(reminder)}
          />
        ))
      )}

      <Text style={styles.footnote}>
        While Elora is open, she speaks each reminder and repeats it until you say “OK”. When the app
        is closed you get a notification; tap it and Elora reads it out.
      </Text>
    </AuroraScreen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  cardTitle: { color: aurora.text, fontFamily: fonts.semibold, fontSize: 15 },
  cardBody: { color: aurora.textMuted, fontFamily: fonts.regular, fontSize: 13, lineHeight: 18, marginTop: 2 },
  alertCard: { borderColor: aurora.dangerBorder },
  alertAction: { marginTop: 14 },


  empty: { alignItems: 'center', gap: 10, paddingVertical: 28 },
  emptyTitle: { color: aurora.text, fontFamily: fonts.semibold, fontSize: 18, marginTop: 4 },
  emptyBody: { color: aurora.textMuted, fontFamily: fonts.regular, fontSize: 14, lineHeight: 20, textAlign: 'center' },
  footnote: { color: aurora.textSubtle, fontFamily: fonts.regular, fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 4 },
});
