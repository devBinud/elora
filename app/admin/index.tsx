import {
  Bell,
  BookText,
  LayoutGrid,
  ListChecks,
  Radio,
  Repeat,
  SlidersHorizontal,
} from 'lucide-react-native';

import { AppText, Card, ListGroup, ListItem } from '@/components/common';
import { Screen } from '@/components/layout/screen';

export default function AdminHomeScreen() {
  return (
    <Screen edges={[]}>
      <Card>
        <AppText variant="bodyStrong">Manage Elora without touching code</AppText>
        <AppText variant="caption" tone="muted">
          Admin access is checked by Firebase security rules on every change, not just by this
          screen.
        </AppText>
      </Card>

      <ListGroup title="Assistant" footer="Arrives in Phase 3.">
        <ListItem icon={Bell} title="Reminders" disabled />
        <ListItem icon={Repeat} title="Routines" disabled />
      </ListGroup>

      <ListGroup title="News" footer="Arrives in Phase 3.">
        <ListItem icon={Radio} title="News sources" subtitle="RSS feeds and API sources" disabled />
        <ListItem icon={LayoutGrid} title="News categories" disabled />
      </ListGroup>

      <ListGroup title="Writing & tasks" footer="Arrives in Phase 3.">
        <ListItem icon={BookText} title="Journal categories & tags" disabled />
        <ListItem icon={ListChecks} title="Task categories & defaults" disabled />
      </ListGroup>

      <ListGroup title="General">
        <ListItem icon={SlidersHorizontal} title="App configuration" disabled />
      </ListGroup>
    </Screen>
  );
}
