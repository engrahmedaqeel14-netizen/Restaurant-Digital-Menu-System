import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useCreateRestaurant } from "@workspace/api-client-react";
import { getListRestaurantsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Building2 } from "lucide-react";
import { Link } from "wouter";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  contactEmail: z.string().email("Invalid email address.").optional().or(z.literal("")),
  contactPhone: z.string().optional(),
  address: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function RestaurantNew() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      contactEmail: "",
      contactPhone: "",
      address: "",
    },
  });

  const createMutation = useCreateRestaurant({
    mutation: {
      onSuccess: (data) => {
        toast({
          title: "Restaurant created",
          description: `${data.name} has been added to the system.`,
        });
        queryClient.invalidateQueries({ queryKey: getListRestaurantsQueryKey() });
        setLocation(`/restaurants/${data.id}`);
      },
      onError: (error: any) => {
        toast({
          variant: "destructive",
          title: "Failed to create restaurant",
          description: error?.error || "An unexpected error occurred.",
        });
      }
    }
  });

  function onSubmit(values: FormValues) {
    createMutation.mutate({ data: values });
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4">
        <Link href="/restaurants">
          <Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Add New Client</h1>
          <p className="text-muted-foreground mt-1">Create a new restaurant account in the system</p>
        </div>
      </div>

      <Card className="shadow-lg border-border hover-elevate">
        <CardHeader className="bg-muted/30 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle>Client Information</CardTitle>
              <CardDescription>Enter the basic details for the new restaurant.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Restaurant Name <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Joe's Diner" {...field} className="bg-background" />
                    </FormControl>
                    <FormDescription>
                      This is the name that will be displayed in the admin panel.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="contactEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="joe@example.com" {...field} className="bg-background" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="contactPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Phone</FormLabel>
                      <FormControl>
                        <Input type="tel" placeholder="(555) 123-4567" {...field} className="bg-background" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Physical Address</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="123 Main St, City, State ZIP" 
                        {...field} 
                        className="resize-none bg-background h-24"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-4 pt-4 border-t border-border">
                <Link href="/restaurants">
                  <Button variant="outline" type="button">Cancel</Button>
                </Link>
                <Button 
                  type="submit" 
                  disabled={createMutation.isPending}
                  className="active-elevate-2 shadow-sm min-w-32"
                >
                  {createMutation.isPending ? "Creating..." : "Create Client"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}