import { useEffect, useState, useRef } from 'react';
import { MainLayout } from '@/components/layouts/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  User, Mail, Wallet, Globe, Shield, 
  FileText, LogOut, Save, Moon, Sun, Laptop, Loader2, Upload, AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useTheme } from '@/hooks/useTheme'; 
import { transactionApi } from '@/db/api'; 
import { supabase } from '@/lib/supabase';
import { format, parseISO, isWeekend } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useAuth } from '@/contexts/AuthContext';

// --- STYLES FOR SPATIAL UI ---
const spatialStyles = `
  /* BASE (LIGHT MODE) */
  .glass-card {
    background: rgba(255, 255, 255, 0.65);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.6);
    box-shadow: 
      0 4px 24px -1px rgba(0, 0, 0, 0.05),
      inset 0 0 20px rgba(255, 255, 255, 0.5);
    transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  }
  
  .glass-card:hover {
    background: rgba(255, 255, 255, 0.85);
    transform: translateY(-2px);
    box-shadow: 
      0 12px 40px -5px rgba(0, 0, 0, 0.1),
      inset 0 0 20px rgba(255, 255, 255, 0.8);
    border-color: rgba(255, 255, 255, 1);
  }

  /* DARK MODE OVERRIDES */
  .dark .glass-card {
    background: rgba(255, 255, 255, 0.03);
    backdrop-filter: blur(16px);
    border: 1px solid rgba(255, 255, 255, 0.08);
    box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
  }
  
  .dark .glass-card:hover {
    background: rgba(255, 255, 255, 0.06);
    border-color: rgba(255, 255, 255, 0.15);
    box-shadow: 0 10px 40px -10px rgba(0, 0, 0, 0.5);
  }

  /* INPUT FIELDS GLASS STYLE */
  .glass-input {
    background: rgba(255, 255, 255, 0.5);
    border: 1px solid rgba(0, 0, 0, 0.1);
    color: inherit;
  }
  .dark .glass-input {
    background: rgba(0, 0, 0, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: white;
  }
  .dark .glass-input:focus {
    border-color: rgba(16, 185, 129, 0.5); /* Emerald focus */
    background: rgba(0, 0, 0, 0.4);
  }

  /* Background Grid Pattern */
  .spatial-grid {
    background-image: 
      linear-gradient(rgba(0, 0, 0, 0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(0, 0, 0, 0.03) 1px, transparent 1px);
    background-size: 40px 40px;
    mask-image: radial-gradient(circle at center, black 60%, transparent 100%);
  }
  .dark .spatial-grid {
    background-image: 
      linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
  }
`;

export default function SettingsPage() {
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);
  const { setTheme, theme } = useTheme();
  const { toast } = useToast();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { refreshUser } = useAuth(); 

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    role: 'Guardian User',
    currency: 'INR',
    monthlyIncome: '',
    financialGoal: 'savings',
    guardianMode: 'balanced',
    emailNotifications: true,
    marketingEmails: false,
    avatarUrl: '',
  });

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const metaName = user.user_metadata?.username;
        const emailName = user.email?.split('@')[0];
        const avatarUrl = user.user_metadata?.avatar_url || '';
        
        setFormData(prev => ({
          ...prev,
          email: user.email || '',
          username: metaName || emailName || 'User',
          role: 'Pro Member',
          avatarUrl: avatarUrl
        }));
      }
    };
    fetchUser();
  }, []);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // --- UPDATED SAVE FUNCTION ---
  const handleSave = async () => {
    setLoading(true);
    try {
        // We only save the URL string to metadata, not the file itself
        const { error } = await supabase.auth.updateUser({
            data: { 
                username: formData.username,
                avatar_url: formData.avatarUrl 
            }
        });

        if (error) throw error;
        await refreshUser(); 
        
        toast({
            title: "Settings Updated",
            description: "Your profile has been updated everywhere.",
        });
    } catch (error) {
        toast({
            title: "Error",
            description: "Failed to save settings.",
            variant: "destructive"
        });
    } finally {
        setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  // --- UPDATED FILE UPLOAD LOGIC ---
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0];
      if (!file) return;

      // 1. Validate File Size (2MB)
      if (file.size > 2 * 1024 * 1024) { 
        toast({ title: "File too large", description: "Please upload an image smaller than 2MB.", variant: "destructive" });
        return;
      }

      setUploadingAvatar(true);

      // 2. Upload to Supabase Storage (Bucket: 'avatars')
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) {
        console.error(uploadError);
        throw new Error("Failed to upload image. Ensure you have a public 'avatars' bucket.");
      }

      // 3. Get the Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // 4. Update State with URL
      setFormData(prev => ({ ...prev, avatarUrl: publicUrl }));
      toast({ title: "Image Uploaded", description: "Click 'Save Changes' to persist this change." });

    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      toast({ 
        title: "Upload Failed", 
        description: error.message || "Could not upload image.", 
        variant: "destructive" 
      });
    } finally {
      setUploadingAvatar(false);
    }
  };

  // --- REPORT GENERATOR ---
  const generateAnnualReport = async () => {
    try {
      setGeneratingReport(true);
      const transactions = await transactionApi.getAll();
      
      if (!transactions || transactions.length === 0) {
        toast({ title: "No Data", description: "Add transactions to generate a report.", variant: "destructive" });
        setGeneratingReport(false);
        return;
      }

      const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
      const expenseTrans = transactions.filter(t => t.type === 'expense');
      const totalExpense = expenseTrans.reduce((acc, t) => acc + t.amount, 0);
      const netSavings = totalIncome - totalExpense;
      const savingsRate = totalIncome > 0 ? ((netSavings / totalIncome) * 100).toFixed(1) : '0';

      const categoryMap: Record<string, { amount: number; count: number }> = {};
      expenseTrans.forEach(t => {
        if (!categoryMap[t.category]) categoryMap[t.category] = { amount: 0, count: 0 };
        categoryMap[t.category].amount += t.amount;
        categoryMap[t.category].count += 1;
      });
      const sortedCategories = Object.entries(categoryMap)
        .sort((a, b) => b[1].amount - a[1].amount)
        .slice(0, 5); 

      let weekendSpend = 0;
      expenseTrans.forEach(t => {
        if (isWeekend(parseISO(t.date))) weekendSpend += t.amount;
      });
      const weekendPercent = totalExpense > 0 ? ((weekendSpend / totalExpense) * 100).toFixed(0) : '0';
      const smallPurchases = expenseTrans.filter(t => t.amount < 500).length;
      const smallPurchaseTotal = expenseTrans.filter(t => t.amount < 500).reduce((sum, t) => sum + t.amount, 0);

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      const primaryColor = [16, 185, 129]; 
      const secondaryColor = [75, 85, 99]; 

      // Header
      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.rect(0, 0, pageWidth, 40, 'F');
      
      doc.setFontSize(26);
      doc.setTextColor(255, 255, 255);
      doc.text("Expenzo Intelligence Report", 14, 25);
      
      doc.setFontSize(10);
      doc.text(`Prepared for: ${formData.username.toUpperCase()}`, pageWidth - 14, 20, { align: 'right' });
      doc.text(`Generated: ${format(new Date(), 'PP')}`, pageWidth - 14, 28, { align: 'right' });

      let healthScore = 50;
      if (Number(savingsRate) > 20) healthScore += 20;
      if (Number(savingsRate) > 50) healthScore += 10;
      if (Number(weekendPercent) < 30) healthScore += 10;
      if (netSavings < 0) healthScore -= 30;
      healthScore = Math.max(0, Math.min(100, healthScore));

      doc.setTextColor(0, 0, 0);
      doc.setFontSize(14);
      doc.text("1. Financial Health Check", 14, 55);
      
      doc.setDrawColor(200, 200, 200);
      doc.roundedRect(14, 60, pageWidth - 28, 30, 3, 3, 'S');
      doc.setFontSize(30);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text(`${healthScore}/100`, 25, 82);
      
      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      let healthText = "Fair. Room for optimization.";
      if (healthScore > 80) healthText = "Excellent! You are a master saver.";
      else if (healthScore < 40) healthText = "Critical. Immediate action required.";
      doc.text(healthText, 80, 75);
      doc.setFontSize(10);
      doc.text(`Based on savings rate (${savingsRate}%) & spending patterns.`, 80, 82);

      autoTable(doc, {
        startY: 100,
        head: [['Metric', 'Value', 'Insight']],
        body: [
          ['Total Inflow', `INR ${totalIncome.toLocaleString()}`, 'Your earning power.'],
          ['Total Outflow', `INR ${totalExpense.toLocaleString()}`, 'Total consumption.'],
          ['Net Savings', `INR ${netSavings.toLocaleString()}`, netSavings > 0 ? 'Surplus available to invest.' : 'Deficit! You are burning cash.'],
          ['Avg. Spend / Day', `INR ${(totalExpense / 30).toFixed(0)}`, 'Daily burn rate.'],
        ],
        theme: 'grid',
        headStyles: { fillColor: primaryColor as any },
        columnStyles: { 0: { fontStyle: 'bold' } }
      });

      let finalY = (doc as any).lastAutoTable.finalY || 150;
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text("2. Where Your Money Really Goes", 14, finalY + 15);
      
      const catData = sortedCategories.map(([cat, data]) => [
        cat,
        `INR ${data.amount.toLocaleString()}`,
        `${((data.amount / totalExpense) * 100).toFixed(1)}%`,
        data.count > 10 ? 'High Frequency' : 'Occasional'
      ]);

      autoTable(doc, {
        startY: finalY + 20,
        head: [['Category', 'Amount', '% Share', 'Behavior']],
        body: catData,
        theme: 'striped',
        headStyles: { fillColor: secondaryColor as any }
      });

      doc.addPage();
      
      doc.setFillColor(240, 240, 240);
      doc.rect(0, 0, pageWidth, 25, 'F');
      doc.setFontSize(16);
      doc.setTextColor(50, 50, 50);
      doc.text("Behavioral Analysis & Recommendations", 14, 17);

      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text("3. Hidden Habits Identified", 14, 40);

      doc.setFontSize(11);
      doc.setTextColor(80, 80, 80);
      
      const smallPurchaseText = `Micro-Spending Alert: You made ${smallPurchases} purchases under INR 500, totaling INR ${smallPurchaseTotal.toLocaleString()}.`;
      const weekendText = `Weekend Effect: ${weekendPercent}% of your spending happens on weekends (Sat/Sun).`;
      
      const bullet1 = `• ${smallPurchaseText}`;
      const bullet2 = `• ${weekendText}`;
      
      const splitBullet1 = doc.splitTextToSize(bullet1, pageWidth - 30);
      const splitBullet2 = doc.splitTextToSize(bullet2, pageWidth - 30);
      
      doc.text(splitBullet1, 14, 50);
      doc.text(splitBullet2, 14, 50 + (splitBullet1.length * 5) + 5);

      let yPos = 100;
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text("4. The Expenzo Action Plan", 14, yPos);

      const actionData = [
        ['STOP', 'Impulsive Micro-Spending', 'Implement a "24-hour rule" for any non-essential purchase under INR 500.'],
        ['START', 'Zero-Spend Days', 'Designate 1 day a week (e.g., Tuesday) where you spend exactly INR 0.'],
        ['OPTIMIZE', 'Top Category Reduction', `Your highest spend is ${sortedCategories[0]?.[0] || 'Unknown'}. Reduce this by 10% next month.`]
      ];

      autoTable(doc, {
        startY: yPos + 5,
        head: [['Action', 'Focus Area', 'Specific Strategy']],
        body: actionData,
        theme: 'grid',
        headStyles: { fillColor: [0, 0, 0] }, 
        styles: { fontSize: 11, cellPadding: 5 },
        columnStyles: { 0: { fontStyle: 'bold', textColor: [200, 0, 0] } } 
      });

      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text("Generated by Expenzo AI. Not financial advice.", 14, pageHeight - 10);

      doc.save(`Expenzo_Deep_Analysis_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      toast({ title: "Deep Analysis Ready", description: "Your comprehensive report has been downloaded." });

    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "Could not generate report.", variant: "destructive" });
    } finally {
      setGeneratingReport(false);
    }
  };

  return (
    <MainLayout>
      <style>{spatialStyles}</style>
      
      {/* BACKGROUND AMBIENCE */}
      <div className="fixed inset-0 z-0 pointer-events-none">
         <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-cyan-200/40 dark:bg-cyan-900/10 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-normal" />
         <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-emerald-200/40 dark:bg-emerald-900/10 rounded-full blur-[100px] mix-blend-multiply dark:mix-blend-normal" />
         <div className="absolute inset-0 spatial-grid opacity-60 dark:opacity-30" />
      </div>

      <div className="space-y-6 pb-24 md:pb-10 relative z-10">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white drop-shadow-sm">Settings</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1 font-medium">
              Manage your account, financial profile, and app preferences
            </p>
          </div>
          
          {/* Responsive Action Buttons */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Button variant="ghost" className="flex-1 md:flex-none text-gray-600 dark:text-gray-400 hover:bg-white/10">Cancel</Button>
            <Button 
                onClick={handleSave} 
                disabled={loading} 
                className="flex-1 md:flex-none min-w-[140px] bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Saving...</span>
              ) : (
                <span className="flex items-center justify-center gap-2"><Save className="h-4 w-4" /> Save Changes</span>
              )}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            
            {/* PROFILE CARD */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                  <User className="h-5 w-5 text-emerald-500" />
                  Profile Information
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">Update your public profile and personal details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                
                {/* Responsive Avatar Section */}
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-1000"></div>
                    <Avatar className="h-28 w-28 border-4 border-white dark:border-black relative">
                        <AvatarImage src={formData.avatarUrl} alt="Avatar" className="object-cover" />
                        <AvatarFallback className="text-3xl font-bold bg-gray-100 dark:bg-gray-800 text-emerald-600">
                        {formData.username ? formData.username.slice(0, 2).toUpperCase() : 'US'}
                        </AvatarFallback>
                    </Avatar>
                  </div>
                  
                  <div className="space-y-2 text-center sm:text-left w-full sm:w-auto">
                    <div className="flex gap-2 justify-center sm:justify-start">
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleFileChange} 
                            className="hidden" 
                            accept="image/*" 
                        />
                        <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={handleAvatarClick}
                            disabled={uploadingAvatar}
                            className="bg-white/50 dark:bg-white/5 border-gray-300 dark:border-white/10 hover:bg-white/80 dark:hover:bg-white/10"
                        >
                            {uploadingAvatar ? (
                                <><Loader2 className="h-3 w-3 mr-2 animate-spin" /> Uploading...</>
                            ) : (
                                <><Upload className="h-3 w-3 mr-2" /> Change Avatar</>
                            )}
                        </Button>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">JPG, GIF or PNG. Max size 2MB.</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-gray-700 dark:text-gray-300">Username</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                      <Input id="username" className="pl-9 glass-input w-full" value={formData.username} onChange={(e) => handleInputChange('username', e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role" className="text-gray-700 dark:text-gray-300">Account Role</Label>
                    <div className="relative">
                      <Shield className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                      <Input id="role" className="pl-9 glass-input opacity-70 w-full" value={formData.role} disabled />
                    </div>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="email" className="text-gray-700 dark:text-gray-300">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                      <Input id="email" className="pl-9 glass-input opacity-70 w-full" value={formData.email} disabled />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* FINANCIAL PROFILE CARD */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                  <Wallet className="h-5 w-5 text-emerald-500" />
                  Financial Profile
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                    Data for Expenzo AI tailored budget advice
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="income" className="text-gray-700 dark:text-gray-300">Monthly Income</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-gray-400 font-semibold">₹</span>
                      <Input id="income" className="pl-8 glass-input w-full" type="number" value={formData.monthlyIncome} onChange={(e) => handleInputChange('monthlyIncome', e.target.value)} placeholder="0.00" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="goal" className="text-gray-700 dark:text-gray-300">Primary Financial Goal</Label>
                    <Select value={formData.financialGoal} onValueChange={(val) => handleInputChange('financialGoal', val)}>
                      <SelectTrigger className="glass-input w-full"><SelectValue placeholder="Select a goal" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="savings">Build Emergency Fund</SelectItem>
                        <SelectItem value="debt">Pay Off Debt</SelectItem>
                        <SelectItem value="investment">Grow Investments</SelectItem>
                        <SelectItem value="large_purchase">Buy House / Car</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {/* Responsive Guardian Mode Section */}
                <div className="p-4 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-xl border border-emerald-100 dark:border-emerald-500/20 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <Label className="text-base flex items-center gap-2 text-gray-900 dark:text-white">
                        Guardian AI Strictness
                        <Badge variant="secondary" className="text-[10px] bg-emerald-200 dark:bg-emerald-800 text-emerald-800 dark:text-emerald-100 border-none">AI Feature</Badge>
                      </Label>
                      <p className="text-sm text-gray-500 dark:text-gray-400">How aggressively should the AI warn you?</p>
                    </div>
                    <Select value={formData.guardianMode} onValueChange={(val) => handleInputChange('guardianMode', val)}>
                      <SelectTrigger className="w-full sm:w-[140px] glass-input"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="relaxed">Relaxed</SelectItem>
                        <SelectItem value="balanced">Balanced</SelectItem>
                        <SelectItem value="strict">Strict</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            {/* PREFERENCES CARD */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white"><Globe className="h-5 w-5 text-emerald-500" /> Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-gray-700 dark:text-gray-300">Currency</Label>
                  <Select value={formData.currency} onValueChange={(val) => handleInputChange('currency', val)}>
                    <SelectTrigger className="glass-input w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INR">Indian Rupee (₹)</SelectItem>
                      <SelectItem value="USD">US Dollar ($)</SelectItem>
                      <SelectItem value="EUR">Euro (€)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-700 dark:text-gray-300">Theme</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <Button 
                        variant={theme === 'light' ? 'default' : 'outline'} 
                        size="sm" 
                        onClick={() => setTheme('light')} 
                        className={`w-full ${theme === 'light' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'glass-input hover:bg-white/20'}`}
                    >
                        <Sun className="h-4 w-4 mr-1" /> Light
                    </Button>
                    <Button 
                        variant={theme === 'dark' ? 'default' : 'outline'} 
                        size="sm" 
                        onClick={() => setTheme('dark')} 
                        className={`w-full ${theme === 'dark' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'glass-input hover:bg-white/20'}`}
                    >
                        <Moon className="h-4 w-4 mr-1" /> Dark
                    </Button>
                    <Button 
                        variant={(theme as string) === 'system' ? 'default' : 'outline'} 
                        size="sm" 
                        onClick={() => setTheme('system' as any)} 
                        className={`w-full ${(theme as string) === 'system' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'glass-input hover:bg-white/20'}`}
                    >
                        <Laptop className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* REPORTS CARD */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white"><FileText className="h-5 w-5 text-emerald-500" /> Reports & Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start h-10 border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                  onClick={generateAnnualReport}
                  disabled={generatingReport}
                >
                  {generatingReport ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Analyzing Data...</>
                  ) : (
                    <><FileText className="h-4 w-4 mr-2" /> Download Deep Analysis (PDF)</>
                  )}
                </Button>
                <Separator className="bg-gray-200 dark:bg-white/10" />
                <Button variant="ghost" className="w-full justify-start h-10 text-red-500 hover:text-red-600 hover:bg-red-500/10" onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" /> Log Out
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}