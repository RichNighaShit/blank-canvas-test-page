import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/hooks/useAuth';
import Button from '@/components/ui/Button';

const { width } = Dimensions.get('window');

const DashboardScreen = () => {
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  const features = [
    {
      icon: '🎨',
      title: 'Color Analysis',
      description: 'Discover your perfect color palette',
      action: 'Start Analysis',
    },
    {
      icon: '👔',
      title: 'Virtual Wardrobe',
      description: 'Organize your clothing collection',
      action: 'View Wardrobe',
    },
    {
      icon: '✨',
      title: 'Style Recommendations',
      description: 'Get AI-powered outfit suggestions',
      action: 'Get Recommendations',
    },
    {
      icon: '📸',
      title: 'Virtual Try-On',
      description: 'See how outfits look on you',
      action: 'Try On',
    },
  ];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      {/* Header */}
      <LinearGradient
        colors={['#a855f7', '#ec4899']}
        style={{
          paddingTop: 60,
          paddingBottom: 40,
          paddingHorizontal: 20,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 20,
          }}
        >
          <View>
            <Text style={{ color: '#ffffff', fontSize: 24, fontWeight: '600' }}>
              Welcome back!
            </Text>
            <Text style={{ color: '#f1f5f9', fontSize: 16 }}>
              {user?.email || 'User'}
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleSignOut}
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 12,
            }}
          >
            <Text style={{ color: '#ffffff', fontSize: 14 }}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Stats */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
            borderRadius: 16,
            padding: 20,
          }}
        >
          <View style={{ alignItems: 'center', flex: 1 }}>
            <Text style={{ color: '#ffffff', fontSize: 24, fontWeight: '600' }}>
              0
            </Text>
            <Text style={{ color: '#f1f5f9', fontSize: 12 }}>Wardrobe Items</Text>
          </View>
          <View style={{ alignItems: 'center', flex: 1 }}>
            <Text style={{ color: '#ffffff', fontSize: 24, fontWeight: '600' }}>
              0
            </Text>
            <Text style={{ color: '#f1f5f9', fontSize: 12 }}>Outfits Created</Text>
          </View>
          <View style={{ alignItems: 'center', flex: 1 }}>
            <Text style={{ color: '#ffffff', fontSize: 24, fontWeight: '600' }}>
              ✨
            </Text>
            <Text style={{ color: '#f1f5f9', fontSize: 12 }}>Style Score</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Main Content */}
      <View style={{ padding: 20 }}>
        <Text
          style={{
            fontSize: 20,
            fontWeight: '600',
            color: '#1e293b',
            marginBottom: 20,
          }}
        >
          Your Style Journey
        </Text>

        {/* Feature Cards */}
        <View style={{ gap: 16 }}>
          {features.map((feature, index) => (
            <TouchableOpacity
              key={index}
              style={{
                backgroundColor: '#ffffff',
                borderRadius: 16,
                padding: 20,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
                elevation: 3,
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginBottom: 12,
                }}
              >
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    backgroundColor: 'rgba(168, 85, 247, 0.1)',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 16,
                  }}
                >
                  <Text style={{ fontSize: 24 }}>{feature.icon}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 18,
                      fontWeight: '600',
                      color: '#1e293b',
                    }}
                  >
                    {feature.title}
                  </Text>
                  <Text
                    style={{
                      fontSize: 14,
                      color: '#64748b',
                      marginTop: 4,
                    }}
                  >
                    {feature.description}
                  </Text>
                </View>
              </View>
              <Button
                title={feature.action}
                onPress={() => {}}
                variant="outline"
                style={{
                  borderColor: '#a855f7',
                  backgroundColor: 'rgba(168, 85, 247, 0.05)',
                }}
                textStyle={{ color: '#a855f7' }}
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* Daily Inspiration */}
        <View style={{ marginTop: 32 }}>
          <Text
            style={{
              fontSize: 20,
              fontWeight: '600',
              color: '#1e293b',
              marginBottom: 16,
            }}
          >
            Daily Style Inspiration
          </Text>
          
          <LinearGradient
            colors={['#f8fafc', '#f1f5f9']}
            style={{
              borderRadius: 16,
              padding: 24,
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 48, marginBottom: 16 }}>🌟</Text>
            <Text
              style={{
                fontSize: 18,
                fontWeight: '500',
                color: '#1e293b',
                textAlign: 'center',
                marginBottom: 8,
              }}
            >
              "Style is a way to say who you are without having to speak."
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: '#64748b',
                fontStyle: 'italic',
              }}
            >
              — Rachel Zoe
            </Text>
          </LinearGradient>
        </View>
      </View>
    </ScrollView>
  );
};

export default DashboardScreen;
