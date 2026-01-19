import { Bell } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { notifications } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export default function NotificationsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-6 w-6" />
          Notifications
        </CardTitle>
        <CardDescription>
          Here are your recent notifications.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {notifications.map((notification, index) => (
          <div
            key={index}
            className="grid items-start gap-4 grid-cols-[25px_1fr] "
          >
            <span className="flex h-2 w-2 translate-y-1 rounded-full bg-primary" />
            <div className="grid gap-1">
              <p className="text-sm font-medium">{notification.title}</p>
              <p className="text-sm text-muted-foreground">
                {notification.description}
              </p>
              <p className="text-xs text-muted-foreground">{notification.time}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
