import { AlarmClock, Bell, CalendarDays, Repeat, Sparkles } from 'lucide-react-native';

import { ListGroup, ListItem } from '@/components/common';
import { Screen } from '@/components/layout/screen';

export default function AssistantScreen() {
  return (
    <Screen title="Assistant" subtitle="Alarms, reminders and the rhythm of your day.">
      <ListGroup title="Plan your day" footer="These arrive in the next release (Phase 2).">
        <ListItem icon={AlarmClock} title="Alarms" subtitle="Wake-up alarm" disabled />
        <ListItem icon={Bell} title="Reminders" subtitle="Meals, water, medicine, work" disabled />
        <ListItem icon={Repeat} title="Daily routines" subtitle="Morning, exercise, sleep" disabled />
        <ListItem icon={CalendarDays} title="Daily schedule" subtitle="Your agenda for today" disabled />
        <ListItem icon={Sparkles} title="Custom activities" disabled />
      </ListGroup>
    </Screen>
  );
}
