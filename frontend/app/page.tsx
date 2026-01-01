'use client'

import { useState } from 'react'
import { TaskList } from "@/components/TaskList"
import { AddTaskForm } from "@/components/AddTaskForm"
import { OfflineIndicator } from "@/components/OfflineIndicator"
import { NotificationPrompt } from "@/components/NotificationPrompt"
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt"
import VoiceChatbot from "@/components/VoiceChatbot"
import { TaskOptimizer } from "@/components/TaskOptimizer"
import { CheckSquare, Mic, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"

/**
 * Home Page - Main Task List
 * Mobile-first PWA interface with 320px minimum viewport
 */
export default function Home() {
  const [showVoice, setShowVoice] = useState(false)
  const [showOptimizer, setShowOptimizer] = useState(false)

  return (
    <>
      {/* Status indicators */}
      <OfflineIndicator />

      {/* Main content */}
      <main className="flex-1 w-full max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <header className="flex items-center justify-between pb-2">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <CheckSquare className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                My Tasks
              </h1>
              <p className="text-sm text-muted-foreground">
                Manage your tasks offline and online
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowOptimizer(!showOptimizer)}
              className="flex-shrink-0"
              title="Optimize Tasks (AI)"
            >
              <Sparkles className="h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowVoice(!showVoice)}
              className="flex-shrink-0"
              title="Voice Commands"
            >
              <Mic className="h-5 w-5" />
            </Button>
          </div>
        </header>

        {/* Voice chatbot */}
        {showVoice && (
          <VoiceChatbot onClose={() => setShowVoice(false)} />
        )}

        {/* Task optimizer */}
        {showOptimizer && (
          <TaskOptimizer tasks={[]} onClose={() => setShowOptimizer(false)} />
        )}

        {/* Add task form */}
        <AddTaskForm />

        {/* Task list */}
        <TaskList />
      </main>

      {/* PWA prompts */}
      <NotificationPrompt />
      <PWAInstallPrompt />
    </>
  );
}
