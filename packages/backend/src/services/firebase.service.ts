import * as admin from 'firebase-admin';

export class FirebaseService {
  private static instance: FirebaseService;
  private firestore: admin.firestore.Firestore;

  private constructor() {
    try {
      // Initialize Firebase Admin if not already initialized
      if (!admin.apps.length) {
        this.initializeFirebase();
      }
      
      this.firestore = admin.firestore();
      console.log('✅ Firebase service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Firebase service:', error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }

  private initializeFirebase() {
    // Check if we have service account key file path
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PATH) {
      const serviceAccount = require(process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PATH);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: process.env.FIREBASE_PROJECT_ID
      });
    } 
    // Or use individual environment variables
    else if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        }),
        projectId: process.env.FIREBASE_PROJECT_ID
      });
    } else {
      throw new Error('Firebase configuration is missing. Please set FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL or FIREBASE_SERVICE_ACCOUNT_KEY_PATH environment variables.');
    }
  }

  public static getInstance(): FirebaseService {
    if (!FirebaseService.instance) {
      FirebaseService.instance = new FirebaseService();
    }
    return FirebaseService.instance;
  }

  /**
   * Get all users from the users2 collection
   */
  async getAllUsers(): Promise<any[]> {
    try {
      const snapshot = await this.firestore.collection('users2').get();
      const users = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      return users;
    } catch (error) {
      console.error('Error getting all users:', error);
      throw new Error('Failed to retrieve users');
    }
  }

  /**
   * Get a specific user by ID
   */
  async getUserById(userId: string): Promise<any | null> {
    try {
      const doc = await this.firestore.collection('users2').doc(userId).get();
      if (!doc.exists) {
        return null;
      }
      return {
        id: doc.id,
        ...doc.data()
      };
    } catch (error) {
      console.error('Error getting user by ID:', error);
      throw new Error('Failed to retrieve user');
    }
  }

  /**
   * Create a new user
   */
  async createUser(userData: any): Promise<any> {
    try {
      const docRef = await this.firestore.collection('users2').add({
        ...userData,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      const newDoc = await docRef.get();
      return {
        id: newDoc.id,
        ...newDoc.data()
      };
    } catch (error) {
      console.error('Error creating user:', error);
      throw new Error('Failed to create user');
    }
  }

  /**
   * Update an existing user
   */
  async updateUser(userId: string, userData: any): Promise<any> {
    try {
      const docRef = this.firestore.collection('users2').doc(userId);
      await docRef.update({
        ...userData,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      const updatedDoc = await docRef.get();
      if (!updatedDoc.exists) {
        throw new Error('User not found');
      }
      
      return {
        id: updatedDoc.id,
        ...updatedDoc.data()
      };
    } catch (error) {
      console.error('Error updating user:', error);
      throw new Error('Failed to update user');
    }
  }

  /**
   * Delete a user by ID
   */
  async deleteUser(userId: string): Promise<void> {
    try {
      const docRef = this.firestore.collection('users2').doc(userId);
      const doc = await docRef.get();
      
      if (!doc.exists) {
        throw new Error('User not found');
      }
      
      await docRef.delete();
    } catch (error) {
      console.error('Error deleting user:', error);
      throw new Error('Failed to delete user');
    }
  }

  /**
   * Query users with filters
   */
  async queryUsers(filters: { [key: string]: any } = {}, limit?: number): Promise<any[]> {
    try {
      let query: admin.firestore.Query = this.firestore.collection('users2');
      
      // Apply filters
      Object.entries(filters).forEach(([field, value]) => {
        query = query.where(field, '==', value);
      });
      
      // Apply limit if specified
      if (limit) {
        query = query.limit(limit);
      }
      
      const snapshot = await query.get();
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error querying users:', error);
      throw new Error('Failed to query users');
    }
  }
}