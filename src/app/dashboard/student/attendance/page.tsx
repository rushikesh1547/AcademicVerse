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
import { BarChart3, BookOpen } from "lucide-react"

export default function AttendancePage() {
    const attendanceSummary: any[] = [];
    const totalAttended = attendanceSummary.reduce((acc, item) => acc + item.attended, 0);
    const totalClasses = attendanceSummary.reduce((acc, item) => acc + item.total, 0);
    const overallPercentage = totalClasses > 0 ? (totalAttended / totalClasses) * 100 : 0;

  return (
    <div className="grid gap-6">
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-6 w-6" />
                Attendance
                </CardTitle>
                <CardDescription>
                Here are your detailed attendance records and summaries.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Overall Attendance
                            </CardTitle>
                            <BookOpen className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{overallPercentage.toFixed(1)}%</div>
                            <p className="text-xs text-muted-foreground">
                                Across all subjects
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle>Subject-wise Attendance</CardTitle>
                <CardDescription>
                    Detailed attendance percentage for each subject.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Subject</TableHead>
                            <TableHead>Attended Classes</TableHead>
                            <TableHead>Total Classes</TableHead>
                            <TableHead className="text-right">Percentage</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {attendanceSummary.length > 0 ? (
                            attendanceSummary.map((item, index) => {
                                const percentage = item.total > 0 ? (item.attended / item.total) * 100 : 0;
                                return (
                                    <TableRow key={index}>
                                        <TableCell className="font-medium">{item.subject}</TableCell>
                                        <TableCell>{item.attended}</TableCell>
                                        <TableCell>{item.total}</TableCell>
                                        <TableCell className="text-right">{percentage.toFixed(1)}%</TableCell>
                                    </TableRow>
                                );
                            })
                        ) : (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center">
                                    No attendance records found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    </div>
  )
}
