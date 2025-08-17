import { ShoppingBag, Filter, Search, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const marketplaceItems = [
  {
    id: 1,
    title: "Contract Templates Bundle",
    description: "Professional legal contract templates for various practice areas",
    price: "₦25,000",
    rating: 4.8,
    seller: "LegalDocs Pro",
    category: "Templates"
  },
  {
    id: 2,
    title: "Legal Research Database Access",
    description: "Premium access to comprehensive legal research database",
    price: "₦50,000/month",
    rating: 4.9,
    seller: "Research Central",
    category: "Research"
  },
  {
    id: 3,
    title: "Court Filing Assistant",
    description: "Automated court filing and document preparation tool",
    price: "₦35,000",
    rating: 4.7,
    seller: "CourtTech Solutions",
    category: "Software"
  },
  {
    id: 4,
    title: "Legal Writing Course",
    description: "Master the art of legal writing with expert guidance",
    price: "₦15,000",
    rating: 4.6,
    seller: "Legal Academy",
    category: "Education"
  }
];

export default function Marketplace() {
  return (
    <div className="h-full bg-background overflow-y-auto">
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Legal Marketplace</h1>
          <p className="text-muted-foreground">Discover tools, templates, and services for legal professionals</p>
        </div>

        {/* Search and Filter */}
        <div className="flex gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input 
              placeholder="Search marketplace..." 
              className="pl-10"
            />
          </div>
          <Button variant="outline" className="gap-2">
            <Filter className="w-4 h-4" />
            Filters
          </Button>
        </div>

        {/* Marketplace Items */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {marketplaceItems.map((item) => (
            <Card key={item.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-start justify-between">
                  <span className="text-lg">{item.title}</span>
                  <div className="flex items-center gap-1 text-sm text-primary">
                    <Star className="w-4 h-4 fill-current" />
                    {item.rating}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">{item.description}</p>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xl font-bold text-primary">{item.price}</span>
                  <span className="text-sm text-muted-foreground">{item.category}</span>
                </div>
                <p className="text-sm text-muted-foreground mb-4">by {item.seller}</p>
                <Button className="w-full">Add to Cart</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}