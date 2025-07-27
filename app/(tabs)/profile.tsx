import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_USERS_ENDPOINT, COLORS } from '../../lib/constants';

const { width } = Dimensions.get('window');

interface UserData {
  id: number;
  login: string;
  displayname: string;
  email?: string | null;
  image?: {
    link?: string | null;
    versions?: {
      medium?: string | null;
      large?: string | null;
      micro?: string | null;
    } | null;
  } | null;
  image_url?: string | null;
  location?: string | null;
  pool_year?: string | null;
  pool_month?: string | null;
  correction_point?: number | null;
  wallet?: number | null;
  cursus_users?: {
    cursus: {
      name: string;
      slug: string;
    };
    level: number;
    grade?: string | null;
    skills?: {
      name: string;
      level: number;
    }[];
  }[];
  projects_users?: {
    project: {
      name: string;
      slug: string;
    };
    final_mark?: number | null;
    status: string;
    validated?: boolean;
    current_team_id?: number | null;
  }[];
  achievements?: {
    id: number;
    name: string;
    description: string;
    image?: string | null;
    visible: boolean;
    kind: string;
  }[];
}

interface ProjectData {
  project: {
    name: string;
    slug: string;
  };
  final_mark?: number | null;
  status: string;
  validated?: boolean;
  current_team_id?: number | null;
}

interface AchievementData {
  id: number;
  name: string;
  description: string;
  tier: string;
  kind: string;
  visible: boolean;
  image: string | null;
  nbr_of_success: number | null;
  users_url: string;
}

export default function ProfileScreen() {
  const router = useRouter();
  
  // Get user data and access token from global state
  const userData = (global as any).globalUserData as UserData;
  const accessToken = (global as any).globalAccessToken as string;
  
  const [projectsData, setProjectsData] = useState<ProjectData[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);


  useEffect(() => {
    // Listen for dimension changes (orientation changes)
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
    });
    
    if (!userData) {
      Alert.alert('Error', 'User data not found. Please search again.');
      router.push('/(tabs)/search');
      return;
    }
    if (!accessToken) {
      Alert.alert('Connection Lost', 'Connection to 42 API lost. Returning to home screen.');
      router.push('/home');
      return;
    }
    if (!userData.login) {
      Alert.alert('Error', 'Invalid user data. Please search again.');
      router.push('/(tabs)/search');
      return;
    }

    fetchProjectsData();
    
    return () => {
      if (subscription?.remove) {
        subscription.remove();
      }
    };
  }, [userData, accessToken]);

  const fetchProjectsData = async () => {
    try {
      const response = await fetch(
        `${API_USERS_ENDPOINT}/${userData.login}/projects_users`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const data: ProjectData[] = await response.json();
        setProjectsData(data);
      } else {
        console.error('Failed to fetch projects data:', response.status);
        setProjectsData([]);
      }
    } catch (error) {
      console.error('Error fetching projects data:', error);
      setProjectsData([]);
    } finally {
      setIsLoadingProjects(false);
    }
  };

  const getMainCursus = () => {
    if (!userData?.cursus_users) return null;
    return userData.cursus_users.find(cursus => 
      cursus.cursus.slug === '42cursus' || cursus.cursus.slug === '42'
    ) || userData.cursus_users[0];
  };

  const mainCursus = getMainCursus();
  const skills = mainCursus?.skills || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'finished':
        return COLORS.success;
      case 'in_progress':
        return COLORS.warning;
      case 'waiting_for_correction':
        return COLORS.error;
      default:
        return COLORS.text.disabled;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'finished':
        return 'Completed';
      case 'in_progress':
        return 'In Progress';
      case 'waiting_for_correction':
        return 'Waiting';
      default:
        return status;
    }
  };

  // Helper function to get the correct profile image URL
  const getProfileImageUrl = () => {
    // Prefer large, then medium, then link, then image_url
    if (userData.image?.versions?.large) {
      return userData.image.versions.large;
    }
    if (userData.image?.versions?.medium) {
      return userData.image.versions.medium;
    }
    if (userData.image?.link) {
      return userData.image.link;
    }
    if (userData.image_url) {
      return userData.image_url;
    }
    return null;
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.push('/(tabs)/search')}
        activeOpacity={0.7}
      >
        <Text style={styles.backButtonText}>{'←'}</Text>
      </TouchableOpacity>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.profileHeader}>
          {(() => {
            const imageUrl = getProfileImageUrl();
            if (imageUrl && !imageError) {
              return (
                <Image
                  source={{
                    uri: imageUrl,
                    headers: {
                      'User-Agent': 'SwiftyCompanion/1.0',
                    },
                  }}
                  style={styles.fullWidthImage}
                  onError={() => setImageError(true)}
                  onLoadStart={() => setImageLoading(true)}
                  onLoadEnd={() => setImageLoading(false)}
                  resizeMode="cover"
                />
              );
            } else if (imageLoading && imageUrl) {
              return (
                <View style={styles.fullWidthPlaceholder}>
                  <ActivityIndicator size="large" color="#ffffff" />
                  <Text style={styles.loadingText}>Loading image...</Text>
                </View>
              );
            } else {
              return (
                <View style={styles.fullWidthPlaceholder}>
                  <Text style={styles.fullWidthPlaceholderText}>
                    {userData.displayname?.charAt(0)?.toUpperCase() || 'U'}
                  </Text>
                </View>
              );
            }
          })()}
          
          {imageLoading && getProfileImageUrl() && (
            <View style={styles.imageLoadingOverlay}>
              <ActivityIndicator size="large" color="#ffffff" />
            </View>
          )}
          
        </View>
        <View style={styles.userInfoBelowLeftNoBg}>
          <View style={styles.userInfoTextCol}>
            <Text style={styles.displayNameLeftBlack} numberOfLines={1} ellipsizeMode="tail">
              {userData.displayname || 'Unknown'}
            </Text>
            <Text style={styles.loginLeftBlack} numberOfLines={1} ellipsizeMode="tail">
              @{userData.login || 'unknown'}
            </Text>
            {userData.location && (
              <Text style={styles.locationLeft} numberOfLines={1} ellipsizeMode="tail">
                📍 {userData.location}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {mainCursus?.level ? mainCursus.level.toFixed(2) : '0.00'}
            </Text>
            <Text style={styles.statLabel}>Level</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {userData.correction_point?.toFixed(2) || '0.00'}
            </Text>
            <Text style={styles.statLabel}>Points</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {userData.wallet?.toFixed(2) || '0.00'}
            </Text>
            <Text style={styles.statLabel}>Wallet</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email:</Text>
              <Text style={styles.infoValue}>{userData.email || 'N/A'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Pool Year:</Text>
              <Text style={styles.infoValue}>{userData.pool_year || 'N/A'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Pool Month:</Text>
              <Text style={styles.infoValue}>{userData.pool_month || 'N/A'}</Text>
            </View>
            {mainCursus?.grade && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Grade:</Text>
                <Text style={styles.infoValue}>{mainCursus.grade}</Text>
              </View>
            )}
          </View>
        </View>

        {skills.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Skills</Text>
            <View style={styles.skillsContainer}>
              {skills.map((skill, index) => (
                <View key={index} style={styles.skillCard}>
                  <View style={styles.skillHeader}>
                    <Text style={styles.skillName} numberOfLines={1} ellipsizeMode="tail">
                      {skill.name}
                    </Text>
                    <Text style={styles.skillLevel}>
                      {((skill.level / 21) * 100).toFixed(2)}%
                    </Text>
                  </View>
                  <View style={styles.progressBar}>
                    <View 
                      style={[
                        styles.progressFill, 
                        { width: `${(skill.level / 21) * 100}%` }
                      ]} 
                    />
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Projects</Text>
          {isLoadingProjects ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#3498db" />
              <Text style={styles.loadingText}>Loading projects...</Text>
            </View>
          ) : (
            <View style={styles.projectsContainer}>
              {projectsData.map((project, index) => (
                <View key={index} style={styles.projectCard}>
                  <View style={styles.projectHeader}>
                    <Text style={styles.projectName} numberOfLines={2} ellipsizeMode="tail">
                      {project.project.name}
                    </Text>
                    <View style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(project.status) }
                    ]}>
                      <Text style={styles.statusText} numberOfLines={1}>
                        {getStatusText(project.status)}
                      </Text>
                    </View>
                  </View>
                  {project.final_mark !== null && (
                    <View style={styles.markContainer}>
                      <Text style={styles.markLabel}>Final Mark:</Text>
                      <Text style={[
                        styles.markValue,
                        { color: project.validated ? '#27ae60' : '#e74c3c' }
                      ]}>
                        {project.final_mark}/100
                      </Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  profileHeader: {
    height: 200,
    position: 'relative',
    marginBottom: 10,
  },
  fullWidthImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  fullWidthPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullWidthPlaceholderText: {
    fontSize: 80,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  userInfoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 20,
    paddingBottom: 30,
  },
  imageLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfoBelowLeftNoBg: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'transparent',
    paddingVertical: 0,
    paddingHorizontal: 20,
    marginBottom: 10,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  userInfoTextCol: {
    flex: 1,
    alignItems: 'flex-start',
  },
  displayNameLeft: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 2,
  },
  loginLeft: {
    fontSize: 16,
    color: '#b0b0b0',
    marginBottom: 2,
  },
  locationLeft: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    marginTop: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 12,
    marginHorizontal: 5,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minHeight: 70,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3498db',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    fontWeight: '600',
    textAlign: 'center',
  },
  section: {
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 15,
  },
  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f2f6',
  },
  infoLabel: {
    fontSize: 16,
    color: '#7f8c8d',
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 16,
    color: '#2c3e50',
    fontWeight: '500',
  },
  skillsContainer: {
    gap: 12,
  },
  skillCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  skillHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  skillName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    flex: 1,
    marginRight: 10,
    flexShrink: 1,
  },
  skillLevel: {
    fontSize: 14,
    color: '#3498db',
    fontWeight: '600',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#ecf0f1',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3498db',
    borderRadius: 4,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#7f8c8d',
  },
  projectsContainer: {
    gap: 12,
  },
  projectCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  projectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  projectName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    flex: 1,
    marginRight: 10,
    flexShrink: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '600',
  },
  markContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  markLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    marginRight: 8,
  },
  markValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  achievementsContainer: {
    gap: 12,
  },
  achievementCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    flexDirection: 'row',
    alignItems: 'center',
  },
  achievementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
  },
  achievementIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  achievementIcon: {
    width: '100%',
    height: '100%',
  },
  achievementIconPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#3498db',
  },
  achievementIconText: {
    fontSize: 24,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  achievementDescription: {
    fontSize: 14,
    color: '#7f8c8d',
    lineHeight: 1.4,
  },
  achievementMeta: {
    fontSize: 12,
    color: '#95a5a6',
    marginTop: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#7f8c8d',
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
  displayNameLeftBlack: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111',
    marginBottom: 2,
  },
  loginLeftBlack: {
    fontSize: 16,
    color: '#222',
    marginBottom: 2,
  },
});