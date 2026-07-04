/**
 * Souq Pi - Home Page
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products');
      const data = await response.json();

      if (data.success) {
        setProducts(data.data.products);
      }
    } catch (error) {
      console.error("Failed to fetch products", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <header className="header">
        <h1>Souq Pi</h1>
      </header>

      <main className="main">
        {loading ? (
          <div className="loading">Loading products...</div>
        ) : (
          <div className="products-grid">
            {products.map(product => (
              <Link
                key={product.productId}
                href={`/product/${product.productId}`}
                style={{
                  textDecoration: "none",
                  color: "inherit",
                }}
              >
                <div className="product-card">
                  {product.images?.length > 0 && (
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="product-image"
                    />
                  )}

                  <h3>{product.name}</h3>

                  <p>{product.description}</p>

                  <div className="price">
                    <span className="pi-price">
                      {product.price} PI
                    </span>
                  </div>

                  <div className="rating">
                    ⭐ {product.ratings?.average || 0} ({product.ratings?.count || 0} reviews)
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      <style jsx>{`
        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
        }

        .header {
          padding: 20px 0;
          border-bottom: 2px solid #eee;
        }

        .products-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 20px;
          padding: 20px 0;
        }

        .product-card {
          border: 1px solid #ddd;
          border-radius: 10px;
          padding: 20px;
          transition: transform 0.2s;
          background: white;
          cursor: pointer;
        }

        .product-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 5px 20px rgba(0,0,0,0.1);
        }

        .product-image {
          width: 100%;
          height: 220px;
          object-fit: cover;
          border-radius: 10px;
          margin-bottom: 15px;
        }

        .pi-price {
          font-size: 1.5em;
          font-weight: bold;
          color: #00b894;
        }

        .loading {
          text-align: center;
          padding: 50px;
          font-size: 1.2em;
        }
      `}</style>
    </div>
  );
}
