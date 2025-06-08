import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface CustomButtonProps {
  label: string;
  onPress: () => void;
  mode?: 'contained' | 'outlined' | 'text';
  loading?: boolean;
  disabled?: boolean;
  style?: object;
  icon?: string;
}

export const CustomButton: React.FC<CustomButtonProps> = ({
  label,
  onPress,
  mode = 'contained',
  loading = false,
  disabled = false,
  style,
  icon
}) => {
  const getButtonStyle = () => {
    if (mode === 'contained') {
      return [styles.button, styles.containedButton, disabled && styles.buttonDisabled, style];
    } else if (mode === 'outlined') {
      return [styles.button, styles.outlinedButton, disabled && styles.outlinedButtonDisabled, style];
    } else {
      return [styles.button, styles.textButton, disabled && styles.textButtonDisabled, style];
    }
  };

  const getTextStyle = () => {
    if (mode === 'contained') {
      return styles.containedButtonText;
    } else if (mode === 'outlined') {
      return [styles.outlinedButtonText, disabled && styles.outlinedButtonTextDisabled];
    } else {
      return [styles.textButtonText, disabled && styles.textButtonTextDisabled];
    }
  };

  const getIconColor = () => {
    if (disabled) {
      return '#999';
    }
    return mode === 'contained' ? 'white' : '#1976d2';
  };

  return (
    <TouchableOpacity
      style={getButtonStyle()}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator color={mode === 'contained' ? 'white' : '#1976d2'} size="small" />
      ) : (
        <View style={styles.buttonContent}>
          {icon && (
            <Icon 
              name={icon} 
              size={18} 
              color={getIconColor()} 
              style={styles.buttonIcon}
            />
          )}
          <Text style={getTextStyle()}>{label}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    padding: 12,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonIcon: {
    marginRight: 8,
  },
  containedButton: {
    backgroundColor: '#1976d2',
  },
  outlinedButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#1976d2',
  },
  textButton: {
    backgroundColor: 'transparent',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  outlinedButtonDisabled: {
    borderColor: '#ccc',
  },
  textButtonDisabled: {
    opacity: 0.5,
  },
  containedButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  outlinedButtonText: {
    color: '#1976d2',
    fontSize: 16,
    fontWeight: 'bold',
  },
  outlinedButtonTextDisabled: {
    color: '#999',
  },
  textButtonText: {
    color: '#1976d2',
    fontSize: 16,
    fontWeight: 'bold',
  },
  textButtonTextDisabled: {
    color: '#999',
  },
}); 