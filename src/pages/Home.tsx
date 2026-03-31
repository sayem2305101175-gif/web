import React from 'react';
import { Shoe } from '../types';
import Navbar from '../features/shared/ui/Navbar';
import { useCart } from '../features/cart/context/useCart';
import { useWishlist } from '../features/wishlist/context/useWishlist';
import { shoeService } from '../features/catalog/services/shoeService';
import { storefrontCatalogRepository } from '../features/commerce/repositories';
import { useHomeCatalog } from '../features/home/hooks/useHomeCatalog';
import { useStorefrontContent } from '../features/home/hooks/useStorefrontContent';
import HeroSection from '../features/home/sections/HeroSection';
import PromiseSection from '../features/home/sections/PromiseSection';
import CollectionSection from '../features/home/sections/CollectionSection';
import FaqSection from '../features/home/sections/FaqSection';
import CtaSection from '../features/home/sections/CtaSection';
import HowItWorksSection from '../features/home/sections/HowItWorksSection';
import FooterSection from '../features/home/sections/FooterSection';
import { scrollToSection } from '../features/shared/utils/scrollToSection';

const ShoeModal = React.lazy(() => import('../features/product/components/ShoeModal'));
const ProfileModal = React.lazy(() => import('../features/wishlist/components/ProfileModal'));
const CartDrawer = React.lazy(() => import('../features/cart/components/CartDrawer'));

const Home: React.FC = () => {
  const [selectedShoe, setSelectedShoe] = React.useState<Shoe | null>(null);
  const [filter, setFilter] = React.useState('All');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);
  const [isProfileOpen, setIsProfileOpen] = React.useState(false);
  const [isCartOpen, setIsCartOpen] = React.useState(false);
  const { cartCount, cartTotal } = useCart();
  const { wishlist } = useWishlist();
  const { catalogError, filteredShoes, loading } = useHomeCatalog(filter, searchQuery);
  const { content: storefrontContent } = useStorefrontContent();
  const [featuredDrop, setFeaturedDrop] = React.useState<Shoe | null>(null);
  const [catalogSnapshot, setCatalogSnapshot] = React.useState<Shoe[]>([]);

  React.useEffect(() => {
    let isMounted = true;

    const loadCatalogSnapshot = async () => {
      try {
        const products = await shoeService.getAllShoes();
        if (!isMounted) {
          return;
        }
        setCatalogSnapshot(products);
      } catch {
        if (!isMounted) {
          return;
        }
        setCatalogSnapshot([]);
      }
    };

    void loadCatalogSnapshot();
    const unsubscribe = storefrontCatalogRepository.subscribe?.(() => {
      void loadCatalogSnapshot();
    });

    return () => {
      isMounted = false;
      unsubscribe?.();
    };
  }, []);

  const brands = React.useMemo(() => ['All', ...new Set(catalogSnapshot.map((shoe) => shoe.brand))], [catalogSnapshot]);

  React.useEffect(() => {
    let isMounted = true;
    const selectedProductId = storefrontContent.featuredDrop.productId.trim();

    const loadFeaturedDrop = async () => {
      try {
        if (!selectedProductId) {
          if (!isMounted) {
            return;
          }
          setFeaturedDrop(null);
          return;
        }

        const product = await shoeService.getFeaturedMerchandisingShoeById(selectedProductId);
        if (!isMounted) {
          return;
        }
        setFeaturedDrop(product ?? null);
      } catch {
        if (!isMounted) {
          return;
        }
        setFeaturedDrop(null);
      }
    };

    void loadFeaturedDrop();

    return () => {
      isMounted = false;
    };
  }, [catalogSnapshot, storefrontContent.featuredDrop.productId]);

  const lowStockCount = React.useMemo(
    () => catalogSnapshot.filter((shoe) => shoe.stockStatus !== 'In stock').length,
    [catalogSnapshot]
  );

  return (
    <div className="relative overflow-hidden px-4 pb-12 pt-32 md:px-6 md:pt-24">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[40rem] bg-[radial-gradient(circle_at_top_left,_rgba(212,175,55,0.18),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(59,130,246,0.14),_transparent_35%),linear-gradient(180deg,_#f7f2eb_0%,_#ffffff_62%)]" />

      <Navbar
        filter={filter}
        setFilter={setFilter}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        isSearchOpen={isSearchOpen}
        setIsSearchOpen={setIsSearchOpen}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenCart={() => setIsCartOpen(true)}
      />

      <HeroSection
        cartCount={cartCount}
        cartTotal={cartTotal}
        featuredDrop={featuredDrop}
        featuredDropContent={storefrontContent.featuredDrop}
        heroContent={storefrontContent.hero}
        lowStockCount={lowStockCount}
        onOpenCollection={() => scrollToSection('collection')}
        onOpenFeaturedDrop={() => {
          if (featuredDrop) {
            setSelectedShoe(featuredDrop);
          }
        }}
        onOpenPromise={() => scrollToSection('promise')}
        styleCount={catalogSnapshot.length}
        wishlistCount={wishlist.length}
      />

      <PromiseSection trustContent={storefrontContent.trust} />

      <CollectionSection
        brands={brands}
        catalogError={catalogError}
        filter={filter}
        filteredShoes={filteredShoes}
        loading={loading}
        onSelectShoe={setSelectedShoe}
        searchQuery={searchQuery}
        setFilter={setFilter}
      />

      <HowItWorksSection />

      <FaqSection faqContent={storefrontContent.faq} />

      <CtaSection ctaContent={storefrontContent.cta} onOpenCart={() => setIsCartOpen(true)} />

      <FooterSection returnsContent={storefrontContent.returns} shippingContent={storefrontContent.shipping} />

      <React.Suspense fallback={null}>
        {selectedShoe ? <ShoeModal shoe={selectedShoe} onClose={() => setSelectedShoe(null)} /> : null}
        {isProfileOpen ? (
          <ProfileModal
            isOpen={isProfileOpen}
            onClose={() => setIsProfileOpen(false)}
            onShoeClick={(shoe) => {
              setIsProfileOpen(false);
              setSelectedShoe(shoe);
            }}
          />
        ) : null}
        {isCartOpen ? <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} /> : null}
      </React.Suspense>
    </div>
  );
};

export default Home;
