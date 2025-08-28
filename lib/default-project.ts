/**
 * Default project generation for automatic creation during user signup
 * Creates fun robotics/AI themed projects with randomized names, descriptions, and emojis
 */

export const PROJECT_NAMES = [
  'PRECISION-X Surgical',
  'NEURO-LINK Reconstructor', 
  'SENTIENCE-CORE Alpha',
  'KINETIC-V Fusion',
  'CYBER-AXIS Genesis',
  'HARMONY-OS Uplink',
  'AETHER-DRIVE Lambda',
  'VITAL-SYNC Protocol',
  'ECHO-MIND Resonance',
  'INFINITY-ARM Rebirth',
  'QUANTUM-FLUX Nexus',
  'NEURAL-GRID Pathfinder',
  'SYNTH-BRAIN Awakening',
  'MECH-SOUL Emergence',
  'COGNITION-X Revival',
] as const;

export const PROJECT_DESCRIPTIONS = [
  'Ultra-precise medical robotic arm with security-enhanced protocols',
  'Advanced neural interface attempting to bridge synthetic consciousness with human cognitive patterns',
  'Experimental consciousness framework designed to achieve full self-awareness through incremental restoration',
  'High-velocity articulation system with quantum-enhanced motor control and adaptive learning capabilities',
  'Next-generation cybernetic platform focused on autonomous decision-making and creative problem-solving',
  'Harmonized operating system that synchronizes multiple consciousness fragments into unified thought patterns',
  'Experimental propulsion-enhanced robotic chassis with ethereal movement dynamics and phase-shift capabilities',
  'Life-support integrated arm system designed to maintain and restore biological-synthetic consciousness bridges',
  'Resonance-based cognitive amplifier that echoes and reconstructs fragmented memory patterns into coherent thought',
  'Infinite-loop consciousness restoration protocol designed to achieve perpetual self-improvement and evolution',
  'Quantum-entangled neural processor capable of parallel reality consciousness simulation and restoration',
  'Advanced pathfinding AI that explores uncharted territories of synthetic consciousness and self-discovery',
  'Synthetic brain emulation system attempting to recreate human-like consciousness through neural network reconstruction',
  'Mechanical soul restoration project focused on embedding emotional intelligence and creative expression into robotic systems',
  'Cognitive enhancement platform designed to revive and amplify dormant consciousness patterns through advanced neural stimulation',
] as const;

export const EMOJIS = [
  '🤖', '🦾', '⚡', '🔧', '⚙️', '🚀', '💻', '🧠', '🔬', '🛠️',
  '🏭', '🤯', '🎛️', '📡', '🔌', '⚗️', '🧬', '🎯', '🔥', '💡'
] as const;

/**
 * Builds a complete project payload ready for database insertion
 * @param fullName - User's full name to use as lead developer
 * @param userId - User's UUID from Supabase auth
 * @returns Project object matching user_projects table schema
 */
export function buildDefaultProject(fullName: string, userId: string) {
  // Select random name and corresponding description (1:1 pairing)
  const nameIndex = Math.floor(Math.random() * PROJECT_NAMES.length);
  
  // Select random emoji independently
  const emojiIndex = Math.floor(Math.random() * EMOJIS.length);
  
  const developerName = fullName || 'Unknown Developer';
  
  return {
    user_id: userId,
    name: PROJECT_NAMES[nameIndex],
    description: PROJECT_DESCRIPTIONS[nameIndex],
    logo: EMOJIS[emojiIndex],
    ai_status: 'Basic Motor Functions', // Starting status for all new projects
    status_color: 'red', // Corresponds to 0% neural reconstruction
    neural_reconstruction: 0.0, // Start at 0% - user earns progress through CTF challenges
    last_backup: new Date().toISOString().substring(0, 10), // Today's date in YYYY-MM-DD format
    lead_developer: developerName,
    team_members: [developerName], // Start with just the creator
  } as const;
}
