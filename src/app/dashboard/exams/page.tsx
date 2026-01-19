import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Pencil } from "lucide-react"

export default function ExamsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Pencil className="h-6 w-6" />
          Examination Forms
        </CardTitle>
        <CardDescription>
          Manage your regular and backlog examination registrations here.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p>This page is under construction. Check back soon to fill out your examination forms!</p>
      </CardContent>
    </Card>
  )
}
