import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Award } from "lucide-react"

export default function ResultsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="h-6 w-6" />
          Results
        </CardTitle>
        <CardDescription>
          View your published semester results and SGPA.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p>This page is under construction. Check back soon for your results!</p>
      </CardContent>
    </Card>
  )
}
