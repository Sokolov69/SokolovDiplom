import React from 'react';
import {View, Text, StyleSheet, ScrollView} from 'react-native';
import {CustomButton} from '../common/CustomButton';
import {CustomTag} from '../common/CustomTag';
import {ItemTag} from '../../types/item';

interface ItemTagsSectionProps {
    selectedTags: string[];
    tags: ItemTag[];
    onOpenTagsDialog: () => void;
    onRemoveTag: (tagId: number) => void;
}

const ItemTagsSection: React.FC<ItemTagsSectionProps> = ({
                                                             selectedTags,
                                                             tags,
                                                             onOpenTagsDialog,
                                                             onRemoveTag
                                                         }) => {
    // Получаем объекты тегов по их ID
    const selectedTagObjects = selectedTags
        .map(tagId => tags.find(tag => tag.id.toString() === tagId))
        .filter(tag => tag !== undefined) as ItemTag[];

    return (
        <View style={styles.container}>
            <View style={styles.headerContainer}>
                <Text style={styles.title}>Теги</Text>
                {selectedTagObjects.length > 0 && (
                    <Text style={styles.tagCount}>
                        Выбрано: {selectedTagObjects.length}
                    </Text>
                )}
            </View>

            {selectedTagObjects.length > 0 ? (
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.tagsScrollContainer}
                    contentContainerStyle={styles.tagsContainer}
                >
                    {selectedTagObjects.map(tag => (
                        <CustomTag
                            key={tag.id}
                            label={tag.name}
                            onPress={() => onRemoveTag(tag.id)}
                            selected={true}
                            style={styles.tag}
                        />
                    ))}
                </ScrollView>
            ) : (
                <Text style={styles.noTagsText}>Теги не выбраны</Text>
            )}

            <CustomButton
                mode="outlined"
                label={selectedTagObjects.length > 0 ? "Изменить теги" : "Добавить теги"}
                onPress={onOpenTagsDialog}
                style={styles.addButton}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 24,
    },
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    tagCount: {
        fontSize: 14,
        color: '#666',
    },
    tagsScrollContainer: {
        maxHeight: 50,
        marginBottom: 12,
    },
    tagsContainer: {
        flexDirection: 'row',
        paddingVertical: 4,
    },
    tag: {
        marginRight: 8,
    },
    noTagsText: {
        color: '#888',
        marginBottom: 12,
        fontStyle: 'italic',
    },
    addButton: {
        marginTop: 8,
    }
});

export default ItemTagsSection; 