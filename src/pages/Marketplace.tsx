import { useState, useEffect } from "react";
import { ShoppingBag, Filter, Search, Star, Plus, Upload } from "lucide-react";
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
  file_url?: string;
}

interface ProductForm {
  title: string;
  description: string;
  price: string;
  category: string;
  file?: File | null;
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
    category: "",
    file: null
  });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('manage-marketplace', {
        body: { action: 'list-products' }
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (limit to 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }
      
      // Check file type
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Only PDF, DOC, DOCX, and TXT files are allowed');
        return;
      }
      
      setProductForm({...productForm, file});
    }
  };

  const uploadFile = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `products/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('product-files')
      .upload(filePath, file);

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage
      .from('product-files')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const handleSubmitProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setUploading(true);

    try {
      let fileUrl = null;
      
      // Upload file if provided
      if (productForm.file) {
        fileUrl = await uploadFile(productForm.file);
      }

      const { data, error } = await supabase.functions.invoke('manage-marketplace', {
        body: { 
          action: 'create-product',
          productData: {
            title: productForm.title,
            description: productForm.description,
            price: parseFloat(productForm.price),
            category: productForm.category,
            file_url: fileUrl
          }
        }
      });

      if (error) throw error;

      toast.success('Product listed successfully!');
      setProductForm({
        title: "",
        description: "",
        price: "",
        category: "",
        file: null
      });
      
      // Reset file input
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
      fetchProducts();
    } catch (error: any) {
      console.error('Error creating product:', error);
      toast.error(error.message || 'Failed to create product');
    } finally {
      setSubmitting(false);
      setUploading(false);
    }
  };

  const handleAddToCart = async (productId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('manage-marketplace', {
        body: { 
          action: 'add-to-cart',
          cartData: {
            product_id: productId,
            quantity: 1
          }
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
                      
                      {product.file_url && (
                        <div className="mb-4">
                          <a 
                            href={product.file_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary hover:underline text-sm flex items-center gap-1"
                          >
                            <Upload className="w-3 h-3" />
                            Download Template
                          </a>
                        </div>
                      )}
                      
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
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Upload File (Optional)</label>
                    <div className="border-2 border-dashed border-border rounded-lg p-4">
                      <div className="text-center">
                        <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground mb-2">
                          Upload templates, documents, or other files
                        </p>
                        <p className="text-xs text-muted-foreground mb-2">
                          Supported: PDF, DOC, DOCX, TXT (Max 10MB)
                        </p>
                        <input
                          id="file-upload"
                          type="file"
                          accept=".pdf,.doc,.docx,.txt"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => document.getElementById('file-upload')?.click()}
                          disabled={uploading}
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          {uploading ? 'Uploading...' : 'Choose File'}
                        </Button>
                        {productForm.file && (
                          <p className="text-sm text-primary mt-2">
                            Selected: {productForm.file.name}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={submitting || uploading}>
                    <Plus className="w-4 h-4 mr-2" />
                    {submitting ? 'Listing...' : uploading ? 'Uploading...' : 'List Product'}
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