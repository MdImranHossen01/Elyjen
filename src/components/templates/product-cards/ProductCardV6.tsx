/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { addToCart, clearCart } from '@/store/slices/cartSlice';
import { toggleWishlist } from '@/store/slices/wishlistSlice';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { fbEvent } from '@/lib/fpixel';

interface ProductCardProps {
  product: {
    _id: string;
    name: string;
    slug: string;
    price: number;
    salePrice?: number;
    images: string[];
    isFeatured?: boolean;
    isNewArrival?: boolean;
    isTrending?: boolean;
    stock: number;
    categories?: any[];
    variants?: any[];
    ratings?: number;
    numReviews?: number;
    isFreeDelivery?: boolean;
  };
  isFlashSale?: boolean;
  priority?: boolean;
}

export default function ProductCardV6({ product, isFlashSale, priority }: ProductCardProps) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { data: session, status } = useSession();
  const wishlist = useAppSelector((state) => state.wishlist.items);
  const isInWishlist = wishlist.includes(product._id);
  const hasVariants = product.variants && product.variants.length > 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    if (hasVariants) {
      router.push(`/product/${product.slug}`);
    } else {
      dispatch(addToCart({
        productId: product._id,
        name: product.name,
        price: product.salePrice ?? product.price,
        basePrice: product.price,
        quantity: 1,
        image: product.images?.[0],
        isFreeDelivery: product.isFreeDelivery
      }));

      // Track AddToCart
      const addToCartPayload = {
        content_name: product.name,
        content_category: product.categories?.[0]?.name || 'Uncategorized',
        content_ids: [product._id],
        content_type: 'product',
        value: product.salePrice || product.price,
        currency: 'BDT',
        quantity: 1
      };
      const trackingUser = {
        em: session?.user?.email || undefined,
        ph: (session?.user as any)?.phone || undefined,
        fn: session?.user?.name || undefined
      };
      fbEvent('AddToCart', addToCartPayload, trackingUser);

      toast.success(`${product.name} added to cart`);
    }
  };

  const handleBuyNow = (e: React.MouseEvent) => {
    e.preventDefault();
    if (hasVariants) {
      router.push(`/product/${product.slug}`);
      return;
    }

    // Clear cart first for a clean "Buy Now" experience
    dispatch(clearCart());

    dispatch(addToCart({
      productId: product._id,
      name: product.name,
      price: product.salePrice ?? product.price,
      basePrice: product.price,
      quantity: 1,
      image: product.images?.[0],
      isFreeDelivery: product.isFreeDelivery
    }));

    router.push('/checkout');
  };

  const handleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (status === 'unauthenticated') {
      toast.error('Please login to add to wishlist');
      return;
    }
    dispatch(toggleWishlist(product._id));
    
    if (!isInWishlist) {
      // Track AddToWishlist
      const addToWishlistPayload = {
        content_name: product.name,
        content_category: product.categories?.[0]?.name || 'Uncategorized',
        content_ids: [product._id],
        content_type: 'product',
        value: product.salePrice || product.price,
        currency: 'BDT'
      };
      const trackingUser = {
        em: session?.user?.email || undefined,
        ph: (session?.user as any)?.phone || undefined,
        fn: session?.user?.name || undefined
      };
      fbEvent('AddToWishlist', addToWishlistPayload, trackingUser);
    }

    toast.success(isInWishlist ? 'Removed from wishlist' : 'Added to wishlist');
  };

  const discount = product.salePrice ? Math.round(((product.price - product.salePrice) / product.price) * 100) : 0;

  return (
    <div className="group relative flex flex-col font-jost animate-in fade-in duration-700">
      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden bg-muted rounded-none">
        <Link href={`/product/${product.slug}`} className="relative block h-full w-full">
          <Image
            src={product.images?.[0] || '/placeholder.png'}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-110"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            priority={priority}
          />
        </Link>
      </div>

      {/* Product Info */}
      <div className="mt-4 text-center space-y-4 px-2 pb-2 flex-1 flex flex-col justify-between">
        <div className="min-h-[5.25rem] sm:min-h-[4.5rem] flex flex-col justify-center">
            <Link 
            href={`/product/${product.slug}`}
            className="text-sm sm:text-base font-semibold text-foreground hover:text-primary transition-colors leading-tight px-2 line-clamp-3 sm:line-clamp-2"
            title={product.name}
            >
            {product.name}
            </Link>
            <div className="flex items-center justify-center gap-2 mt-2">
            {product.salePrice ? (
                <>
                <span className="text-foreground font-black text-sm sm:text-[16px]">৳{Math.round(product.salePrice)}</span>
                <span className="text-muted-foreground line-through text-[11px] sm:text-[13px] font-normal">৳{Math.round(product.price)}</span>
                </>
            ) : (
                <span className="text-foreground font-black text-sm sm:text-[16px]">৳{Math.round(product.price)}</span>
            )}
            </div>
        </div>

        {/* Action Buttons - Visible on hover for Desktop, Always for Mobile */}
        <div className="flex flex-col sm:flex-row gap-2 pt-2 transition-all duration-300 sm:opacity-0 sm:translate-y-2 sm:group-hover:opacity-100 sm:group-hover:translate-y-0">
          <Button 
            size="sm" 
            className="w-full rounded-none bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm sm:text-base h-11 sm:h-10 shadow-lg shadow-primary/20 transition-all active:scale-95 py-2"
            onClick={handleBuyNow}
            disabled={product.stock === 0}
          >
            {product.stock === 0 ? 'Out of Stock' : 'অর্ডার করুন'}
          </Button>
        </div>
      </div>
    </div>
  );
}
