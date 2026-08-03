'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { addToCart, removeFromCart, clearCart, syncItems } from '@/store/slices/cartSlice';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Loader2, CreditCard, Truck, ShoppingBag, CheckCircle2, Plus, Minus, X, Globe, PartyPopper, XCircle, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { fbEvent } from '@/lib/fpixel';
import { ttEvent } from '@/lib/tiktok';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

const detectDistrict = (address: string): string | undefined => {
  const addrLower = address.toLowerCase();
  const districts = [
    { name: 'Dhaka', keys: ['dhaka', 'ঢাকা'] },
    { name: 'Chittagong', keys: ['chittagong', 'chattogram', 'চট্টগ্রাম', 'ctg'] },
    { name: 'Sylhet', keys: ['sylhet', 'সিলেট'] },
    { name: 'Rajshahi', keys: ['rajshahi', 'রাজশাহী'] },
    { name: 'Khulna', keys: ['khulna', 'খুলনা'] },
    { name: 'Barisal', keys: ['barisal', 'barishal', 'বরিশাল'] },
    { name: 'Rangpur', keys: ['rangpur', 'রংপুর'] },
    { name: 'Mymensingh', keys: ['mymensingh', 'ময়মনসিংহ'] },
    { name: 'Comilla', keys: ['comilla', 'cumilla', 'কুমিল্লা'] },
    { name: 'Gazipur', keys: ['gazipur', 'গাজীপুর'] },
    { name: 'Narayanganj', keys: ['narayanganj', 'নারায়ণগঞ্জ'] },
    { name: 'Bogra', keys: ['bogura', 'bogra', 'বগুড়া'] },
    { name: 'Jessore', keys: ['jashore', 'jessore', 'যশোর'] },
    { name: 'Feni', keys: ['feni', 'ফেনী'] },
    { name: 'Noakhali', keys: ['noakhali', 'নোয়াখালী'] },
    { name: 'Tangail', keys: ['tangail', 'টাঙ্গাইল'] },
    { name: 'Pabna', keys: ['pabna', 'পাবনা'] },
    { name: 'Sirajganj', keys: ['sirajganj', 'সিরাজগঞ্জ'] },
    { name: 'Dinajpur', keys: ['dinajpur', 'দিনাজপুর'] },
    { name: 'Kushtia', keys: ['kushtia', 'কুষ্টিয়া'] },
    { name: 'Cox\'s Bazar', keys: ['cox', 'কক্সবাজার'] }
  ];

  for (const dist of districts) {
    for (const key of dist.keys) {
      if (addrLower.includes(key)) {
        return dist.name;
      }
    }
  }
  return undefined;
};

const checkoutSchema = z.object({
  fullName: z.string().min(2, 'আপনার নাম লিখুন'),
  phone: z.string().min(11, 'সঠিক মোবাইল নম্বর লিখুন'),
  street: z.string().min(5, 'আপনার সম্পূর্ণ ঠিকানা লিখুন'),
  shippingRegion: z.string().min(1, 'ডেলিভারি এলাকা সিলেক্ট করুন'),
  paymentMethod: z.enum(['COD', 'Online', 'Manual'], {
    message: 'পেমেন্ট মেথড সিলেক্ট করুন'
  }),
});

type CheckoutValues = z.infer<typeof checkoutSchema>;

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const { items, totalAmount, isHydrated } = useAppSelector((state) => state.cart);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [useWallet, setUseWallet] = useState(false);
  const [settings, setSettings] = useState<any>(null);
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<any>(null);
  const [manualDetails, setManualDetails] = useState({
    senderNumber: '',
    transactionId: ''
  });
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showFailModal, setShowFailModal] = useState(false);
  const [successOrderId, setSuccessOrderId] = useState<string | null>(null);

  const form = useForm<CheckoutValues>({
    resolver: zodResolver(checkoutSchema),
    mode: 'onChange',
    defaultValues: {
      fullName: '',
      phone: '',
      street: '',
      shippingRegion: 'Inside Dhaka',
      paymentMethod: 'COD',
    },
  });

  // Reset manual payment details if payment method changes away from Manual
  useEffect(() => {
    const method = form.watch('paymentMethod');
    if (method !== 'Manual') {
      setSelectedMethod(null);
      setManualDetails({ senderNumber: '', transactionId: '' });
    }
  }, [form.watch('paymentMethod')]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle SSLCommerz redirect back — show modal based on ?order= param
  useEffect(() => {
    const orderStatus = searchParams.get('order');
    const orderId = searchParams.get('id');
    if (orderStatus === 'success') {
      setSuccessOrderId(orderId);
      setShowSuccessModal(true);
      // Clean URL without reload
      window.history.replaceState({}, '', '/checkout');
    } else if (orderStatus === 'failed') {
      setShowFailModal(true);
      window.history.replaceState({}, '', '/checkout');
    }
  }, [searchParams]);



  useEffect(() => {
    async function fetchLoyaltyAndSyncCart() {
      if (!isHydrated) return; // Wait for hydration before doing anything

      try {
        const [profileRes, settingsRes] = await Promise.all([
          fetch('/api/user/profile'),
          fetch('/api/settings')
        ]);
        
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          setProfile(profileData);
          if (profileData) {
            form.reset({
              fullName: profileData.name || '',
              phone: profileData.phone || '',
              street: profileData.address || '',
              shippingRegion: profileData.division === 'Dhaka' ? 'Inside Dhaka' : 'Outside Dhaka',
              paymentMethod: 'COD',
            });
          }
        }
        if (settingsRes.ok) setSettings(await settingsRes.json());

        // --- CART SYNC LOGIC ---
        // Verify all items in cart still exist, have correct variants, and have sufficient stock
        if (items.length > 0) {
          // Group items by product/variant for accurate stock check
          const groupedForSync: Record<string, any> = {};
          items.forEach(item => {
            const key = `${item.productId}-${String(item.color || '').trim()}-${String(item.size || '').trim()}`;
            if (groupedForSync[key]) {
              groupedForSync[key].quantity += item.quantity;
            } else {
              groupedForSync[key] = { 
                productId: item.productId, 
                color: item.color, 
                size: item.size, 
                quantity: item.quantity 
              };
            }
          });

          const syncRes = await fetch('/api/cart/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ items: Object.values(groupedForSync) })
          });
          
          if (syncRes.ok) {
            const { validItems, removedCount, hasInsufficientStock } = await syncRes.json();
            
            // If items were removed (product/variant no longer exists)
            if (removedCount > 0) {
              dispatch(syncItems(validItems));
              toast.info(`${removedCount} items are no longer available and were removed`);
            }

            // If stock is insufficient, we'll store this state locally to show warnings
            setSyncData({ validItems, hasInsufficientStock });
            
            if (hasInsufficientStock) {
              toast.error('Some items in your cart have insufficient stock. Please adjust quantities.');
            }
          } else {
             console.error('Cart sync failed:', await syncRes.text());
          }
        }
      } catch (error) {
        console.error('Failed to fetch initial data or sync cart:', error);
      }
    }
    fetchLoyaltyAndSyncCart();
  }, [form, isHydrated, items.length, dispatch]);

  // Re-sync cart stock when items change (including quantity)
  useEffect(() => {
    if (!isHydrated || items.length === 0) return;
    
    const syncCartStock = async () => {
      try {
        const groupedForSync: Record<string, any> = {};
        items.forEach(item => {
          const key = `${item.productId}-${String(item.color || '').trim()}-${String(item.size || '').trim()}`;
          if (groupedForSync[key]) {
            groupedForSync[key].quantity += item.quantity;
          } else {
            groupedForSync[key] = { 
              productId: item.productId, 
              color: item.color, 
              size: item.size, 
              quantity: item.quantity 
            };
          }
        });

        const syncRes = await fetch('/api/cart/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: Object.values(groupedForSync) })
        });
        
        if (syncRes.ok) {
          const data = await syncRes.json();
          setSyncData({ validItems: data.validItems, hasInsufficientStock: data.hasInsufficientStock });
        }
      } catch (error) {
        console.error('Auto-sync failed:', error);
      }
    };

    const timer = setTimeout(syncCartStock, 500); // Debounce sync
    return () => clearTimeout(timer);
  }, [items, isHydrated]);

  const [syncData, setSyncData] = useState<any>(null);

  const hasTrackedInitiate = useRef(false);
  useEffect(() => {
    if (!isHydrated || items.length === 0 || hasTrackedInitiate.current) return;

    const validItems = items.filter(i => i.productId);
    if (validItems.length === 0) return;

    hasTrackedInitiate.current = true;

    const checkoutPayload = {
      content_ids: validItems.map(i => i.productId),
      content_type: 'product',
      value: totalAmount,
      currency: 'BDT',
      num_items: validItems.length,
      contents: validItems.map(i => ({
        id: i.productId,
        quantity: i.quantity,
        item_price: i.price
      }))
    };

    const initiateUserData = { em: profile?.email, country: 'bd' };

    // Wait for fbq to initialize before firing browser pixel
    // CAPI still fires immediately regardless
    const waitForFbq = (maxWaitMs = 5000, intervalMs = 200) =>
      new Promise<void>((resolve) => {
        if (typeof window !== 'undefined' && window.fbq) { resolve(); return; }
        let elapsed = 0;
        const timer = setInterval(() => {
          elapsed += intervalMs;
          if ((typeof window !== 'undefined' && window.fbq) || elapsed >= maxWaitMs) {
            clearInterval(timer);
            resolve();
          }
        }, intervalMs);
      });

    waitForFbq().then(() => {
      fbEvent('InitiateCheckout', checkoutPayload, initiateUserData);
      ttEvent('InitiateCheckout', checkoutPayload, initiateUserData);
    });
  }, [isHydrated, items, totalAmount]); 

  // Debounced sync of checkout info for abandoned carts tracking
  const watchedFullName = form.watch('fullName');
  const watchedPhone = form.watch('phone');
  const watchedStreet = form.watch('street');
  const watchedShippingRegion = form.watch('shippingRegion');

  useEffect(() => {
    if (!isHydrated || items.length === 0 || submissionSucceededRef.current) return;
    if (!watchedPhone || watchedPhone.trim().length < 11 || !watchedFullName || watchedFullName.trim().length < 2) return;

    const syncAbandonedCart = async () => {
      try {
        await fetch('/api/cart/abandoned', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fullName: watchedFullName,
            phone: watchedPhone,
            email: profile?.email || '',
            street: watchedStreet,
            deliveryArea: watchedShippingRegion,
            items: items.map(item => ({
              product: item.productId,
              name: item.name,
              quantity: item.quantity,
              price: item.price,
              image: item.image,
              color: item.color,
              size: item.size
            })),
            totalAmount
          })
        });
      } catch (error) {
        console.error('Failed to sync abandoned cart:', error);
      }
    };

    const timer = setTimeout(syncAbandonedCart, 2000); // 2 seconds debounce
    return () => clearTimeout(timer);
  }, [watchedFullName, watchedPhone, watchedStreet, watchedShippingRegion, items, totalAmount, isHydrated, profile?.email]);

  const submissionSucceededRef = useRef(false);

  useEffect(() => {
    return () => {
      // Use a timeout to let the route transition complete
      setTimeout(() => {
        if (!submissionSucceededRef.current && typeof window !== 'undefined' && window.location.pathname !== '/checkout') {
          dispatch(clearCart());
        }
      }, 100);
    };
  }, [dispatch]);

  const onSubmit = async (values: CheckoutValues) => {
    setLoading(true);
    try {
      // Normalize Bangla digits to English digits and sanitize phone
      const banglaDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
      const englishDigits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
      let normalizedPhone = values.phone || '';
      for (let i = 0; i < 10; i++) {
        normalizedPhone = normalizedPhone.replace(new RegExp(banglaDigits[i], 'g'), englishDigits[i]);
      }
      let cleanedPhone = normalizedPhone.replace(/[^0-9]/g, '');
      
      // Remove country prefixes (88, +88, 0088) if present
      if (cleanedPhone.startsWith('88')) {
        cleanedPhone = cleanedPhone.substring(2);
      } else if (cleanedPhone.startsWith('0088')) {
        cleanedPhone = cleanedPhone.substring(4);
      }

      const orderData = {
        items: items.map(item => ({
            product: item.productId,
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            image: item.image,
            color: item.color,
            size: item.size
        })),
        shippingAddress: {
            fullName: values.fullName,
            phone: cleanedPhone || values.phone,
            email: profile?.email || `${cleanedPhone || Date.now()}@store.com`, // Email is hidden now, use fallback
            street: values.street,
            city: values.shippingRegion === 'Inside Dhaka' ? 'Dhaka' : (values.shippingRegion === 'Outside Dhaka' ? 'Outside Dhaka' : values.shippingRegion),
            state: values.shippingRegion === 'Inside Dhaka' ? 'Dhaka' : (values.shippingRegion === 'Outside Dhaka' ? 'Outside Dhaka' : values.shippingRegion),
            division: values.shippingRegion === 'Inside Dhaka' ? 'Dhaka' : (values.shippingRegion === 'Outside Dhaka' ? 'Outside Dhaka' : values.shippingRegion),
            district: values.shippingRegion === 'Inside Dhaka' ? 'Dhaka' : (values.shippingRegion === 'Outside Dhaka' ? 'Outside Dhaka' : values.shippingRegion),
            thana: values.shippingRegion === 'Inside Dhaka' ? 'Dhaka' : (values.shippingRegion === 'Outside Dhaka' ? 'Outside Dhaka' : values.shippingRegion),
            zipCode: '0000',
            country: 'Bangladesh'
        },
        paymentMethod: values.paymentMethod,
        deliveryCharge: deliveryCharge,
        useWallet: useWallet,
        couponCode: appliedCoupon || undefined,
        manualPaymentDetails: values.paymentMethod === 'Manual' ? {
          methodName: selectedMethod?.id,
          senderNumber: manualDetails.senderNumber,
          transactionId: manualDetails.transactionId
        } : undefined
      };

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });

      if (response.ok) {
        const order = await response.json();
        submissionSucceededRef.current = true;

        try {
          localStorage.setItem(`guest_order_${order._id}`, JSON.stringify(order));
        } catch (storageError) {
          console.warn('Failed to store order in localStorage:', storageError);
        }

        // Track Purchase event immediately on API success
        try {
          const safeItems = Array.isArray(order.items) ? order.items : items;
          const fullName = values.fullName || '';
          const nameParts = fullName.trim().split(/\s+/);

          const purchaseEventData = {
            value: order.totalAmount ?? totalAmount,
            currency: 'BDT',
            content_ids: safeItems.map((i: any) => i.product?._id || i.product || i.productId),
            content_type: 'product',
            num_items: safeItems.length,
            contents: safeItems.map((i: any) => ({
              id: i.product?._id || i.product || i.productId,
              quantity: i.quantity,
              item_price: i.price,
            })),
          };

          const purchaseUserData: any = {
            em: profile?.email || '',
            ph: values.phone,
            fn: nameParts[0] || '',
            ln: nameParts.slice(1).join(' ') || '',
            country: 'bd',
          };

          if (values.shippingRegion === 'Inside Dhaka') {
            purchaseUserData.ct = 'Dhaka';
            purchaseUserData.st = 'Dhaka';
          }

          fbEvent('Purchase', purchaseEventData, purchaseUserData, order._id);
          ttEvent('Purchase', purchaseEventData, purchaseUserData, order._id);
        } catch (trackingError) {
          console.error('Tracking error:', trackingError);
        }
        
        if (values.paymentMethod === 'Online') {
          // Initialize SSLCommerz Payment
          const initRes = await fetch('/api/payment/init', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId: order._id }),
          });

          if (initRes.ok) {
            const { url } = await initRes.json();
            // Clear cart ONLY after successful payment initialization
            dispatch(clearCart());
            // Redirect to SSLCommerz Gateway
            window.location.href = url;
            return; // Stop further execution
          } else {
            const initError = await initRes.json();
            toast.error(initError.message || 'Failed to initialize payment gateway. Please try paying from your dashboard.');
            // Still clear cart if the order was created successfully
            dispatch(clearCart());
            setSuccessOrderId(order._id);
            setShowSuccessModal(true);
          }
        } else {
          // COD Success - Clear cart and show success modal
          dispatch(clearCart());
          setSuccessOrderId(order._id);
          setShowSuccessModal(true);
        }
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to place order');
      }
    } catch (error) {
      toast.error('An error occurred while placing your order');
    } finally {
      setLoading(false);
    }
  };

  const applyCoupon = async (codeToUse?: string) => {
    const code = codeToUse || couponCode;
    if (!code.trim()) return;
    
    setApplyingCoupon(true);
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code, totalAmount })
      });
      const data = await res.json();
      if (res.ok) {
        setCouponDiscount(data.discountAmount);
        setAppliedCoupon(data.code);
        if (!codeToUse) toast.success(`Coupon "${data.code}" applied!`);
      } else {
        // If re-validating an already applied coupon, remove it
        if (codeToUse) {
          removeCoupon();
          toast.info(data.message || 'Coupon removed due to cart changes');
        } else {
          toast.error(data.message || 'Invalid coupon');
        }
      }
    } catch (error) {
      if (!codeToUse) toast.error('Failed to validate coupon');
    } finally {
      setApplyingCoupon(false);
    }
  };

  // Re-validate coupon when cart total changes
  useEffect(() => {
    if (appliedCoupon && totalAmount > 0) {
      applyCoupon(appliedCoupon);
    }
  }, [totalAmount]); // eslint-disable-line react-hooks/exhaustive-deps

  const removeCoupon = () => {
    setCouponDiscount(0);
    setAppliedCoupon(null);
    setCouponCode('');
    toast.info('Coupon removed');
  };


  
  const freeDeliveryThreshold = settings?.freeDeliveryThreshold || 0;
  const hasFreeDeliveryProduct = items.some(item => item.isFreeDelivery === true);
  const isFreeDelivery = (freeDeliveryThreshold > 0 && totalAmount >= freeDeliveryThreshold) || hasFreeDeliveryProduct;
  
  const chargeInsideDhaka = settings?.deliveryChargeInsideDhaka ?? 0;
  const chargeOutsideDhaka = settings?.deliveryChargeOutsideDhaka ?? 0;
  
  const totalProductDiscount = items.reduce((sum, item) => {
    const itemBasePrice = item.basePrice || item.price;
    return sum + Math.max(0, itemBasePrice - item.price) * item.quantity;
  }, 0);

  const selectedRegion = form.watch('shippingRegion');
  const freeDistricts = (settings?.freeDeliveryDistricts || '')
    .split(',')
    .map((d: string) => d.trim())
    .filter(Boolean);

  const isFreeDistrictSelected = selectedRegion && freeDistricts.includes(selectedRegion);

  const deliveryCharge = items.length > 0 ? (
    (isFreeDelivery || isFreeDistrictSelected) ? 0 : (selectedRegion === 'Inside Dhaka' ? chargeInsideDhaka : chargeOutsideDhaka)
  ) : 0;

  const totalAfterCoupon = Math.max(0, totalAmount + deliveryCharge - couponDiscount);

  const walletAmountToUse = useWallet && profile?.walletBalance 
    ? Math.min(profile.walletBalance, totalAfterCoupon) 
    : 0;

  const finalTotal = totalAfterCoupon - walletAmountToUse;

  // Validation check for mandatory fields to show/hide the order button
  const watchedFields = form.watch();
  const isPhoneValid = /^(?:\+88|88|\+৮৮|৮৮|0088|০০৮৮)?(?:01|০১)[3-9৩-৯][\d০-৯]{8}$/.test(watchedFields.phone || '');
  const isAddressValid = (watchedFields.street || '').trim().length >= 5;
  const isNameValid = (watchedFields.fullName || '').trim().length >= 2;
  const isFormValid = !!(
    isNameValid &&
    isPhoneValid && 
    isAddressValid && 
    watchedFields.shippingRegion &&
    (watchedFields.paymentMethod !== 'Manual' || (selectedMethod?.id && manualDetails.senderNumber && manualDetails.transactionId))
  );

  const potentialReward = (profile?.isSubscriptionActive && settings?.subscriptionConfig)
    ? Math.floor(finalTotal * (settings.subscriptionConfig.rewardPercentage / 100))
    : 0;

  const handleUpdateQuantity = (item: any, delta: number) => {
      if (item.quantity + delta === 0) {
          dispatch(removeFromCart({ productId: item.productId, color: item.color, size: item.size }));
          toast.info(`${item.name} removed from cart`);
      } else {
          dispatch(addToCart({ ...item, quantity: delta }));
      }
  };

  // Show loading state or nothing while hydrating to prevent flash of "empty cart" redirect
  if (!isHydrated) return (
    <div className="container min-h-[60vh] flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );

  // Show empty cart UI instead of returning null / redirecting
  if (items.length === 0 && !showSuccessModal && !showFailModal) return (
    <div className="container min-h-[70vh] flex flex-col items-center justify-center gap-6 py-20 text-center">
      <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center">
        <ShoppingBag className="w-12 h-12 text-muted-foreground" />
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-black tracking-tight">আপনার কার্ট খালি!</h2>
        <p className="text-muted-foreground text-sm max-w-xs">
          চেকআউট করতে আগে কিছু পণ্য কার্টে যোগ করুন।
        </p>
      </div>
      <Button
        onClick={() => router.push('/shop')}
        className="rounded-full px-8 h-11 font-bold"
      >
        শপে যান <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );

  return (
    <div className="container px-4 md:px-6 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
        {/* Left Side: Order Summary */}
        <div className="hidden lg:block sticky top-24 self-start space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>অর্ডার লিস্ট</CardTitle>
              <CardDescription>আপনার কার্টে থাকা প্রোডাক্টগুলো।</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="max-h-[500px] overflow-y-auto space-y-4 pr-2 -mr-2">
                {items.map((item, index) => (
                  <div key={`${item.productId}-${item.color || 'no-color'}-${item.size || 'no-size'}-${index}`} className="flex gap-4 items-start relative group">
                    <div className="h-16 w-16 rounded-md border bg-muted flex-shrink-0 relative overflow-hidden">
                      {item.image && <Image src={item.image} alt={item.name || 'Product'} width={64} height={64} className="h-full w-full object-cover" />}
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex flex-col pr-4">
                          <p className="text-sm font-bold truncate">{item.name}</p>
                          {(item.color || item.size) && (
                            <p className="text-[10px] text-muted-foreground font-medium">
                              {[item.color, item.size].filter(Boolean).join(' / ')}
                            </p>
                          )}
                        </div>
                        <button 
                          onClick={() => {
                            dispatch(removeFromCart({ productId: item.productId, color: item.color, size: item.size }));
                            toast.info(`${item.name} removed from cart`);
                          }}
                          className="text-muted-foreground hover:text-destructive transition-colors p-1 -mt-1 -mr-1"
                          aria-label={`Remove ${item.name} from cart`}
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center border rounded-full bg-muted/50 scale-90 -ml-2">
                          <button 
                            type="button" 
                            onClick={() => handleUpdateQuantity(item, -1)}
                            className="h-7 w-7 flex items-center justify-center hover:bg-muted rounded-full transition-colors"
                            aria-label={`Decrease quantity of ${item.name}`}
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-6 text-center text-xs font-bold">{item.quantity}</span>
                          <button 
                            type="button"
                            onClick={() => handleUpdateQuantity(item, 1)}
                            className="h-7 w-7 flex items-center justify-center hover:bg-muted rounded-full transition-colors"
                            aria-label={`Increase quantity of ${item.name}`}
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-primary">৳{Math.round(item.price * item.quantity)}</p>
                          {syncData?.validItems?.find((v: any) => 
                            v.productId === item.productId && 
                            v.color === item.color && 
                            v.size === item.size
                          )?.isInsufficient && (
                            <p className="text-[9px] text-destructive font-black animate-pulse mt-1">
                              INSUFFICIENT STOCK (Available: {
                                syncData.validItems.find((v: any) => 
                                  v.productId === item.productId && 
                                  v.color === item.color && 
                                  v.size === item.size
                                ).availableStock
                              })
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <Separator />
              <div className="flex justify-between items-center pt-2">
                <span className="text-base font-bold">আইটেম টোটাল</span>
                <span className="text-xl font-black text-primary">৳{Math.round(totalAmount)}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Side: Delivery & Payment */}
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">চেকআউট</h1>
            <p className="text-muted-foreground mt-2">অর্ডারটি সম্পন্ন করতে আপনার তথ্যগুলো পূরণ করুন।</p>
          </div>

          <Form {...form}>
            <form id="checkout-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Truck className="h-6 w-6 text-primary" />
                    ডেলিভারি তথ্য
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-bold">আপনার নাম</FormLabel>
                        <FormControl>
                          <Input placeholder="আপনার পূর্ণ নাম লিখুন" {...field} className="h-12 focus-visible:ring-primary/20" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-bold">মোবাইল নম্বর</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="আপনার মোবাইল নম্বর লিখুন (যেমন: 017XXXXXXXX)" 
                            {...field} 
                            onChange={(e) => {
                              let value = e.target.value;
                              // Keep only English/Bangla digits and plus sign
                              let sanitized = value.replace(/[^\d০-৯+]/g, '');
                              field.onChange(sanitized);
                            }}
                            className="h-12 focus-visible:ring-primary/20" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="shippingRegion"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel className="text-sm font-bold">ডেলিভারি এলাকা</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            value={field.value}
                            className="flex flex-wrap gap-4"
                          >
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="Inside Dhaka" />
                              </FormControl>
                              <FormLabel className="font-normal cursor-pointer">
                                ঢাকার ভিতরে
                              </FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="Outside Dhaka" />
                              </FormControl>
                              <FormLabel className="font-normal cursor-pointer">
                                ঢাকার বাইরে
                              </FormLabel>
                            </FormItem>
                            {freeDistricts.map((district: string) => (
                              <FormItem key={district} className="flex items-center space-x-2 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value={district} />
                                </FormControl>
                                <FormLabel className="font-normal cursor-pointer">
                                  {district} (ফ্রি ডেলিভারি)
                                </FormLabel>
                              </FormItem>
                            ))}
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="street"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-bold">সম্পূর্ণ ঠিকানা</FormLabel>
                        <FormControl>
                          <Input placeholder="গ্রাম/বাসা নং, রোড নং, এলাকা, থানা, জেলা" {...field} className="h-12 focus-visible:ring-primary/20" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Detailed Summary Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Order Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Coupon Section */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Input 
                        placeholder="Coupon Code" 
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        disabled={!!appliedCoupon || applyingCoupon}
                        className="h-10 text-xs"
                      />
                      {appliedCoupon ? (
                        <Button 
                          type="button" 
                          variant="destructive" 
                          size="sm" 
                          onClick={removeCoupon}
                          className="h-10 px-3"
                        >
                          Remove
                        </Button>
                      ) : (
                        <Button 
                          type="button" 
                          size="sm" 
                          onClick={() => applyCoupon()} 
                          disabled={applyingCoupon || !couponCode}
                          className="h-10 px-4"
                        >
                          {applyingCoupon ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Apply'}
                        </Button>
                      )}
                    </div>
                    {appliedCoupon && (
                      <p className="text-[10px] text-green-600 font-bold flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Coupon "{appliedCoupon}" active!
                      </p>
                    )}
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>৳{Math.round(totalAmount + totalProductDiscount)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Product Discount</span>
                      <span>- ৳{Math.round(totalProductDiscount)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Coupon Discount</span>
                      <span className={couponDiscount > 0 ? "text-green-600 font-bold" : ""}>
                        - ৳{Math.round(couponDiscount)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Shipping</span>
                      <span className={isFreeDelivery ? "text-green-600 font-black" : "text-primary font-bold"}>
                        {isFreeDelivery ? 'FREE' : `৳${deliveryCharge}`}
                      </span>
                    </div>
                    {isFreeDelivery && (
                      <p className="text-[10px] text-green-600 font-bold text-right -mt-1">
                        Free shipping applied (Order ≥ ৳{freeDeliveryThreshold})
                      </p>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Loyalty Discount</span>
                      <span className={walletAmountToUse > 0 ? "text-primary font-bold" : ""}>
                        - ৳{Math.round(walletAmountToUse)}
                      </span>
                    </div>
                    <Separator className="mt-4" />
                    <div className="flex justify-between text-lg font-black pt-2">
                      <span>Final Total</span>
                      <span className="text-primary">৳{Math.round(finalTotal)}</span>
                    </div>
                    {potentialReward > 0 && (
                      <div className="mt-4 p-3 rounded-lg bg-primary/10 border border-primary/20 text-center">
                        <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1">Loyalty Perk</p>
                        <p className="text-xs font-bold">You will earn <span className="text-primary">৳{potentialReward}</span> tokens from this order!</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-primary" />
                    Payment Method
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="paymentMethod"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            value={field.value}
                            className="flex flex-col space-y-2"
                          >
                            <FormItem className="flex items-center space-x-3 space-y-0 border rounded-lg p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                              <FormControl>
                                <RadioGroupItem value="COD" />
                              </FormControl>
                              <FormLabel className="font-bold flex-1 cursor-pointer">
                                Cash on Delivery (COD)
                                <p className="text-xs font-normal text-muted-foreground mt-1">Pay when you receive the product.</p>
                              </FormLabel>
                            </FormItem>
                            {settings?.paymentConfig?.activeMethod === 'sslcommerz' && (
                              <FormItem className="flex items-center space-x-3 space-y-0 border rounded-lg p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                                <FormControl>
                                  <RadioGroupItem value="Online" />
                                </FormControl>
                                <FormLabel className="font-bold flex-1 cursor-pointer">
                                  Online Payment (SSLCommerz)
                                  <p className="text-xs font-normal text-muted-foreground mt-1">Pay securely via Credit Card, bKash, or Rocket.</p>
                                  <Badge variant="secondary" className="mt-2 text-[10px]">Recommended</Badge>
                                </FormLabel>
                              </FormItem>
                            )}

                            {(settings?.manualPaymentConfig?.bkash?.active || 
                              settings?.manualPaymentConfig?.nagad?.active || 
                              settings?.manualPaymentConfig?.rocket?.active ||
                              settings?.manualPaymentConfig?.banglaQr?.active) && (
                              <FormItem className="flex items-center space-x-3 space-y-0 border rounded-lg p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                                <FormControl>
                                  <RadioGroupItem value="Manual" />
                                </FormControl>
                                <FormLabel className="font-bold flex-1 cursor-pointer">
                                  Manual Payment (MFS / Bangla QR)
                                  <p className="text-xs font-normal text-muted-foreground mt-1">Send money manually or scan QR to pay.</p>
                                </FormLabel>
                              </FormItem>
                            )}
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Manual Payment Option Selection (Cards) */}
                  {form.watch('paymentMethod') === 'Manual' && settings?.manualPaymentConfig && (
                    <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 animate-in fade-in slide-in-from-top duration-300">
                      {['bkash', 'nagad', 'rocket', 'banglaQr'].map((method) => {
                        const config = settings.manualPaymentConfig[method];
                        if (!config?.active) return null;
                        const isSelected = selectedMethod?.id === method;
                        return (
                          <div 
                            key={method} 
                            onClick={() => {
                              setSelectedMethod({ id: method, ...config });
                              setShowPaymentModal(true);
                            }}
                            className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col items-center gap-2 hover:bg-muted/50 ${
                              isSelected ? 'border-primary bg-primary/5' : 'border-muted'
                            }`}
                          >
                            <div className="h-10 w-10 flex items-center justify-center">
                              {method === 'banglaQr' ? (
                                <Globe className="h-8 w-8 text-primary" />
                              ) : (
                                <Image src={`/assets/${method}logo.webp`} alt={method} width={40} height={40} className="h-full w-auto object-contain" />
                              )}
                            </div>
                            <p className="text-[10px] font-bold uppercase">{method === 'banglaQr' ? 'Bangla QR' : method}</p>
                            {isSelected && (
                              <div className="text-[8px] font-bold text-primary flex items-center gap-1 mt-1">
                                <CheckCircle2 className="h-2 w-2" /> Details Added
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                  
                  {/* Validation Message for Manual Payment */}
                  {form.watch('paymentMethod') === 'Manual' && !selectedMethod?.id && (
                    <p className="text-[10px] text-destructive font-bold text-center mt-2 animate-pulse">
                      Please select a provider and provide payment details!
                    </p>
                  )}

                  {profile && profile.walletBalance > 0 && (
                    <div className="p-4 border rounded-lg bg-primary/5 border-primary/20">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <input 
                            type="checkbox" 
                            id="use-wallet" 
                            checked={useWallet}
                            onChange={(e) => setUseWallet(e.target.checked)}
                            className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary"
                          />
                          <label htmlFor="use-wallet" className="font-bold cursor-pointer">
                            Use Token Balance
                            <p className="text-xs font-normal text-muted-foreground">Available: ৳{profile.walletBalance}</p>
                          </label>
                        </div>
                        {useWallet && <span className="text-sm font-black text-primary">-৳{walletAmountToUse}</span>}
                      </div>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="pt-2 border-t flex flex-col gap-3">
                  <Button 
                    type="submit"
                    className={`w-full h-14 rounded-full font-black uppercase tracking-widest text-sm transition-all ${
                      isFormValid && !syncData?.hasInsufficientStock
                      ? 'bg-primary shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95' 
                      : 'bg-muted text-muted-foreground cursor-not-allowed opacity-70'
                    }`}
                    disabled={loading || !isFormValid || syncData?.hasInsufficientStock}
                  >
                    {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <CheckCircle2 className="mr-2 h-5 w-5" />}
                    {syncData?.hasInsufficientStock ? 'পর্যাপ্ত স্টক নেই' : 'অর্ডার কনফার্ম করুন'}
                  </Button>
                  {!isFormValid && (
                    <p className="text-[10px] font-bold text-muted-foreground text-center w-full uppercase tracking-widest">
                      Please fill all delivery details to proceed
                    </p>
                  )}
                </CardFooter>
              </Card>
            </form>
          </Form>
        </div>
      </div>

      {/* Manual Payment Verification Modal */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="sm:max-w-[425px] rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
          <DialogHeader className="p-8 bg-gradient-to-br from-primary to-primary/80 text-white relative">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 bg-white rounded-2xl p-2 shadow-lg flex items-center justify-center">
                {selectedMethod?.id === 'banglaQr' ? (
                  <Globe className="h-10 w-10 text-primary" />
                ) : (
                  <Image src={`/assets/${selectedMethod?.id}logo.webp`} alt={selectedMethod?.id || 'logo'} width={48} height={48} className="h-full w-auto object-contain" />
                )}
              </div>
              <div className="text-left">
                <DialogTitle className="text-2xl font-black uppercase tracking-tighter">
                  {selectedMethod?.id === 'banglaQr' ? 'Pay via Bangla QR' : `Pay via ${selectedMethod?.id}`}
                </DialogTitle>
                <DialogDescription className="text-white/80 text-xs font-bold">Follow the steps below to complete payment.</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="p-8 space-y-6">
            {/* Payment Info */}
            <div className="bg-primary/5 rounded-2xl p-6 border-2 border-primary/10 space-y-4">
              {selectedMethod?.id !== 'banglaQr' && (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-50">Send Money To</span>
                    <Badge variant="secondary" className="bg-primary/10 text-primary border-none font-bold">Personal Number</Badge>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-2xl font-black tracking-widest text-primary">{selectedMethod?.number}</p>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 rounded-full text-[10px] font-bold border-2"
                      onClick={() => {
                        navigator.clipboard.writeText(selectedMethod?.number);
                        toast.success('Number copied to clipboard!');
                      }}
                    >
                      Copy
                    </Button>
                  </div>
                </>
              )}
              
              {(selectedMethod?.qrCode || selectedMethod?.id === 'banglaQr') && (
                <div className="flex flex-col items-center gap-2 pt-2 border-t border-primary/10">
                  <p className="text-[10px] font-bold uppercase opacity-40">Scan QR Code to Pay</p>
                  <div className="p-2 bg-white rounded-xl shadow-sm border border-primary/20">
                    <Image src={selectedMethod?.qrCode || '/assets/placeholder-qr.png'} alt="QR" width={192} height={192} className="h-48 w-48 object-contain" />
                  </div>
                </div>
              )}
            </div>

            {/* Verification Fields */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase opacity-60">আপনার মোবাইল নম্বর</Label>
                <Input 
                  placeholder="যে নম্বর থেকে টাকা পাঠিয়েছেন" 
                  value={manualDetails.senderNumber}
                  onChange={(e) => setManualDetails({...manualDetails, senderNumber: e.target.value})}
                  className="h-12 rounded-xl focus:ring-primary/20"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase opacity-60">ট্রানজেকশন আইডি (TrxID)</Label>
                <Input 
                  placeholder="যেমন: 8N7A6D5C" 
                  value={manualDetails.transactionId}
                  onChange={(e) => setManualDetails({...manualDetails, transactionId: e.target.value.toUpperCase()})}
                  className="h-12 rounded-xl focus:ring-primary/20"
                />
              </div>
            </div>

            <div className="p-4 bg-muted/30 rounded-xl">
                <p className="text-[10px] leading-relaxed text-muted-foreground italic">
                   <strong>নির্দেশনা:</strong> {settings?.manualPaymentConfig?.instructions || 'সঠিক পরিমাণ টাকা পাঠিয়ে নিচে তথ্য দিন।'}
                </p>
            </div>
          </div>

          <DialogFooter className="p-8 bg-muted/20 border-t flex flex-col sm:flex-row gap-3">
            <Button variant="outline" onClick={() => setShowPaymentModal(false)} className="rounded-full h-12 flex-1 font-bold">বাতিল করুন</Button>
            <Button 
              disabled={!manualDetails.senderNumber || !manualDetails.transactionId}
              onClick={() => {
                setShowPaymentModal(false);
                toast.success(`${selectedMethod?.id.toUpperCase()} details saved!`);
              }} 
              className="rounded-full h-12 flex-1 font-black uppercase tracking-widest shadow-lg shadow-primary/20"
            >
              পেমেন্ট নিশ্চিত করুন
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ✅ Order Success Modal */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="max-w-md p-0 overflow-hidden border-0 shadow-2xl">
          <div className="flex flex-col items-center text-center p-8 gap-6">
            {/* Animated icon */}
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-green-500/10 flex items-center justify-center border-4 border-green-500/20 shadow-xl shadow-green-500/20 animate-in zoom-in-50 duration-500">
                <PartyPopper className="w-12 h-12 text-green-500" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-white" />
              </div>
            </div>

            {/* Text */}
            <div className="space-y-2">
              <h2 className="text-2xl font-black tracking-tight">অর্ডার সফল হয়েছে!</h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                আপনার অর্ডারটি সফলভাবে গ্রহণ করা হয়েছে। আমরা শীঘ্রই আপনার সাথে যোগাযোগ করবো।
              </p>
              {successOrderId && (
                <p className="text-xs font-mono bg-muted px-3 py-1.5 rounded-full inline-block text-muted-foreground">
                  Order ID: <span className="font-bold text-foreground">#{successOrderId.slice(-8).toUpperCase()}</span>
                </p>
              )}
            </div>

            {/* Buttons */}
            <div className="flex flex-col gap-3 w-full pt-2">
              <Button
                onClick={() => { setShowSuccessModal(false); router.push('/shop'); }}
                className="w-full h-11 rounded-full font-bold shadow-lg shadow-primary/20"
              >
                <ShoppingBag className="w-4 h-4 mr-2" />
                শপিং চালিয়ে যান
              </Button>
              <Button
                variant="outline"
                onClick={() => { setShowSuccessModal(false); router.push('/dashboard'); }}
                className="w-full h-11 rounded-full font-bold"
              >
                আমার অর্ডার দেখুন
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ❌ Payment Failed Modal */}
      <Dialog open={showFailModal} onOpenChange={setShowFailModal}>
        <DialogContent className="max-w-md p-0 overflow-hidden border-0 shadow-2xl">
          <div className="flex flex-col items-center text-center p-8 gap-6">
            {/* Icon */}
            <div className="w-24 h-24 rounded-full bg-destructive/10 flex items-center justify-center border-4 border-destructive/20 shadow-xl shadow-destructive/20 animate-in zoom-in-50 duration-500">
              <XCircle className="w-12 h-12 text-destructive" />
            </div>

            {/* Text */}
            <div className="space-y-2">
              <h2 className="text-2xl font-black tracking-tight text-destructive">পেমেন্ট ব্যর্থ হয়েছে</h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                আপনার পেমেন্ট সম্পন্ন হয়নি। পুনরায় চেষ্টা করুন অথবা COD পেমেন্ট বেছে নিন।
              </p>
            </div>

            {/* Buttons */}
            <div className="flex flex-col gap-3 w-full pt-2">
              <Button
                onClick={() => setShowFailModal(false)}
                className="w-full h-11 rounded-full font-bold"
              >
                পুনরায় চেষ্টা করুন
              </Button>
              <Button
                variant="ghost"
                onClick={() => { setShowFailModal(false); router.push('/shop'); }}
                className="w-full h-11 rounded-full font-bold"
              >
                শপে ফিরে যান
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="container py-24 flex justify-center items-center h-[50vh]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}

