import React, {useState} from 'react';
import {View, Text, StyleSheet, FlatList} from 'react-native';
import {CustomDialog, DialogContent, DialogActions, DialogButton} from '../common/CustomDialog';
import {CustomInput} from '../common/CustomInput';
import {CustomButton} from '../common/CustomButton';
import {CustomTag} from '../common/CustomTag';
import {ItemTag} from '../../types/item';
import {Loading} from '../common/Loading';

interface TagsSelectDialogProps {
    visible: boolean;
    onDismiss: () => void;
    tags: ItemTag[];
    selectedTags: string[];
    onToggleTag: (tagId: number) => void;
    onAddNewTagPress: () => void;
    searchText: string;
    onSearchTextChange: (text: string) => void;
    loading: boolean;
}

export const TagsSelectDialog: React.FC<TagsSelectDialogProps> = ({
                                                                      visible,
                                                                      onDismiss,
                                                                      tags,
                                                                      selectedTags,
                                                                      onToggleTag,
                                                                      onAddNewTagPress,
                                                                      searchText,
                                                                      onSearchTextChange,
                                                                      loading = false
                                                                  }) => {
    // Фильтрация тегов на основе поискового запроса
    const filteredTags = searchText.trim() === ''
        ? tags
        : tags.filter(tag => tag.name.toLowerCase().includes(searchText.toLowerCase()));

    // Рендер элемента тега
    const renderTagItem = ({item}: { item: ItemTag }) => (
        <CustomTag
            key={item.id}
            label={item.name}
            onPress={() => onToggleTag(item.id)}
            selected={selectedTags.includes(item.id.toString())}
            style={styles.tag}
        />
    );

    return (
        <CustomDialog
            visible={visible}
            title="Выбор тегов"
            onDismiss={onDismiss}
            actions={
                <DialogActions>
                    <DialogButton
                        label="Закрыть"
                        onPress={onDismiss}
                    />
                </DialogActions>
            }
        >
            <DialogContent>
                <View style={styles.searchContainer}>
                    <CustomInput
                        label="Поиск тегов"
                        value={searchText}
                        onChangeText={onSearchTextChange}
                        placeholder="Поиск тегов"
                    />

                    <CustomButton
                        mode="outlined"
                        label="Создать тег"
                        onPress={onAddNewTagPress}
                        style={styles.createButton}
                    />
                </View>

                {loading ? (
                    <Loading text="Загрузка тегов..."/>
                ) : (
                    <>
                        <Text style={styles.selectedCount}>
                            Выбрано: {selectedTags.length} тегов
                        </Text>

                        <View style={styles.tagsContainer}>
                            {filteredTags.length > 0 ? (
                                <FlatList
                                    data={filteredTags}
                                    renderItem={renderTagItem}
                                    keyExtractor={(item) => item.id.toString()}
                                    numColumns={2}
                                    contentContainerStyle={styles.tagsList}
                                />
                            ) : (
                                <Text style={styles.noTagsText}>
                                    {searchText.trim() !== ''
                                        ? 'Нет тегов по вашему запросу'
                                        : 'Нет доступных тегов'}
                                </Text>
                            )}
                        </View>
                    </>
                )}
            </DialogContent>
        </CustomDialog>
    );
};

const styles = StyleSheet.create({
    searchContainer: {
        marginBottom: 16,
    },
    createButton: {
        marginTop: 8,
    },
    selectedCount: {
        fontSize: 14,
        marginBottom: 8,
        color: '#666',
    },
    tagsContainer: {
        minHeight: 200,
        maxHeight: 300,
    },
    tagsList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    tag: {
        margin: 4,
        flexGrow: 0,
    },
    noTagsText: {
        textAlign: 'center',
        marginTop: 20,
        color: '#888',
    },
}); 