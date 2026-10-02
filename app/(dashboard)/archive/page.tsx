"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
// Import your working Supabase client utility
import { createClient } from "@/utils/supabase/client"

interface ArchivedNote {
  id: string
  title: string
  content: string
  created_at: string
}

export default function ArchivePage() {
  const supabase = createClient()
  
  const [isLoading, setIsLoading] = React.useState(true)
  const [archivedNotes, setArchivedNotes] = React.useState<ArchivedNote[]>([])

  // 1. Fetch only archived notes from Supabase on load
  const fetchArchivedNotes = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from("notes")
        .select("id, title, content, created_at")
        .eq("is_archived", true)
        .order("created_at", { ascending: false })

      if (error) throw error
      setArchivedNotes(data || [])
    } catch (error: any) {
      console.error("Error loading archive:", error)
    } finally {
      setIsLoading(false)
    }
  }, [supabase])

  React.useEffect(() => {
    fetchArchivedNotes()
  }, [fetchArchivedNotes])

  // 2. Bring an archived note row back to the main dashboard
  async function handleUnarchive(id: string) {
    try {
      const { error } = await supabase
        .from("notes")
        .update({ is_archived: false })
        .eq("id", id)

      if (error) throw error

      fetchArchivedNotes()
    } catch (error: any) {
      console.error("Unarchive failed:", error)
    }
  }

  // 3. Hard delete a note row permanently from Postgres
  async function handleDeleteForever(id: string) {
    try {
      const { error } = await supabase
        .from("notes")
        .delete()
        .eq("id", id)

      if (error) throw error

      fetchArchivedNotes()
    } catch (error: any) {
      console.error("Deletion failed:", error)
    }
  }

  function formatDate(isoString: string) {
    return new Date(isoString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Archived Notes</h1>
        <p className="text-muted-foreground text-sm">
          Review or restore notes you have tucked away from your primary workspace.
        </p>
      </div>

      {/* Grid Display Logic */}
      {isLoading ? (
        <div className="flex min-h-75 items-center justify-center">
          <p className="text-muted-foreground animate-pulse">Syncing archive vaults...</p>
        </div>
      ) : archivedNotes.length === 0 ? (
        <div className="flex min-h-75 flex-col items-center justify-center rounded-lg border border-dashed text-center p-8 bg-muted/20">
          <h3 className="text-xl font-semibold mt-2">Your archive is empty</h3>
          <p className="text-muted-foreground text-sm max-w-sm mt-1">
            Notes you archive from your main dashboard view will show up safe and sound right here.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {archivedNotes.map((note) => (
            <Card key={note.id} className="flex flex-col justify-between opacity-85 hover:opacity-100 transition-opacity duration-200 hover:shadow-md">
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
                <div className="space-y-1">
                  <CardTitle className="text-xl font-semibold tracking-tight">
                    {note.title}
                  </CardTitle>
                  <CardDescription className="text-xs">{formatDate(note.created_at)}</CardDescription>
                </div>
                
                {/* 3-Dot Dropdown Options */}
                <DropdownMenu>
                  <DropdownMenuTrigger className="inline-flex h-8 w-8 items-center justify-center rounded-md p-0 text-sm font-medium hover:bg-accent hover:text-accent-foreground">
                    <span className="sr-only">Open Menu</span>
                    <span className="font-bold text-md leading-none">···</span>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem 
                      className="cursor-pointer" 
                      onClick={() => handleUnarchive(note.id)}
                    >
                      Unarchive
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="text-destructive focus:bg-destructive/10 cursor-pointer" 
                      onClick={() => handleDeleteForever(note.id)}
                    >
                      Delete Forever
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-4">
                  {note.content}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

