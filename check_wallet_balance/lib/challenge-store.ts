import fs from 'fs';
import path from 'path';

interface ChallengeData {
  challenge: string;
  expiresAt: Date;
  type: string;
  paymentId?: string;
  amount?: number;
}

class ChallengeStore {
  private storePath: string;
  private store: Map<string, ChallengeData>;

  constructor() {
    // Use a file in the tmp directory for persistence
    this.storePath = path.join(process.cwd(), '.next', 'challenges.json');
    this.store = new Map();
    this.loadFromFile();
  }

  private loadFromFile() {
    try {
      if (fs.existsSync(this.storePath)) {
        const data = fs.readFileSync(this.storePath, 'utf8');
        const parsed = JSON.parse(data);
        
        // Convert date strings back to Date objects and check expiration
        for (const [key, value] of Object.entries(parsed)) {
          const challengeData = value as any;
          const expiresAt = new Date(challengeData.expiresAt);
          
          // Only load non-expired challenges
          if (expiresAt > new Date()) {
            this.store.set(key, {
              ...challengeData,
              expiresAt,
            });
          }
        }
      }
    } catch (error) {
      console.log('📁 Creating new challenge store file');
      // If file doesn't exist or is corrupted, start fresh
      this.store = new Map();
    }
  }

  private saveToFile() {
    try {
      // Ensure directory exists
      const dir = path.dirname(this.storePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Convert Map to object for JSON serialization
      const obj = Object.fromEntries(this.store);
      fs.writeFileSync(this.storePath, JSON.stringify(obj, null, 2));
    } catch (error) {
      console.error('❌ Failed to save challenge store:', error);
    }
  }

  set(address: string, data: ChallengeData) {
    this.store.set(address, data);
    this.saveToFile();
    console.log('💾 Stored challenge for address:', address);
  }

  get(address: string): ChallengeData | undefined {
    const data = this.store.get(address);
    
    if (!data) {
      console.log('❌ No challenge found for address:', address);
      return undefined;
    }

    // Check if expired
    if (data.expiresAt < new Date()) {
      console.log('❌ Challenge expired for address:', address);
      this.delete(address);
      return undefined;
    }

    console.log('✅ Found valid challenge for address:', address);
    return data;
  }

  delete(address: string) {
    const deleted = this.store.delete(address);
    if (deleted) {
      this.saveToFile();
      console.log('🗑️ Deleted challenge for address:', address);
    }
    return deleted;
  }

  cleanup() {
    const now = new Date();
    let cleaned = 0;
    
    for (const [address, data] of this.store.entries()) {
      if (data.expiresAt < now) {
        this.store.delete(address);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      this.saveToFile();
      console.log(`🧹 Cleaned up ${cleaned} expired challenges`);
    }
  }
}

// Global instance
const challengeStore = new ChallengeStore();

export default challengeStore;