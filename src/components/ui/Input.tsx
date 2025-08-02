import React from 'react';
import {
  TextInput,
  View,
  Text,
  TextInputProps,
  ViewStyle,
  TextStyle,
} from 'react-native';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  labelStyle?: TextStyle;
  errorStyle?: TextStyle;
}

const Input: React.FC<InputProps> = ({
  label,
  error,
  containerStyle,
  inputStyle,
  labelStyle,
  errorStyle,
  ...textInputProps
}) => {
  const getInputStyle = (): TextStyle => {
    const baseStyle: TextStyle = {
      borderWidth: 1,
      borderColor: error ? '#ef4444' : '#d1d5db',
      borderRadius: 8,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 16,
      backgroundColor: '#ffffff',
    };

    return baseStyle;
  };

  return (
    <View style={[{ marginVertical: 8 }, containerStyle]}>
      {label && (
        <Text
          style={[
            {
              fontSize: 16,
              fontWeight: '500',
              marginBottom: 4,
              color: '#374151',
            },
            labelStyle,
          ]}
        >
          {label}
        </Text>
      )}
      <TextInput
        style={[getInputStyle(), inputStyle]}
        placeholderTextColor="#9ca3af"
        {...textInputProps}
      />
      {error && (
        <Text
          style={[
            {
              fontSize: 14,
              color: '#ef4444',
              marginTop: 4,
            },
            errorStyle,
          ]}
        >
          {error}
        </Text>
      )}
    </View>
  );
};

export default Input;
