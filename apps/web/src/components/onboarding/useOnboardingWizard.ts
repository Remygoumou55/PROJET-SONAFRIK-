'use client'

import { useState, useCallback } from 'react'
import type { Dispatch, SetStateAction } from 'react'

export interface WizardState<T> {
  currentStep: number
  totalSteps: number
  data: T
  isSubmitting: boolean
  error: string | null
}

export interface WizardControls<T extends Record<string, unknown>> {
  currentStep: number
  totalSteps: number
  data: T
  updateData: (partial: Partial<T>) => void
  nextStep: () => void
  prevStep: () => void
  goToStep: (step: number) => void
  isSubmitting: boolean
  setIsSubmitting: Dispatch<SetStateAction<boolean>>
  error: string | null
  setError: Dispatch<SetStateAction<string | null>>
}

export function useOnboardingWizard<T extends Record<string, unknown>>(
  initialData: T,
  totalSteps: number = 5,
): WizardControls<T> {
  const [currentStep, setCurrentStep] = useState(1)
  const [data, setData] = useState<T>(initialData)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateData = useCallback((partial: Partial<T>) => {
    setData(prev => ({ ...prev, ...partial }))
  }, [])

  const nextStep = useCallback(() => {
    setError(null)
    setCurrentStep(s => Math.min(s + 1, totalSteps))
  }, [totalSteps])

  const prevStep = useCallback(() => {
    setError(null)
    setCurrentStep(s => Math.max(s - 1, 1))
  }, [])

  const goToStep = useCallback((step: number) => {
    setCurrentStep(Math.max(1, Math.min(step, totalSteps)))
  }, [totalSteps])

  return {
    currentStep,
    totalSteps,
    data,
    updateData,
    nextStep,
    prevStep,
    goToStep,
    isSubmitting,
    setIsSubmitting,
    error,
    setError,
  }
}
