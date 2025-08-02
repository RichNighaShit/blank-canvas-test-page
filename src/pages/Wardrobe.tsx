import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import Button from '@/components/ui/Button';

const WardrobeScreen = () => {
  const [wardrobeItems, setWardrobeItems] = useState([]);

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission needed',
        'Sorry, we need camera roll permissions to add clothing items!',
      );
      return false;
    }
    return true;
  };

  const pickImage = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      // In a real app, you would upload this to your backend/Supabase
      const newItem = {
        id: Date.now().toString(),
        uri: result.assets[0].uri,
        category: 'Unategorized',
        name: 'New Item',
      };
      setWardrobeItems([...wardrobeItems, newItem]);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission needed',
        'Sorry, we need camera permissions to take photos!',
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      const newItem = {
        id: Date.now().toString(),
        uri: result.assets[0].uri,
        category: 'Uncategorized',
        name: 'New Item',
      };
      setWardrobeItems([...wardrobeItems, newItem]);
    }
  };

  const categories = [
    'All',
    'Tops',
    'Bottoms',
    'Dresses',
    'Outerwear',
    'Shoes',
    'Accessories',
  ];

  return (
    <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      {/* Header */}
      <LinearGradient
        colors={['#a855f7', '#ec4899']}
        style={{
          paddingTop: 60,
          paddingBottom: 20,
          paddingHorizontal: 20,
        }}
      >
        <Text
          style={{
            color: '#ffffff',
            fontSize: 28,
            fontWeight: '600',
            textAlign: 'center',
          }}
        >
          My Wardrobe
        </Text>
        <Text
          style={{
            color: '#f1f5f9',
            fontSize: 16,
            textAlign: 'center',
            marginTop: 4,
          }}
        >
          {wardrobeItems.length} items in your collection
        </Text>
      </LinearGradient>

      <ScrollView style={{ flex: 1 }}>
        {/* Add Items Section */}
        <View style={{ padding: 20 }}>
          <Text
            style={{
              fontSize: 20,
              fontWeight: '600',
              color: '#1e293b',
              marginBottom: 16,
            }}
          >
            Add New Items
          </Text>

          <View
            style={{
              flexDirection: 'row',
              gap: 12,
              marginBottom: 32,
            }}
          >
            <TouchableOpacity
              onPress={takePhoto}
              style={{
                flex: 1,
                backgroundColor: '#ffffff',
                borderRadius: 16,
                padding: 20,
                alignItems: 'center',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
                elevation: 3,
              }}
            >
              <Text style={{ fontSize: 32, marginBottom: 8 }}>📸</Text>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: '500',
                  color: '#1e293b',
                  textAlign: 'center',
                }}
              >
                Take Photo
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  color: '#64748b',
                  textAlign: 'center',
                  marginTop: 4,
                }}
              >
                Use camera
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={pickImage}
              style={{
                flex: 1,
                backgroundColor: '#ffffff',
                borderRadius: 16,
                padding: 20,
                alignItems: 'center',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
                elevation: 3,
              }}
            >
              <Text style={{ fontSize: 32, marginBottom: 8 }}>🖼️</Text>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: '500',
                  color: '#1e293b',
                  textAlign: 'center',
                }}
              >
                From Gallery
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  color: '#64748b',
                  textAlign: 'center',
                  marginTop: 4,
                }}
              >
                Choose existing
              </Text>
            </TouchableOpacity>
          </View>

          {/* Categories */}
          <Text
            style={{
              fontSize: 20,
              fontWeight: '600',
              color: '#1e293b',
              marginBottom: 16,
            }}
          >
            Categories
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginBottom: 24 }}
          >
            <View style={{ flexDirection: 'row', gap: 12 }}>
              {categories.map((category, index) => (
                <TouchableOpacity
                  key={index}
                  style={{
                    backgroundColor:
                      index === 0 ? '#a855f7' : 'rgba(255, 255, 255, 0.8)',
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 20,
                    borderWidth: index === 0 ? 0 : 1,
                    borderColor: '#e2e8f0',
                  }}
                >
                  <Text
                    style={{
                      color: index === 0 ? '#ffffff' : '#64748b',
                      fontSize: 14,
                      fontWeight: '500',
                    }}
                  >
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* Wardrobe Items */}
          {wardrobeItems.length === 0 ? (
            <View
              style={{
                backgroundColor: '#ffffff',
                borderRadius: 16,
                padding: 40,
                alignItems: 'center',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
                elevation: 3,
              }}
            >
              <Text style={{ fontSize: 64, marginBottom: 16 }}>👗</Text>
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: '500',
                  color: '#1e293b',
                  textAlign: 'center',
                  marginBottom: 8,
                }}
              >
                Your wardrobe is empty
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: '#64748b',
                  textAlign: 'center',
                  lineHeight: 20,
                }}
              >
                Start building your digital wardrobe by adding photos of your
                clothes. Our AI will help categorize and analyze them for you.
              </Text>
            </View>
          ) : (
            <View>
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: '600',
                  color: '#1e293b',
                  marginBottom: 16,
                }}
              >
                Your Items
              </Text>
              <FlatList
                data={wardrobeItems}
                numColumns={2}
                scrollEnabled={false}
                renderItem={({ item, index }) => (
                  <View
                    style={{
                      flex: 1,
                      margin: 8,
                      backgroundColor: '#ffffff',
                      borderRadius: 12,
                      overflow: 'hidden',
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.1,
                      shadowRadius: 8,
                      elevation: 3,
                    }}
                  >
                    <View
                      style={{
                        width: '100%',
                        aspectRatio: 1,
                        backgroundColor: '#f1f5f9',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text style={{ fontSize: 48 }}>👔</Text>
                    </View>
                    <View style={{ padding: 12 }}>
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: '500',
                          color: '#1e293b',
                        }}
                      >
                        {item.name}
                      </Text>
                      <Text
                        style={{
                          fontSize: 12,
                          color: '#64748b',
                          marginTop: 2,
                        }}
                      >
                        {item.category}
                      </Text>
                    </View>
                  </View>
                )}
                keyExtractor={(item) => item.id}
              />
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

export default WardrobeScreen;
