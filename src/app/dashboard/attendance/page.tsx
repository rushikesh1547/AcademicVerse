import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { BarChart3 } from "lucide-react"

export default function AttendancePage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-6 w-6" />
          Attendance
        </CardTitle>
        <CardDescription>
          Detailed attendance records and summaries will be available here.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p>This page is under construction. Check back soon for attendance details!</p>
      </CardContent>
    </Card>
  )
}
