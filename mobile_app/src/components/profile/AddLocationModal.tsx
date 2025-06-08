import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Platform,
  ActivityIndicator,
  KeyboardAvoidingView,
  Alert,
  TouchableWithoutFeedback
} from 'react-native';
import { Button, Input, Switch } from '@rneui/themed';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { WebView } from 'react-native-webview';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { createLocation, updateLocation } from '../../features/profile/profileThunks';
import { CreateLocationData, UpdateLocationData, UserLocation } from '../../types/profile';

interface AddLocationModalProps {
  visible: boolean;
  onClose: () => void;
  editLocation?: UserLocation; // Опциональный параметр для редактирования существующей локации
}

// HTML для отображения карты Яндекса
const getMapHTML = (apiKey: string) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Яндекс Карты</title>
    <script src="https://api-maps.yandex.ru/2.1/?apikey=${apiKey}&lang=ru_RU" type="text/javascript"></script>
    <style>
        html, body, #map {
            width: 100%;
            height: 100%;
            margin: 0;
            padding: 0;
            touch-action: none;
            overflow: hidden;
        }
    </style>
    <script type="text/javascript">
        let map, placemark;
        
        // Вспомогательная функция для отправки сообщений в React Native
        function sendToReactNative(data) {
            if (window.ReactNativeWebView) {
                const jsonData = JSON.stringify(data);
                window.ReactNativeWebView.postMessage(jsonData);
            }
        }
        
        function init() {
            map = new ymaps.Map('map', {
                center: [55.76, 37.64],
                zoom: 10,
                controls: ['zoomControl', 'geolocationControl']
            });
            
            // Событие клика по карте
            map.events.add('click', function (e) {
                var coords = e.get('coords');
                createPlacemark(coords);
                getAddress(coords);
            });
            
            // Пытаемся определить местоположение пользователя
            ymaps.geolocation.get({
                provider: 'yandex',
                mapStateAutoApply: true
            }).then(function (result) {
                map.setCenter(result.geoObjects.position, 15);
            });
            
            // Добавляем поисковую строку
            var searchControl = new ymaps.control.SearchControl({
                options: {
                    provider: 'yandex#search',
                    size: 'large',
                    float: 'left',
                    floatIndex: 100
                }
            });
            map.controls.add(searchControl);
        }
        
        function createPlacemark(coords) {
            // Если метка уже создана, просто обновляем координаты
            if (placemark) {
                placemark.geometry.setCoordinates(coords);
            }
            // Если нет, создаем ее
            else {
                placemark = new ymaps.Placemark(coords, {
                    iconCaption: 'Загрузка...'
                }, {
                    preset: 'islands#redDotIconWithCaption',
                    draggable: true
                });
                map.geoObjects.add(placemark);
                
                // Обработка перетаскивания метки
                placemark.events.add('dragend', function () {
                    var newCoords = placemark.geometry.getCoordinates();
                    getAddress(newCoords);
                });
            }
        }
        
        function getAddress(coords) {
            placemark.properties.set('iconCaption', 'Загрузка...');
            
            ymaps.geocode(coords).then(function (res) {
                var firstGeoObject = res.geoObjects.get(0);
                
                if (firstGeoObject) {
                    var address = firstGeoObject.getAddressLine();
                    placemark.properties.set('iconCaption', address);
                    
                    // Формируем простую структуру данных для передачи
                    var data = {
                        lat: coords[0],
                        lon: coords[1],
                        address: address,
                        city: firstGeoObject.getLocalities()[0] || '',
                        region: firstGeoObject.getAdministrativeAreas()[0] || '',
                        country: firstGeoObject.getCountry() || '',
                        postalCode: ''
                    };
                    
                    // Пытаемся получить почтовый индекс, если он доступен
                    try {
                        if (firstGeoObject.properties && 
                            firstGeoObject.properties.get('metaDataProperty') && 
                            firstGeoObject.properties.get('metaDataProperty').GeocoderMetaData && 
                            firstGeoObject.properties.get('metaDataProperty').GeocoderMetaData.Address && 
                            firstGeoObject.properties.get('metaDataProperty').GeocoderMetaData.Address.postal_code) {
                            data.postalCode = firstGeoObject.properties.get('metaDataProperty').GeocoderMetaData.Address.postal_code;
                        }
                    } catch (err) {
                        // Игнорируем ошибку
                    }
                    
                    // Отправляем данные в React Native
                    sendToReactNative(data);
                }
            });
        }
        
        ymaps.ready(init);
    </script>
</head>
<body>
    <div id="map"></div>
</body>
</html>
`;

export const AddLocationModal: React.FC<AddLocationModalProps> = ({ visible, onClose, editLocation }) => {
  const dispatch = useAppDispatch();
  const { loading } = useAppSelector(state => state.profile);
  
  const [title, setTitle] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [region, setRegion] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('Россия');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [isPrimary, setIsPrimary] = useState(false);
  
  const [mapReady, setMapReady] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Яндекс API ключи
  const YANDEX_API_KEY = 'bef0b6db-3d2c-4f46-81ef-923e9d4fa5f6'; // JavaScript API и HTTP Геокодер
  const YANDEX_SUGGEST_API_KEY = '4fe6098e-7811-47c9-a021-5fb593f3986d'; // Для API Геосаджеста
  
  const handleMapMessage = (event: { nativeEvent: { data: string } }) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      if (data.lat && data.lon && data.address) {
        // Устанавливаем координаты и адрес
        setLatitude(data.lat);
        setLongitude(data.lon);
        setAddress(data.address);
        
        // Устанавливаем остальные данные если они доступны
        if (data.city) setCity(data.city);
        if (data.region) setRegion(data.region);
        if (data.country) setCountry(data.country);
        if (data.postalCode) setPostalCode(data.postalCode);
      }
    } catch (error) {
      console.error('Ошибка при обработке сообщения от карты:', error);
    }
  };
  
  // Заполняем форму данными редактируемой локации
  useEffect(() => {
    if (editLocation && visible) {
      setTitle(editLocation.title || '');
      setAddress(editLocation.address || '');
      setCity(editLocation.city || '');
      setRegion(editLocation.region || '');
      setPostalCode(editLocation.postal_code || '');
      setCountry(editLocation.country || 'Россия');
      setLatitude(editLocation.latitude || null);
      setLongitude(editLocation.longitude || null);
      setIsPrimary(editLocation.is_primary || false);
      setIsEditing(true);
    } else if (visible) {
      setIsEditing(false);
    }
  }, [editLocation, visible]);
  
  const handleSave = async () => {
    if (!title) {
      Alert.alert('Ошибка', 'Пожалуйста, укажите название адреса');
      return;
    }
    
    if (!address || !city || !region || !country) {
      Alert.alert('Ошибка', 'Пожалуйста, выберите адрес на карте');
      return;
    }
    
    if (latitude === null || longitude === null) {
      Alert.alert('Ошибка', 'Не удалось определить координаты. Пожалуйста, выберите точку на карте.');
      return;
    }
    
    // Округляем координаты до 6 знаков после запятой, чтобы не превысить лимит на сервере
    const roundedLatitude = parseFloat(latitude.toFixed(6));
    const roundedLongitude = parseFloat(longitude.toFixed(6));
    
    if (isEditing && editLocation) {
      // Обновляем существующую локацию
      const locationData: UpdateLocationData = {
        title,
        address,
        city,
        region,
        postal_code: postalCode,
        country,
        latitude: roundedLatitude,
        longitude: roundedLongitude,
        is_primary: isPrimary
      };
      
      const result = await dispatch(updateLocation({
        id: editLocation.id,
        data: locationData
      }));
      
      if (updateLocation.fulfilled.match(result)) {
        Alert.alert('Успешно', 'Адрес успешно обновлен');
        handleClose();
      } else if (updateLocation.rejected.match(result) && result.payload) {
        Alert.alert('Ошибка', `Не удалось обновить адрес: ${result.payload}`);
      }
    } else {
      // Создаем новую локацию
      const locationData: CreateLocationData = {
        title,
        address,
        city,
        region,
        postal_code: postalCode,
        country,
        latitude: roundedLatitude,
        longitude: roundedLongitude,
        is_primary: isPrimary
      };
      
      const result = await dispatch(createLocation(locationData));
      
      if (createLocation.fulfilled.match(result)) {
        Alert.alert('Успешно', 'Адрес успешно добавлен');
        handleClose();
      } else if (createLocation.rejected.match(result) && result.payload) {
        Alert.alert('Ошибка', `Не удалось сохранить адрес: ${result.payload}`);
      }
    }
  };
  
  const handleClose = () => {
    setTitle('');
    setAddress('');
    setCity('');
    setRegion('');
    setPostalCode('');
    setCountry('Россия');
    setLatitude(null);
    setLongitude(null);
    setIsPrimary(false);
    setIsEditing(false);
    onClose();
  };
  
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
    >
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {isEditing ? 'Редактирование адреса' : 'Добавление нового адреса'}
          </Text>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Icon name="close" size={24} color="#000" />
          </TouchableOpacity>
        </View>
        
        <Text style={[styles.mapLabel, { marginHorizontal: 15, marginTop: 10 }]}>
          {isEditing ? 'Редактировать адрес на карте' : 'Выберите адрес на карте'}
        </Text>
        <View style={styles.mapContainer} onTouchStart={(e) => e.stopPropagation()}>
          {!mapReady && (
            <View style={styles.mapLoadingContainer}>
              <ActivityIndicator size="large" color="#1976d2" />
              <Text style={styles.mapLoadingText}>Загрузка карты...</Text>
            </View>
          )}
          
          <View style={styles.mapWrapper}>
            <TouchableWithoutFeedback>
              <WebView
                source={{ html: getMapHTML(YANDEX_API_KEY) }}
                style={styles.map}
                onMessage={handleMapMessage}
                onLoad={() => setMapReady(true)}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                bounces={false}
                scrollEnabled={false}
                nestedScrollEnabled={false}
                showsHorizontalScrollIndicator={false}
                showsVerticalScrollIndicator={false}
                onTouchStart={(e) => e.stopPropagation()}
                onTouchMove={(e) => e.stopPropagation()}
                onTouchEnd={(e) => e.stopPropagation()}
                startInLoadingState={true}
                originWhitelist={['*']}
                scalesPageToFit={false}
                allowsInlineMediaPlayback={true}
                overScrollMode="never"
              />
            </TouchableWithoutFeedback>
          </View>
        </View>
        
        <ScrollView style={styles.formContainer}>
          <Input
            label="Название адреса"
            placeholder="Например: Дом, Работа"
            value={title}
            onChangeText={setTitle}
            leftIcon={<Icon name="bookmark" size={20} color="#1976d2" />}
            containerStyle={styles.inputContainer}
          />
          
          <Input
            label="Адрес"
            value={address}
            onChangeText={setAddress}
            leftIcon={<Icon name="location-on" size={20} color="#1976d2" />}
            containerStyle={styles.inputContainer}
            disabled
          />
          
          <View style={styles.rowContainer}>
            <Input
              label="Город"
              value={city}
              onChangeText={setCity}
              containerStyle={[styles.inputContainer, styles.halfInput]}
            />
            
            <Input
              label="Регион"
              value={region}
              onChangeText={setRegion}
              containerStyle={[styles.inputContainer, styles.halfInput]}
            />
          </View>
          
          <View style={styles.rowContainer}>
            <Input
              label="Почтовый индекс"
              value={postalCode}
              onChangeText={setPostalCode}
              containerStyle={[styles.inputContainer, styles.halfInput]}
              keyboardType="number-pad"
            />
            
            <Input
              label="Страна"
              value={country}
              onChangeText={setCountry}
              containerStyle={[styles.inputContainer, styles.halfInput]}
            />
          </View>
          
          <View style={styles.primaryContainer}>
            <Text style={styles.primaryLabel}>Сделать основным адресом</Text>
            <Switch
              value={isPrimary}
              onValueChange={setIsPrimary}
              color="#1976d2"
            />
          </View>
          
          <View style={styles.coordinates}>
            <Text style={styles.coordinatesText}>
              Координаты: {latitude !== null && longitude !== null 
                ? `${latitude.toFixed(6)}, ${longitude.toFixed(6)}` 
                : 'Не выбраны'}
            </Text>
          </View>
          
          <Button
            title={isEditing ? "Сохранить изменения" : "Сохранить адрес"}
            onPress={handleSave}
            buttonStyle={styles.saveButton}
            disabled={loading || !address || latitude === null || longitude === null}
            loading={loading}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 5,
  },
  formContainer: {
    flex: 1,
    padding: 15,
  },
  inputContainer: {
    marginBottom: 15,
  },
  mapLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  mapContainer: {
    height: 250,
    borderRadius: 8,
    overflow: 'hidden',
    marginHorizontal: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  mapWrapper: {
    flex: 1,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
  mapLoadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    zIndex: 1,
  },
  mapLoadingText: {
    marginTop: 10,
    color: '#1976d2',
  },
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    width: '48%',
  },
  primaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 15,
    paddingHorizontal: 10,
  },
  primaryLabel: {
    fontSize: 16,
  },
  coordinates: {
    backgroundColor: '#f5f5f5',
    padding: 10,
    borderRadius: 5,
    marginBottom: 20,
  },
  coordinatesText: {
    fontSize: 14,
    color: '#555',
  },
  saveButton: {
    backgroundColor: '#1976d2',
    borderRadius: 5,
    marginBottom: 30,
  },
}); 