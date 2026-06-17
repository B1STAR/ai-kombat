'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ListChecks, Check, X } from 'lucide-react';
import { useApi, type Task } from '@/lib/api';
import { BottomNav } from '@/components/BottomNav';
import { useGameStore } from '@/lib/store';
import { hapticNotification } from '@/lib/utils';

export default function TasksPage() {
  const api = useApi();
  const addCoins = useGameStore((s) => s.addCoins);
  const [task, setTask] = useState<Task | null>(null);
  const [result, setResult] = useState<{ isCorrect: boolean; coinsEarned: number } | null>(null);
  const [loading, setLoading] = useState(false);
  
  const fetchNewTask = async () => {
    try {
      setLoading(true);
      setResult(null);
      const response = await api.get<{ task: Task }>('/api/tasks/next');
      setTask(response.task);
    } catch (err: any) {
      console.error('Fetch task failed:', err);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchNewTask();
  }, []);
  
  const submitAnswer = async (answer: string) => {
    if (!task) return;
    try {
      setLoading(true);
      const response = await api.post<{ isCorrect: boolean; coinsEarned: number }>(
        '/api/tasks/submit',
        { taskId: task.id, answer }
      );
      setResult(response);
      if (response.isCorrect) {
        addCoins(response.coinsEarned);
        hapticNotification('success');
      } else {
        hapticNotification('error');
      }
    } catch (err) {
      console.error('Submit failed:', err);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading && !task) {
    return (
      <div className="min-h-screen flex items-center justify-center pb-20">
        <div className="text-center">
          <ListChecks className="w-12 h-12 mx-auto text-accent-500 animate-pulse" />
          <p className="mt-2 text-dark-300">Loading task...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen pb-20 px-4 pt-6">
      <h1 className="text-2xl font-bold mb-1">AI Tasks</h1>
      <p className="text-dark-300 text-sm mb-6">Train your AI by completing tasks</p>
      
      {!task ? (
        <div className="card text-center py-12">
          <p className="text-dark-300">No tasks available. Come back later.</p>
          <button onClick={fetchNewTask} className="btn-primary mt-4">
            Refresh
          </button>
        </div>
      ) : (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs text-dark-300 uppercase">{task.type}</span>
            <span className="text-xs text-accent-400">+{task.rewardCoins} coins</span>
          </div>
          
          <p className="text-lg font-medium mb-6">{task.question}</p>
          
          {task.payload?.image_url && (
            <div className="mb-4 rounded-xl overflow-hidden">
              <img src={task.payload.image_url} alt="Task" className="w-full" />
            </div>
          )}
          
          {result ? (
            <div className="text-center py-6">
              <div className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center ${
                result.isCorrect ? 'bg-green-500/20' : 'bg-red-500/20'
              }`}>
                {result.isCorrect ? (
                  <Check className="w-8 h-8 text-green-400" />
                ) : (
                  <X className="w-8 h-8 text-red-400" />
                )}
              </div>
              <p className="mt-4 text-lg font-semibold">
                {result.isCorrect ? 'Correct! +' + result.coinsEarned + ' coins' : 'Wrong answer'}
              </p>
              <button
                onClick={fetchNewTask}
                className="btn-primary mt-4"
                disabled={loading}
              >
                Next task
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {task.payload?.options?.map((option: string) => (
                <button
                  key={option}
                  onClick={() => submitAnswer(option)}
                  disabled={loading}
                  className="w-full p-4 bg-dark-700 hover:bg-dark-600 active:scale-95
                           rounded-xl text-left font-medium transition-all
                           disabled:opacity-50"
                >
                  {option}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      
      <BottomNav />
    </div>
  );
}
