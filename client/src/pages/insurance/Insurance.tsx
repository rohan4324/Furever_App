import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"

export default function Insurance() {
  const insurancePlans = [
    {
      provider: "PawShield",
      plans: [
        {
          name: "Basic Care",
          coverage: ["Accidents", "Emergencies", "Basic Illnesses"],
          price: "₹499/month",
          deductible: "₹2,000",
          maxCoverage: "₹50,000/year"
        },
        {
          name: "Complete Care",
          coverage: ["Accidents", "All Illnesses", "Routine Care", "Dental"],
          price: "₹999/month",
          deductible: "₹1,000",
          maxCoverage: "₹200,000/year"
        }
      ]
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">Pet Insurance</h1>
      
      <Tabs defaultValue="compare" className="w-full">
        <TabsList>
          <TabsTrigger value="compare">Compare Plans</TabsTrigger>
          <TabsTrigger value="enrolled">My Policies</TabsTrigger>
          <TabsTrigger value="claims">Claims</TabsTrigger>
        </TabsList>

        <TabsContent value="compare">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {insurancePlans.map((provider) =>
              provider.plans.map((plan, index) => (
                <Card key={`${provider.provider}-${index}`}>
                  <CardHeader>
                    <CardTitle className="flex justify-between items-center">
                      {plan.name}
                      <span className="text-lg font-normal">{plan.price}</span>
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">{provider.provider}</p>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[200px] mb-4">
                      <div className="space-y-2">
                        <p><strong>Coverage:</strong></p>
                        <ul className="list-disc pl-4">
                          {plan.coverage.map((item, i) => (
                            <li key={i}>{item}</li>
                          ))}
                        </ul>
                        <p><strong>Deductible:</strong> {plan.deductible}</p>
                        <p><strong>Maximum Coverage:</strong> {plan.maxCoverage}</p>
                      </div>
                    </ScrollArea>
                    <Button className="w-full">Learn More</Button>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="enrolled">
          <Card>
            <CardContent className="p-6">
              <p>No active insurance policies found. Compare and enroll in a plan to get started.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="claims">
          <Card>
            <CardContent className="p-6">
              <p>No claims history found. Active policy required to file claims.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
