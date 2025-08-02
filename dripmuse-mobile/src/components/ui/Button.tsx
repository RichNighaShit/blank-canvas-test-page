import React from 'react';
import {
  TouchableOpacity,
  Text,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
  View,
} from 'react-native';

export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'default',
  size = 'default',
  disabled = false,
  loading = false,
  style,
  textStyle,
}) => {
  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 8,
      flexDirection: 'row',
    };

    // Size styles
    const sizeStyles: Record<string, ViewStyle> = {
      default: { paddingHorizontal: 16, paddingVertical: 12 },
      sm: { paddingHorizontal: 12, paddingVertical: 8 },
      lg: { paddingHorizontal: 32, paddingVertical: 16 },
      icon: { width: 40, height: 40, paddingHorizontal: 0, paddingVertical: 0 },
    };

    // Variant styles
    const variantStyles: Record<string, ViewStyle> = {
      default: { backgroundColor: '#8b5cf6' },
      destructive: { backgroundColor: '#ef4444' },
      outline: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#d1d5db' },
      secondary: { backgroundColor: '#f1f5f9' },
      ghost: { backgroundColor: 'transparent' },
      link: { backgroundColor: 'transparent' },
    };

    if (disabled) {
      return {
        ...baseStyle,
        ...sizeStyles[size],
        backgroundColor: '#9ca3af',
      };
    }

    return {
      ...baseStyle,
      ...sizeStyles[size],
      ...variantStyles[variant],
    };
  };

  const getTextStyle = (): TextStyle => {
    const baseStyle: TextStyle = {
      fontSize: 16,
      fontWeight: '600',
    };

    // Size styles
    const sizeStyles: Record<string, TextStyle> = {
      default: { fontSize: 16 },
      sm: { fontSize: 14 },
      lg: { fontSize: 18 },
      icon: { fontSize: 16 },
    };

    // Variant styles
    const variantStyles: Record<string, TextStyle> = {
      default: { color: '#ffffff' },
      destructive: { color: '#ffffff' },
      outline: { color: '#374151' },
      secondary: { color: '#1f2937' },
      ghost: { color: '#374151' },
      link: { color: '#8b5cf6', textDecorationLine: 'underline' },
    };

    if (disabled) {
      return {
        ...baseStyle,
        ...sizeStyles[size],
        color: '#ffffff',
      };
    }

    return {
      ...baseStyle,
      ...sizeStyles[size],
      ...variantStyles[variant],
    };
  };

  return (
    <TouchableOpacity
      style={[getButtonStyle(), style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <ActivityIndicator size="small" color={variant === 'default' || variant === 'destructive' ? '#ffffff' : '#8b5cf6'} />
          <Text style={[getTextStyle(), { marginLeft: 8 }, textStyle]}>{title}</Text>
        </View>
      ) : (
        <Text style={[getTextStyle(), textStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

export default Button;
