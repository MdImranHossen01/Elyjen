'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, ShoppingBag, ShoppingCart, Search, User, X, Mic, MicOff } from 'lucide-react';
import { useAppSelector } from '@/store/hooks';
import { CartDrawer } from '@/components/layout/CartDrawer';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from 'next-auth/react';

export function MobileBottomNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const { totalQuantity: cartCount } = useAppSelector((state) => state.cart);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const navItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/shop', label: 'shop', icon: ShoppingBag },
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      router.push(`/shop?search=${encodeURIComponent(searchTerm.trim())}`);
      setIsSearchOpen(false);
      setSearchTerm('');
    }
  };

  const accountHref = session ? '/dashboard' : '/login';

  return (
    <>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-[100] bg-background border-t border-muted/50 pb-[env(safe-area-inset-bottom,1.5rem)]">
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center gap-1 min-w-[64px] transition-all ${
                  isActive ? 'text-primary scale-110' : 'text-muted-foreground'
                }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? 'stroke-[2.5px]' : 'stroke-[1.5px]'}`} />
                <span className="text-[10px] font-bold uppercase tracking-wider">{item.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="bottom-nav-indicator"
                    className="absolute -bottom-0.5 w-8 h-0.5 bg-primary rounded-full"
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}

          {/* Cart Item */}
          <CartDrawer>
            <div className="flex flex-col items-center justify-center gap-1 min-w-[64px] text-muted-foreground relative cursor-pointer active:scale-95 transition-transform">
              <div className="relative">
                <ShoppingCart className="h-5 w-5 stroke-[1.5]" />
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 h-4 w-4 bg-primary text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-background">
                    {cartCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider">Cart</span>
            </div>
          </CartDrawer>

          {/* Search Item */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="flex flex-col items-center justify-center gap-1 min-w-[64px] text-muted-foreground active:scale-95 transition-transform"
          >
            <Search className="h-5 w-5 stroke-[1.5]" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Search</span>
          </button>

          {/* Account Item */}
          <Link
            href={accountHref}
            className={`flex flex-col items-center justify-center gap-1 min-w-[64px] transition-all relative ${
              pathname === accountHref ? 'text-primary scale-110' : 'text-muted-foreground'
            } active:scale-95 transition-transform`}
          >
            <User className={`h-5 w-5 ${pathname === accountHref ? 'stroke-[2.5px]' : 'stroke-[1.5px]'}`} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Account</span>
            {pathname === accountHref && (
              <motion.div
                layoutId="bottom-nav-indicator"
                className="absolute -bottom-0.5 w-8 h-0.5 bg-primary rounded-full"
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}
          </Link>
        </div>
      </nav>

      {/* Mobile Search Overlay */}
      <Sheet open={isSearchOpen} onOpenChange={setIsSearchOpen}>
        <SheetContent side="bottom" className="h-[200px] rounded-t-[2rem] border-t-0 p-6 bg-background z-[150]">
          <SheetHeader className="mb-4">
            <SheetTitle className="text-center text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground">
              Search Products
            </SheetTitle>
          </SheetHeader>
          <form onSubmit={handleSearch} className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input
              autoFocus
              type="text"
              placeholder="What are you looking for?"
              className="w-full bg-muted/50 border-none rounded-2xl py-4 pl-12 pr-4 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 h-8 w-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </form>
        </SheetContent>
      </Sheet>
    </>
  );
}
