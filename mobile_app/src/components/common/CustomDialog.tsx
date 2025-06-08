import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface CustomDialogProps {
  visible: boolean;
  title: string;
  onDismiss: () => void;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

export const CustomDialog: React.FC<CustomDialogProps> = ({
  visible,
  title,
  onDismiss,
  children,
  actions
}) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <View style={styles.overlay}>
        <View style={styles.dialogContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity onPress={onDismiss}>
              <Icon name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.content}>
            {children}
          </ScrollView>
          
          {actions && (
            <View style={styles.actions}>
              {actions}
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

// Дополнительные компоненты для упрощения использования
export const DialogActions: React.FC<{children: React.ReactNode}> = ({ children }) => (
  <View style={styles.actionButtons}>
    {children}
  </View>
);

export const DialogContent: React.FC<{children: React.ReactNode}> = ({ children }) => (
  <View style={styles.dialogContent}>
    {children}
  </View>
);

export const DialogButton: React.FC<{
  onPress: () => void;
  label: string;
  primary?: boolean;
}> = ({ onPress, label, primary = false }) => (
  <TouchableOpacity 
    style={[styles.button, primary && styles.primaryButton]}
    onPress={onPress}
  >
    <Text style={[styles.buttonText, primary && styles.primaryButtonText]}>
      {label}
    </Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 20,
  },
  dialogContainer: {
    width: '100%',
    maxWidth: 500,
    backgroundColor: 'white',
    borderRadius: 8,
    overflow: 'hidden',
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    padding: 16,
    maxHeight: 400,
  },
  dialogContent: {
    marginBottom: 16,
  },
  actions: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  button: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginLeft: 8,
  },
  primaryButton: {
    backgroundColor: '#1976d2',
    borderRadius: 4,
  },
  buttonText: {
    color: '#1976d2',
    fontWeight: 'bold',
    fontSize: 14,
  },
  primaryButtonText: {
    color: 'white',
  },
}); 