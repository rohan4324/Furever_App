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
    birds: [
      { title: "Bird Care Basics", content: "Setting up the perfect habitat and environment..." },
      { title: "Dietary Requirements", content: "Essential nutrients, seeds, and fresh foods..." },
      { title: "Training & Bonding", content: "Building trust and teaching basic commands..." },
      { title: "Health Monitoring", content: "Common signs of illness and preventive care..." }
    ],
    fish: [
      { title: "Aquarium Setup", content: "Tank preparation, water conditions, and filtration..." },
      { title: "Water Maintenance", content: "Regular cleaning and water parameter monitoring..." },
      { title: "Feeding Guide", content: "Types of food and feeding schedules..." },
      { title: "Common Species Care", content: "Specific care requirements for popular fish species..." }
    ],
    hamsters: [
      { title: "Habitat Setup", content: "Cage requirements, bedding, and enrichment items..." },
      { title: "Diet & Nutrition", content: "Balanced diet, treats, and feeding schedule..." },
      { title: "Handling Tips", content: "Safe handling and socialization techniques..." },
      { title: "Health Care", content: "Common health issues and preventive measures..." }
    ],
    rabbits: [
      { title: "Housing Setup", content: "Indoor/outdoor housing, bedding, and safety..." },
      { title: "Nutrition Basics", content: "Hay, pellets, vegetables, and treats..." },
      { title: "Grooming Guide", content: "Brushing, nail trimming, and dental care..." },
      { title: "Exercise Needs", content: "Play time, toys, and environmental enrichment..." }
    ],
    guinea_pigs: [
      { title: "Cage Setup", content: "Space requirements, bedding, and accessories..." },
      { title: "Feeding Guide", content: "Hay, pellets, vegetables, and vitamin C..." },
      { title: "Social Needs", content: "Companionship and interaction requirements..." },
      { title: "Health Care", content: "Common ailments and preventive care..." }
    ]
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">Pet Care Guides</h1>
      <Tabs defaultValue="dogs" className="w-full">
        <TabsList className="mb-4 flex flex-wrap gap-2">
          <TabsTrigger value="dogs">Dogs</TabsTrigger>
          <TabsTrigger value="cats">Cats</TabsTrigger>
          <TabsTrigger value="birds">Birds</TabsTrigger>
          <TabsTrigger value="fish">Fish</TabsTrigger>
          <TabsTrigger value="hamsters">Hamsters</TabsTrigger>
          <TabsTrigger value="rabbits">Rabbits</TabsTrigger>
          <TabsTrigger value="guinea_pigs">Guinea Pigs</TabsTrigger>
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
