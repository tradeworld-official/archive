import React from 'react';
import { Download } from 'lucide-react';
import { Button } from './ui/Button';

export const PDFButton: React.FC = () => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={handlePrint}
      className="no-print gap-2 border-slate-300 hover:bg-slate-100 transition-colors"
      title="Save as PDF"
    >
      <Download className="w-4 h-4" />
      <span className="hidden sm:inline">Save PDF</span>
    </Button>
  );
};
