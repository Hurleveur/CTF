import { useState, useCallback, useMemo } from 'react';
import { RoboticProject } from '../../contexts/ProjectContext';

// Custom hook to manage assembly line state with optimizations
export function useAssemblyLineState() {
  const [selectedArm, setSelectedArm] = useState<RoboticProject | null>(null);
  const [armStatus, setArmStatus] = useState('offline');
  const [codeCompletion, setCodeCompletion] = useState(0);
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const [ctfCode, setCtfCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showInvitationModal, setShowInvitationModal] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [lastCodeResult, setLastCodeResult] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  // Memoized state updaters to prevent unnecessary re-renders
  const updateSelectedArm = useCallback((arm: RoboticProject | null) => {
    setSelectedArm(arm);
  }, []);

  const updateCodeCompletion = useCallback((completion: number) => {
    setCodeCompletion(completion);
  }, []);

  const updateArmStatus = useCallback((status: string) => {
    setArmStatus(status);
  }, []);

  // Memoized computed values
  const isAdminFrontend = useMemo(() => {
    return typeof window !== 'undefined' && 
           localStorage.getItem('isAdminFrontend') === 'true';
  }, []);

  const aiPermanentlyActivated = useMemo(() => {
    return codeCompletion >= 100 && armStatus === 'restoring';
  }, [codeCompletion, armStatus]);

  return {
    // State
    selectedArm,
    armStatus,
    codeCompletion,
    animatedProgress,
    ctfCode,
    isSubmitting,
    showAdvanced,
    showInvitationModal,
    isLeaving,
    showLeaveConfirm,
    lastCodeResult,
    
    // State setters
    setSelectedArm: updateSelectedArm,
    setArmStatus: updateArmStatus,
    setCodeCompletion: updateCodeCompletion,
    setAnimatedProgress,
    setCtfCode,
    setIsSubmitting,
    setShowAdvanced,
    setShowInvitationModal,
    setIsLeaving,
    setShowLeaveConfirm,
    setLastCodeResult,
    
    // Computed values
    isAdminFrontend,
    aiPermanentlyActivated,
  };
}