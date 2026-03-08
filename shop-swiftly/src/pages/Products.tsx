import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import type { Product } from "@/data/mockData";
import ProductCard from "@/components/products/ProductCard";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SlidersHorizontal, X } from "lucide-react";

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryFilter = searchParams.get("category") || "";
  const searchFilter = searchParams.get("search") || "";
  const [sortBy, setSortBy] = useState("newest");
  const [priceRange, setPriceRange] = useState([0, 100000]);
  const [showFilters, setShowFilters] = useState(false);

  // Fetch Categories
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: api.getCategories
  });

  // Fetch Products
  const { data, isLoading } = useQuery({
    queryKey: ['products', categoryFilter, sortBy, priceRange, searchFilter],
    queryFn: () => api.getProducts({
      category: categoryFilter ? categories.find((c: any) => c.slug === categoryFilter)?.id : undefined,
      min_price: priceRange[0],
      max_price: priceRange[1],
      sort: sortBy,
      search: searchFilter || undefined
    }),
    enabled: !categoryFilter || categories.length > 0
  });

  const filtered = data?.products || [];

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="container-wide py-10">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl mb-2">
            {searchFilter ? `Search results for "${searchFilter}"` 
            : categoryFilter ? categories.find((c: any) => c.slug === categoryFilter)?.name || "Shop" 
            : "All Products"}
          </h1>
          <p className="text-muted-foreground">{data?.total || 0} products</p>
        </div>

        <div className="flex items-center justify-between mb-6 gap-4">
          <Button variant="outline" size="sm" className="lg:hidden" onClick={() => setShowFilters(!showFilters)}>
            <SlidersHorizontal className="h-4 w-4 mr-2" /> Filters
          </Button>
          <div className="flex items-center gap-3 ml-auto">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="popular">Most Popular</SelectItem>
                <SelectItem value="price_asc">Price: Low to High</SelectItem>
                <SelectItem value="price_desc">Price: High to Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-8">
          {/* Sidebar Filters */}
          <aside className={`${showFilters ? "block" : "hidden"} lg:block w-full lg:w-56 shrink-0 space-y-8`}>
            <div>
              <h3 className="font-semibold text-sm uppercase tracking-wider mb-3">Category</h3>
              <div className="space-y-2">
                <button
                  className={`block text-sm ${!categoryFilter ? "text-foreground font-medium" : "text-muted-foreground hover:text-foreground"}`}
                  onClick={() => setSearchParams({})}
                >All Products</button>
                {categories.map((cat: any) => (
                  <button
                    key={cat.id}
                    className={`block text-sm ${categoryFilter === cat.slug ? "text-foreground font-medium" : "text-muted-foreground hover:text-foreground"}`}
                    onClick={() => setSearchParams({ category: cat.slug })}
                  >{cat.name}</button>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-sm uppercase tracking-wider mb-3">Price Range</h3>
              <div className="flex items-center gap-2 mb-4">
                <Input 
                  type="number" 
                  value={priceRange[0]} 
                  onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])} 
                  className="h-8 text-xs w-full" 
                  placeholder="Min"
                />
                <span className="text-muted-foreground">-</span>
                <Input 
                  type="number" 
                  value={priceRange[1]} 
                  onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])} 
                  className="h-8 text-xs w-full" 
                  placeholder="Max"
                />
              </div>
              <Slider min={0} max={100000} step={100} value={priceRange} onValueChange={setPriceRange} className="mb-2" />
            </div>
            {(categoryFilter || searchFilter) && (
              <Button variant="ghost" size="sm" onClick={() => {
                const newParams = new URLSearchParams(searchParams);
                newParams.delete("category");
                newParams.delete("search");
                setSearchParams(newParams);
              }}>
                <X className="h-3 w-3 mr-1" /> Clear Filters
              </Button>
            )}
          </aside>

          {/* Product Grid */}
          <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-6">
            {isLoading ? (
              <div className="col-span-full text-center py-20 text-muted-foreground">Loading products...</div>
            ) : filtered.length === 0 ? (
              <div className="col-span-full text-center py-20 text-muted-foreground">
                No products match your filters.
              </div>
            ) : (
              filtered.map((p: any) => <ProductCard key={p.id} product={p as Product} />)
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Products;
