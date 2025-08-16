// Test utility for validating real-time tag sync functionality
// This can be used in browser console for testing

export interface TagSyncTestResult {
  success: boolean;
  message: string;
  details?: any;
}

export class TagSyncTester {
  private ws: WebSocket | null = null;
  private testResults: TagSyncTestResult[] = [];

  constructor(private token: string, private projectId: string) {}

  async runAllTests(): Promise<TagSyncTestResult[]> {
    this.testResults = [];
    
    console.log('🧪 Starting Tag Sync Tests...');
    
    await this.testConnection();
    await this.testAuthentication();
    await this.testSubscription();
    await this.testTagSync();
    await this.testPing();
    
    this.cleanup();
    
    console.log('✅ Tag Sync Tests Completed');
    console.table(this.testResults);
    
    return this.testResults;
  }

  private async testConnection(): Promise<void> {
    return new Promise((resolve) => {
      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host;
        const url = `${protocol}//${host}/ws/tags?token=${encodeURIComponent(this.token)}`;
        
        this.ws = new WebSocket(url);
        
        const timeout = setTimeout(() => {
          this.addResult(false, 'Connection test failed: timeout');
          resolve();
        }, 5000);
        
        this.ws.onopen = () => {
          clearTimeout(timeout);
          this.addResult(true, 'WebSocket connection established');
          resolve();
        };
        
        this.ws.onerror = (error) => {
          clearTimeout(timeout);
          this.addResult(false, 'WebSocket connection failed', error);
          resolve();
        };
        
        this.ws.onclose = (event) => {
          if (event.code !== 1000) {
            this.addResult(false, `WebSocket closed unexpectedly: ${event.code} ${event.reason}`);
          }
        };
        
      } catch (error) {
        this.addResult(false, 'Connection test error', error);
        resolve();
      }
    });
  }

  private async testAuthentication(): Promise<void> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.addResult(false, 'Authentication test skipped: no connection');
      return;
    }

    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        this.addResult(false, 'Authentication test failed: timeout');
        resolve();
      }, 3000);

      const messageHandler = (event: MessageEvent) => {
        try {
          const response = JSON.parse(event.data);
          if (response.type === 'error' && response.error.includes('auth')) {
            clearTimeout(timeout);
            this.addResult(false, 'Authentication failed', response);
            this.ws!.removeEventListener('message', messageHandler);
            resolve();
          }
        } catch (error) {
          // Ignore parsing errors for this test
        }
      };

      if (this.ws) {
        this.ws.addEventListener('message', messageHandler);
      }
      
      // If we get here without auth errors, authentication passed
      setTimeout(() => {
        clearTimeout(timeout);
        this.addResult(true, 'Authentication successful');
        this.ws!.removeEventListener('message', messageHandler);
        resolve();
      }, 1000);
    });
  }

  private async testSubscription(): Promise<void> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.addResult(false, 'Subscription test skipped: no connection');
      return;
    }

    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        this.addResult(false, 'Subscription test failed: timeout');
        resolve();
      }, 3000);

      const messageHandler = (event: MessageEvent) => {
        try {
          const response = JSON.parse(event.data);
          if (response.type === 'tags_updated' && response.projectId === this.projectId) {
            clearTimeout(timeout);
            this.addResult(true, 'Project subscription successful', { tagCount: response.tags?.length || 0 });
            this.ws!.removeEventListener('message', messageHandler);
            resolve();
          } else if (response.type === 'error') {
            clearTimeout(timeout);
            this.addResult(false, 'Subscription failed', response);
            this.ws!.removeEventListener('message', messageHandler);
            resolve();
          }
        } catch (error) {
          // Ignore parsing errors
        }
      };

      if (this.ws) {
        this.ws.addEventListener('message', messageHandler);
      }
      
      // Send subscription message
      if (this.ws) {
        this.ws.send(JSON.stringify({
        type: 'subscribe',
        projectId: this.projectId
      }));
      }
    });
  }

  private async testTagSync(): Promise<void> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.addResult(false, 'Tag sync test skipped: no connection');
      return;
    }

    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        this.addResult(false, 'Tag sync test failed: timeout');
        resolve();
      }, 10000);

      let queueReceived = false;
      let updateReceived = false;

      const messageHandler = (event: MessageEvent) => {
        try {
          const response = JSON.parse(event.data);
          
          if (response.type === 'sync_queued') {
            queueReceived = true;
            console.log('📤 Sync queued:', response.syncId);
          } else if (response.type === 'tags_updated') {
            updateReceived = true;
            console.log('📥 Tags updated:', response.parsedCount, 'tags');
            
            if (queueReceived) {
              clearTimeout(timeout);
              this.addResult(true, 'Tag sync successful', { 
                parsedCount: response.parsedCount,
                syncId: response.syncId 
              });
              this.ws!.removeEventListener('message', messageHandler);
              resolve();
            }
          } else if (response.type === 'error') {
            clearTimeout(timeout);
            this.addResult(false, 'Tag sync failed', response);
            this.ws!.removeEventListener('message', messageHandler);
            resolve();
          }
        } catch (error) {
          // Ignore parsing errors
        }
      };

      if (this.ws) {
        this.ws.addEventListener('message', messageHandler);
      }
      
      // Send test ST code
      const testSTCode = `
PROGRAM TestProgram
  VAR
    TestMotor : BOOL; // address=O:0.0 Test motor output
    TestSensor : BOOL; // address=I:0.0 Test sensor input
    TestCounter : INT := 0; // Test counter variable
  END_VAR
  
  TestMotor := TestSensor;
  TestCounter := TestCounter + 1;
END_PROGRAM
      `;

      if (this.ws) {
        this.ws.send(JSON.stringify({
        type: 'sync_tags',
        projectId: this.projectId,
        vendor: 'rockwell',
        stCode: testSTCode,
        debounceMs: 100 // Faster for testing
      }));
      }
    });
  }

  private async testPing(): Promise<void> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.addResult(false, 'Ping test skipped: no connection');
      return;
    }

    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        this.addResult(false, 'Ping test failed: timeout');
        resolve();
      }, 3000);

      const messageHandler = (event: MessageEvent) => {
        try {
          const response = JSON.parse(event.data);
          if (response.type === 'pong') {
            clearTimeout(timeout);
            this.addResult(true, 'Ping/pong successful');
            this.ws!.removeEventListener('message', messageHandler);
            resolve();
          }
        } catch (error) {
          // Ignore parsing errors
        }
      };

      if (this.ws) {
        this.ws.addEventListener('message', messageHandler);
      }
      
      // Send ping
      if (this.ws) {
        this.ws.send(JSON.stringify({ type: 'ping' }));
      }
    });
  }

  private addResult(success: boolean, message: string, details?: any): void {
    this.testResults.push({ success, message, details });
    console.log(success ? '✅' : '❌', message, details || '');
  }

  private cleanup(): void {
    if (this.ws) {
      this.ws.close(1000, 'Test completed');
      this.ws = null;
    }
  }
}

// Helper function to run tests from browser console
export async function testTagSync(projectId: string): Promise<TagSyncTestResult[]> {
  const token = localStorage.getItem('authToken');
  if (!token) {
    console.error('❌ No auth token found. Please log in first.');
    return [{ success: false, message: 'No auth token found' }];
  }

  const tester = new TagSyncTester(token, projectId);
  return await tester.runAllTests();
}

// Make it available globally for console testing
if (typeof window !== 'undefined') {
  (window as any).testTagSync = testTagSync;
  console.log('🧪 Tag sync tester available. Use: testTagSync("your-project-id")');
}
