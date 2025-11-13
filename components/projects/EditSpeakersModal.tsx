"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

interface SpeakerMapping {
  name: string
  role: 'moderator' | 'respondent'
}

interface EditSpeakersModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  speakers: string[] // Array of speaker IDs like ['A', 'B']
  currentMappings: Record<string, SpeakerMapping> | null
  onSave: (mappings: Record<string, SpeakerMapping>) => Promise<void>
}

export default function EditSpeakersModal({
  open,
  onOpenChange,
  speakers,
  currentMappings,
  onSave
}: EditSpeakersModalProps) {
  const { toast } = useToast()
  const [mappings, setMappings] = useState<Record<string, SpeakerMapping>>({})
  const [isSaving, setIsSaving] = useState(false)

  // Initialize mappings with defaults or current values
  useEffect(() => {
    if (open && speakers.length > 0) {
      const initialMappings: Record<string, SpeakerMapping> = {}
      speakers.forEach(speaker => {
        if (currentMappings && currentMappings[speaker]) {
          initialMappings[speaker] = { ...currentMappings[speaker] }
        } else {
          // Default: name is "Speaker X", role is "respondent"
          initialMappings[speaker] = {
            name: `Speaker ${speaker}`,
            role: 'respondent'
          }
        }
      })
      setMappings(initialMappings)
    }
  }, [open, speakers, currentMappings])

  const handleNameChange = (speaker: string, name: string) => {
    setMappings(prev => ({
      ...prev,
      [speaker]: {
        ...prev[speaker],
        name: name.trim() || `Speaker ${speaker}`
      }
    }))
  }

  const handleRoleChange = (speaker: string, role: 'moderator' | 'respondent') => {
    setMappings(prev => ({
      ...prev,
      [speaker]: {
        ...prev[speaker],
        role
      }
    }))
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      await onSave(mappings)
      toast({
        title: "Speakers updated",
        description: "Speaker names and roles have been saved successfully.",
      })
      onOpenChange(false)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save speaker mappings",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Speakers</DialogTitle>
          <DialogDescription>
            Assign names and roles to each speaker in this interview. By default, all speakers are respondents.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {speakers.map((speaker) => (
            <div key={speaker} className="space-y-2 p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <div 
                  className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-white font-medium text-sm"
                  style={{ 
                    backgroundColor: `hsl(${(speaker.charCodeAt(0) - 65) * 45}, 70%, 50%)` 
                  }}
                >
                  {speaker}
                </div>
                <Label className="font-semibold">Speaker {speaker}</Label>
              </div>
              
              <div className="space-y-3">
                <div>
                  <Label htmlFor={`name-${speaker}`}>Name</Label>
                  <Input
                    id={`name-${speaker}`}
                    value={mappings[speaker]?.name || `Speaker ${speaker}`}
                    onChange={(e) => handleNameChange(speaker, e.target.value)}
                    placeholder={`Speaker ${speaker}`}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor={`role-${speaker}`}>Role</Label>
                  <Select
                    value={mappings[speaker]?.role || 'respondent'}
                    onValueChange={(value: 'moderator' | 'respondent') => handleRoleChange(speaker, value)}
                  >
                    <SelectTrigger id={`role-${speaker}`} className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="respondent">Respondent</SelectItem>
                      <SelectItem value="moderator">Moderator</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

