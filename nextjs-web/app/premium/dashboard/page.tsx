'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useSession } from '@/lib/auth-client';
import { 
  Target, 
  CheckCircle, 
  Circle, 
  TrendingUp, 
  Zap,
  Star,
  Clock,
  CheckSquare,
  User
} from 'lucide-react';
import { Todo } from '@/lib/db/schema';

export default function DashboardPage() {
  const { data: session } = useSession();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    fetchTodos();
  }, []);

  const totalTasks = todos.length;
  const completedTasks = todos.filter(todo => todo.completed).length;
  const pendingTasks = totalTasks - completedTasks;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  
  const priorityStats = {
    high: todos.filter(todo => todo.priority === 'high' && !todo.completed).length,
    medium: todos.filter(todo => todo.priority === 'medium' && !todo.completed).length,
    low: todos.filter(todo => todo.priority === 'low' && !todo.completed).length,
  };

  const recentTasks = todos.slice(0, 5);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-200 border-t-slate-600 mx-auto"></div>
          <p className="mt-4 text-slate-600 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">
            Welcome back, {session?.user.name?.split(' ')[0]}! 👋
          </h1>
          <p className="text-slate-600 mt-2">
            Here&apos;s what&apos;s happening with your tasks today
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-slate-500">
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Tasks</CardTitle>
            <Target className="w-5 h-5 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-800">{totalTasks}</div>
            <p className="text-xs text-slate-500 mt-1">All your tasks</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Completed</CardTitle>
            <CheckCircle className="w-5 h-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{completedTasks}</div>
            <p className="text-xs text-slate-500 mt-1">Tasks done</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Pending</CardTitle>
            <Circle className="w-5 h-5 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{pendingTasks}</div>
            <p className="text-xs text-slate-500 mt-1">Tasks remaining</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Completion Rate</CardTitle>
            <TrendingUp className="w-5 h-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{completionRate}%</div>
            <p className="text-xs text-slate-500 mt-1">Success rate</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Priority Breakdown */}
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-800 flex items-center">
              <Star className="w-5 h-5 mr-2 text-slate-600" />
              Priority Breakdown
            </CardTitle>
            <CardDescription>Pending tasks by priority level</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-red-500 mr-3"></div>
                <span className="text-sm font-medium text-slate-700">High Priority</span>
              </div>
              <span className="text-2xl font-bold text-red-600">{priorityStats.high}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-orange-500 mr-3"></div>
                <span className="text-sm font-medium text-slate-700">Medium Priority</span>
              </div>
              <span className="text-2xl font-bold text-orange-600">{priorityStats.medium}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-green-500 mr-3"></div>
                <span className="text-sm font-medium text-slate-700">Low Priority</span>
              </div>
              <span className="text-2xl font-bold text-green-600">{priorityStats.low}</span>
            </div>
          </CardContent>
        </Card>

        {/* Recent Tasks */}
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-800 flex items-center">
              <Clock className="w-5 h-5 mr-2 text-slate-600" />
              Recent Tasks
            </CardTitle>
            <CardDescription>Your latest task activity</CardDescription>
          </CardHeader>
          <CardContent>
            {recentTasks.length > 0 ? (
              <div className="space-y-3">
                {recentTasks.map((task) => (
                  <div key={task.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-slate-50">
                    <div className={`w-2 h-2 rounded-full ${
                      task.completed ? 'bg-green-500' : 
                      task.priority === 'high' ? 'bg-red-500' :
                      task.priority === 'medium' ? 'bg-orange-500' : 'bg-green-500'
                    }`}></div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${
                        task.completed ? 'line-through text-slate-500' : 'text-slate-800'
                      }`}>
                        {task.title}
                      </p>
                      <p className="text-xs text-slate-500">
                        {new Date(task.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    {task.completed ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <Circle className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <Target className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">No tasks yet</p>
                <p className="text-xs text-slate-400 mt-1">Create your first task to get started</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="bg-gradient-to-r from-slate-600 to-slate-800 text-white">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center">
            <Zap className="w-5 h-5 mr-2" />
            Quick Actions
          </CardTitle>
          <CardDescription className="text-slate-200">
            Jump to your most used features
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a 
              href="/premium/todos"
              className="flex items-center p-3 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
            >
              <CheckSquare className="w-5 h-5 mr-3" />
              <span>Manage Tasks</span>
            </a>
            <a 
              href="/premium/profile"
              className="flex items-center p-3 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
            >
              <User className="w-5 h-5 mr-3" />
              <span>Profile Settings</span>
            </a>
            <div className="flex items-center p-3 bg-white/10 rounded-lg">
              <TrendingUp className="w-5 h-5 mr-3" />
              <span>View Analytics</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}