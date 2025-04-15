'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Swal from 'sweetalert2';
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../lib/firebase';

type Task = {
  id: string;
  text: string;
  completed: boolean;
  deadline: string;
};

export default function TodoList() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [timeRemaining, setTimeRemaining] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'tasks'));
        const tasksData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Task[];
        setTasks(tasksData);
      } catch (error) {
        console.error('Error fetching tasks:', error);
      }
    };

    fetchTasks();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const updated: { [key: string]: string } = {};
      tasks.forEach((task) => {
        updated[task.id] = calculateTimeRemaining(task.deadline);
      });
      setTimeRemaining(updated);
    }, 1000);

    return () => clearInterval(interval);
  }, [tasks]);

  const calculateTimeRemaining = (deadline: string): string => {
    const deadlineTime = new Date(deadline).getTime();
    const now = new Date().getTime();
    const difference = deadlineTime - now;

    if (difference <= 0) return '⏳ Time Expired';
    const hours = Math.floor(difference / (1000 * 60 * 60));
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((difference % (1000 * 60)) / 1000);

    return `${hours}h ${minutes}m ${seconds}s`;
  };

  const addTask = async (): Promise<void> => {
    const { value: formValues } = await Swal.fire({
      title: 'Initialize Task',
      html: `
        <input id="swal-input1" class="swal2-input" placeholder="Mission Name..." />
        <input id="swal-input2" type="datetime-local" class="swal2-input" />
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Deploy',
      cancelButtonText: 'Abort',
      preConfirm: () => {
        const input1 = (document.getElementById('swal-input1') as HTMLInputElement)?.value;
        const input2 = (document.getElementById('swal-input2') as HTMLInputElement)?.value;

        if (!input1 || !input2) {
          Swal.showValidationMessage('Both fields are required.');
          return;
        }

        return [input1, input2];
      },
    });

    if (formValues) {
      try {
        setLoading(true);
        const newTask: Omit<Task, 'id'> = {
          text: formValues[0],
          completed: false,
          deadline: formValues[1],
        };
        const docRef = await addDoc(collection(db, 'tasks'), newTask);
        setTasks((prev) => [...prev, { id: docRef.id, ...newTask }]);
        Swal.fire('Success!', 'Mission deployed.', 'success');
      } catch (error) {
        console.error('Error adding task:', error);
        Swal.fire('Error', 'Failed to deploy mission.', 'error');
      } finally {
        setLoading(false);
      }
    }
  };

  const toggleTask = async (id: string): Promise<void> => {
    try {
      const updatedTasks = tasks.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task
      );
      setTasks(updatedTasks);

      const taskRef = doc(db, 'tasks', id);
      await updateDoc(taskRef, {
        completed: updatedTasks.find((task) => task.id === id)?.completed,
      });
    } catch (error) {
      console.error('Error updating task status:', error);
      Swal.fire('Error', 'Failed to update task status.', 'error');
    }
  };

  const deleteTask = async (id: string): Promise<void> => {
    const confirm = await Swal.fire({
      title: 'Delete Mission?',
      text: 'This cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete',
      cancelButtonText: 'Cancel',
    });

    if (!confirm.isConfirmed) return;

    try {
      const taskRef = doc(collection(db, 'tasks'), id);
      await deleteDoc(taskRef);
      setTasks((prev) => prev.filter((task) => task.id !== id));
      Swal.fire('Deleted!', 'Mission removed from database.', 'success');
    } catch (error) {
      console.error('Error deleting task:', error);
      Swal.fire('Error', 'Could not delete task.', 'error');
    }
  };

  const editTask = async (id: string): Promise<void> => {
    const task = tasks.find((task) => task.id === id);
    if (!task) return;

    const { value: formValues } = await Swal.fire({
      title: 'Edit Mission',
      html: `
        <input id="swal-input1" class="swal2-input" value="${task.text}" />
        <input id="swal-input2" type="datetime-local" class="swal2-input" value="${task.deadline}" />
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Update',
      cancelButtonText: 'Cancel',
      preConfirm: () => {
        const input1 = (document.getElementById('swal-input1') as HTMLInputElement)?.value;
        const input2 = (document.getElementById('swal-input2') as HTMLInputElement)?.value;

        if (!input1 || !input2) {
          Swal.showValidationMessage('All fields are required.');
          return;
        }

        return [input1, input2];
      },
    });

    if (formValues) {
      const updatedTask = {
        text: formValues[0],
        deadline: formValues[1],
      };

      try {
        const taskRef = doc(db, 'tasks', id);
        await updateDoc(taskRef, updatedTask);
        setTasks((prev) =>
          prev.map((task) =>
            task.id === id ? { ...task, ...updatedTask } : task
          )
        );
        Swal.fire('Updated!', 'Mission parameters updated.', 'success');
      } catch (error) {
        console.error('Error updating task:', error);
        Swal.fire('Error', 'Update failed.', 'error');
      }
    }
  };

  return (
    <div className="min-h-screen px-4 py-10 bg-[radial-gradient(circle_at_center,_#0ff_1px,_#111_1px)] [background-size:20px_20px] text-white font-mono">
      <h1 className="text-4xl text-center font-bold mb-6 text-cyan-400 neon-glow">
        🚀 Mission Control Center
      </h1>

      <div className="flex justify-center mb-6">
        <button
          onClick={addTask}
          disabled={loading}
          className={`px-6 py-2 rounded-full font-bold uppercase tracking-widest transition-all duration-300 ${
            loading
              ? 'bg-gray-600 cursor-not-allowed'
              : 'bg-cyan-600 hover:bg-cyan-800'
          }`}
        >
          {loading ? 'Deploying...' : 'Add Mission'}
        </button>
      </div>

      <ul className="space-y-4">
        <AnimatePresence>
          {tasks.map((task) => {
            const timeLeft = timeRemaining[task.id] || 'Calculating...';
            const isExpired = timeLeft === '⏳ Time Expired';
            const taskColor = task.completed
              ? 'bg-green-900 border-green-400'
              : isExpired
              ? 'bg-red-900 border-red-500'
              : 'bg-gray-800 border-cyan-500';

            return (
              <motion.li
                key={task.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className={`border-2 p-4 rounded-lg ${taskColor} shadow-[0_0_10px_#0ff5]`}
              >
                <div className="flex justify-between items-center mb-2">
                  <span
                    onClick={() => toggleTask(task.id)}
                    className={`cursor-pointer ${
                      task.completed ? 'line-through text-gray-400' : 'font-semibold'
                    }`}
                  >
                    🛰️ {task.text}
                  </span>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => editTask(task.id)}
                      className="text-white px-2 py-1 text-xs rounded bg-blue-700 hover:bg-blue-900"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="text-white px-2 py-1 text-xs rounded bg-red-700 hover:bg-red-900"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <p className="text-xs text-gray-400">
                  Deadline: {new Date(task.deadline).toLocaleString()}
                </p>
                <p className="text-sm mt-1 font-mono">🕒 {timeLeft}</p>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>

      <style jsx>{`
        .neon-glow {
          text-shadow: 0 0 8px #0ff, 0 0 16px #0ff;
        }
      `}</style>
    </div>
  );
}
