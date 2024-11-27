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
      // Quiz completed - calculate results
      const results = calculateResults(answers);
      // Navigate to pet listings with recommended filters
      navigate(`/pets?${new URLSearchParams(results)}`);
    } else {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const calculateResults = (answers: Record<number, string>) => {
    // Simple mapping of answers to pet recommendations
    const result: Record<string, string> = {};
    
    if (answers[1] === "Apartment") {
      result.size = "small";
    }
    
    if (answers[2] === "0-4 hours") {
      result.type = "cat";
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
