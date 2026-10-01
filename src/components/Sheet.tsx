import React from 'react';
import { Modal, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BREAKPOINTS } from '../design/tokens';
import { Button, EmptyState, Pill, SectionLabel } from './ui';

interface SheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  scrollable?: boolean;
}

/**
 * Secondary-depth overlay.
 *
 * Phone: bottom sheet with safe-area-aware footer.
 * Tablet/web: bounded centered surface instead of a viewport-wide drawer.
 */
export const Sheet: React.FC<SheetProps> = ({
  visible,
  onClose,
  title,
  children,
  footer,
  scrollable = true,
}) => {
  const Body = scrollable ? ScrollView : View;
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const isPhone = width < BREAKPOINTS.tablet.min;
  const sheetHeight = isPhone ? Math.round(height * 0.92) : Math.min(Math.round(height * 0.86), 760);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View
        className={`flex-1 bg-black/60 ${
          isPhone ? 'justify-end' : 'items-center justify-center px-6 py-8'
        }`}
      >
        <View
          className={`w-full overflow-hidden border-border-subtle bg-surface ${
            isPhone ? 'rounded-t-3xl border-t' : 'rounded-3xl border'
          }`}
          style={{
            height: sheetHeight,
            maxWidth: isPhone ? undefined : 680,
          }}
        >
          <View className="flex-row items-center justify-between gap-3 border-b border-border-subtle px-4 py-2">
            {title ? (
              <Text className="flex-1 text-base font-semibold text-ink" numberOfLines={2}>
                {title}
              </Text>
            ) : (
              <View className="flex-1" />
            )}
            <Button
              label="✕"
              onPress={onClose}
              variant="ghost"
              size="sm"
              accessibilityLabel="Close"
            />
          </View>

          <Body
            className={scrollable ? 'flex-1' : undefined}
            contentContainerStyle={
              scrollable ? { padding: 16, paddingBottom: 24, gap: 16 } : undefined
            }
            style={scrollable ? undefined : { padding: 16, gap: 16, flex: 1 }}
            keyboardShouldPersistTaps={scrollable ? 'handled' : undefined}
          >
            {children}
          </Body>

          {footer ? (
            <View
              className="border-t border-border-subtle px-4 pt-3"
              style={{ paddingBottom: Math.max(isPhone ? insets.bottom : 0, 12) }}
            >
              {footer}
            </View>
          ) : null}
        </View>
      </View>
    </Modal>
  );
};

interface ConfirmProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmProps> = ({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel,
  destructive = false,
  onConfirm,
  onCancel,
}) => (
  <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
    <View className="flex-1 items-center justify-center bg-black/60 px-5">
      <View className="w-full max-w-sm gap-4 rounded-2xl border border-border-subtle bg-surface p-5">
        <Text className="text-lg font-semibold text-ink">{title}</Text>
        <Text className="text-sm leading-relaxed text-body">{message}</Text>
        <View className="flex-row gap-2.5">
          <View className="flex-1">
            <Button label={cancelLabel} onPress={onCancel} variant="secondary" size="sm" />
          </View>
          <View className="flex-1">
            <Button
              label={confirmLabel}
              onPress={onConfirm}
              size="sm"
              variant={destructive ? 'danger' : 'primary'}
            />
          </View>
        </View>
      </View>
    </View>
  </Modal>
);

export { EmptyState, Pill, SectionLabel };
