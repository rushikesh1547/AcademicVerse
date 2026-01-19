
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { BookOpen, Download } from "lucide-react"
import { resources } from "@/lib/mock-data"
import { Button } from "@/components/ui/button"
import Link from "next/link"

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
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Uploaded By</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {resources.map((resource) => (
              <TableRow key={resource.id}>
                <TableCell className="font-medium">{resource.title}</TableCell>
                <TableCell>{resource.subject}</TableCell>
                <TableCell>{resource.uploader}</TableCell>
                <TableCell className="text-right">
                    <Button asChild variant="outline" size="sm">
                        <Link href={resource.fileUrl}>
                            <Download className="mr-2 h-4 w-4" />
                            Download
                        </Link>
                    </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
