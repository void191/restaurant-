'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Loader2, ChefHat, Shield, ArrowLeft } from 'lucide-react';
import WelcomeScreen from '@/components/portal/WelcomeScreen';
import BranchSelect, { Branch } from '@/components/customer/BranchSelect';
import LocationCapture, { LocationData } from '@/components/customer/LocationCapture';
import MenuGrid, { MenuCategoryData } from '@/components/customer/MenuGrid';
import ItemDetailSheet, { MenuItemData, CartItem } from '@/components/customer/ItemDetailSheet';
import CartBar from '@/components/customer/CartBar';
import CheckoutDrawer from '@/components/customer/CheckoutDrawer';
import OrderTracker from '@/components/customer/OrderTracker';
import TicketRail from '@/components/employee/TicketRail';
import AdminDashboard from '@/components/admin/AdminDashboard';

export default function HomePage() {
  // Authentication & Role State
  const [authLoading, setAuthLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Customer Journey State
  // Steps: 'welcome' -> 'branch_select' -> 'location_capture' -> 'menu' -> 'tracker'
  const [customerStep, setCustomerStep] = useState<
    'welcome' | 'branch_select' | 'location_capture' | 'menu' | 'tracker'
  >('welcome');

  const [branches, setBranches] = useState<Branch[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(true);

  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [locationData, setLocationData] = useState<LocationData | null>(null);
  const [menuCategories, setMenuCategories] = useState<MenuCategoryData[]>([]);
  const [loadingMenu, setLoadingMenu] = useState(false);

  // Cart & Modal State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeItemForDetail, setActiveItemForDetail] = useState<MenuItemData | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [activeOrderData, setActiveOrderData] = useState<any>(null);

  // Check auth session
  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const d = await res.json();
        setCurrentUser(d.user);
      } else {
        setCurrentUser(null);
      }
    } catch {
      setCurrentUser(null);
    } finally {
      setAuthLoading(false);
    }
  };

  // Load branches
  const loadBranches = async () => {
    try {
      const res = await fetch('/api/branches');
      if (res.ok) {
        const d = await res.json();
        setBranches(d.branches || []);
      }
    } catch (err) {
      console.error('Error fetching branches:', err);
    } finally {
      setLoadingBranches(false);
    }
  };

  // Load menu for selected branch
  const loadBranchMenu = async (branchId: string) => {
    setLoadingMenu(true);
    try {
      const res = await fetch(`/api/branches/${branchId}/menu`);
      if (res.ok) {
        const d = await res.json();
        setMenuCategories(d.categories || []);
      }
    } catch (err) {
      console.error('Error fetching branch menu:', err);
    } finally {
      setLoadingMenu(false);
    }
  };

  useEffect(() => {
    checkAuth();
    loadBranches();

    // Check if session storage has branch or location
    const savedBranch = sessionStorage.getItem('artisan_branch');
    const savedLoc = sessionStorage.getItem('artisan_location');
    if (savedBranch) {
      try {
        const parsedB = JSON.parse(savedBranch);
        setSelectedBranch(parsedB);
        loadBranchMenu(parsedB.id);

        if (savedLoc) {
          const parsedL = JSON.parse(savedLoc);
          setLocationData(parsedL);
          setCustomerStep('menu');
        } else {
          setCustomerStep('location_capture');
        }
      } catch (e) {
        sessionStorage.removeItem('artisan_branch');
      }
    }
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setCurrentUser(null);
    setCustomerStep('welcome');
  };

  // Customer Step Handlers
  const handleStartCustomerOrder = () => {
    setCustomerStep('branch_select');
  };

  const handleSelectBranch = (branch: Branch) => {
    setSelectedBranch(branch);
    sessionStorage.setItem('artisan_branch', JSON.stringify(branch));
    loadBranchMenu(branch.id);
    setCustomerStep('location_capture');
  };

  const handleConfirmLocation = (loc: LocationData) => {
    setLocationData(loc);
    sessionStorage.setItem('artisan_location', JSON.stringify(loc));
    setCustomerStep('menu');
  };

  const handleChangeLocation = () => {
    setCustomerStep('location_capture');
  };

  const handleBackToBranchSelect = () => {
    sessionStorage.removeItem('artisan_location');
    sessionStorage.removeItem('artisan_branch');
    setSelectedBranch(null);
    setLocationData(null);
    setCart([]);
    setCustomerStep('branch_select');
  };

  const handleBackToWelcome = () => {
    sessionStorage.removeItem('artisan_location');
    sessionStorage.removeItem('artisan_branch');
    setSelectedBranch(null);
    setLocationData(null);
    setCart([]);
    setCustomerStep('welcome');
  };

  // Cart operations
  const handleAddToCart = (item: CartItem) => {
    setCart((prev) => {
      const existingIdx = prev.findIndex((i) => i.id === item.id);
      if (existingIdx > -1) {
        const updated = [...prev];
        updated[existingIdx].quantity += item.quantity;
        return updated;
      }
      return [...prev, item];
    });
  };

  const handleQuickAdd = (item: MenuItemData) => {
    const hasRequiredMods = item.modifiers.some((m) => m.is_required);
    if (hasRequiredMods) {
      setActiveItemForDetail(item);
      return;
    }

    const cartId = `${item.id}-default`;
    handleAddToCart({
      id: cartId,
      menu_item_id: item.id,
      name: item.name,
      base_price: item.price,
      unit_price: item.price,
      quantity: 1,
      image_url: item.image_url,
      selected_modifiers: [],
    });
  };

  const handleUpdateCartQuantity = (cartId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === cartId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const handleRemoveFromCart = (cartId: string) => {
    setCart((prev) => prev.filter((i) => i.id !== cartId));
  };

  const handleOrderSuccess = (createdOrder: any) => {
    setActiveOrderId(createdOrder.id);
    setActiveOrderData(createdOrder);
    setCart([]);
    setCustomerStep('tracker');
  };

  const handleStartNewOrder = () => {
    setActiveOrderId(null);
    setActiveOrderData(null);
    setCustomerStep('menu');
  };

  // If loading auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-ember" />
      </div>
    );
  }

  // 1. Role: EMPLOYEE -> Strictly Employee Ticket Rail (Section 2 & 6)
  if (currentUser && currentUser.role === 'employee') {
    return <TicketRail user={currentUser} onLogout={handleLogout} />;
  }

  // 2. Role: ADMIN -> Admin Dashboard Suite (Section 2 & 7)
  if (currentUser && currentUser.role === 'admin') {
    return <AdminDashboard user={currentUser} onLogout={handleLogout} />;
  }

  // 3. Role: CUSTOMER (No account, mobile-first public ordering flow per Section 1 & 5)
  return (
    <div className="min-h-screen bg-paper flex flex-col font-sans">
      {/* Top Customer Brand Bar */}
      <header className="px-4 py-3 bg-white/80 backdrop-blur-md border-b border-paper-dim sticky top-0 z-20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {customerStep !== 'welcome' && (
            <button
              onClick={handleBackToWelcome}
              className="p-1.5 rounded-lg hover:bg-paper-dim text-ink transition-colors mr-1"
              title="Return to Welcome Portal"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <Link href="/" onClick={handleBackToWelcome} className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-ink text-white flex items-center justify-center font-serif text-sm font-bold shadow-sm">
              A
            </div>
            <span className="font-serif text-base font-bold text-ink tracking-tight">
              Artisan Kitchen &amp; Bar
            </span>
          </Link>
        </div>

        <Link
          href="/login"
          className="text-xs font-mono text-muted hover:text-ink px-2.5 py-1 rounded-lg border border-paper-dim bg-paper hover:bg-paper-dim transition-colors flex items-center gap-1.5"
        >
          <ChefHat className="w-3.5 h-3.5 text-ember" />
          <span>Staff Login →</span>
        </Link>
      </header>

      {/* Main Content branching on customer step */}
      <main className="flex-1">
        {customerStep === 'welcome' && (
          <WelcomeScreen onStartCustomerOrder={handleStartCustomerOrder} />
        )}

        {customerStep === 'branch_select' && (
          loadingBranches ? (
            <div className="py-24 text-center text-muted">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-ember mb-3" />
              <p className="font-serif text-lg text-ink">Discovering dining locations...</p>
            </div>
          ) : (
            <BranchSelect
              branches={branches}
              onSelectBranch={handleSelectBranch}
            />
          )
        )}

        {customerStep === 'location_capture' && selectedBranch && (
          <LocationCapture
            branch={selectedBranch}
            onBack={handleBackToBranchSelect}
            onConfirmLocation={handleConfirmLocation}
          />
        )}

        {customerStep === 'menu' && selectedBranch && locationData && (
          loadingMenu ? (
            <div className="py-24 text-center text-muted">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-ember mb-3" />
              <p className="font-serif text-lg text-ink">Loading fresh branch menu...</p>
            </div>
          ) : (
            <>
              <MenuGrid
                branch={selectedBranch}
                locationData={locationData}
                categories={menuCategories}
                onChangeLocation={handleChangeLocation}
                onOpenItemDetail={(item) => setActiveItemForDetail(item)}
                onQuickAdd={handleQuickAdd}
              />

              {/* Item Detail Sheet Modal (Section 5.3) */}
              <ItemDetailSheet
                item={activeItemForDetail}
                onClose={() => setActiveItemForDetail(null)}
                onAddToCart={handleAddToCart}
              />

              {/* Floating Cart Bar (Section 9.3) */}
              <CartBar
                cart={cart}
                onOpenCart={() => setIsCheckoutOpen(true)}
              />

              {/* Checkout Drawer (Section 5.4) */}
              <CheckoutDrawer
                isOpen={isCheckoutOpen}
                onClose={() => setIsCheckoutOpen(false)}
                cart={cart}
                branch={selectedBranch}
                locationData={locationData}
                onUpdateQuantity={handleUpdateCartQuantity}
                onRemoveItem={handleRemoveFromCart}
                onOrderSuccess={handleOrderSuccess}
              />
            </>
          )
        )}

        {customerStep === 'tracker' && activeOrderId && (
          <OrderTracker
            orderId={activeOrderId}
            initialOrder={activeOrderData}
            onNewOrder={handleStartNewOrder}
          />
        )}
      </main>
    </div>
  );
}
