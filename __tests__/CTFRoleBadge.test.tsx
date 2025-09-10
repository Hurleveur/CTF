import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import CTFRoleBadge, { getCtfGroup } from '../app/components/CTFRoleBadge';

describe('CTFRoleBadge', () => {
  describe('getCtfGroup helper function', () => {
    test('correctly identifies core CTF team roles', () => {
      expect(getCtfGroup('🏆 CTF Challenge Architect')).toBe('core');
      expect(getCtfGroup('🔓 Chief Exploitation Officer')).toBe('core');
      expect(getCtfGroup('🥷 Shadow Ops Commander')).toBe('core');
    });

    test('correctly identifies North Star Agi team roles', () => {
      expect(getCtfGroup('💼 North Star Agi – Business Operations')).toBe('northstar');
      expect(getCtfGroup('🧠 North Star Agi – AI Strategy Lead')).toBe('northstar');
      expect(getCtfGroup('🤗 North Star Agi – People & AI Ethics')).toBe('northstar');
      expect(getCtfGroup('🤖 North Star Agi – Robotics Engineer')).toBe('northstar');
      expect(getCtfGroup('⭐ North Star Agi – Security Consultant')).toBe('northstar');
    });

    test('defaults to participant for other roles', () => {
      expect(getCtfGroup('🎯 CTF Participant')).toBe('participant');
      expect(getCtfGroup('Random Role')).toBe('participant');
      expect(getCtfGroup('Some Other Title')).toBe('participant');
    });

    test('is case insensitive', () => {
      expect(getCtfGroup('CTF CHALLENGE ARCHITECT')).toBe('core');
      expect(getCtfGroup('north star agi – ai lead')).toBe('northstar');
    });
  });

  describe('CTFRoleBadge component', () => {
    test('renders core CTF team badge correctly', () => {
      render(<CTFRoleBadge role="🏆 CTF Challenge Architect" />);
      
      const badge = screen.getByLabelText('CTF Role: 🏆 CTF Challenge Architect');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveAttribute('title', '🏆 CTF Challenge Architect');
      
      // Check for golden gradient styling (core team)
      expect(badge).toHaveClass('bg-gradient-to-r', 'from-yellow-400');
    });

    test('renders North Star Agi team badge correctly', () => {
      render(<CTFRoleBadge role="💼 North Star Agi – Business Operations" />);
      
      const badge = screen.getByLabelText('CTF Role: 💼 North Star Agi – Business Operations');
      expect(badge).toBeInTheDocument();
      
      // Check for indigo gradient styling (northstar team)
      expect(badge).toHaveClass('bg-gradient-to-r', 'from-indigo-500');
    });

    test('renders participant badge correctly', () => {
      render(<CTFRoleBadge role="🎯 CTF Participant" />);
      
      const badge = screen.getByLabelText('CTF Role: 🎯 CTF Participant');
      expect(badge).toBeInTheDocument();
      
      // Check for emerald gradient styling (participants)
      expect(badge).toHaveClass('bg-gradient-to-r', 'from-emerald-400');
    });

    test('applies custom className when provided', () => {
      render(<CTFRoleBadge role="🎯 CTF Participant" className="custom-class" />);
      
      const badge = screen.getByLabelText('CTF Role: 🎯 CTF Participant');
      expect(badge).toHaveClass('custom-class');
    });

    test('handles hover effects correctly', () => {
      render(<CTFRoleBadge role="🏆 CTF Challenge Architect" />);
      
      const badge = screen.getByLabelText('CTF Role: 🏆 CTF Challenge Architect');
      expect(badge).toHaveClass('hover:scale-105', 'transform', 'transition-all');
    });

    test('displays icon and text properly', () => {
      render(<CTFRoleBadge role="🏆 CTF Challenge Architect" />);
      
      const badge = screen.getByLabelText('CTF Role: 🏆 CTF Challenge Architect');
      expect(badge).toHaveTextContent('🏆');
      expect(badge).toHaveTextContent('CTF Challenge Architect');
    });

    test('has proper accessibility attributes', () => {
      const role = "🥷 Shadow Ops Commander";
      render(<CTFRoleBadge role={role} />);
      
      const badge = screen.getByLabelText(`CTF Role: ${role}`);
      expect(badge).toHaveAttribute('aria-label', `CTF Role: ${role}`);
      expect(badge).toHaveAttribute('title', role);
    });
  });

  describe('styling consistency', () => {
    test('all badges have consistent base styling', () => {
      const roles = [
        '🏆 CTF Challenge Architect',
        '💼 North Star Agi – Business Operations', 
        '🎯 CTF Participant'
      ];

      roles.forEach(role => {
        const { unmount } = render(<CTFRoleBadge role={role} />);
        const badge = screen.getByLabelText(`CTF Role: ${role}`);
        
        // Base styling classes
        expect(badge).toHaveClass(
          'inline-flex',
          'items-center', 
          'px-4',
          'py-2',
          'rounded-lg',
          'font-bold',
          'text-sm'
        );
        
        unmount();
      });
    });

    test('responsive text sizing works correctly', () => {
      render(<CTFRoleBadge role="🏆 CTF Challenge Architect" />);
      
      const badge = screen.getByLabelText('CTF Role: 🏆 CTF Challenge Architect');
      expect(badge).toHaveClass('text-sm', 'md:text-base');
    });
  });
});
