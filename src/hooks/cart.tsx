import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const storedProducts = await AsyncStorage.getItem(
        '@GoMarketplace:products',
      );

      if (storedProducts) {
        setProducts([...JSON.parse(storedProducts)]);
      }
    }

    loadProducts();
  }, []);

  const saveProducts = useCallback(async (): Promise<void> => {
    await AsyncStorage.setItem(
      '@GoMarketplace:products',
      JSON.stringify(products),
    );
  }, [products]);

  const increment = useCallback(
    async (id: string) => {
      const product = products.find(p => p.id === id);

      if (product) {
        setProducts([
          ...products,
          { ...product, quantity: product.quantity + 1 },
        ]);

        await saveProducts();
      }
    },
    [products, saveProducts],
  );

  const decrement = useCallback(
    async (id: string) => {
      const product = products.find(p => p.id === id);

      if (product) {
        setProducts([
          ...products,
          { ...product, quantity: product.quantity - 1 },
        ]);

        await saveProducts();
      }
    },
    [products, saveProducts],
  );

  const addToCart = useCallback(
    async (product: Product) => {
      const productExists = products.find(p => p.id === product.id);

      if (productExists) {
        increment(productExists.id);
      } else {
        setProducts([...products, { ...product, quantity: 1 }]);
      }

      await saveProducts();
    },
    [increment, products, saveProducts],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
