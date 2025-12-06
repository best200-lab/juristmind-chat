import { Check, Crown, Zap, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const plans = [
  {
    name: "Student",
    price: "₦15,000",
    period: "/month",
    description: "Perfect for solo practitioners",
    features: [
      "5 AI consultations per day",
      "Basic legal templates",
      "Email support",
      "Case management (up to 10 cases)",
      "Document storage (1GB)"
    ],
    popular: false,
    icon: Shield
  },
  {
    name: "Professional",
    price: "₦35,000",
    period: "/month",
    description: "Ideal for growing law firms",
    features: [
      "Unlimited AI consultations",
      "Premium legal templates",
      "Priority support",
      "Case management (up to 50 cases)",
      "Document storage (10GB)",
      "Legal research database access",
      "Court filing assistant",
      "Client portal"
    ],
    popular: true,
    icon: Crown
  },
  {
    name: "Enterprise",
    price: "₦75,000",
    period: "/month",
    description: "For large law firms and organizations",
    features: [
      "Unlimited everything",
      "Custom legal templates",
      "24/7 phone support",
      "Unlimited case management",
      "Document storage (100GB)",
      "Advanced analytics",
      "API access",
      "Custom integrations",
      "Dedicated account manager",
      "Training sessions"
    ],
    popular: false,
    icon: Zap
  }
];

export default function Upgrade() {
  return (
    <div className="h-full bg-background overflow-y-auto">
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">Upgrade Your Plan</h1>
          <p className="text-xl text-muted-foreground">Choose the perfect plan for your legal practice</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <Card 
              key={index} 
              className={`relative hover:shadow-lg transition-shadow ${
                plan.popular ? 'border-primary shadow-lg' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </span>
                </div>
              )}
              
              <CardHeader className="text-center pb-8">
                <div className="mx-auto mb-4 w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center">
                  <plan.icon className="w-6 h-6 text-primary-foreground" />
                </div>
                <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-primary">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
                <p className="text-muted-foreground mt-2">{plan.description}</p>
              </CardHeader>
              
              <CardContent>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-primary flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button 
                  className={`w-full ${
                    plan.popular 
                      ? 'bg-gradient-primary hover:shadow-glow' 
                      : ''
                  }`}
                  variant={plan.popular ? 'default' : 'outline'}
                >
                  {plan.popular ? 'Get Started' : 'Choose Plan'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold text-foreground mb-4">Why Choose JURIST MIND?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-primary-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Secure & Compliant</h3>
              <p className="text-muted-foreground">Bank-level security with full compliance to legal industry standards</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-primary-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">AI-Powered</h3>
              <p className="text-muted-foreground">Advanced AI technology specifically trained for legal professionals</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <Crown className="w-8 h-8 text-primary-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Expert Support</h3>
              <p className="text-muted-foreground">Dedicated support from legal technology experts</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
