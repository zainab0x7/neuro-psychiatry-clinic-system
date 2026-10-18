'use client';

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Receipt, 
  DollarSign, 
  CreditCard, 
  TrendingUp, 
  Plus, 
  Printer, 
  Download, 
  CheckCircle2, 
  Clock, 
  Search, 
  Filter,
  Building2,
  FileText,
  User
} from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge';
import { PaymentRecord, FeeCategory } from '../../types';

export const BillingScreen: React.FC = () => {
  const { 
    payments, 
    feeCategories, 
    patients, 
    addPayment, 
    addFeeCategory, 
    updateFeeCategory, 
    showToast, 
    currentUser,
    activeRole,
    navigateToPatientProfile
  } = useApp();

  const [activeTab, setActiveTab] = useState<'collections' | 'payments' | 'fee-categories'>('collections');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modal State for New Payment
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [targetPatientId, setTargetPatientId] = useState(patients[0]?.id || 'PX-9403');
  const [selectedService, setSelectedService] = useState('Follow-up Consultation');
  const [feeCat, setFeeCat] = useState<'Consultation' | 'Follow-up' | 'Therapy Session' | 'Other'>('Follow-up');
  const [amount, setAmount] = useState<number>(150);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Bank' | 'Other'>('Bank');
  const [paymentStatus, setPaymentStatus] = useState<'Paid' | 'Pending' | 'Partial'>('Paid');
  const [notes, setNotes] = useState('');

  // Printable Receipt Modal State
  const [selectedReceipt, setSelectedReceipt] = useState<PaymentRecord | null>(null);

  // Fee Category Form State
  const [isFeeModalOpen, setIsFeeModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatFee, setNewCatFee] = useState<number>(150);
  const [newCatDesc, setNewCatDesc] = useState('');

  // Collections Summary Calculations
  const todayDate = new Date().toISOString().split('T')[0];
  const todayPayments = payments.filter(p => p.date === todayDate || p.date === '2026-09-08');
  const todayCollection = todayPayments.filter(p => p.paymentStatus === 'Paid').reduce((acc, p) => acc + p.amount, 0);
  const monthCollection = payments.filter(p => p.paymentStatus === 'Paid').reduce((acc, p) => acc + p.amount, 0);
  const totalPaidCount = payments.filter(p => p.paymentStatus === 'Paid').length;
  const totalPendingAmount = payments.filter(p => p.paymentStatus === 'Pending').reduce((acc, p) => acc + p.amount, 0);

  const filteredPayments = payments.filter(p => {
    const matchesSearch = p.patientName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.receiptNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.patientId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.paymentStatus.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const handleSavePayment = (e: React.FormEvent) => {
    e.preventDefault();
    const patient = patients.find(p => p.id === targetPatientId) || patients[0];

    const newPay = addPayment({
      patientId: patient.id,
      patientName: patient.fullName,
      service: selectedService,
      feeCategory: feeCat,
      amount,
      paymentMethod,
      paymentStatus,
      date: new Date().toISOString().split('T')[0],
      notes,
    });

    setIsPaymentModalOpen(false);
    setSelectedReceipt(newPay);
  };

  const handleCreateFeeCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName) return;
    addFeeCategory({
      name: newCatName,
      defaultFee: newCatFee,
      description: newCatDesc,
      isActive: true,
    });
    setIsFeeModalOpen(false);
    setNewCatName('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Receipt className="w-5 h-5 text-blue-600" />
            Billing, Fee Schedules & Payment Receipts
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage fee structures, issue payment receipts, and monitor daily clinical collection metrics.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPaymentModalOpen(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Record Payment & Receipt
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 flex items-center gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('collections')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'collections'
              ? 'border-blue-600 text-blue-600 bg-white rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-100/60'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          Screen 16: Collections Summary
        </button>

        <button
          onClick={() => setActiveTab('payments')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'payments'
              ? 'border-blue-600 text-blue-600 bg-white rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-100/60'
          }`}
        >
          <Receipt className="w-4 h-4" />
          Screen 15: Payments & Receipts ({payments.length})
        </button>

        <button
          onClick={() => setActiveTab('fee-categories')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'fee-categories'
              ? 'border-blue-600 text-blue-600 bg-white rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-100/60'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          Screen 14: Fee Categories ({feeCategories.length})
        </button>
      </div>

      {/* Tab 1: COLLECTIONS SUMMARY (SCREEN 16) */}
      {activeTab === 'collections' && (
        <div className="space-y-6">
          {/* Summary Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Today's Collection</span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-2xl font-black text-slate-900">${todayCollection}</span>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">+12.5%</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">{todayPayments.length} transactions processed today</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">This Month's Total</span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-2xl font-black text-slate-900">${monthCollection}</span>
                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">September</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Aggregated verified collections</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Successful Paid Transactions</span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-2xl font-black text-emerald-600">{totalPaidCount}</span>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">100% Cleared</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Verified bank & cash receipts</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Pending / Uncollected</span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-2xl font-black text-amber-600">${totalPendingAmount}</span>
                <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">Pending</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Follow-up billing entries</p>
            </div>
          </div>

          {/* Service-wise Breakdown & Daily Trends Table */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
              <h3 className="font-bold text-slate-900 text-sm">Service-Wise Collections Breakdown</h3>
              <div className="space-y-3 text-xs">
                {feeCategories.map(cat => {
                  const catPayments = payments.filter(p => p.feeCategory === cat.name || p.service.includes(cat.name));
                  const totalAmount = catPayments.reduce((a, b) => a + b.amount, 0);
                  const percentage = Math.min(100, Math.round((totalAmount / (monthCollection || 1)) * 100));

                  return (
                    <div key={cat.id} className="space-y-1">
                      <div className="flex justify-between font-medium">
                        <span className="text-slate-800 font-bold">{cat.name}</span>
                        <span className="text-slate-900 font-mono">${totalAmount} ({percentage}%)</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-600 rounded-full transition-all duration-500" 
                          style={{ width: `${percentage}%` }} 
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-3">
              <h3 className="font-bold text-slate-900 text-sm">Payment Method Distribution</h3>
              <div className="space-y-3 text-xs pt-2">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-blue-600" />
                    <span className="font-bold text-slate-800">Bank Transfer / Card</span>
                  </div>
                  <span className="font-mono font-bold text-slate-900">$470.00</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                    <span className="font-bold text-slate-800">Cash Payment</span>
                  </div>
                  <span className="font-mono font-bold text-slate-900">$430.00</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: PAYMENTS & RECEIPTS (SCREEN 15) */}
      {activeTab === 'payments' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search patient, receipt #..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-semibold"
              >
                <option value="all">All Payment Statuses</option>
                <option value="paid">Paid Only</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>

          {/* Payments Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4">Receipt #</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Patient Name</th>
                  <th className="py-3 px-4">Service</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPayments.map(py => (
                  <tr key={py.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{py.receiptNumber}</td>
                    <td className="py-3 px-4 text-slate-600">{py.date}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      <button onClick={() => navigateToPatientProfile(py.patientId)} className="hover:text-blue-600">
                        {py.patientName}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-slate-700">{py.service}</td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">${py.amount}</td>
                    <td className="py-3 px-4 text-slate-600">{py.paymentMethod}</td>
                    <td className="py-3 px-4"><StatusBadge status={py.paymentStatus} size="sm" /></td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedReceipt(py)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-md transition-colors flex items-center gap-1 ml-auto"
                      >
                        <Printer className="w-3.5 h-3.5" /> View Receipt
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: FEE CATEGORIES CONFIGURATION (SCREEN 14) */}
      {activeTab === 'fee-categories' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Clinical Service Fee Schedule</h3>
              <p className="text-[11px] text-slate-500">Configurable fee categories for psychiatric consultations and therapy.</p>
            </div>

            {activeRole === 'ADMIN' && (
              <button
                onClick={() => setIsFeeModalOpen(true)}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Add Fee Category
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {feeCategories.map(cat => (
              <div key={cat.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                    {cat.id}
                  </span>
                  <StatusBadge status={cat.isActive ? 'ACTIVE' : 'INACTIVE'} size="sm" />
                </div>

                <h3 className="font-bold text-slate-900 text-sm">{cat.name}</h3>
                <p className="text-xs text-slate-500 leading-relaxed min-h-[36px]">{cat.description}</p>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-semibold uppercase">Default Fee</span>
                  <span className="text-lg font-black text-slate-900 font-mono">${cat.defaultFee}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal 1: RECORD PAYMENT & RECEIPT */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 shadow-2xl space-y-4 text-xs">
            <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
              Record Payment & Issue Official Receipt
            </h2>

            <form onSubmit={handleSavePayment} className="space-y-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Patient *</label>
                <select
                  value={targetPatientId}
                  onChange={(e) => setTargetPatientId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-bold"
                >
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.fullName} ({p.id}) — {p.phone}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Service Rendered</label>
                  <select
                    value={selectedService}
                    onChange={(e) => {
                      setSelectedService(e.target.value);
                      const matchingCat = feeCategories.find(c => c.name === e.target.value);
                      if (matchingCat) setAmount(matchingCat.defaultFee);
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-semibold"
                  >
                    {feeCategories.map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Amount ($) *</label>
                  <input
                    type="number"
                    required
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Bank">Bank Transfer / Card</option>
                    <option value="Other">Other Electronic</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Payment Status</label>
                  <select
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-bold"
                  >
                    <option value="Paid">Paid (Full)</option>
                    <option value="Pending">Pending</option>
                    <option value="Partial">Partial</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Notes / Transaction Reference</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Card Terminal Ref #98124"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-sm"
                >
                  Save & Issue Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: PRINTABLE RECEIPT */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-2xl space-y-4 text-xs font-sans">
            <div className="text-center border-b border-slate-200 pb-3 space-y-1">
              <h2 className="text-base font-bold text-slate-900 tracking-tight">NEURO PSYCHIATRY CLINIC</h2>
              <p className="text-[11px] text-slate-500">680 Fifth Avenue, Suite 1800, New York, NY 10019</p>
              <p className="text-[11px] text-slate-500">Phone: +1 (555) 800-VANCE</p>
            </div>

            <div className="flex justify-between items-center text-xs">
              <span className="font-mono font-bold text-slate-900">{selectedReceipt.receiptNumber}</span>
              <span className="text-slate-500">{selectedReceipt.date}</span>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
              <p><strong>Billed To:</strong> {selectedReceipt.patientName} ({selectedReceipt.patientId})</p>
              <p><strong>Service Rendered:</strong> {selectedReceipt.service}</p>
              <p><strong>Payment Method:</strong> {selectedReceipt.paymentMethod}</p>
              <p><strong>Status:</strong> <StatusBadge status={selectedReceipt.paymentStatus} size="sm" /></p>
            </div>

            <div className="border-t border-b border-slate-200 py-3 flex justify-between items-center font-bold text-sm">
              <span>Total Amount Paid:</span>
              <span className="font-mono text-emerald-700">${selectedReceipt.amount}.00</span>
            </div>

            <div className="text-center text-[11px] text-slate-400">
              Thank you for choosing Neuro Psychiatry Clinic.
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedReceipt(null)}
                className="px-3.5 py-1.5 bg-slate-100 text-slate-700 font-semibold rounded-lg"
              >
                Close
              </button>
              <button
                onClick={() => alert(`Printing official receipt ${selectedReceipt.receiptNumber}`)}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" /> Print Receipt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: ADD FEE CATEGORY */}
      {isFeeModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-2xl space-y-4 text-xs">
            <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
              Add New Fee Category
            </h2>

            <form onSubmit={handleCreateFeeCategory} className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Service Title *</label>
                <input
                  type="text"
                  required
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="e.g. TMS Therapy Assessment"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Default Fee ($)</label>
                <input
                  type="number"
                  required
                  value={newCatFee}
                  onChange={(e) => setNewCatFee(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsFeeModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
