import express from 'express';
import { getTeamMembers, getTeamMemberById, createTeamMember, updateTeamMember, deleteTeamMember } from '../data/teamData.js';

const router = express.Router();

// GET all team members with optional filtering and sorting
router.get('/', (req, res) => {
  try {
    let members = getTeamMembers();
    const { search, role, status, sortBy, sortOrder } = req.query;
    
    // Search by name or email
    if (search) {
      const searchLower = search.toLowerCase();
      members = members.filter(m => 
        m.name.toLowerCase().includes(searchLower) ||
        m.email.toLowerCase().includes(searchLower) ||
        m.role.toLowerCase().includes(searchLower)
      );
    }
    
    // Filter by role
    if (role) {
      members = members.filter(m => m.role === role);
    }
    
    // Filter by status
    if (status) {
      members = members.filter(m => m.status === status);
    }
    
    // Sorting
    if (sortBy) {
      const order = sortOrder === 'desc' ? -1 : 1;
      members.sort((a, b) => {
        let aVal = a[sortBy];
        let bVal = b[sortBy];
        
        if (typeof aVal === 'string') {
          return aVal.localeCompare(bVal) * order;
        }
        return (aVal - bVal) * order;
      });
    }
    
    res.json(members);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET team member by ID
router.get('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const member = getTeamMemberById(id);
    
    if (!member) {
      return res.status(404).json({ error: 'Team member not found' });
    }
    
    res.json(member);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// CREATE new team member
router.post('/', (req, res) => {
  try {
    const { name, role, email, initials, projects, status, avatar } = req.body;
    
    // Validation
    if (!name || !role || !email) {
      return res.status(400).json({ error: 'Missing required fields: name, role, email' });
    }
    
    // Generate initials if not provided
    const generatedInitials = initials || name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
    
    const newMember = createTeamMember({
      name,
      role,
      email,
      initials: generatedInitials,
      projects: projects || 0,
      status: status || 'Active',
      avatar: avatar || 'bg-primary'
    });
    
    res.status(201).json(newMember);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// UPDATE team member
router.put('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const updates = req.body;
    
    const updatedMember = updateTeamMember(id, updates);
    
    if (!updatedMember) {
      return res.status(404).json({ error: 'Team member not found' });
    }
    
    res.json(updatedMember);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE team member
router.delete('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const deleted = deleteTeamMember(id);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Team member not found' });
    }
    
    res.json({ message: 'Team member deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

