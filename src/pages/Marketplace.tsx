import { useState, useEffect } from "react";
import { ShoppingBag, Filter, Search, Star, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  rating: number;
  total_ratings: number;
  seller_id: string;
  created_at: string;
}

interface ProductForm {
  title: string;
  description: string;
  price: string;
  category: string;
}

export default function Marketplace() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [productForm, setProductForm] = useState<ProductForm>({
    title: "",
    description: "",
    price: "",
    category: ""
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('manage-marketplace', {
        body: { action: 'get-products' }
      });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke('manage-marketplace', {
        body: { 
          action: 'create-product',
          productData: {
            ...productForm,
            price: parseFloat(productForm.price)
          }
        }
      });

      if (error) throw error;

      toast.success('Product listed successfully!');
      setProductForm({
        title: "",
        description: "",
        price: "",
        category: ""
      });
      fetchProducts();
    } catch (error: any) {
      console.error('Error creating product:', error);
      toast.error(error.message || 'Failed to create product');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddToCart = async (productId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('manage-marketplace', {
        body: { 
          action: 'add-to-cart',
          product_id: productId,
          quantity: 1
        }
      });

      if (error) throw error;
      toast.success('Added to cart successfully!');
    } catch (error: any) {
      console.error('Error adding to cart:', error);
      toast.error(error.message || 'Failed to add to cart');
    }
  };

  const filteredProducts = products.filter(product =>
    product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(price);
  };
  return (
    <div className="h-full bg-background overflow-y-auto">
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Legal Marketplace</h1>
          <p className="text-muted-foreground">Discover tools, templates, and services for legal professionals</p>
        </div>

        <Tabs defaultValue="browse" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="browse">Browse Products</TabsTrigger>
            <TabsTrigger value="sell">Sell Product</TabsTrigger>
          </TabsList>

          <TabsContent value="browse" className="space-y-6">
            {/* Search and Filter */}
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input 
                  placeholder="Search marketplace..." 
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button variant="outline" className="gap-2">
                <Filter className="w-4 h-4" />
                Filters
              </Button>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-muted-foreground">Loading products...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
                  <Card key={product.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <CardTitle className="flex items-start justify-between">
                        <span className="text-lg">{product.title}</span>
                        <div className="flex items-center gap-1 text-sm text-primary">
                          <Star className="w-4 h-4 fill-current" />
                          {product.rating.toFixed(1)}
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground mb-4">{product.description}</p>
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-xl font-bold text-primary">{formatPrice(product.price)}</span>
                        <span className="text-sm text-muted-foreground">{product.category}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-4">
                        {product.total_ratings} ratings
                      </p>
                      <Button className="w-full" onClick={() => handleAddToCart(product.id)}>
                        Add to Cart
                      </Button>
                    </CardContent>
                  </Card>
                ))}
                {filteredProducts.length === 0 && (
                  <div className="col-span-full text-center py-8">
                    <ShoppingBag className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No products found matching your search</p>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="sell" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>List a New Product</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmitProduct} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Product Title</label>
                    <Input 
                      placeholder="e.g. Contract Templates Bundle" 
                      value={productForm.title}
                      onChange={(e) => setProductForm({...productForm, title: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Category</label>
                    <Input 
                      placeholder="e.g. Templates, Software, Education" 
                      value={productForm.category}
                      onChange={(e) => setProductForm({...productForm, category: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Price (NGN)</label>
                    <Input 
                      type="number"
                      placeholder="25000" 
                      value={productForm.price}
                      onChange={(e) => setProductForm({...productForm, price: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Product Description</label>
                    <Textarea 
                      rows={6}
                      placeholder="Describe your product, its features, and benefits..."
                      value={productForm.description}
                      onChange={(e) => setProductForm({...productForm, description: e.target.value})}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={submitting}>
                    <Plus className="w-4 h-4 mr-2" />
                    {submitting ? 'Listing...' : 'List Product'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}