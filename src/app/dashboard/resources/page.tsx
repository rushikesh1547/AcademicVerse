import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { BookOpen } from "lucide-react"

export default function ResourcesPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-6 w-6" />
          Resources
        </CardTitle>
        <CardDescription>
          Access academic materials shared by your teachers.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p>This page is under construction. Check back soon for shared resources!</p>
      </CardContent>
    </Card>
  )
}
