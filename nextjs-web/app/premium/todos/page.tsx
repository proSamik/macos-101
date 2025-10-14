'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Edit2, Trash2, CheckCircle2, Circle, Target, Zap, Calendar, Star } from 'lucide-react';
import { Todo } from '@/lib/db/schema';


function PriorityBadge({ priority }: { priority: 'low' | 'medium' | 'high' }) {
  const config = {
    low: { 
      bg: 'bg-gradient-to-r from-emerald-500 to-green-500',
      icon: Target,
      text: 'Low Priority'
    },
    medium: { 
      bg: 'bg-gradient-to-r from-amber-500 to-orange-500',
      icon: Zap,
      text: 'Medium Priority'
    },
    high: { 
      bg: 'bg-gradient-to-r from-red-500 to-rose-500',
      icon: Star,
      text: 'High Priority'
    },
  };

  const { bg, icon: Icon, text } = config[priority];

  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white rounded-full shadow-md ${bg} hover:shadow-lg transition-all duration-200`}>
      <Icon className="w-3 h-3" />
      {text}
    </div>
  );
}

function TodoItem({ todo, onUpdate, onDelete }: { 
  todo: Todo; 
  onUpdate: (id: number, updates: Partial<Todo>) => void;
  onDelete: (id: number) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    title: todo.title,
    description: todo.description || '',
    priority: todo.priority as 'low' | 'medium' | 'high',
  });

  const handleToggleComplete = async () => {
    onUpdate(todo.id, { completed: !todo.completed });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm.title.trim()) return;

    onUpdate(todo.id, {
      title: editForm.title.trim(),
      description: editForm.description.trim() || null,
      priority: editForm.priority,
    });
    setIsEditing(false);
  };

  return (
    <Card className={`group relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
      todo.completed 
        ? 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200' 
        : 'bg-white border-slate-200 hover:border-slate-300'
    }`}>
      <CardContent className="p-6">
        <div className="flex items-start space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleToggleComplete}
            className={`relative p-0 w-8 h-8 mt-1 rounded-full transition-all duration-300 ${
              todo.completed 
                ? 'bg-green-100 hover:bg-green-200' 
                : 'bg-slate-100 hover:bg-slate-200 hover:scale-110'
            }`}
          >
            {todo.completed ? (
              <CheckCircle2 className="w-6 h-6 text-green-600 animate-pulse" />
            ) : (
              <Circle className="w-6 h-6 text-slate-400 group-hover:text-slate-600 transition-colors" />
            )}
          </Button>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className={`font-semibold text-lg mb-2 transition-all duration-200 ${
                  todo.completed 
                    ? 'line-through text-gray-500' 
                    : 'text-slate-800 group-hover:text-slate-700'
                }`}>
                  {todo.title}
                </h3>
                {todo.description && (
                  <p className={`text-sm mb-3 leading-relaxed ${
                    todo.completed 
                      ? 'line-through text-gray-400' 
                      : 'text-slate-600'
                  }`}>
                    {todo.description}
                  </p>
                )}
                <div className="flex items-center space-x-3 mt-3">
                  <PriorityBadge priority={todo.priority as 'low' | 'medium' | 'high'} />
                  <div className="flex items-center text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-lg">
                    <Calendar className="w-3 h-3 mr-1" />
                    {new Date(todo.createdAt).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric', 
                      year: 'numeric' 
                    })}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2 ml-4 opacity-0 group-hover:opacity-100 transition-all duration-300">
                <Dialog open={isEditing} onOpenChange={setIsEditing}>
                  <DialogTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="p-2 w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-700 transition-all duration-200 hover:scale-110"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg bg-white border-0 shadow-2xl">
                    <DialogHeader className="text-center">
                      <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-slate-600 to-slate-800 bg-clip-text text-transparent">
                        ✏️ Edit Task
                      </DialogTitle>
                      <DialogDescription className="text-slate-600">
                        Update your task details and keep your productivity on track!
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleEditSubmit} className="space-y-6 mt-6">
                      <div className="space-y-2">
                        <Label htmlFor="edit-title" className="text-sm font-semibold text-slate-700">Task Title</Label>
                        <Input
                          id="edit-title"
                          value={editForm.title}
                          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                          placeholder="What needs to be done?"
                          className="border-2 border-slate-200 focus:border-slate-500 rounded-lg px-4 py-3 transition-all duration-200"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-description" className="text-sm font-semibold text-slate-700">Description</Label>
                        <Textarea
                          id="edit-description"
                          value={editForm.description}
                          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                          placeholder="Add more details about this task..."
                          className="border-2 border-slate-200 focus:border-slate-500 rounded-lg px-4 py-3 transition-all duration-200"
                          rows={3}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-priority" className="text-sm font-semibold text-slate-700">Priority Level</Label>
                        <select
                          id="edit-priority"
                          value={editForm.priority}
                          onChange={(e) => setEditForm({ ...editForm, priority: e.target.value as 'low' | 'medium' | 'high' })}
                          className="w-full px-4 py-3 text-sm border-2 border-slate-200 rounded-lg focus:outline-none focus:border-slate-500 transition-all duration-200 bg-white"
                        >
                          <option value="low">🟢 Low Priority</option>
                          <option value="medium">🟡 Medium Priority</option>
                          <option value="high">🔴 High Priority</option>
                        </select>
                      </div>
                      <div className="flex gap-3 pt-4">
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setIsEditing(false)}
                          className="flex-1 py-3 border-2 border-slate-300 hover:border-slate-400 rounded-lg font-semibold transition-all duration-200"
                        >
                          Cancel
                        </Button>
                        <Button 
                          type="submit"
                          className="flex-1 py-3 bg-gradient-to-r from-slate-600 to-slate-800 hover:from-slate-700 hover:to-slate-900 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
                        >
                          <Edit2 className="w-4 h-4 mr-2" />
                          Save Changes
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="p-2 w-10 h-10 rounded-full bg-red-100 hover:bg-red-200 text-red-600 hover:text-red-700 transition-all duration-200 hover:scale-110"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete your todo item.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => onDelete(todo.id)}>
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function TodosPage() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddingTodo, setIsAddingTodo] = useState(false);
  const [newTodo, setNewTodo] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
  });


  const fetchTodos = async () => {
    try {
      const response = await fetch('/api/todos');
      if (response.ok) {
        const data = await response.json();
        setTodos(data);
      }
    } catch (error) {
      console.error('Error fetching todos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodo.title.trim()) return;

    try {
      const response = await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTodo.title.trim(),
          description: newTodo.description.trim() || undefined,
          priority: newTodo.priority,
        }),
      });

      if (response.ok) {
        const createdTodo = await response.json();
        setTodos([createdTodo, ...todos]);
        setNewTodo({ title: '', description: '', priority: 'medium' });
        setIsAddingTodo(false);
      }
    } catch (error) {
      console.error('Error creating todo:', error);
    }
  };

  const handleUpdateTodo = async (id: number, updates: Partial<Todo>) => {
    try {
      const response = await fetch(`/api/todos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        const updatedTodo = await response.json();
        setTodos(todos.map(todo => todo.id === id ? updatedTodo : todo));
      }
    } catch (error) {
      console.error('Error updating todo:', error);
    }
  };

  const handleDeleteTodo = async (id: number) => {
    try {
      const response = await fetch(`/api/todos/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setTodos(todos.filter(todo => todo.id !== id));
      }
    } catch (error) {
      console.error('Error deleting todo:', error);
    }
  };

  useEffect(() => {
    fetchTodos();
  }, []);

  const completedCount = todos.filter(todo => todo.completed).length;
  const totalCount = todos.length;

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-200 border-t-slate-600 mx-auto"></div>
          <p className="mt-4 text-slate-600 font-medium">Loading your todos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Your Tasks</h1>
          <p className="text-slate-600 mt-2">
            Manage and organize your productivity
          </p>
        </div>
        <Dialog open={isAddingTodo} onOpenChange={setIsAddingTodo}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-slate-600 to-slate-800 hover:from-slate-700 hover:to-slate-900 text-white font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
              <Plus className="w-5 h-5 mr-2" />
              Create New Task
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg bg-white border-0 shadow-2xl">
            <DialogHeader className="text-center">
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-slate-600 to-slate-800 bg-clip-text text-transparent">
                ✨ Create New Task
              </DialogTitle>
              <DialogDescription className="text-slate-600">
                Transform your ideas into actionable tasks and boost your productivity!
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateTodo} className="space-y-6 mt-6">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-sm font-semibold text-slate-700">Task Title</Label>
                <Input
                  id="title"
                  value={newTodo.title}
                  onChange={(e) => setNewTodo({ ...newTodo, title: e.target.value })}
                  placeholder="What needs to be done?"
                  className="border-2 border-slate-200 focus:border-slate-500 rounded-lg px-4 py-3 transition-all duration-200"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-semibold text-slate-700">Description</Label>
                <Textarea
                  id="description"
                  value={newTodo.description}
                  onChange={(e) => setNewTodo({ ...newTodo, description: e.target.value })}
                  placeholder="Add more details about this task..."
                  className="border-2 border-slate-200 focus:border-slate-500 rounded-lg px-4 py-3 transition-all duration-200"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority" className="text-sm font-semibold text-slate-700">Priority Level</Label>
                <select
                  id="priority"
                  value={newTodo.priority}
                  onChange={(e) => setNewTodo({ ...newTodo, priority: e.target.value as 'low' | 'medium' | 'high' })}
                  className="w-full px-4 py-3 text-sm border-2 border-slate-200 rounded-lg focus:outline-none focus:border-slate-500 transition-all duration-200 bg-white"
                >
                  <option value="low">🟢 Low Priority</option>
                  <option value="medium">🟡 Medium Priority</option>
                  <option value="high">🔴 High Priority</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsAddingTodo(false)}
                  className="flex-1 py-3 border-2 border-slate-300 hover:border-slate-400 rounded-lg font-semibold transition-all duration-200"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1 py-3 bg-gradient-to-r from-slate-600 to-slate-800 hover:from-slate-700 hover:to-slate-900 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Task
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="p-6 text-center">
            <Target className="w-8 h-8 mx-auto mb-2 text-slate-600" />
            <div className="text-2xl font-bold text-slate-800">{totalCount}</div>
            <div className="text-slate-600">Total Tasks</div>
          </CardContent>
        </Card>
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="p-6 text-center">
            <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-green-600" />
            <div className="text-2xl font-bold text-green-600">{completedCount}</div>
            <div className="text-slate-600">Completed</div>
          </CardContent>
        </Card>
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="p-6 text-center">
            <Circle className="w-8 h-8 mx-auto mb-2 text-orange-600" />
            <div className="text-2xl font-bold text-orange-600">{totalCount - completedCount}</div>
            <div className="text-slate-600">Remaining</div>
          </CardContent>
        </Card>
      </div>

      {/* Tasks List */}
      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-slate-800 flex items-center">
            <CheckCircle2 className="w-6 h-6 mr-2 text-slate-600" />
            Your Task List
          </CardTitle>
          <CardDescription>
            Organize, prioritize, and complete your goals
          </CardDescription>
        </CardHeader>
        <CardContent>
          {todos.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 mx-auto bg-gradient-to-r from-slate-500 to-slate-700 rounded-full flex items-center justify-center shadow-2xl mb-6">
                <Plus className="w-12 h-12 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-3">Ready to be productive! 🚀</h3>
              <p className="text-slate-600 mb-8 text-lg max-w-md mx-auto">
                Create your first task and start achieving your goals!
              </p>
              <Button 
                onClick={() => setIsAddingTodo(true)} 
                className="bg-gradient-to-r from-slate-600 to-slate-800 hover:from-slate-700 hover:to-slate-900 text-white font-bold px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create Your First Task
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {todos.map((todo, index) => (
                <div 
                  key={todo.id}
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <TodoItem
                    todo={todo}
                    onUpdate={handleUpdateTodo}
                    onDelete={handleDeleteTodo}
                  />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}