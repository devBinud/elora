import { Children, Fragment, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme';

import { AppText } from './app-text';

export type ListGroupProps = {
  title?: string;
  footer?: string;
  children: ReactNode;
};

/** A bordered group of list items separated by hairline dividers. */
export function ListGroup({ title, footer, children }: ListGroupProps) {
  const theme = useTheme();
  const items = Children.toArray(children).filter(Boolean);

  return (
    <View style={{ gap: theme.spacing.sm }}>
      {title ? (
        <AppText variant="overline" tone="muted" style={{ paddingHorizontal: theme.spacing.xs }}>
          {title}
        </AppText>
      ) : null}
      <View
        style={{
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.lg,
          backgroundColor: theme.colors.surface,
          overflow: 'hidden',
        }}>
        {items.map((child, index) => (
          <Fragment key={index}>
            {index > 0 ? (
              <View
                style={[
                  styles.divider,
                  { backgroundColor: theme.colors.border, marginLeft: theme.spacing.lg },
                ]}
              />
            ) : null}
            {child}
          </Fragment>
        ))}
      </View>
      {footer ? (
        <AppText variant="caption" tone="subtle" style={{ paddingHorizontal: theme.spacing.xs }}>
          {footer}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  divider: { height: StyleSheet.hairlineWidth },
});
