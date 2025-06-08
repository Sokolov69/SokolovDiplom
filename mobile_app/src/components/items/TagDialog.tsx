import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {CustomDialog, DialogContent, DialogActions, DialogButton} from '../common/CustomDialog';
import {CustomInput} from '../common/CustomInput';
import {Loading} from '../common/Loading';

interface TagDialogProps {
    visible: boolean;
    onDismiss: () => void;
    newTagName: string;
    setNewTagName: (value: string) => void;
    onAddTag: () => void;
    loading?: boolean;
    error?: string | null;
}

export const TagDialog: React.FC<TagDialogProps> = ({
                                                        visible,
                                                        onDismiss,
                                                        newTagName,
                                                        setNewTagName,
                                                        onAddTag,
                                                        loading = false,
                                                        error = null
                                                    }) => {
    // Для предотвращения изменений во время загрузки
    const handleTextChange = (text: string) => {
        if (!loading) {
            setNewTagName(text);
        }
    };

    // Функция для отмены, которая проверяет состояние загрузки
    const handleDismiss = () => {
        if (!loading) {
            onDismiss();
        }
    };

    // Функция для добавления тега, которая проверяет состояние загрузки
    const handleAdd = () => {
        if (!loading && newTagName.trim()) {
            onAddTag();
        }
    };

    return (
        <CustomDialog
            visible={visible}
            title="Добавить новый тег"
            onDismiss={handleDismiss}
            actions={
                <DialogActions>
                    <DialogButton
                        label="Отмена"
                        onPress={handleDismiss}
                    />
                    <DialogButton
                        label="Добавить"
                        onPress={handleAdd}
                        primary
                    />
                </DialogActions>
            }
        >
            <DialogContent>
                <CustomInput
                    label="Название тега"
                    value={newTagName}
                    onChangeText={handleTextChange}
                    placeholder="Введите название тега"
                    error={!!error}
                    helperText={error || ''}
                />

                {loading && (
                    <View style={styles.loadingContainer}>
                        <Loading size="small" text="Создание тега..."/>
                    </View>
                )}
            </DialogContent>
        </CustomDialog>
    );
};

const styles = StyleSheet.create({
    loadingContainer: {
        marginVertical: 10,
        alignItems: 'center'
    },
    errorText: {
        color: 'red',
        fontSize: 14,
        marginTop: 8
    }
}); 