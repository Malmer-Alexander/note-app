"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
// Import the working Supabase client utility
import { createClient } from "@/utils/supabase/client"

function useDashboardToast() {
  return React.useCallback(
    ({
      title,
      description,
    }: {
      title?: string
      description?: string
      variant?: "default" | "destructive"
    }) => {
      if (typeof window !== "undefined") {
        const message = description ? `${title ?? "Notice"}: ${description}` : title ?? "Notice"
        window.alert(message)
      } else {
        console.log(title, description)
      }
    },
    [],
  )
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const toast = useDashboardToast()
  const supabase = createClient()
  const [userEmail, setUserEmail] = React.useState<string | null>("Loading...")

  // Fetch the currently logged-in user details when the dashboard loads
  React.useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserEmail(user.email ?? "User Account")
      } else {
        setUserEmail("Guest Account")
      }
    }
    getUser()
  }, [supabase])

  async function handleLogout() {
    try {
      // Clear the live session inside your Supabase backend database
      const { error } = await supabase.auth.signOut()

      if (error) {
        toast({
          variant: "destructive",
          title: "Sign Out Failed",
          description: error.message,
        })
        return
      }

      toast({
        title: "Logged out",
        description: "You have successfully signed out.",
      })
      
      // Kick them completely out back to your login gate folder
      router.push("/login")
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred during log out.",
      })
    }
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Persistent Left Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-10 hidden w-64 border-r bg-card p-6 md:block">
        <div className="flex h-full flex-col justify-between">
          <div className="space-y-6">
            {/* App Logo/Header */}
            <div className="flex items-center space-x-2">
              <span className="text-xl font-bold tracking-tight text-primary">📝 NoteDrop</span>
            </div>
            <Separator />
            {/* Nav Links */}
            <nav className="space-y-2">
              <Link
                href="/dashboard"
                className="inline-flex h-10 w-full items-center justify-start rounded-md bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/80"
              >
                All Notes
              </Link>
              <Link
                href="/archive"
                className="inline-flex h-10 w-full items-center justify-start rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                Archive
              </Link>
            </nav>
          </div>

          {/* User Account / Footer Context */}
          <div className="space-y-4">
            <Separator />
            <div className="flex items-center justify-between px-2">
              <div className="flex flex-col min-w-0 flex-1 pr-2">
                <span className="text-sm font-semibold truncate">User Account</span>
                <span className="text-xs text-muted-foreground truncate" title={userEmail ?? ""}>
                  {userEmail}
                </span>
              </div>
              <Button variant="ghost" size="sm" onClick={handleLogout} className="text-destructive hover:bg-destructive/10 shrink-0">
                Log out
              </Button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Screen Layout Container */}
      <div className="flex flex-1 flex-col md:pl-64">
        {/* Mobile Top Header View */}
        <header className="flex h-14 items-center justify-between border-b bg-card px-6 md:hidden">
          <span className="text-lg font-bold text-primary">NoteDrop</span>
          <Button variant="outline" size="sm" onClick={handleLogout}>Log out</Button>
        </header>

        {/* Dynamic Page Workspace Content Injector */}
        <main className="flex-1 p-6 md:p-10">{children}</main>
      </div>
    </div>
  )
}
