import { redirect } from "next/navigation"

export default function RootPage() {
  // Automatically bounces the user to your login folder
  redirect("/login")
}

