import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Terminal } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { TypoCaption, TypoHeading } from "@/components/shared/Typography";

export const Route = createFileRoute("/_app/design-system")({
  component: DesignSystemComponent,
});

function DesignSystemComponent() {
  return (
    <div className="container py-10 space-y-12">
      <div className="space-y-4">
        <TypoHeading as="h1">Design System</TypoHeading>
        <TypoCaption as="p">
          A unified design system of reusable, accessible components for DevLink.
        </TypoCaption>
      </div>

      <section className="space-y-4 border rounded-lg p-6">
        <TypoHeading as="h2">Buttons</TypoHeading>
        <div className="flex flex-wrap gap-4">
          <Button>Default</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Link</Button>
        </div>
      </section>

      <section className="space-y-4 border rounded-lg p-6">
        <TypoHeading as="h2">Inputs & Forms</TypoHeading>
        <div className="grid max-w-sm gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="Email" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea id="bio" placeholder="Tell us a little bit about yourself" />
          </div>
          <div className="flex items-center space-x-2 mt-4">
            <Checkbox id="terms" />
            <Label htmlFor="terms">Accept terms and conditions</Label>
          </div>
          <RadioGroup defaultValue="option-one" className="mt-4">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="option-one" id="option-one" />
              <Label htmlFor="option-one">Option One</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="option-two" id="option-two" />
              <Label htmlFor="option-two">Option Two</Label>
            </div>
          </RadioGroup>
        </div>
      </section>

      <section className="space-y-4 border rounded-lg p-6">
        <TypoHeading as="h2">Badges & Chips</TypoHeading>
        <div className="flex flex-wrap gap-4">
          <Badge>Default Badge</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="destructive">Destructive</Badge>
          <Badge variant="outline">Outline</Badge>
          <Chip>React</Chip>
          <Chip variant="secondary">Node.js</Chip>
        </div>
      </section>

      <section className="space-y-4 border rounded-lg p-6">
        <TypoHeading as="h2">Avatar</TypoHeading>
        <div className="flex gap-4">
          <Avatar>
            <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
          <Avatar>
            <AvatarFallback>JD</AvatarFallback>
          </Avatar>
        </div>
      </section>

      <section className="space-y-4 border rounded-lg p-6">
        <TypoHeading as="h2">Cards</TypoHeading>
        <div className="grid sm:grid-cols-2 gap-4 max-w-3xl">
          <Card>
            <CardHeader>
              <CardTitle>Card Title</CardTitle>
              <CardDescription>Card Description</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Card Content goes here.</p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="space-y-4 border rounded-lg p-6">
        <TypoHeading as="h2">Alerts</TypoHeading>
        <div className="space-y-4 max-w-2xl">
          <Alert>
            <Terminal className="h-4 w-4" />
            <AlertTitle>Heads up!</AlertTitle>
            <AlertDescription>You can add components to your app using the cli.</AlertDescription>
          </Alert>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>Your session has expired. Please log in again.</AlertDescription>
          </Alert>
        </div>
      </section>

      <section className="space-y-4 border rounded-lg p-6">
        <TypoHeading as="h2">Skeleton</TypoHeading>
        <div className="flex items-center space-x-4 max-w-sm">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
          </div>
        </div>
      </section>

      <section className="space-y-4 border rounded-lg p-6">
        <TypoHeading as="h2">Empty State</TypoHeading>
        <EmptyState
          title="No projects found"
          description="Get started by creating a new project."
          action={<Button>Create Project</Button>}
        />
      </section>
    </div>
  );
}
