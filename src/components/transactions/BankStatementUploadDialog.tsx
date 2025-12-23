import { useState, useRef } from 'react';
import { Upload, X, AlertCircle, Loader2, CheckCircle2, Trash2, FileText, Sparkles } from 'lucide-react';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { parseBankStatement, BankStatementParseResult } from '@/utils/bankStatementParser';
import { transactionApi } from '@/db/api';
import { TransactionFormData, CATEGORY_METADATA } from '@/types/types';
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';

interface BankStatementUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function BankStatementUploadDialog({
  open,
  onOpenChange,
  onSuccess,
}: BankStatementUploadDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [parseResult, setParseResult] = useState<BankStatementParseResult | null>(null);
  const [selectedTransactions, setSelectedTransactions] = useState<Set<number>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setParseResult(null);
      setSelectedTransactions(new Set());
    }
  };

  const handleParse = async () => {
    if (!file) return;

    try {
      setParsing(true);
      
      // The parseBankStatement function now handles PDF and AI fallback internally
      const result = await parseBankStatement(file);

      if (result.success && result.transactions.length > 0) {
        setParseResult(result);
        setSelectedTransactions(new Set(result.transactions.map((_, idx) => idx)));
        toast({
          title: result.method === 'ai' ? 'AI Magic Complete! ✨' : 'Parse Successful',
          description: `Extracted ${result.totalTransactions} transactions from ${file.name}.`,
        });
      } else {
        toast({
          title: 'Parsing Failed',
          description: result.error || 'Could not detect transactions. Try a different file format.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Failed to parse:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred during parsing.',
        variant: 'destructive',
      });
    } finally {
      setParsing(false);
    }
  };

  const handleToggleTransaction = (index: number) => {
    const newSelected = new Set(selectedTransactions);
    if (newSelected.has(index)) newSelected.delete(index);
    else newSelected.add(index);
    setSelectedTransactions(newSelected);
  };

  const handleToggleAll = () => {
    if (selectedTransactions.size === parseResult?.transactions.length) {
      setSelectedTransactions(new Set());
    } else {
      setSelectedTransactions(new Set(parseResult?.transactions.map((_, idx) => idx)));
    }
  };

  const handleSave = async () => {
    if (!parseResult || selectedTransactions.size === 0) return;

    try {
      setSaving(true);
      const transactionsToSave = parseResult.transactions.filter((_, idx) =>
        selectedTransactions.has(idx)
      );

      // Prepare bulk data for insert
      const bulkData: TransactionFormData[] = transactionsToSave.map(txn => ({
        date: txn.date,
        amount: txn.amount,
        type: txn.type,
        description: txn.description,
        merchant: txn.merchant,
        category: txn.category || 'other',
        source: 'bank_statement',
      }));

      // Use the new createMany method for fast bulk insert
      await transactionApi.createMany(bulkData);

      toast({
        title: 'Import Complete',
        description: `Successfully saved ${bulkData.length} transactions instantly.`,
      });

      handleClose();
      onSuccess();

    } catch (error) {
      console.error("Save failed", error);
      toast({ title: 'Error', description: 'Failed to save transactions', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setParseResult(null);
    setSelectedTransactions(new Set());
    if (fileInputRef.current) fileInputRef.current.value = '';
    onOpenChange(false);
  };

  const formatCurrency = (amount: number) => `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-[95vw] sm:w-full max-w-7xl max-h-[90vh] flex flex-col overflow-hidden p-0 sm:p-6 rounded-xl">
        <DialogHeader className="px-4 py-4 sm:px-0 sm:py-0 border-b sm:border-none">
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Upload className="h-5 w-5 text-primary" />
            Smart Statement Upload
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Supports CSV, Excel, and PDF. Powered by AI for complex formats.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 px-4 py-4 sm:px-0 flex-1 overflow-auto">
          {!parseResult ? (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-border rounded-lg p-6 sm:p-12 text-center hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                   {file ? <FileText className="h-6 w-6 text-primary" /> : <Upload className="h-6 w-6 text-muted-foreground" />}
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium truncate max-w-[200px] sm:max-w-none mx-auto">
                    {file ? file.name : 'Click to select file'}
                  </p>
                  <p className="text-xs text-muted-foreground">CSV, Excel, PDF</p>
                </div>
                <Input 
                  ref={fileInputRef}
                  type="file" 
                  accept=".csv,.xlsx,.xls,.pdf" // Added .pdf
                  className="hidden" 
                  onChange={handleFileChange} 
                />
              </div>

              <Button onClick={handleParse} disabled={!file || parsing} className="w-full" size="lg">
                {parsing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                {parsing ? 'Analyzing with AI...' : 'Parse Statement'}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Stats Bar */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 sm:p-4 bg-muted/50 rounded-lg border">
                <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm">Found {parseResult.totalTransactions} transactions</p>
                    {parseResult.method === 'ai' && (
                        <Badge variant="secondary" className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 flex gap-1 items-center">
                            <Sparkles className="h-3 w-3" /> AI Parsed
                        </Badge>
                    )}
                </div>
                
                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                  <Badge variant="outline" className="text-xs">{selectedTransactions.size} selected</Badge>
                  <Button variant="ghost" size="sm" className="h-8 text-xs ml-auto" onClick={handleToggleAll}>
                    {selectedTransactions.size === parseResult.transactions.length ? 'Deselect All' : 'Select All'}
                  </Button>
                </div>
              </div>

              {/* Table */}
              <div className="border rounded-lg overflow-hidden w-full bg-background">
                <div className="max-h-[50vh] sm:max-h-[60vh] overflow-auto">
                  <Table className="min-w-[800px]">
                    <TableHeader className="sticky top-0 bg-background z-10 shadow-sm">
                      <TableRow>
                        <TableHead className="w-12"><Checkbox checked={selectedTransactions.size === parseResult.transactions.length} onCheckedChange={handleToggleAll} /></TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parseResult.transactions.map((txn, index) => (
                        <TableRow key={index}>
                          <TableCell><Checkbox checked={selectedTransactions.has(index)} onCheckedChange={() => handleToggleTransaction(index)} /></TableCell>
                          <TableCell className="whitespace-nowrap font-mono text-xs">{format(new Date(txn.date), 'dd MMM yyyy')}</TableCell>
                          <TableCell className="max-w-[200px] truncate" title={txn.description}>{txn.description}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="whitespace-nowrap capitalize">{txn.category || 'Other'}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={txn.type === 'income' ? 'default' : 'secondary'} className={txn.type === 'income' ? 'bg-green-600' : ''}>
                                {txn.type}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-medium font-mono">{formatCurrency(txn.amount)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-3 bg-card/90 border-t border-border p-4 sm:items-center sm:justify-between">
          <Button variant="outline" onClick={handleClose} disabled={saving} className="w-full sm:w-auto order-2 sm:order-1">Cancel</Button>
          {parseResult && (
            <Button onClick={handleSave} disabled={selectedTransactions.size === 0 || saving} className="w-full sm:w-auto bg-primary hover:bg-primary/90 order-1 sm:order-2">
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
              {saving ? 'Saving...' : `Save ${selectedTransactions.size} Txns`}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}