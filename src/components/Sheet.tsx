import React from 'react';
import { Modal, ScrollView, Text, View } from 'react-native';
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
 * Full-screen modal sheet used for every overlay in the app. On phones this is
 * always full height; the maxWidth keeps it readable on tablets and web.
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

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View className="flex-1 justify-end bg-black/60">
        <View className="max-h-[92%] flex-1 rounded-t-3xl border-t border-border-subtle bg-surface">
          <View className="flex-row items-center justify-between gap-3 border-b border-border-subtle px-4 py-3">
            {title ? (
              <Text className="flex-1 text-xs font-semibold uppercase tracking-wider text-muted">
                {title}
              </Text>
            ) : (
              <View className="flex-1" />
            )}
            <Button label="✕" onPress={onClose} variant="ghost" size="sm" accessibilityLabel="Close" />
          </View>

          <Body
            className={scrollable ? 'flex-1' : undefined}
            contentContainerStyle={
              scrollable ? { padding: 16, paddingBottom: 24, gap: 16 } : undefined
            }
            style={scrollable ? undefined : { padding: 16, gap: 16 }}
          >
            {children}
          </Body>

          {footer ? (
            <View className="border-t border-border-subtle px-4 py-3">{footer}</View>
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
        <Text className="font-display text-lg font-semibold text-ink">{title}</Text>
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
