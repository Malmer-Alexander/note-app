"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/utils/supabase/client"

export default function SignupPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = React.useState<boolean>(false)
  const supabase = createClient()

  const notify = (config: {
    title: string
    description?: string
    variant?: "default" | "destructive"
  }) => {
    if (typeof window === "undefined") return

    const message = [config.title, config.description].filter(Boolean).join("\n")
    window.alert(message)
  }

  async function onSubmit(event: React.SyntheticEvent) {
    event.preventDefault()
    setIsLoading(true)

    const target = event.target as typeof event.target & {
      email: { value: string }
      password: { value: string }
      confirmPassword: { value: string }
    }
    
    const email = target.email.value
    const password = target.password.value
    const confirmPassword = target.confirmPassword.value

    if (password !== confirmPassword) {
      notify({
        variant: "destructive",
        title: "Passwords do not match",
        description: "Please make sure both password fields are identical.",
      })
      setIsLoading(false)
      return
    }

    try {
      // Connect to live Supabase Auth Registration
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          // Point back to your auth handler callback route if email confirmation is on
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        notify({
          variant: "destructive",
          title: "Registration Failed",
          description: error.message,
        })
        return
      }

      // Check if user needs to confirm email or is signed in instantly
      if (data?.session) {
        notify({
          title: "Welcome aboard!",
          description: "Your account has been created successfully.",
        })
        router.push("/dashboard")
      } else {
        notify({
          title: "Check your email!",
          description: "We sent a confirmation link to finalize your registration.",
        })
        router.push("/login")
      }
    } catch (err) {
      notify({
        variant: "destructive",
        title: "Registration Failed",
        description: "An unexpected error occurred. Please try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold tracking-tight">
            Create an account
          </CardTitle>
          <CardDescription>
            Enter your details below to create your note-taking account
          </CardDescription>
        </CardHeader>
        <form onSubmit={onSubmit}>
          <CardContent className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="name@example.com"
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="••••••••"
                required
                disabled={isLoading}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 pt-2 pb-6">
            <Button className="w-full" type="submit" disabled={isLoading}>
              {isLoading ? "Creating account..." : "Sign Up"}
            </Button>
            <div className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                Sign in
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
