import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { studentData, attendanceSummary, assignments } from "@/lib/mock-data";
import { Download, User } from "lucide-react";

export default function ProfilePage() {
    const userAvatar = PlaceHolderImages.find(p => p.id === 'user-avatar-1');

    return (
        <div className="grid gap-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <User className="h-6 w-6" />
                        Student Profile
                    </CardTitle>
                    <CardDescription>The single source of truth for your academic life.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-start gap-6">
                        <Avatar className="h-24 w-24">
                            {userAvatar && <AvatarImage src={userAvatar.imageUrl} alt="User Avatar" />}
                            <AvatarFallback className="text-3xl">SD</AvatarFallback>
                        </Avatar>
                        <div className="grid gap-2">
                            <h2 className="text-2xl font-bold font-headline">{studentData.name}</h2>
                            <p className="text-muted-foreground">Student ID: {studentData.id}</p>
                            <p className="text-muted-foreground">Email: {studentData.email}</p>
                            <p className="text-muted-foreground">Major: {studentData.major}</p>
                            <p className="text-muted-foreground">Current Year: {studentData.year}</p>
                            <p className="text-muted-foreground">CGPA: {studentData.cgpa}</p>
                        </div>
                        <Button variant="outline" size="sm" className="ml-auto">
                            <Download className="mr-2 h-4 w-4" />
                            Download Grade Card
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Attendance Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Subject</TableHead>
                                    <TableHead className="text-right">Percentage</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {attendanceSummary.map((item, index) => {
                                    const percentage = (item.attended / item.total) * 100;
                                    return (
                                        <TableRow key={index}>
                                            <TableCell>{item.subject}</TableCell>
                                            <TableCell className="text-right">{percentage.toFixed(1)}%</TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Assignment Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Assignment</TableHead>
                                    <TableHead className="text-right">Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {assignments.slice(0, 5).map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell>{item.title}</TableCell>
                                        <TableCell className="text-right">{item.status}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
