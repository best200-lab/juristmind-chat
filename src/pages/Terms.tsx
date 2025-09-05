import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

export default function Terms() {
  const navigate = useNavigate();

  return (
    <div className="h-full bg-background overflow-y-auto">
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold text-foreground mb-2">Terms and Conditions</h1>
          <p className="text-muted-foreground">Last updated: January 2025</p>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>1. Acceptance of Terms</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                By accessing and using Jurist Mind AI, you accept and agree to be bound by the terms 
                and provision of this agreement.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>2. Use License</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Permission is granted to temporarily download one copy of Jurist Mind AI per device 
                for personal, non-commercial transitory viewing only.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>3. Disclaimer</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                The information provided by Jurist Mind AI is for general informational purposes only. 
                All information is provided in good faith, however we make no representation or warranty 
                of any kind, express or implied, regarding the accuracy, adequacy, validity, reliability, 
                availability or completeness of any information.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>4. Legal Advice Disclaimer</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Jurist Mind AI does not provide legal advice. The information provided through this 
                platform should not be used as a substitute for professional legal advice. Always 
                consult with a qualified attorney for your specific legal matters.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>5. Privacy Policy</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Your privacy is important to us. We collect and use information in accordance with 
                our Privacy Policy, which forms part of these Terms and Conditions.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>6. User Conduct</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Users agree not to use the service for any unlawful purpose or in any way that could 
                damage, disable, overburden, or impair the service.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>7. Contact Information</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                If you have any questions about these Terms and Conditions, please contact us through 
                our support channels.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}