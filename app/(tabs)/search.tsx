import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_TOKEN_ENDPOINT, API_USERS_ENDPOINT, MAX_LOGIN_LENGTH } from '../../lib/constants';

export default function SearchScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [accessToken, setAccessToken] = useState(null);
  const [isLoadingToken, setIsLoadingToken] = useState(true);
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));

  // Check for global token or fetch new one
  useEffect(() => {
    // Listen for dimension changes (orientation changes)
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window);
    });
    
    const initializeToken = async () => {
      try {
        // Check if we have a global token from home screen
        const globalToken = (global as any).globalAccessToken;
        if (globalToken) {
          setAccessToken(globalToken);
          setIsLoadingToken(false);
          return;
        }

        // Fallback to fetching new token
        const token = await fetchfrom42();
        setAccessToken(token);
      } catch (error) {
        console.error('Token initialization failed:', error);
      } finally {
        setIsLoadingToken(false);
      }
    };

    initializeToken();
    
    return () => {
      if (subscription?.remove) {
        subscription.remove();
      }
    };
  }, []);

  const fetchfrom42 = async () => {
    try {
      // Get credentials from environment variables
      const client_id = process.env.EXPO_PUBLIC_42_CLIENT_ID;
      const client_secret = process.env.EXPO_PUBLIC_42_CLIENT_SECRET;
      
      if (!client_id || !client_secret) {
        console.error('Missing environment variables for 42 API credentials');
        Alert.alert('Error', 'Missing API credentials configuration');
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
      const access_token = data.access_token;
      return access_token;
    } catch (error) {
      console.error('Failed to get access token:', error);
      Alert.alert('Error', 'Failed to get access token. Please check your connection and try again.');
      return null;
    }
  }

  const handleSearch = async () => {
    const trimmedLogin = searchQuery.trim();
    
    if (!trimmedLogin) {
      Alert.alert('Error', 'Please enter a login');
      return;
    }

    if (trimmedLogin.length > MAX_LOGIN_LENGTH) {
      Alert.alert('Error', `Login must be ${MAX_LOGIN_LENGTH} characters or less`);
      return;
    }

    if (!accessToken) {
      Alert.alert('Connection Lost', 'Connection to 42 API lost. Returning to home screen.');
      router.back();
      return;
    }

    setIsSearching(true);

    try {
      const userResponse = await fetch(`${API_USERS_ENDPOINT}/${encodeURIComponent(trimmedLogin)}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (userResponse.ok) {
        const userData = await userResponse.json();
        (global as any).globalUserData = userData;
        router.push('/(tabs)/profile');
      } else if (userResponse.status === 404) {
        Alert.alert('User Not Found', 'No user found with this login. Please check the spelling and try again.');
      } else {
        Alert.alert('Error', 'Failed to fetch user data. Please try again.');
      }
    } catch (error) {
      console.error('Search error:', error);
      Alert.alert('Error', 'An error occurred while searching. Please check your connection and try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleClear = () => {
    setSearchQuery('');
  };

  return (
    <SafeAreaView style={styles.container}>
      
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.push('/home')}
        activeOpacity={0.7}
      >
        <Text style={styles.backButtonText}>{'←'}</Text>
      </TouchableOpacity>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <View style={styles.pageWrapper}>
          <View style={[styles.content, { 
            padding: Math.min(dimensions.width, dimensions.height) * 0.05,
            justifyContent: dimensions.height > dimensions.width ? 'center' : 'flex-start',
            paddingTop: dimensions.height > dimensions.width ? 0 : 20
          }]}>

          <View style={[styles.header, { 
            marginBottom: dimensions.height > dimensions.width ? 40 : 25 
          }]}>
            <Text style={[styles.title, { 
              fontSize: Math.min(dimensions.width, dimensions.height) * 0.08 
            }]}>Swifty companion</Text>
            <Text style={[styles.subtitle, { 
              fontSize: Math.min(dimensions.width, dimensions.height) * 0.04 
            }]}>Enter your intranet login below</Text>
          </View>

          {/* Search Section */}
          <View style={[styles.searchSection, { 
            marginBottom: dimensions.height > dimensions.width ? 30 : 20 
          }]}>
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.textInput, { 
                  paddingVertical: Math.min(dimensions.width, dimensions.height) * 0.02,
                  fontSize: Math.min(dimensions.width, dimensions.height) * 0.04
                }]}
                placeholder="Enter login (max 20 characters)"
                placeholderTextColor="#999"
                value={searchQuery}
                onChangeText={(text) => {
                  // Limit to 20 characters and only allow alphanumeric and some special chars
                  const filteredText = text.replace(/[^a-zA-Z0-9._-]/g, '').slice(0, 20);
                  setSearchQuery(filteredText);
                }}
                onSubmitEditing={handleSearch}
                returnKeyType="search"
                autoCapitalize="none"
                autoCorrect={false}
                maxLength={20}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity 
                  style={styles.clearButton}
                  onPress={handleClear}
                >
                  <Text style={styles.clearButtonText}>✕</Text>
                </TouchableOpacity>
              )}
              <Text style={styles.charCounter}>
                {searchQuery.length}/20
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.searchButton,
                { paddingVertical: Math.min(dimensions.width, dimensions.height) * 0.02 },
                (!searchQuery.trim() || isSearching || isLoadingToken || !accessToken) && styles.searchButtonDisabled
              ]}
              onPress={handleSearch}
              disabled={!searchQuery.trim() || isSearching || isLoadingToken || !accessToken}
              activeOpacity={0.8}
            >
              <Text style={[
                styles.searchButtonText,
                { fontSize: Math.min(dimensions.width, dimensions.height) * 0.045 },
                (!searchQuery.trim() || isSearching || isLoadingToken || !accessToken) && styles.searchButtonTextDisabled
              ]}>
                {isLoadingToken ? 'Initializing...' : isSearching ? 'Searching...' : 'Search'}
              </Text>
            </TouchableOpacity>
            <Text style={styles.createdByText}>created by iel-bakk</Text>
          </View>

          <View style={styles.resultsSection}>
            <Text style={[styles.resultsText, { 
              fontSize: Math.min(dimensions.width, dimensions.height) * 0.035 
            }]}>
              {isLoadingToken 
                ? 'Initializing connection to 42 API...' 
                : !accessToken 
                ? 'Failed to connect to 42 API. Please restart the app.'
                : searchQuery.trim() 
                ? `Ready to search for login: "${searchQuery.trim()}"` 
                : 'Enter a 42 intranet login to search'
              }
            </Text>
            {accessToken && (
              <Text style={[styles.tokenStatus, { 
                fontSize: Math.min(dimensions.width, dimensions.height) * 0.035 
              }]}>
                ✓ Connected to 42 API
              </Text>
            )}
          </View>
        </View>
      </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  searchSection: {
    marginBottom: 30,
  },
  inputContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  textInput: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 16,
    color: '#2c3e50',
    borderWidth: 2,
    borderColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    width: '100%',
  },
  clearButton: {
    position: 'absolute',
    right: 12,
    top: '50%',
    transform: [{ translateY: -10 }],
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#e9ecef',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 12,
    color: '#6c757d',
    fontWeight: 'bold',
  },
  searchButton: {
    backgroundColor: '#3498db',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#3498db',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  searchButtonDisabled: {
    backgroundColor: '#bdc3c7',
    shadowOpacity: 0,
    elevation: 0,
  },
  searchButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  searchButtonTextDisabled: {
    color: '#95a5a6',
  },
  resultsSection: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  resultsText: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    lineHeight: 24,
  },
  tokenStatus: {
    fontSize: 14,
    color: '#27ae60',
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '600',
  },
  charCounter: {
    position: 'absolute',
    right: 12,
    bottom: -20,
    fontSize: 12,
    color: '#95a5a6',
    fontWeight: '500',
  },
  // Created by label style
  createdByText: {
    fontSize: 12,
    color: '#444',
    textAlign: 'center',
    marginTop: 8,
    opacity: 0.8,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 16,
    zIndex: 10,
    backgroundColor: '#000',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    width: 36,
    height: 36,
  },
  backButtonText: {
    fontSize: 20,
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
    textAlignVertical: 'center',
    width: '100%',
    height: '100%',
    includeFontPadding: false,
  },
  pageWrapper: {
    flex: 1,
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
    justifyContent: 'center',
  },
}); 