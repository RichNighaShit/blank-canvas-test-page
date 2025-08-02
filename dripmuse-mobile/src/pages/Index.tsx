import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '@/hooks/useAuth';
import Button from '@/components/ui/Button';

const { width, height } = Dimensions.get('window');

const IndexScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();

  React.useEffect(() => {
    if (user) {
      navigation.navigate('Main' as never);
    }
  }, [user, navigation]);

  const navigateToAuth = () => {
    navigation.navigate('Auth' as never);
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#ffffff' }}>
      {/* Hero Section */}
      <LinearGradient
        colors={['#f8fafc', '#f1f5f9', '#e2e8f0']}
        style={{
          minHeight: height,
          paddingHorizontal: 20,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        {/* Navigation */}
        <View
          style={{
            position: 'absolute',
            top: 60,
            right: 20,
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            borderRadius: 25,
            paddingHorizontal: 16,
            paddingVertical: 8,
          }}
        >
          <TouchableOpacity onPress={navigateToAuth} style={{ marginRight: 12 }}>
            <Text style={{ color: '#64748b', fontSize: 14 }}>Sign In</Text>
          </TouchableOpacity>
          <View style={{ width: 1, height: 16, backgroundColor: '#d1d5db' }} />
          <TouchableOpacity
            onPress={navigateToAuth}
            style={{
              marginLeft: 12,
              backgroundColor: 'rgba(147, 51, 234, 0.8)',
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 20,
            }}
          >
            <Text style={{ color: '#ffffff', fontSize: 14, fontWeight: '500' }}>
              Get Started
            </Text>
          </TouchableOpacity>
        </View>

        {/* Hero Content */}
        <View style={{ alignItems: 'center', marginTop: 40 }}>
          {/* Badge */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.7)',
              borderRadius: 25,
              paddingHorizontal: 16,
              paddingVertical: 8,
              marginBottom: 32,
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: '500', color: '#64748b' }}>
              ✨ DripMuse • AI Style Intelligence
            </Text>
          </View>

          {/* Main Headline */}
          <View style={{ alignItems: 'center', marginBottom: 32 }}>
            <Text
              style={{
                fontSize: 48,
                fontWeight: '300',
                color: '#1e293b',
                textAlign: 'center',
                lineHeight: 52,
              }}
            >
              Awaken
            </Text>
            <LinearGradient
              colors={['#a855f7', '#ec4899', '#f43f5e']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ marginVertical: 8 }}
            >
              <Text
                style={{
                  fontSize: 48,
                  fontWeight: '300',
                  color: 'transparent',
                  textAlign: 'center',
                  lineHeight: 52,
                }}
              >
                Your
              </Text>
            </LinearGradient>
            <Text
              style={{
                fontSize: 48,
                fontWeight: '300',
                color: '#1e293b',
                textAlign: 'center',
                lineHeight: 52,
              }}
            >
              Inner Muse
            </Text>
          </View>

          {/* Description */}
          <View style={{ alignItems: 'center', marginBottom: 32 }}>
            <Text
              style={{
                fontSize: 18,
                color: '#64748b',
                textAlign: 'center',
                lineHeight: 26,
                maxWidth: width - 40,
                marginBottom: 16,
              }}
            >
              Your AI-powered personal stylist. Upload photos of your clothes, get
              personalized color analysis, and receive smart outfit recommendations
              tailored to your style, occasion, and weather.
            </Text>
            <Text
              style={{
                fontSize: 12,
                color: '#94a3b8',
                fontStyle: 'italic',
                textAlign: 'center',
              }}
            >
              — Join thousands discovering their perfect style with AI —
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={{ alignItems: 'center', gap: 16 }}>
            <LinearGradient
              colors={['rgba(168, 85, 247, 0.9)', 'rgba(236, 72, 153, 0.9)']}
              style={{
                borderRadius: 16,
                paddingHorizontal: 32,
                paddingVertical: 16,
              }}
            >
              <TouchableOpacity onPress={navigateToAuth}>
                <Text
                  style={{
                    color: '#ffffff',
                    fontSize: 18,
                    fontWeight: '600',
                    textAlign: 'center',
                  }}
                >
                  🎨 Begin Journey
                </Text>
              </TouchableOpacity>
            </LinearGradient>

            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 24,
                paddingVertical: 12,
              }}
            >
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: 'rgba(255, 255, 255, 0.8)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12,
                }}
              >
                <Text style={{ fontSize: 20 }}>📸</Text>
              </View>
              <Text
                style={{
                  fontSize: 16,
                  color: '#64748b',
                  fontWeight: '300',
                }}
              >
                Explore the Art
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      {/* Features Section */}
      <View style={{ padding: 20, backgroundColor: '#ffffff' }}>
        <Text
          style={{
            fontSize: 32,
            fontWeight: '300',
            color: '#1e293b',
            textAlign: 'center',
            marginBottom: 16,
          }}
        >
          Your Personal
        </Text>
        <LinearGradient
          colors={['#a855f7', '#ec4899']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ alignSelf: 'center', marginBottom: 32 }}
        >
          <Text
            style={{
              fontSize: 32,
              fontWeight: '300',
              color: 'transparent',
              textAlign: 'center',
              fontStyle: 'italic',
            }}
          >
            AI Stylist
          </Text>
        </LinearGradient>

        <Text
          style={{
            fontSize: 16,
            color: '#64748b',
            textAlign: 'center',
            lineHeight: 24,
            marginBottom: 48,
          }}
        >
          DripMuse combines advanced AI with color theory to help you discover your
          perfect style. Our technology analyzes your features, organizes your
          wardrobe, and creates personalized recommendations.
        </Text>

        {/* Feature Cards */}
        <View style={{ gap: 24 }}>
          {[
            {
              icon: '🎨',
              title: 'AI Color Analysis',
              description:
                'Upload a photo and get your personalized color palette based on your skin tone, hair, and eye color.',
            },
            {
              icon: '📸',
              title: 'Smart Wardrobe',
              description:
                'Organize your clothes digitally. AI automatically categorizes items by type, color, and style.',
            },
            {
              icon: '✨',
              title: 'Outfit Recommendations',
              description:
                'Get personalized outfit suggestions based on weather, occasion, and your style preferences.',
            },
          ].map((feature, index) => (
            <View
              key={index}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                borderRadius: 16,
                padding: 24,
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.5)',
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
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: '500',
                    color: '#1e293b',
                  }}
                >
                  {feature.title}
                </Text>
              </View>
              <Text
                style={{
                  fontSize: 14,
                  color: '#64748b',
                  lineHeight: 20,
                }}
              >
                {feature.description}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* CTA Section */}
      <LinearGradient
        colors={['#f8fafc', '#f1f5f9']}
        style={{
          padding: 40,
          alignItems: 'center',
        }}
      >
        <Text
          style={{
            fontSize: 32,
            fontWeight: '300',
            color: '#1e293b',
            textAlign: 'center',
            marginBottom: 8,
          }}
        >
          Ready to Transform
        </Text>
        <LinearGradient
          colors={['#a855f7', '#ec4899', '#f43f5e']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ marginBottom: 24 }}
        >
          <Text
            style={{
              fontSize: 32,
              fontWeight: '300',
              color: 'transparent',
              textAlign: 'center',
              fontStyle: 'italic',
            }}
          >
            Your Style?
          </Text>
        </LinearGradient>

        <Text
          style={{
            fontSize: 16,
            color: '#64748b',
            textAlign: 'center',
            lineHeight: 24,
            marginBottom: 32,
          }}
        >
          Join thousands who've discovered their perfect colors and streamlined
          their daily outfit choices. Start your personalized style journey today
          with AI-powered recommendations.
        </Text>

        <LinearGradient
          colors={['rgba(168, 85, 247, 0.9)', 'rgba(236, 72, 153, 0.9)']}
          style={{
            borderRadius: 16,
            paddingHorizontal: 48,
            paddingVertical: 20,
          }}
        >
          <TouchableOpacity onPress={navigateToAuth}>
            <Text
              style={{
                color: '#ffffff',
                fontSize: 20,
                fontWeight: '600',
                textAlign: 'center',
              }}
            >
              🎨 Discover Your Colors
            </Text>
          </TouchableOpacity>
        </LinearGradient>

        {/* Trust Indicators */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: 32,
            gap: 24,
          }}
        >
          {[
            { color: '#10b981', text: 'Free to start' },
            { color: '#8b5cf6', text: 'AI-powered analysis' },
            { color: '#ec4899', text: 'Works on any device' },
          ].map((item, index) => (
            <View
              key={index}
              style={{ flexDirection: 'row', alignItems: 'center' }}
            >
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: item.color,
                  marginRight: 8,
                }}
              />
              <Text style={{ fontSize: 12, color: '#64748b' }}>{item.text}</Text>
            </View>
          ))}
        </View>
      </LinearGradient>
    </ScrollView>
  );
};

export default IndexScreen;
