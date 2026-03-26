/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ChevronLeft, HelpCircle, Package, Truck, MapPin, CheckCircle2, AlertCircle, ChevronRight, Info, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from './lib/supabase';

// --- Types ---

interface Shipment {
  id: string;
  tracking_number: string;
  recipient_name: string;
  destination_address: string;
  asset_value: number;
  service_fee_percent: number;
  status: 'In Transit' | 'On Hold - Fee Required' | string;
  progress_percent: number;
  service_type: string;
  origin_city: string;
  origin_state: string;
  current_city: string;
  current_state: string;
  created_at: string;
}

// --- Components ---

const Header = ({ onBack }: { onBack?: () => void }) => (
  <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-50">
    <button onClick={onBack} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
      <ChevronLeft className="w-6 h-6 text-fedex-purple" />
    </button>
    <div className="flex items-center">
      <span className="text-2xl font-black tracking-tighter flex">
        <span className="text-fedex-purple">Fed</span>
        <span className="text-fedex-orange">Ex</span>
      </span>
    </div>
    <button className="p-1 hover:bg-gray-100 rounded-full transition-colors">
      <HelpCircle className="w-6 h-6 text-fedex-purple" />
    </button>
  </header>
);

const Footer = () => (
  <footer className="bg-white border-t border-gray-200 mt-auto py-6 px-4 text-center">
    <div className="flex justify-center space-x-4 mb-4 text-xs font-medium text-fedex-purple">
      <a href="#" className="hover:underline">Privacy</a>
      <span className="text-gray-300">|</span>
      <a href="#" className="hover:underline">Terms of Use</a>
    </div>
    <p className="text-[10px] text-gray-500">© FedEx 1995-2026. All rights reserved.</p>
  </footer>
);

const InputScreen = ({ onTrack }: { onTrack: (shipment: Shipment) => void }) => {
  const [id, setId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // 1. Clean the Input: Remove all spaces
    const cleanedInput = id.replace(/\s/g, '');
    
    if (cleanedInput.length > 0) {
      setLoading(true);
      setError(null);
      try {
        // 2. Use a "Like" Query: Create a fuzzy pattern to ignore spaces/dashes in the database column
        // This ensures that if the DB has "7292 2018" and user types "72922018", it still matches.
        const fuzzyPattern = `%${cleanedInput.split('').join('%')}%`;
        
        console.log('--- Debugging Fetch ---');
        console.log('Original Input:', id);
        console.log('Cleaned Input:', cleanedInput);
        console.log('Fuzzy Pattern:', fuzzyPattern);

        // We use .or to try exact cleaned match OR the fuzzy match
        // This covers cases where the DB might have spaces or not.
        const { data, error: sbError } = await supabase
          .from('shipments')
          .select('*')
          .or(`tracking_number.ilike.${cleanedInput},tracking_number.ilike.${fuzzyPattern}`)
          .limit(1)
          .maybeSingle();

        if (sbError) {
          console.error('Supabase Query Error:', sbError);
          setError('A database error occurred. Please try again.');
        } else if (!data) {
          console.warn('No shipment found for pattern:', fuzzyPattern);
          setError('Tracking number not found. Please check and try again.');
        } else {
          // 3. Debug the Fetch: Log the found data
          console.log('Match Found!');
          console.log('Full Data Object:', data);
          console.log('Recipient Name:', data.recipient_name);
          console.log('Status:', data.status);
          console.log('Asset Value:', data.asset_value);
          
          onTrack(data as Shipment);
        }
      } catch (err) {
        console.error('Unexpected Exception:', err);
        setError('An unexpected error occurred. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="px-6 py-12 flex flex-col items-center"
    >
      <div className="w-20 h-20 bg-fedex-purple/10 rounded-full flex items-center justify-center mb-8">
        <Package className="w-10 h-10 text-fedex-purple" />
      </div>
      <h1 className="text-2xl font-bold text-fedex-dark-gray mb-2 text-center">Track Your Shipment</h1>
      <p className="text-gray-500 text-sm mb-8 text-center">Enter your tracking number to see the latest status.</p>
      
      <form onSubmit={handleSubmit} className="w-full space-y-4">
        <div className="relative">
          <input
            type="text"
            value={id}
            onChange={(e) => setId(e.target.value)}
            placeholder="Tracking ID"
            className="w-full px-4 py-4 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-fedex-purple focus:border-transparent outline-none transition-all text-lg font-mono tracking-widest text-center"
          />
          {error && (
            <p className="text-xs text-red-500 mt-2 text-center font-medium">{error}</p>
          )}
        </div>
        <button
          type="submit"
          disabled={loading || id.trim().length < 8}
          className={`w-full py-4 rounded-lg font-bold text-lg transition-all flex items-center justify-center ${
            id.trim().length >= 8 && !loading
              ? 'bg-fedex-purple text-white shadow-lg active:scale-[0.98]' 
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Track'}
        </button>
      </form>

      <div className="mt-12 grid grid-cols-2 gap-4 w-full">
        <button className="flex flex-col items-center p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
          <Truck className="w-6 h-6 text-fedex-orange mb-2" />
          <span className="text-xs font-bold text-fedex-purple">Shipping Rates</span>
        </button>
        <button className="flex flex-col items-center p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
          <MapPin className="w-6 h-6 text-fedex-orange mb-2" />
          <span className="text-xs font-bold text-fedex-purple">Find Location</span>
        </button>
      </div>
    </motion.div>
  );
};

const ResultScreen = ({ shipment }: { shipment: Shipment }) => {
  const serviceFee = (shipment.asset_value * shipment.service_fee_percent) / 100;
  const isOnHold = shipment.status === 'On Hold - Fee Required';

  // Mapping Logic for Progress Percentage
  const getProgressPercentage = (status: string) => {
    switch (status) {
      case 'Label Created':
        return 15;
      case 'In Transit':
        return 50;
      case 'Arrived at Local Hub':
      case 'On Hold - Fee Required':
        return 75;
      case 'Delivered':
        return 100;
      default:
        return shipment.progress_percent || 0; // Fallback to DB value if provided
    }
  };

  const progress = getProgressPercentage(shipment.status);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-fedex-gray min-h-screen pb-20"
    >
      {/* Status Banner */}
      {isOnHold ? (
        <div className="bg-fedex-orange px-4 py-3 flex items-center space-x-3">
          <AlertCircle className="w-6 h-6 text-white shrink-0" />
          <p className="text-white text-sm font-bold leading-tight">
            ACTION REQUIRED: Institutional Service Fee Pending
          </p>
        </div>
      ) : (
        <div className="bg-blue-600 px-4 py-3 flex items-center space-x-3">
          <CheckCircle2 className="w-6 h-6 text-white shrink-0" />
          <p className="text-white text-sm font-bold leading-tight">
            Shipment Status: {shipment.status}
          </p>
        </div>
      )}

      <div className="p-4 space-y-4">
        {/* Tracking Info Card */}
        <div className="bg-white rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Tracking ID</p>
              <h2 className="text-xl font-black text-fedex-purple tabular-nums">{shipment.tracking_number.replace(/(\d{4})/g, '$1 ').trim()}</h2>
            </div>
            <div className="bg-fedex-purple/5 px-3 py-1 rounded-full">
              <span className="text-[10px] font-bold text-fedex-purple uppercase">{shipment.service_type || 'Standard Overnight'}</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-3">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-fedex-purple">{shipment.status}</span>
              <span className="text-fedex-orange">{progress}% Complete</span>
            </div>
            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="h-full bg-fedex-orange rounded-full"
              />
            </div>
            <div className="flex justify-between text-[10px] text-gray-400 font-bold uppercase">
              <span>Picked Up</span>
              <span className={isOnHold ? "text-fedex-orange" : ""}>{isOnHold ? "On Hold" : "In Transit"}</span>
              <span>Delivered</span>
            </div>
          </div>
        </div>

        {/* Shipment Summary Card */}
        <div className="bg-white rounded-xl overflow-hidden shadow-sm">
          <div className="bg-fedex-purple px-4 py-3 flex justify-between items-center">
            <h3 className="text-white font-bold text-sm">Shipment Summary</h3>
            <Info className="w-4 h-4 text-white/70" />
          </div>
          <div className="p-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Declared Asset Value</span>
              <span className="font-bold text-fedex-dark-gray">${shipment.asset_value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Service Fee ({shipment.service_fee_percent}%)</span>
              <span className="font-bold text-fedex-dark-gray">${serviceFee.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="pt-3 border-t border-dashed border-gray-200 flex justify-between items-center">
              <span className="text-fedex-purple font-black">Grand Total</span>
              <span className="text-xl font-black text-fedex-purple">${serviceFee.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            
            {isOnHold && (
              <>
                <button className="w-full bg-fedex-orange text-white py-4 rounded-lg font-black text-sm uppercase tracking-wider shadow-lg active:scale-[0.98] transition-all mt-4">
                  Pay Service Fee to Release Package
                </button>
                <p className="text-[10px] text-center text-gray-400 italic mt-2">
                  * Payment is required to clear institutional customs and release the shipment for final delivery.
                </p>
              </>
            )}
          </div>
        </div>

        {/* Recipient Details */}
        <div className="bg-white rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 bg-fedex-gray rounded-full flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5 text-fedex-purple" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-bold uppercase mb-1">Delivery Address</p>
              <p className="text-sm font-bold text-fedex-dark-gray">{shipment.destination_address}</p>
            </div>
          </div>
          <div className="flex items-start space-x-3 pt-4 border-t border-gray-100">
            <div className="w-10 h-10 bg-fedex-gray rounded-full flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5 text-fedex-purple" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-bold uppercase mb-1">Recipient</p>
              <p className="text-sm font-bold text-fedex-dark-gray">{shipment.recipient_name}</p>
            </div>
          </div>
        </div>

        {/* Travel History */}
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <h3 className="text-fedex-purple font-bold text-sm mb-6 flex items-center">
            Travel History
            <ChevronRight className="w-4 h-4 ml-1" />
          </h3>
          
          <div className="relative space-y-8 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-gray-100">
            {/* Current Status */}
            <div className="relative pl-8">
              <div className={`absolute left-0 top-1 w-6 h-6 rounded-full border-4 border-white shadow-sm z-10 ${isOnHold ? 'bg-fedex-orange' : 'bg-blue-600'}`} />
              <div className="space-y-1">
                <p className={`text-sm font-black ${isOnHold ? 'text-fedex-orange' : 'text-blue-600'}`}>{shipment.status}</p>
                <p className="text-xs font-bold text-fedex-dark-gray">{shipment.current_city}, {shipment.current_state}</p>
                <p className="text-[10px] text-gray-400">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} • {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
                {isOnHold && <p className="text-[10px] text-fedex-orange font-medium italic">Pending service fee payment</p>}
              </div>
            </div>

            {/* Origin */}
            <div className="relative pl-8">
              <div className="absolute left-0 top-1 w-6 h-6 bg-fedex-purple rounded-full border-4 border-white shadow-sm z-10" />
              <div className="space-y-1">
                <p className="text-sm font-bold text-fedex-dark-gray">Picked Up</p>
                <p className="text-xs font-bold text-fedex-dark-gray">{shipment.origin_city}, {shipment.origin_state}</p>
                <p className="text-[10px] text-gray-400">{new Date(new Date().getTime() - 86400000).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} • 10:30 AM</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default function App() {
  const [shipment, setShipment] = useState<Shipment | null>(null);

  const handleBack = () => {
    setShipment(null);
  };

  return (
    <div className="min-h-screen flex justify-center bg-gray-100">
      <div className="w-full max-w-[450px] bg-white shadow-2xl flex flex-col min-h-screen relative overflow-x-hidden">
        <Header onBack={shipment ? handleBack : undefined} />
        
        <main className="flex-grow overflow-y-auto">
          <AnimatePresence mode="wait">
            {!shipment ? (
              <motion.div
                key="input-screen"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <InputScreen onTrack={setShipment} />
              </motion.div>
            ) : (
              <motion.div
                key="result-screen"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <ResultScreen shipment={shipment} />
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        <Footer />
      </div>
    </div>
  );
}
