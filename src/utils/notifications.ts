// Notification utilities for medication reminders
export class NotificationManager {
  private static instance: NotificationManager;
  
  static getInstance(): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager();
    }
    return NotificationManager.instance;
  }

  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission === 'denied') {
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  showMedicationReminder(medicationName: string, dosage: string, audioUrl?: string): void {
    if (Notification.permission !== 'granted') {
      return;
    }

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

    // Play audio reminder if available
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio.play().catch(console.error);
    }

    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    // Auto-close after 30 seconds
    setTimeout(() => {
      notification.close();
    }, 30000);
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
      
      if (medication.morning_dose) times.push('08:00');
      if (medication.afternoon_dose) times.push('14:00');
      if (medication.night_dose) times.push('20:00');

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
}

// Initialize notification manager
export const notificationManager = NotificationManager.getInstance();