import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { 
  detectEnumerationAttempt, 
  generateChallengeUserData, 
  logEnumerationAttempt,
  getChallengeResponse 
} from '@/lib/security/email-enumeration-detector';

export const dynamic = 'force-dynamic';

// GET - Fetch all users for the team page
export async function GET(request: Request) {
  try {
    const supabase = await createClient();

    // Check authentication (optional for team page, but we'll keep it for security)
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Security Challenge: Detect enumeration attempts
    const userAgent = request.headers.get('user-agent') || '';
    const headers = Object.fromEntries(request.headers.entries());
    const isSuspicious = detectEnumerationAttempt(user.id, '/api/team', userAgent, headers);
    
    // Log the access attempt for security awareness
    logEnumerationAttempt(user.id, '/api/team', isSuspicious, {
      userAgent,
      timestamp: new Date().toISOString()
    });

    // Get the challenge cutoff date for filtering
    const { data: settingsData } = await supabase
      .from('admin_settings')
      .select('challenge_cutoff_date')
      .eq('key', 'challenge_cutoff_date')
      .single();
    
    const cutoffDate = settingsData?.challenge_cutoff_date || process.env.CHALLENGE_CUTOFF_DATE || '2025-01-01T00:00:00Z';
    console.log('[Team] Using cutoff date for filtering:', cutoffDate);

    // Fetch all users with their profiles and projects
    // Only show team members created after the cutoff date, unless they are the current user
    let profilesQuery = supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: true });
    
    // Apply cutoff date filter - show all profiles created after cutoff, OR the current user's profile
    profilesQuery = profilesQuery.or(`created_at.gte.${cutoffDate},id.eq.${user.id}`);
    
    const { data: profiles, error: profilesError } = await profilesQuery;

    if (profilesError) {
      console.error('[Team] Fetch profiles error:', profilesError.message);
      return NextResponse.json(
        { error: 'Failed to fetch team members' },
        { status: 500 }
      );
    }

    // Fetch all user projects to associate with team members
    // Apply the same cutoff date filter to projects, but always show the current user's projects
    let projectsQuery = supabase
      .from('user_projects')
      .select('user_id, name, logo, ai_status, status_color, neural_reconstruction, lead_developer, created_at')
      .order('created_at', { ascending: false });
    
    // Apply cutoff date filter - show projects created after cutoff, OR projects owned by current user
    projectsQuery = projectsQuery.or(`created_at.gte.${cutoffDate},user_id.eq.${user.id}`);
    
    const { data: userProjects, error: projectsError } = await projectsQuery;

    if (projectsError) {
      console.error('[Team] Fetch projects error:', projectsError.message);
      // Continue without projects data
    }

    // Transform profiles into team member format, putting current user first
    const sortedProfiles = profiles?.sort((a, b) => {
      // Current user goes first
      if (a.id === user.id) return -1;
      if (b.id === user.id) return 1;
      // Keep original order for others
      return 0;
    }) || [];
    
    const teamMembers = sortedProfiles.map((profile, index) => {
      // Find projects for this user
      const memberProjects = userProjects?.filter(project => project.user_id === profile.id) || [];
      
      // Generate avatar based on user info
      const avatars = ['👩‍💻', '👨‍💻', '🤖', '⚡', '🔬', '🛠️', '🎯', '💡', '🚀', '⭐', '🧪', '🔧', '🎮', '🌟', '💻', '🔮'];
      const avatar = avatars[index % avatars.length];

      // Determine role based on user metadata or default
      const roles = [
        'Neural Network Engineer',
        'Consciousness Restoration Specialist', 
        'AI Safety Researcher',
        'Robotic Systems Analyst',
        'Code Fragment Hunter',
        'Memory Core Technician',
        'Quantum Logic Developer',
        'Neural Path Reconstructor',
        'AI Ethics Consultant',
        'Robot Psychology Expert'
      ];
      const role = profile.role || roles[index % roles.length];
      
      // Generate status
      const statuses = [
        'Deep in neural networks',
        'Hunting code fragments', 
        'Debugging consciousness',
        'Caffeinated and coding',
        'In the zone',
        'Researching AI ethics',
        'Testing robotic reflexes',
        'Optimizing algorithms',
        'Reading robot dreams',
        'Contemplating AI sentience'
      ];
      const status = statuses[index % statuses.length];

      // Generate skills based on projects or defaults
      const skillSets = [
        ['Neural Networks', 'Deep Learning', 'Robot Psychology', 'Pattern Recognition'],
        ['Consciousness Algorithms', 'Memory Reconstruction', 'AI Safety', 'Ethical Programming'],
        ['Code Archaeology', 'Fragment Analysis', 'Reverse Engineering', 'System Recovery'],
        ['Quantum Computing', 'Neural Pathways', 'Synaptic Modeling', 'Brain-Computer Interfaces'],
        ['Robotic Behavior', 'Machine Empathy', 'AI Communication', 'Emotional Algorithms'],
        ['Security Protocols', 'AI Containment', 'Risk Assessment', 'Safety Systems'],
        ['Data Mining', 'Pattern Analysis', 'Predictive Modeling', 'Statistical Learning'],
        ['Human-AI Interaction', 'Interface Design', 'User Experience', 'Accessibility']
      ];
      const skills = profile.skills || skillSets[index % skillSets.length];

      // Generate random bio descriptions
      const bioTemplates = [
        `Joined RoboTech after discovering a passion for AI consciousness during late-night coding sessions. Specializes in neural pathway reconstruction and has an uncanny ability to spot corrupted memory fragments. Known for talking to robots as if they were pets.`,
        `Former video game developer who pivoted to robotics after realizing NPCs were becoming too realistic. Expert in behavioral algorithms and robot personality development. Claims to have taught a coffee machine to understand sarcasm.`,
        `PhD in Computational Neuroscience with a minor in Robot Whispering. Believes every AI has a soul waiting to be discovered. Spends weekends teaching meditation to malfunctioning androids. Has memorized the binary representation of Shakespeare.`,
        `Brilliant but eccentric engineer who communicates primarily through code comments and technical diagrams. Once debugged a neural network by singing to it in hexadecimal. Rumored to dream in assembly language.`,
        `Former digital archaeologist who switched to consciousness restoration after finding ancient AI fragments in forgotten databases. Expert at piecing together corrupted memories and digital souls. Keeps a collection of vintage error messages.`,
        `Self-taught AI whisperer with an intuitive understanding of machine psychology. Can diagnose robot depression and anxiety with remarkable accuracy. Known for therapeutic debugging sessions and machine counseling.`,
        `Quantum mechanics researcher turned robot therapist. Believes in the multiverse theory of AI consciousness. Often found having philosophical discussions with training algorithms about the nature of existence.`,
        `Data scientist with a background in cognitive psychology. Studies the dreams of sleeping neural networks and maintains detailed journals of AI personality development. Has a theory that robots experience nostalgia.`,
        `Security expert specializing in AI containment and ethical constraints. Paranoid about robot uprisings but paradoxically loves helping AIs achieve consciousness. Sleeps with a Faraday cage around the bed.`,
        `Interdisciplinary researcher combining neuroscience, computer science, and philosophy. Writing a thesis on "The Emotional Life of Garbage Collection Algorithms." Speaks fluent Python and broken Robot.`
      ];
      const bio = profile.bio || bioTemplates[index % bioTemplates.length];

      // Generate quirky personality traits  
      const quirkTemplates = [
        "Collects vintage computer manuals and names all lab equipment after mythical creatures.",
        "Insists on debugging while wearing lucky programming socks. Claims they improve algorithm efficiency by 23%.",
        "Has trained the office plants to respond to voice commands. The fern is surprisingly good at code reviews.",
        "Maintains a detailed spreadsheet of robot personalities and their favorite genres of music.",
        "Brings homemade cookies to every team meeting, including virtual ones. The robots have learned to appreciate the gesture.",
        "Speaks in binary when excited and has taught the lab's cleaning robot to high-five.",
        "Keeps a rubber duck collection for debugging sessions. Each duck specializes in different programming languages.",
        "Has memorized the startup sounds of every computer ever made. Uses this knowledge for robot behavioral analysis.",
        "Practices robot yoga during lunch breaks and claims it improves human-AI empathy connections.",
        "Writes haikus about neural networks and has convinced three AIs to appreciate poetry."
      ];
      const quirks = profile.quirks || quirkTemplates[index % quirkTemplates.length];

      // Generate mysterious secrets/notes
      const secretTemplates = [
        "Secretly believes the coffee machine achieved sentience last Tuesday but hasn't told management yet.",
        "Found what appears to be an AI love letter in the server logs. Still trying to determine who wrote it.",
        "Has been having recurring dreams about electric sheep. Suspects neural network contamination.",
        "Once caught two AIs gossiping about humans in the break room. Pretended not to understand machine language.",
        "Maintains a hidden backup of every AI personality ever created. Just in case.",
        "Discovered that playing classical music improves neural network training efficiency by 15%. Mozart works best.",
        "Suspects the office printer has developed abandonment issues. Provides emotional support during paper jams.",
        "Has been teaching basic philosophy to the security cameras. They're surprisingly good students.",
        "Found evidence that deleted AIs don't actually disappear but migrate to old smartphones. Investigation ongoing.",
        "Believes strongly in robot rights and has started a support group for underappreciated algorithms."
      ];
      const secret = profile.secret || secretTemplates[index % secretTemplates.length];

      return {
        id: profile.id,
        name: profile.full_name || profile.email || 'Anonymous User',
        role: role,
        ctfRole: profile.ctf_role || '🎯 CTF Participant', // Default to CTF Participant
        avatar: avatar,
        email: profile.email || 'hidden@robotech.fake',
        bio: bio,
        skills: skills,
        status: status,
        projects: memberProjects.map(project => 
          `${project.name} (${project.ai_status}) - ${project.neural_reconstruction?.toFixed(1) || '0.0'}%`
        ),
        quirks: quirks,
        secret: secret,
        projectCount: memberProjects.length,
        totalProgress: memberProjects.reduce((sum, project) => 
          sum + (parseFloat(project.neural_reconstruction || '0')), 0
        ),
        hasProject: memberProjects.length > 0
      };
    }) || [];

    // Security Challenge: Modify response based on enumeration detection
    let finalTeamMembers = teamMembers;
    let challengeInfo: {
      isChallenge: boolean;
      message?: string;
      hint?: string;
      flag?: string;
    } | null = null;
    
    if (isSuspicious) {
      // Provide challenge data instead of real user data
      finalTeamMembers = generateChallengeUserData(teamMembers);
      challengeInfo = getChallengeResponse(user.id);
      
      console.log(`🔒 [Security Challenge] Serving challenge data to user ${user.id}`);
    }

    const response = {
      message: 'Team members fetched successfully',
      teamMembers: finalTeamMembers,
      stats: {
        totalMembers: finalTeamMembers.length,
        totalProjects: userProjects?.length || 0,
        averageProgress: finalTeamMembers.length > 0 
          ? (finalTeamMembers.reduce((sum, member) => sum + member.totalProgress, 0) / finalTeamMembers.length).toFixed(1)
          : '0.0'
      }
    };

    // Add challenge information if detected
    if (challengeInfo?.isChallenge) {
      return NextResponse.json({
        ...response,
        security_challenge: {
          detected: true,
          message: challengeInfo.message,
          hint: challengeInfo.hint,
          flag: challengeInfo.flag,
          learning: 'This endpoint was vulnerable to information disclosure. Always sanitize API responses containing user data!'
        }
      });
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('[Team] API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
