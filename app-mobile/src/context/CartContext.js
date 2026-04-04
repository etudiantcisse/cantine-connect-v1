import React, { createContext, useMemo, useState } from "react";
import { groupBy } from "../utils/groupBy";

export const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);

  const addItem = (product, quantity = 1) => {
    if (!product?.id || quantity <= 0) {
      return;
    }

    setItems((prev) => {
      const index = prev.findIndex((item) => item.product.id === product.id);
      if (index === -1) {
        return [...prev, { product, quantity }];
      }

      const next = [...prev];
      next[index] = {
        ...next[index],
        quantity: next[index].quantity + quantity,
      };
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
  };

  const removeItem = (productId) => {
    if (!productId) {
      return;
    }
    setItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => setItems([]);

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
