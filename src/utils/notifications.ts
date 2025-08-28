// Notification utilities for medication reminders
export class NotificationManager {
  private static instance: NotificationManager;
  private notificationSupported: boolean;
  private permissionGranted: boolean = false;
  private audioContext: AudioContext | null = null;
  private isAudioUnlocked: boolean = false;
  
  constructor() {
    this.notificationSupported = 'Notification' in window;
    this.checkPermissionStatus();
    try {
      // Create the AudioContext once.
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      // It starts in a 'suspended' state and must be resumed by a user gesture.
      if (this.audioContext.state === 'suspended') {
        console.log('AudioContext is suspended. Waiting for user interaction to unlock.');
      }
    } catch (e) {
      console.error("Web Audio API is not supported in this browser.");
      this.audioContext = null;
    }
  }
  
  static getInstance(): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager();
    }
    return NotificationManager.instance;
  }

  private checkPermissionStatus(): void {
    if (this.notificationSupported) {
      this.permissionGranted = Notification.permission === 'granted';
      console.log('Notification permission status:', Notification.permission);
    }
  }

  async requestPermission(): Promise<boolean> {
    if (!this.notificationSupported) {
      console.warn('This browser does not support notifications - will use alerts instead');
      this.showAlertFallback('Browser notifications are not supported. You will receive alert popups instead.');
      return false;
    }

    if (Notification.permission === 'granted') {
      this.permissionGranted = true;
      console.log('Notification permissions already granted');
      return true;
    }

    if (Notification.permission === 'denied') {
      console.warn('Notification permissions denied - will use alerts instead');
      this.showAlertFallback('Browser notifications are blocked. Please enable them in your browser settings, or we will use alert popups instead.');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      this.permissionGranted = permission === 'granted';
      console.log('Notification permission result:', permission);
      
      if (permission === 'denied') {
        this.showAlertFallback('Notification permissions were denied. We will use alert popups for medication reminders.');
      }
      
      return this.permissionGranted;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      this.showAlertFallback('Could not request notification permissions. We will use alert popups instead.');
      return false;
    }
  }

  private showAlertFallback(message: string): void {
    setTimeout(() => {
      alert(message);
    }, 100);
  }

  /**
   * Attempts to resume the AudioContext. This should be called from a user-initiated event
   * (e.g., a click handler) to comply with browser autoplay policies.
   */
  public async unlockAudio(onUnlock?: () => void): Promise<void> {
    if (this.isAudioUnlocked || !this.audioContext) {
      if (this.isAudioUnlocked) {
        onUnlock?.();
      }
      return;
    }
    if (this.audioContext.state === 'suspended') {
      try {
        await this.audioContext.resume();
        this.isAudioUnlocked = this.audioContext.state === 'running';
        if (this.isAudioUnlocked) {
          console.log('AudioContext unlocked successfully.');
          onUnlock?.();
        } else {
          console.warn('AudioContext unlock failed, state is:', this.audioContext.state);
        }
      } catch (e) {
        console.error('Failed to unlock AudioContext:', e);
      }
    } else {
      this.isAudioUnlocked = true;
      console.log('AudioContext was already running.');
      onUnlock?.();
    }
  }

  public isAudioReady(): boolean {
    return this.isAudioUnlocked;
  }

  showMedicationReminder(medicationName: string, dosage: string, audioUrl?: string): void {
    console.log('Showing medication reminder:', { medicationName, dosage, permissionGranted: this.permissionGranted, notificationSupported: this.notificationSupported });
    
    if (this.notificationSupported && this.permissionGranted && Notification.permission === 'granted') {
      // Use browser notifications
      try {
        const notification = new Notification('PillBridge - Medication Reminder', {
          body: `Time to take your ${medicationName} (${dosage})`,
          icon: '/pill-icon.png',
          badge: '/pill-icon.png',
          requireInteraction: true,
          actions: [
            { action: 'taken', title: 'Mark as Taken' },
            { action: 'snooze', title: 'Remind in 10 min' }
          ]
        });

        notification.onclick = () => {
          window.focus();
          notification.close();
        };

        // Auto-close after 30 seconds
        setTimeout(() => {
          notification.close();
        }, 30000);
        
        console.log('Browser notification shown successfully');
      } catch (error) {
        console.error('Failed to show browser notification:', error);
        this.showMedicationAlert(medicationName, dosage);
      }
    } else {
      // Fallback to alert
      console.log('Using alert fallback for medication reminder');
      this.showMedicationAlert(medicationName, dosage);
    }

    // Play audio reminder regardless of notification type
    this.playReminderSound(audioUrl);
  }

  private showMedicationAlert(medicationName: string, dosage: string): void {
    const message = `🔔 MEDICATION REMINDER\n\nTime to take your ${medicationName}\nDosage: ${dosage}\n\nClick OK to acknowledge this reminder.`;
    
    // Use setTimeout to ensure the alert doesn't block other operations
    setTimeout(() => {
      alert(message);
    }, 100);
  }

  private async playReminderSound(audioUrl?: string): Promise<void> {
    if (!audioUrl || !this.audioContext) {
      this.playDefaultNotificationSound();
      return;
    }

    // If audio is not unlocked, browser will likely block playback.
    // We play the default sound as a fallback. The user needs to have interacted
    // with the page before the first reminder for custom audio to work.
    if (!this.isAudioUnlocked) {
      console.warn('AudioContext not unlocked by user gesture. Playing default sound. Please click anywhere on the page first.');
      this.playDefaultNotificationSound();
      return;
    }

    try {
      const response = await fetch(audioUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch audio: ${response.statusText}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.audioContext.destination);
      source.start(0);
    } catch (error) {
      console.error('Error playing custom audio via Web Audio API:', error);
      this.playDefaultNotificationSound(); // Fallback to default sound on error
    }
  }

  private playDefaultNotificationSound(): void {
    if (!this.audioContext) {
      console.warn('Cannot play default sound, AudioContext not available.');
      return;
    }

    // Attempt to resume context just in case it's suspended.
    // This might not work if not called from a user gesture, but it's worth a try.
    if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
    }

    try {
      // Create a simple audio notification tone using the shared AudioContext
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      oscillator.frequency.value = 800; // 800Hz tone
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
      
      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + 0.5);
    } catch (error) {
      console.warn('Could not create default audio notification:', error);
    }
  }

  showLowStockAlert(medicationName: string, currentCount: number): void {
    if (Notification.permission !== 'granted') {
      return;
    }

    const notification = new Notification('PillBridge - Low Stock Alert', {
      body: `${medicationName} is running low (${currentCount} pills remaining)`,
      icon: '/pill-icon.png',
      badge: '/pill-icon.png',
      requireInteraction: true
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  }

  scheduleReminders(medications: any[]): void {
    medications.forEach(medication => {
      const times = [];
      
      // Use custom times if available, otherwise default times
      if (medication.morning_dose) {
        times.push(medication.morning_time || '08:00');
      }
      if (medication.afternoon_dose) {
        times.push(medication.afternoon_time || '14:00');
      }
      if (medication.night_dose) {
        times.push(medication.night_time || '20:00');
      }

      times.forEach(time => {
        this.scheduleReminderForTime(medication, time);
      });
    });
  }

  private scheduleReminderForTime(medication: any, time: string): void {
    const now = new Date();
    const [hours, minutes] = time.split(':').map(Number);
    
    const reminderTime = new Date();
    reminderTime.setHours(hours, minutes, 0, 0);
    
    // If the time has passed today, schedule for tomorrow
    if (reminderTime <= now) {
      reminderTime.setDate(reminderTime.getDate() + 1);
    }
    
    const timeUntilReminder = reminderTime.getTime() - now.getTime();
    
    setTimeout(() => {
      this.showMedicationReminder(
        medication.name,
        medication.dosage,
        medication.audio_url
      );
      
      // Schedule next day
      this.scheduleReminderForTime(medication, time);
    }, timeUntilReminder);
  }

  // Test method for debugging notifications
  testNotification(): void {
    console.log('Testing notification system...');
    this.showMedicationReminder('Test Medication', '1 tablet', undefined);
  }
}

// Initialize notification manager
export const notificationManager = NotificationManager.getInstance();