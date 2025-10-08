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

/**
 * Priority badge component with beautiful gradient styling and icons
 */
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

/**
 * Todo item component with complete/edit/delete functionality
 */
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

  /**
   * Handle todo completion toggle
   */
  const handleToggleComplete = async () => {
    onUpdate(todo.id, { completed: !todo.completed });
  };

  /**
   * Handle todo edit form submission
   */
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
        : 'bg-gradient-to-r from-white to-blue-50 border-blue-200 hover:border-blue-300'
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
                : 'bg-blue-100 hover:bg-blue-200 hover:scale-110'
            }`}
          >
            {todo.completed ? (
              <CheckCircle2 className="w-6 h-6 text-green-600 animate-pulse" />
            ) : (
              <Circle className="w-6 h-6 text-blue-400 group-hover:text-blue-600 transition-colors" />
            )}
          </Button>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className={`font-semibold text-lg mb-2 transition-all duration-200 ${
                  todo.completed 
                    ? 'line-through text-gray-500' 
                    : 'text-gray-800 group-hover:text-blue-700'
                }`}>
                  {todo.title}
                </h3>
                {todo.description && (
                  <p className={`text-sm mb-3 leading-relaxed ${
                    todo.completed 
                      ? 'line-through text-gray-400' 
                      : 'text-gray-600'
                  }`}>
                    {todo.description}
                  </p>
                )}
                <div className="flex items-center space-x-3 mt-3">
                  <PriorityBadge priority={todo.priority as 'low' | 'medium' | 'high'} />
                  <div className="flex items-center text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">
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
                      className="p-2 w-10 h-10 rounded-full bg-blue-100 hover:bg-blue-200 text-blue-600 hover:text-blue-700 transition-all duration-200 hover:scale-110"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg bg-white border-0 shadow-2xl">
                    <DialogHeader className="text-center">
                      <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent">
                        ✏️ Edit Task
                      </DialogTitle>
                      <DialogDescription className="text-gray-600">
                        Update your task details and keep your productivity on track!
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleEditSubmit} className="space-y-6 mt-6">
                      <div className="space-y-2">
                        <Label htmlFor="edit-title" className="text-sm font-semibold text-gray-700">Task Title</Label>
                        <Input
                          id="edit-title"
                          value={editForm.title}
                          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                          placeholder="What needs to be done?"
                          className="border-2 border-gray-200 focus:border-blue-500 rounded-lg px-4 py-3 transition-all duration-200"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-description" className="text-sm font-semibold text-gray-700">Description</Label>
                        <Textarea
                          id="edit-description"
                          value={editForm.description}
                          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                          placeholder="Add more details about this task..."
                          className="border-2 border-gray-200 focus:border-blue-500 rounded-lg px-4 py-3 transition-all duration-200"
                          rows={3}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-priority" className="text-sm font-semibold text-gray-700">Priority Level</Label>
                        <select
                          id="edit-priority"
                          value={editForm.priority}
                          onChange={(e) => setEditForm({ ...editForm, priority: e.target.value as 'low' | 'medium' | 'high' })}
                          className="w-full px-4 py-3 text-sm border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 transition-all duration-200 bg-white"
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
                          className="flex-1 py-3 border-2 border-gray-300 hover:border-gray-400 rounded-lg font-semibold transition-all duration-200"
                        >
                          Cancel
                        </Button>
                        <Button 
                          type="submit"
                          className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
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

/**
 * Main TodoApp component with full CRUD functionality
 */
export default function TodoApp() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddingTodo, setIsAddingTodo] = useState(false);
  const [newTodo, setNewTodo] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
  });

  /**
   * Fetch all todos from the API
   */
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

  /**
   * Create a new todo
   */
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

  /**
   * Update an existing todo
   */
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

  /**
   * Delete a todo
   */
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
            <div className="absolute inset-0 rounded-full bg-blue-100 opacity-25 animate-ping"></div>
          </div>
          <p className="mt-4 text-gray-600 font-medium">Loading your todos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-orange-500 text-white">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative max-w-6xl mx-auto px-4 py-16">
          <div className="text-center">
            <h1 className="text-5xl font-bold mb-4 animate-fade-in">
              ✨ Todo Mastery
            </h1>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Transform your productivity with our beautiful, intuitive task management experience
            </p>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 border border-white/30 hover:bg-white/30 transition-all duration-300">
                <div className="text-3xl font-bold mb-2">{totalCount}</div>
                <div className="text-blue-100 font-medium">Total Tasks</div>
                <Target className="w-8 h-8 mx-auto mt-2 text-blue-200" />
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 border border-white/30 hover:bg-white/30 transition-all duration-300">
                <div className="text-3xl font-bold mb-2 text-green-300">{completedCount}</div>
                <div className="text-blue-100 font-medium">Completed</div>
                <CheckCircle2 className="w-8 h-8 mx-auto mt-2 text-green-300" />
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 border border-white/30 hover:bg-white/30 transition-all duration-300">
                <div className="text-3xl font-bold mb-2 text-orange-300">{totalCount - completedCount}</div>
                <div className="text-blue-100 font-medium">Remaining</div>
                <Circle className="w-8 h-8 mx-auto mt-2 text-orange-300" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">

        <Card className="shadow-2xl border-0 bg-gradient-to-br from-blue-50 via-white to-orange-50 backdrop-blur-sm relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-10 left-10 w-32 h-32 bg-blue-400 rounded-full blur-3xl"></div>
            <div className="absolute bottom-10 right-10 w-40 h-40 bg-orange-400 rounded-full blur-3xl"></div>
            <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-purple-400 rounded-full blur-2xl"></div>
          </div>
          
          <CardHeader className="bg-gradient-to-r from-blue-600 to-orange-500 text-white rounded-t-lg relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-bold flex items-center gap-2">
                  <Target className="w-6 h-6" />
                  Your Task Dashboard
                </CardTitle>
                <CardDescription className="text-blue-100 mt-1">
                  Organize, prioritize, and conquer your goals with style
                </CardDescription>
              </div>
              <Dialog open={isAddingTodo} onOpenChange={setIsAddingTodo}>
                <DialogTrigger asChild>
                  <Button className="bg-white text-blue-600 hover:bg-blue-50 font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                    <Plus className="w-5 h-5 mr-2" />
                    Create New Task
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg bg-white border-0 shadow-2xl">
                  <DialogHeader className="text-center">
                    <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent">
                      ✨ Create New Task
                    </DialogTitle>
                    <DialogDescription className="text-gray-600">
                      Transform your ideas into actionable tasks and boost your productivity!
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateTodo} className="space-y-6 mt-6">
                    <div className="space-y-2">
                      <Label htmlFor="title" className="text-sm font-semibold text-gray-700">Task Title</Label>
                      <Input
                        id="title"
                        value={newTodo.title}
                        onChange={(e) => setNewTodo({ ...newTodo, title: e.target.value })}
                        placeholder="What needs to be done?"
                        className="border-2 border-gray-200 focus:border-blue-500 rounded-lg px-4 py-3 transition-all duration-200"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description" className="text-sm font-semibold text-gray-700">Description</Label>
                      <Textarea
                        id="description"
                        value={newTodo.description}
                        onChange={(e) => setNewTodo({ ...newTodo, description: e.target.value })}
                        placeholder="Add more details about this task..."
                        className="border-2 border-gray-200 focus:border-blue-500 rounded-lg px-4 py-3 transition-all duration-200"
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="priority" className="text-sm font-semibold text-gray-700">Priority Level</Label>
                      <select
                        id="priority"
                        value={newTodo.priority}
                        onChange={(e) => setNewTodo({ ...newTodo, priority: e.target.value as 'low' | 'medium' | 'high' })}
                        className="w-full px-4 py-3 text-sm border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 transition-all duration-200 bg-white"
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
                        className="flex-1 py-3 border-2 border-gray-300 hover:border-gray-400 rounded-lg font-semibold transition-all duration-200"
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Create Task
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent className="p-8 relative z-10">
            {todos.length === 0 ? (
              <div className="text-center py-16">
                <div className="relative mb-8">
                  <div className="w-24 h-24 mx-auto bg-gradient-to-r from-blue-500 to-orange-500 rounded-full flex items-center justify-center shadow-2xl">
                    <Plus className="w-12 h-12 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-orange-400 rounded-full animate-bounce"></div>
                  <div className="absolute -bottom-2 -left-2 w-6 h-6 bg-blue-400 rounded-full animate-pulse"></div>
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-3">Your Journey Begins Here! 🚀</h3>
                <p className="text-gray-600 mb-8 text-lg max-w-md mx-auto">
                  Ready to boost your productivity? Create your first task and start achieving your goals!
                </p>
                <Button 
                  onClick={() => setIsAddingTodo(true)} 
                  className="bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 text-white font-bold px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
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
    </div>
  );
}
