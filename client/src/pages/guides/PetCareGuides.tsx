import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"

export default function PetCareGuides() {
  const guides = {
    dogs: [
      { title: "New Puppy Care", content: "Essential tips for the first few weeks with your puppy..." },
      { title: "Basic Training", content: "House training, basic commands, and socialization..." },
      { title: "Nutrition Guide", content: "Feeding schedules, diet requirements, and food safety..." },
      { title: "Grooming Basics", content: "Brushing, bathing, nail care, and dental hygiene..." }
    ],
    cats: [
      { title: "Kitten Care", content: "Setting up your home, feeding, and litter training..." },
      { title: "Indoor Cat Care", content: "Environmental enrichment and exercise needs..." },
      { title: "Health & Wellness", content: "Common health issues and preventive care..." },
      { title: "Behavior Guide", content: "Understanding cat behavior and solving common issues..." }
    ],
    // Add more pet types...
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">Pet Care Guides</h1>
      <Tabs defaultValue="dogs" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="dogs">Dogs</TabsTrigger>
          <TabsTrigger value="cats">Cats</TabsTrigger>
          {/* Add more pet types */}
        </TabsList>
        {Object.entries(guides).map(([petType, guideList]) => (
          <TabsContent key={petType} value={petType}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {guideList.map((guide, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle>{guide.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[200px]">
                      <p className="text-muted-foreground">{guide.content}</p>
                    </ScrollArea>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
