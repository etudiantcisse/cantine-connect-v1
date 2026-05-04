import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import {
  clearRemoteCart,
  getRemoteCartItems,
  removeRemoteCartItem,
  upsertRemoteCartItem,
} from "../services/cartService";
import { groupBy } from "../utils/groupBy";

export const CartContext = createContext(null);

const CART_STORAGE_VERSION = 1;
const CART_STORAGE_PREFIX = `cart:v${CART_STORAGE_VERSION}`;

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const hydratedRef = useRef(false);
  const lastKeyRef = useRef(null);
  const syncingRef = useRef(false);

  const storageKey = useMemo(() => {
    const userKey = user?.id ? String(user.id) : "guest";
    return `${CART_STORAGE_PREFIX}:${userKey}`;
  }, [user?.id]);

  const guestKey = useMemo(
    () => `${CART_STORAGE_PREFIX}:guest`,
    [],
  );

  useEffect(() => {
    let cancelled = false;

    const hydrate = async () => {
      hydratedRef.current = false;
      lastKeyRef.current = storageKey;
      try {
        let raw = await AsyncStorage.getItem(storageKey);

        // If user cart is empty but guest cart exists (session loads after app start),
        // migrate guest cart once so users don't "lose" their cart on refresh.
        if (!raw && storageKey !== guestKey) {
          const guestRaw = await AsyncStorage.getItem(guestKey);
          if (guestRaw) {
            raw = guestRaw;
            await AsyncStorage.removeItem(guestKey);
            await AsyncStorage.setItem(storageKey, guestRaw);
          }
        }

        if (cancelled) return;
        if (!raw) {
          setItems([]);
          hydratedRef.current = true;
          return;
        }

        const parsed = JSON.parse(raw);
        const nextItems = Array.isArray(parsed?.items) ? parsed.items : [];
        setItems(nextItems);
      } catch (error) {
        setItems([]);
      } finally {
        hydratedRef.current = true;
      }
    };

    hydrate();

    return () => {
      cancelled = true;
    };
  }, [storageKey]);

  // When authenticated, prefer remote cart; also upload local cart once if remote empty.
  useEffect(() => {
    let cancelled = false;
    if (!user?.id) return;
    if (!hydratedRef.current) return;

    const sync = async () => {
      if (syncingRef.current) return;
      syncingRef.current = true;
      try {
        const remoteItems = await getRemoteCartItems();
        if (cancelled) return;

        const remoteHas = remoteItems.some((it) => it?.product?.id && it.quantity > 0);
        const localHas = items.some((it) => it?.product?.id && it.quantity > 0);

        if (remoteHas) {
          setItems(remoteItems);
          return;
        }

        if (localHas) {
          await Promise.all(
            items.map((it) =>
              upsertRemoteCartItem(it.product.id, it.quantity),
            ),
          );
        }
      } catch (error) {
        // If remote fails, keep local cart.
      } finally {
        syncingRef.current = false;
      }
    };

    sync();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => {
    if (!hydratedRef.current) return;
    if (lastKeyRef.current !== storageKey) return;

    const persist = async () => {
      try {
        const payload = JSON.stringify({ items });
        await AsyncStorage.setItem(storageKey, payload);
      } catch (error) {
        // ignore persistence errors
      }
    };

    persist();
  }, [items, storageKey]);

  const addItem = (product, quantity = 1) => {
    if (!product?.id || quantity <= 0) {
      return;
    }

    setItems((prev) => {
      const index = prev.findIndex((item) => item.product.id === product.id);
      if (index === -1) {
        if (user?.id) {
          upsertRemoteCartItem(product.id, quantity).catch(() => {});
        }
        return [...prev, { product, quantity }];
      }

      const next = [...prev];
      const nextQty = next[index].quantity + quantity;
      next[index] = {
        ...next[index],
        quantity: nextQty,
      };
      if (user?.id) {
        upsertRemoteCartItem(product.id, nextQty).catch(() => {});
      }
      return next;
    });
  };

  const setItemQuantity = (productId, quantity) => {
    if (!productId) {
      return;
    }

    setItems((prev) => {
      if (quantity <= 0) {
        return prev.filter((item) => item.product.id !== productId);
      }

      return prev.map((item) =>
        item.product.id === productId
          ? {
              ...item,
              quantity,
            }
          : item,
      );
    });

    if (user?.id) {
      if (quantity <= 0) {
        removeRemoteCartItem(productId).catch(() => {});
      } else {
        upsertRemoteCartItem(productId, quantity).catch(() => {});
      }
    }
  };

  const removeItem = (productId) => {
    if (!productId) {
      return;
    }
    setItems((prev) => prev.filter((item) => item.product.id !== productId));
    if (user?.id) {
      removeRemoteCartItem(productId).catch(() => {});
    }
  };

  const clearCart = () => {
    setItems([]);
    if (user?.id) {
      clearRemoteCart().catch(() => {});
    }
  };

  const cartCount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items],
  );

  const subtotal = useMemo(
    () =>
      items.reduce(
        (sum, item) => sum + Number(item.product?.prix || 0) * item.quantity,
        0,
      ),
    [items],
  );

  const groupedByVendor = useMemo(() => {
    const grouped = groupBy(items, (item) => item.product.vendor_id);
    return Object.entries(grouped).map(([vendorId, vendorItems]) => {
      const vendor = vendorItems[0]?.product?.vendors;
      const total = vendorItems.reduce(
        (sum, item) => sum + Number(item.product.prix || 0) * item.quantity,
        0,
      );

      return {
        vendorId,
        vendor,
        items: vendorItems,
        total,
      };
    });
  }, [items]);

  const value = useMemo(
    () => ({
      items,
      cartCount,
      subtotal,
      groupedByVendor,
      addItem,
      setItemQuantity,
      removeItem,
      clearCart,
    }),
    [items, cartCount, subtotal, groupedByVendor],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
