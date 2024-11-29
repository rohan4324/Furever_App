import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Share2, Download, QrCode } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface MedicalRecord {
  id: number;
  type: "condition" | "medication" | "allergy" | "surgery" | "test_result";
  description: string;
  date: string;
  veterinarianId: number | null;
  documentUrl: string | null;
}

interface MedicalHistoryProps {
  petId: number;
  petName: string;
}

export function MedicalHistory({ petId, petName }: MedicalHistoryProps) {
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [qrCode, setQrCode] = useState<string>("");
  const { toast } = useToast();

  useEffect(() => {
    fetchMedicalRecords();
  }, [petId]);

  const fetchMedicalRecords = async () => {
    try {
      const response = await fetch(`/api/health-records/${petId}`);
      if (!response.ok) throw new Error("Failed to fetch medical records");
      const data = await response.json();
      setRecords(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load medical records",
        variant: "destructive",
      });
    }
  };

  const generateQRCode = async (record: MedicalRecord) => {
    try {
      const response = await fetch("/api/generate-qr", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recordId: record.id,
          animalType: "pet",
          recordType: record.type,
          date: record.date,
          description: record.description,
        }),
      });

      if (!response.ok) throw new Error("Failed to generate QR code");
      const data = await response.json();
      setQrCode(data.qrUrl);
      setShowQRDialog(true);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate QR code",
        variant: "destructive",
      });
    }
  };

  const handleShare = async (record: MedicalRecord) => {
    setSelectedRecord(record);
    await generateQRCode(record);
  };

  const getRecordTypeIcon = (type: MedicalRecord["type"]) => {
    const iconClass = "w-4 h-4 mr-2";
    switch (type) {
      case "condition":
        return "🏥";
      case "medication":
        return "💊";
      case "allergy":
        return "⚠️";
      case "surgery":
        return "🔪";
      case "test_result":
        return "🔬";
      default:
        return "📋";
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold mb-4">{petName}'s Medical History</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {records.map((record) => (
          <Card key={record.id} className="relative">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <span className="mr-2">{getRecordTypeIcon(record.type)}</span>
                {record.type.charAt(0).toUpperCase() + record.type.slice(1).replace("_", " ")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-2">
                {new Date(record.date).toLocaleDateString()}
              </p>
              <p className="mb-4">{record.description}</p>
              <div className="flex justify-end space-x-2">
                {record.documentUrl && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(record.documentUrl!, "_blank")}
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Document
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleShare(record)}
                >
                  <Share2 className="w-4 h-4 mr-1" />
                  Share
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Medical Record</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center space-y-4">
            <img src={qrCode} alt="QR Code" className="w-48 h-48" />
            <p className="text-sm text-center text-muted-foreground">
              Scan this QR code to share the medical record
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
