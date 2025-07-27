import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { API_TOKEN_ENDPOINT, APP_NAME, APP_SUBTITLE, COLORS } from '../lib/constants';

export default function HomeScreen() {
  const router = useRouter();
  const [isCheckingConnection, setIsCheckingConnection] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));

  useEffect(() => {
    // Listen for dimension changes (orientation changes)
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window);
    });
    
    checkConnection();
    
    return () => {
      if (subscription?.remove) {
        subscription.remove();
      }
    };
  }, []);

  const checkConnection = async () => {
    setIsCheckingConnection(true);
    try {
      const token = await fetchAccessToken();
      if (token) {
        setAccessToken(token);
        setIsConnected(true);
      } else {
        setIsConnected(false);
      }
    } catch (error) {
      console.error('Connection check failed:', error);
      setIsConnected(false);
    } finally {
      setIsCheckingConnection(false);
    }
  };

  const fetchAccessToken = async () => {
    try {
      const client_id = process.env.EXPO_PUBLIC_42_CLIENT_ID;
      const client_secret = process.env.EXPO_PUBLIC_42_CLIENT_SECRET;
      
      if (!client_id || !client_secret) {
        console.error('Missing environment variables for 42 API credentials');
        return null;
      }
      
      const response = await fetch(API_TOKEN_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `grant_type=client_credentials&client_id=${client_id}&client_secret=${client_secret}`,
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data.access_token;
    } catch (error) {
      console.error('Failed to fetch access token:', error);
      return null;
    }
  };

  const handleStartSearch = () => {
    if (isConnected && accessToken) {
      // Store the token globally and navigate to search
      (global as any).globalAccessToken = accessToken;
      router.push('/(tabs)/search');
    } else {
      Alert.alert(
        'Connection Error', 
        'Unable to connect to 42 API. Please check your internet connection and try again.'
      );
    }
  };

  const handleRetryConnection = () => {
    checkConnection();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.content, { padding: dimensions.height > dimensions.width ? 20 : 15 }]}>
        {/* App Icon and Title */}
        <View style={[styles.header, { marginBottom: dimensions.height > dimensions.width ? 60 : 30 }]}>
          <View style={[styles.iconContainer, {
            width: dimensions.height > dimensions.width ? 120 : 80,
            height: dimensions.height > dimensions.width ? 120 : 80,
            borderRadius: dimensions.height > dimensions.width ? 60 : 40,
          }]}>
            <Text style={[styles.icon, { fontSize: dimensions.height > dimensions.width ? 60 : 40 }]}>📱</Text>
          </View>
          <Text style={[styles.title, { fontSize: dimensions.height > dimensions.width ? 32 : 24 }]}>{APP_NAME}</Text>
          <Text style={[styles.subtitle, { fontSize: dimensions.height > dimensions.width ? 16 : 14 }]}>{APP_SUBTITLE}</Text>
        </View>

        {/* Connection Status */}
        <View style={[styles.statusContainer, { marginBottom: dimensions.height > dimensions.width ? 40 : 20 }]}>
          {isCheckingConnection ? (
            <View style={[styles.statusCard, { padding: dimensions.height > dimensions.width ? 30 : 20 }]}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={[styles.statusText, { fontSize: dimensions.height > dimensions.width ? 18 : 16 }]}>Checking connection...</Text>
            </View>
          ) : isConnected ? (
            <View style={[styles.statusCard, styles.connectedCard, { padding: dimensions.height > dimensions.width ? 30 : 20 }]}>
              <Text style={[styles.statusIcon, { fontSize: dimensions.height > dimensions.width ? 48 : 36 }]}>✅</Text>
              <Text style={[styles.statusText, { fontSize: dimensions.height > dimensions.width ? 18 : 16 }]}>Connected to 42 API</Text>
              <Text style={[styles.statusSubtext, { fontSize: dimensions.height > dimensions.width ? 14 : 12 }]}>Ready to search for users</Text>
            </View>
          ) : (
            <View style={[styles.statusCard, styles.disconnectedCard, { padding: dimensions.height > dimensions.width ? 30 : 20 }]}>
              <Text style={[styles.statusIcon, { fontSize: dimensions.height > dimensions.width ? 48 : 36 }]}>❌</Text>
              <Text style={[styles.statusText, { fontSize: dimensions.height > dimensions.width ? 18 : 16 }]}>Connection Failed</Text>
              <Text style={[styles.statusSubtext, { fontSize: dimensions.height > dimensions.width ? 14 : 12 }]}>Unable to connect to 42 API</Text>
              <TouchableOpacity 
                style={styles.retryButton}
                onPress={handleRetryConnection}
              >
                <Text style={styles.retryButtonText}>Retry Connection</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={[styles.actionsContainer, { marginBottom: dimensions.height > dimensions.width ? 40 : 20 }]}>
          <TouchableOpacity
            style={[
              styles.startButton,
              { paddingVertical: dimensions.height > dimensions.width ? 18 : 14 },
              (!isConnected || !accessToken) && styles.startButtonDisabled
            ]}
            onPress={handleStartSearch}
            disabled={!isConnected || !accessToken}
          >
            <Text style={[
              styles.startButtonText,
              { fontSize: dimensions.height > dimensions.width ? 20 : 18 },
              (!isConnected || !accessToken) && styles.startButtonTextDisabled
            ]}>
              Start Searching
            </Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { fontSize: dimensions.height > dimensions.width ? 14 : 12 }]}>
            Search for 42 students and view their profiles
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 30, // Default for smaller screens
  },
  iconContainer: {
    width: 80, // Default for smaller screens
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  icon: {
    fontSize: 40, // Default for smaller screens
  },
  title: {
    fontSize: 24, // Default for smaller screens
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14, // Default for smaller screens
    color: COLORS.text.secondary,
    textAlign: 'center',
  },
  statusContainer: {
    marginBottom: 20, // Default for smaller screens
  },
  statusCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20, // Default for smaller screens
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  connectedCard: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.success,
  },
  disconnectedCard: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.error,
  },
  statusIcon: {
    fontSize: 36, // Default for smaller screens
    marginBottom: 16,
  },
  statusText: {
    fontSize: 16, // Default for smaller screens
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  statusSubtext: {
    fontSize: 12, // Default for smaller screens
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  actionsContainer: {
    marginBottom: 20, // Default for smaller screens
  },
  startButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14, // Default for smaller screens
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  startButtonDisabled: {
    backgroundColor: COLORS.disabled,
    shadowOpacity: 0,
    elevation: 0,
  },
  startButtonText: {
    color: COLORS.white,
    fontSize: 18, // Default for smaller screens
    fontWeight: '600',
  },
  startButtonTextDisabled: {
    color: COLORS.text.disabled,
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12, // Default for smaller screens
    color: COLORS.text.disabled,
    textAlign: 'center',
    lineHeight: 20,
  },
}); 