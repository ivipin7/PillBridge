// Notification utilities for medication reminders
export class NotificationManager {
  private static instance: NotificationManager;
  private notificationSupported: boolean;
  private permissionGranted: boolean = false;
  
  constructor() {
    this.notificationSupported = 'Notification' in window;
    this.checkPermissionStatus();
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

  private playReminderSound(audioUrl?: string): void {
    try {
      if (audioUrl) {
        // Play custom audio
        const audio = new Audio(audioUrl);
        audio.volume = 0.7;
        audio.play().catch(e => {
          console.warn('Failed to play custom audio, falling back to default:', e);
          this.playDefaultNotificationSound();
        });
      } else {
        // Play default notification sound
        this.playDefaultNotificationSound();
      }
    } catch (error) {
      console.error('Error playing audio reminder:', error);
    }
  }

  private playDefaultNotificationSound(): void {
    // Create a simple audio notification tone using Web Audio API
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800; // 800Hz tone
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.warn('Could not create audio notification:', error);
      // Fallback: try to play a simple beep if available
      if ('speechSynthesis' in window) {
        // Use speech synthesis as last resort for audio feedback
        const utterance = new SpeechSynthesisUtterance('Medication reminder');
        utterance.volume = 0.5;
        utterance.rate = 1.2;
        speechSynthesis.speak(utterance);
      }
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