
import { toast } from "sonner";
import { loadWorkouts, loadCompletions } from "./workout-utils";

// Function to create backup of app data
export const createBackup = (): void => {
  try {
    const data = {
      workouts: localStorage.getItem('fit-daily-workouts'),
      completions: localStorage.getItem('fit-daily-completions'),
      steps: localStorage.getItem('fit-daily-steps'),
      settings: localStorage.getItem('fit-daily-settings'),
      theme: localStorage.getItem('color-theme')
    };
    
    const backupStr = JSON.stringify(data);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `fit-daily-backup-${timestamp}.json`;
    
    // Create a blob and trigger download
    const blob = new Blob([backupStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    
    // Cleanup
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 0);
    
    toast.success("Backup created successfully!");
  } catch (error) {
    console.error("Error creating backup:", error);
    toast.error("Failed to create backup");
  }
};

// Function to restore data from backup
export const restoreBackup = async (file: File): Promise<boolean> => {
  try {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          if (!event.target?.result) {
            toast.error("Could not read backup file");
            resolve(false);
            return;
          }
          
          const data = JSON.parse(event.target.result as string);
          
          // Validate backup data
          if (!data.workouts || !data.completions) {
            toast.error("Invalid backup file");
            resolve(false);
            return;
          }
          
          // Restore data to localStorage
          localStorage.setItem('fit-daily-workouts', data.workouts);
          localStorage.setItem('fit-daily-completions', data.completions);
          
          if (data.steps) {
            localStorage.setItem('fit-daily-steps', data.steps);
          }
          
          if (data.settings) {
            localStorage.setItem('fit-daily-settings', data.settings);
          }
          
          if (data.theme) {
            localStorage.setItem('color-theme', data.theme);
            if (data.theme === 'dark') {
              document.documentElement.classList.add('dark');
            } else {
              document.documentElement.classList.remove('dark');
            }
          }
          
          toast.success("Backup restored successfully! Reloading app...");
          
          // Reload the app after a short delay to apply changes
          setTimeout(() => {
            window.location.reload();
          }, 1500);
          
          resolve(true);
        } catch (error) {
          console.error("Error parsing backup file:", error);
          toast.error("Failed to restore backup");
          resolve(false);
        }
      };
      
      reader.onerror = () => {
        console.error("Error reading backup file");
        toast.error("Failed to read backup file");
        resolve(false);
      };
      
      reader.readAsText(file);
    });
  } catch (error) {
    console.error("Error restoring backup:", error);
    toast.error("Failed to restore backup");
    return false;
  }
};
