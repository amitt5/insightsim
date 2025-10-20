"use client"

import { Project } from "@/utils/types"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MoreVertical, Trash2, Edit2 } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Link from "next/link"

interface ProjectCardProps {
  project: Project;
  studyCount: number;
  onDelete?: (projectId: string) => void;
}

export default function ProjectCard({ project, studyCount, onDelete }: ProjectCardProps) {
  const formattedDate = new Date(project.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  return (
    <Card className="hover:border-blue-100 transition-colors">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <Link 
            href={`/projects/${project.id}`}
            className="font-semibold hover:text-blue-600 transition-colors block"
          >
            {project.name}
          </Link>
          <p className="text-sm text-gray-500">
            Created {formattedDate}
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link 
                href={`/projects/${project.id}`}
                className="flex items-center gap-2"
              >
                <Edit2 className="h-4 w-4" />
                Edit Project
              </Link>
            </DropdownMenuItem>
            {onDelete && (
              <DropdownMenuItem
                onClick={() => onDelete(project.id)}
                className="flex items-center gap-2 text-red-600 focus:text-red-600"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {project.objective && (
            <p className="text-sm text-gray-600 line-clamp-2">
              {project.objective}
            </p>
          )}
          
          <div className="flex justify-between items-center text-sm">
            <div className="space-x-4">
              <span className="text-gray-500">
                {studyCount} {studyCount === 1 ? 'study' : 'studies'}
              </span>
              {project.target_group && (
                <span className="text-gray-500">
                  {project.target_group}
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
