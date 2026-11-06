import React from 'react';
import { Modal, Pressable, ScrollView, useWindowDimensions, View } from 'react-native';
import { Text } from './AppText';
import { X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { iconColor } from '../design/iconColor';
import { BREAKPOINTS } from '../design/tokens';
import { Button, EmptyState, Pill, SectionLabel } from './ui';

interface SheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  scrollable?: boolean;
  size?: 'compact' | 'large';
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
  size = 'large',
}) => {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const isPhone = width < BREAKPOINTS.tablet.min;
  const sheetHeight =
    size === 'compact'
      ? isPhone
        ? Math.min(Math.round(height * 0.56), 520)
        : Math.min(Math.round(height * 0.68), 560)
      : isPhone
        ? Math.round(height * 0.92)
        : Math.min(Math.round(height * 0.86), 760);

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
        <Pressable
          className="absolute inset-0"
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Dismiss overlay"
        />
        <View
          className={`w-full overflow-hidden border-border-subtle bg-surface ${
            isPhone ? 'rounded-t-[32px] border-t' : 'rounded-[32px] border'
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
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close"
              className="h-12 w-12 items-center justify-center rounded-full border border-transparent bg-surface-soft hover:bg-surface-hover active:opacity-70 focus:border-2 focus:border-focus"
            >
              <X size={20} color={iconColor('ink')} />
            </Pressable>
          </View>

          {scrollable ? (
            <ScrollView
              className="flex-1"
              contentContainerStyle={{ padding: 16, paddingBottom: 24, gap: 16 }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={true}
            >
              {children}
            </ScrollView>
          ) : (
            <View style={{ padding: 16, gap: 16, flex: 1 }}>{children}</View>
          )}

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
