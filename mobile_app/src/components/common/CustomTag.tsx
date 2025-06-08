import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

interface CustomTagProps {
  label: string;
  onPress: () => void;
  selected?: boolean;
  style?: object;
}

export const CustomTag: React.FC<CustomTagProps> = ({
  label,
  onPress,
  selected = false,
  style
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.tagContainer,
        selected && styles.selectedTag,
        style
      ]}
      onPress={onPress}
    >
      <Text style={styles.tagText}>{label}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  tagContainer: {
    backgroundColor: '#f0f0f0',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    margin: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedTag: {
    backgroundColor: '#e0e0e0',
    borderWidth: 1,
    borderColor: '#1976d2',
  },
  tagText: {
    fontSize: 14,
    color: '#333',
  },
}); 