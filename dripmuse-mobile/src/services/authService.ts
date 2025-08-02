import AsyncStorage from '@react-native-async-storage/async-storage';

export interface User {
  id: string;
  email: string;
  created_at: string;
}

export interface AuthError {
  message: string;
}

interface StoredUser extends User {
  password: string; // Store hashed in production
}

const USERS_KEY = 'dripmuse_users';
const CURRENT_USER_KEY = 'dripmuse_current_user';

// Simple password hashing (use proper hashing in production)
const hashPassword = (password: string): string => {
  return btoa(password); // Base64 encoding for demo purposes
};

const verifyPassword = (password: string, hash: string): boolean => {
  return btoa(password) === hash;
};

export class AuthService {
  static async getStoredUsers(): Promise<StoredUser[]> {
    try {
      const usersJson = await AsyncStorage.getItem(USERS_KEY);
      return usersJson ? JSON.parse(usersJson) : [];
    } catch (error) {
      console.error('Error getting stored users:', error);
      return [];
    }
  }

  static async saveUser(user: StoredUser): Promise<void> {
    try {
      const users = await this.getStoredUsers();
      const existingUserIndex = users.findIndex(u => u.email === user.email);
      
      if (existingUserIndex >= 0) {
        users[existingUserIndex] = user;
      } else {
        users.push(user);
      }
      
      await AsyncStorage.setItem(USERS_KEY, JSON.stringify(users));
    } catch (error) {
      console.error('Error saving user:', error);
      throw new Error('Failed to save user');
    }
  }

  static async signUp(email: string, password: string): Promise<{ user?: User; error?: AuthError }> {
    try {
      // Check if user already exists
      const users = await this.getStoredUsers();
      const existingUser = users.find(u => u.email === email);
      
      if (existingUser) {
        return { error: { message: 'User already exists with this email' } };
      }

      // Create new user
      const newUser: StoredUser = {
        id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        email,
        password: hashPassword(password),
        created_at: new Date().toISOString(),
      };

      await this.saveUser(newUser);

      // Return user without password
      const { password: _, ...userWithoutPassword } = newUser;
      return { user: userWithoutPassword };
    } catch (error) {
      return { error: { message: 'Failed to create account' } };
    }
  }

  static async signIn(email: string, password: string): Promise<{ user?: User; error?: AuthError }> {
    try {
      const users = await this.getStoredUsers();
      const user = users.find(u => u.email === email);
      
      if (!user) {
        return { error: { message: 'No account found with this email' } };
      }

      if (!verifyPassword(password, user.password)) {
        return { error: { message: 'Incorrect password' } };
      }

      // Store current user session
      const { password: _, ...userWithoutPassword } = user;
      await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userWithoutPassword));

      return { user: userWithoutPassword };
    } catch (error) {
      return { error: { message: 'Failed to sign in' } };
    }
  }

  static async signOut(): Promise<{ error?: AuthError }> {
    try {
      await AsyncStorage.removeItem(CURRENT_USER_KEY);
      return {};
    } catch (error) {
      return { error: { message: 'Failed to sign out' } };
    }
  }

  static async getCurrentUser(): Promise<User | null> {
    try {
      const userJson = await AsyncStorage.getItem(CURRENT_USER_KEY);
      return userJson ? JSON.parse(userJson) : null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  static async isSignedIn(): Promise<boolean> {
    const user = await this.getCurrentUser();
    return user !== null;
  }
}
