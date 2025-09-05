import * as admin from 'firebase-admin';

export class FirebaseService {
  private static instance: FirebaseService;
  private db?: admin.firestore.Firestore;
  private initialized = false;

  private constructor() {
    // Don't initialize immediately to avoid test issues
  }

  public static getInstance(): FirebaseService {
    if (!FirebaseService.instance) {
      FirebaseService.instance = new FirebaseService();
    }
    return FirebaseService.instance;
  }

  private initializeFirebase(): void {
    if (this.initialized) return;

    try {
      // Check if Firebase is already initialized
      if (admin.apps.length === 0) {
        // Check if we have required environment variables
        if (!process.env.FIREBASE_PROJECT_ID) {
          throw new Error('FIREBASE_PROJECT_ID environment variable is required');
        }

        const serviceAccount = {
          project_id: process.env.FIREBASE_PROJECT_ID, // Firebase expects 'project_id', not 'projectId'
          projectId: process.env.FIREBASE_PROJECT_ID,
          private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
          privateKeyId: process.env.FIREBASE_PRIVATE_KEY_ID,
          private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
          client_email: process.env.FIREBASE_CLIENT_EMAIL,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          client_id: process.env.FIREBASE_CLIENT_ID,
          clientId: process.env.FIREBASE_CLIENT_ID,
          auth_uri: process.env.FIREBASE_AUTH_URI,
          authUri: process.env.FIREBASE_AUTH_URI,
          token_uri: process.env.FIREBASE_TOKEN_URI,
          tokenUri: process.env.FIREBASE_TOKEN_URI,
          auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
          authProviderX509CertUrl: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
          client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
          clientX509CertUrl: process.env.FIREBASE_CLIENT_X509_CERT_URL,
        };

        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
          databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}-default-rtdb.firebaseio.com`
        });

        console.log('🔥 Firebase Admin initialized successfully');
      }

      this.db = admin.firestore();
      this.initialized = true;
    } catch (error) {
      console.error('❌ Firebase initialization error:', error);
      throw error;
    }
  }

  /**
   * Get expense data from Firebase with optional date filtering
   * @param uid - User ID
   * @param startDate - Optional start date for filtering (YYYY-MM-DD format)
   * @param endDate - Optional end date for filtering (YYYY-MM-DD format)
   * @returns Array of expenses
   */
  async getExpenseData(uid: string, startDate?: string, endDate?: string): Promise<any> {
    try {
      this.initializeFirebase();
      if (!this.db) throw new Error('Firestore not initialized');

      // Build the query with optional date filtering
      let query: admin.firestore.Query = this.db.collection('users2').doc(uid).collection('expenses');

      // Apply date filtering if provided
      if (startDate) {
        const startTimestamp = admin.firestore.Timestamp.fromDate(new Date(startDate + 'T00:00:00.000Z'));
        query = query.where('date', '>=', startTimestamp);
      }

      if (endDate) {
        const endTimestamp = admin.firestore.Timestamp.fromDate(new Date(endDate + 'T23:59:59.999Z'));
        query = query.where('date', '<=', endTimestamp);
      }

      // Order by date for consistent results
      query = query.orderBy('date', 'desc');

      const expensesSnapshot = await query.get();
      const expenses: Array<{
        amount: number;
        category: string,
        currencyCode: string,
        date: any,
        emotion: number,
        name: string
      }> = [];

      expensesSnapshot.forEach(doc => {
        const data = doc.data();
        expenses.push({
          amount: data.amount,
          category: data.category,
          currencyCode: data.currencyCode,
          date: data.date,
          emotion: data.emotion,
          name: data.name
        });
      });

      if (expenses.length === 0) {
        const dateInfo = startDate || endDate ? ` between ${startDate || 'start'} and ${endDate || 'end'}` : '';
        throw new Error(`No expenses found for user with UID ${uid}${dateInfo}`);
      }

      return expenses;
    } catch (error) {
      console.error(`Error fetching expense data for UID ${uid}:`, error);
      throw error;
    }
  }




  /**
   * Get user data from Firebase
   * @param uid - User ID
   * @returns User data from Firestore
   */
  async getUserData(uid: string): Promise < any > {
  try {
    this.initializeFirebase();
    if(!this.db) throw new Error('Firestore not initialized');

    const userDoc = await this.db.collection('users2').doc(uid).get();

    console.log(userDoc)

      if(!userDoc.exists) {
  throw new Error(`User with UID ${uid} not found`);
}

return userDoc.data();
    } catch (error) {
  console.error(`Error fetching user data for UID ${uid}:`, error);
  throw error;
}
  }

  /**
   * Get all users from Firebase
   * @returns Array of all users
   */
  async getAllUsers(): Promise < Array < { uid: string; data: any } >> {
  try {
    this.initializeFirebase();
    if(!this.db) throw new Error('Firestore not initialized');

    const usersSnapshot = await this.db.collection('users2').get();
    const users: Array<{ uid: string; data: any }> =[];

  usersSnapshot.forEach(doc => {
    users.push({
      uid: doc.id,
      data: doc.data()
    });
  });

  return users;
} catch (error) {
  console.error('Error fetching all users:', error);
  throw error;
}
  }

/**
 * Check if Firebase is properly configured
 * @returns boolean indicating if Firebase is ready
 */
isConfigured(): boolean {
  try {
    // Check if required environment variables are present
    if (!process.env.FIREBASE_PROJECT_ID) {
      return false;
    }

    this.initializeFirebase();
    return this.initialized && !!this.db;
  } catch {
    return false;
  }
}
}