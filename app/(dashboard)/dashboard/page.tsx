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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
// Import your working Supabase client utility
import { createClient } from "@/utils/supabase/client"

type ToastOptions = {
  title: string
  description?: string
  variant?: "default" | "destructive"
}

function useToast() {
  const toast = React.useCallback(({ title, description, variant }: ToastOptions) => {
    const message = `${title}${description ? `: ${description}` : ""}`
    if (variant === "destructive") {
      console.error(message)
    } else {
      console.info(message)
    }
  }, [])

  return { toast }
}

interface Note {
  id: string
  title: string
  content: string
  created_at: string
}

export default function DashboardPage() {
  const { toast } = useToast()
  const supabase = createClient()
  
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(true)
  const [notes, setNotes] = React.useState<Note[]>([])

  // 1. Fetch user's active notes from Supabase on load
  const fetchNotes = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from("notes")
        .select("id, title, content, created_at")
        .eq("is_archived", false)
        .order("created_at", { ascending: false })

      if (error) throw error
      setNotes(data || [])
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error loading notes",
        description: error.message,
      })
    } finally {
      setIsLoading(false)
    }
  }, [supabase, toast])

  React.useEffect(() => {
    fetchNotes()
  }, [fetchNotes])

  // 2. Insert a fresh note row attached to the active user's ID
  async function handleCreateNote(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const title = formData.get("title") as string
    const content = formData.get("content") as string

    try {
      // Get the current user session ID
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("No authenticated user found.")

      const { error } = await supabase
        .from("notes")
        .insert([
          { title, content, user_id: user.id }
        ])

      if (error) throw error

      setIsDialogOpen(false)
      toast({
        title: "Note created!",
        description: "Your note has been securely saved to the database.",
      })
      
      // Refresh list from the backend
      fetchNotes()
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to save note",
        description: error.message,
      })
    }
  }

  // 3. Archive an existing note row
  async function handleArchiveNote(id: string) {
    try {
      const { error } = await supabase
        .from("notes")
        .update({ is_archived: true })
        .eq("id", id)

      if (error) throw error

      toast({
        title: "Note archived",
        description: "The note has been moved to your archive folder.",
      })
      fetchNotes()
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Archive failed",
        description: error.message,
      })
    }
  }

  // 4. Hard delete a note row from Postgres
  async function handleDeleteNote(id: string) {
    try {
      const { error } = await supabase
        .from("notes")
        .delete()
        .eq("id", id)

      if (error) throw error

      toast({
        title: "Note deleted",
        description: "The note was permanently removed.",
      })
      fetchNotes()
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Deletion failed",
        description: error.message,
      })
    }
  }

  // Format timestamp helper
  function formatDate(isoString: string) {
    return new Date(isoString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  return (
    <div className="space-y-8">
      {/* Dashboard Top Toolbar Area */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Notes</h1>
          <p className="text-muted-foreground text-sm">Create, filter, and manage your cloud-hosted text fields.</p>
        </div>

        {/* Add Note Modal Wrapper */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <Button size="lg" className="shadow-sm" onClick={() => setIsDialogOpen(true)}>
            Create Note
          </Button>
          <DialogContent className="sm:max-w-131.25">
            <DialogHeader>
              <DialogTitle>New Note Entry</DialogTitle>
              <DialogDescription>
                Draft down your text ideas below. Clicking save uploads it instantly via Row Level Security permissions.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateNote}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Input id="title" name="title" placeholder="Note Title" required />
                </div>
                <div className="space-y-2">
                  <Textarea id="content" name="content" placeholder="Start typing your contents here..." className="min-h-37.5" required />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button type="submit">Save Note</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Loading or Empty Grid Render States */}
      {isLoading ? (
        <div className="flex min-h-75 items-center justify-center">
          <p className="text-muted-foreground animate-pulse">Syncing notebook fields...</p>
        </div>
      ) : notes.length === 0 ? (
        <div className="flex min-h-75 flex-col items-center justify-center rounded-lg border border-dashed text-center p-8 bg-muted/20">
          <h3 className="text-xl font-semibold mt-2">No notes available</h3>
          <p className="text-muted-foreground text-sm max-w-sm mt-1">Get started by creating your very first database-connected markdown note entry card!</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {notes.map((note) => (
            <Card key={note.id} className="flex flex-col justify-between hover:shadow-md transition-shadow duration-200">
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
                <div className="space-y-1">
                  <CardTitle className="text-xl font-semibold tracking-tight">{note.title}</CardTitle>
                  <CardDescription className="text-xs">{formatDate(note.created_at)}</CardDescription>
                </div>
                {/* 3-Dot Options Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger className="inline-flex h-8 w-8 items-center justify-center rounded-md text-foreground hover:bg-muted">
                    <span className="sr-only">Open Menu</span>
                    <span className="font-bold text-md leading-none">···</span>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem className="cursor-pointer" onClick={() => handleArchiveNote(note.id)}>
                      Archive
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive focus:bg-destructive/10 cursor-pointer" onClick={() => handleDeleteNote(note.id)}>
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-4">{note.content}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
