import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useLocation } from "wouter";

const questions = [
  {
    id: 1,
    question: "What type of living space do you have?",
    options: ["Apartment", "House with yard", "Small house", "Farm/Large property"],
  },
  {
    id: 2,
    question: "How many hours per day are you usually at home?",
    options: ["0-4 hours", "4-8 hours", "8-12 hours", "12+ hours"],
  },
  {
    id: 3,
    question: "Do you have experience with pets?",
    options: ["First-time owner", "Some experience", "Very experienced", "Professional"],
  },
  {
    id: 4,
    question: "What is your activity level?",
    options: ["Sedentary", "Moderately active", "Active", "Very active"],
  },
  {
    id: 5,
    question: "Do you have any children at home?",
    options: ["No children", "Older children", "Young children", "Expecting"],
  },
];

export default function CompatibilityQuiz() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [, navigate] = useLocation();

  const progress = ((currentQuestion + 1) / questions.length) * 100;

  const handleAnswer = (answer: string) => {
    setAnswers({ ...answers, [questions[currentQuestion].id]: answer });
    
    if (currentQuestion === questions.length - 1) {
      const results = calculateResults({...answers, [questions[currentQuestion].id]: answer});
      const queryString = new URLSearchParams(
        Object.entries(results)
          .filter(([_, value]) => value !== undefined && value !== "")
          .reduce((acc, [key, value]) => ({...acc, [key]: value}), {})
      ).toString();
      navigate(`/pets?${queryString}`);
    } else {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const calculateResults = (answers: Record<number, string>) => {
    const result: Record<string, string> = {};
    
    // Living space mapping
    if (answers[1] === "Apartment" || answers[1] === "Small house") {
      result.size = "small";
    } else if (answers[1] === "House with yard") {
      result.size = "medium";
    } else if (answers[1] === "Farm/Large property") {
      result.size = "large";
    }
    
    // Hours at home mapping
    if (answers[2] === "0-4 hours") {
      result.type = "cat";
    } else if (answers[2] === "12+ hours") {
      // More flexible with pet type for people home often
      result.type = "";
    }
    
    // Experience level affects recommendations
    if (answers[3] === "First-time owner") {
      // Prefer easier pets for first-time owners
      result.type = result.type || "cat";
    }
    
    // Activity level mapping
    if (answers[4] === "Very active") {
      result.type = "dog"; // Dogs better for active people
    }
    
    // Children consideration
    if (answers[5] === "Young children" || answers[5] === "Expecting") {
      result.type = "dog"; // Dogs often good with kids
      result.size = "medium"; // Medium size safer with children
    }
    
    return result;
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Find Your Perfect Match</h1>
        <p className="text-lg text-muted-foreground">
          Answer a few questions to help us recommend the perfect pet for your lifestyle.
        </p>
      </div>

      <Progress value={progress} className="h-2" />

      <Card className="p-6">
        <CardContent>
          <h2 className="text-2xl font-semibold mb-6">
            {questions[currentQuestion].question}
          </h2>
          <div className="space-y-4">
            {questions[currentQuestion].options.map((option) => (
              <Button
                key={option}
                variant="outline"
                className="w-full text-left justify-start h-auto py-4 text-lg"
                onClick={() => handleAnswer(option)}
              >
                {option}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
