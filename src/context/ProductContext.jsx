import React, { createContext, useContext, useState, useEffect } from 'react';
import { listProducts } from '../lib/firebase';
import { PRODUCTS as STATIC_PRODUCTS } from '../data/content';
import { FIREBASE_READY } from '../firebase.config';

const ProductContext = createContext();

export function ProductProvider({ children }) {
  const [products, setProducts] = useState(STATIC_PRODUCTS);
  const [loading, setLoading] = useState(true);

  const fetchProducts = async () => {
    if (!FIREBASE_READY) {
      setProducts(STATIC_PRODUCTS);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      const dbProducts = await listProducts();
      if (dbProducts && dbProducts.length > 0) {
        // Sort by some logic if needed, or assume they are ordered
        setProducts(dbProducts);
      } else {
        setProducts(STATIC_PRODUCTS);
      }
    } catch (err) {
      console.error('Failed to fetch products:', err);
      setProducts(STATIC_PRODUCTS);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return (
    <ProductContext.Provider value={{ products, loading, refreshProducts: fetchProducts }}>
      {children}
    </ProductContext.Provider>
  );
}

export const useProducts = () => useContext(ProductContext);
