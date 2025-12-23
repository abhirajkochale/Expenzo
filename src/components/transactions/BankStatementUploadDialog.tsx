import { useState, useRef, useEffect } from 'react';
import { Upload, X, Loader2, CheckCircle2, FileText, Sparkles, AlertTriangle } from 'lucide-react';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { parseBankStatement, BankStatementParseResult, ParsedBankTransaction } from '@/utils/bankStatementParser';
import { transactionApi } from '@/db/api';
import { TransactionFormData } from '@/types/types';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
  
  // We store the result in a local state that we can EDIT
  const [editableTransactions, setEditableTransactions] = useState<ParsedBankTransaction[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [parseMethod, setParseMethod] = useState<'ai' | 'regex' | undefined>(undefined);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setEditableTransactions([]);
      setSelectedIndices(new Set());
    }
  };

  const handleParse = async () => {
    if (!file) return;

    try {
      setParsing(true);
      const result = await parseBankStatement(file);

      if (result.success && result.transactions.length > 0) {
        setEditableTransactions(result.transactions);
        setParseMethod(result.method);
        // Select all by default
        setSelectedIndices(new Set(result.transactions.map((_, idx) => idx)));
        
        toast({
          title: result.method === 'ai' ? 'AI Processing Complete' : 'Parse Successful',
          description: `Review the ${result.totalTransactions} extracted transactions below.`,
        });
      } else {
        toast({
          title: 'Parsing Failed',
          description: result.error || 'No transactions found. Please try a clearer image or PDF.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Failed to parse:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setParsing(false);
    }
  };

  // --- EDITING LOGIC ---
  const handleTransactionChange = (index: number, field: keyof ParsedBankTransaction, value: any) => {
    const updated = [...editableTransactions];
    updated[index] = { ...updated[index], [field]: value };
    setEditableTransactions(updated);
  };

  const handleToggleIndex = (index: number) => {
    const newSet = new Set(selectedIndices);
    if (newSet.has(index)) newSet.delete(index);
    else newSet.add(index);
    setSelectedIndices(newSet);
  };

  const handleToggleAll = () => {
    if (selectedIndices.size === editableTransactions.length) {
      setSelectedIndices(new Set());
    } else {
      setSelectedIndices(new Set(editableTransactions.map((_, idx) => idx)));
    }
  };

  const handleSave = async () => {
    if (editableTransactions.length === 0 || selectedIndices.size === 0) return;

    try {
      setSaving(true);
      const transactionsToSave = editableTransactions.filter((_, idx) =>
        selectedIndices.has(idx)
      );

      const bulkData: TransactionFormData[] = transactionsToSave.map(txn => ({
        date: txn.date,
        amount: Number(txn.amount), // Ensure number
        type: txn.type,
        description: txn.description,
        merchant: txn.merchant || 'Unknown',
        category: txn.category || 'other',
        source: 'bank_statement',
      }));

      await transactionApi.createMany(bulkData);

      toast({
        title: 'Import Complete',
        description: `Successfully saved ${bulkData.length} transactions.`,
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
    setEditableTransactions([]);
    setSelectedIndices(new Set());
    if (fileInputRef.current) fileInputRef.current.value = '';
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-[95vw] sm:w-full max-w-7xl max-h-[90vh] flex flex-col overflow-hidden p-0 sm:p-6 rounded-xl">
        <DialogHeader className="px-4 py-4 sm:px-0 sm:py-0 border-b sm:border-none">
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Upload className="h-5 w-5 text-primary" />
            Smart Statement Upload
          </DialogTitle>
          <DialogDescription>
             Review and edit extracted data before saving to ensure accuracy.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 px-4 py-4 sm:px-0 flex-1 overflow-auto">
          {editableTransactions.length === 0 ? (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-border rounded-lg p-6 sm:p-12 text-center hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                   {file ? <FileText className="h-6 w-6 text-primary" /> : <Upload className="h-6 w-6 text-muted-foreground" />}
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium truncate max-w-[200px] sm:max-w-none mx-auto">
                    {file ? file.name : 'Click to select file'}
                  </p>
                  <p className="text-xs text-muted-foreground">CSV, Excel, PDF (Max 5MB)</p>
                </div>
                <Input 
                  ref={fileInputRef}
                  type="file" 
                  accept=".csv,.xlsx,.xls,.pdf" 
                  className="hidden" 
                  onChange={handleFileChange} 
                />
              </div>

              <Button onClick={handleParse} disabled={!file || parsing} className="w-full" size="lg">
                {parsing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                {parsing ? 'Analyzing Statement...' : 'Parse Statement'}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Stats & Actions */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 sm:p-4 bg-muted/50 rounded-lg border">
                <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm">Reviewing {editableTransactions.length} transactions</p>
                    {parseMethod === 'ai' && (
                        <Badge variant="secondary" className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                           AI Parsed
                        </Badge>
                    )}
                </div>
                
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Button variant="ghost" size="sm" className="h-8 text-xs ml-auto" onClick={handleToggleAll}>
                    {selectedIndices.size === editableTransactions.length ? 'Deselect All' : 'Select All'}
                  </Button>
                </div>
              </div>

              {/* Editable Table */}
              <div className="border rounded-lg overflow-hidden w-full bg-background">
                <div className="max-h-[50vh] sm:max-h-[60vh] overflow-auto">
                  <Table className="min-w-[900px]">
                    <TableHeader className="sticky top-0 bg-background z-10 shadow-sm">
                      <TableRow>
                        <TableHead className="w-12"><Checkbox checked={selectedIndices.size === editableTransactions.length} onCheckedChange={handleToggleAll} /></TableHead>
                        <TableHead className="w-[140px]">Date</TableHead>
                        <TableHead className="w-[200px]">Description</TableHead>
                        <TableHead className="w-[140px]">Category</TableHead>
                        <TableHead className="w-[100px]">Type</TableHead>
                        <TableHead className="text-right w-[120px]">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {editableTransactions.map((txn, index) => (
                        <TableRow key={index} className={!selectedIndices.has(index) ? "opacity-50" : ""}>
                          <TableCell>
                             <Checkbox checked={selectedIndices.has(index)} onCheckedChange={() => handleToggleIndex(index)} />
                          </TableCell>
                          
                          {/* Date Input */}
                          <TableCell>
                            <Input 
                                type="date" 
                                value={txn.date} 
                                onChange={(e) => handleTransactionChange(index, 'date', e.target.value)}
                                className="h-8 w-full text-xs"
                            />
                          </TableCell>
                          
                          {/* Description Input */}
                          <TableCell>
                            <Input 
                                value={txn.description} 
                                onChange={(e) => handleTransactionChange(index, 'description', e.target.value)}
                                className="h-8 w-full text-xs"
                            />
                          </TableCell>
                          
                          {/* Category Select */}
                          <TableCell>
                             <Select 
                               value={txn.category} 
                               onValueChange={(val) => handleTransactionChange(index, 'category', val)}
                             >
                                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="food">Food</SelectItem>
                                    <SelectItem value="transport">Transport</SelectItem>
                                    <SelectItem value="shopping">Shopping</SelectItem>
                                    <SelectItem value="utilities">Utilities</SelectItem>
                                    <SelectItem value="rent">Rent</SelectItem>
                                    <SelectItem value="healthcare">Healthcare</SelectItem>
                                    <SelectItem value="investment">Investment</SelectItem>
                                    <SelectItem value="salary">Salary</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                             </Select>
                          </TableCell>

                          {/* Type Select */}
                          <TableCell>
                             <Select 
                               value={txn.type} 
                               onValueChange={(val) => handleTransactionChange(index, 'type', val)}
                             >
                                <SelectTrigger className={`h-8 text-xs w-[90px] ${txn.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="expense">Expense</SelectItem>
                                    <SelectItem value="income">Income</SelectItem>
                                </SelectContent>
                             </Select>
                          </TableCell>

                          {/* Amount Input */}
                          <TableCell className="text-right">
                            <Input 
                                type="number" 
                                value={txn.amount} 
                                onChange={(e) => handleTransactionChange(index, 'amount', parseFloat(e.target.value))}
                                className="h-8 w-full text-xs text-right"
                            />
                          </TableCell>
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
          {editableTransactions.length > 0 && (
            <Button onClick={handleSave} disabled={selectedIndices.size === 0 || saving} className="w-full sm:w-auto bg-primary hover:bg-primary/90 order-1 sm:order-2">
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
              {saving ? 'Saving...' : `Save ${selectedIndices.size} Transactions`}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}