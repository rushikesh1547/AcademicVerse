import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { KeyRound } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function SettingsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <KeyRound className="h-6 w-6" />
          API Key Management
        </CardTitle>
        <CardDescription>
          Configure the API key required for AI features.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <AlertTitle>How to set your API Key</AlertTitle>
          <AlertDescription>
            <ol className="list-decimal list-inside space-y-2 mt-2">
              <li>
                Create a file named <code>.env</code> in the root of your project directory (next to <code>package.json</code>).
              </li>
              <li>
                Add the following line to the <code>.env</code> file, replacing <code>YOUR_API_KEY_HERE</code> with your actual key:
                <pre className="mt-2 p-2 bg-muted rounded-md text-sm font-mono">
                  GEMINI_API_KEY=YOUR_API_KEY_HERE
                </pre>
              </li>
              <li>
                You must restart the application for the change to take effect.
              </li>
            </ol>
          </AlertDescription>
        </Alert>
        <div className="space-y-2">
          <Label htmlFor="api-key-input">Paste your Google AI API Key here</Label>
          <Input id="api-key-input" type="password" placeholder="Paste your key here... (this will not be saved)" />
           <p className="text-xs text-muted-foreground pt-1">
            This input is for your convenience to temporarily paste and copy your key. It is not saved. Follow the instructions above to configure it in your project.
          </p>
        </div>
      </CardContent>
       <CardFooter>
          <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer">
            <Button variant="outline">Get your API Key from Google AI Studio</Button>
          </a>
        </CardFooter>
    </Card>
  )
}
