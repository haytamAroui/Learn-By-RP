import React, { useRef } from 'react';
import {
  ActivityIndicator,
  Pressable,
  Platform,
  StyleProp,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';
import { Text } from './AppText';
import { iconColor } from '../design/iconColor';
import { ELEVATION, RADIUS } from '../design/tokens';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

const VARIANT_CONTAINER: Record<ButtonVariant, string> = {
  primary:
    'border-2 border-transparent bg-action hover:bg-action-hover active:bg-action-pressed focus:border-brand-on',
  secondary:
    'border border-border-interactive bg-surface hover:bg-surface-hover active:opacity-80 focus:border-2 focus:border-focus',
  ghost:
    'border border-transparent bg-transparent hover:bg-surface-hover active:opacity-80 focus:border-2 focus:border-focus',
  danger:
    'border border-danger/40 bg-danger-soft hover:opacity-90 active:opacity-75 focus:border-2 focus:border-focus',
};

const VARIANT_LABEL: Record<ButtonVariant, string> = {
  primary: 'text-action-text',
  secondary: 'text-ink',
  ghost: 'text-primary',
  danger: 'text-danger',
};

const SIZE_CONTAINER: Record<ButtonSize, string> = {
  sm: 'min-h-12 px-3 rounded-2xl',
  md: 'min-h-12 px-4 rounded-full',
  lg: 'min-h-14 px-5 rounded-full',
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
      style={variant === 'primary' ? { boxShadow: ELEVATION.card } : undefined}
      className={`flex-row items-center justify-center gap-2 ${VARIANT_CONTAINER[variant]} ${SIZE_CONTAINER[size]} ${
        isDisabled ? 'opacity-40' : ''
      } ${className}`}
    >
      {loading ? (
        <ActivityIndicator size="small" color={variant === 'primary' ? iconColor('brandText') : undefined} />
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
  const base = `border border-border-subtle/60 bg-surface p-4 ${className}`;
  const cardStyle: StyleProp<ViewStyle> = [{ borderRadius: RADIUS.card, boxShadow: ELEVATION.card }, style];

  if (!onPress) {
    return (
      <View className={base} style={cardStyle} testID={testID}>
        {children}
      </View>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      testID={testID}
      className={`${base} min-h-12 hover:bg-surface-hover active:opacity-85 focus:border-2 focus:border-focus`}
      style={cardStyle}
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
  danger: 'bg-danger-soft border-danger/30 text-danger',
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
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={accessibilityLabel ?? label} className="min-h-12 justify-center rounded-full focus:border-2 focus:border-focus">
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
        placeholderTextColor={iconColor('muted')}
        className={`min-h-12 rounded-xl border border-border-interactive bg-surface px-4 py-2.5 text-sm text-ink hover:bg-surface-hover focus:border-2 focus:border-focus ${
          multiline ? 'min-h-[88px] text-left' : ''
        } ${className}`}
        {...inputProps}
        style={[{ fontFamily: Platform.OS === "web" ? "Figtree, system-ui, sans-serif" : undefined }, inputProps.style]}
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
      className={`flex-row items-center rounded-[24px] border border-border-subtle/60 bg-surface-soft p-1 ${className}`}
    >
      {options.map(option => {
        const isActive = option.id === value;
        return (
          <Pressable
            key={option.id}
            onPress={() => onChange(option.id)}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            className={`min-h-12 flex-1 flex-row items-center justify-center gap-1.5 rounded-lg px-2.5 focus:border-2 focus:border-focus ${
              isActive ? 'bg-surface' : ''
            }`}
          >
            {option.icon}
            <Text
              className={`text-xs ${isActive ? 'font-semibold text-ink' : 'font-medium text-muted'}`}
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
    className={`flex-row gap-1 rounded-[24px] border border-border-subtle/60 bg-surface-soft p-1 ${
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
          className={`min-h-12 justify-center rounded-full border px-3 focus:border-2 focus:border-focus ${isActive ? 'border-language/30 bg-language-soft' : 'border-transparent'} ${
            scrollable ? 'shrink-0' : ''
          }`}
        >
          <Text
            className={`text-xs ${isActive ? 'font-semibold text-ink' : 'font-medium text-muted'}`}
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
