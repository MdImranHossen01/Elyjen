import dynamic from 'next/dynamic';

// --- NAVBARS ---
const NavbarV1 = dynamic(() => import('./navbars/NavbarV1'));
const NavbarV2 = dynamic(() => import('./navbars/NavbarV2'));
const NavbarV3 = dynamic(() => import('./navbars/NavbarV3'));
const NavbarV4 = dynamic(() => import('./navbars/NavbarV4'));
const NavbarV5 = dynamic(() => import('./navbars/NavbarV5'));

export const NavbarSelector = ({ style }: { style: string }) => {
  switch (style) {
    case 'v1': return <NavbarV1 />;
    case 'v2': return <NavbarV2 />;
    case 'v3': return <NavbarV3 />;
    case 'v4': return <NavbarV4 />;
    case 'v5': return <NavbarV5 />;
    default: return <NavbarV1 />;
  }
};

// --- HEROS ---
const HeroV1 = dynamic(() => import('./heros/HeroV1'));
const HeroV2 = dynamic(() => import('./heros/HeroV2'));
const HeroV3 = dynamic(() => import('./heros/HeroV3'));
const HeroV4 = dynamic(() => import('./heros/HeroV4'));
const HeroV5 = dynamic(() => import('./heros/HeroV5'));

export const HeroSelector = ({ style, banners }: { style: string, banners: any[] }) => {
  switch (style) {
    case 'v1': return <HeroV1 banners={banners} />;
    case 'v2': return <HeroV2 banners={banners} />;
    case 'v3': return <HeroV3 banners={banners} />;
    case 'v4': return <HeroV4 banners={banners} />;
    case 'v5': return <HeroV5 banners={banners} />;
    default: return <HeroV1 banners={banners} />;
  }
};

// --- PRODUCT CARDS ---
import ProductCardV1 from './product-cards/ProductCardV1';
import ProductCardV2 from './product-cards/ProductCardV2';
import ProductCardV3 from './product-cards/ProductCardV3';
import ProductCardV4 from './product-cards/ProductCardV4';
import ProductCardV5 from './product-cards/ProductCardV5';
import ProductCardV6 from './product-cards/ProductCardV6';

export const ProductCardSelector = ({ style, product, isFlashSale }: { style: string, product: any, isFlashSale?: boolean }) => {
  switch (style) {
    case 'v1': return <ProductCardV1 product={product} isFlashSale={isFlashSale} />;
    case 'v2': return <ProductCardV2 product={product} isFlashSale={isFlashSale} />;
    case 'v3': return <ProductCardV3 product={product} isFlashSale={isFlashSale} />;
    case 'v4': return <ProductCardV4 product={product} isFlashSale={isFlashSale} />;
    case 'v5': return <ProductCardV5 product={product} isFlashSale={isFlashSale} />;
    case 'v6': return <ProductCardV6 product={product} isFlashSale={isFlashSale} />;
    default: return <ProductCardV1 product={product} isFlashSale={isFlashSale} />;
  }
};

// --- CATEGORIES ---
const CategoryV1 = dynamic(() => import('./categories/CategoryV1'));

export const CategorySelector = ({ style, categories }: { style: string, categories: any[] }) => {
  switch (style) {
    case 'v1': return <CategoryV1 categories={categories} />;
    default: return <CategoryV1 categories={categories} />;
  }
};

