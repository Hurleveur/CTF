/**
 * Default project creation helper for signup flow
 * Creates a randomized robotics project for new users when requested
 */

import { createClient } from '@/lib/supabase/server';
import { buildDefaultProject } from '../default-project';

export interface CreateDefaultProjectResult {
  success: boolean;
  project?: {
    id: number;
    name: string;
    description: string;
    logo: string;
    aiStatus: string;
    statusColor: string;
    neuralReconstruction: number;
    lastBackup: string;
    leadDeveloper: string;
    teamMembers: unknown[];
    userId: string;
  };
  error?: string;
}

/**
 * Creates a default project for a user during signup
 * @param userId - The user's UUID from Supabase auth
 * @param fullName - The user's full name for lead developer field
 * @returns Success/error result with created project data
 */
export async function createDefaultProject(
  userId: string, 
  fullName: string
): Promise<CreateDefaultProjectResult> {
  try {
    console.log('🛠️ Creating default project for user:', userId);
    
    const supabase = await createClient();
    
    // Build the default project data
    let projectData = buildDefaultProject(fullName, userId);
    
    // Check if the project name already exists and make it unique if needed
    let baseName: string = projectData.name;
    let uniqueName: string = baseName;
    let counter = 1;
    
    while (true) {
      // Check if this name already exists
      const { data: existingProject, error: checkError } = await supabase
        .from('user_projects')
        .select('id')
        .eq('name', uniqueName)
        .single();
      
      if (checkError && checkError.code === 'PGRST116') {
        // No project found with this name - it's unique!
        break;
      } else if (checkError) {
        // Some other error occurred
        console.error('❌ Error checking project name uniqueness:', checkError.message);
        return {
          success: false,
          error: checkError.message
        };
      } else if (existingProject) {
        // Project name exists, try with a suffix
        counter++;
        uniqueName = `${baseName} ${counter}`;
        console.log(`🔄 Project name "${baseName}" exists, trying "${uniqueName}"`);
      }
    }
    
    // Update the project data with the unique name
    projectData = { ...projectData, name: uniqueName as any };
    
    // Insert the project into the database
    const { data: project, error } = await supabase
      .from('user_projects')
      .insert(projectData)
      .select()
      .single();
    
    if (error) {
      console.error('❌ Failed to create default project:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
    
    console.log('✅ Default project created successfully:', project.name);
    
    // The project_members table will be populated automatically via the existing trigger
    // that runs after project creation, making the user the lead
    
    return {
      success: true,
      project: {
        id: project.id,
        name: project.name,
        description: project.description,
        logo: project.logo,
        aiStatus: project.ai_status,
        statusColor: project.status_color,
        neuralReconstruction: parseFloat(project.neural_reconstruction || '0'),
        lastBackup: project.last_backup,
        leadDeveloper: project.lead_developer,
        teamMembers: project.team_members || [],
        userId: project.user_id,
      }
    };
    
  } catch (error) {
    console.error('❌ Error creating default project:', error);
    return {
      success: false,
      error: 'Failed to create default project'
    };
  }
}