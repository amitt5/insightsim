import { Metadata } from "next"
import ProjectsList from "@/components/projects/ProjectsList"

export const metadata: Metadata = {
  title: "Research Projects | InsightSim",
  description: "Manage your qualitative research projects",
}

export default function ProjectsPage() {
  return <ProjectsList />
}
