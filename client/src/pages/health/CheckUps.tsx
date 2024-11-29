import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function CheckUpsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">Health Check-Ups</h1>
      <Card>
        <CardHeader>
          <CardTitle>Schedule a Check-Up</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Coming soon! Schedule regular health check-ups for your pets.</p>
        </CardContent>
      </Card>
    </div>
  );
}
