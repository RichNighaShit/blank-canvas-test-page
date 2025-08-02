import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@/hooks/useAuth';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

const EditProfileScreen = () => {
  const { user, signOut } = useAuth();
  const [fullName, setFullName] = useState('');
  const [avatarUri, setAvatarUri] = useState(null);
  const [colorPalette, setColorPalette] = useState('');

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission needed',
        'Sorry, we need camera roll permissions to update your avatar!',
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  const saveProfile = async () => {
    // In a real app, you would save this to Supabase
    Alert.alert('Success', 'Profile updated successfully!');
  };

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      Alert.alert('Error', error.message);
    }
  };

  const colorPalettes = [
    { name: 'Spring', colors: ['#FFB6C1', '#98FB98', '#FFE4E1', '#F0E68C'] },
    { name: 'Summer', colors: ['#87CEEB', '#DDA0DD', '#F0F8FF', '#E6E6FA'] },
    { name: 'Autumn', colors: ['#D2691E', '#8B4513', '#CD853F', '#F4A460'] },
    { name: 'Winter', colors: ['#000080', '#8B0000', '#2F4F4F', '#483D8B'] },
  ];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
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
          Profile
        </Text>
      </LinearGradient>

      <View style={{ padding: 20 }}>
        {/* Avatar Section */}
        <View
          style={{
            alignItems: 'center',
            marginBottom: 32,
          }}
        >
          <TouchableOpacity
            onPress={pickImage}
            style={{
              width: 120,
              height: 120,
              borderRadius: 60,
              backgroundColor: avatarUri ? 'transparent' : 'rgba(168, 85, 247, 0.1)',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
              borderWidth: 3,
              borderColor: '#a855f7',
            }}
          >
            {avatarUri ? (
              <Text style={{ fontSize: 64 }}>👤</Text>
            ) : (
              <Text style={{ fontSize: 48 }}>📸</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={pickImage}>
            <Text
              style={{
                color: '#a855f7',
                fontSize: 16,
                fontWeight: '500',
              }}
            >
              Change Avatar
            </Text>
          </TouchableOpacity>
        </View>

        {/* Profile Information */}
        <View
          style={{
            backgroundColor: '#ffffff',
            borderRadius: 16,
            padding: 20,
            marginBottom: 24,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 3,
          }}
        >
          <Text
            style={{
              fontSize: 20,
              fontWeight: '600',
              color: '#1e293b',
              marginBottom: 16,
            }}
          >
            Personal Information
          </Text>

          <Input
            label="Full Name"
            value={fullName}
            onChangeText={setFullName}
            placeholder="Enter your full name"
          />

          <View style={{ marginTop: 16 }}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: '500',
                color: '#374151',
                marginBottom: 4,
              }}
            >
              Email
            </Text>
            <View
              style={{
                borderWidth: 1,
                borderColor: '#d1d5db',
                borderRadius: 8,
                paddingHorizontal: 16,
                paddingVertical: 12,
                backgroundColor: '#f9fafb',
              }}
            >
              <Text style={{ fontSize: 16, color: '#6b7280' }}>
                {user?.email || 'No email'}
              </Text>
            </View>
          </View>
        </View>

        {/* Color Palette Section */}
        <View
          style={{
            backgroundColor: '#ffffff',
            borderRadius: 16,
            padding: 20,
            marginBottom: 24,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 3,
          }}
        >
          <Text
            style={{
              fontSize: 20,
              fontWeight: '600',
              color: '#1e293b',
              marginBottom: 16,
            }}
          >
            Your Color Palette
          </Text>

          <Text
            style={{
              fontSize: 14,
              color: '#64748b',
              marginBottom: 16,
              lineHeight: 20,
            }}
          >
            Select your seasonal color palette based on your skin tone, hair, and
            eye color.
          </Text>

          <View style={{ gap: 12 }}>
            {colorPalettes.map((palette, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => setColorPalette(palette.name)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: 16,
                  borderRadius: 12,
                  borderWidth: 2,
                  borderColor:
                    colorPalette === palette.name ? '#a855f7' : '#e2e8f0',
                  backgroundColor:
                    colorPalette === palette.name
                      ? 'rgba(168, 85, 247, 0.05)'
                      : '#ffffff',
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: '500',
                      color: '#1e293b',
                      marginBottom: 4,
                    }}
                  >
                    {palette.name}
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 4 }}>
                    {palette.colors.map((color, colorIndex) => (
                      <View
                        key={colorIndex}
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: 10,
                          backgroundColor: color,
                          borderWidth: 1,
                          borderColor: '#e2e8f0',
                        }}
                      />
                    ))}
                  </View>
                </View>
                {colorPalette === palette.name && (
                  <Text style={{ color: '#a855f7', fontSize: 18 }}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Actions */}
        <View style={{ gap: 12 }}>
          <Button
            title="Save Changes"
            onPress={saveProfile}
            style={{
              backgroundColor: '#a855f7',
              paddingVertical: 16,
            }}
            textStyle={{ color: '#ffffff', fontSize: 16, fontWeight: '600' }}
          />

          <Button
            title="Take Color Analysis"
            onPress={() => Alert.alert('Coming Soon', 'Color analysis feature coming soon!')}
            variant="outline"
            style={{
              borderColor: '#a855f7',
              backgroundColor: 'rgba(168, 85, 247, 0.05)',
              paddingVertical: 16,
            }}
            textStyle={{ color: '#a855f7', fontSize: 16 }}
          />

          <Button
            title="Sign Out"
            onPress={handleSignOut}
            variant="destructive"
            style={{
              paddingVertical: 16,
            }}
            textStyle={{ fontSize: 16 }}
          />
        </View>

        {/* App Info */}
        <View style={{ alignItems: 'center', marginTop: 32 }}>
          <Text
            style={{
              fontSize: 12,
              color: '#94a3b8',
              textAlign: 'center',
            }}
          >
            DripMuse v1.0.0
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

export default EditProfileScreen;
