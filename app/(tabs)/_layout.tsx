import { Tabs } from 'expo-router';
import { House, Menu, Newspaper, NotebookPen } from 'lucide-react-native';
import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ReminderOverlay } from '@/features/voice/reminder-overlay';
import { useVoiceAssistant } from '@/features/voice/use-voice-assistant';
import { aurora } from '@/theme/aurora';
import { fonts } from '@/theme/fonts';

/** Height of the icon + label area, excluding the bottom padding. */
const TAB_BAR_CONTENT_HEIGHT = 58;
/** Breathing room under the labels when the system reports no bottom inset. */
const MIN_BOTTOM_PADDING = 12;

export default function TabsLayout() {
  useVoiceAssistant();
  const insets = useSafeAreaInsets();
  // Some phones draw the system navigation buttons in their own area and report
  // no bottom inset; keep a comfortable gap under the labels either way.
  const bottomPadding = Math.max(insets.bottom, MIN_BOTTOM_PADDING);

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: aurora.background,
            borderTopColor: aurora.glassBorder,
            borderTopWidth: StyleSheet.hairlineWidth,
            height: TAB_BAR_CONTENT_HEIGHT + bottomPadding,
            paddingTop: 8,
            paddingBottom: bottomPadding,
          },
          tabBarActiveTintColor: aurora.lilac,
          tabBarInactiveTintColor: aurora.textSubtle,
          tabBarLabelStyle: { fontFamily: fonts.medium, fontSize: 11, marginTop: 2 },
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, size }) => <House color={color} size={size} strokeWidth={1.75} />,
          }}
        />
        <Tabs.Screen
          name="assistant"
          // Hidden from the tab bar for now; the route stays for the Assistant module.
          options={{ href: null, title: 'Assistant' }}
        />
        <Tabs.Screen
          name="news"
          options={{
            title: 'News',
            tabBarIcon: ({ color, size }) => (
              <Newspaper color={color} size={size} strokeWidth={1.75} />
            ),
          }}
        />
        <Tabs.Screen
          name="journal"
          options={{
            title: 'Journal',
            tabBarIcon: ({ color, size }) => (
              <NotebookPen color={color} size={size} strokeWidth={1.75} />
            ),
          }}
        />
        <Tabs.Screen
          name="more"
          options={{
            title: 'More',
            tabBarIcon: ({ color, size }) => <Menu color={color} size={size} strokeWidth={1.75} />,
          }}
        />
      </Tabs>
      <ReminderOverlay />
    </>
  );
}
