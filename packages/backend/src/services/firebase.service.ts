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

      console.log('🔍 [DEBUG] Fetching expenses from Firebase:');
      console.log(`   - User ID: ${uid}`);
      console.log(`   - Start Date: ${startDate || 'None (all data)'}`);
      console.log(`   - End Date: ${endDate || 'None (all data)'}`);
      console.log(`   - Collection Path: users2/${uid}/expenses`);

      // Build the query with optional date filtering
      let query: admin.firestore.Query = this.db.collection('users2').doc(uid).collection('expenses');

      // Apply date filtering if provided
      if (startDate) {
        const startTimestamp = admin.firestore.Timestamp.fromDate(new Date(startDate + 'T00:00:00.000Z'));
        console.log(`   - Start Timestamp: ${startTimestamp.toDate().toISOString()}`);
        query = query.where('date', '>=', startTimestamp);
      }

      if (endDate) {
        const endTimestamp = admin.firestore.Timestamp.fromDate(new Date(endDate + 'T23:59:59.999Z'));
        console.log(`   - End Timestamp: ${endTimestamp.toDate().toISOString()}`);
        query = query.where('date', '<=', endTimestamp);
      }

      // Order by date for consistent results
      query = query.orderBy('date', 'desc');

      const expensesSnapshot = await query.get();
      console.log(`   - Documents found: ${expensesSnapshot.size}`);
      
      const expenses: Array<{
        amount: number;
        category: string,
        currencyCode: string,
        date: any,
        emotion: number,
        name: string
      }> = [];

      let index = 0;
      expensesSnapshot.forEach((doc: admin.firestore.QueryDocumentSnapshot) => {
        index++;
        const data = doc.data();
        console.log(`   - Document ${index}:`, {
          id: doc.id,
          amount: data.amount,
          category: data.category,
          date: data.date?.toDate?.() || data.date,
          emotion: data.emotion,
          name: data.name
        });
        expenses.push({
          amount: data.amount,
          category: data.category,
          currencyCode: data.currencyCode,
          date: data.date,
          emotion: data.emotion,
          name: data.name
        });
      });

      // Return empty array instead of throwing error when no expenses found
      // This is a normal situation for new users or specific date ranges
      if (expenses.length === 0) {
        const dateInfo = startDate || endDate ? ` between ${startDate || 'start'} and ${endDate || 'end'}` : '';
        console.log(`⚠️ [DEBUG] No expenses found for user with UID ${uid}${dateInfo} - returning empty array`);
      } else {
        console.log(`✅ [DEBUG] Successfully fetched ${expenses.length} expense(s) for user ${uid}`);
      }

      return expenses;
    } catch (error) {
      const errorMessage = `Error fetching expense data for UID ${uid}: ${error instanceof Error ? error.message : String(error)}`;
      console.error(errorMessage);
      console.error('Full error details:', error);
      
      // Re-throw with more context
      if (error instanceof Error) {
        error.message = errorMessage;
      }
      throw error;
    }
  }




  /**
   * Get user data from Firebase
   * @param uid - User ID
   * @returns User data from Firestore
   */
  async getUserData(uid: string): Promise<any> {
    try {
      this.initializeFirebase();
      if (!this.db) throw new Error('Firestore not initialized');

      const userDoc = await this.db.collection('users2').doc(uid).get();

      if (!userDoc.exists) {
        throw new Error(`User with UID ${uid} not found`);
      }

      // Extract and return only the data, not the full QueryDocumentSnapshot
      const userData = userDoc.data();
      console.log(`✅ Fetched user data for ${uid}:`, JSON.stringify(userData, null, 2));
      
      return userData;
    } catch (error) {
      const errorMessage = `Error fetching user data for UID ${uid}: ${error instanceof Error ? error.message : String(error)}`;
      console.error(errorMessage);
      console.error('Full error details:', error);
      
      // Re-throw with more context
      if (error instanceof Error) {
        error.message = errorMessage;
      }
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
   * Save prompt response to Firebase
   * Saves the OpenAI response to /users2/{uid}/recommendations collection
   * @param uid - User ID
   * @param templateId - Template ID used
   * @param templateName - Template name
   * @param prompt - The prompt that was sent to OpenAI
   * @param response - The OpenAI response
   * @returns Document ID of saved response
   */
  async savePromptResponse(
    uid: string,
    templateId: string,
    templateName: string,
    prompt: string,
    response: string
  ): Promise<string> {
    this.initializeFirebase();

    if (!this.db) {
      throw new Error('Firestore is not initialized');
    }

    try {
      const promptData = {
        templateId,
        templateName,
        prompt,
        response,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        createdAt: new Date().toISOString()
      };

      // Save to /users2/{uid}/prompts collection
      const docRef = await this.db
        .collection('users2')
        .doc(uid)
        .collection('recommendations')
        .add(promptData);

      console.log(`✅ Saved prompt response for user ${uid} to /users2/${uid}/recommendations/${docRef.id}`);

      return docRef.id;
    } catch (error) {
      const errorMessage = `Error saving prompt response for user ${uid}: ${error instanceof Error ? error.message : String(error)}`;
      console.error(errorMessage);
      throw new Error(errorMessage);
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