
import React, { useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { createBackup, restoreBackup } from '@/lib/backup-utils';
import { DatabaseBackup, Database } from 'lucide-react';

const BackupRestore: React.FC = () => {
  const [isRestoring, setIsRestoring] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleBackup = () => {
    createBackup();
  };
  
  const handleRestore = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setIsRestoring(true);
    try {
      await restoreBackup(file);
    } finally {
      setIsRestoring(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  
  return (
    <Card className="dashboard-card">
      <CardHeader>
        <CardTitle className="text-lg">Data Backup & Restore</CardTitle>
        <CardDescription>
          Save your progress or restore from a previous backup
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Backup your workout data, completions, and settings to a file that you can use to restore your data later.
        </p>
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row gap-2">
        <Button 
          onClick={handleBackup} 
          className="w-full sm:w-auto flex items-center gap-2"
          variant="outline"
        >
          <DatabaseBackup className="h-4 w-4" />
          Create Backup
        </Button>
        
        <div className="relative w-full sm:w-auto">
          <Button 
            onClick={() => fileInputRef.current?.click()} 
            className="w-full flex items-center gap-2"
            disabled={isRestoring}
          >
            <Database className="h-4 w-4" />
            Restore Backup
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleRestore}
            className="hidden"
            disabled={isRestoring}
          />
        </div>
      </CardFooter>
    </Card>
  );
};

export default BackupRestore;
