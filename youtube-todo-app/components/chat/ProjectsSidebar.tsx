'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PlusIcon, FolderIcon, EditIcon, TrashIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ChatProject } from '@/lib/db/schema';

interface ProjectsSidebarProps {
  selectedProjectId?: string;
  onProjectSelect: (projectId: string | undefined) => void;
  className?: string;
}

export function ProjectsSidebar({
  selectedProjectId,
  onProjectSelect,
  className,
}: ProjectsSidebarProps) {
  const [projects, setProjects] = useState<ChatProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingProject, setEditingProject] = useState<ChatProject | null>(null);
  const [newProject, setNewProject] = useState({ name: '', description: '' });

  // Fetch projects
  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/chat/projects');
      if (response.ok) {
        const data = await response.json();
        setProjects(data.projects);
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  // Create project
  const handleCreateProject = async () => {
    if (!newProject.name.trim()) return;

    try {
      const response = await fetch('/api/chat/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProject),
      });

      if (response.ok) {
        const data = await response.json();
        setProjects([data.project, ...projects]);
        setNewProject({ name: '', description: '' });
        setShowCreateDialog(false);
      }
    } catch (error) {
      console.error('Failed to create project:', error);
    }
  };

  // Update project
  const handleUpdateProject = async () => {
    if (!editingProject || !editingProject.name.trim()) return;

    try {
      const response = await fetch('/api/chat/projects', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: editingProject.id,
          name: editingProject.name,
          description: editingProject.description,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setProjects(projects.map(p => p.id === data.project.id ? data.project : p));
        setEditingProject(null);
      }
    } catch (error) {
      console.error('Failed to update project:', error);
    }
  };

  // Delete project
  const handleDeleteProject = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project? All threads will be deleted.')) {
      return;
    }

    try {
      const response = await fetch(`/api/chat/projects?projectId=${projectId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setProjects(projects.filter(p => p.id !== projectId));
        if (selectedProjectId === projectId) {
          onProjectSelect(undefined);
        }
      }
    } catch (error) {
      console.error('Failed to delete project:', error);
    }
  };

  if (loading) {
    return (
      <div className={cn("flex flex-col h-full p-4", className)}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Projects</h2>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-sm text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col h-full p-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Projects</h2>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button size="sm" variant="ghost">
              <PlusIcon className="w-4 h-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Project</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="project-name">Project Name</Label>
                <Input
                  id="project-name"
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  placeholder="Enter project name"
                />
              </div>
              <div>
                <Label htmlFor="project-description">Description (optional)</Label>
                <Textarea
                  id="project-description"
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  placeholder="Enter project description"
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateProject}>Create</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* All Chats Option */}
      <Button
        variant={selectedProjectId ? "ghost" : "secondary"}
        className="justify-start mb-2 h-auto p-3"
        onClick={() => onProjectSelect(undefined)}
      >
        <FolderIcon className="w-4 h-4 mr-3" />
        <div className="text-left">
          <div className="font-medium">All Chats</div>
          <div className="text-xs text-muted-foreground">View all conversations</div>
        </div>
      </Button>

      {/* Projects List */}
      <ScrollArea className="flex-1">
        <div className="space-y-2">
          {projects.map((project) => (
            <Card
              key={project.id}
              className={cn(
                "p-3 cursor-pointer hover:bg-accent transition-colors group",
                selectedProjectId === project.id && "bg-accent border-primary"
              )}
              onClick={() => onProjectSelect(project.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <FolderIcon className="w-4 h-4 flex-shrink-0" />
                    <h3 className="font-medium truncate">{project.name}</h3>
                  </div>
                  {project.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {project.description}
                    </p>
                  )}
                </div>
                
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingProject(project);
                    }}
                  >
                    <EditIcon className="w-3 h-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteProject(project.id);
                    }}
                  >
                    <TrashIcon className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </ScrollArea>

      {/* Edit Project Dialog */}
      <Dialog open={!!editingProject} onOpenChange={(open) => !open && setEditingProject(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
          </DialogHeader>
          {editingProject && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-project-name">Project Name</Label>
                <Input
                  id="edit-project-name"
                  value={editingProject.name}
                  onChange={(e) => setEditingProject({ ...editingProject, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-project-description">Description</Label>
                <Textarea
                  id="edit-project-description"
                  value={editingProject.description || ''}
                  onChange={(e) => setEditingProject({ ...editingProject, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditingProject(null)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateProject}>Save Changes</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}