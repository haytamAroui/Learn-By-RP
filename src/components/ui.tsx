import React, { useRef } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

const VARIANT_CONTAINER: Record<ButtonVariant, string> = {
  primary: 'bg-primary border border-transparent',
  secondary: 'bg-surface border border-border-subtle',
  ghost: 'bg-transparent border border-transparent',
  danger: 'bg-red-500/10 border border-red-500/40',
};

const VARIANT_LABEL: Record<ButtonVariant, string> = {
  primary: 'text-white',
  secondary: 'text-ink',
  ghost: 'text-primary',
  danger: 'text-red-500',
};

const SIZE_CONTAINER: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 rounded-lg',
  md: 'px-4 py-2.5 rounded-xl',
  lg: 'px-5 py-3.5 rounded-2xl',
};

const SIZE_LABEL: Record<ButtonSize, string> = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
};

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  textClassName?: string;
  icon?: React.ReactNode;
  accessibilityLabel?: string;
  testID?: string;
}

export const Button: React.FC<ButtonProps> = ({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  className = '',
  textClassName = '',
  icon,
  accessibilityLabel,
  testID,
}) => {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      testID={testID}
      className={`flex-row items-center justify-center gap-2 ${VARIANT_CONTAINER[variant]} ${SIZE_CONTAINER[size]} ${
        isDisabled ? 'opacity-40' : 'active:opacity-80'
      } ${className}`}
    >
      {loading ? (
        <ActivityIndicator size="small" color={variant === 'primary' ? '#ffffff' : undefined} />
      ) : (
        icon
      )}
      <Text className={`font-semibold ${VARIANT_LABEL[variant]} ${SIZE_LABEL[size]} ${textClassName}`}>
        {label}
      </Text>
    </Pressable>
  );
};

interface CardProps {
  children: React.ReactNode;
  className?: string;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  testID?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '', style, onPress, testID }) => {
  const base = `rounded-2xl border border-border-subtle bg-surface p-4 ${className}`;

  if (!onPress) {
    return (
      <View className={base} style={style} testID={testID}>
        {children}
      </View>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      testID={testID}
      className={`${base} active:opacity-85`}
      style={style}
    >
      {children}
    </Pressable>
  );
};

type PillTone = 'neutral' | 'primary' | 'warm' | 'sky' | 'sage' | 'heather' | 'danger';

const PILL_TONE: Record<PillTone, string> = {
  neutral: 'bg-surface-sunken border-border-subtle text-muted',
  primary: 'bg-primary/10 border-primary/30 text-primary',
  warm: 'bg-card-warm border-primary/15 text-primary-dark dark:text-primary',
  sky: 'bg-card-sky border-accent-sky/30 text-accent-sky',
  sage: 'bg-card-sage border-accent-sage/30 text-accent-sage',
  heather: 'bg-card-heather border-accent-sky/20 text-body',
  danger: 'bg-red-500/10 border-red-500/30 text-red-500',
};

interface PillProps {
  label: string;
  tone?: PillTone;
  className?: string;
  icon?: React.ReactNode;
  onPress?: () => void;
  accessibilityLabel?: string;
}

export const Pill: React.FC<PillProps> = ({
  label,
  tone = 'neutral',
  className = '',
  icon,
  onPress,
  accessibilityLabel,
}) => {
  const content = (
    <View
      className={`flex-row items-center gap-1.5 self-start rounded-full border px-2.5 py-1 ${PILL_TONE[tone]} ${className}`}
    >
      {icon}
      <Text className="text-xs font-semibold">{label}</Text>
    </View>
  );

  if (!onPress) return content;

  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={accessibilityLabel ?? label}>
      {content}
    </Pressable>
  );
};

interface FieldProps extends TextInputProps {
  label?: string;
  containerClassName?: string;
}

export const Field: React.FC<FieldProps> = ({
  label,
  containerClassName = '',
  className = '',
  multiline,
  ...inputProps
}) => {
  const inputRef = useRef<TextInput>(null);

  return (
    <View className={`gap-1.5 ${containerClassName}`}>
      {label ? (
        <Text className="text-xs font-bold uppercase tracking-wider text-muted">{label}</Text>
      ) : null}
      <TextInput
        ref={inputRef}
        multiline={multiline}
        placeholderTextColor="rgb(var(--color-muted))"
        className={`rounded-xl border border-border-subtle bg-surface-sunken px-4 py-2.5 text-sm text-ink ${
          multiline ? 'min-h-[88px] text-left' : ''
        } ${className}`}
        {...inputProps}
      />
    </View>
  );
};

interface SegmentedProps<T extends string> {
  options: Array<{ id: T; label: string; icon?: React.ReactNode }>;
  value: T;
  onChange: (id: T) => void;
  className?: string;
  accessibilityLabel?: string;
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  className = '',
  accessibilityLabel,
}: SegmentedProps<T>) {
  return (
    <View
      accessibilityRole="tablist"
      accessibilityLabel={accessibilityLabel}
      className={`flex-row items-center rounded-xl border border-border-subtle bg-surface-sunken p-1 ${className}`}
    >
      {options.map(option => {
        const isActive = option.id === value;
        return (
          <Pressable
            key={option.id}
            onPress={() => onChange(option.id)}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            className={`flex-1 flex-row items-center justify-center gap-1.5 rounded-lg px-2.5 py-1.5 ${
              isActive ? 'bg-surface' : ''
            }`}
          >
            {option.icon}
            <Text
              className={`text-xs ${isActive ? 'font-semibold text-ink' : 'font-medium text-muted'}`}
              numberOfLines={1}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

interface ChipRowProps {
  options: Array<{ id: string; label: string }>;
  value: string;
  onChange: (id: string) => void;
  className?: string;
  scrollable?: boolean;
}

export const ChipRow: React.FC<ChipRowProps> = ({
  options,
  value,
  onChange,
  className = '',
  scrollable = false,
}) => (
  <View
    className={`flex-row gap-1 rounded-xl border border-border-subtle bg-surface-sunken p-1 ${
      scrollable ? '' : 'flex-wrap'
    } ${className}`}
  >
    {options.map(option => {
      const isActive = option.id === value;
      return (
        <Pressable
          key={option.id}
          onPress={() => onChange(option.id)}
          accessibilityRole="button"
          accessibilityState={{ selected: isActive }}
          className={`rounded-lg px-3 py-1.5 ${isActive ? 'bg-surface' : ''} ${
            scrollable ? 'shrink-0' : ''
          }`}
        >
          <Text
            className={`text-xs ${isActive ? 'font-semibold text-ink' : 'font-medium text-muted'}`}
            numberOfLines={1}
          >
            {option.label}
          </Text>
        </Pressable>
      );
    })}
  </View>
);

export const Divider: React.FC<{ className?: string }> = ({ className = '' }) => (
  <View className={`h-px bg-border-subtle ${className}`} />
);

export const SectionLabel: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => (
  <Text className={`text-xs font-semibold uppercase tracking-wider text-muted ${className}`}>
    {children}
  </Text>
);

export const EmptyState: React.FC<{ message: string; className?: string }> = ({
  message,
  className = '',
}) => (
  <View
    className={`items-center justify-center rounded-2xl border border-dashed border-border-subtle px-6 py-10 ${className}`}
  >
    <Text className="text-center text-sm text-muted">{message}</Text>
  </View>
);
